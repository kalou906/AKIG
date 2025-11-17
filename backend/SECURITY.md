# Backend Security Guide

## Overview

This guide covers security best practices implemented in the AKIG backend, including input validation, sanitization, rate limiting, and secure authentication patterns.

## Table of Contents

1. [Input Validation](#input-validation)
2. [XSS Prevention](#xss-prevention)
3. [Rate Limiting](#rate-limiting)
4. [CORS Configuration](#cors-configuration)
5. [Security Headers](#security-headers)
6. [Password Security](#password-security)
7. [Authentication](#authentication)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Testing](#testing)

---

## Input Validation

### Using express-validator

Always validate and sanitize user input on the server side.

```javascript
const { body, query, validationResult } = require('express-validator');

router.post('/create',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 1, max: 100 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process valid request
  }
);
```

### Validation Rules Reference

| Rule | Description | Example |
|------|-------------|---------|
| `isEmail()` | Valid email format | `body('email').isEmail()` |
| `isLength({ min, max })` | String length | `body('name').isLength({ min: 2, max: 100 })` |
| `isInt({ min, max })` | Integer range | `body('age').isInt({ min: 0, max: 120 })` |
| `isFloat({ min, max })` | Decimal range | `body('price').isFloat({ min: 0 })` |
| `isMobilePhone()` | Phone format | `body('phone').isMobilePhone()` |
| `isURL()` | URL format | `body('website').isURL()` |
| `isUUID()` | UUID format | `body('id').isUUID()` |
| `matches(regex)` | Regex pattern | `body('code').matches(/^[A-Z0-9]{6}$/)` |
| `custom(fn)` | Custom validation | `body('confirm').custom(v => v === req.body.password)` |

### Sanitization Methods

| Method | Description |
|--------|-------------|
| `.trim()` | Remove whitespace |
| `.escape()` | Escape HTML characters |
| `.normalizeEmail()` | Normalize email format |
| `.toInt()` / `.toFloat()` | Convert to number |
| `.toLowerCase()` / `.toUpperCase()` | Change case |

---

## XSS Prevention

### Automatic Sanitization

All requests are automatically sanitized via `sanitizeBody` and `sanitizeQuery` middleware in `src/app.js`:

```javascript
// Automatically applied to all /api routes
app.use('/api/', sanitizeBody);
app.use('/api/', sanitizeQuery);
```

### Manual XSS Sanitization

Use the `xss` package for manual sanitization:

```javascript
const xss = require('xss');

// Sanitize with no HTML allowed
const clean = xss(userInput, {
  whiteList: {},        // No HTML tags allowed
  stripIgnoredTag: true, // Remove non-whitelisted tags
});

// Sanitize with limited HTML
const filtered = xss(userInput, {
  whiteList: {
    b: [],
    i: [],
    em: [],
    strong: [],
  },
  stripIgnoredTag: true,
});
```

### When to Use XSS Protection

✅ **Always sanitize:**
- User-generated content (profiles, comments, descriptions)
- Search queries
- File names and paths
- Email addresses
- Phone numbers
- Any user input that might be displayed

❌ **Don't need to sanitize:**
- Data from trusted internal sources
- System-generated content
- Pre-validated/escaped data

---

## Rate Limiting

### Configured Limiters

**`src/app.js`** exports these pre-configured rate limiters:

```javascript
const { app, authLimiter, paymentLimiter, exportLimiter } = require('./app');
```

### Rate Limit Tiers

| Endpoint Type | Window | Limit | Purpose |
|---------------|--------|-------|---------|
| General API | 1 minute | 300 requests | Standard API usage |
| Authentication | 15 minutes | 5 requests | Prevent brute force |
| Payments | 1 minute | 10 requests | Prevent duplicate charges |
| Exports | 5 minutes | 3 requests | Prevent resource exhaustion |

### Using Rate Limiters

```javascript
const { authLimiter, paymentLimiter } = require('../app');

// Apply to specific routes
router.post('/login', authLimiter, (req, res) => { /* ... */ });
router.post('/payments', paymentLimiter, (req, res) => { /* ... */ });

// General rate limiting is applied to all /api/* routes automatically
```

### Custom Rate Limiters

```javascript
const rateLimit = require('express-rate-limit');

const customLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 50,                    // 50 requests per window
  standardHeaders: true,      // Return RateLimit-* headers
  legacyHeaders: false,
  message: 'Too many requests',
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind proxy
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for specific routes
    return req.path === '/api/health';
  },
  skipSuccessfulRequests: false,  // Count all requests
});

app.use('/api/endpoint', customLimiter, myRouteHandler);
```

---

## CORS Configuration

### Current Configuration

```javascript
app.use(cors({
  origin: (origin, cb) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,  // 24 hours
}));
```

### Environment Setup

```bash
# .env file
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### Allowed Origins

- Production: Set `FRONTEND_URL` to production domain
- Development: Localhost variants (3000, 3001)
- Mobile/Desktop: Add explicit origins or use `*` (not recommended)

---

## Security Headers

### Implemented Headers (via Helmet)

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Restrictive CSP | Prevent XSS and injection attacks |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-Content-Type-Options` | nosniff | Prevent MIME type sniffing |
| `X-XSS-Protection` | 1; mode=block | Legacy XSS protection |
| `Referrer-Policy` | no-referrer | Limit referrer information |
| `Strict-Transport-Security` | max-age=31536000 | Force HTTPS |

### CSP Directives

```javascript
helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],           // Only from same origin
      "img-src": ["'self'", "data:"],      // Images from self or data URIs
      "script-src": ["'self'"],            // Scripts only from self
      "style-src": ["'self'"],             // Styles only from self
      "font-src": ["'self'"],              // Fonts only from self
      "connect-src": ["'self'"],           // API calls to self
    }
  }
})
```

---

## Password Security

### Requirements

Implement strong password policies:

```javascript
body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain uppercase')
  .matches(/[a-z]/)
  .withMessage('Password must contain lowercase')
  .matches(/\d/)
  .withMessage('Password must contain numbers')
  .matches(/[@$!%*#?&]/)
  .withMessage('Password must contain special characters')
```

### Hashing

Always hash passwords with `bcryptjs`:

```javascript
const bcrypt = require('bcryptjs');

// Hashing a password
const plainPassword = 'user@password123';
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Comparing passwords
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

### Never Log Passwords

```javascript
// ❌ WRONG
console.log('User login:', email, password);

// ✅ CORRECT
console.log('User login attempt:', email);
```

---

## Authentication

### JWT Setup

```javascript
const jwt = require('jsonwebtoken');

// Generate JWT
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify JWT
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.userId = decoded.userId;
} catch (error) {
  return res.status(401).json({ message: 'Invalid token' });
}
```

### Authentication Middleware

```javascript
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Usage
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ userId: req.userId });
});
```

### Environment Variables

```bash
# .env file
JWT_SECRET=your-very-secure-random-string-here
JWT_EXPIRY=24h
```

---

## Error Handling

### Don't Expose Sensitive Information

```javascript
// ❌ WRONG - Exposes internal details
res.status(500).json({ error: error.message });

// ✅ CORRECT - Generic message in production
if (process.env.NODE_ENV === 'production') {
  res.status(500).json({ error: 'Internal server error' });
} else {
  res.status(500).json({ error: error.message });
}
```

### Validation Error Format

```javascript
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map(err => ({
      field: err.param,
      message: err.msg,
    })),
  });
}
```

---

## Best Practices

### 1. Always Validate Input

```javascript
// Every endpoint should validate its inputs
router.post('/users', 
  body('email').isEmail(),
  body('name').isLength({ min: 1, max: 100 }),
  body('age').isInt({ min: 0, max: 150 }),
  handler
);
```

### 2. Use HTTPS in Production

```bash
# Verify SSL/TLS certificates
# Use Let's Encrypt for free certificates
# Enable Strict-Transport-Security header
```

### 3. Keep Dependencies Updated

```bash
# Regularly check for vulnerabilities
npm audit
npm audit fix

