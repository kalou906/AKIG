/**
 * Routes Analytics Avancées & Dashboard Temps Réel
 * backend/src/routes/analytics-advanced.routes.js
 */

const express = require('express');
const AdvancedAnalyticsService = require('../services/analytics-advanced.service');
const RealtimeDashboardService = require('../services/realtime-dashboard.service');
const logger = require('../services/logger');
const authenticate = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/analytics/advanced/heatmap
 * Carte thermique du marché par localisation
 */
router.get('/advanced/heatmap', authenticate, async (req, res) => {
  try {
    const heatmap = await AdvancedAnalyticsService.getMarketHeatmap();
    res.json({
      success: true,
      heatmap,
      message: 'Carte thermique marché générée'
    });
  } catch (err) {
    logger.error('Erreur heatmap:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/advanced/trends
 * Prédiction des tendances prix
 */
router.get('/advanced/trends', authenticate, async (req, res) => {
  try {
    const trends = await AdvancedAnalyticsService.predictPriceTrends();
    res.json({
      success: true,
      trends,
      message: 'Tendances prix analysées'
    });
  } catch (err) {
    logger.error('Erreur tendances:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/advanced/segments
 * Segmentation par profil d'investissement
 */
router.get('/advanced/segments', authenticate, async (req, res) => {
  try {
    const segments = await AdvancedAnalyticsService.segmentByInvestmentProfile();
    res.json({
      success: true,
      segments,
      message: 'Propriétés segmentées par profil investissement'
    });
  } catch (err) {
    logger.error('Erreur segmentation:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/advanced/competitive/:propertyId
 * Analyse compétitive pour propriété
 */
router.get('/advanced/competitive/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const analysis = await AdvancedAnalyticsService.competitiveAnalysis(propertyId);
    res.json({
      success: true,
      analysis,
      message: 'Analyse compétitive générée'
    });
  } catch (err) {
    logger.error('Erreur analyse compétitive:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/analytics/advanced/portfolio-risk
 * Évaluation risque portefeuille
 */
router.post('/advanced/portfolio-risk', authenticate, async (req, res) => {
  try {
    const { properties } = req.body;
    
    if (!Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ error: 'Propriétés requises' });
    }

    const assessment = await AdvancedAnalyticsService.portfolioRiskAssessment(properties);
    res.json({
      success: true,
      assessment,
      message: 'Risque portefeuille évalué'
    });
  } catch (err) {
    logger.error('Erreur évaluation risque:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/advanced/alerts
 * Alertes marché en temps réel
 */
router.get('/advanced/alerts', authenticate, async (req, res) => {
  try {
    const alerts = await AdvancedAnalyticsService.generateMarketAlerts();
    res.json({
      success: true,
      alerts,
      count: alerts.length,
      message: 'Alertes marché générées'
    });
  } catch (err) {
    logger.error('Erreur alertes marché:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/realtime
 * Dashboard temps réel complet
 */
router.get('/realtime', authenticate, async (req, res) => {
  try {
    const metrics = await RealtimeDashboardService.getDashboardMetrics();
    res.json({
      success: true,
      dashboard: metrics,
      message: 'Dashboard temps réel généré'
    });
  } catch (err) {
    logger.error('Erreur dashboard temps réel:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/market-stats
 * Statistiques marché
 */
router.get('/market-stats', authenticate, async (req, res) => {
  try {
    const stats = await RealtimeDashboardService.getMarketStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
      message: 'Statistiques marché récupérées'
    });
  } catch (err) {
    logger.error('Erreur market stats:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/top-locations
 * Meilleures localisations
 */
router.get('/top-locations', authenticate, async (req, res) => {
  try {
    const locations = await RealtimeDashboardService.getTopLocations();
    res.json({
      success: true,
      locations,
      message: 'Meilleures localisations analysées'
    });
  } catch (err) {
    logger.error('Erreur top locations:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/performance
 * Métriques de performance
 */
router.get('/performance', authenticate, async (req, res) => {
  try {
    const performance = await RealtimeDashboardService.getPerformanceMetrics();
    res.json({
      success: true,
      performance,
      message: 'Métriques performance récupérées'
    });
  } catch (err) {
    logger.error('Erreur performance:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/activity-stream
 * Flux d'activité en temps réel
 */
router.get('/activity-stream', authenticate, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const stream = await RealtimeDashboardService.getLiveActivityStream(limit);
    res.json({
      success: true,
      stream,
      count: stream.length,
      message: 'Flux d\'activité récupéré'
    });
  } catch (err) {
    logger.error('Erreur activity stream:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/property-breakdown
 * Ventilation par type de propriété
 */
router.get('/property-breakdown', authenticate, async (req, res) => {
  try {
    const breakdown = await RealtimeDashboardService.getPropertyTypeBreakdown();
    res.json({
      success: true,
      breakdown,
      message: 'Ventilation propriétés récupérée'
    });
  } catch (err) {
    logger.error('Erreur property breakdown:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
