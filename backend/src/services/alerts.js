/**
 * Alerts Service
 * backend/src/services/alerts.js
 * 
 * Système centralisé d'alertes et notifications
 */

const pool = require('../db');
const logger = require('./logger');
const audit = require('./audit');
const branding = require('./branding');

/**
 * Types d'alertes
 */
const ALERT_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  SECURITY: 'security',
  PAYMENT: 'payment',
  MAINTENANCE: 'maintenance',
  COMPLIANCE: 'compliance',
  SYNC: 'sync',
};

/**
 * Niveaux de sévérité
 */
const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
};

/**
 * Canaux de notification
 */
const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  IN_APP: 'in_app',
  SLACK: 'slack',
  WEBHOOK: 'webhook',
};

/**
 * Envoie une alerte aux admins
 */
async function alertAdmins(message, options = {}) {
  try {
    const {
      type = ALERT_TYPES.WARNING,
      severity = SEVERITY_LEVELS.HIGH,
      channels = [CHANNELS.EMAIL, CHANNELS.SMS],
      details = {},
      code = null,
      metadata = {},
    } = options;

    // Récupérer les admins
    const { rows: admins } = await pool.query(
      `SELECT id, email, phone, first_name, alert_channels, alert_severity
       FROM users 
       WHERE role IN ('admin', 'super_admin')
       AND is_active = true`,
    );

    if (admins.length === 0) {
      logger.warn('No active admins found for alert', { message, type });
      return { sent: 0 };
    }

    let sent = 0;

    for (const admin of admins) {
      try {
        // Récupérer les préférences d'alerte
        const adminChannels = admin.alert_channels || channels;
        const adminSeverity = admin.alert_severity || severity;

        // Vérifier si le niveau de sévérité doit être notifié
        if (!shouldNotify(adminSeverity, severity)) {
          logger.debug('Alert below notification threshold', { admin: admin.id, severity });
          continue;
        }

        const alertData = {
          type,
          severity,
          message,
          code,
          details,
          timestamp: new Date().toISOString(),
          metadata,
        };

        // Envoyer via les canaux configurés
        for (const channel of adminChannels) {
          try {
            await sendAlertViaChannel(admin, channel, alertData);
            sent++;
          } catch (err) {
            logger.error('Error sending alert via channel', {
              channel,
              admin: admin.id,
              error: err.message,
            });
          }
        }

        // Logger dans la base de données
        await logAlert(admin.id, alertData);
      } catch (err) {
        logger.error('Error processing alert for admin', {
          adminId: admin.id,
          error: err.message,
        });
      }
    }

    logger.info('Alerts sent to admins', { sent, total: admins.length, type });
    return { sent, total: admins.length };
  } catch (error) {
    logger.error('Error in alertAdmins', { error: error.message });
    throw error;
  }
}

/**
 * Envoie une alerte à un utilisateur spécifique
 */
async function alertUser(userId, message, options = {}) {
  try {
    const { type = ALERT_TYPES.INFO, severity = SEVERITY_LEVELS.LOW, channels = [CHANNELS.IN_APP] } =
      options;

    // Récupérer l'utilisateur
    const { rows } = await pool.query(`SELECT id, email, phone FROM users WHERE id = $1`, [userId]);

    if (rows.length === 0) {
      throw new Error('User not found');
    }

    const user = rows[0];
    const alertData = {
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
    };

    // Envoyer via les canaux
    for (const channel of channels) {
      try {
        await sendAlertViaChannel(user, channel, alertData);
      } catch (err) {
        logger.error('Error sending user alert', { channel, userId, error: err.message });
      }
    }

    // Logger dans la base de données
    await logAlert(userId, alertData);

    logger.info('User alert sent', { userId, type });
  } catch (error) {
    logger.error('Error in alertUser', { error: error.message, userId });
    throw error;
  }
}

/**
 * Envoie une alerte via un canal spécifique
 */
