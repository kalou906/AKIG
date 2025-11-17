/**
 * Validateurs réutilisables
 * backend/src/utils/validators.js
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validateurs communes
 */
const validators = {
  // ID
  idParam: param('id')
    .isInt({ min: 1 })
    .withMessage('ID invalide'),

  // Email
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),

  // Password
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir une majuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir un chiffre'),

  // Texte
  text: (field, min = 1, max = 255) =>
    body(field)
      .trim()
      .isLength({ min, max })
      .withMessage(
        `${field} doit contenir entre ${min} et ${max} caractères`
      ),

  // Nombre
  number: (field, min = 0, max = 999999) =>
    body(field)
      .isInt({ min, max })
      .withMessage(`${field} doit être un nombre entre ${min} et ${max}`),

  // Montant monétaire
  amount: (field = 'amount') =>
    body(field)
      .isFloat({ min: 0.01 })
      .withMessage('Le montant doit être supérieur à 0'),

  // Date
  date: (field) =>
    body(field)
      .isISO8601()
      .toDate()
      .withMessage('Date invalide'),

  // URL
  url: (field) =>
    body(field)
      .isURL()
      .withMessage('URL invalide'),

  // Phone (format guinéen: +224...)
  phone: (field = 'phone') =>
    body(field)
      .matches(/^(\+224|0)[1-9]\d{7}$/)
      .withMessage('Numéro de téléphone guinéen invalide'),

  // Énumération
  enum: (field, values) =>
    body(field)
      .isIn(values)
      .withMessage(`${field} doit être l'une des valeurs: ${values.join(', ')}`),
};

/**
 * Middleware pour gérer les erreurs de validation
 */
function validationErrorHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Erreur de validation',
        details: errors.array().map((e) => ({
          field: e.param,
          message: e.msg,
          value: e.value,
        })),
      },
    });
  }
  next();
}

/**
 * Chaîne de validateurs pour l'authentification
 */
const authValidators = [
  validators.email,
  validators.password,
  validationErrorHandler,
];

/**
 * Chaîne de validateurs pour la création d'entité générique
 */
const createValidators = (fields) => {
  const chain = [];

  for (const [field, validator] of Object.entries(fields)) {
    if (typeof validator === 'function') {
      chain.push(validator(field));
    } else if (Array.isArray(validator)) {
      chain.push(...validator);
    } else {
      chain.push(validator);
    }
  }

  chain.push(validationErrorHandler);
  return chain;
};

module.exports = {
  validators,
  validationErrorHandler,
  authValidators,
  createValidators,
};
