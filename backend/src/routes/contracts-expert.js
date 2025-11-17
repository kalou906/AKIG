/**
 * ============================================================
 * 📋 Contrats Module Routes - EXPERT VERSION
 * ============================================================
 * 
 * Features:
 * - Contract lifecycle management
 * - Clause templates and customization
 * - Amendment tracking
 * - Schedule management (rent dates, renewals)
 * - Document management
 * 
 * Endpoints:
 * GET    /api/contracts - List contracts
 * POST   /api/contracts - Create contract
 * GET    /api/contracts/:id - Get contract details
 * PUT    /api/contracts/:id - Update contract
 * GET    /api/contracts/:id/clauses - Get clauses
 * POST   /api/contracts/:id/amendments - Add amendment
 * GET    /api/contracts/:id/schedule - Get payment schedule
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireRole } = require('../security/auth');

router.use(authMiddleware);

// ============================================================
// 📋 GET /api/contracts - List contracts
// ============================================================
router.get('/', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, property_id } = req.query;

    let query = `
      SELECT 
        c.*,
        p.name as property_name,
        t.name as tenant_name,
        COUNT(DISTINCT am.id) as amendment_count
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN amendments am ON c.id = am.contract_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      query += ` AND c.status = $${++paramCount}`;
      params.push(status);
    }

    if (property_id) {
      query += ` AND c.property_id = $${++paramCount}`;
      params.push(property_id);
    }

    query += ` GROUP BY c.id, p.name, t.name
              ORDER BY c.start_date DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ➕ POST /api/contracts - Create contract
// ============================================================
router.post('/', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const {
      reference,
      property_id,
      tenant_id,
      start_date,
      end_date,
      monthly_rent,
      deposit_amount,
      contract_template_id
    } = req.body;

    if (!reference || !property_id || !tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'reference, property_id, and tenant_id are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO contracts (
        reference, property_id, tenant_id, start_date, end_date,
        monthly_rent, deposit_amount, contract_template_id,
        status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, NOW())
      RETURNING *`,
      [reference, property_id, tenant_id, start_date, end_date,
       monthly_rent, deposit_amount, contract_template_id, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Contract created',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📄 GET /api/contracts/:id - Get contract details
// ============================================================
router.get('/:id', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📝 GET /api/contracts/:id/clauses - Get contract clauses
// ============================================================
router.get('/:id/clauses', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM clauses WHERE contract_id = $1 ORDER BY clause_number ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📌 POST /api/contracts/:id/amendments - Add amendment
// ============================================================
router.post('/:id/amendments', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { amendment_date, description, modifications } = req.body;

    if (!amendment_date || !description) {
      return res.status(400).json({
        success: false,
        error: 'amendment_date and description are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO amendments (
        contract_id, amendment_date, description, modifications, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING *`,
      [req.params.id, amendment_date, description, JSON.stringify(modifications)]
    );

    res.status(201).json({
      success: true,
      message: 'Amendment added',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📅 GET /api/contracts/:id/schedule - Payment schedule
// ============================================================
router.get('/:id/schedule', requireRole(['AGENT', 'MANAGER', 'COMPTABLE']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM payment_schedules 
       WHERE contract_id = $1
       ORDER BY due_date ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
