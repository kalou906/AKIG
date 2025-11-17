/**
 * Feedback Validation Middleware
 * src/middleware/feedback.validation.js
 * 
 * Validations pour les endpoints feedback
 */

const { body, query, validationResult } = require('express-validator');

/**
 * Middleware de validation pour le feedback
 */
const validateFeedback = [
  body('score')
    .isInt({ min: 0, max: 10 })
    .withMessage('Le score doit être entre 0 et 10'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit avoir entre 5 et 100 caractères'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Le commentaire doit avoir entre 10 et 2000 caractères'),
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Une catégorie valide est requise'),
  body('typeId')
    .isInt({ min: 1 })
    .withMessage('Un type valide est requis'),
  body('agencyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'agenceId doit être un nombre'),
  body('propertyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La propertyId doit être un nombre'),
  body('tenantId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La tenantId doit être un nombre'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Middleware de validation pour les réponses au feedback
 */
const validateResponse = [
  body('responseText')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('La réponse doit avoir entre 5 et 1000 caractères'),
  body('responseType')
    .optional()
    .isIn(['reply', 'acknowledgment', 'resolution'])
    .withMessage('Type de réponse invalide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Middleware de validation pour les évaluations
 */
const validateRatings = [
  body('npsScore')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Le NPS doit être entre 0 et 10'),
  body('csatScore')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La CSAT doit être entre 1 et 5'),
  body('cesScore')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La CES doit être entre 1 et 5'),
  body('qualityScore')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La qualité doit être entre 1 et 5'),
  body('responsivenessScore')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La réactivité doit être entre 1 et 5'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Middleware de validation des filtres
 */
const validateFeedbackFilters = [
  query('status')
    .optional()
    .isIn(['new', 'acknowledged', 'resolved', 'closed'])
    .withMessage('Statut invalide'),
  query('sentiment')
    .optional()
    .isIn(['positive', 'neutral', 'negative'])
    .withMessage('Sentiment invalide'),
  query('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'critical'])
    .withMessage('Priorité invalide'),
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('CategoryId doit être un nombre'),
  query('typeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('TypeId doit être un nombre'),
  query('minScore')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('minScore doit être entre 0 et 10'),
  query('maxScore')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('maxScore doit être entre 0 et 10'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit doit être entre 1 et 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset doit être >= 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateFeedback,
  validateResponse,
  validateRatings,
  validateFeedbackFilters,
};
