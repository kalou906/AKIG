/**
 * ============================================================
 * ⚖️ Litiges (Disputes) Module Routes - EXPERT VERSION
 * ============================================================
 * 
 * Features:
 * - Dispute/claim registration and tracking
 * - Mediation process management
 * - Arbitration workflow
 * - Decision recording and appeal tracking
 * - Document attachment
 * 
 * Endpoints:
 * GET    /api/disputes - List disputes
 * POST   /api/disputes - File new dispute
 * GET    /api/disputes/:id - Get dispute details
 * PUT    /api/disputes/:id - Update dispute
 * POST   /api/disputes/:id/mediation - Start mediation
 * POST   /api/disputes/:id/arbitration - Start arbitration
 * POST   /api/disputes/:id/decision - Record decision
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireRole } = require('../security/auth');

router.use(authMiddleware);

// ============================================================
// 📋 GET /api/disputes - List disputes
// ============================================================
router.get('/', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;

    let query = `
      SELECT 
        d.*,
        t.name as tenant_name,
        p.name as property_name,
        c.reference as contract_ref,
        COUNT(DISTINCT docs.id) as document_count
      FROM disputes d
      LEFT JOIN tenants t ON d.tenant_id = t.id
      LEFT JOIN properties p ON d.property_id = p.id
      LEFT JOIN contracts c ON d.contract_id = c.id
      LEFT JOIN dispute_documents docs ON d.id = docs.dispute_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      query += ` AND d.status = $${++paramCount}`;
      params.push(status);
    }

    query += ` GROUP BY d.id, t.name, p.name, c.reference
              ORDER BY d.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
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
// ➕ POST /api/disputes - File new dispute
// ============================================================
router.post('/', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const {
      tenant_id,
      property_id,
      contract_id,
      title,
      description,
      claim_amount,
      dispute_type  // 'property_damage', 'rent_arrears', 'lease_violation', 'refund_claim'
    } = req.body;

    if (!tenant_id || !title || !dispute_type) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id, title, and dispute_type are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO disputes (
        tenant_id, property_id, contract_id, title, description,
        claim_amount, dispute_type, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'filed', $8, NOW())
      RETURNING *`,
      [tenant_id, property_id, contract_id, title, description,
       claim_amount, dispute_type, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Dispute filed',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📄 GET /api/disputes/:id - Get dispute details
// ============================================================
router.get('/:id', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM disputes WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dispute not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ✏️ PUT /api/disputes/:id - Update dispute
// ============================================================
router.put('/:id', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const result = await pool.query(
      `UPDATE disputes 
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dispute not found' });
    }

    res.json({
      success: true,
      message: 'Dispute updated',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 🤝 POST /api/disputes/:id/mediation - Start mediation
// ============================================================
router.post('/:id/mediation', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { mediator_id, mediation_date, location } = req.body;

    if (!mediator_id || !mediation_date) {
      return res.status(400).json({
        success: false,
        error: 'mediator_id and mediation_date are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO mediations (
        dispute_id, mediator_id, mediation_date, location, status, created_at
      ) VALUES ($1, $2, $3, $4, 'scheduled', NOW())
      RETURNING *`,
      [req.params.id, mediator_id, mediation_date, location]
    );

    // Update dispute status
    await pool.query(
      `UPDATE disputes SET status = 'mediation' WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json({
      success: true,
      message: 'Mediation scheduled',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ⚖️ POST /api/disputes/:id/arbitration - Start arbitration
// ============================================================
router.post('/:id/arbitration', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { arbitrator_id, arbitration_date, arbitration_fee } = req.body;

    if (!arbitrator_id || !arbitration_date) {
      return res.status(400).json({
        success: false,
        error: 'arbitrator_id and arbitration_date are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO arbitrations (
        dispute_id, arbitrator_id, arbitration_date, arbitration_fee, 
        status, created_at
      ) VALUES ($1, $2, $3, $4, 'scheduled', NOW())
      RETURNING *`,
      [req.params.id, arbitrator_id, arbitration_date, arbitration_fee]
    );

    // Update dispute status
    await pool.query(
      `UPDATE disputes SET status = 'arbitration' WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json({
      success: true,
      message: 'Arbitration scheduled',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ✅ POST /api/disputes/:id/decision - Record decision
// ============================================================
router.post('/:id/decision', requireRole(['ADMIN']), async (req, res) => {
  try {
    const {
      decision_date,
      decision_text,
      awarded_amount,
      responsible_party,  // 'tenant', 'landlord', 'shared'
      can_appeal
    } = req.body;

    if (!decision_date || !decision_text) {
      return res.status(400).json({
        success: false,
        error: 'decision_date and decision_text are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO decisions (
        dispute_id, decision_date, decision_text, awarded_amount,
        responsible_party, can_appeal, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [req.params.id, decision_date, decision_text, awarded_amount,
       responsible_party, can_appeal || false]
    );

    // Update dispute status
    await pool.query(
      `UPDATE disputes SET status = 'decided' WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json({
      success: true,
      message: 'Decision recorded',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
