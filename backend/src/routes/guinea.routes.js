/**
 * 🇬🇳 Routes Spécificités Guinéennes - AKIG
 * 
 * Endpoints pour:
 * - Devise GNF
 * - Secteurs Conakry
 * - Moyens de paiement Guinée
 */

const express = require('express');
const router = express.Router();

const GuineaCurrencyService = require('../services/GuineaCurrency.service');
const GuineaSectorsService = require('../services/GuineaSectors.service');
const GuineanPaymentService = require('../services/GuineanPayment.service');

// ============================================================
// 💶 DEVISE GUINÉENNE (GNF)
// ============================================================

/**
 * GET /api/guinea/currency/info
 * Obtenir infos devise GNF
 */
router.get('/currency/info', (req, res) => {
  try {
    const currencyInfo = GuineaCurrencyService.getCurrencyInfo();
    res.json({
      success: true,
      data: currencyInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/guinea/currency/convert
 * Convertir montants
 * Body: { from: 'USD', to: 'GNF', amount: 100 }
 */
router.post('/currency/convert', (req, res) => {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres requis: from, to, amount'
      });
    }

    let result;
    if (from === 'USD' && to === 'GNF') {
      result = GuineaCurrencyService.usdToGnf(amount);
    } else if (from === 'EUR' && to === 'GNF') {
      result = GuineaCurrencyService.eurToGnf(amount);
    } else if (from === 'GNF' && to === 'USD') {
      result = GuineaCurrencyService.gnfToUsd(amount);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Conversion non supportée'
      });
    }

    res.json({
      success: true,
      data: {
        from,
        to,
        amount,
        converted: result,
        formatted: to === 'GNF' ? GuineaCurrencyService.formatGnf(result) : result
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/currency/format/:amount
 * Formater montant en GNF
 */
router.get('/currency/format/:amount', (req, res) => {
  try {
    const { amount } = req.params;
    const formatted = GuineaCurrencyService.formatGnf(parseInt(amount));

    res.json({
      success: true,
      data: {
        amount: parseInt(amount),
        formatted: formatted
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/currency/rates
 * Obtenir taux de change actuels
 */
router.get('/currency/rates', async (req, res) => {
  try {
    const rates = await GuineaCurrencyService.fetchRealExchangeRates();
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 🏘️  SECTEURS CONAKRY
// ============================================================

/**
 * GET /api/guinea/sectors
 * Récupérer tous les secteurs Conakry
 */
router.get('/sectors', (req, res) => {
  try {
    const sectors = GuineaSectorsService.getAllSectors();
    res.json({
      success: true,
      count: sectors.length,
      data: sectors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/sectors/:id
 * Récupérer secteur spécifique
 */
router.get('/sectors/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sector = GuineaSectorsService.getSectorById(id);

    if (!sector) {
      return res.status(404).json({
        success: false,
        error: 'Secteur non trouvé'
      });
    }

    res.json({
      success: true,
      data: sector
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/sectors/:sectorId/neighborhoods
 * Obtenir quartiers d'un secteur
 */
router.get('/sectors/:sectorId/neighborhoods', (req, res) => {
  try {
    const { sectorId } = req.params;
    const neighborhoods = GuineaSectorsService.getNeighborhoods(sectorId);

    if (!neighborhoods || neighborhoods.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Secteur ou quartiers non trouvés'
      });
    }

    res.json({
      success: true,
      data: neighborhoods
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/sectors/filter/by-price?level=PREMIUM
 * Filtrer secteurs par niveau de prix
 */
router.get('/sectors/filter/by-price', (req, res) => {
  try {
    const { level } = req.query;

    if (!level) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre level requis: PREMIUM, HAUT, MOYEN, ACCESSIBLE, BUDGET'
      });
    }

    const sectors = GuineaSectorsService.filterByPriceLevel(level.toUpperCase());

    res.json({
      success: true,
      count: sectors.length,
      data: sectors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/guinea/sectors/recommend
 * Recommander secteurs selon critères
 * Body: { budget: 5000000, type: 'Résidences', minRisk: 'Faible' }
 */
router.post('/sectors/recommend', (req, res) => {
  try {
    const criteria = req.body;
    const recommended = GuineaSectorsService.recommendSectors(criteria);

    res.json({
      success: true,
      count: recommended.length,
      data: recommended
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/sectors/:sectorId/prices/:bedrooms
 * Obtenir prix moyen selon secteur et type
 */
router.get('/sectors/:sectorId/prices/:bedrooms', (req, res) => {
  try {
    const { sectorId, bedrooms } = req.params;
    const sector = GuineaSectorsService.getSectorById(sectorId);

    if (!sector) {
      return res.status(404).json({ success: false, error: 'Secteur non trouvé' });
    }

    const types = ['studio', 't2', 't3', 't4', 'villa'];
    if (!types.includes(bedrooms.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Types: studio, t2, t3, t4, villa'
      });
    }

    const price = sector.averagePrices[bedrooms.toLowerCase()];

    res.json({
      success: true,
      data: {
        sector: sector.name,
        type: bedrooms,
        price: price,
        formatted: GuineaCurrencyService.formatGnf(price),
        currency: 'GNF'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 💳 MOYENS DE PAIEMENT GUINÉE
// ============================================================

/**
 * GET /api/guinea/payments/methods
 * Obtenir tous les moyens de paiement
 */
router.get('/payments/methods', (req, res) => {
  try {
    const methods = GuineanPaymentService.getAllPaymentMethods();
    res.json({
      success: true,
      count: methods.length,
      data: methods
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/payments/methods/ui
 * Obtenir moyens de paiement pour UI
 */
router.get('/payments/methods/ui', (req, res) => {
  try {
    const methods = GuineanPaymentService.getPaymentMethodsForUI();
    res.json({
      success: true,
      count: methods.length,
      data: methods
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/payments/methods/:id
 * Obtenir détails moyen de paiement
 */
router.get('/payments/methods/:id', (req, res) => {
  try {
    const { id } = req.params;
    const method = GuineanPaymentService.getPaymentMethodById(id);

    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Moyen de paiement non trouvé'
      });
    }

    res.json({
      success: true,
      data: method
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/payments/type/:type
 * Filtrer par type de paiement
 */
router.get('/payments/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const methods = GuineanPaymentService.getPaymentsByType(type.toUpperCase());

    res.json({
      success: true,
      count: methods.length,
      data: methods
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/guinea/payments/validate
 * Valider montant pour moyen de paiement
 * Body: { methodId: 'mtn-mobile-money', amount: 100000 }
 */
router.post('/payments/validate', (req, res) => {
  try {
    const { methodId, amount } = req.body;

    if (!methodId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres requis: methodId, amount'
      });
    }

    const validation = GuineanPaymentService.isAmountValid(methodId, amount);

    res.json({
      success: validation.valid,
      data: validation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/guinea/payments/fees
 * Calculer frais pour montant
 * Body: { methodId: 'mtn-mobile-money', amount: 100000 }
 */
router.post('/payments/fees', (req, res) => {
  try {
    const { methodId, amount } = req.body;

    if (!methodId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres requis: methodId, amount'
      });
    }

    const fees = GuineanPaymentService.calculateFees(methodId, amount);

    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/payments/recommended?amount=100000
 * Obtenir moyens recommandés pour montant
 */
router.get('/payments/recommended', (req, res) => {
  try {
    const { amount } = req.query;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre amount requis'
      });
    }

    const methods = GuineanPaymentService.recommendedMethods(parseInt(amount));

    res.json({
      success: true,
      amount: parseInt(amount),
      count: methods.length,
      data: methods
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/guinea/payments/mobile-money
 * Obtenir moyens mobile money (rapides)
 */
router.get('/payments/mobile-money', (req, res) => {
  try {
    const methods = GuineanPaymentService.getMobileMoneyMethods();
    res.json({
      success: true,
      count: methods.length,
      data: methods
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/guinea/payments/process
 * Traiter paiement
 * Body: { methodId: 'mtn-mobile-money', amount: 100000, description: 'Loyer...', details: {...} }
 */
router.post('/payments/process', async (req, res) => {
  try {
    const { methodId, amount, description, details } = req.body;

    if (!methodId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres requis: methodId, amount'
      });
    }

    const result = await GuineanPaymentService.processPayment(
      methodId,
      amount,
      { description, ...details }
    );

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
