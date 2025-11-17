/**
 * Audit Middleware
 * Automatic request/response logging for audit trail
 * Integrates with auditService to track all operations
 */

const auditService = require('../services/auditService');
const { v4: uuidv4 } = require('uuid');

/**
 * Extract client IP address from request
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '0.0.0.0'
  );
}

/**
 * Audit middleware: Log all requests
 * Automatically attaches request ID and logs access
 */
function auditLogMiddleware(req, res, next) {
  // Generate unique request ID if not present
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;

  // Attach request info
  req.auditInfo = {
    requestId,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
    startTime: Date.now()
  };

  // Store original send function
  const originalSend = res.send;
  const originalJson = res.json;

  // Override send function
  res.send = function (data) {
    req.auditInfo.responseStatus = res.statusCode;
    req.auditInfo.responseSize = Buffer.byteLength(data);
    req.auditInfo.responseTime = Date.now() - req.auditInfo.startTime;

    // Log request after response is sent
    setImmediate(() => {
      logRequestAudit(req, res);
    });

    return originalSend.call(this, data);
  };

  // Override json function
  res.json = function (data) {
    req.auditInfo.responseStatus = res.statusCode;
    req.auditInfo.responseSize = Buffer.byteLength(JSON.stringify(data));
    req.auditInfo.responseTime = Date.now() - req.auditInfo.startTime;

    // Log request after response is sent
    setImmediate(() => {
      logRequestAudit(req, res);
    });

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Log request to audit trail
 */
async function logRequestAudit(req, res) {
  if (!req.user) return; // Skip if no authenticated user

  try {
    const { requestId, ipAddress, userAgent, path, method, responseStatus, responseTime } = req.auditInfo;

    // Determine action from HTTP method and path
    let action = 'read';
    if (method === 'POST') action = 'create';
    if (method === 'PUT' || method === 'PATCH') action = 'update';
    if (method === 'DELETE') action = 'delete';

    // Extract entity type and ID from path
    const pathParts = path.split('/');
    let entityType = 'api';
    let entityId = null;

    if (pathParts.length >= 3) {
      entityType = pathParts[2]; // /api/{entityType}/...
      if (pathParts.length >= 4) {
        entityId = parseInt(pathParts[3], 10) || null;
      }
    }

    // Log to audit table
    await auditService.logAccess({
      userId: req.user.id,
      action,
      entityType,
      entityId,
      description: `${method} ${path}`,
      ipAddress,
      userAgent,
      requestId,
      status: responseStatus >= 400 ? 'failed' : 'success',
      errorMessage: responseStatus >= 400 ? `HTTP ${responseStatus}` : null
    });

    // Log to request ID header for tracking
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${responseTime}ms`);
  } catch (error) {
    console.error('Error logging audit:', error);
    // Don't throw - don't disrupt normal request handling
  }
}

/**
 * Log sensitive operation
 * Used for high-risk operations like payments, user deletions, etc.
 */
function auditSensitiveOperation(operationType, riskLevel = 'high', requiresApproval = false) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { requestId, ipAddress, userAgent } = req.auditInfo;

      // Log the sensitive operation
      req.operationAuditId = await auditService.logSensitiveOperation({
        userId: req.user.id,
        operationType,
        operationCode: `${operationType.toUpperCase()}_${Date.now()}`,
        description: `${operationType} on ${req.path}`,
        riskLevel,
        requiresApproval,
        ipAddress,
        userAgent,
        requestId
      });

      // If approval required and not approved, return 202 Accepted
      if (requiresApproval) {
        return res.status(202).json({
          message: 'Operation pending approval',
          operationId: req.operationAuditId,
          status: 'pending'
        });
      }

      next();
    } catch (error) {
      console.error('Error in sensitive operation middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Log data export
 * Track all data downloads/exports for compliance
 */
function auditDataExport(exportType) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Store export details in request for later logging
      req.exportAudit = {
        exportType,
        requestId: req.requestId,
        ipAddress: req.auditInfo.ipAddress,
        userAgent: req.auditInfo.userAgent
      };

      // Override json to capture export data
      const originalJson = res.json;
      res.json = function (data) {
        // Calculate file details
        const fileData = JSON.stringify(data);
        const crypto = require('crypto');
        const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');

        // Log export
        auditService.logDataExport({
          userId: req.user.id,
          exportType,
          exportedRecordsCount: Array.isArray(data) ? data.length : 1,
          exportedFields: Object.keys(data[0] || data),
          fileName: `export_${Date.now()}.json`,
          fileHash,
          fileSizeBytes: Buffer.byteLength(fileData),
          encryptionMethod: 'none',
          deliveryMethod: 'direct_download',
          reasonCode: 'api_export',
          ipAddress: req.auditInfo.ipAddress,
          userAgent: req.auditInfo.userAgent,
          requestId: req.requestId
        }).catch(err => console.error('Error logging export:', err));

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Error in export audit middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Log login attempt
 * Called after authentication attempt (success or failure)
 */
async function auditLoginAttempt(email, userId, success, failureReason = null, req) {
  try {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    // Simple risk scoring
    let riskScore = 0;
    let suspicious = false;

    if (!success) {
      riskScore += 10;
    }

    // Check for multiple failures from same IP (done elsewhere, here just assess)
    if (failureReason === 'invalid_credentials') {
      riskScore += 5;
    }

    if (riskScore > 15) {
      suspicious = true;
    }

    await auditService.logLoginAttempt({
      userEmail: email,
      userId,
      authMethod: 'password',
      mfaRequired: false,
      mfaVerified: false,
      success,
      failureReason,
      ipAddress,
      userAgent,
      riskScore,
      suspicious
    });
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}

/**
 * Log permission change
 * Called when user roles or permissions are modified
 */
async function auditPermissionChange(req, changedUserId, changeType, newRoles, reason) {
  try {
    if (!req.user) return;

    await auditService.logPermissionChange({
      changedBy: req.user.id,
      userId: changedUserId,
      changeType,
      newRoles,
      changeReason: reason,
      ipAddress: req.auditInfo?.ipAddress || getClientIp(req),
      requestId: req.requestId
    });
  } catch (error) {
    console.error('Error logging permission change:', error);
  }
}

/**
 * Middleware to require audit trail review
 * Some sensitive operations may require admin review of recent audit entries
 */
function requireAuditReview(entityType) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get recent audit entries for this entity
      const auditTrail = await auditService.getAuditTrail(entityType, null, 10);

      // Check if there are suspicious patterns
      const recentFailures = auditTrail.filter(a => a.status === 'failed').length;

      if (recentFailures > 3) {
        return res.status(403).json({
          error: 'Too many recent failures',
          message: 'Please contact support before retrying'
        });
      }

      next();
    } catch (error) {
      console.error('Error in audit review middleware:', error);
      next(); // Don't block if audit check fails
    }
  };
}

/**
 * Middleware to log all parameter changes (POST/PUT/DELETE)
 */
function auditParameterChanges(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.auditParams = {
      before: req.body ? JSON.parse(JSON.stringify(req.body)) : {},
      timestamp: Date.now()
    };
  }

  if (req.method === 'DELETE') {
    // Log deletion with parameters
    if (!req.auditInfo) {
      req.auditInfo = {};
    }
    req.auditInfo.isDelete = true;
  }

  next();
}

module.exports = {
  auditLogMiddleware,
  auditSensitiveOperation,
  auditDataExport,
  auditLoginAttempt,
  auditPermissionChange,
  requireAuditReview,
  auditParameterChanges,
  getClientIp
};