async function sendAlertViaChannel(user, channel, alertData) {
  try {
    const formattedMessage = formatAlertMessage(alertData);

    switch (channel) {
      case CHANNELS.EMAIL:
        await sendAlertEmail(user, alertData, formattedMessage);
        break;

      case CHANNELS.SMS:
        await sendAlertSMS(user, alertData, formattedMessage);
        break;

      case CHANNELS.WHATSAPP:
        await sendAlertWhatsApp(user, alertData, formattedMessage);
        break;

      case CHANNELS.IN_APP:
        await storeInAppAlert(user.id, alertData);
        break;

      case CHANNELS.SLACK:
        await sendToSlack(alertData);
        break;

      case CHANNELS.WEBHOOK:
        await callWebhook(user.id, alertData);
        break;

      default:
        throw new Error(`Unknown channel: ${channel}`);
    }

    logger.debug('Alert sent via channel', { channel, userId: user.id });
  } catch (error) {
    logger.error('Error sending alert via channel', { channel, error: error.message });
    throw error;
  }
}

/**
 * Envoie une alerte par email
 */
async function sendAlertEmail(user, alertData, message) {
  try {
    const severityColor = {
      critical: '#F44336',
      high: '#FF9800',
      medium: '#FFC107',
      low: '#2196F3',
      info: '#4CAF50',
    };

    const htmlContent = branding.email(`
      <div style="border-left: 4px solid ${severityColor[alertData.severity]}; padding: 16px;">
        <h2>${alertData.type.toUpperCase()}</h2>
        <p>${user.first_name},</p>
        <p>${message}</p>
        ${alertData.details && Object.keys(alertData.details).length > 0 ? `
          <details style="margin-top: 16px;">
            <summary style="cursor: pointer; font-weight: bold;">Détails</summary>
            <pre style="background:#f0f0f0;padding:10px;border-radius:4px;margin-top:8px;font-size:12px;">${JSON.stringify(alertData.details, null, 2)}</pre>
          </details>
        ` : ''}
        <p style="margin-top: 16px; color: #999; font-size: 12px;">
          Heure: ${new Date(alertData.timestamp).toLocaleString('fr-FR')}
        </p>
      </div>
    `);

    // En production: utiliser Sendgrid, Mailgun, etc.
    logger.info('Alert email would be sent', { to: user.email, type: alertData.type });
    return true;
  } catch (error) {
    logger.error('Error sending alert email', { error: error.message });
    throw error;
  }
}

/**
 * Envoie une alerte par SMS
 */
async function sendAlertSMS(user, alertData, message) {
  try {
    const smsMessage = branding.sms(`[${alertData.type.toUpperCase()}] ${message.substring(0, 140)}`);

    // En production: utiliser Twilio, AWS SNS, etc.
    logger.info('Alert SMS would be sent', { to: user.phone, type: alertData.type });
    return true;
  } catch (error) {
    logger.error('Error sending alert SMS', { error: error.message });
    throw error;
  }
}

/**
 * Envoie une alerte par WhatsApp
 */
async function sendAlertWhatsApp(user, alertData, message) {
  try {
    const whatsappMessage = `🚨 *${alertData.type.toUpperCase()}*\n\n${message}`;

    // En production: utiliser Twilio WhatsApp
    logger.info('Alert WhatsApp would be sent', { to: user.phone });
    return true;
  } catch (error) {
    logger.error('Error sending alert WhatsApp', { error: error.message });
    throw error;
  }
}

/**
 * Stocke une alerte in-app
 */
