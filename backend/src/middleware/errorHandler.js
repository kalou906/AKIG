/**
 * Global Error Handler Middleware
 * Gère toutes les erreurs de manière cohérente
 * Empêche les stack traces en production
 * Logs toutes les erreurs critiques
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ============================================
// 📝 Error Logger
// ============================================
const errorLogDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(errorLogDir)) {
  fs.mkdirSync(errorLogDir, { recursive: true });
}

const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(errorLogDir, 'errors.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 14
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  errorLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// ============================================
// ⚠️ ERROR TYPES
// ============================================

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.statusCode = 400;
    this.type = 'VALIDATION_ERROR';
    this.details = details;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.statusCode = 401;
    this.type = 'AUTHENTICATION_ERROR';
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.statusCode = 403;
    this.type = 'AUTHORIZATION_ERROR';
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.statusCode = 404;
    this.type = 'NOT_FOUND_ERROR';
    this.resource = resource;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
    this.type = 'CONFLICT_ERROR';
  }
}

class InternalServerError extends Error {
  constructor(message = 'Internal server error') {
    super(message);
    this.statusCode = 500;
    this.type = 'INTERNAL_ERROR';
  }
}

// ============================================
// 🛡️ ERROR HANDLER MIDDLEWARE
// ============================================

/**
 * Global error handler
 * Place this LAST dans app.use()
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.id || req.requestId || 'unknown';
  const timestamp = new Date().toISOString();
  
  // Default error properties
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let type = err.type || 'UNKNOWN_ERROR';

  // Log error
  const errorLog = {
    timestamp,
    requestId,
    userId: req.user?.id || 'anonymous',
    method: req.method,
    path: req.path,
    statusCode,
    type,
    message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };

  errorLogger.error('API Error', errorLog);

  // Build response (don't expose stack traces in production)
  const response = {
    error: message,
    type,
    requestId,
    timestamp
  };

  // Add details for specific error types
  if (err.type === 'VALIDATION_ERROR' && err.details) {
    response.details = err.details;
  }

  // Add stack trace only in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Handle specific status codes
  if (statusCode >= 500) {
    response.message = process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please contact support.'
      : message;
  }

  // Send response
  res.status(statusCode).json(response);
};

// ============================================
// 🚨 ASYNC ERROR WRAPPER
// ============================================

/**
 * Wrapper pour les route handlers async
 * Prévient les unhandled promise rejections
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// 📋 NOT FOUND HANDLER
// ============================================

/**
 * 404 handler - doit être DERNIER before error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Endpoint ${req.path}`);
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  errorLogger
};
