/**
 * Routes: rentPayments.js
 * Gestion des paiements de loyers avec génération de quittances
 */

const express = require('express');
const { validationResult, body } = require('express-validator');
const pool = require('../db');
const { requireAuth, authenticate, authorize } = require('../middleware/auth');
const logger = require('../services/logger');
const ReceiptGenerator = require('../services/receiptGenerator');
const dayjs = require('dayjs');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Middleware de validation
const validateRentPayment = [
  body('contract_id').isInt({ min: 1 }).toInt().withMessage('ID contrat invalide'),
  body('amount_paid').isFloat({ min: 0 }).toFloat().withMessage('Montant invalide'),
  body('payment_date').isISO8601().withMessage('Date invalide'),
  body('payment_method').isIn(['cash', 'bank_transfer', 'check', 'card', 'online', 'other']).withMessage('Méthode invalide'),
  body('period_start_date').optional().isISO8601().toDate(),
  body('period_end_date').optional().isISO8601().toDate(),
];

// Middleware to validate request
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/rent-payments - List all rent payments
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tenant_id, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rp.*, 
             rc.monthly_rent,
             p.name as property_name,
             t.first_name as tenant_first_name, t.last_name as tenant_last_name,
             o.company_name
      FROM rent_payments rp
      JOIN rental_contracts rc ON rp.rental_contract_id = rc.id
      JOIN properties p ON rc.property_id = p.id
      JOIN tenants t ON rp.tenant_id = t.id
      JOIN owners o ON rp.owner_id = o.id
      WHERE o.user_id = $1
    `;
    let params = [req.user.id];

    if (search) {
      query += ` AND (t.first_name ILIKE $${params.length + 1} OR t.last_name ILIKE $${params.length + 1} OR rp.reference_number ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (tenant_id) {
      query += ` AND rp.tenant_id = $${params.length + 1}`;
      params.push(tenant_id);
    }

    if (status) {
      query += ` AND rp.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY rp.payment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM rent_payments rp
      JOIN owners o ON rp.owner_id = o.id
      WHERE o.user_id = $1
    `;
    let countParams = [req.user.id];

    if (tenant_id) {
      countQuery += ` AND rp.tenant_id = $2`;
      countParams.push(tenant_id);
    }

    if (status) {
      countQuery += ` AND rp.status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Error fetching rent payments:', error);
    res.status(500).json({ success: false, message: 'Error fetching rent payments' });
  }
});

/**
 * GET /api/rent-payments/:id - Get specific rent payment
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rp.*,
              rc.monthly_rent,
              p.name as property_name,
              t.first_name as tenant_first_name, t.last_name as tenant_last_name, t.email as tenant_email,
              o.company_name
       FROM rent_payments rp
       JOIN rental_contracts rc ON rp.rental_contract_id = rc.id
       JOIN properties p ON rc.property_id = p.id
       JOIN tenants t ON rp.tenant_id = t.id
       JOIN owners o ON rp.owner_id = o.id
       WHERE rp.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rent payment not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching rent payment:', error);
    res.status(500).json({ success: false, message: 'Error fetching rent payment' });
  }
});

/**
 * POST /api/rent-payments - Create new rent payment
 */
router.post(
  '/',
  authenticate,
  body('rental_contract_id').isInt().withMessage('Valid rental contract ID required'),
  body('tenant_id').isInt().withMessage('Valid tenant ID required'),
  body('owner_id').isInt().withMessage('Valid owner ID required'),
  body('payment_date').isISO8601().withMessage('Valid payment date required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('payment_method').trim().notEmpty().withMessage('Payment method required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { rental_contract_id, tenant_id, owner_id, payment_date, amount, payment_method, reference_number, due_date, notes, generateReceipt } = req.body;

      // Verify owner belongs to user
      const ownerCheck = await pool.query('SELECT id FROM owners WHERE id = $1 AND user_id = $2', [owner_id, req.user.id]);
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Owner not found or unauthorized' });
      }

      // Verify contract belongs to owner
      const contractCheck = await pool.query(
        'SELECT id FROM rental_contracts WHERE id = $1 AND owner_id = $2 AND tenant_id = $3',
        [rental_contract_id, owner_id, tenant_id]
      );
      if (contractCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Contract not found or unauthorized' });
      }

      const result = await pool.query(
        `INSERT INTO rent_payments 
        (rental_contract_id, tenant_id, owner_id, payment_date, amount, payment_method, reference_number, due_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [rental_contract_id, tenant_id, owner_id, payment_date, amount, payment_method, reference_number, due_date, notes]
      );

      const paymentId = result.rows[0].id;

      // Generate receipt if requested
      if (generateReceipt) {
        try {
          const receiptData = await ReceiptService.generateRentReceipt(paymentId);
          result.rows[0].receipt = receiptData;
        } catch (error) {
          logger.warn('Failed to generate rent receipt:', error.message);
        }
      }

      logger.info(`Rent payment created: ${paymentId}`);
      res.status(201).json({ success: true, data: result.rows[0], message: 'Rent payment created successfully' });
    } catch (error) {
      logger.error('Error creating rent payment:', error);
      res.status(500).json({ success: false, message: 'Error creating rent payment' });
    }
  }
);

