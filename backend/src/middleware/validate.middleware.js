/**
 * Middleware de Validation Joi
 * backend/src/middleware/validate.middleware.js
 */

const { logger } = require('../services/logger.service');
const MetricsService = require('../services/metrics.service');

/**
 * Middleware de validation générique
 * @param {Joi.Schema} schema - Schéma Joi
 * @param {String} source - 'body', 'query', 'params'
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      convert: true,
      stripUnknown: true
    });

    if (error) {
      // Enregistrer erreur de validation
      const details = error.details.map(d => ({
        champ: d.path.join('.'),
        message: d.message,
        type: d.type
      }));

      // Metrics
      details.forEach(d => {
        MetricsService.recordValidationError(d.champ);
      });

      // Logging
      logger.warn('Validation échouée', {
        source,
        erreurs: details,
        path: req.path,
        userId: req.user?.id
      });

      return res.status(400).json({
        erreur: 'Validation échouée',
        détails: details
      });
    }

    // Remplacer les données validées
    req[source] = value;
    req.validatedData = value;

    next();
  };
}

/**
 * Validation body
 */
function validateBody(schema) {
  return validate(schema, 'body');
}

/**
 * Validation query
 */
function validateQuery(schema) {
  return validate(schema, 'query');
}

/**
 * Validation params
 */
function validateParams(schema) {
  return validate(schema, 'params');
}

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams
};
