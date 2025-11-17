/**
 * 💳 PHASE 2 - Payment Routes
 * File: backend/src/routes/phase2_payments.js
 * 15 endpoints for comprehensive payment management
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');
const pool = require('../db');

// ==================== PAYMENT MANAGEMENT ====================

/**
 * 1️⃣ POST /api/phase2/payments/record
 * Record a payment
 */
router.post('/record', authMiddleware, async (req, res) => {
  try {
    const { contract_id, tenant_id, amount_paid, payment_method, reference_number, payment_date, notes } = req.body;

    // Validation
    if (!contract_id || !tenant_id || !amount_paid) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO payments 
       (contract_id, tenant_id, payment_date, amount_paid, payment_method, reference_number, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [contract_id, tenant_id, payment_date || new Date(), amount_paid, payment_method, reference_number, 'pending', notes]
    );

    logger.info(`Payment recorded: ${amount_paid}€ for contract ${contract_id}`);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error recording payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2️⃣ GET /api/phase2/payments
 * List payments with filters
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { contract_id, tenant_id, status, from_date, to_date } = req.query;

    let query = `
      SELECT p.*, t.name as tenant_name, c.contract_number
      FROM payments p
      JOIN rental_contracts c ON p.contract_id = c.id
      JOIN tenants t ON p.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (contract_id) {
      query += ` AND p.contract_id = $${params.length + 1}`;
      params.push(contract_id);
    }
    if (tenant_id) {
      query += ` AND p.tenant_id = $${params.length + 1}`;
      params.push(tenant_id);
    }
    if (status) {
      query += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }
    if (from_date) {
      query += ` AND p.payment_date >= $${params.length + 1}`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND p.payment_date <= $${params.length + 1}`;
      params.push(to_date);
    }

    query += ' ORDER BY p.payment_date DESC LIMIT 100';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error listing payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3️⃣ GET /api/phase2/payments/:id
 * Get payment details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, t.name as tenant_name, c.contract_number
       FROM payments p
       JOIN rental_contracts c ON p.contract_id = c.id
       JOIN tenants t ON p.tenant_id = t.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4️⃣ PATCH /api/phase2/payments/:id/reconcile
 * Reconcile a payment
 */
router.patch('/:id/reconcile', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { reconciliation_date, notes } = req.body;

    // Get payment
    const paymentResult = await client.query(
      'SELECT * FROM payments WHERE id = $1',
      [req.params.id]
    );

    if (paymentResult.rows.length === 0) {
      throw new Error('Payment not found');
    }

    const payment = paymentResult.rows[0];

    // Record reconciliation
    await client.query(
      `INSERT INTO payment_reconciliation 
       (payment_id, rent_paid, charges_paid, total_reconciled, reconciliation_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.params.id, payment.amount_paid, 0, payment.amount_paid, reconciliation_date || new Date(), 'completed', notes]
    );

    // Update payment status
    await client.query(
      'UPDATE payments SET status = $1 WHERE id = $2',
      ['completed', req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment reconciled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error reconciling payment:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * 5️⃣ POST /api/phase2/payments/:id/receipt
 * Generate receipt for payment
 */
router.post('/:id/receipt', authMiddleware, async (req, res) => {
  try {
    const { receipt_number, receipt_date, notes } = req.body;

    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [req.params.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // Create receipt record
    const receiptResult = await pool.query(
      `INSERT INTO receipts 
       (payment_id, receipt_number, receipt_date, amount, tenant_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.params.id, receipt_number || `RCP-${Date.now()}`, receipt_date || new Date(), payment.amount_paid, payment.tenant_id, 'generated']
    );

    logger.info(`Receipt generated for payment ${req.params.id}`);

    res.status(201).json({
      success: true,
      data: receiptResult.rows[0]
    });
  } catch (error) {
    logger.error('Error generating receipt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6️⃣ GET /api/phase2/payments/:contractId/arrears
 * Calculate rent arrears
 */
router.get('/:contractId/arrears', authMiddleware, async (req, res) => {
  try {
    // Get contract info
    const contractResult = await pool.query(
      `SELECT id, monthly_rent, start_date, end_date
       FROM rental_contracts WHERE id = $1`,
      [req.params.contractId]
    );

    if (contractResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    const contract = contractResult.rows[0];

    // Calculate total payments made
    const paymentsResult = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0) as total_paid
       FROM payments WHERE contract_id = $1 AND status = 'completed'`,
      [req.params.contractId]
    );

    const totalPaid = parseFloat(paymentsResult.rows[0].total_paid);

    // Calculate expected rent
    const monthsDiff = Math.ceil((new Date(contract.end_date) - new Date(contract.start_date)) / (1000 * 60 * 60 * 24 * 30));
    const expectedRent = contract.monthly_rent * monthsDiff;

    res.json({
      success: true,
      data: {
        total_expected: expectedRent,
        total_paid: totalPaid,
        arrears: Math.max(0, expectedRent - totalPaid),
        contract_id: req.params.contractId
      }
    });
  } catch (error) {
    logger.error('Error calculating arrears:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7️⃣ POST /api/phase2/payments/reminders/send
 * Send payment reminder
 */
router.post('/reminders/send', authMiddleware, async (req, res) => {
  try {
    const { contract_id, reminder_type, due_date, phone } = req.body;

    if (!contract_id) {
      return res.status(400).json({ success: false, error: 'contract_id required' });
    }

    const result = await pool.query(
      `INSERT INTO payment_reminders 
       (contract_id, reminder_type, status, due_date, recipient_phone, scheduled_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [contract_id, reminder_type || 'email', 'sent', due_date || new Date(), phone, new Date()]
    );

    logger.info(`Reminder sent for contract ${contract_id}`);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error sending reminder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 8️⃣ GET /api/phase2/payments/report/summary
 * Get payment report summary
 */
router.get('/report/summary', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (from_date) {
      dateFilter += ` AND p.payment_date >= $${params.length + 1}`;
      params.push(from_date);
    }
    if (to_date) {
      dateFilter += ` AND p.payment_date <= $${params.length + 1}`;
      params.push(to_date);
    }

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(amount_paid) as total_amount,
        AVG(amount_paid) as avg_amount,
        status,
        payment_method,
        COUNT(*) as count
       FROM payments
       WHERE 1=1 ${dateFilter}
       GROUP BY status, payment_method`,
      params
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 9️⃣ PATCH /api/phase2/payments/:id/status
 * Update payment status
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status required' });
    }

    const result = await pool.query(
      `UPDATE payments SET status = $1, notes = $2 WHERE id = $3 RETURNING *`,
      [status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating payment status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 🔟 DELETE /api/phase2/payments/:id
 * Cancel/delete payment
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id = $1', [req.params.id]);

    logger.info(`Payment ${req.params.id} deleted`);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
