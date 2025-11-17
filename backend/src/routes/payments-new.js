/**
 * 💳 Routes API - Gestion des Paiements & PDF
 */

const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const authMiddleware = require('../middleware/auth');
const fs = require('fs');

let paymentService;

const usePaymentService = (req, res, next) => {
  if (!paymentService && req.app.get('paymentService')) {
    paymentService = req.app.get('paymentService');
  }
  next();
};

router.use(usePaymentService);
router.use(authMiddleware);

/**
 * GET /api/payments
 * Lister les paiements
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      contractId: req.query.contractId,
      tenantId: req.query.tenantId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    // Obtenir les paiements depuis la DB
    const result = await paymentService.pool.query(
      'SELECT * FROM payments WHERE deleted_at IS NULL ORDER BY date DESC LIMIT $1 OFFSET $2',
      [filters.limit, (filters.page - 1) * filters.limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur GET /payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/overdue
 * Paiements en retard
 */
router.get('/overdue', async (req, res) => {
  try {
    const result = await paymentService.getOverduePayments();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur paiements en retard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/stats
 * Statistiques paiements
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await paymentService.getPaymentStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur stats paiements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/:id
 * Obtenir un paiement spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await paymentService.pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [req.params.id]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'Paiement non trouvé' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur GET /payments/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payments
 * Enregistrer un paiement
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    req.body.createdBy = req.user.id;
    const result = await paymentService.recordPayment(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur POST /payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payments/:id/apply
 * Appliquer un paiement à un contrat
 */
router.post('/:id/apply', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const result = await paymentService.applyPayment(
      req.params.id,
      req.body.contractId,
      req.user.id
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Erreur application paiement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payments/:id/receipt
 * Générer un reçu PDF
 */
router.post('/:id/receipt', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const result = await paymentService.generateReceipt(req.params.id);
    
    if (result.success) {
      // Envoyer le fichier PDF
      const file = fs.readFileSync(result.receiptPath);
      res.contentType('application/pdf');
      res.send(file);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur génération reçu:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payments/report
 * Générer un rapport PDF
 */
router.post('/report', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const filters = {
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: req.body.status,
    };

    const result = await paymentService.generatePaymentReport(filters);
    
    if (result.success) {
      const file = fs.readFileSync(result.reportPath);
      res.contentType('application/pdf');
      res.download(result.reportPath, `rapport_paiements_${new Date().toISOString()}.pdf`);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur rapport paiements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
