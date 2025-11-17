const { healthCheck, getPoolStats } = require('../db-utils');

/**
 * Database health check endpoint middleware
 */
const dbHealthCheck = async (req, res, next) => {
  try {
    const health = await healthCheck();
    const stats = getPoolStats();
    
    if (!health.healthy) {
      return res.status(503).json({
        status: 'unhealthy',
        database: health,
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json({
      status: 'healthy',
      database: health,
      poolStats: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware to ensure database connection
 * Attach to routes that require database access
 */
const requireDatabase = async (req, res, next) => {
  try {
    const health = await healthCheck();
    
    if (!health.healthy) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable',
      });
    }
    
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
    });
  }
};

/**
 * Middleware for connection pooling monitoring
 */
const monitorPool = (req, res, next) => {
  const stats = getPoolStats();
  
  // Log if pool is running low on connections
  if (stats.idle < 2) {
    console.warn('Database pool warning: low idle connections', stats);
  }
  
  // Attach stats to request for logging
  req.dbPoolStats = stats;
  
  next();
};

module.exports = {
  dbHealthCheck,
  requireDatabase,
  monitorPool,
};
