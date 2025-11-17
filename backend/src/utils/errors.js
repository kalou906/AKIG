/**
 * Gestion centralisée des erreurs
 * backend/src/utils/errors.js
 */

/**
 * Classe de base pour les erreurs applicatives
 */
class AppError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Erreurs de validation
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Erreurs d'authentification
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentification requise') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erreurs d'autorisation
 */
class AuthorizationError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, 'AUTHZ_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Erreurs de ressource non trouvée
 */
class NotFoundError extends AppError {
  constructor(resource = 'Ressource') {
    super(`${resource} non trouvé(e)`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Erreurs de conflit
 */
class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Erreurs de base de données
 */
class DatabaseError extends AppError {
  constructor(message = 'Erreur de base de données', details = null) {
    super(message, 'DB_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Erreurs de serveur interne
 */
class InternalServerError extends AppError {
  constructor(message = 'Erreur serveur interne', details = null) {
    super(message, 'INTERNAL_ERROR', 500, details);
    this.name = 'InternalServerError';
  }
}

/**
 * Erreurs de limite atteinte
 */
class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super(
      `Trop de requêtes. Réessayez dans ${retryAfter} secondes`,
      'RATE_LIMIT',
      429
    );
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }

  toJSON() {
    const data = super.toJSON();
    data.error.retryAfter = this.retryAfter;
    return data;
  }
}

/**
 * Middleware pour convertir les erreurs en réponse JSON
 */
function errorHandler(err, req, res, next) {
  // Log l'erreur
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      code: err.code || 'UNKNOWN',
      url: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Si c'est une erreur applicative
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Erreurs express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Erreur de validation',
        statusCode: 400,
        details: errors.map((e) => ({
          field: e.param,
          message: e.msg,
          value: e.value,
        })),
      },
    });
  }

  // Erreurs de base de données (PostgreSQL)
  if (err.code && err.code.startsWith('P')) {
    const statusCode = err.code === 'P0001' ? 400 : 500;
    const message =
      err.code === 'P0001'
        ? err.message
        : 'Erreur lors du traitement de la requête';

    return res.status(statusCode).json({
      success: false,
      error: {
        code: 'DB_ERROR',
        message,
        statusCode,
        details: process.env.NODE_ENV === 'development' ? err.message : null,
      },
    });
  }

  // Erreur générique non gérée
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erreur serveur interne',
      statusCode: 500,
      details:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Une erreur est survenue',
    },
  });
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  InternalServerError,
  RateLimitError,
  errorHandler,
};
