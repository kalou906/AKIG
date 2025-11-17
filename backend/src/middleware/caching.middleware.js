/**
 * Caching Middleware
 * Automatically caches GET requests based on configuration
 */

const logger = require('../services/logger');
const cache = require('../services/cache.service');

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
  const baseKey = `${req.method}:${req.path}`;
  const queryKey = Object.keys(req.query).length > 0 
    ? `:${JSON.stringify(req.query)}` 
    : '';
  return `${baseKey}${queryKey}`;
}

/**
 * Check if route should be cached
 */
function isCacheable(req) {
  // Only cache GET requests
  if (req.method !== 'GET') return false;
  
  // Don't cache if user explicitly disabled it
  if (req.query.noCache === 'true') return false;
  
  // Don't cache if no cache header
  if (req.headers['cache-control'] === 'no-cache') return false;
  
  return true;
}

/**
 * Cache middleware - check cache before processing
 */
const cacheMiddleware = async (req, res, next) => {
  if (!isCacheable(req)) {
    return next();
  }

  const cacheKey = generateCacheKey(req);
  
  try {
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      logger.debug(`Serving from cache: ${cacheKey}`);
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function(data) {
      if (res.statusCode === 200) {
        // Cache successful responses (default 5 min)
        const ttl = req.query.cacheTTL ? parseInt(req.query.cacheTTL) : 300;
        cache.set(cacheKey, data, ttl).catch(err => {
          logger.error(`Failed to cache response: ${err.message}`);
        });
        res.set('X-Cache', 'MISS');
      }
      
      return originalJson(data);
    };
    
    next();
  } catch (error) {
    logger.error(`Cache middleware error: ${error.message}`);
    next(); // Continue without caching if error
  }
};

/**
 * Cache busting middleware - invalidate cache on mutations
 */
const cacheBustMiddleware = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to bust cache after mutation
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Success - bust relevant caches
      bustCacheForRoute(req).catch(err => {
        logger.error(`Cache bust error: ${err.message}`);
      });
    }
    
    return originalJson(data);
  };
  
  next();
};

/**
 * Bust cache based on route
 */
async function bustCacheForRoute(req) {
  const { method, path, params, body } = req;
  
  // Parse resource type
  const resourceType = path.split('/')[2]; // /api/resource/...
  
  switch (resourceType) {
    case 'contracts':
      if (method !== 'GET') {
        if (params.id) {
          await cache.invalidateContract(params.id);
        }
        await cache.invalidateTenantContracts(req.user?.tenantId);
        await cache.invalidateSearch();
        await cache.invalidateAuditLogs();
      }
      break;
      
    case 'payments':
      if (method !== 'GET') {
        await cache.invalidatePaymentStats(req.user?.tenantId);
        await cache.invalidateAuditLogs();
      }
      break;
      
    case 'users':
      if (method !== 'GET') {
        if (params.id) {
          await cache.invalidatePermissions(params.id);
        }
      }
      break;
      
    case 'dashboard':
      if (method !== 'GET') {
        await cache.deleteMany('dashboard:*');
      }
      break;
  }
}

/**
 * Manual cache invalidation route
 */
const cacheAdmin = async (req, res) => {
  try {
    const { action, pattern } = req.body;
    
    if (action === 'clear') {
      await cache.clear();
      return res.json({ 
        success: true, 
        message: 'Cache cleared' 
      });
    }
    
    if (action === 'invalidate' && pattern) {
      await cache.deleteMany(pattern);
      return res.json({ 
        success: true, 
        message: `Cache invalidated for pattern: ${pattern}` 
      });
    }
    
    if (action === 'stats') {
      const stats = await cache.getStats();
      return res.json(stats);
    }
    
    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    logger.error(`Cache admin error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  cacheMiddleware,
  cacheBustMiddleware,
  cacheAdmin,
  generateCacheKey,
  isCacheable
};
