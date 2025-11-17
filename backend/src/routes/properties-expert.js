/**
 * ============================================================
 * 🏘️ Propriétés Module Routes - EXPERT VERSION
 * ============================================================
 * 
 * Features:
 * - Property inventory management
 * - Unit configuration and settings
 * - Diagnostic status tracking
 * - Financial overview per property
 * - Document management (deeds, insurance, etc.)
 * 
 * Endpoints:
 * GET    /api/properties - List all properties
 * POST   /api/properties - Create property
 * GET    /api/properties/:id - Get property details
 * PUT    /api/properties/:id - Update property
 * DELETE /api/properties/:id - Delete property
 * GET    /api/properties/:id/diagnostics - Get diagnostics
 * GET    /api/properties/:id/finance - Financial summary
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireRole } = require('../security/auth');

router.use(authMiddleware);

// ============================================================
// 📋 GET /api/properties - List properties
// ============================================================
router.get('/', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { limit = 20, offset = 0, agent_id, status } = req.query;
    
    let query = `
      SELECT 
        p.*,
        COUNT(DISTINCT c.id) as active_contracts,
        COUNT(DISTINCT t.id) as tenants,
        COALESCE(SUM(py.amount), 0) as monthly_income
      FROM properties p
      LEFT JOIN contracts c ON p.id = c.property_id AND c.status = 'active'
      LEFT JOIN tenants t ON c.id = t.contract_id
      LEFT JOIN payments py ON c.id = py.contract_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (agent_id) {
      query += ` AND p.agent_id = $${++paramCount}`;
      params.push(agent_id);
    }

    if (status) {
      query += ` AND p.status = $${++paramCount}`;
      params.push(status);
    }

    query += ` GROUP BY p.id ORDER BY p.name LIMIT $${++paramCount} OFFSET $${++paramCount}`;
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
// ➕ POST /api/properties - Create property
// ============================================================
router.post('/', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { 
      name, 
      address, 
      city, 
      postal_code,
      country,
      type,
      units,
      acquisition_value,
      agent_id
    } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({ 
        success: false, 
        error: 'name, address, and city are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO properties (
        name, address, city, postal_code, country, type, units,
        acquisition_value, agent_id, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, NOW())
      RETURNING *`,
      [name, address, city, postal_code, country, type, units, 
       acquisition_value, agent_id, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Property created',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📄 GET /api/properties/:id - Get property details
// ============================================================
router.get('/:id', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM properties WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ✏️ PUT /api/properties/:id - Update property
// ============================================================
router.put('/:id', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { name, address, city, status } = req.body;
    
    const result = await pool.query(
      `UPDATE properties 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           city = COALESCE($3, city),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, address, city, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📊 GET /api/properties/:id/diagnostics - Diagnostics status
// ============================================================
router.get('/:id/diagnostics', requireRole(['AGENT', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM diagnostics 
       WHERE property_id = $1 
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
// 💰 GET /api/properties/:id/finance - Financial summary
// ============================================================
router.get('/:id/finance', requireRole(['MANAGER', 'ADMIN', 'COMPTABLE']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.acquisition_value,
        COUNT(DISTINCT c.id) as active_contracts,
        SUM(CASE WHEN py.status = 'confirmed' THEN py.amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN py.status = 'pending' THEN py.amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN py.status = 'failed' THEN py.amount ELSE 0 END) as failed_amount,
        ROUND(
          SUM(CASE WHEN py.status = 'confirmed' THEN py.amount ELSE 0 END)::float / 
          NULLIF(SUM(py.amount), 0) * 100, 2
        ) as collection_rate
      FROM properties p
      LEFT JOIN contracts c ON p.id = c.property_id
      LEFT JOIN payments py ON c.id = py.contract_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.acquisition_value`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
