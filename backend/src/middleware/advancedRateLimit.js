/**
 * Advanced Rate Limiting Middleware
 * Implements endpoint-specific rate limiting strategies
 * Protects against brute force attacks and abuse
 */

const rateLimit = require('express-rate-limit');

// ============================================
// 🔐 Authentication Endpoints - STRICT
// Max 5 attempts per 15 minutes
// ============================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    // Rate limit by email or IP
    return req.body?.email || req.ip;
  }
});

// ============================================
// 📊 API Endpoints - MODERATE
// Max 100 requests per 15 minutes per user
// ============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    // Rate limit by user ID or IP
    return req.user?.id || req.ip;
  }
});

// ============================================
// 📝 Write Operations - STRICT
// Max 50 writes per 15 minutes per user
// ============================================
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many write operations, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE' && req.method !== 'PATCH',
  keyGenerator: (req) => req.user?.id || req.ip
});

// ============================================
// 🔍 Search/Read Operations - RELAXED
// Max 300 requests per 15 minutes
// ============================================
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many read requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET',
  keyGenerator: (req) => req.user?.id || req.ip
});

// ============================================
// ⚡ Global Limiter - VERY RELAXED
// Max 1000 requests per 15 minutes
// ============================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// ============================================
// 📤 File Upload Limiter
// Max 10 uploads per hour
// ============================================
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many uploads, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.files && !req.file,
  keyGenerator: (req) => req.user?.id || req.ip
});

// ============================================
// 📧 Email-based Limiter
// Max 3 emails per hour per address
// ============================================
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many emails sent to this address',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.email || req.query?.email || req.ip
});

module.exports = {
  authLimiter,
  apiLimiter,
  writeLimiter,
  readLimiter,
  globalLimiter,
  uploadLimiter,
  emailLimiter
};
