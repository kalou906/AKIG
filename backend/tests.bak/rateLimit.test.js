/**
 * Tests for rate limiting middleware
 */

const rateLimit = require('express-rate-limit');
const {
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
} = require('../src/middleware/rateLimit');

describe('Rate Limit Middleware', () => {
  describe('Limiter configurations', () => {
    test('loginLimiter has correct settings', () => {
      expect(loginLimiter).toBeDefined();
      expect(loginLimiter.options).toBeDefined();
      expect(loginLimiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(loginLimiter.options.max).toBe(20);
    });

    test('registerLimiter has correct settings', () => {
      expect(registerLimiter).toBeDefined();
      expect(registerLimiter.options.windowMs).toBe(60 * 60 * 1000);
      expect(registerLimiter.options.max).toBe(5);
    });

    test('passwordResetLimiter has correct settings', () => {
      expect(passwordResetLimiter).toBeDefined();
      expect(passwordResetLimiter.options.windowMs).toBe(60 * 60 * 1000);
      expect(passwordResetLimiter.options.max).toBe(3);
    });

    test('apiLimiter has correct settings', () => {
      expect(apiLimiter).toBeDefined();
      expect(apiLimiter.options.windowMs).toBe(60 * 60 * 1000);
      expect(apiLimiter.options.max).toBe(1000);
    });

    test('paymentLimiter has correct settings', () => {
      expect(paymentLimiter).toBeDefined();
      expect(paymentLimiter.options.max).toBe(10);
    });

    test('exportLimiter has correct settings', () => {
      expect(exportLimiter).toBeDefined();
      expect(exportLimiter.options.max).toBe(5);
    });

    test('searchLimiter has correct settings', () => {
      expect(searchLimiter).toBeDefined();
      expect(searchLimiter.options.windowMs).toBe(60 * 1000);
      expect(searchLimiter.options.max).toBe(100);
    });

    test('webhookLimiter has correct settings', () => {
      expect(webhookLimiter).toBeDefined();
      expect(webhookLimiter.options.max).toBe(50);
    });
  });

  describe('Rate limit behavior', () => {
    test('loginLimiter skips rate limiting in test mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const req = { ip: '192.168.1.1', path: '/api/auth/login' };
      const skipFn = loginLimiter.options.skip;

      expect(skipFn(req)).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    test('apiLimiter skips health check endpoint', () => {
      const req = { ip: '192.168.1.1', path: '/api/health' };
      const skipFn = apiLimiter.options.skip;

      expect(skipFn(req)).toBe(true);
    });

    test('apiLimiter applies to other endpoints', () => {
      const req = { ip: '192.168.1.1', path: '/api/contracts' };
      const skipFn = apiLimiter.options.skip;

      expect(skipFn(req)).toBe(false);
    });
  });

  describe('Key generation for user-based limiting', () => {
    test('paymentLimiter uses user ID if authenticated', () => {
      const req = {
        user: { id: 123 },
        ip: '192.168.1.1',
      };

      const keyFn = paymentLimiter.options.keyGenerator;
      const key = keyFn(req);

      expect(key).toBe(123);
    });

    test('paymentLimiter uses IP if not authenticated', () => {
      const req = {
        ip: '192.168.1.1',
      };

      const keyFn = paymentLimiter.options.keyGenerator;
      const key = keyFn(req);

      expect(key).toBe('192.168.1.1');
    });

    test('exportLimiter uses user ID if authenticated', () => {
      const req = {
        user: { id: 456 },
        ip: '192.168.1.2',
      };

      const keyFn = exportLimiter.options.keyGenerator;
      const key = keyFn(req);

      expect(key).toBe(456);
    });

    test('searchLimiter uses user ID if authenticated', () => {
      const req = {
        user: { id: 789 },
        ip: '192.168.1.3',
      };

      const keyFn = searchLimiter.options.keyGenerator;
      const key = keyFn(req);

      expect(key).toBe(789);
    });
  });

  describe('Custom rate limiter creation', () => {
    test('creates custom limiter with provided options', () => {
      const customLimiter = createCustomLimiter({
        windowMs: 5 * 60 * 1000,
        max: 50,
        prefix: 'rl:custom:my-endpoint:',
      });

      expect(customLimiter).toBeDefined();
      expect(customLimiter.options.windowMs).toBe(5 * 60 * 1000);
      expect(customLimiter.options.max).toBe(50);
    });

    test('uses defaults for missing options', () => {
      const customLimiter = createCustomLimiter();

      expect(customLimiter.options.windowMs).toBe(60 * 60 * 1000);
      expect(customLimiter.options.max).toBe(100);
      expect(customLimiter.options.standardHeaders).toBe(true);
    });
  });

  describe('Error responses', () => {
    test('loginLimiter handler returns 429 on rate limit', (done) => {
      const req = {
        ip: '192.168.1.1',
        rateLimit: {
          limit: 20,
          current: 21,
          remaining: -1,
          resetTime: Math.floor(Date.now() / 1000) + 900,
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn((data) => {
          expect(res.status).toHaveBeenCalledWith(429);
          expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
          expect(data.ok).toBe(false);
          done();
        }),
      };

      loginLimiter.options.handler(req, res);
    });

    test('registerLimiter handler includes retry info', (done) => {
      const req = {
        ip: '192.168.1.1',
        rateLimit: {
          limit: 5,
          current: 6,
          remaining: -1,
          resetTime: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn((data) => {
          expect(data.retryAfter).toBeDefined();
          done();
        }),
      };

      registerLimiter.options.handler(req, res);
    });

    test('exportLimiter handler returns appropriate message', (done) => {
      const req = {
        user: { id: 1 },
        ip: '192.168.1.1',
        rateLimit: {
          limit: 5,
          current: 6,
          remaining: -1,
          resetTime: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn((data) => {
          expect(data.message).toContain('export');
          done();
        }),
      };

      exportLimiter.options.handler(req, res);
    });
  });

  describe('getRateLimitStatus utility', () => {
    test('returns null if no rate limit info on request', () => {
      const req = {};
      const status = getRateLimitStatus(req);

      expect(status).toBeNull();
    });

    test('returns rate limit status object', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 600;
      const req = {
        rateLimit: {
          limit: 100,
          current: 50,
          remaining: 50,
          resetTime: resetTime,
        },
      };

      const status = getRateLimitStatus(req);

      expect(status).toEqual({
        limit: 100,
        current: 50,
        remaining: 50,
        resetTime: new Date(resetTime * 1000).toISOString(),
      });
    });

    test('calculates remaining correctly', () => {
      const req = {
        rateLimit: {
          limit: 20,
          current: 5,
          remaining: 15,
          resetTime: Math.floor(Date.now() / 1000) + 900,
        },
      };

      const status = getRateLimitStatus(req);

      expect(status.remaining).toBe(15);
    });
  });

  describe('Limiter-specific scenarios', () => {
    test('loginLimiter protects brute force attacks', () => {
      const limiter = loginLimiter;
      // 15 minutes window, 20 attempts max
      expect(limiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(limiter.options.max).toBe(20);
    });

    test('passwordResetLimiter prevents email enumeration', () => {
      const limiter = passwordResetLimiter;
      // 1 hour window, only 3 attempts
      expect(limiter.options.windowMs).toBe(60 * 60 * 1000);
      expect(limiter.options.max).toBe(3);
    });

    test('paymentLimiter uses user-based limiting', () => {
      const keyFn = paymentLimiter.options.keyGenerator;
      const authenticatedReq = { user: { id: 1 }, ip: '1.1.1.1' };
      const unauthenticatedReq = { ip: '2.2.2.2' };

      expect(keyFn(authenticatedReq)).toBe(1); // user ID
      expect(keyFn(unauthenticatedReq)).toBe('2.2.2.2'); // IP
    });

    test('searchLimiter allows high query volume', () => {
      const limiter = searchLimiter;
      // 1 minute window, 100 requests allowed
      expect(limiter.options.windowMs).toBe(60 * 1000);
      expect(limiter.options.max).toBe(100);
    });

    test('webhookLimiter handles callback flood', () => {
      const limiter = webhookLimiter;
      // 1 minute window, 50 requests max
      expect(limiter.options.windowMs).toBe(60 * 1000);
      expect(limiter.options.max).toBe(50);
    });
  });

  describe('Standard headers configuration', () => {
    test('all limiters enable standardHeaders', () => {
      const limiters = [
        loginLimiter,
        registerLimiter,
        passwordResetLimiter,
        apiLimiter,
        paymentLimiter,
        exportLimiter,
        searchLimiter,
        webhookLimiter,
      ];

      limiters.forEach((limiter) => {
        expect(limiter.options.standardHeaders).toBe(true);
        expect(limiter.options.legacyHeaders).toBe(false);
      });
    });
  });

  describe('Integration scenarios', () => {
    test('different endpoints use appropriate limiters', () => {
      const scenarios = [
        {
          endpoint: 'login',
          limiter: loginLimiter,
          expectedMax: 20,
          expectedWindow: 15 * 60 * 1000,
        },
        {
          endpoint: 'register',
          limiter: registerLimiter,
          expectedMax: 5,
          expectedWindow: 60 * 60 * 1000,
        },
        {
          endpoint: 'payment',
          limiter: paymentLimiter,
          expectedMax: 10,
          expectedWindow: 60 * 60 * 1000,
        },
        {
          endpoint: 'export',
          limiter: exportLimiter,
          expectedMax: 5,
          expectedWindow: 60 * 60 * 1000,
        },
        {
          endpoint: 'search',
          limiter: searchLimiter,
          expectedMax: 100,
          expectedWindow: 60 * 1000,
        },
      ];

      scenarios.forEach((scenario) => {
        expect(scenario.limiter.options.max).toBe(scenario.expectedMax);
        expect(scenario.limiter.options.windowMs).toBe(scenario.expectedWindow);
      });
    });

    test('custom limiter can override defaults', () => {
      const strictLimiter = createCustomLimiter({
        windowMs: 2 * 60 * 1000,
        max: 10,
        prefix: 'rl:strict:',
      });

      expect(strictLimiter.options.max).toBe(10);
      expect(strictLimiter.options.windowMs).toBe(2 * 60 * 1000);
    });
  });
});
