/**
 * Middleware HTTP Logger avec Winston
 * Logs toutes les requêtes HTTP avec durée, statut, user
 * backend/src/middleware/httpLogger.middleware.js
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Créer dossier logs
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger Winston pour HTTP
 */
const httpLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'http' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      maxsize: 5242880,
      maxFiles: 10
    })
  ]
});

// Console en développement
if (process.env.NODE_ENV !== 'production') {
  httpLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${JSON.stringify(meta, null, 0)}`;
      })
    )
  }));
}

/**
 * Middleware HTTP Logger
 */
function httpLoggerMiddleware() {
  return (req, res, next) => {
    const start = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Attacher requestId à la requête pour tracking
    req.id = requestId;
    
    // Intercepter les erreurs de réponse
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const level = statusCode >= 400 ? 'warn' : 'info';
      
      httpLogger.log(level, `${req.method} ${req.path} - ${statusCode}`, {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        statusCode,
        durationMs: duration,
        userId: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        contentLength: res.get('content-length')
      });
    });
    
    next();
  };
}

module.exports = {
  httpLogger,
  httpLoggerMiddleware
};
