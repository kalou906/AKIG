/**
 * Cache Middleware
 * Automatically caches GET requests based on endpoint patterns
 */

const cache = require('../utils/redisCache');

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 */
function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for authenticated endpoints with user-specific data
    if (req.query.skip_cache === 'true') {
      return next();
    }

    // Generate cache key based on user + path + query
    const cacheKey = `${req.user?.id || 'public'}:${req.path}:${JSON.stringify(req.query)}`;

    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl);
          res.setHeader('X-Cache', 'MISS');
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      next();
    }
  };
}

/**
 * Invalidate cache pattern
 * Usage: invalidateCache('contracts:*') after creating/updating contracts
 */
async function invalidateCache(pattern) {
  try {
    await cache.delPattern(pattern);
  } catch (err) {
    console.error('Cache invalidation error:', err);
  }
}

module.exports = {
  cacheMiddleware,
  invalidateCache
};
