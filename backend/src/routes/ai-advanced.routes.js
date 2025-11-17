/**
 * Routes IA Avancée - Agence Immobilière
 * Analyse prix, descriptions, recommandations, tendances marché
 * backend/src/routes/ai-advanced.routes.js
 */

const express = require('express');
const AIAdvancedService = require('../services/ai-advanced.service');
const logger = require('../services/logger');
const authenticate = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

/**
 * POST /api/ai/analyze-price
 * Analyser propriété et suggérer prix optimal
 */
router.post('/analyze-price', authenticate, async (req, res) => {
  try {
    const property = req.body;

    if (!property.surface || !property.rooms || !property.location) {
      return res.status(400).json({
        error: 'Données propriété incomplètes',
        required: ['surface', 'rooms', 'location']
      });
    }

    const analysis = await AIAdvancedService.analyzePriceProperty(property);

    res.json({
      success: true,
      analysis,
      message: 'Analyse prix complète'
    });
  } catch (err) {
    logger.error('Erreur analyse prix', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/generate-description
 * Générer description propriété intelligente
 */
router.post('/generate-description', authenticate, async (req, res) => {
  try {
    const property = req.body;

    if (!property.surface || !property.rooms) {
      return res.status(400).json({ error: 'Données propriété incomplètes' });
    }

    const description = await AIAdvancedService.generatePropertyDescription(property);

    res.json({
      success: true,
      description,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Erreur génération description', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/recommendations
 * Recommander propriétés similaires
 */
router.post('/recommendations', authenticate, async (req, res) => {
  try {
    const { propertyId, limit = 5 } = req.body;

    // Récupérer la propriété
    const propResult = await pool.query(
      'SELECT * FROM properties WHERE id = $1',
      [propertyId]
    );

    if (propResult.rows.length === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }

    const property = propResult.rows[0];

    // Récupérer toutes les propriétés
    const allPropsResult = await pool.query(
      'SELECT * FROM properties WHERE id != $1 LIMIT 100',
      [propertyId]
    );

    const recommendations = await AIAdvancedService.recommendSimilarProperties(
      property,
      allPropsResult.rows
    );

    res.json({
      success: true,
      originalProperty: property,
      recommendations,
      message: 'Propriétés similaires recommandées'
    });
  } catch (err) {
    logger.error('Erreur recommandations', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/market-trends
 * Analyser tendances marché immobilier guinéen
 */
router.get('/market-trends', authenticate, async (req, res) => {
  try {
    // Récupérer toutes les propriétés
    const result = await pool.query(
      'SELECT id, title, price, surface, rooms, location, property_type FROM properties LIMIT 500'
    );

    const properties = result.rows.map(p => ({
      ...p,
      propertyType: p.property_type
    }));

    const trends = await AIAdvancedService.analyzeMarketTrends(properties);

    res.json({
      success: true,
      trends,
      analysisDate: new Date().toISOString(),
      dataPoints: properties.length
    });
  } catch (err) {
    logger.error('Erreur analyse tendances', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/property-improvements
 * Suggérer améliorations pour augmenter valeur
 */
router.post('/property-improvements', authenticate, async (req, res) => {
  try {
    const property = req.body;

    if (!property.condition || !property.amenities) {
      return res.status(400).json({ error: 'Données propriété incomplètes' });
    }

    const improvements = await AIAdvancedService.suggestPropertyImprovements(property);

    res.json({
      success: true,
      improvements,
      message: 'Suggestions d\'améliorations générées'
    });
  } catch (err) {
    logger.error('Erreur suggestions améliorations', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/sales-duration
 * Prédire délai de vente propriété
 */
router.post('/sales-duration', authenticate, async (req, res) => {
  try {
    const property = req.body;

    if (!property.location || !property.price) {
      return res.status(400).json({ error: 'Données propriété incomplètes' });
    }

    const prediction = await AIAdvancedService.predictSalesDuration(property);

    res.json({
      success: true,
      prediction,
      message: 'Durée de vente estimée'
    });
  } catch (err) {
    logger.error('Erreur prédiction délai', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/market-opportunities
 * Identifier opportunités marché (prix bas vs demande)
 */
router.get('/market-opportunities', authenticate, async (req, res) => {
  try {
    // Récupérer propriétés avec faible prix pour la localisation
    const result = await pool.query(`
      SELECT 
        id, title, price, surface, rooms, location, property_type,
        price / surface as price_per_sqm
      FROM properties
      WHERE status = 'disponible'
      ORDER BY price_per_sqm ASC
      LIMIT 20
    `);

    const opportunities = result.rows.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      surface: p.surface,
      location: p.location,
      pricePerSqm: p.price_per_sqm,
      opportunityScore: Math.round((20 - result.rows.indexOf(p)) / 20 * 100),
      recommendation: (20 - result.rows.indexOf(p)) <= 5 ? 'Investir rapidement' : 'À considérer'
    }));

    res.json({
      success: true,
      opportunities,
      count: opportunities.length,
      message: 'Opportunités marché identifiées'
    });
  } catch (err) {
    logger.error('Erreur opportunités marché', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/complete-analysis
 * Analyse COMPLÈTE propriété (prix, améliorations, durée vente, etc.)
 */
router.post('/complete-analysis', authenticate, async (req, res) => {
  try {
    const property = req.body;

    if (!property.surface || !property.rooms || !property.location) {
      return res.status(400).json({ error: 'Données propriété incomplètes' });
    }

    // Paralléliser analyses
    const [
      priceAnalysis,
      description,
      improvements,
      salesDuration
    ] = await Promise.all([
      AIAdvancedService.analyzePriceProperty(property),
      AIAdvancedService.generatePropertyDescription(property),
      AIAdvancedService.suggestPropertyImprovements(property),
      AIAdvancedService.predictSalesDuration(property)
    ]);

    res.json({
      success: true,
      completeAnalysis: {
        priceAnalysis,
        description,
        improvements,
        salesDuration,
        generatedAt: new Date().toISOString(),
        confidence: '80-90%'
      },
      message: 'Analyse complète générée'
    });
  } catch (err) {
    logger.error('Erreur analyse complète', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
