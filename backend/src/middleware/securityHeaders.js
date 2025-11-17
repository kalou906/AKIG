/**
 * Security Headers Middleware
 * Implements OWASP best practices:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options (Clickjacking protection)
 * - X-Content-Type-Options (MIME type sniffing)
 * - Referrer Policy (Privacy)
 * - Permissions Policy (Feature control)
 */

const helmet = require('helmet');

module.exports = (app) => {
  // ============================================
  // 🛡️ Helmet - Core security headers
  // ============================================
  app.use(helmet());

  // ============================================
  // 📋 Content Security Policy (CSP)
  // Prevents XSS, injection attacks
  // ============================================
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
        connectSrc: ["'self'", 'http://localhost:4000', 'https://api.github.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : []
      },
      reportOnly: false // Set to true for testing
    })
  );

  // ============================================
  // 🔒 HSTS - Enforce HTTPS
  // ============================================
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    })
  );

  // ============================================
  // ❌ Referrer Policy
  // Prevent leaking referrer information
  // ============================================
  app.use(
    helmet.referrerPolicy({
      policy: 'strict-origin-when-cross-origin'
    })
  );

  // ============================================
  // 🚫 X-Content-Type-Options
  // Prevent MIME type sniffing
  // ============================================
  app.use(
    helmet.noSniff()
  );

  // ============================================
  // 🖼️ X-Frame-Options
  // Clickjacking protection
  // ============================================
  app.use(
    helmet.frameguard({
      action: 'deny'
    })
  );

  // ============================================
  // 🎯 Permissions Policy
  // Control browser features (helmet v7+ compatibility)
  // ============================================
  try {
    if (helmet.permissionsPolicy) {
      app.use(
        helmet.permissionsPolicy({
          permissions: {
            geolocation: ['()'],
            microphone: ['()'],
            camera: ['()'],
            payment: ['()'],
            usb: ['()'],
            magnetometer: ['()'],
            gyroscope: ['()'],
            accelerometer: ['()']
          }
        })
      );
    }
  } catch (err) {
    console.warn('⚠️  permissionsPolicy not available in this helmet version');
  }

  // ============================================
  // 🔐 Custom Security Headers
  // ============================================
  app.use((req, res, next) => {
    // Prevent browser caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Additional security headers
    res.setHeader('X-Powered-By', 'AKIG');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // API security headers
    if (req.path.startsWith('/api/')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
    }

    next();
  });

  console.log('✅ Security headers middleware initialized');
};
