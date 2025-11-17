// ============================================================================
// Tenants Routes (tenants.ts)
// File: src/routes/tenants.ts
// Purpose: Tenant management endpoints with scoped data access
// ============================================================================

import express from 'express';
import { requireAuth, requirePerm, audit } from '../middlewares/authz';
import { applyScopes, buildScopeWhere, verifyResourceScope } from '../middlewares/scopes';
import { canViewTenant } from '../policies/contracts';

const router = express.Router();

/**
 * GET /api/tenants
 * List all tenants (filtered by user scope)
 * Requires: tenants.view permission
 *
 * Scoping:
 * - PROPRIETAIRE: Only their properties' tenants
 * - LOCATAIRE: Only their own record
 * - PDG/COMPTA/AGENT: All tenants
 */
router.get('/', requireAuth, requirePerm('tenants.view'), applyScopes, async (req: any, res: any) => {
  try {
    if (!canViewTenant(req.user)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const pool = req.app.get('pool');
    
    // Build scope-based WHERE clause
    const { whereClause, params } = buildScopeWhere(req, 'tenant', 't');
    
    let query = `
      SELECT t.id, t.email, t.phone, t.nom, t.prenom, t.owner_id, 
             t.created_at, t.updated_at,
             COUNT(c.id) as contract_count
      FROM tenants t
      LEFT JOIN contracts c ON t.id = c.tenant_id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query, params);
    
    await audit(req, 'TENANTS_LIST', 'tenants', {
      count: result.rows.length,
      scoped: !!req.scope
    });
    
    res.json({ ok: true, tenants: result.rows, total: result.rows.length });
  } catch (error: any) {
    await audit(req, 'TENANTS_LIST_ERROR', 'tenants', { error: error.message });
    res.status(500).json({
      error: 'QUERY_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * GET /api/tenants/:id
 * Get specific tenant details
 * Requires: tenants.view permission
 */
router.get('/:id', requireAuth, requirePerm('tenants.view'), applyScopes, async (req: any, res: any) => {
  try {
    const pool = req.app.get('pool');
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT t.*, COUNT(c.id) as contract_count
       FROM tenants t
       LEFT JOIN contracts c ON t.id = c.tenant_id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    
    const tenant = result.rows[0];
    
    // Verify user has access to this tenant (scope check)
    if (!verifyResourceScope(req, tenant)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    
    await audit(req, 'TENANT_VIEW', `tenant:${id}`, {});
    
    res.json({ ok: true, tenant });
  } catch (error: any) {
    res.status(500).json({
      error: 'QUERY_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * POST /api/tenants
 * Create new tenant
 * Requires: PDG or COMPTA role only
 */
router.post('/', requireAuth, requirePerm('tenants.view'), async (req: any, res: any) => {
  try {
    // Only PDG and COMPTA can create tenants
    const allowedRoles = ['PDG', 'COMPTA'];
    if (!req.user?.roles?.some((r: string) => allowedRoles.includes(r))) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const { email, phone, nom, prenom, owner_id } = req.body;
    
    if (!email || !nom) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'email and nom required' });
    }
    
    const pool = req.app.get('pool');
    
    // Check email uniqueness
    const existingResult = await pool.query('SELECT id FROM tenants WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'EMAIL_EXISTS' });
    }
    
    // Create tenant
    const result = await pool.query(
      `INSERT INTO tenants (email, phone, nom, prenom, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, created_at`,
      [email, phone || null, nom, prenom || null, owner_id || null]
    );
    
    const tenant = result.rows[0];
    
    await audit(req, 'TENANT_CREATE', `tenant:${tenant.id}`, {
      email,
      nom
    });
    
    res.status(201).json({ ok: true, tenant });
  } catch (error: any) {
    await audit(req, 'TENANT_CREATE_ERROR', 'tenants', { error: error.message });
    res.status(500).json({
      error: 'CREATE_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * PUT /api/tenants/:id
 * Update tenant
 * Requires: PDG or COMPTA role only
 */
router.put('/:id', requireAuth, requirePerm('tenants.view'), async (req: any, res: any) => {
  try {
    const allowedRoles = ['PDG', 'COMPTA'];
    if (!req.user?.roles?.some((r: string) => allowedRoles.includes(r))) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const pool = req.app.get('pool');
    const { id } = req.params;
    const { phone, nom, prenom } = req.body;
    
    // Verify tenant exists
    const getResult = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
    if (!getResult.rows.length) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    
    // Update tenant
    const updateResult = await pool.query(
      `UPDATE tenants 
       SET phone = COALESCE($1, phone), 
           nom = COALESCE($2, nom), 
           prenom = COALESCE($3, prenom),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [phone, nom, prenom, id]
    );
    
    const tenant = updateResult.rows[0];
    
    await audit(req, 'TENANT_UPDATE', `tenant:${id}`, {
      fields: ['phone', 'nom', 'prenom'].filter(f => req.body[f] !== undefined)
    });
    
    res.json({ ok: true, tenant });
  } catch (error: any) {
    res.status(500).json({
      error: 'UPDATE_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

export default router;
