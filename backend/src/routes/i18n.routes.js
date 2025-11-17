/**
 * 🌍 Routes Internationalisation (i18n)
 * Endpoints pour gestion langue et traductions
 * 
 * backend/src/routes/i18n.routes.js
 */

const express = require('express');
const router = express.Router();
const i18n = require('../services/i18n.service');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/i18n/current-language
 * Récupérer la langue actuellement sélectionnée
 */
router.get('/current-language', (req, res) => {
  try {
    const language = i18n.getLanguage();
    res.json({
      success: true,
      language,
      message: `Langue actuelle: ${language}`
    });
  } catch (err) {
    console.error('Erreur récupération langue:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/i18n/set-language
 * Changer la langue
 */
router.post('/set-language', authenticate, (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'Langue requise' });
    }

    const success = i18n.setLanguage(language);

    if (!success) {
      return res.status(400).json({ error: 'Langue non supportée' });
    }

    res.json({
      success: true,
      language,
      message: `Langue changée à: ${language}`
    });
  } catch (err) {
    console.error('Erreur changement langue:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/i18n/translations
 * Récupérer toutes les traductions pour une langue
 */
router.get('/translations', (req, res) => {
  try {
    const { lang = i18n.getLanguage() } = req.query;
    const translations = i18n.getTranslations(lang);

    res.json({
      success: true,
      language: lang,
      translations,
      message: `Traductions pour la langue: ${lang}`
    });
  } catch (err) {
    console.error('Erreur récupération traductions:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/i18n/supported-languages
 * Récupérer les langues supportées
 */
router.get('/supported-languages', (req, res) => {
  try {
    const languages = Object.keys(i18n.translations);
    res.json({
      success: true,
      languages,
      current: i18n.getLanguage(),
      message: 'Langues supportées'
    });
  } catch (err) {
    console.error('Erreur langues supportées:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/i18n/translate
 * Traduire une clé spécifique
 */
router.get('/translate', (req, res) => {
  try {
    const { key, lang = i18n.getLanguage() } = req.query;

    if (!key) {
      return res.status(400).json({ error: 'Clé de traduction requise' });
    }

    const originalLang = i18n.getLanguage();
    i18n.setLanguage(lang);
    const translation = i18n.t(key);
    i18n.setLanguage(originalLang);

    res.json({
      success: true,
      key,
      language: lang,
      translation,
      message: 'Traduction récupérée'
    });
  } catch (err) {
    console.error('Erreur traduction:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/i18n/format-currency
 * Formater une devise
 */
router.post('/format-currency', (req, res) => {
  try {
    const { amount, currency = 'GNF', lang = i18n.getLanguage() } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Montant requis' });
    }

    const originalLang = i18n.getLanguage();
    i18n.setLanguage(lang);
    const formatted = i18n.formatCurrency(amount, currency);
    i18n.setLanguage(originalLang);

    res.json({
      success: true,
      original: amount,
      currency,
      formatted,
      language: lang
    });
  } catch (err) {
    console.error('Erreur formatage devise:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/i18n/format-date
 * Formater une date
 */
router.post('/format-date', (req, res) => {
  try {
    const { date, format = 'short', lang = i18n.getLanguage() } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date requise' });
    }

    const originalLang = i18n.getLanguage();
    i18n.setLanguage(lang);
    const formatted = i18n.formatDate(date, format);
    i18n.setLanguage(originalLang);

    res.json({
      success: true,
      original: date,
      format,
      formatted,
      language: lang
    });
  } catch (err) {
    console.error('Erreur formatage date:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/i18n/format-number
 * Formater un nombre
 */
router.post('/format-number', (req, res) => {
  try {
    const { number, decimals = 2, lang = i18n.getLanguage() } = req.body;

    if (number === undefined || number === null) {
      return res.status(400).json({ error: 'Nombre requis' });
    }

    const originalLang = i18n.getLanguage();
    i18n.setLanguage(lang);
    const formatted = i18n.formatNumber(number, decimals);
    i18n.setLanguage(originalLang);

    res.json({
      success: true,
      original: number,
      decimals,
      formatted,
      language: lang
    });
  } catch (err) {
    console.error('Erreur formatage nombre:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
