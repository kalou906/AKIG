/**
 * Audit Logging Middleware
 * Tracks all mutations (POST, PUT, DELETE, PATCH) for compliance
 * Logs user, endpoint, action, data changes, timestamp
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');

// ============================================
// 📝 Audit Logger Configuration
// ============================================
const auditLogDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(auditLogDir)) {
  fs.mkdirSync(auditLogDir, { recursive: true });
}

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'audit' },
  transports: [
    new winston.transports.File({
      filename: path.join(auditLogDir, 'audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 14 // Keep 2 weeks of logs
    }),
    new winston.transports.File({
      filename: path.join(auditLogDir, 'audit-errors.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 14
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  auditLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// ============================================
// 🔍 Audit Middleware
// ============================================
module.exports = (req, res, next) => {
  // Skip non-mutation requests
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip public endpoints
  const publicPaths = ['/api/auth/register', '/api/auth/login'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;

  let responseBody = '';
  let responseStatus = res.statusCode;

  // Capture response
  res.json = function (data) {
    responseBody = typeof data === 'string' ? data : JSON.stringify(data);
    responseStatus = res.statusCode;
    return originalJson.call(this, data);
  };

  res.send = function (data) {
    responseBody = data;
    responseStatus = res.statusCode;
    return originalSend.call(this, data);
  };

  // Log mutation
  res.on('finish', () => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      requestId: req.id || req.requestId || 'unknown',
      userId: req.user?.id || 'anonymous',
      userEmail: req.user?.email || 'unknown',
      method: req.method,
      endpoint: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : null,
      requestBody: sanitizeData(req.body),
      responseStatus: responseStatus,
      responseBody: responseStatus >= 400 ? responseBody : null, // Only log errors
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      duration: res.get('X-Response-Time') || 'unknown'
    };

    // Determine log level based on response status
    if (responseStatus >= 500) {
      auditLogger.error('Server error mutation', auditEntry);
    } else if (responseStatus >= 400) {
      auditLogger.warn('Client error mutation', auditEntry);
    } else if (responseStatus >= 200 && responseStatus < 300) {
      auditLogger.info('Successful mutation', auditEntry);
    } else {
      auditLogger.debug('Other mutation', auditEntry);
    }

    // Additional security logging for sensitive operations
    if (isSensitiveOperation(req.path, req.method)) {
      auditLogger.info('⚠️  SENSITIVE OPERATION', {
        ...auditEntry,
        severity: 'HIGH'
      });
    }
  });

  next();
};

// ============================================
// 🔒 Sanitize Data
// Remove sensitive information before logging
// ============================================
function sanitizeData(data) {
  if (!data) return null;

  const sensitiveFields = [
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'jwt',
    'apiKey',
    'api_key',
    'secret',
    'creditCard',
    'ssn',
    'bankAccount'
  ];

  const sanitized = JSON.parse(JSON.stringify(data));

  const sanitizeRecursive = (obj) => {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeRecursive(obj[key]);
      }
    }
  };

  sanitizeRecursive(sanitized);
  return sanitized;
}

// ============================================
// ⚠️  Sensitive Operations
// ============================================
function isSensitiveOperation(path, method) {
  const sensitivePatterns = [
    /\/api\/users\/\d+\/permissions/,
    /\/api\/roles\/\d+\/delete/,
    /\/api\/payments.*DELETE/,
    /\/api\/contracts.*DELETE/,
    /\/api\/auth.*DELETE/
  ];

  return sensitivePatterns.some(pattern => pattern.test(path));
}
