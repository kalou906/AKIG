const express = require('express');
const router = express.Router();
const pool = require('../db');
const { validateSolvabilite } = require('../utils/businessValidators');

// GET/POST /api/tenants/:id/verify-solvency
router.post('/:id/verify-solvency', async (req, res) => {
  try {
    const tenantId = Number(req.params.id);
    if (!tenantId) return res.status(400).json({ error: 'INVALID_ID' });

    // Optionally allow override monthly_rent in body
    const overrideRent = req.body?.monthly_rent ? Number(req.body.monthly_rent) : null;

    const q = `
      SELECT t.id, t.full_name, t.net_monthly_income,
             c.id as contract_id, c.monthly_rent
      FROM tenants t
      LEFT JOIN contracts c ON c.tenant_id = t.id AND c.status = 'active'
      WHERE t.id = $1
      LIMIT 1`;
    const r = await pool.query(q, [tenantId]);
    if (!r.rows.length) return res.status(404).json({ error: 'TENANT_NOT_FOUND' });

    const { net_monthly_income, monthly_rent } = r.rows[0];
    const rent = Number(overrideRent || monthly_rent || 0);
    const income = Number(net_monthly_income || 0);
    const solvable = validateSolvabilite(income, rent);

    return res.json({
      tenant_id: tenantId,
      monthly_rent: rent,
      net_monthly_income: income,
      solvable,
      rule: 'revenu >= 3 * loyer'
    });
  } catch (e) {
    console.error('verify-solvency error', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

module.exports = router;
