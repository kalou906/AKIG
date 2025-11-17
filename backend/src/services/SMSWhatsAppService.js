/**
 * 📱 SMS & WhatsApp Notifications Service
 * Intégration Twilio pour multi-canaux notifications
 * 
 * backend/src/services/SMSWhatsAppService.js
 */

const logger = require('./logger');

// Configuration Twilio (sera chargée depuis env variables)
let twilioClient = null;

class SMSWhatsAppService {
  constructor(twilio = null) {
    this.twilioClient = twilio;
    this.messageQueue = [];
  }

  /**
   * Initialiser le service avec les credentials Twilio
   */
  static initialize(accountSid, authToken, twilioPhoneNumber, twilioWhatsAppNumber) {
    try {
      // Vérifier si twilio est disponible
      if (accountSid && authToken) {
        try {
          const twilio = require('twilio');
          twilioClient = twilio(accountSid, authToken);
          logger.info('✅ Twilio initialisé avec succès');
          return true;
        } catch (error) {
          logger.warn('⚠️ Twilio non disponible - SMS/WhatsApp en mode mock');
          return false;
        }
      }
      return false;
    } catch (error) {
      logger.error('Erreur initialisation Twilio:', error);
      return false;
    }
  }

  /**
   * Envoyer un SMS
   */
  async sendSMS(phoneNumber, message, pool = null) {
    try {
      if (!phoneNumber || !message) {
        return { success: false, error: 'Numéro de téléphone et message requis' };
      }

      // Format du numéro (ajouter +224 si besoin)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      if (!twilioClient) {
        // Mode mock (développement)
        logger.info(`📱 SMS (MOCK) à ${formattedPhone}: ${message}`);
        
        if (pool) {
          await this.logNotification(pool, 'sms', formattedPhone, message, 'sent', 'mock');
        }

        return {
          success: true,
          message: 'SMS envoyé (mock mode)',
          sid: `mock_${Date.now()}`,
          to: formattedPhone
        };
      }

      // Envoi réel avec Twilio
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      logger.info(`✅ SMS envoyé à ${formattedPhone} (SID: ${result.sid})`);

      // Logger dans la base de données
      if (pool) {
        await this.logNotification(pool, 'sms', formattedPhone, message, 'sent', result.sid);
      }

      return {
        success: true,
        message: 'SMS envoyé avec succès',
        sid: result.sid,
        to: result.to
      };
    } catch (error) {
      logger.error('Erreur envoi SMS:', error);

      if (pool) {
        await this.logNotification(pool, 'sms', phoneNumber, message, 'failed', error.message);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer un message WhatsApp
   */
  async sendWhatsApp(phoneNumber, message, pool = null) {
    try {
      if (!phoneNumber || !message) {
        return { success: false, error: 'Numéro WhatsApp et message requis' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const whatsappPhone = `whatsapp:${formattedPhone}`;

      if (!twilioClient) {
        // Mode mock
        logger.info(`💬 WhatsApp (MOCK) à ${formattedPhone}: ${message}`);

        if (pool) {
          await this.logNotification(pool, 'whatsapp', formattedPhone, message, 'sent', 'mock');
        }

        return {
          success: true,
          message: 'Message WhatsApp envoyé (mock mode)',
          sid: `mock_${Date.now()}`,
          to: formattedPhone
        };
      }

      // Envoi réel
      const result = await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: whatsappPhone
      });

      logger.info(`✅ WhatsApp envoyé à ${formattedPhone} (SID: ${result.sid})`);

      if (pool) {
        await this.logNotification(pool, 'whatsapp', formattedPhone, message, 'sent', result.sid);
      }

      return {
        success: true,
        message: 'Message WhatsApp envoyé avec succès',
        sid: result.sid,
        to: result.to
      };
    } catch (error) {
      logger.error('Erreur envoi WhatsApp:', error);

      if (pool) {
        await this.logNotification(pool, 'whatsapp', phoneNumber, message, 'failed', error.message);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer une notification multi-canal
   */
  async sendMultiChannel(recipient, message, channels = ['email', 'sms'], pool = null) {
    try {
      const results = {};

      for (const channel of channels) {
        switch (channel) {
          case 'sms':
            if (recipient.phone) {
              results.sms = await this.sendSMS(recipient.phone, message, pool);
            }
            break;

          case 'whatsapp':
            if (recipient.phone) {
              results.whatsapp = await this.sendWhatsApp(recipient.phone, message, pool);
            }
            break;

          case 'email':
            // Déléguer au service email (pour cohérence avec ReminderService)
            logger.info(`📧 Email (via ReminderService): ${recipient.email}`);
            break;

          default:
            logger.warn(`Canal inconnu: ${channel}`);
        }
      }

      return {
        success: true,
        results,
        message: 'Notifications envoyées'
      };
    } catch (error) {
      logger.error('Erreur envoi multi-canal:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer une notification de paiement en retard (SMS/WhatsApp/Email)
   */
  async sendOverdueNotification(tenantData, contractData, daysOverdue, pool = null) {
    try {
      const message = `
Rappel: Paiement en retard de ${daysOverdue} jours
Propriété: ${contractData.propertyName}
Montant dû: ${contractData.rentAmount} GNF
Contactez le bailleur rapidement.
`.trim();

      const channels = ['sms', 'whatsapp'];

      const result = await this.sendMultiChannel(
        {
          phone: tenantData.phone,
          email: tenantData.email
        },
        message,
        channels,
        pool
      );

      return result;
    } catch (error) {
      logger.error('Erreur notification impayé:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer une notification de réservation confirmée
   */
  async sendBookingConfirmation(guestData, bookingData, pool = null) {
    try {
      const message = `
Réservation confirmée! 🎉
Propriété: ${bookingData.propertyName}
Arrivée: ${bookingData.checkInDate}
Départ: ${bookingData.checkOutDate}
Prix: ${bookingData.totalPrice} GNF
Référence: ${bookingData.bookingRef}
`.trim();

      const channels = ['sms', 'whatsapp'];

      const result = await this.sendMultiChannel(
        {
          phone: guestData.phone,
          email: guestData.email
        },
        message,
        channels,
        pool
      );

      return result;
    } catch (error) {
      logger.error('Erreur confirmation réservation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer une notification de lead nouveau
   */
  async sendNewLeadAlert(agentData, leadData, pool = null) {
    try {
      const message = `
Nouveau lead! 🎯
Nom: ${leadData.firstName} ${leadData.lastName}
Type bien: ${leadData.propertyType}
Budget: ${leadData.budget} GNF
Source: ${leadData.source}
Attribuez rapidement pour ne pas perdre le lead!
`.trim();

      const result = await this.sendSMS(agentData.phone, message, pool);
      return result;
    } catch (error) {
      logger.error('Erreur alerte lead:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Formater un numéro de téléphone au standard international
   */
  formatPhoneNumber(phone) {
    // Enlever les espaces et tirets
    let cleaned = phone.replace(/\D/g, '');

    // Si commence par 224 (Guinée), on utilise le numéro complet
    if (!cleaned.startsWith('+')) {
      if (!cleaned.startsWith('224')) {
        cleaned = '224' + cleaned;
      }
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Logger une notification en base de données
   */
  async logNotification(pool, channel, recipient, message, status, externalId = null) {
    try {
      await pool.query(
        `
          INSERT INTO notification_logs (channel, recipient, message, status, external_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [channel, recipient, message, status, externalId]
      );
    } catch (error) {
      logger.error('Erreur logging notification:', error);
    }
  }

  /**
   * Récupérer l'historique des notifications
   */
  async getNotificationHistory(pool, filters = {}) {
    try {
      let query = 'SELECT * FROM notification_logs WHERE 1=1';
      const values = [];
      let paramCount = 1;

      if (filters.channel) {
        query += ` AND channel = $${paramCount}`;
        values.push(filters.channel);
        paramCount++;
      }

      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.recipient) {
        query += ` AND recipient = $${paramCount}`;
        values.push(filters.recipient);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await pool.query(query, values);
      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } catch (error) {
      logger.error('Erreur historique notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les statistiques d'envoi
   */
  async getNotificationStats(pool) {
    try {
      const result = await pool.query(`
        SELECT 
          channel,
          status,
          COUNT(*) as count
        FROM notification_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY channel, status
        ORDER BY channel, status
      `);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      logger.error('Erreur stats notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SMSWhatsAppService;
