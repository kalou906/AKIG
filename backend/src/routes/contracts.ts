// ============================================================================
// Contracts Routes (contracts.ts)
// File: src/routes/contracts.ts
// Purpose: Contract management endpoints with permission checks
// ============================================================================

import express from 'express';
import { requireAuth, requirePerm, audit } from '../middlewares/authz';
import { applyScopes, verifyResourceScope } from '../middlewares/scopes';
import { canGenerateContract, canSendReminder } from '../policies/contracts';

const router = express.Router();

/**
 * GET /api/contracts
 * List all contracts (filtered by user scope)
 * Requires: contracts.view permission
 */
router.get('/', requireAuth, requirePerm('contracts.view'), applyScopes, async (req: any, res: any) => {
  try {
    const pool = req.app.get('pool');
    
    // Build scope-based WHERE clause
    let query = 'SELECT * FROM contracts';
    const params: any[] = [];
    
    if (req.scope?.ownerId) {
      params.push(req.scope.ownerId);
      query += ` WHERE owner_id = $${params.length}`;
    } else if (req.scope?.tenantId) {
      params.push(req.scope.tenantId);
      query += ` WHERE tenant_id = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    await audit(req, 'CONTRACTS_LIST', 'contracts', {
      count: result.rows.length,
      scoped: !!req.scope
    });
    
    res.json({ ok: true, contracts: result.rows });
  } catch (error: any) {
    await audit(req, 'CONTRACTS_LIST_ERROR', 'contracts', {
      error: error.message
    });
    res.status(500).json({
      error: 'QUERY_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * GET /api/contracts/:id
 * Get specific contract
 * Requires: contracts.view permission
 */
router.get('/:id', requireAuth, requirePerm('contracts.view'), applyScopes, async (req: any, res: any) => {
  try {
    const pool = req.app.get('pool');
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM contracts WHERE id = $1', [id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    
    const contract = result.rows[0];
    
    // Verify user has access to this contract (scope check)
    if (!verifyResourceScope(req, contract)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    
    await audit(req, 'CONTRACT_VIEW', `contract:${id}`, { tenant: contract.tenant_id });
    
    res.json({ ok: true, contract });
  } catch (error: any) {
    res.status(500).json({
      error: 'QUERY_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * POST /api/contracts/generate
 * Generate a contract from template
 * Requires: contracts.generate permission
 * Roles: PDG, AGENT
 */
router.post('/generate', requireAuth, requirePerm('contracts.generate'), async (req: any, res: any) => {
  try {
    // Verify user has permission through policy
    if (!canGenerateContract(req.user)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    
    const { template, variables, name } = req.body;
    
    if (!template || !variables) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'template and variables required' });
    }
    
    // Template variable substitution: {{tenant.name}} -> value
    const content = template.replace(/{{\s*([\w\.]+)\s*}}/g, (match: string, key: string) => {
      const parts = String(key).split('.');
      let value: any = variables;
      
      for (const part of parts) {
        value = value?.[part];
      }
      
      return value ?? `[${key}]`;
    });
    
    // Save contract to database
    const pool = req.app.get('pool');
    const result = await pool.query(
      `INSERT INTO contracts (name, content, tenant_id, owner_id, created_by, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, created_at`,
      [
        name || 'Generated Contract',
        content,
        variables?.tenant_id || null,
        variables?.owner_id || null,
        req.user.id,
        'draft'
      ]
    );
    
    const contract = result.rows[0];
    
    await audit(req, 'CONTRACT_GENERATE', `contract:${contract.id}`, {
      template: template.substring(0, 50),
      tenant: variables?.tenant_id,
      owner: variables?.owner_id
    });
    
    res.json({
      ok: true,
      contract: {
        id: contract.id,
        content,
        createdAt: contract.created_at,
        status: 'draft'
      }
    });
  } catch (error: any) {
    await audit(req, 'CONTRACT_GENERATE_ERROR', 'contracts', { error: error.message });
    res.status(500).json({
      error: 'GENERATION_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * POST /api/contracts/:id/send-reminder
 * Send payment reminder for contract
 * Requires: reminders.send permission
 * Roles: PDG, COMPTA, AGENT
 */
router.post('/:id/send-reminder', requireAuth, requirePerm('reminders.send'), async (req: any, res: any) => {
  try {
    if (!canSendReminder(req.user)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    
    const { id } = req.params;
    const { email, message } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'email required' });
    }
    
    const pool = req.app.get('pool');
    
    // Verify contract exists
    const contractResult = await pool.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (!contractResult.rows.length) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    
    // TODO: Integration with email service
    // emailService.sendReminder(email, contractResult.rows[0], message);
    
    await audit(req, 'REMINDER_SEND', `contract:${id}`, {
      recipient: email,
      messageLength: message?.length || 0
    });
    
    res.json({
      ok: true,
      message: 'Reminder sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'SEND_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

export default router;
