/**
 * Input Validation Rules
 * Fixes: Missing input sanitization (P0)
 */

const { body, param, query } = require('express-validator');

// Auth Validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
];

// Tenant Validation
const createTenantValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name required'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[0-9]{8,15}$/)
    .withMessage('Invalid phone number'),
];

// Payment Validation
const createPaymentValidation = [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be positive'),
  body('method')
    .isIn(['CASH', 'CHECK', 'TRANSFER', 'ORANGE_MONEY', 'MTN_MOBILE_MONEY', 'MERCHANT', 'CREDIT_CARD'])
    .withMessage('Invalid payment method'),
  body('contract_id')
    .isInt({ min: 1 })
    .withMessage('Valid contract ID required'),
];

// Contract Validation
const createContractValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Title required'),
  body('property_id')
    .isInt({ min: 1 })
    .withMessage('Valid property ID required'),
  body('rent_amount')
    .isFloat({ min: 0 })
    .withMessage('Rent amount must be positive'),
  body('start_date')
    .isISO8601()
    .withMessage('Valid start date required'),
  body('end_date')
    .optional()
    .isISO8601()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

// Query Validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be positive integer'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Page size must be between 1 and 100'),
];

// ID Param Validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Valid ID required'),
];

module.exports = {
  loginValidation,
  registerValidation,
  createTenantValidation,
  createPaymentValidation,
  createContractValidation,
  paginationValidation,
  idValidation,
};
