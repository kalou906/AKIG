/**
 * API routes for contract templates
 */

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * GET /api/contract-templates
 * Get all contract templates
 */
router.get('/', async (req, res) => {
  try {
    const { type, actif } = req.query;

    let query = 'SELECT * FROM akig_contract_templates WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (actif !== undefined) {
      query += ' AND actif = $' + (params.length + 1);
      params.push(actif === 'true');
    }

    query += ' ORDER BY type, version DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/contract-templates/:id
 * Get a specific template
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM akig_contract_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/contract-templates
 * Create a new template
 */
router.post('/', async (req, res) => {
  try {
    const { type, titre, contenu, version = '1.0' } = req.body;

    if (!type || !titre || !contenu) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO akig_contract_templates (type, titre, contenu, version, actif)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [type, titre, contenu, version]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * PUT /api/contract-templates/:id
 * Update a template
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, titre, contenu, version, actif } = req.body;

    const result = await pool.query(
      `UPDATE akig_contract_templates SET
        type = COALESCE($1, type),
        titre = COALESCE($2, titre),
        contenu = COALESCE($3, contenu),
        version = COALESCE($4, version),
        actif = COALESCE($5, actif),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [type, titre, contenu, version, actif, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/contract-templates/:id
 * Delete a template
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM akig_contract_templates WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

/**
 * GET /api/contract-templates/type/:type
 * Get templates by type
 */
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const result = await pool.query(
      'SELECT * FROM akig_contract_templates WHERE type = $1 AND actif = true ORDER BY version DESC',
      [type]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates by type:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

export default router;