/**
 * POST /api/rent-payments/:id/receipt - Generate receipt for rent payment
 */
router.post('/:id/receipt', authenticate, async (req, res) => {
  try {
    // Verify payment belongs to user
    const paymentCheck = await pool.query(
      `SELECT rp.* FROM rent_payments rp
       JOIN owners o ON rp.owner_id = o.id
       WHERE rp.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rent payment not found' });
    }

    const receiptData = await ReceiptService.generateRentReceipt(req.params.id);
    res.json({ success: true, data: receiptData, message: 'Receipt generated successfully' });
  } catch (error) {
    logger.error('Error generating receipt:', error);
    res.status(500).json({ success: false, message: 'Error generating receipt' });
  }
});

/**
 * PUT /api/rent-payments/:id - Update rent payment
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Verify payment belongs to user
    const paymentCheck = await pool.query(
      `SELECT rp.id FROM rent_payments rp
       JOIN owners o ON rp.owner_id = o.id
       WHERE rp.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rent payment not found' });
    }

    const { amount, payment_date, payment_method, reference_number, due_date, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE rent_payments 
      SET amount = COALESCE($1, amount),
          payment_date = COALESCE($2, payment_date),
          payment_method = COALESCE($3, payment_method),
          reference_number = COALESCE($4, reference_number),
          due_date = COALESCE($5, due_date),
          status = COALESCE($6, status),
          notes = COALESCE($7, notes)
      WHERE id = $8
      RETURNING *`,
      [amount, payment_date, payment_method, reference_number, due_date, status, notes, req.params.id]
    );

    logger.info(`Rent payment updated: ${req.params.id}`);
    res.json({ success: true, data: result.rows[0], message: 'Rent payment updated successfully' });
  } catch (error) {
    logger.error('Error updating rent payment:', error);
    res.status(500).json({ success: false, message: 'Error updating rent payment' });
  }
});

/**
 * DELETE /api/rent-payments/:id - Delete rent payment
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Verify payment belongs to user
    const paymentCheck = await pool.query(
      `SELECT rp.id FROM rent_payments rp
       JOIN owners o ON rp.owner_id = o.id
       WHERE rp.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rent payment not found' });
    }

    await pool.query('DELETE FROM rent_payments WHERE id = $1', [req.params.id]);

    logger.info(`Rent payment deleted: ${req.params.id}`);
    res.json({ success: true, message: 'Rent payment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting rent payment:', error);
    res.status(500).json({ success: false, message: 'Error deleting rent payment' });
  }
});

/**
 * GET /api/rent-payments/stats/monthly - Get monthly payment statistics
 */
router.get('/stats/monthly', authenticate, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('day', rp.payment_date) as date,
        COUNT(*) as payment_count,
        SUM(rp.amount) as total_amount
       FROM rent_payments rp
       JOIN owners o ON rp.owner_id = o.id
       WHERE o.user_id = $1
       AND EXTRACT(YEAR FROM rp.payment_date) = $2
       AND EXTRACT(MONTH FROM rp.payment_date) = $3
       GROUP BY DATE_TRUNC('day', rp.payment_date)
       ORDER BY date DESC`,
      [req.user.id, year, month]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment stats' });
  }
});

module.exports = router;
