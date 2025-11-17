const xss = require('xss');
const { body, validationResult } = require('express-validator');

/**
 * Validate and sanitize request body
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  next();
};

/**
 * Sanitize string input to prevent XSS
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return xss(input, {
      whiteList: {}, // No HTML allowed
      stripIgnoredTag: true,
    });
  }
  return input;
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

/**
 * Middleware to sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Common validation schemas
 */
const validators = {
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),

  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
    .withMessage('Password must contain letters, numbers, and special characters'),

  name: () => body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .escape(),

  contractId: () => body('contractId')
    .isUUID()
    .withMessage('Invalid contract ID format'),

  amount: () => body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),

  phone: () => body('phone')
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
};

module.exports = {
  validateRequest,
  sanitizeInput,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  validators,
};
