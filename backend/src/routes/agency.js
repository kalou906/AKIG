/**
 * API routes for agency management
 */

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * GET /api/agency
 * Get agency information
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM akig_agency LIMIT 1');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching agency:', error);
    res.status(500).json({ error: 'Failed to fetch agency' });
  }
});

/**
 * PUT /api/agency
 * Update agency information
 */
router.put('/', async (req, res) => {
  try {
    const {
      nom,
      rccm,
      adresse,
      email,
      tel_pdg,
      tel_dg,
      tel_reception,
      whatsapp,
      code_marchand,
      compte_banque,
      rib,
    } = req.body;

    const result = await pool.query(
      `UPDATE akig_agency SET
        nom = COALESCE($1, nom),
        rccm = COALESCE($2, rccm),
        adresse = COALESCE($3, adresse),
        email = COALESCE($4, email),
        tel_pdg = COALESCE($5, tel_pdg),
        tel_dg = COALESCE($6, tel_dg),
        tel_reception = COALESCE($7, tel_reception),
        whatsapp = COALESCE($8, whatsapp),
        code_marchand = COALESCE($9, code_marchand),
        compte_banque = COALESCE($10, compte_banque),
        rib = COALESCE($11, rib),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [
        nom,
        rccm,
        adresse,
        email,
        tel_pdg,
        tel_dg,
        tel_reception,
        whatsapp,
        code_marchand,
        compte_banque,
        rib,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating agency:', error);
    res.status(500).json({ error: 'Failed to update agency' });
  }
});

export default router;
