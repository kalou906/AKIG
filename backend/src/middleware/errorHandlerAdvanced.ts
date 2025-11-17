/**
 * Advanced Error Handler Middleware
 * 
 * Gère les erreurs complexes:
 * - Erreurs de base de données (contraintes, timeouts, deadlocks)
 * - Erreurs de validation (schema mismatch, type errors)
 * - Erreurs de concurrence (race conditions, lock timeouts)
 * - Erreurs de ressources (mémoire, fichier descripteurs)
 * - Erreurs externes (timeout API, 3rd party failures)
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';
import { AuditService } from '../services/audit.service';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
  retryable?: boolean;
  retryAfter?: number;
}

class ErrorHandler {
  /**
   * Détecte les erreurs de base de données critiques
   */
  private detectDatabaseError(error: any): { code: string; retryable: boolean; statusCode: number } | null {
    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';

    // Timeout - retryable
    if (message.includes('timeout') || code === 'ETIMEDOUT') {
      return { code: 'DB_TIMEOUT', retryable: true, statusCode: 503 };
    }

    // Connection refused - retryable
    if (message.includes('econnrefused') || code === 'ECONNREFUSED') {
      return { code: 'DB_CONNECTION_REFUSED', retryable: true, statusCode: 503 };
    }

    // Deadlock - retryable
    if (message.includes('deadlock') || code === '40P01') {
      return { code: 'DB_DEADLOCK', retryable: true, statusCode: 409 };
    }

    // Connection pool exhausted - retryable
    if (message.includes('sorry, too many clients') || message.includes('no more connections')) {
      return { code: 'DB_POOL_EXHAUSTED', retryable: true, statusCode: 503 };
    }

    // Foreign key constraint - NOT retryable
    if (code === '23503') {
      return { code: 'DB_FOREIGN_KEY_VIOLATION', retryable: false, statusCode: 400 };
    }

    // Unique constraint - NOT retryable
    if (code === '23505') {
      return { code: 'DB_UNIQUE_VIOLATION', retryable: false, statusCode: 409 };
    }

    // Check constraint - NOT retryable
    if (code === '23514') {
      return { code: 'DB_CHECK_VIOLATION', retryable: false, statusCode: 400 };
    }

    // Serialization failure - retryable
    if (code === '40001') {
      return { code: 'DB_SERIALIZATION_FAILURE', retryable: true, statusCode: 409 };
    }

    // Transaction abort - retryable
    if (code === '25P02') {
      return { code: 'DB_TRANSACTION_ABORTED', retryable: true, statusCode: 500 };
    }

    return null;
  }

  /**
   * Détecte les erreurs de validation
   */
  private detectValidationError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('validation') ||
      message.includes('schema') ||
      message.includes('invalid') ||
      message.includes('type error') ||
      error.name === 'ValidationError' ||
      error.name === 'SchemaError'
    );
  }

  /**
   * Détecte les erreurs de concurrence
   */
  private detectConcurrencyError(error: any): { code: string; retryable: boolean } | null {
    const message = error.message?.toLowerCase() || '';

    // Race condition
    if (message.includes('race') || message.includes('concurrent')) {
      return { code: 'CONCURRENCY_ERROR', retryable: true };
    }

    // Optimistic lock failure
    if (message.includes('optimistic lock') || message.includes('version mismatch')) {
      return { code: 'OPTIMISTIC_LOCK_FAILURE', retryable: true };
    }

    // Stale data
    if (message.includes('stale') || message.includes('outdated')) {
      return { code: 'STALE_DATA', retryable: true };
    }

    return null;
  }

  /**
   * Détecte les erreurs de ressources
   */
  private detectResourceError(error: any): { code: string; statusCode: number } | null {
    const message = error.message?.toLowerCase() || '';

    // Out of memory
    if (message.includes('out of memory') || message.includes('enomem')) {
      return { code: 'OUT_OF_MEMORY', statusCode: 503 };
    }

    // Too many open files
    if (message.includes('too many open files') || message.includes('emfile')) {
      return { code: 'TOO_MANY_FILES', statusCode: 503 };
    }

    // Disk space
    if (message.includes('no space left') || message.includes('enospc')) {
      return { code: 'DISK_SPACE_EXHAUSTED', statusCode: 507 };
    }

    // CPU throttling
    if (message.includes('cpu') || message.includes('throttl')) {
      return { code: 'RESOURCE_THROTTLED', statusCode: 429 };
    }

    return null;
  }

  /**
   * Détecte les erreurs externes (3rd party APIs)
   */
  private detectExternalError(error: any): { code: string; retryable: boolean; statusCode: number } | null {
    const message = error.message?.toLowerCase() || '';

    // API timeout
    if (message.includes('api') && message.includes('timeout')) {
      return { code: 'EXTERNAL_API_TIMEOUT', retryable: true, statusCode: 504 };
    }

    // 3rd party service unavailable
    if (message.includes('service unavailable') || message.includes('503')) {
      return { code: 'EXTERNAL_SERVICE_UNAVAILABLE', retryable: true, statusCode: 503 };
    }

    // Rate limit from 3rd party
    if (message.includes('rate limit') || message.includes('429')) {
      return { code: 'EXTERNAL_RATE_LIMIT', retryable: true, statusCode: 429 };
    }

    // Authentication with 3rd party
    if (message.includes('unauthorized') || message.includes('401')) {
      return { code: 'EXTERNAL_AUTH_ERROR', retryable: false, statusCode: 401 };
    }

    return null;
  }

  /**
   * Formatte le message d'erreur pour ne pas leaker d'informations sensibles
   */
  private sanitizeErrorMessage(code: string, env: string): string {
    const messages: Record<string, string> = {
      DB_TIMEOUT: 'The request took too long to process',
      DB_CONNECTION_REFUSED: 'Database connection failed',
      DB_DEADLOCK: 'Resource conflict - please retry',
      DB_POOL_EXHAUSTED: 'System overloaded - please retry',
      DB_FOREIGN_KEY_VIOLATION: 'Invalid reference data',
      DB_UNIQUE_VIOLATION: 'Duplicate entry detected',
      DB_CHECK_VIOLATION: 'Data validation failed',
      DB_SERIALIZATION_FAILURE: 'Concurrent modification conflict',
      DB_TRANSACTION_ABORTED: 'Transaction failed - please retry',
      CONCURRENCY_ERROR: 'Concurrent modification detected',
      OPTIMISTIC_LOCK_FAILURE: 'Data has been modified - please retry',
      STALE_DATA: 'Data is outdated - please refresh',
      OUT_OF_MEMORY: 'System memory exhausted',
      TOO_MANY_FILES: 'System resource limit reached',
      DISK_SPACE_EXHAUSTED: 'Insufficient storage',
      RESOURCE_THROTTLED: 'System under load',
      EXTERNAL_API_TIMEOUT: 'External service timeout',
      EXTERNAL_SERVICE_UNAVAILABLE: 'External service unavailable',
      EXTERNAL_RATE_LIMIT: 'Rate limited - please retry later',
      EXTERNAL_AUTH_ERROR: 'External service authentication failed',
    };

    return messages[code] || 'An unexpected error occurred';
  }

  /**
   * Décide la stratégie de retry
   */
  private getRetryStrategy(code: string): { retryable: boolean; maxRetries: number; initialDelay: number } {
    const strategies: Record<string, any> = {
      DB_TIMEOUT: { retryable: true, maxRetries: 3, initialDelay: 1000 },
      DB_CONNECTION_REFUSED: { retryable: true, maxRetries: 5, initialDelay: 2000 },
      DB_DEADLOCK: { retryable: true, maxRetries: 3, initialDelay: 500 },
      DB_POOL_EXHAUSTED: { retryable: true, maxRetries: 4, initialDelay: 2000 },
      DB_SERIALIZATION_FAILURE: { retryable: true, maxRetries: 3, initialDelay: 1000 },
      DB_TRANSACTION_ABORTED: { retryable: true, maxRetries: 3, initialDelay: 1000 },
      CONCURRENCY_ERROR: { retryable: true, maxRetries: 3, initialDelay: 500 },
      OPTIMISTIC_LOCK_FAILURE: { retryable: true, maxRetries: 3, initialDelay: 500 },
      EXTERNAL_API_TIMEOUT: { retryable: true, maxRetries: 2, initialDelay: 3000 },
      EXTERNAL_SERVICE_UNAVAILABLE: { retryable: true, maxRetries: 3, initialDelay: 5000 },
      EXTERNAL_RATE_LIMIT: { retryable: true, maxRetries: 1, initialDelay: 10000 },
    };

    return strategies[code] || { retryable: false, maxRetries: 0, initialDelay: 0 };
  }

  /**
   * Middleware principal de gestion des erreurs
   */
  handle = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const env = process.env.NODE_ENV || 'development';
    const requestId = (req as any).id || 'unknown';

    // Initialiser les propriétés d'erreur
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_SERVER_ERROR';
    let retryable = err.retryable ?? false;
    let retryAfter = err.retryAfter || 0;

    // Détecter les types d'erreurs spécifiques
    const dbError = this.detectDatabaseError(err);
    if (dbError) {
      code = dbError.code;
      statusCode = dbError.statusCode;
      retryable = dbError.retryable;
    }

    if (!dbError && this.detectValidationError(err)) {
      code = 'VALIDATION_ERROR';
      statusCode = 400;
      retryable = false;
    }

    const concurrencyError = this.detectConcurrencyError(err);
    if (concurrencyError) {
      code = concurrencyError.code;
      statusCode = 409;
      retryable = concurrencyError.retryable;
    }

    const resourceError = this.detectResourceError(err);
    if (resourceError) {
      code = resourceError.code;
      statusCode = resourceError.statusCode;
      retryable = true;
    }

    const externalError = this.detectExternalError(err);
    if (externalError) {
      code = externalError.code;
      statusCode = externalError.statusCode;
      retryable = externalError.retryable;
      retryAfter = externalError.retryAfter || 30;
    }

    const retryStrategy = this.getRetryStrategy(code);

    // Logging exhaustif
    logger.error({
      action: 'error_handled',
      requestId,
      code,
      statusCode,
      message: err.message,
      stack: env === 'development' ? err.stack : undefined,
      retryable,
      retryStrategy: retryStrategy.retryable ? retryStrategy : undefined,
      url: req.url,
      method: req.method,
      userId: (req as any).user?.id,
    });

    // Audit pour erreurs sensibles
    if (statusCode >= 500 || code.includes('SECURITY') || code.includes('AUTH')) {
      try {
        AuditService.log({
          action: 'error_critical',
          entityType: 'system',
          entityId: 'error_handler',
          status: 'error',
          details: { code, statusCode },
          userId: (req as any).user?.id,
          errorMessage: err.message,
        });
      } catch (auditError) {
        logger.error({ action: 'audit_log_failed', error: auditError });
      }
    }

    // Réponse d'erreur structurée
    const response: any = {
      error: {
        code,
        message: this.sanitizeErrorMessage(code, env),
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    // Ajouter retry info si applicable
    if (retryable) {
      response.error.retryable = true;
      response.error.retryAfter = retryAfter || retryStrategy.initialDelay;
      response.error.maxRetries = retryStrategy.maxRetries;
    }

    // Ajouter détails en développement
    if (env === 'development') {
      response.error.details = err.details || {};
      response.error.fullMessage = err.message;
      response.error.stack = err.stack?.split('\n').slice(0, 5);
    }

    // Ajouter retry-after header si nécessaire
    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }

    res.status(statusCode).json(response);
  };
}

export const errorHandlerAdvanced = new ErrorHandler();

/**
 * Wrapper pour convertir les erreurs synchrones en erreurs traitées
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware pour créer des AppError customisées
 */
export function createAppError(
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_SERVER_ERROR',
  details?: Record<string, any>,
  retryable: boolean = false
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.retryable = retryable;
  return error;
}