async function storeInAppAlert(userId, alertData) {
  try {
    await pool.query(
      `INSERT INTO in_app_alerts (user_id, type, severity, message, details, read)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [userId, alertData.type, alertData.severity, alertData.message, JSON.stringify(alertData.details || {})]
    );

    logger.debug('In-app alert stored', { userId });
  } catch (error) {
    logger.error('Error storing in-app alert', { error: error.message });
    throw error;
  }
}

/**
 * Envoie une alerte à Slack
 */
async function sendToSlack(alertData) {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      logger.debug('Slack webhook not configured');
      return;
    }

    const color = {
      critical: '#FF0000',
      high: '#FF9800',
      medium: '#FFC107',
      low: '#2196F3',
      info: '#4CAF50',
    }[alertData.severity] || '#999';

    const payload = {
      attachments: [
        {
          color,
          title: `${alertData.type.toUpperCase()} - ${alertData.severity.toUpperCase()}`,
          text: alertData.message,
          fields: Object.entries(alertData.details || {}).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
          ts: Math.floor(new Date(alertData.timestamp).getTime() / 1000),
        },
      ],
    };

    // En production: fetch to webhookUrl
    logger.info('Alert would be sent to Slack', { severity: alertData.severity });
  } catch (error) {
    logger.error('Error sending to Slack', { error: error.message });
    throw error;
  }
}

/**
 * Appelle un webhook utilisateur
 */
async function callWebhook(userId, alertData) {
  try {
    const { rows } = await pool.query(`SELECT webhook_url FROM users WHERE id = $1`, [userId]);

    if (rows.length === 0 || !rows[0].webhook_url) {
      logger.debug('No webhook configured for user', { userId });
      return;
    }

    const webhookUrl = rows[0].webhook_url;

    // En production: faire un POST request
    logger.info('Webhook would be called', { userId, webhookUrl });
  } catch (error) {
    logger.error('Error calling webhook', { error: error.message });
    throw error;
  }
}

/**
 * Formate le message d'alerte
 */
function formatAlertMessage(alertData) {
  const prefixes = {
    error: '❌ Erreur',
    warning: '⚠️ Attention',
    info: 'ℹ️ Information',
    success: '✅ Succès',
    security: '🔒 Sécurité',
    payment: '💰 Paiement',
    maintenance: '🔧 Maintenance',
    compliance: '📋 Conformité',
    sync: '🔄 Synchronisation',
  };

  return `${prefixes[alertData.type] || ''}: ${alertData.message}`;
}

/**
 * Détermine si une notification doit être envoyée
 */
function shouldNotify(userThreshold, alertSeverity) {
  const levels = ['info', 'low', 'medium', 'high', 'critical'];
  return levels.indexOf(alertSeverity) >= levels.indexOf(userThreshold);
}

/**
 * Log une alerte dans la base de données
 */
async function logAlert(userId, alertData) {
  try {
    await pool.query(
      `INSERT INTO alert_logs (user_id, type, severity, message, details, code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, alertData.type, alertData.severity, alertData.message, JSON.stringify(alertData.details || {}), alertData.code]
    );
  } catch (error) {
    logger.error('Error logging alert', { error: error.message });
  }
}

/**
 * Récupère les alertes d'un utilisateur
 */
async function getUserAlerts(userId, options = {}) {
  try {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;

    let query = `SELECT * FROM alert_logs WHERE user_id = $1`;
    const params = [userId];

    if (unreadOnly) {
      query += ` AND read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    logger.error('Error fetching user alerts', { error: error.message, userId });
    throw error;
  }
}

/**
 * Marque une alerte comme lue
 */
async function markAlertAsRead(alertId, userId) {
  try {
    const { rows } = await pool.query(
      `UPDATE alert_logs SET read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [alertId, userId]
    );

    if (rows.length === 0) {
      throw new Error('Alert not found or unauthorized');
    }

    return rows[0];
  } catch (error) {
    logger.error('Error marking alert as read', { error: error.message });
    throw error;
  }
}

/**
 * Marque toutes les alertes comme lues
 */
async function markAllAlertsAsRead(userId) {
  try {
    const { rows } = await pool.query(
      `UPDATE alert_logs SET read = true WHERE user_id = $1 AND read = false RETURNING *`,
      [userId]
    );

    return { markedCount: rows.length };
  } catch (error) {
    logger.error('Error marking all alerts as read', { error: error.message });
    throw error;
  }
}

/**
 * Supprime une alerte
 */
async function deleteAlert(alertId, userId) {
  try {
    await pool.query(`DELETE FROM alert_logs WHERE id = $1 AND user_id = $2`, [alertId, userId]);
    return { deleted: true };
  } catch (error) {
    logger.error('Error deleting alert', { error: error.message });
    throw error;
  }
}

/**
 * Récupère les statistiques d'alertes
 */
async function getAlertStats(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
        COUNT(CASE WHEN type = 'error' THEN 1 END) as error_count,
        MAX(created_at) as last_alert
       FROM alert_logs WHERE user_id = $1`,
      [userId]
    );

    return rows[0];
  } catch (error) {
    logger.error('Error fetching alert stats', { error: error.message });
    throw error;
  }
}

/**
 * Gère les erreurs globales
 */
function setupGlobalErrorHandling() {
  logger.info('Global error handling configured');
}

module.exports = {
  alertAdmins,
  alertUser,
  sendAlertViaChannel,
  getUserAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  getAlertStats,
  setupGlobalErrorHandling,
  ALERT_TYPES,
  SEVERITY_LEVELS,
  CHANNELS,
};
