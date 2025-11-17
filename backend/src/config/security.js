/**
 * Configuration de sécurité
 * backend/src/config/security.js
 */

/**
 * Headers de sécurité CORS
 */
const corsConfig = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: process.env.CORS_CREDENTIALS === 'true',
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * Configuration de rate limiting
 */
const rateLimitConfig = {
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: false,
  legacyHeaders: false,
};

/**
 * Configuration de session
 */
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
};

/**
 * Configuration JWT
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-jwt-secret',
  expiresIn: process.env.JWT_EXPIRY || '24h',
  algorithm: 'HS256',
};

/**
 * Directives Content Security Policy
 */
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
};

/**
 * Configuration Helmet (HTTP headers)
 */
const helmetConfig = {
  contentSecurityPolicy: cspConfig,
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
};

/**
 * Règles de validation Input
 */
const validationRules = {
  // Limites de taille
  maxBodySize: '10kb',
  maxJsonSize: '10kb',
  maxUrlEncodedSize: '10kb',

  // Caractères autorisés
  allowedNameChars: /^[a-zA-Z0-9\s\-àâäèéêëìîïòôöùûüçñ_]+$/,
  allowedEmailChars: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  allowedPhoneChars: /^[\d+\s\-()]+$/,

  // Longueurs
  minPasswordLength: 8,
  maxPasswordLength: 128,
  minNameLength: 3,
  maxNameLength: 100,
  maxEmailLength: 255,
};

/**
 * Liste noire d'IP (si nécessaire)
 */
const ipBlacklist = process.env.IP_BLACKLIST ? process.env.IP_BLACKLIST.split(',') : [];

/**
 * Liste blanche d'IP pour les endpoints sensibles
 */
const ipWhitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];

/**
 * Mots de passe interdits (communs)
 */
const commonPasswords = [
  'password',
  '123456',
  'admin',
  'qwerty',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
];

module.exports = {
  corsConfig,
  rateLimitConfig,
  sessionConfig,
  jwtConfig,
  cspConfig,
  helmetConfig,
  validationRules,
  ipBlacklist,
  ipWhitelist,
  commonPasswords,
};
