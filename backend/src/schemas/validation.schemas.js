/**
 * Schémas de Validation Joi
 * backend/src/schemas/validation.schemas.js
 */

const Joi = require('joi');

/**
 * Schémas d'authentification
 */
const authSchemas = {
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'Email est requis'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Mot de passe minimum 6 caractères',
        'any.required': 'Mot de passe est requis'
      })
  }),

  register: Joi.object({
    nom: Joi.string()
      .min(3)
      .max(100)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .min(8)
      .pattern(/[A-Z]/)
      .pattern(/[0-9]/)
      .required()
      .messages({
        'string.min': 'Mot de passe minimum 8 caractères',
        'string.pattern.base': 'Mot de passe: au moins 1 majuscule et 1 chiffre'
      }),
    role: Joi.string()
      .valid('admin', 'gestionnaire', 'comptable')
      .default('gestionnaire')
  })
};

/**
 * Schémas Locataires
 */
const tenantSchemas = {
  create: Joi.object({
    nom: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Nom minimum 3 caractères'
      }),
    email: Joi.string()
      .email()
      .optional(),
    téléphone: Joi.string()
      .pattern(/^[0-9+\-\s()]{10,}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Téléphone invalide'
      }),
    adresse: Joi.string()
      .max(255)
      .optional(),
    nif: Joi.string()
      .optional()
  }),

  update: Joi.object({
    nom: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    téléphone: Joi.string().pattern(/^[0-9+\-\s()]{10,}$/),
    adresse: Joi.string().max(255),
    nif: Joi.string()
  }).min(1).messages({
    'object.min': 'Au moins un champ à mettre à jour'
  })
};

/**
 * Schémas Contrats
 */
const contractSchemas = {
  create: Joi.object({
    numéro: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required(),
    locataireId: Joi.number()
      .integer()
      .positive()
      .required(),
    montantMensuel: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Montant doit être positif'
      }),
    dateDebut: Joi.date()
      .iso()
      .required(),
    duréeMois: Joi.number()
      .integer()
      .min(1)
      .max(60)
      .required()
      .messages({
        'number.min': 'Durée minimum 1 mois',
        'number.max': 'Durée maximum 60 mois'
      }),
    description: Joi.string()
      .max(500)
      .optional(),
    caution: Joi.number()
      .positive()
      .optional()
  }),

  update: Joi.object({
    montantMensuel: Joi.number().positive().precision(2),
    description: Joi.string().max(500),
    caution: Joi.number().positive(),
    statut: Joi.string().valid('actif', 'résilié', 'expiré')
  }).min(1)
};

/**
 * Schémas Paiements
 */
const paymentSchemas = {
  create: Joi.object({
    contratId: Joi.number()
      .integer()
      .positive()
      .required(),
    montant: Joi.number()
      .positive()
      .precision(2)
      .required(),
    date: Joi.date()
      .iso()
      .max('now')
      .required()
      .messages({
        'date.max': 'Date ne peut pas être future'
      }),
    méthode: Joi.string()
      .valid('espèces', 'virement', 'chèque', 'mobile')
      .required(),
    référence: Joi.string()
      .optional(),
    observations: Joi.string()
      .max(500)
      .optional()
  }),

  update: Joi.object({
    montant: Joi.number().positive().precision(2),
    méthode: Joi.string().valid('espèces', 'virement', 'chèque', 'mobile'),
    observations: Joi.string().max(500)
  }).min(1)
};

/**
 * Schémas Impayes
 */
const arrearsSchemas = {
  create: Joi.object({
    contratId: Joi.number()
      .integer()
      .positive()
      .required(),
    montant: Joi.number()
      .positive()
      .precision(2)
      .required(),
    période: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required()
      .messages({
        'string.pattern.base': 'Période format: YYYY-MM'
      }),
    motif: Joi.string()
      .optional()
  }),

  update: Joi.object({
    montant: Joi.number().positive().precision(2),
    statut: Joi.string()
      .valid('nouveau', 'relancé', 'résolu', 'contesté')
      .required(),
    notes: Joi.string().optional()
  }).min(1)
};

/**
 * Schémas Export
 */
const exportSchemas = {
  query: Joi.object({
    format: Joi.string()
      .valid('pdf', 'excel', 'csv')
      .default('pdf'),
    dateDebut: Joi.date().iso(),
    dateFin: Joi.date().iso().min(Joi.ref('dateDebut')),
    filtres: Joi.object().optional()
  })
};

module.exports = {
  authSchemas,
  tenantSchemas,
  contractSchemas,
  paymentSchemas,
  arrearsSchemas,
  exportSchemas
};
