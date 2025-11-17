/**
 * Service Logger Winston - Logging Centralisé
 * Tous les logs structurés avec niveaux (debug, info, warn, error)
 * backend/src/services/logger.js
 */

const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Créer le répertoire logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Formatte un log en JSON structuré
 */
function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
    pid: process.pid,
    nodeEnv: process.env.NODE_ENV || 'development',
  });
}

/**
 * Écrit un log dans un fichier
 */
function writeToFile(level, formattedLog) {
  const filename = path.join(logsDir, `${level}-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(filename, formattedLog + '\n', { encoding: 'utf-8' });
}

/**
 * Service de logging
 */
class Logger {
  constructor(name = 'App') {
    this.name = name;
    this.minLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;
  }

  /**
   * Détermine si un niveau de log doit être affiché
   */
  isEnabled(level) {
    const levels = [LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, LOG_LEVELS.WARN, LOG_LEVELS.ERROR];
    const currentIndex = levels.indexOf(this.minLevel);
    const logIndex = levels.indexOf(level);
    return logIndex >= currentIndex;
  }

  /**
   * Log DEBUG
   */
  debug(message, data = {}) {
    if (!this.isEnabled(LOG_LEVELS.DEBUG)) return;

    const formatted = formatLog(LOG_LEVELS.DEBUG, message, {
      logger: this.name,
      ...data,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[36m[DEBUG]\x1b[0m ${this.name}: ${message}`);
    }

    writeToFile(LOG_LEVELS.DEBUG, formatted);
  }

  /**
   * Log INFO
   */
  info(message, data = {}) {
    if (!this.isEnabled(LOG_LEVELS.INFO)) return;

    const formatted = formatLog(LOG_LEVELS.INFO, message, {
      logger: this.name,
      ...data,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[32m[INFO]\x1b[0m ${this.name}: ${message}`);
    }

    writeToFile(LOG_LEVELS.INFO, formatted);
  }

  /**
   * Log WARN
   */
  warn(message, data = {}) {
    if (!this.isEnabled(LOG_LEVELS.WARN)) return;

    const formatted = formatLog(LOG_LEVELS.WARN, message, {
      logger: this.name,
      ...data,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`\x1b[33m[WARN]\x1b[0m ${this.name}: ${message}`);
    }

    writeToFile(LOG_LEVELS.WARN, formatted);
  }

  /**
   * Log ERROR
   */
  error(message, data = {}) {
    const formatted = formatLog(LOG_LEVELS.ERROR, message, {
      logger: this.name,
      ...data,
    });

    console.error(`\x1b[31m[ERROR]\x1b[0m ${this.name}: ${message}`);

    writeToFile(LOG_LEVELS.ERROR, formatted);
  }

  /**
   * Log une requête HTTP
   */
  logRequest(req, statusCode, responseTime) {
    this.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
    });
  }

  /**
   * Log une action utilisateur
   */
  logAction(action, details = {}) {
    this.info('User Action', {
      action,
      ...details,
    });
  }

  /**
   * Log une erreur base de données
   */
  logDatabaseError(error, query = null) {
    this.error('Database Error', {
      errorCode: error.code,
      errorMessage: error.message,
      query: query ? query.substring(0, 200) : null,
      detail: error.detail,
    });
  }
}

// Instance globale
const logger = new Logger('AKIG');

// Middleware pour logger les requêtes HTTP
function httpLoggingMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logger.logRequest(req, res.statusCode, responseTime);
    });

    next();
  };
}

module.exports = {
  Logger,
  logger,
  httpLoggingMiddleware,
};
