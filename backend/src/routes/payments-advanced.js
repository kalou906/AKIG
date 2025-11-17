// ============================================================================
// src/routes/payments-advanced.js - Gestion des paiements (idempotence, statuts)
// ============================================================================

const express = require('express');
const { requireRole, authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * POST /api/payments
 * Créer paiement (idempotent via ref unique)
 * Rôles: AGENT, MANAGER, COMPTABLE
 */
router.post('/', authMiddleware, requireRole('AGENT', 'MANAGER', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { contract_id, amount, method, notes, ref } = req.body;

  try {
    // Validation
    if (!contract_id || !amount || !method) {
      return res.status(400).json({ error: 'Missing required fields', required: ['contract_id', 'amount', 'method'] });
    }

    if (!['CASH', 'ORANGE', 'MTN', 'VIREMENT', 'CHEQUE'].includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be > 0' });
    }

    // Vérifier contract existe
    const contractCheck = await pool.query(
      'SELECT id, monthly_rent FROM contracts WHERE id = $1',
      [contract_id]
    );

    if (!contractCheck.rowCount) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const monthlyRent = contractCheck.rows[0].monthly_rent;

    // Vérifier idempotence: ref unique
    const paymentRef = ref || `PAY_${uuidv4().slice(0, 8)}_${Date.now()}`;

    const existingPayment = await pool.query(
      'SELECT id FROM payments WHERE ref = $1',
      [paymentRef]
    );

    if (existingPayment.rowCount) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        message: 'Payment already recorded with this reference',
        payment_id: existingPayment.rows[0].id
      });
    }

    // Déterminer statut
    const dueDate = new Date();
    const paidDate = new Date();
    let status = 'PAID';

    if (paidDate > dueDate) {
      status = 'LATE';
    }

    if (amount < monthlyRent) {
      status = 'PARTIAL';
    }

    // Créer paiement
    const result = await pool.query(
      `INSERT INTO payments 
       (contract_id, due_date, paid_date, amount, method, status, ref, notes)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [contract_id, paidDate, amount, method, status, paymentRef, notes || null]
    );

    // Mettre à jour scoring locataire si LATE
    if (status === 'LATE') {
      const contractData = await pool.query(
        'SELECT tenant_id FROM contracts WHERE id = $1',
        [contract_id]
      );

      if (contractData.rowCount) {
        const tenantId = contractData.rows[0].tenant_id;

        // Incrémenter risk_score
        await pool.query(
          'UPDATE tenants SET risk_score = risk_score + 0.1 WHERE id = $1',
          [tenantId]
        );
      }
    }

    res.status(201).json({
      ok: true,
      payment: result.rows[0],
      status_code: status
    });
  } catch (err) {
    console.error('[PAYMENTS] Error creating payment:', err.message);
    res.status(500).json({ error: 'Failed to create payment', details: err.message });
  }
});

/**
 * GET /api/payments?contract_id=123&status=PAID&method=MTN
 * Lister paiements avec filtres
 * Rôles: AGENT, MANAGER, COMPTABLE
 */
router.get('/', authMiddleware, requireRole('AGENT', 'MANAGER', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { contract_id, status, method, from_date, to_date } = req.query;

  try {
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (contract_id) {
      paramCount++;
      query += ` AND contract_id = $${paramCount}`;
      params.push(contract_id);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (method) {
      paramCount++;
      query += ` AND method = $${paramCount}`;
      params.push(method);
    }

    if (from_date) {
      paramCount++;
      query += ` AND paid_date >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      query += ` AND paid_date <= $${paramCount}`;
      params.push(to_date);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);

    res.json({
      count: result.rowCount,
      payments: result.rows
    });
  } catch (err) {
    console.error('[PAYMENTS] Error listing payments:', err.message);
    res.status(500).json({ error: 'Failed to list payments', details: err.message });
  }
});

/**
 * GET /api/payments/:id
 * Détail paiement
 */
router.get('/:id', authMiddleware, requireRole('AGENT', 'MANAGER', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[PAYMENTS] Error getting payment:', err.message);
    res.status(500).json({ error: 'Failed to get payment', details: err.message });
  }
});

/**
 * PUT /api/payments/:id
 * Mettre à jour paiement (status, notes)
 * Rôles: MANAGER, COMPTABLE
 */
router.put('/:id', authMiddleware, requireRole('MANAGER', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    const allowedStatuses = ['PAID', 'LATE', 'PARTIAL', 'CANCELLED'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed: allowedStatuses
      });
    }

    const query = `
      UPDATE payments
      SET status = COALESCE($1, status),
          notes = COALESCE($2, notes),
          updated_at = now()
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [status || null, notes || null, id]);

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[PAYMENTS] Error updating payment:', err.message);
    res.status(500).json({ error: 'Failed to update payment', details: err.message });
  }
});

/**
 * DELETE /api/payments/:id
 * Annuler paiement (soft delete via status CANCELLED)
 * Rôles: MANAGER, COMPTABLE
 */
router.delete('/:id', authMiddleware, requireRole('MANAGER', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE payments
       SET status = 'CANCELLED', updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ ok: true, payment: result.rows[0] });
  } catch (err) {
    console.error('[PAYMENTS] Error cancelling payment:', err.message);
    res.status(500).json({ error: 'Failed to cancel payment', details: err.message });
  }
});

module.exports = router;