# Update packages
npm update
```

### 4. Use Environment Variables

```javascript
// ✅ CORRECT
const dbUrl = process.env.DATABASE_URL;
const secret = process.env.JWT_SECRET;

// ❌ WRONG
const dbUrl = 'postgresql://user:pass@host/db';
const secret = 'hardcoded-secret';
```

### 5. Implement Logging

```javascript
const morgan = require('morgan');

// Log all requests (already in app.js)
app.use(morgan('combined'));

// Don't log sensitive data
console.log('User login:', email); // OK
console.log('Password:', password); // NEVER
```

### 6. Use Security Headers

```javascript
// Already implemented via Helmet in app.js
app.use(helmet({
  contentSecurityPolicy: true,
  hsts: { maxAge: 31536000 },
  frameguard: { action: 'deny' },
}));
```

### 7. Test Security

```bash
# Run security tests
npm audit

# Check for known vulnerabilities in dependencies
npx snyk test

# Use OWASP ZAP for penetration testing
```

---

## Testing

### Example: Secure Endpoint Testing

```javascript
const request = require('supertest');
const app = require('../app');

describe('Security Tests', () => {
  test('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'invalid', password: 'Pass123!@' });
    
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'user@example.com', password: '123' });
    
    expect(res.status).toBe(400);
  });

  test('should reject XSS in input', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ 
        email: 'user@example.com',
        password: 'Pass123!@',
        name: '<script>alert("xss")</script>'
      });
    
    // Sanitization should remove script tags
    expect(res.body.user.name).not.toContain('<script>');
  });

  test('should enforce rate limiting', async () => {
    const email = 'attacker@example.com';
    
    for (let i = 0; i < 6; i++) {
      await request(app).post('/api/auth/login').send({ email, password: 'guess' });
    }
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'guess' });
    
    expect(res.status).toBe(429); // Too Many Requests
  });
});
```

### Running Security Tests

```bash
# Run all tests
npm test

# Run security-specific tests
npm test -- security

# Run with coverage
npm test -- --coverage
```

---

## Quick Security Checklist

- [ ] All user input validated with express-validator
- [ ] Passwords hashed with bcrypt (10 salt rounds)
- [ ] JWT tokens configured with expiry (24h)
- [ ] Rate limiting enabled on all sensitive endpoints
- [ ] CORS configured for specific origins
- [ ] Helmet security headers enabled
- [ ] XSS protection via xss package
- [ ] SQL injection prevented via parameterized queries (pg library)
- [ ] Error messages don't expose sensitive data
- [ ] HTTPS enforced in production
- [ ] Environment variables used for secrets
- [ ] Dependencies kept up to date
- [ ] Logging configured (no password logging)
- [ ] Unit tests include security scenarios

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [express-validator Documentation](https://express-validator.github.io/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [Snyk Security Scanner](https://snyk.io/)

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0
