// Thin compatibility layer to export feedback-specific validators and keep existing import paths
const {
  validateFeedback,
  validateResponse,
  validateRatings,
  validateFeedbackFilters,
} = require('./feedback.validation');
const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware pour valider les paramètres
 */
function validateParams(rules) {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new ValidationError('Erreur de validation', {
          errors: errors.array().map((e) => ({
            field: e.param,
            message: e.msg,
            value: e.value,
          })),
        })
      );
    }
    next();
  };
}

/**
 * Validateurs prédéfinis
 */
const commonRules = {
  // Authentification
  loginValidation: [
    body('email')
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Mot de passe requis')
      .isLength({ min: 8 })
      .withMessage('Mot de passe minimum 8 caractères'),
  ],

  registerValidation: [
    body('email')
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Mot de passe minimum 8 caractères')
      .matches(/[A-Z]/)
      .withMessage('Doit contenir une majuscule')
      .matches(/[0-9]/)
      .withMessage('Doit contenir un chiffre'),
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Nom minimum 3 caractères'),
  ],

  // Contrats
  contractValidation: [
    body('title')
      .notEmpty()
      .withMessage('Titre requis')
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('Titre entre 5 et 255 caractères'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Montant invalide'),
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Date invalide'),
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('Date invalide'),
  ],

  // Paiements
  paymentValidation: [
    body('amount')
      .notEmpty()
      .withMessage('Montant requis')
      .isFloat({ min: 0.01 })
      .withMessage('Montant doit être > 0'),
    body('reference')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Référence maximum 100 caractères'),
  ],

  // Locataires
  tenantValidation: [
    body('full_name')
      .notEmpty()
      .withMessage('Nom requis')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nom entre 3 et 100 caractères'),
    body('phone')
      .optional()
      .matches(/^(\+224|0)[1-9]\d{7}$/)
      .withMessage('Numéro de téléphone guinéen invalide'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
  ],

  // Pagination
  paginationValidation: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page doit être >= 1'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit entre 1 et 100'),
  ],

  // ID
  idValidation: param('id')
    .isInt({ min: 1 })
    .withMessage('ID invalide'),
};

// Simple validation middleware that just passes through
const validateRequest = (req, res, next) => {
  next();
};

module.exports = {
  validateParams,
  validateFeedback,
  validateResponse,
  validateRatings,
  validateFeedbackFilters,
  commonRules,
  validateRequest,
};
