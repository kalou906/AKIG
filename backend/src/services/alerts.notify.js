/**
 * Alert Notifications Service
 * Gère les notifications d'alertes via SMS, Email, Slack, PagerDuty
 * Support multi-canal avec fallback
 */

const { trace } = require('@opentelemetry/api');
const logger = require('./logger');
const { logDelivery } = require('./utils/deliveryLogger');

const tracer = trace.getTracer('alerts-notify');

// Canaux de notification disponibles
const CHANNELS = {
  SMS: 'sms',
  EMAIL: 'email',
  SLACK: 'slack',
  PAGERDUTY: 'pagerduty',
  WEBHOOK: 'webhook',
};

const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  WARNING: 'warning',
  INFO: 'info',
};

const SEVERITY_PRIORITY = {
  critical: 4,
  high: 3,
  warning: 2,
  info: 1,
};

/**
 * Envoie une notification SMS
 * @param {string} phoneNumber - Numéro téléphone
 * @param {string} message - Message à envoyer
 * @returns {Promise<Object>} Résultat d'envoi
 */
async function sendSMS(phoneNumber, message) {
  const startedAt = Date.now();
  const span = tracer.startSpan('alerts.sendSMS', {
    attributes: {
      'notification.channel': CHANNELS.SMS,
      'notification.recipient': phoneNumber,
    },
  });

  try {
    // Utiliser Twilio ou provider configuré
    const provider = process.env.SMS_PROVIDER || 'twilio';

    if (provider === 'twilio') {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      logger.info('SMS sent', {
        phone: phoneNumber,
        message_id: result.sid,
      });

      span.addEvent('sms_sent', {
        'sms.message_id': result.sid,
      });

      const payload = {
        success: true,
        channel: CHANNELS.SMS,
        message_id: result.sid,
        timestamp: new Date().toISOString(),
      };
      logDelivery({
        channel: CHANNELS.SMS,
        recipient: phoneNumber,
        template: 'twilio',
        durationMs: Date.now() - startedAt,
        success: true,
      });
      return payload;
    }

    // Fallback: mock pour développement
    logger.debug('SMS (mock)', { phone: phoneNumber, message });
    const payload = {
      success: true,
      channel: CHANNELS.SMS,
      message_id: `mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    logDelivery({
      channel: CHANNELS.SMS,
      recipient: phoneNumber,
      template: 'mock',
      durationMs: Date.now() - startedAt,
      success: true,
    });
    return payload;
  } catch (error) {
    logger.error('Error sending SMS', {
      phone: phoneNumber,
      error: error.message,
    });
    span.recordException(error);
    const payload = {
      success: false,
      channel: CHANNELS.SMS,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    logDelivery({
      channel: CHANNELS.SMS,
      recipient: phoneNumber,
      template: 'twilio',
      durationMs: Date.now() - startedAt,
      success: false,
      error: error.message,
    });
    return payload;
  } finally {
    span.end();
  }
}

/**
 * Envoie une notification Email
 * @param {string} email - Adresse email
 * @param {string} subject - Sujet
 * @param {string} message - Corps du message
 * @param {Object} options - Options {html, attachments}
 * @returns {Promise<Object>} Résultat d'envoi
 */
async function sendEmail(email, subject, message, options = {}) {
  const startedAt = Date.now();
  const span = tracer.startSpan('alerts.sendEmail', {
    attributes: {
      'notification.channel': CHANNELS.EMAIL,
      'notification.recipient': email,
    },
  });

  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || 'alerts@akig.local',
      to: email,
      subject,
      text: message,
      html: options.html || `<p>${message}</p>`,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent', {
      email,
      message_id: info.messageId,
    });

    span.addEvent('email_sent', {
      'email.message_id': info.messageId,
    });

    const payload = {
      success: true,
      channel: CHANNELS.EMAIL,
      message_id: info.messageId,
      timestamp: new Date().toISOString(),
    };
    logDelivery({
      channel: CHANNELS.EMAIL,
      recipient: email,
      template: subject,
      durationMs: Date.now() - startedAt,
      success: true,
    });
    return payload;
  } catch (error) {
    logger.error('Error sending email', {
      email,
      error: error.message,
    });
    span.recordException(error);
    const payload = {
      success: false,
      channel: CHANNELS.EMAIL,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    logDelivery({
      channel: CHANNELS.EMAIL,
      recipient: email,
      template: subject,
      durationMs: Date.now() - startedAt,
      success: false,
      error: error.message,
    });
    return payload;
  } finally {
    span.end();
  }
}

/**
 * Envoie une notification Slack
 * @param {string} channelId - ID ou nom du channel
 * @param {Object} message - Message structuré (blocks)
 * @returns {Promise<Object>} Résultat d'envoi
 */
async function sendSlack(channelId, message) {
  const span = tracer.startSpan('alerts.sendSlack', {
    attributes: {
      'notification.channel': CHANNELS.SLACK,
      'slack.channel': channelId,
    },
  });

  try {
    const { WebClient } = require('@slack/web-api');
    const client = new WebClient(process.env.SLACK_BOT_TOKEN);

    const result = await client.chat.postMessage({
      channel: channelId,
      blocks: message.blocks || [],
      text: message.text || 'Alert notification',
    });

    logger.info('Slack message sent', {
      channel: channelId,
      ts: result.ts,
    });

    span.addEvent('slack_sent', {
      'slack.ts': result.ts,
    });

    return {
      success: true,
      channel: CHANNELS.SLACK,
      message_id: result.ts,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error sending Slack message', {
      channel: channelId,
      error: error.message,
    });
    span.recordException(error);
    return {
      success: false,
      channel: CHANNELS.SLACK,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    span.end();
  }
}

/**
 * Crée une alerte PagerDuty
 * @param {Object} alert - Données d'alerte
 * @returns {Promise<Object>} Incident créé
 */
async function createPagerDutyIncident(alert) {
  const span = tracer.startSpan('alerts.createPagerDutyIncident', {
    attributes: {
      'notification.channel': CHANNELS.PAGERDUTY,
      'alert.severity': alert.severity,
    },
  });

  try {
    const axios = require('axios');

    const severity = mapSeverityToPagerDuty(alert.severity);

    const payload = {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      dedup_key: `akig-${alert.alert_name}-${Date.now()}`,
      payload: {
        summary: alert.summary,
        severity,
        source: 'AKIG Monitoring',
        custom_details: {
          description: alert.description,
          dashboard: alert.dashboard,
          runbook: alert.runbook,
          service: alert.service,
          team: alert.team,
        },
      },
    };

    const response = await axios.post(
      'https://events.pagerduty.com/v2/enqueue',
      payload
    );

    logger.info('PagerDuty incident created', {
      alert_name: alert.alert_name,
      dedup_key: payload.dedup_key,
    });

    span.addEvent('pagerduty_incident_created', {
      'pagerduty.dedup_key': payload.dedup_key,
    });

    return {
      success: true,
      channel: CHANNELS.PAGERDUTY,
      dedup_key: payload.dedup_key,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error creating PagerDuty incident', {
      error: error.message,
    });
    span.recordException(error);
    return {
      success: false,
      channel: CHANNELS.PAGERDUTY,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    span.end();
  }
}

/**
 * Mappe la sévérité AKIG en sévérité PagerDuty
 * @param {string} akigSeverity - Sévérité AKIG (critical, high, warning)
 * @returns {string} Sévérité PagerDuty
 */
function mapSeverityToPagerDuty(akigSeverity) {
  const mapping = {
    critical: 'critical',
    high: 'error',
    warning: 'warning',
    info: 'info',
  };
  return mapping[akigSeverity] || 'error';
}

/**
 * Envoie une notification via webhook personnalisé
 * @param {string} webhookUrl - URL du webhook
 * @param {Object} payload - Données à envoyer
 * @returns {Promise<Object>} Résultat d'envoi
 */
async function sendWebhook(webhookUrl, payload) {
  const span = tracer.startSpan('alerts.sendWebhook', {
    attributes: {
      'notification.channel': CHANNELS.WEBHOOK,
      'webhook.url': webhookUrl,
    },
  });

  try {
    const axios = require('axios');

    const response = await axios.post(webhookUrl, payload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AKIG-Alerts/1.0',
        'X-AKIG-Signature': generateWebhookSignature(payload),
      },
    });

    logger.info('Webhook sent', {
      url: webhookUrl,
      status: response.status,
    });

    span.addEvent('webhook_sent', {
      'webhook.status': response.status,
    });

    return {
      success: true,
      channel: CHANNELS.WEBHOOK,
      status: response.status,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error sending webhook', {
      url: webhookUrl,
      error: error.message,
    });
    span.recordException(error);
    return {
      success: false,
      channel: CHANNELS.WEBHOOK,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    span.end();
  }
}

/**
 * Génère une signature HMAC pour le webhook
 * @param {Object} payload - Données du webhook
 * @returns {string} Signature hex
 */
function generateWebhookSignature(payload) {
  const crypto = require('crypto');
  const secret = process.env.WEBHOOK_SECRET || '';
  const data = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Notifie les administrateurs d'une alerte
 * @param {object} pool - Connection PostgreSQL
 * @param {Object} alert - Données d'alerte
 * @param {Array<string>} channels - Canaux à utiliser
 * @returns {Promise<Object>} Résultats des notifications
 */
async function notifyAdmins(pool, alert, channels = [CHANNELS.EMAIL, CHANNELS.SLACK]) {
  const span = tracer.startSpan('alerts.notifyAdmins', {
    attributes: {
      'alert.name': alert.alert_name,
      'alert.severity': alert.severity,
      'channels.count': channels.length,
    },
  });

  const results = {
    alert_name: alert.alert_name,
    severity: alert.severity,
    notifications: [],
    success_count: 0,
    failure_count: 0,
  };

  try {
    // Récupérer les administrateurs avec préférences de notification
    const { rows: admins } = await pool.query(
      `SELECT id, email, phone, slack_id, notification_channels, min_severity
       FROM users
       WHERE role = 'admin' AND active = true`
    );

    logger.info('Notifying admins', {
      alert_name: alert.alert_name,
      admin_count: admins.length,
      channels,
    });

    // Notifier chaque administrateur
    for (const admin of admins) {
      // Vérifier le filtre de sévérité
      const adminMinSeverity = admin.min_severity || SEVERITY_LEVELS.INFO;
      if (SEVERITY_PRIORITY[alert.severity] < SEVERITY_PRIORITY[adminMinSeverity]) {
        logger.debug('Alert below admin severity threshold', {
          admin_id: admin.id,
          alert_severity: alert.severity,
          admin_min_severity: adminMinSeverity,
        });
        continue;
      }

      // Récupérer les canaux préférés de l'admin
      const adminChannels = admin.notification_channels || channels;

      // Envoyer via chaque canal
      for (const channel of adminChannels) {
        let result;

        try {
          if (channel === CHANNELS.EMAIL && admin.email) {
            result = await sendEmail(
              admin.email,
              `🚨 AKIG Alert: ${alert.summary}`,
              formatAlertMessage(alert),
              {
                html: formatAlertHtml(alert),
              }
            );
          } else if (channel === CHANNELS.SMS && admin.phone) {
            result = await sendSMS(
              admin.phone,
              `AKIG [${alert.severity.toUpperCase()}]: ${alert.summary}`
            );
          } else if (channel === CHANNELS.SLACK && admin.slack_id) {
            result = await sendSlack(admin.slack_id, formatAlertSlack(alert));
          } else {
            continue;
          }

          results.notifications.push({
            admin_id: admin.id,
            channel,
            ...result,
          });

          if (result.success) {
            results.success_count++;
          } else {
            results.failure_count++;
          }
        } catch (error) {
          logger.error('Error notifying admin', {
            admin_id: admin.id,
            channel,
            error: error.message,
          });
          results.notifications.push({
            admin_id: admin.id,
            channel,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          results.failure_count++;
        }
      }
    }

    // Notifier via PagerDuty si critique
    if (alert.severity === SEVERITY_LEVELS.CRITICAL) {
      const pdResult = await createPagerDutyIncident(alert);
      results.notifications.push(pdResult);
      if (pdResult.success) {
        results.success_count++;
      } else {
        results.failure_count++;
      }
    }

    span.addEvent('admins_notified', {
      'notifications.success': results.success_count,
      'notifications.failure': results.failure_count,
    });

    logger.info('Admin notification completed', {
      alert_name: alert.alert_name,
      success: results.success_count,
      failure: results.failure_count,
    });

    return results;
  } catch (error) {
    logger.error('Error notifying admins', {
      alert_name: alert.alert_name,
      error: error.message,
    });
    span.recordException(error);
    results.error = error.message;
    return results;
  } finally {
    span.end();
  }
}

/**
 * Formate un message d'alerte en texte brut
 * @param {Object} alert - Données d'alerte
 * @returns {string} Message formaté
 */
function formatAlertMessage(alert) {
  return `
AKIG ALERT - ${alert.alert_name}
Sévérité: ${alert.severity.toUpperCase()}
Résumé: ${alert.summary}
Description: ${alert.description}

Service: ${alert.service}
Équipe: ${alert.team}

Dashboard: ${alert.dashboard || 'N/A'}
Runbook: ${alert.runbook || 'N/A'}

Timestamp: ${new Date().toISOString()}
  `.trim();
}

/**
 * Formate un message d'alerte en HTML
 * @param {Object} alert - Données d'alerte
 * @returns {string} Message HTML
 */
function formatAlertHtml(alert) {
  const severityColor = {
    critical: '#dc3545',
    high: '#fd7e14',
    warning: '#ffc107',
    info: '#17a2b8',
  };

  const color = severityColor[alert.severity] || '#6c757d';

  return `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { 
      background-color: ${color}; 
      color: white; 
      padding: 20px; 
      border-radius: 5px 5px 0 0;
    }
    .content { 
      background-color: #f8f9fa; 
      padding: 20px; 
      border: 1px solid #dee2e6;
      border-radius: 0 0 5px 5px;
    }
    .field { margin: 10px 0; }
    .label { font-weight: bold; color: #495057; }
    .value { color: #212529; }
    .links { margin-top: 20px; }
    a { color: ${color}; text-decoration: none; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h2>🚨 AKIG Alert: ${alert.alert_name}</h2>
    <p>${alert.summary}</p>
  </div>
  <div class="content">
    <div class="field">
      <span class="label">Sévérité:</span>
      <span class="value">${alert.severity.toUpperCase()}</span>
    </div>
    <div class="field">
      <span class="label">Description:</span>
      <span class="value">${alert.description}</span>
    </div>
    <div class="field">
      <span class="label">Service:</span>
      <span class="value">${alert.service}</span>
    </div>
    <div class="field">
      <span class="label">Équipe:</span>
      <span class="value">${alert.team}</span>
    </div>
    <div class="links">
      ${alert.dashboard ? `<p><a href="${alert.dashboard}">📊 Dashboard</a></p>` : ''}
      ${alert.runbook ? `<p><a href="${alert.runbook}">📖 Runbook</a></p>` : ''}
    </div>
  </div>
</div>
</body>
</html>
  `.trim();
}

/**
 * Formate un message d'alerte pour Slack
 * @param {Object} alert - Données d'alerte
 * @returns {Object} Message Slack structuré
 */
function formatAlertSlack(alert) {
  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    warning: '🟡',
    info: '🔵',
  };

  const emoji = severityEmoji[alert.severity] || '❓';

  return {
    text: `${emoji} ${alert.summary}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${alert.alert_name}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Sévérité:*\n${alert.severity.toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Service:*\n${alert.service}`,
          },
          {
            type: 'mrkdwn',
            text: `*Équipe:*\n${alert.team}`,
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${new Date().toISOString()}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Résumé:* ${alert.summary}\n*Description:* ${alert.description}`,
        },
      },
      {
        type: 'actions',
        elements: [
          ...(alert.dashboard
            ? [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '📊 Dashboard',
                  },
                  url: alert.dashboard,
                },
              ]
            : []),
          ...(alert.runbook
            ? [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '📖 Runbook',
                  },
                  url: alert.runbook,
                },
              ]
            : []),
        ],
      },
    ],
  };
}

module.exports = {
  sendSMS,
  sendEmail,
  sendSlack,
  createPagerDutyIncident,
  sendWebhook,
  notifyAdmins,
  CHANNELS,
  SEVERITY_LEVELS,
};
