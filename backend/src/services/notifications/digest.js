/**
 * Notification Digest Service
 * backend/src/services/notifications/digest.js
 * 
 * Service pour agrégation et envoi de notifications en digest
 */

const pool = require('../../db');
const logger = require('../logger');
const branding = require('../branding');

/**
 * Cache simplifié en mémoire pour les digests (en production, utiliser Redis)
 */
const digestStore = new Map();

/**
 * Enqueue un événement dans le digest d'un utilisateur
 */
async function enqueueEvent(userId, event) {
  try {
    const key = `digest:${userId}`;

    if (!digestStore.has(key)) {
      digestStore.set(key, []);
    }

    const events = digestStore.get(key);
    events.push({
      ...event,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9),
    });

    logger.debug('Event enqueued for digest', { userId, eventType: event.type });
  } catch (error) {
    logger.error('Error enqueueing digest event', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère tous les événements du digest
 */
function getDigestEvents(userId) {
  const key = `digest:${userId}`;
  return digestStore.get(key) || [];
}

/**
 * Envoie le digest et vide la queue
 */
async function flushDigest(userId, preferences = {}) {
  try {
    const key = `digest:${userId}`;
    const events = getDigestEvents(userId);

    if (events.length === 0) {
      logger.debug('No events in digest', { userId });
      return { success: true, eventsCount: 0 };
    }

    // Récupérer l'utilisateur
    const userResult = await pool.query(
      `SELECT id, first_name, last_name, email FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const channel = preferences.channel || 'email';
    const digestType = preferences.digestType || 'daily';

    // Grouper les événements par type
    const groupedEvents = groupEventsByType(events);

    // Créer le message du digest
    const digestMessage = createDigestMessage(user, groupedEvents, digestType);

    // Envoyer selon le canal
    switch (channel) {
      case 'email':
        await sendDigestEmail(user, digestMessage, events.length);
        break;
      case 'sms':
        await sendDigestSMS(user, digestMessage.summary);
        break;
      case 'whatsapp':
        await sendDigestWhatsApp(user, digestMessage.summary);
        break;
      case 'in_app':
        await storeInAppNotification(userId, digestMessage);
        break;
      default:
        await sendDigestEmail(user, digestMessage, events.length);
    }

    // Vider la queue
    digestStore.delete(key);

    logger.info('Digest flushed', { userId, channel, eventCount: events.length });

    return {
      success: true,
      eventsCount: events.length,
      groupedCount: Object.keys(groupedEvents).length,
      channel: channel,
    };
  } catch (error) {
    logger.error('Error flushing digest', { error: error.message, userId });
    throw error;
  }
}

/**
 * Groupe les événements par type
 */
function groupEventsByType(events) {
  const grouped = {};

  events.forEach((event) => {
    if (!grouped[event.type]) {
      grouped[event.type] = [];
    }
    grouped[event.type].push(event);
  });

  return grouped;
}

/**
 * Crée le contenu du message digest
 */
function createDigestMessage(user, groupedEvents, digestType = 'daily') {
  const eventSummaries = Object.entries(groupedEvents).map(([type, typeEvents]) => {
    return `• ${type}: ${typeEvents.length} notification(s)`;
  });

  const summary = eventSummaries.join('\n');
  const totalEvents = Object.values(groupedEvents).reduce((sum, arr) => sum + arr.length, 0);

  return {
    title: `Digest ${digestType} - ${new Date().toLocaleDateString('fr-FR')}`,
    summary: summary,
    total: totalEvents,
    groups: groupedEvents,
  };
}

/**
 * Envoie le digest par email
 */
async function sendDigestEmail(user, message, eventCount) {
  try {
    const htmlContent = branding.email(`
      <h2>${message.title}</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Voici un résumé de vos ${eventCount} notification(s):</p>
      <pre style="background:#f0f0f0;padding:10px;border-radius:4px;">${message.summary}</pre>
      <p><a href="https://akig.app/notifications" style="background:#0b5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">Voir tous les détails</a></p>
    `);

    // En production: intégrer avec sendgrid, mailgun, etc.
    logger.info('Digest email would be sent', {
      to: user.email,
      subject: message.title,
    });

    return true;
  } catch (error) {
    logger.error('Error sending digest email', { error: error.message });
    throw error;
  }
}

/**
 * Envoie le digest par SMS
 */
async function sendDigestSMS(user, summary) {
  try {
    const message = branding.sms(`Digest: ${summary.split('\n')[0]} (+${(summary.match(/\n/g) || []).length} plus)`);

    // En production: intégrer avec Twilio, AWS SNS, etc.
    logger.info('Digest SMS would be sent', {
      to: user.phone,
      message: message,
    });

    return true;
  } catch (error) {
    logger.error('Error sending digest SMS', { error: error.message });
    throw error;
  }
}

/**
 * Envoie le digest par WhatsApp
 */
async function sendDigestWhatsApp(user, summary) {
  try {
    const message = branding.sms(`Digest: ${summary}`);

    // En production: intégrer avec Twilio WhatsApp, etc.
    logger.info('Digest WhatsApp would be sent', {
      to: user.phone,
      message: message,
    });

    return true;
  } catch (error) {
    logger.error('Error sending digest WhatsApp', { error: error.message });
    throw error;
  }
}

/**
 * Stocke une notification in-app
 */
async function storeInAppNotification(userId, message) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, read)
       VALUES ($1, $2, $3, $4, false)`,
      [userId, 'digest', message.title, JSON.stringify(message)]
    );

    logger.info('In-app notification stored', { userId });
    return true;
  } catch (error) {
    logger.error('Error storing in-app notification', { error: error.message });
    throw error;
  }
}

/**
 * Planifie un digest quotidien pour un utilisateur
 */
async function scheduleDigestCron(userId, preferences = {}) {
  try {
    const hour = preferences.digestHour || 9; // 9:00 AM par défaut

    // En production: utiliser node-cron ou agenda
    const cronTime = `0 ${hour} * * *`; // Chaque jour à 9h

    logger.info('Digest cron scheduled', {
      userId,
      cronTime,
      channel: preferences.channel,
    });

    return { scheduled: true, cronTime };
  } catch (error) {
    logger.error('Error scheduling digest cron', { error: error.message });
    throw error;
  }
}

/**
 * Récupère les statistiques du digest pour un utilisateur
 */
async function getDigestStats(userId) {
  try {
    const events = getDigestEvents(userId);
    const grouped = groupEventsByType(events);

    return {
      pendingEvents: events.length,
      eventTypes: Object.keys(grouped),
      groupedCounts: Object.entries(grouped).reduce((acc, [type, items]) => {
        acc[type] = items.length;
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Error getting digest stats', { error: error.message });
    throw error;
  }
}

/**
 * Envoie un digest immédiat (hors planification)
 */
async function sendImmediateDigest(userId, preferences = {}) {
  try {
    const result = await flushDigest(userId, preferences);

    return {
      success: true,
      message: `Digest envoyé avec ${result.eventsCount} événement(s)`,
      ...result,
    };
  } catch (error) {
    logger.error('Error sending immediate digest', { error: error.message, userId });
    throw error;
  }
}

/**
 * Met à jour les préférences de digest
 */
async function updateDigestPreferences(userId, preferences) {
  try {
    const { channel, digestType, digestHour, enabled } = preferences;

    await pool.query(
      `UPDATE users 
       SET digest_channel = $1, 
           digest_type = $2, 
           digest_hour = $3, 
           digest_enabled = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [channel || 'email', digestType || 'daily', digestHour || 9, enabled !== false, userId]
    );

    logger.info('Digest preferences updated', { userId });

    return {
      success: true,
      preferences: { channel, digestType, digestHour, enabled },
    };
  } catch (error) {
    logger.error('Error updating digest preferences', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les préférences actuelles de digest
 */
async function getDigestPreferences(userId) {
  try {
    const result = await pool.query(
      `SELECT digest_channel, digest_type, digest_hour, digest_enabled 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      channel: user.digest_channel || 'email',
      type: user.digest_type || 'daily',
      hour: user.digest_hour || 9,
      enabled: user.digest_enabled !== false,
    };
  } catch (error) {
    logger.error('Error fetching digest preferences', { error: error.message });
    throw error;
  }
}

module.exports = {
  enqueueEvent,
  flushDigest,
  getDigestEvents,
  groupEventsByType,
  createDigestMessage,
  scheduleDigestCron,
  getDigestStats,
  sendImmediateDigest,
  updateDigestPreferences,
  getDigestPreferences,
};
