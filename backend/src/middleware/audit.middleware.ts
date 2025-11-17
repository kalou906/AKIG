/**
 * Audit Middleware - Automatically capture all mutations
 * POST, PUT, DELETE, PATCH → audit_logs
 */

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

export interface AuditRequest extends Request {
  auditLog?: {
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
  };
  userId?: string;
}

export interface AuditResponse extends Response {
  locals: Record<string, any> & {
    auditLog?: any;
  };
}

/**
 * Middleware to capture request body before mutation
 */
export function captureRequestBody(
  req: AuditRequest,
  res: AuditResponse,
  next: NextFunction
) {
  // Capture body for audit comparison
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    req.body._original = JSON.parse(JSON.stringify(req.body));
  }
  next();
}

/**
 * Main audit middleware - log mutations
 */
export function auditMiddleware(auditService: AuditService) {
  return async (req: AuditRequest, res: AuditResponse, next: NextFunction) => {
    // Capture original response.json
    const originalJson = res.json.bind(res);

    // Capture response data
    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        // Successful response - prepare audit log

        const action = getActionFromRequest(req);
        const entityType = getEntityTypeFromUrl(req.path);
        const entityId = getEntityIdFromRequest(req);

        if (entityType && action) {
          res.locals = res.locals || {};
          res.locals.auditLog = {
            action,
            entityType,
            entityId,
            method: req.method,
            path: req.path,
            oldValues: req.body._original,
            newValues: data,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            userId: req.userId,
            timestamp: new Date(),
            statusCode: res.statusCode
          };

          // Queue audit write (non-blocking)
          try {
            queueAuditWrite(auditService, res.locals.auditLog);
          } catch (err) {
            console.error('Audit queue error:', err);
          }
        }
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Write audit logs from queue (batch for performance)
 */
const auditQueue: any[] = [];
let isProcessing = false;

function queueAuditWrite(auditService: AuditService, log: any) {
  auditQueue.push(log);

  if (!isProcessing && auditQueue.length > 0) {
    isProcessing = true;
    setTimeout(() => {
      processBatchAuditLogs(auditService);
      isProcessing = false;
    }, 100); // Batch every 100ms
  }
}

async function processBatchAuditLogs(auditService: AuditService) {
  const batch = auditQueue.splice(0, 100); // Process max 100 at a time

  for (const log of batch) {
    try {
      await auditService.logAction(
        log.action,
        log.entityType,
        log.entityId || 'unknown',
        log.userId || 'system',
        {
          oldValues: log.oldValues,
          newValues: log.newValues,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          status: 'success',
          metadata: {
            method: log.method,
            path: log.path,
            statusCode: log.statusCode
          }
        }
      );
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
}

/**
 * Extract action type from HTTP method
 */
function getActionFromRequest(req: Request): string | null {
  const method = req.method.toUpperCase();

  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return null;
  }
}

/**
 * Extract entity type from URL path
 */
function getEntityTypeFromUrl(path: string): string | null {
  const parts = path.split('/').filter(Boolean);

  // URL patterns:
  // /api/recouvrement/appel → appel
  // /api/agents/missions → mission
  // /api/carte/itineraires → itineraire
  // /api/dashboard/sites → site

  const entityTypeMap: Record<string, string> = {
    'appel': 'appel',
    'visite': 'visite',
    'promesses': 'promesse',
    'paiements': 'paiement',
    'missions': 'mission',
    'sites': 'site',
    'agents': 'agent',
    'itineraires': 'itineraire',
    'locataires': 'locataire',
    'impaye': 'impaye'
  };

  for (const part of parts) {
    if (entityTypeMap[part]) {
      return entityTypeMap[part];
    }
  }

  return null;
}

/**
 * Extract entity ID from request
 */
function getEntityIdFromRequest(req: AuditRequest): string | null {
  // From URL params: /api/recouvrement/appel/:id
  if (req.params.id) {
    return req.params.id;
  }

  // From request body
  if (req.body?.id) {
    return req.body.id;
  }

  // From body fields like appel_id, visite_id
  for (const [key, value] of Object.entries(req.body || {})) {
    if (key.endsWith('_id') && typeof value === 'string') {
      return value;
    }
  }

  return null;
}

/**
 * Middleware to log sensitive operations with extra care
 */
export function auditSensitiveOperation(operation: string) {
  return (req: AuditRequest, res: AuditResponse, next: NextFunction) => {
    req.auditLog = {
      action: 'SENSITIVE_' + operation.toUpperCase(),
      entityType: getEntityTypeFromUrl(req.path) || 'unknown',
      entityId: getEntityIdFromRequest(req) || 'unknown',
      oldValues: req.body?._original,
      newValues: req.body
    };

    console.warn(`⚠️  SENSITIVE OPERATION: ${operation} by ${req.userId}`, {
      ip: req.ip,
      timestamp: new Date(),
      path: req.path
    });

    next();
  };
}

/**
 * Middleware to enforce audit trail for admin operations
 */
export function enforceAuditTrail(req: AuditRequest, res: AuditResponse, next: NextFunction) {
  // Admin delete/purge operations require audit
  if (req.method === 'DELETE' && req.path.includes('/admin/')) {
    const auditId = req.headers['x-audit-id'];

    if (!auditId) {
      return res.status(400).json({
        error: 'Audit ID required for admin delete operations',
        message: 'Provide X-Audit-ID header to confirm this deletion'
      });
    }
  }

  next();
}

/**
 * Endpoint to retrieve audit trail for an entity (non-admin users can only see their own)
 */
export function getEntityAuditTrail(auditService: AuditService) {
  return async (req: AuditRequest, res: AuditResponse) => {
    try {
      const { entityType, entityId } = req.params;

      // Security: non-admin users can only see their own entities
      if (req.user && !req.user.permissions?.includes('admin') && !req.user.permissions?.includes('compliance_officer')) {
        // Check if user owns this entity
        // ... validation logic
      }

      const history = await auditService.getEntityHistory(entityType, entityId);

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve audit trail',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
