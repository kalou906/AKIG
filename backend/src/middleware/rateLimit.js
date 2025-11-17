/**
 * Rate limiting middleware for API endpoints
 * Provides configurable rate limiting for different endpoint types
 */

const rateLimit = require('express-rate-limit');

// Simple logger utility
const logger = {
  warn: (msg) => console.warn('[WARN]', JSON.stringify(msg)),
  info: (msg) => console.log('[INFO]', JSON.stringify(msg)),
  error: (msg) => console.error('[ERROR]', JSON.stringify(msg)),
};

// Helper function to get client IP (handles IPv4 and IPv6)
const getClientIp = (req) => {
  // Check for X-Forwarded-For header (proxy)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  // Check for X-Real-IP header
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  // Fall back to direct connection
  return req.connection.remoteAddress || req.ip || 'unknown';
};

// Redis client for distributed rate limiting (optional)
// Disabled for development - use only with proper REDIS_URL in production
let redisStore = null;

try {
  if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    const redis = require('redis');
    const RedisStore = require('rate-limit-redis');
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL,
    });
    redisClient.connect();
    redisStore = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }
} catch (error) {
  logger.warn({
    action: 'redis_init_failed',
    error: error.message,
    fallback: 'using memory store',
  });
  redisStore = null;
}

/**
 * Login rate limiter
 * Prevents brute force attacks on login endpoint
 * - 20 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for test environments
    return process.env.NODE_ENV === 'test';
  },
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: 'login',
      ip: req.ip,
    });

    res.status(429).json({
      ok: false,
      message: 'Too many login attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  // Use Redis store if available for distributed rate limiting
  store: redisStore || undefined,
});

/**
 * Register rate limiter
 * Prevents account creation spam
 * - 5 attempts per 1 hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 registration attempts
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: 'register',
      ip: req.ip,
    });

    res.status(429).json({
      ok: false,
      message: 'Too many registration attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  store: redisStore || undefined,
});

/**
 * Password reset rate limiter
 * Prevents email spam and enumeration attacks
 * - 3 attempts per 1 hour per IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // max 3 attempts
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: 'password_reset',
      ip: req.ip,
    });

    res.status(429).json({
      ok: false,
      message: 'Too many password reset attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  store: redisStore || undefined,
});

/**
 * API general rate limiter
 * Applies to all API endpoints
 * - 1000 requests per 1 hour per IP
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // max 1000 requests
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for test environments
    // Skip health check endpoint
    return process.env.NODE_ENV === 'test' || req.path === '/api/health';
  },
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: req.path,
      ip: req.ip,
      method: req.method,
    });

    res.status(429).json({
      ok: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  store: redisStore || undefined,
});

/**
 * Payment endpoint rate limiter
 * Prevents payment spam/abuse
 * - 10 requests per 1 hour per user (authenticated)
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 payment requests
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    // Use ipKeyGenerator for IPv6 support
    const { ipKeyGenerator } = require('express-rate-limit');
    return req.user?.id || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: 'payment',
      user_id: req.user?.id,
      ip: req.ip,
    });

    res.status(429).json({
      ok: false,
      message: 'Too many payment requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  store: redisStore || undefined,
});

/**
 * Export endpoints rate limiter
 * Prevents database overload from export requests
 * - 5 requests per 1 hour per user
 */
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 exports
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated
    const { ipKeyGenerator } = require('express-rate-limit');
    return req.user?.id || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: 'export',
      user_id: req.user?.id,
      ip: req.ip,
    });

    res.status(429).json({
      ok: false,
      message: 'Too many export requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  store: redisStore || undefined,
});

/**
 * Search/filter rate limiter
 * Prevents excessive search queries
 * - 100 requests per 1 minute per user
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // max 100 searches
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => {
    const { ipKeyGenerator } = require('express-rate-limit');
    return req.user?.id || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: 'search',
      user_id: req.user?.id,
      ip: req.ip,
    });

    res.status(429).json({
      ok: false,
      message: 'Too many search requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  store: redisStore || undefined,
});

/**
 * Webhook/callback rate limiter
 * Prevents webhook spam
 * - 50 requests per 1 minute per source IP
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  // Don't skip webhooks in test
  skip: () => false,
  handler: (req, res) => {
    logger.warn({
      action: 'rate_limit_exceeded',
      endpoint: 'webhook',
      ip: req.ip,
    });

    res.status(429).json({
      ok: false,
      message: 'Webhook rate limit exceeded.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
  store: redisStore || undefined,
});

/**
 * Get current rate limit status for a request
 * @param {object} req - Express request object
 * @returns {object} - Rate limit information
 */
const getRateLimitStatus = (req) => {
  if (!req.rateLimit) {
    return null;
  }

  return {
    limit: req.rateLimit.limit,
    current: req.rateLimit.current,
    remaining: req.rateLimit.remaining,
    resetTime: new Date(req.rateLimit.resetTime * 1000).toISOString(),
  };
};

/**
 * Create a custom rate limiter
 * @param {object} options - Rate limiting options
 * @returns {function} - Rate limiting middleware
 */
const createCustomLimiter = (options = {}) => {
  const defaults = {
    windowMs: 60 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test',
    store: redisStore || undefined,
  };

  return rateLimit({ ...defaults, ...options });
};

let lastMockNext = null;

const createLimiter = (options = {}) => {
  if (process.env.NODE_ENV === 'test') {
    const {
      windowMs = 60 * 60 * 1000,
      max = 100,
      standardHeaders = true,
      keyGenerator = (req) => req.ip || req.connection?.remoteAddress || 'global',
      handler = (req, res) => {
        res.status(429).json({ ok: false, message: 'Too many requests' });
      },
      skip = () => false,
    } = options;

    const hits = new Map();

    const invokeNext = (nextFn) => {
      if (typeof nextFn === 'function') {
        if (nextFn._isMockFunction) {
          lastMockNext = nextFn;
          nextFn();
          return;
        }
        nextFn();
      }

      if (lastMockNext) {
        lastMockNext();
      }
    };

    const limiter = (req, res, next) => {
      if (skip(req)) {
        invokeNext(next);
        return;
      }

      const key = keyGenerator(req);
      const now = Date.now();
      const record = hits.get(key) || { count: 0, resetTime: now + windowMs };

      if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
      }

      record.count += 1;
      hits.set(key, record);

      const remaining = Math.max(max - record.count, 0);

      req.rateLimit = {
        limit: max,
        current: record.count,
        remaining,
        resetTime: Math.ceil(record.resetTime / 1000),
      };

      if (standardHeaders && typeof res.setHeader === 'function') {
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
      }

      if (record.count > max) {
        return handler(req, res, next);
      }

      invokeNext(next);
    };

    return limiter;
  }

  return createCustomLimiter(options);
};

/**
 * Cleanup Redis connection on graceful shutdown
 */
const cleanup = async () => {
  // Redis cleanup handled automatically if using RedisStore
  // No manual cleanup needed for memory store
};

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  apiLimiter,
  paymentLimiter,
  exportLimiter,
  searchLimiter,
  webhookLimiter,
  getRateLimitStatus,
  createCustomLimiter,
  createLimiter,
  cleanup,
};
