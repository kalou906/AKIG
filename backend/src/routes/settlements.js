/**
 * 🔧 SETTLEMENTS ROUTES - API Endpoints pour Règlements Annuels
 * BASE: /api/settlements
 */

const express = require('express');
const router = express.Router();
const SettlementService = require('../services/SettlementService');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware d'authentification
router.use(authMiddleware);

/**
 * 💳 POST /api/settlements/annual
 * Effectuer un règlement annuel complet
 */
router.post('/annual', async (req, res) => {
  try {
    const { contract_id, settlement_year, charges, deposit_deductions, settlement_date, notes } = req.body;

    if (!contract_id || !settlement_year || !charges) {
      return res.status(400).json({
        error: 'contract_id, settlement_year et charges requis'
      });
    }

    const result = await SettlementService.performAnnualSettlement(contract_id, {
      settlement_year,
      charges,
      deposit_deductions: deposit_deductions || [],
      settlement_date,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Règlement annuel effectué',
      data: result
    });
  } catch (error) {
    logger.error('POST /settlements/annual error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📊 POST /api/settlements/provision
 * Calculer les charges provisionnelles
 */
router.post('/provision', async (req, res) => {
  try {
    const { contract_id, charge_type, monthly_amount, annual_estimated, start_date, notes } = req.body;

    if (!contract_id || !charge_type || !monthly_amount) {
      return res.status(400).json({
        error: 'contract_id, charge_type et monthly_amount requis'
      });
    }

    const provision = await SettlementService.calculateProvisioning(contract_id, {
      charge_type,
      monthly_amount,
      annual_estimated,
      start_date: start_date || new Date().toISOString().split('T')[0],
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Provisioning calculé',
      data: provision
    });
  } catch (error) {
    logger.error('POST /settlements/provision error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📋 GET /api/settlements/:contractId/report
 * Obtenir le rapport de règlement pour une année
 * Params: year (requis)
 */
router.get('/:contractId/report', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        error: 'year est requis'
      });
    }

    const report = await SettlementService.getSettlementReport(contractId, parseInt(year));

    if (!report) {
      return res.status(404).json({
        error: 'Rapport de règlement non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('GET /settlements/:contractId/report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔍 GET /api/settlements/:contractId/list
 * Lister tous les règlements d'un contrat
 * Params: status, year (optionnels)
 */
router.get('/:contractId/list', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { status, year } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (year) filters.year = parseInt(year);

    const settlements = await SettlementService.listSettlements(contractId, filters);

    res.status(200).json({
      success: true,
      count: settlements.length,
      data: settlements
    });
  } catch (error) {
    logger.error('GET /settlements/:contractId/list error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📈 GET /api/settlements/:contractId/recent-charges
 * Obtenir les charges récentes d'un contrat
 * Params: months (optionnel, défaut 12)
 */
router.get('/:contractId/recent-charges', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { months = '12' } = req.query;

    const charges = await SettlementService.getRecentCharges(contractId, parseInt(months));

    res.status(200).json({
      success: true,
      data: charges
    });
  } catch (error) {
    logger.error('GET /settlements/:contractId/recent-charges error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📄 GET /api/settlements/:contractId/statement
 * Générer un rapport de régularisation (pour impression/PDF)
 * Params: year (requis)
 */
router.get('/:contractId/statement', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        error: 'year est requis'
      });
    }

    const statement = await SettlementService.generateSettlementStatement(contractId, parseInt(year));

    res.status(200).json({
      success: true,
      data: statement
    });
  } catch (error) {
    logger.error('GET /settlements/:contractId/statement error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ PATCH /api/settlements/:id/approve
 * Marquer un règlement comme approuvé/clôturé
 */
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, approval_date, notes } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        error: 'approved_by est requis'
      });
    }

    const result = await SettlementService.approveSettlement(id, {
      approved_by,
      approval_date,
      notes
    });

    res.status(200).json({
      success: true,
      message: 'Règlement approuvé',
      data: result
    });
  } catch (error) {
    logger.error('PATCH /settlements/:id/approve error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
