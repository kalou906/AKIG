/**
 * 🚀 ROUTES SUPER-SYSTÈME
 * Tout accessible en un clic
 * 
 * backend/src/routes/super-dashboard.routes.js
 */

const express = require('express');
const multer = require('multer');
const authorize = require('../middleware/authorize');
const UnifiedDashboardService = require('../services/unified-dashboard.service');
const AgencyDocumentsService = require('../services/agency-documents.service');
const BrandingService = require('../services/branding.service');
const AIImmobilierService = require('../services/ai-immobilier.service');
const logger = require('../services/logger');

const router = express.Router();

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

/**
 * SUPER-BUTTON: Récupérer TOUTES les données d'un type
 * GET /api/super-dashboard/:buttonType
 */
router.get('/:buttonType', authorize, async (req, res) => {
  try {
    const { buttonType } = req.params;
    const params = req.query;

    const data = await UnifiedDashboardService.getCompleteDataForButton(
      buttonType.toUpperCase(),
      params
    );

    res.json({
      status: 'success',
      data,
      message: `Données complètes - Type: ${buttonType}`
    });
  } catch (err) {
    logger.error('Erreur super-dashboard', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * IMPORT DOCUMENTS AGENCE
 * POST /api/super-dashboard/documents/import
 */
router.post('/documents/import', authorize, upload.single('file'), async (req, res) => {
  try {
    const { documentType, metadata } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const result = await AgencyDocumentsService.importAgencyDocument({
      type: documentType,
      file: req.file,
      metadata: JSON.parse(metadata || '{}')
    });

    res.json({
      status: 'success',
      document: result,
      message: 'Document importé avec succès'
    });
  } catch (err) {
    logger.error('Erreur import document', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPLOAD LOGO
 * POST /api/super-dashboard/branding/logo
 */
router.post('/branding/logo', authorize, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun logo fourni' });
    }

    const result = await BrandingService.uploadLogo(req.file);

    res.json({
      status: 'success',
      logo: result,
      message: 'Logo téléchargé et intégré'
    });
  } catch (err) {
    logger.error('Erreur upload logo', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * CONFIGURER THÈME COULEURS
 * POST /api/super-dashboard/branding/theme
 */
router.post('/branding/theme', authorize, async (req, res) => {
  try {
    const { colors } = req.body;

    if (!colors) {
      return res.status(400).json({ error: 'Couleurs non fournies' });
    }

    const result = await BrandingService.setColorTheme(colors);
    const css = await BrandingService.generateCustomCSS();

    res.json({
      status: 'success',
      theme: result,
      customCSS: css,
      message: 'Thème appliqué'
    });
  } catch (err) {
    logger.error('Erreur configuration thème', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PRICING ANALYSIS
 * POST /api/super-dashboard/ai/pricing
 */
router.post('/ai/pricing', authorize, async (req, res) => {
  try {
    const params = req.body;

    const result = await AIImmobilierService.analyzePricing(params);

    res.json({
      status: 'success',
      pricing: result,
      message: 'Analyse pricing complétée'
    });
  } catch (err) {
    logger.error('Erreur pricing analysis', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * TENANT DEMAND PREDICTION
 * GET /api/super-dashboard/ai/demand/:location
 */
router.get('/ai/demand/:location', authorize, async (req, res) => {
  try {
    const { location } = req.params;

    const result = await AIImmobilierService.predictTenantDemand(location);

    res.json({
      status: 'success',
      demand: result,
      message: 'Prédiction demande analysée'
    });
  } catch (err) {
    logger.error('Erreur prédiction demande', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PROPERTY IMPROVEMENT SUGGESTIONS
 * GET /api/super-dashboard/ai/improvements/:propertyId
 */
router.get('/ai/improvements/:propertyId', authorize, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const result = await AIImmobilierService.suggestPropertyImprovements(propertyId);

    res.json({
      status: 'success',
      suggestions: result,
      message: 'Suggestions d\'amélioration générées'
    });
  } catch (err) {
    logger.error('Erreur suggestions propriété', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * TENANT RISK ASSESSMENT
 * GET /api/super-dashboard/ai/risk/:tenantId
 */
router.get('/ai/risk/:tenantId', authorize, async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await AIImmobilierService.assessTenantRisk(tenantId);

    res.json({
      status: 'success',
      riskAssessment: result,
      message: 'Évaluation risque complétée'
    });
  } catch (err) {
    logger.error('Erreur évaluation risque', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * MARKET REPORT
 * GET /api/super-dashboard/ai/market
 */
router.get('/ai/market', authorize, async (req, res) => {
  try {
    const result = await AIImmobilierService.generateMarketReport();

    res.json({
      status: 'success',
      report: result,
      message: 'Rapport marché généré'
    });
  } catch (err) {
    logger.error('Erreur rapport marché', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * COMPLETE EXPORT
 * GET /api/super-dashboard/export
 */
router.get('/export', authorize, async (req, res) => {
  try {
    const data = await UnifiedDashboardService.prepareCompleteExport();

    // Envoyer comme JSON ou ZIP (selon besoin)
    res.setHeader('Content-Disposition', 'attachment; filename=AKIG-Export-' + new Date().toISOString().split('T')[0] + '.json');
    res.json(data);
  } catch (err) {
    logger.error('Erreur export', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * QUICK STATS (pour dashboard rapide)
 * GET /api/super-dashboard/stats
 */
router.get('/stats', authorize, async (req, res) => {
  try {
    const stats = await UnifiedDashboardService.getComprehensiveAnalytics();

    res.json({
      status: 'success',
      stats,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Erreur stats rapides', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
