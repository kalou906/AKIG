/**
 * Routes: notifications.js
 * Gestion des notifications et alertes
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { unread_only = 'false', limit = '50' } = req.query;

    let whereClause = 'user_id = $1';
    const queryParams = [req.user.id];

    if (unread_only === 'true') {
      whereClause += ' AND is_read = false';
    }

    const result = await pool.query(
      `SELECT 
        id, notification_type, title, message, is_read, read_at,
        related_entity_type, related_entity_id, created_at
       FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${queryParams.length + 1}`,
      [...queryParams, limit]
    );

    res.json({
      notifications: result.rows,
      unreadCount: result.rows.filter((n) => !n.is_read).length,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marque une notification comme lue
 */
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Marque toutes les notifications comme lues
 */
router.put('/mark-all-read', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Supprime une notification
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/notifications/create
 * Crée une notification (admin seulement)
 */
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { notification_type, title, message, user_id, related_entity_type, related_entity_id } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (
        notification_type, title, message, user_id, related_entity_type, related_entity_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, title, notification_type`,
      [
        notification_type,
        title,
        message,
        user_id,
        related_entity_type || null,
        related_entity_id || null,
      ]
    );

    res.status(201).json({
      message: 'Notification créée',
      notification: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/notifications/statistics
 * Statistiques sur les notifications
 */
router.get('/statistics/overview', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        COUNT(DISTINCT notification_type) as types,
        COUNT(CASE WHEN notification_type = 'payment_due' THEN 1 END) as payment_reminders,
        COUNT(CASE WHEN notification_type = 'arrears' THEN 1 END) as arrears_alerts,
        COUNT(CASE WHEN notification_type = 'maintenance' THEN 1 END) as maintenance_alerts
       FROM notifications
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      statistics: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
