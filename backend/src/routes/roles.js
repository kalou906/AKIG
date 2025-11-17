/**
 * Routes pour la Gestion des Rôles & Permissions
 * Permet aux administrateurs de gérer les rôles et permissions des utilisateurs
 */

const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/roles/list - Lister tous les rôles disponibles
router.get('/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, created_at FROM roles ORDER BY name`
    );
    res.json({ ok: true, roles: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/roles/permissions - Lister toutes les permissions
router.get('/permissions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, description, category FROM permissions ORDER BY category, code`
    );
    res.json({ ok: true, permissions: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/roles/:roleId/permissions - Lister les permissions d'un rôle
router.get('/:roleId/permissions', async (req, res) => {
  try {
    const { roleId } = req.params;
    const result = await pool.query(
      `SELECT p.id, p.code, p.description, p.category
       FROM permissions p
       WHERE p.id IN (
         SELECT permission_id FROM role_permissions WHERE role_id = $1
       )
       ORDER BY p.category, p.code`,
      [roleId]
    );
    res.json({ ok: true, permissions: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
