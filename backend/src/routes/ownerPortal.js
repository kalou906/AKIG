/**
 * Owner Portal Routes
 * backend/src/routes/ownerPortal.js
 * 
 * Routes pour le portail propriétaire
 */

const express = require('express');
const OwnerPortalService = require('../services/ownerPortal.service');
const { authenticate } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

// Middleware pour vérifier l'authentification
router.use(authenticate);

/**
 * GET /api/owner/overview
 * Récupère l'overview du propriétaire
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await OwnerPortalService.getOwnerOverview(req.user.id);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error('Error fetching owner overview', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'overview',
    });
  }
});

/**
 * GET /api/owner/properties
 * Récupère les propriétés du propriétaire
 */
router.get('/properties', async (req, res) => {
  try {
    const properties = await OwnerPortalService.getOwnerProperties(req.user.id);

    res.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    logger.error('Error fetching owner properties', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des propriétés',
    });
  }
});

/**
 * GET /api/owner/properties/:propertyId
 * Récupère les détails d'une propriété
 */
router.get('/properties/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const details = await OwnerPortalService.getPropertyDetails(
      parseInt(propertyId),
      req.user.id
    );

    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée',
      });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    logger.error('Error fetching property details', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails',
    });
  }
});

/**
 * GET /api/owner/properties/:propertyId/cashflow
 * Récupère le cash flow d'une propriété
 */
router.get('/properties/:propertyId/cashflow', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const cashflow = await OwnerPortalService.getPropertyCashflow(
      parseInt(propertyId),
      req.user.id
    );

    if (!cashflow) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée',
      });
    }

    res.json({
      success: true,
      data: cashflow,
    });
  } catch (error) {
    logger.error('Error fetching property cashflow', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du cash flow',
    });
  }
});

/**
 * GET /api/owner/invoices
 * Récupère les factures du propriétaire
 */
router.get('/invoices', async (req, res) => {
  try {
    const { status, propertyId } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (propertyId) filters.propertyId = parseInt(propertyId);

    const invoices = await OwnerPortalService.getOwnerInvoices(req.user.id, filters);

    res.json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
  } catch (error) {
    logger.error('Error fetching owner invoices', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
    });
  }
});

/**
 * GET /api/owner/payments
 * Récupère les paiements du propriétaire
 */
router.get('/payments', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const payments = await OwnerPortalService.getOwnerPayments(
      req.user.id,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    logger.error('Error fetching owner payments', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
    });
  }
});

/**
 * GET /api/owner/stats
 * Récupère les statistiques du propriétaire
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await OwnerPortalService.getOwnerStats(req.user.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching owner stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
});

module.exports = router;
