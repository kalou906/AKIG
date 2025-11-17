/**
 * Logging Service
 * Comprehensive logging with structured data, request tracking, and performance monitoring
 * Integrates with database logging tables for centralized log management
 */

const os = require('os');
const { v4: uuidv4 } = require('uuid');

/**
 * Logger class for structured logging
 */
class Logger {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.serviceName = options.serviceName || 'akig-api';
    this.environment = process.env.NODE_ENV || 'development';
    this.enableConsole = options.enableConsole !== false;
    this.enableDatabase = options.enableDatabase !== false;
    this.hostname = os.hostname();
  }

  /**
   * Generate request ID if not provided
   */
  generateRequestId() {
    return `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  }

  /**
   * Format log entry with context
   */
  formatLogEntry(level, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: this.environment,
      hostname: this.hostname,
      ...metadata
    };
  }

  /**
   * Log to console in development
   */
  logToConsole(entry) {
    if (!this.enableConsole) return;

    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m' // red
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level] || '';

    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`,
      entry.requestId ? `(req: ${entry.requestId})` : '',
      Object.keys(entry.metadata || {}).length > 0 ? entry.metadata : ''
    );
  }

  /**
   * Log to database
   */
  async logToDatabase(entry) {
    if (!this.enableDatabase || !this.pool) return;

    try {
      await this.pool.query(
        `INSERT INTO logs 
         (level, message, req_id, user_id, metadata, endpoint, method, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          entry.level,
          entry.message,
          entry.requestId,
          entry.userId || null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.endpoint || null,
          entry.method || null,
          entry.ipAddress || null,
          entry.userAgent || null
        ]
      );
    } catch (error) {
      // Silently fail database logging to avoid cascading errors
      if (this.enableConsole) {
        console.error('Failed to log to database:', error.message);
      }
    }
  }

  /**
   * Core logging function
   */
  async log(level, message, options = {}) {
    const {
      requestId,
      userId,
      metadata,
      endpoint,
      method,
      statusCode,
      duration,
      ipAddress,
      userAgent
    } = options;

    const entry = {
      level,
      message,
      requestId: requestId || this.generateRequestId(),
      userId,
      metadata: {
        ...metadata,
        ...(statusCode && { statusCode }),
        ...(duration && { durationMs: duration })
      },
      endpoint,
      method,
      ipAddress,
      userAgent
    };

    // Log to console
    this.logToConsole(entry);

    // Log to database
    await this.logToDatabase(entry);

    return entry;
  }

  /**
   * Log debug message
   */
  async debug(message, options = {}) {
    return this.log('debug', message, options);
  }

  /**
   * Log info message
   */
  async info(message, options = {}) {
    return this.log('info', message, options);
  }

  /**
   * Log warning message
   */
  async warn(message, options = {}) {
    return this.log('warn', message, options);
  }

  /**
   * Log error message
   */
  async error(message, error, options = {}) {
    const metadata = {
      ...options.metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorCode: error?.code
    };

    return this.log('error', message, {
      ...options,
      metadata
    });
  }

  /**
   * Log API request
   */
  async logApiCall(options = {}) {
    const {
      requestId,
      userId,
      endpoint,
      method,
      statusCode,
      duration,
      requestSize,
      responseSize,
      errorMessage,
      ipAddress
    } = options;

    try {
      await this.pool.query(
        `INSERT INTO api_logs 
         (req_id, user_id, endpoint, method, status_code, duration_ms, request_size, response_size, error_message, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          requestId,
          userId || null,
          endpoint,
          method,
          statusCode,
          duration,
          requestSize || null,
          responseSize || null,
          errorMessage || null,
          ipAddress || null
        ]
      );

      // Log warnings for slow requests
      if (duration > 1000) {
        await this.warn('Slow API request', {
          requestId,
          metadata: {
            endpoint,
            method,
            duration,
            threshold: 1000
          }
        });
      }
    } catch (error) {
      if (this.enableConsole) {
        console.error('Failed to log API call:', error.message);
      }
    }
  }

  /**
   * Log database query
   */
  async logQuery(query, duration, options = {}) {
    const { rowsAffected, error } = options;

    try {
      await this.pool.query(
        `INSERT INTO query_log (query, duration_ms, rows_affected, error_message)
         VALUES ($1, $2, $3, $4)`,
        [
          query.substring(0, 2000), // Limit query length
          duration,
          rowsAffected || null,
          error?.message || null
        ]
      );

      // Alert on slow queries
      if (duration > 1000) {
        await this.warn('Slow database query', {
          metadata: {
            query: query.substring(0, 200),
            duration,
            threshold: 1000
          }
        });
      }
    } catch (err) {
      if (this.enableConsole) {
        console.error('Failed to log query:', err.message);
      }
    }
  }

  /**
   * Create system alert
   */
  async createAlert(severity, title, message, metadata = {}) {
    try {
      await this.pool.query(
        `INSERT INTO alerts (severity, title, message, metadata)
         VALUES ($1, $2, $3, $4)`,
        [severity, title, message, JSON.stringify(metadata)]
      );
    } catch (error) {
      if (this.enableConsole) {
        console.error('Failed to create alert:', error.message);
      }
    }
  }

  /**
   * Get logs by request ID
   */
  async getLogsByRequestId(requestId, limit = 100) {
    try {
      const { rows } = await this.pool.query(
        `SELECT id, ts, level, message, user_id, metadata, endpoint, method, status_code
         FROM logs
         WHERE req_id = $1
         ORDER BY ts DESC
         LIMIT $2`,
        [requestId, limit]
      );
      return rows;
    } catch (error) {
      console.error('Failed to get logs by request ID:', error.message);
      return [];
    }
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit = 100, level = null) {
    try {
      let query = `SELECT id, ts, level, message, req_id, user_id FROM logs`;
      const params = [];

      if (level) {
        query += ` WHERE level = $1`;
        params.push(level);
      }

      query += ` ORDER BY ts DESC LIMIT ${level ? '$2' : '$1'}`;
      if (level) {
        params.push(limit);
      } else {
        params.push(limit);
      }

      const { rows } = await this.pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Failed to get recent logs:', error.message);
      return [];
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(hours = 24) {
    try {
      const { rows } = await this.pool.query(
        `SELECT * FROM get_performance_stats($1)`,
        [hours]
      );
      return rows;
    } catch (error) {
      console.error('Failed to get performance stats:', error.message);
      return [];
    }
  }

  /**
   * Cleanup old logs
   */
  async cleanupOldLogs() {
    try {
      const { rows } = await this.pool.query(`SELECT * FROM cleanup_old_logs()`);
      const [result] = rows;
      await this.info('Log cleanup completed', {
        metadata: {
          deletedLogs: result.deleted_logs,
          deletedApiLogs: result.deleted_api_logs,
          deletedQueries: result.deleted_queries
        }
      });
      return result;
    } catch (error) {
      await this.error('Log cleanup failed', error);
      return null;
    }
  }
}

/**
 * Middleware to attach logger to request
 */
function loggerMiddleware(logger) {
  return (req, res, next) => {
    // Generate or use existing request ID
    req.requestId = req.headers['x-request-id'] || logger.generateRequestId();
    req.logger = logger;

    // Store start time for duration calculation
    req.startTime = Date.now();

    // Capture response size
    const originalJson = res.json;
    res.json = function(data) {
      res.responseSize = JSON.stringify(data).length;
      return originalJson.call(this, data);
    };

    // Log API call on response
    res.on('finish', () => {
      const duration = Date.now() - req.startTime;
      const ipAddress = req.ip || req.connection.remoteAddress;

      logger.logApiCall({
        requestId: req.requestId,
        userId: req.user?.id,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        requestSize: req.get('content-length'),
        responseSize: res.responseSize,
        ipAddress
      }).catch(err => console.error('Failed to log API call:', err.message));
    });

    next();
  };
}

/**
 * Export instances for simple usage
 */
let defaultLogger = null;

function initializeLogger(pool, options = {}) {
  defaultLogger = new Logger(pool, options);
  return defaultLogger;
}

function getLogger() {
  if (!defaultLogger) {
    throw new Error('Logger not initialized. Call initializeLogger first.');
  }
  return defaultLogger;
}

/**
 * Convenience functions for default logger
 */
async function log(level, message, options = {}) {
  const logger = getLogger();
  return logger.log(level, message, options);
}

async function debug(message, options = {}) {
  const logger = getLogger();
  return logger.debug(message, options);
}

async function info(message, options = {}) {
  const logger = getLogger();
  return logger.info(message, options);
}

async function warn(message, options = {}) {
  const logger = getLogger();
  return logger.warn(message, options);
}

async function error(message, err, options = {}) {
  const logger = getLogger();
  return logger.error(message, err, options);
}

module.exports = {
  Logger,
  loggerMiddleware,
  initializeLogger,
  getLogger,
  log,
  debug,
  info,
  warn,
  error
};
