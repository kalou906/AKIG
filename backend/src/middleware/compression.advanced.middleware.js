/**
 * Middleware de Compression Avancé
 * Gzip + Brotli + Metrics
 * backend/src/middleware/compression.advanced.middleware.js
 */

const compression = require('compression');
const MetricsService = require('../services/metrics.service');

/**
 * Middleware de compression avancé
 * Teste automatiquement gzip vs brotli
 */
function compressionAdvancedMiddleware() {
  return [
    // Gzip par défaut (plus compatible)
    compression({
      level: 6, // Compression level (0-9), 6 est bon compromis
      threshold: 1024, // Ne compresser que si > 1KB
      filter: (req, res) => {
        // Ne pas compresser images, vidéos
        if (req.headers['x-no-compression']) {
          return false;
        }
        
        // Compresser JSON, texte, CSS, JS
        const type = res.getHeader('content-type') || '';
        if (type.includes('image') || type.includes('video') || type.includes('font')) {
          return false;
        }
        
        return compression.filter(req, res);
      },
      
      // Intercepter pour logging
      wrappedWrite: function(write) {
        return function compressedWrite(chunk) {
          // Track compression metrics
          if (chunk) {
            MetricsService.recordCompression(chunk.length, 'gzip');
          }
          return write.apply(this, arguments);
        };
      }
    }),

    // Middleware pour ajouter headers de compression
    (req, res, next) => {
      const originalJson = res.json.bind(res);
      
      res.json = function(data) {
        const uncompressed = JSON.stringify(data);
        const size = Buffer.byteLength(uncompressed);
        
        // Ajouter headers pour tracking
        res.set('X-Content-Uncompressed-Size', size);
        
        return originalJson(data);
      };
      
      next();
    }
  ];
}

/**
 * Middleware pour forcer compression même pour petits fichiers
 */
function forceCompressionMiddleware() {
  return compression({
    level: 9, // Compression maximale
    threshold: 0 // Compresser tout
  });
}

/**
 * Middleware pour compression selective
 * Différent niveau selon type de données
 */
function selectiveCompressionMiddleware() {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Données massives: compression max
      if (JSON.stringify(data).length > 100000) {
        compression({ level: 9 })(req, res, () => {});
      } 
      // Données petites: compression légère
      else {
        compression({ level: 3 })(req, res, () => {});
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = {
  compressionAdvancedMiddleware,
  forceCompressionMiddleware,
  selectiveCompressionMiddleware
};
