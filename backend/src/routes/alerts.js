/**
 * Alerts Routes
 * backend/src/routes/alerts.js
 * 
 * API pour la gestion des alertes et notifications
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const logger = require('../services/logger');
const audit = require('../services/audit');
const {
  alertAdmins,
  alertUser,
  getUserAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  getAlertStats,
  ALERT_TYPES,
  SEVERITY_LEVELS,
  CHANNELS,
} = require('../services/alerts');

/**
 * GET /api/alerts
 * Récupère les alertes de l'utilisateur
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { unread = false, limit = 50, offset = 0 } = req.query;

    const alerts = await getUserAlerts(req.user.id, {
      unreadOnly: unread === 'true',
      limit: Math.min(parseInt(limit) || 50, 100),
      offset: parseInt(offset) || 0,
    });

    await audit.logAccess('alerts_list', {
      userId: req.user.id,
      alertCount: alerts.length,
      unreadOnly: unread === 'true',
    });

    res.json(alerts);
  } catch (error) {
    logger.error('Error fetching alerts', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

/**
 * GET /api/alerts/stats
 * Récupère les statistiques d'alertes
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await getAlertStats(req.user.id);

    await audit.logAccess('alerts_stats', { userId: req.user.id });

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching alert stats', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * GET /api/alerts/types
 * Récupère les types d'alertes disponibles
 */
router.get('/types', requireAuth, (req, res) => {
  try {
    res.json({
      types: ALERT_TYPES,
      severities: SEVERITY_LEVELS,
      channels: CHANNELS,
    });
  } catch (error) {
    logger.error('Error fetching alert types', { error: error.message });
    res.status(500).json({ error: 'Erreur' });
  }
});

/**
 * GET /api/alerts/:id
 * Récupère une alerte spécifique
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM alert_logs WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alerte non trouvée' });
    }

    await audit.logAccess('alert_view', { userId: req.user.id, alertId: id });

    res.json(rows[0]);
  } catch (error) {
    logger.error('Error fetching alert', { error: error.message });
    res.status(500).json({ error: 'Erreur' });
  }
});

/**
 * POST /api/alerts/:id/read
 * Marque une alerte comme lue
 */
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await markAlertAsRead(id, req.user.id);

    await audit.logUpdate('alert_read', { userId: req.user.id, alertId: id });

    res.json(alert);
  } catch (error) {
    logger.error('Error marking alert as read', { error: error.message });
    res.status(500).json({ error: 'Erreur' });
  }
});

/**
 * POST /api/alerts/read-all
 * Marque toutes les alertes comme lues
 */
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const result = await markAllAlertsAsRead(req.user.id);

    await audit.logUpdate('alerts_read_all', {
      userId: req.user.id,
      markedCount: result.markedCount,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error marking all alerts as read', { error: error.message });
    res.status(500).json({ error: 'Erreur' });
  }
});

/**
 * DELETE /api/alerts/:id
 * Supprime une alerte
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await deleteAlert(id, req.user.id);

    await audit.logDelete('alert_delete', { userId: req.user.id, alertId: id });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting alert', { error: error.message });
    res.status(500).json({ error: 'Erreur' });
  }
});

/**
 * POST /api/alerts/send-admin (Admin only)
 * Envoie une alerte aux admins
 */
router.post('/send-admin', requireRole('admin'), async (req, res) => {
  try {
    const { message, type, severity, channels, details } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    const result = await alertAdmins(message, {
      type: type || ALERT_TYPES.WARNING,
      severity: severity || SEVERITY_LEVELS.HIGH,
      channels: channels || [CHANNELS.EMAIL, CHANNELS.SMS],
      details: details || {},
    });

    await audit.logCreate('admin_alert_sent', {
      userId: req.user.id,
      alertsSent: result.sent,
    });

    res.json({ success: true, sent: result.sent });
  } catch (error) {
    logger.error('Error sending admin alert', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'alerte' });
  }
});

/**
 * POST /api/alerts/send-user (Admin only)
 * Envoie une alerte à un utilisateur spécifique
 */
router.post('/send-user', requireRole('admin'), async (req, res) => {
  try {
    const { userId, message, type, severity, channels } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'L\'ID utilisateur et le message sont requis' });
    }

    await alertUser(userId, message, {
      type: type || ALERT_TYPES.INFO,
      severity: severity || SEVERITY_LEVELS.LOW,
      channels: channels || [CHANNELS.IN_APP],
    });

    await audit.logCreate('user_alert_sent', {
      userId: req.user.id,
      targetUserId: userId,
    });

    res.json({ success: true, message: 'Alerte envoyée' });
  } catch (error) {
    logger.error('Error sending user alert', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'alerte' });
  }
});

/**
 * POST /api/alerts/test (Admin only)
 * Envoie une alerte de test
 */
router.post('/test', requireRole('admin'), async (req, res) => {
  try {
    const result = await alertAdmins('Ceci est une alerte de test', {
      type: ALERT_TYPES.INFO,
      severity: SEVERITY_LEVELS.LOW,
      channels: [CHANNELS.EMAIL],
      details: { test: true, timestamp: new Date().toISOString() },
      code: 'TEST_ALERT',
    });

    await audit.logCreate('test_alert_sent', { userId: req.user.id });

    res.json({ success: true, sent: result.sent });
  } catch (error) {
    logger.error('Error sending test alert', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'alerte de test' });
  }
});

/**
 * PATCH /api/alerts/preferences
 * Met à jour les préférences d'alertes
 */
router.patch('/preferences', requireAuth, async (req, res) => {
  try {
    const { channels, severity, enabled } = req.body;

    const { rows } = await pool.query(
      `UPDATE users 
       SET alert_channels = COALESCE($1, alert_channels),
           alert_severity = COALESCE($2, alert_severity),
           alerts_enabled = COALESCE($3, alerts_enabled),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING alert_channels, alert_severity, alerts_enabled`,
      [
        channels ? JSON.stringify(channels) : null,
        severity || null,
        enabled !== undefined ? enabled : null,
        req.user.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    await audit.logUpdate('alert_preferences', {
      userId: req.user.id,
      changes: { channels, severity, enabled },
    });

    res.json({
      channels: rows[0].alert_channels || [],
      severity: rows[0].alert_severity,
      enabled: rows[0].alerts_enabled,
    });
  } catch (error) {
    logger.error('Error updating alert preferences', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences' });
  }
});

/**
 * GET /api/alerts/health/critical (Admin only)
 * Récupère les alertes critiques récentes
 */
router.get('/health/critical', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        type, severity, COUNT(*) as count, MAX(created_at) as last_alert
       FROM alert_logs
       WHERE severity IN ('critical', 'high')
       AND created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY type, severity
       ORDER BY count DESC`,
    );

    res.json(rows);
  } catch (error) {
    logger.error('Error fetching critical alerts', { error: error.message });
    res.status(500).json({ error: 'Erreur' });
  }
});

module.exports = router;
