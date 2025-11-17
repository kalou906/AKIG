/**
 * Request Processing Middleware
 * - Compression handling
 * - Payload size limiting
 * - Input sanitization
 */

const compression = require('compression');

// ============================================
// ⚙️ COMPRESSION MIDDLEWARE
// ============================================

const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024 // Only compress responses > 1KB
});

// ============================================
// 📏 PAYLOAD SIZE LIMITER
// ============================================

function limitPayloadSize(maxSize = '50mb') {
  const maxBytes = parseSize(maxSize);

  return (req, res, next) => {
    const size = parseInt(req.get('content-length') || '0');

    if (size > maxBytes) {
      return res.status(413).json({
        error: `Payload too large`,
        max: maxSize,
        received: formatBytes(size)
      });
    }

    next();
  };
}

// ============================================
// 🧹 SANITIZATION
// ============================================

function sanitize(req, res, next) {
  const sanitizeValue = (val) => {
    if (typeof val === 'string') {
      return val
        .trim()
        .replace(/[<>\"'`]/g, '') // Remove HTML-like characters
        .slice(0, 10000); // Max length protection
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      for (const key in val) {
        val[key] = sanitizeValue(val[key]);
      }
    }
    if (Array.isArray(val)) {
      return val.map(v => sanitizeValue(v));
    }
    return val;
  };

  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    req.query = sanitizeValue(req.query);
  }

  next();
}

// ============================================
// 🛠️ HELPERS
// ============================================

function parseSize(size) {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/(\d+)(b|kb|mb|gb)?/);
  if (!match) return 50 * 1024 * 1024; // Default 50MB

  const value = parseInt(match[1]);
  const unit = match[2] || 'b';

  return value * (units[unit] || 1);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
  compressionMiddleware,
  limitPayloadSize,
  sanitize
};
