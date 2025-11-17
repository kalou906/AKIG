/**
 * Compression Middleware Configuration
 * Gzip compression for responses + HTTP caching headers + Metrics
 */

const compression = require('compression');
const logger = require('../services/logger');
const MetricsService = require('../services/metrics.service');

/**
 * Custom filter to determine which responses should be compressed
 */
function shouldCompress(req, res) {
  // Don't compress if explicitly disabled
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  // Don't compress if client doesn't accept gzip
  if (!req.headers['accept-encoding'] || 
      !req.headers['accept-encoding'].includes('gzip')) {
    return false;
  }
  
  // Don't compress small responses
  const contentType = res.getHeader('content-type') || '';
  if (contentType.includes('image')) {
    return false; // Images are already compressed
  }
  
  return compression.filter(req, res);
}

/**
 * Configure compression middleware
 */
const compressionMiddleware = compression({
  // Compression level (0-9)
  level: 6, // Good balance between compression and speed
  threshold: 1024, // Only compress responses > 1KB
  filter: shouldCompress,
  
  // Track compression ratio
  wrappedWrite: function(write) {
    return function compressedWrite(chunk) {
      if (chunk && this.req) {
        MetricsService.recordCompression(chunk.length, 'gzip');
      }
      return write.apply(this, arguments);
    };
  }
});

/**
 * HTTP Caching Headers Middleware
 */
const cachingHeadersMiddleware = (req, res, next) => {
  // Skip caching for mutations
  if (req.method !== 'GET') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return next();
  }
  
  // Immutable assets (hashed filenames)
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2)$/i)) {
    // 1 year cache for immutable assets
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
    return next();
  }
  
  // API responses - cache for 5 minutes by default
  if (req.path.startsWith('/api/')) {
    // Check if response has custom cache TTL in query
    const customTTL = req.query.cacheTTL ? parseInt(req.query.cacheTTL) : 300;
    
    res.set('Cache-Control', `private, max-age=${customTTL}, must-revalidate`);
    res.set('Vary', 'Accept-Encoding, Authorization');
    
    // Add ETag for cache validation
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Generate simple ETag
      const crypto = require('crypto');
      const eTag = crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
      
      res.set('ETag', `"${eTag}"`);
      
      // Check If-None-Match header
      if (req.headers['if-none-match'] === `"${eTag}"`) {
        return res.status(304).send();
      }
      
      return originalJson(data);
    };
    
    return next();
  }
  
  // HTML pages - cache for 1 hour, must revalidate
  if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    return next();
  }
  
  // Default: no cache
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  return next();
};

module.exports = {
  compressionMiddleware,
  cachingHeadersMiddleware,
  shouldCompress
};
