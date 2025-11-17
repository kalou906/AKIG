/**
 * User-Based Rate Limiting
 * Fixes: Global rate limit vulnerability (P1)
 */

const rateLimit = require('express-rate-limit');

// Create user-specific rate limiter
const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per user per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, fallback to IP
    return req.user?.id?.toString() || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.body?.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes.',
    });
  },
});

module.exports = {
  userLimiter,
  authLimiter,
};
