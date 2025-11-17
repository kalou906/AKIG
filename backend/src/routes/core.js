/**
 * API routes for core multi-year operations
 * Handles owners, sites, tenants, contracts, payments, and status reports
 */

const express = require('express');
const pool = require('../db');

const router = Router();

// ============================================
// OWNERS
// ============================================

/**
 * GET /api/core/owners
 */
router.get('/owners', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM owners ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching owners:', error);
    res.status(500).json({ error: 'Failed to fetch owners' });
  }
});

/**
 * POST /api/core/owners
 */
router.post('/owners', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO owners (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating owner:', error);
    res.status(500).json({ error: 'Failed to create owner' });
  }
});

// ============================================
// SITES
// ============================================

/**
 * GET /api/core/sites
 */
router.get('/sites', async (req, res) => {
  try {
    const { owner_id } = req.query;
    let query = 'SELECT s.*, o.name as owner_name FROM sites s LEFT JOIN owners o ON s.owner_id = o.id';
    const params = [];

    if (owner_id) {
      query += ' WHERE s.owner_id = $1';
      params.push(owner_id);
    }

    query += ' ORDER BY s.name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

/**
 * POST /api/core/sites
 */
router.post('/sites', async (req, res) => {
  try {
    const { name, owner_id, address, city } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO sites (name, owner_id, address, city) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, owner_id || null, address, city]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// ============================================
// TENANTS
// ============================================

/**
 * GET /api/core/tenants
 */
router.get('/tenants', async (req, res) => {
  try {
    const { site_id, active } = req.query;
    let query = 'SELECT t.*, s.name as site_name FROM tenants t LEFT JOIN sites s ON t.current_site_id = s.id WHERE 1=1';
    const params = [];

    if (site_id) {
      query += ' AND t.current_site_id = $' + (params.length + 1);
      params.push(site_id);
    }

    if (active !== undefined) {
      query += ' AND t.active = $' + (params.length + 1);
      params.push(active === 'true');
    }

    query += ' ORDER BY t.full_name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

/**
 * GET /api/core/tenants/:id
 */
router.get('/tenants/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.name as site_name FROM tenants t 
       LEFT JOIN sites s ON t.current_site_id = s.id 
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

/**
 * POST /api/core/tenants
 */
router.post('/tenants', async (req, res) => {
  try {
    const { full_name, phone, email, current_site_id } = req.body;
    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await pool.query(
      'INSERT INTO tenants (full_name, phone, email, current_site_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [full_name, phone, email, current_site_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// ============================================
// CONTRACTS
// ============================================

/**
 * GET /api/core/contracts
 */
router.get('/contracts', async (req, res) => {
  try {
    const { tenant_id, status } = req.query;
    let query = `SELECT c.*, t.full_name as tenant_name, s.name as site_name, o.name as owner_name 
                FROM contracts c 
                LEFT JOIN tenants t ON c.tenant_id = t.id 
                LEFT JOIN sites s ON c.site_id = s.id 
                LEFT JOIN owners o ON c.owner_id = o.id 
                WHERE 1=1`;
    const params = [];

    if (tenant_id) {
      query += ' AND c.tenant_id = $' + (params.length + 1);
      params.push(tenant_id);
    }

    if (status) {
      query += ' AND c.status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

/**
 * POST /api/core/contracts
 */
router.post('/contracts', async (req, res) => {
  try {
    const { tenant_id, site_id, owner_id, ref, monthly_rent, periodicity, start_date, end_date, status } = req.body;

    if (!tenant_id || !monthly_rent || !start_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO contracts (tenant_id, site_id, owner_id, ref, monthly_rent, periodicity, start_date, end_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenant_id, site_id, owner_id, ref, monthly_rent, periodicity, start_date, end_date, status || 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// ============================================
// PAYMENTS
// ============================================

/**
 * GET /api/core/payments
 * Get payments with optional filtering by contract and year
 */
router.get('/payments', async (req, res) => {
  try {
    const { contract_id, tenant_id, year } = req.query;
    let query = `SELECT p.*, c.ref as contract_ref, t.full_name as tenant_name 
                FROM payments p 
                LEFT JOIN contracts c ON p.contract_id = c.id 
                LEFT JOIN tenants t ON p.tenant_id = t.id 
                WHERE 1=1`;
    const params = [];

    if (contract_id) {
      query += ' AND p.contract_id = $' + (params.length + 1);
      params.push(contract_id);
    }

    if (tenant_id) {
      query += ' AND p.tenant_id = $' + (params.length + 1);
      params.push(tenant_id);
    }

    if (year) {
      query += ' AND EXTRACT(YEAR FROM p.paid_at) = $' + (params.length + 1);
      params.push(year);
    }

    query += ' ORDER BY p.paid_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * POST /api/core/payments
 */
router.post('/payments', async (req, res) => {
  try {
    const { external_ref, tenant_id, owner_id, site_id, contract_id, paid_at, amount, mode, allocation, channel, raw_hash } = req.body;

    if (!tenant_id || !amount || !paid_at) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO payments (external_ref, tenant_id, owner_id, site_id, contract_id, paid_at, amount, mode, allocation, channel, raw_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [external_ref, tenant_id, owner_id, site_id, contract_id, paid_at, amount, mode, allocation, channel, raw_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// ============================================
// PAYMENT STATUS BY YEAR
// ============================================

/**
 * GET /api/core/payment-status-year
 * Get yearly payment status snapshot
 */
router.get('/payment-status-year', async (req, res) => {
  try {
    const { contract_id, year } = req.query;
    let query = `SELECT psy.*, c.ref as contract_ref, t.full_name as tenant_name 
                FROM payment_status_year psy 
                LEFT JOIN contracts c ON psy.contract_id = c.id 
                LEFT JOIN tenants t ON c.tenant_id = t.id 
                WHERE 1=1`;
    const params = [];

    if (contract_id) {
      query += ' AND psy.contract_id = $' + (params.length + 1);
      params.push(contract_id);
    }

    if (year) {
      query += ' AND psy.year = $' + (params.length + 1);
      params.push(year);
    }

    query += ' ORDER BY psy.year DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// ============================================
// OPERATIONS NOTES
// ============================================

/**
 * GET /api/core/ops-notes
 */
router.get('/ops-notes', async (req, res) => {
  try {
    const { tenant_id, site_id } = req.query;
    let query = `SELECT on.*, t.full_name as tenant_name, s.name as site_name 
                FROM ops_notes on 
                LEFT JOIN tenants t ON on.tenant_id = t.id 
                LEFT JOIN sites s ON on.site_id = s.id 
                WHERE 1=1`;
    const params = [];

    if (tenant_id) {
      query += ' AND on.tenant_id = $' + (params.length + 1);
      params.push(tenant_id);
    }

    if (site_id) {
      query += ' AND on.site_id = $' + (params.length + 1);
      params.push(site_id);
    }

    query += ' ORDER BY on.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ops notes:', error);
    res.status(500).json({ error: 'Failed to fetch operations notes' });
  }
});

/**
 * POST /api/core/ops-notes
 */
router.post('/ops-notes', async (req, res) => {
  try {
    const { tenant_id, site_id, note, op_type } = req.body;

    if (!tenant_id || !note) {
      return res.status(400).json({ error: 'Tenant ID and note are required' });
    }

    const result = await pool.query(
      'INSERT INTO ops_notes (tenant_id, site_id, note, op_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, site_id, note, op_type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ops note:', error);
    res.status(500).json({ error: 'Failed to create operations note' });
  }
});

module.exports = router;
