// ============================================================================
// Authorization Middleware (authz.ts)
// File: backend/src/middlewares/authz.ts
// Purpose: Permission checking, authentication, and audit logging
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

/**
 * Extended Request type with user and permissions
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        permissions?: string[];
      };
    }
  }
}

/**
 * Middleware: Require user to be authenticated
 * @example app.get('/api/profile', requireAuth, handler)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Authentication required'
    });
    return;
  }
  next();
}

/**
 * Middleware: Require user to have ALL specified permissions
 * @param perms - Permission codes to check
 * @example app.post('/api/payments/import', requirePerm('payments.import'), handler)
 * @example app.delete('/api/contracts/:id', requirePerm('contracts.view', 'contracts.delete'), handler)
 */
export function requirePerm(...perms: string[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Authentication required'
      });
      return;
    }

    const userPerms: string[] = req.user?.permissions || [];
    const missing = perms.filter(p => !userPerms.includes(p));

    if (missing.length > 0) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        required: perms,
        missing: missing
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Require user to have ANY of the specified permissions
 * @param perms - Permission codes to check (at least one required)
 * @example app.post('/api/export', requireAnyPerm('contracts.export', 'payments.export'), handler)
 */
export function requireAnyPerm(...perms: string[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Authentication required'
      });
      return;
    }

    const userPerms: string[] = req.user?.permissions || [];
    const hasAny = perms.some(p => userPerms.includes(p));

    if (!hasAny) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'At least one permission required',
        required: perms
      });
      return;
    }

    next();
  };
}

/**
 * Audit logging utility
 * Logs actions to the audit_log table for compliance and debugging
 * @param req - Express request object
 * @param action - Action name (e.g., 'PAYMENT_IMPORT', 'CONTRACT_GENERATE')
 * @param target - Target resource (e.g., 'file:payments.csv', 'contract:123')
 * @param meta - Additional metadata (optional)
 * @example await audit(req, 'PAYMENT_IMPORT', 'file:payments.csv', { count: 150 })
 */
export async function audit(
  req: any,
  action: string,
  target: string,
  meta: Record<string, any> = {}
): Promise<void> {
  try {
    const pool: Pool = req.app.get('pool');

    if (!pool) {
      console.warn('Pool not available in app, audit log skipped');
      return;
    }

    await pool.query(
      `INSERT INTO audit_log(user_id, action, target, meta, created_at)
       VALUES($1, $2, $3, $4, NOW())`,
      [
        req.user?.id || null,
        action,
        target,
        JSON.stringify(meta)
      ]
    );
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw - audit failures shouldn't break the main operation
  }
}

/**
 * Helper: Check if user has permission (synchronous)
 * @param req - Express request object
 * @param permission - Permission code to check
 * @returns true if user has permission
 */
export function hasPermission(req: any, permission: string): boolean {
  return req.user?.permissions?.includes(permission) ?? false;
}

/**
 * Helper: Check if user has any permission (synchronous)
 * @param req - Express request object
 * @param permissions - Permission codes to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(req: any, permissions: string[]): boolean {
  return permissions.some(p => req.user?.permissions?.includes(p)) ?? false;
}

/**
 * Helper: Get user permissions
 * @param req - Express request object
 * @returns array of permission codes
 */
export function getUserPermissions(req: any): string[] {
  return req.user?.permissions ?? [];
}

export default {
  requireAuth,
  requirePerm,
  requireAnyPerm,
  audit,
  hasPermission,
  hasAnyPermission,
  getUserPermissions
};
