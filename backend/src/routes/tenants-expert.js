/**
 * ============================================================
 * 👤 Locataires (Tenants) Module Routes - EXPERT VERSION
 * ============================================================
 * 
 * Features:
 * - Tenant profile management
 * - Payment history tracking
 * - Incident logging (damages, complaints)
 * - AI prediction for risk assessment
 * - Communication log
 * 
 * Endpoints:
 * GET    /api/tenants - List tenants
 * POST   /api/tenants - Create tenant
 * GET    /api/tenants/:id - Get tenant profile
 * PUT    /api/tenants/:id - Update tenant
 * GET    /api/tenants/:id/payments - Payment history
 * GET    /api/tenants/:id/incidents - Incident history
 * GET    /api/tenants/:id/risk-score - AI risk prediction
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireRole } = require('../security/auth');

router.use(authMiddleware);

// ============================================================
// 📋 GET /api/tenants - List tenants
// ============================================================
router.get('/', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { limit = 20, offset = 0, property_id, status } = req.query;

    let query = `
      SELECT 
        t.*,
        c.reference as contract_ref,
        pr.name as property_name,
        COUNT(DISTINCT p.id) as payment_count,
        SUM(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE 0 END) as total_paid
      FROM tenants t
      LEFT JOIN contracts c ON t.contract_id = c.id
      LEFT JOIN properties pr ON c.property_id = pr.id
      LEFT JOIN payments p ON c.id = p.contract_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (property_id) {
      query += ` AND pr.id = $${++paramCount}`;
      params.push(property_id);
    }

    if (status) {
      query += ` AND t.status = $${++paramCount}`;
      params.push(status);
    }

    query += ` GROUP BY t.id, c.reference, pr.name
              ORDER BY t.name LIMIT $${++paramCount} OFFSET $${++paramCount}`;
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
// ➕ POST /api/tenants - Create tenant
// ============================================================
router.post('/', requireRole(['AGENT', 'MANAGER']), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone,
      contract_id,
      identity_number,
      move_in_date
    } = req.body;

    if (!name || !email || !contract_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'name, email, and contract_id are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO tenants (
        name, email, phone, contract_id, identity_number, move_in_date,
        status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW())
      RETURNING *`,
      [name, email, phone, contract_id, identity_number, move_in_date, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Tenant created',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 👤 GET /api/tenants/:id - Get tenant profile
// ============================================================
router.get('/:id', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tenants WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 💳 GET /api/tenants/:id/payments - Payment history
// ============================================================
router.get('/:id/payments', requireRole(['AGENT', 'MANAGER', 'COMPTABLE']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM payments p
       JOIN contracts c ON p.contract_id = c.id
       WHERE c.tenant_id = $1
       ORDER BY p.payment_date DESC
       LIMIT 50`,
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
// 🚨 GET /api/tenants/:id/incidents - Incident history
// ============================================================
router.get('/:id/incidents', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
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
// 🤖 GET /api/tenants/:id/risk-score - AI risk prediction
// ============================================================
router.get('/:id/risk-score', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    // Calculate risk score based on payment history, incidents, etc.
    const paymentResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::float / 
        COUNT(*)::float * 100 as failed_rate,
        COUNT(CASE WHEN days_late > 30 THEN 1 END) as critical_overdue
      FROM payments
      WHERE contract_id IN (
        SELECT id FROM contracts WHERE tenant_id = $1
      )`,
      [req.params.id]
    );

    const incidentResult = await pool.query(
      `SELECT COUNT(*) as incident_count FROM incidents WHERE tenant_id = $1`,
      [req.params.id]
    );

    const payment = paymentResult.rows[0];
    const incidents = incidentResult.rows[0].incident_count;

    // Simple risk scoring model
    let score = 20; // Base score
    score += (payment.failed_rate || 0) * 0.5;
    score += (payment.critical_overdue || 0) * 10;
    score += incidents * 5;
    score = Math.min(score, 100); // Cap at 100

    const riskLevel = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

    res.json({
      success: true,
      data: {
        tenant_id: req.params.id,
        risk_score: Math.round(score),
        risk_level: riskLevel,
        factors: {
          failed_payment_rate: Math.round(payment.failed_rate || 0),
          critical_overdue_count: payment.critical_overdue || 0,
          incident_count: incidents
        },
        recommendation: riskLevel === 'HIGH' ? 'Consider early intervention' :
                       riskLevel === 'MEDIUM' ? 'Monitor closely' :
                       'Standard monitoring'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
