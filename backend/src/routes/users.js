/**
 * Routes pour la Gestion des Utilisateurs & Rôles
 */

const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/users - Lister tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at FROM users ORDER BY name`
    );
    res.json({ ok: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/users/:userId/roles - Lister les rôles d'un utilisateur
router.get('/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.name, r.description
       FROM roles r
       WHERE r.id IN (
         SELECT DISTINCT role_id FROM user_roles WHERE user_id = $1
       )
       ORDER BY r.name`,
      [userId]
    );
    res.json({ ok: true, roles: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/users/:userId/roles - Assigner un rôle à un utilisateur
router.post('/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({ ok: false, error: 'Nom du rôle requis' });
    }

    // Récupérer le rôle
    const roleResult = await pool.query(
      `SELECT id FROM roles WHERE name = $1`,
      [roleName]
    );

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Rôle non trouvé' });
    }

    const roleId = roleResult.rows[0].id;

    // Assigner le rôle
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
       VALUES ($1, $2, NOW(), $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );

    res.json({ ok: true, message: `Rôle ${roleName} assigné à l'utilisateur` });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// DELETE /api/users/:userId/roles/:roleName - Retirer un rôle d'un utilisateur
router.delete('/:userId/roles/:roleName', async (req, res) => {
  try {
    const { userId, roleName } = req.params;

    // Récupérer le rôle
    const roleResult = await pool.query(
      `SELECT id FROM roles WHERE name = $1`,
      [roleName]
    );

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Rôle non trouvé' });
    }

    const roleId = roleResult.rows[0].id;

    // Retirer le rôle
    await pool.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );

    res.json({ ok: true, message: `Rôle ${roleName} retiré de l'utilisateur` });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/users/:userId/permissions - Lister les permissions d'un utilisateur
router.get('/:userId/permissions', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT DISTINCT p.id, p.code, p.description, p.category
       FROM permissions p
       WHERE p.id IN (
         SELECT DISTINCT permission_id FROM role_permissions
         WHERE role_id IN (
           SELECT DISTINCT role_id FROM user_roles WHERE user_id = $1
         )
       )
       ORDER BY p.category, p.code`,
      [userId]
    );
    res.json({ ok: true, permissions: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
