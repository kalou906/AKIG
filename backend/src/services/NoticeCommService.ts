/**
 * Service de communication multi-canaux résilient avec retry logic, traduction FR/EN/locales
 * Supporte: SMS, WhatsApp, Email, PDF lettre
 */

import * as pg from 'pg';
import nodemailer from 'nodemailer';
import axios from 'axios';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { CommunicationEvent, MessageTemplate, CommunicationChannel } from '../models/types';

export class NoticeCommService {
  private emailTransporter: any;
  private smsProvider: any;
  private whatsappProvider: any;
  
  // Traductions supportées
  private translations: Record<string, Record<string, string>> = {
    fr: { greeting: 'Bonjour', body: 'Nous vous informons...', close: 'Cordialement' },
    en: { greeting: 'Hello', body: 'We inform you...', close: 'Best regards' },
    soussou: { greeting: 'Baara jam', body: 'Moo jam...', close: 'Jamma' },
    peulh: { greeting: 'Assalamu alaikum', body: 'Mina jangina...', close: 'Jaakanam' },
    malinke: { greeting: 'Bonjour', body: 'N\'ba kalo...', close: 'Aw jukula' },
  };

  constructor(private pool: typeof pg.Pool.prototype) {
    this.initializeProviders();
  }

  /**
   * Initialise les fournisseurs de communication (SMS, Email, WhatsApp)
   */
  private initializeProviders(): void {
    // Email via nodemailer (Gmail, SendGrid, etc.)
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // SMS via Twilio ou autre fournisseur
    this.smsProvider = {
      apiKey: process.env.SMS_API_KEY,
      endpoint: process.env.SMS_ENDPOINT || 'https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json',
    };

    // WhatsApp via Meta API ou Twilio
    this.whatsappProvider = {
      apiKey: process.env.WHATSAPP_API_KEY,
      endpoint: process.env.WHATSAPP_ENDPOINT || 'https://graph.instagram.com/v18.0/me/messages',
    };
  }

  /**
   * Envoie une notification via le canal approprié avec retry logic
   */
  async sendNoticeNotification(
    noticeId: string,
    recipientId: string,
    channel: CommunicationChannel,
    language: string = 'fr'
  ): Promise<CommunicationEvent> {
    try {
      // Récupère le préavis et le destinataire
      const noticeQuery = `
        SELECT n.*, c.tenant_id, c.property_manager_id, c.monthly_rent, c.deposit_amount
        FROM notices n
        JOIN contracts c ON n.contract_id = c.id
        WHERE n.id = $1
      `;
      const noticeResult = await this.pool.query(noticeQuery, [noticeId]);
      if (noticeResult.rows.length === 0) throw new Error('Notice not found');

      const notice = noticeResult.rows[0];
      const recipient = await this.getRecipientInfo(recipientId);

      // Charge le template de message
      const template = await this.getMessageTemplate(notice.type, channel, language);
      
      // Crée le contenu dynamique
      const messageContent = this.renderTemplate(template.body, {
        recipientName: recipient.first_name,
        contractId: notice.contract_id,
        effectiveDate: dayjs(notice.effective_date).format('DD/MM/YYYY'),
        monthlyRent: notice.monthly_rent,
        depositAmount: notice.deposit_amount,
        noticeType: notice.type,
      });

      // Crée l'enregistrement de communication
      const commEvent: Partial<CommunicationEvent> = {
        noticeId,
        channel,
        recipientId,
        recipientAddress: this.getRecipientAddress(recipient, channel),
        templateId: template.id,
        messageContent,
        status: 'queued',
        retryCount: 0,
      };

      const eventResult = await this.pool.query(
        `INSERT INTO communication_events 
         (notice_id, channel, recipient_id, recipient_address, template_id, message_content, status, retry_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          commEvent.noticeId,
          commEvent.channel,
          commEvent.recipientId,
          commEvent.recipientAddress,
          commEvent.templateId,
          commEvent.messageContent,
          commEvent.status,
          commEvent.retryCount,
        ]
      );

      const eventId = eventResult.rows[0].id;

      // Envoie selon le canal
      await this.sendViaChannel(eventId, channel, recipient, messageContent, language);

      // Récupère l'événement mis à jour
      const finalEvent = await this.pool.query(
        'SELECT * FROM communication_events WHERE id = $1',
        [eventId]
      );

      return finalEvent.rows[0];
    } catch (error) {
      console.error('Error sending notice notification:', error);
      throw error;
    }
  }

  /**
   * Envoie via le canal spécifié avec retry logic
   */
  private async sendViaChannel(
    eventId: string,
    channel: CommunicationChannel,
    recipient: any,
    message: string,
    language: string
  ): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE communication_events SET status = $1 WHERE id = $2',
        ['sending', eventId]
      );

      let result: any;

      switch (channel) {
        case 'sms':
          result = await this.sendSMS(recipient.phone, message);
          break;
        case 'email':
          result = await this.sendEmail(recipient.email, `Notification préavis (${language})`, message);
          break;
        case 'whatsapp':
          result = await this.sendWhatsApp(recipient.phone, message);
          break;
        case 'letter':
          result = await this.generatePDFLetter(recipient, message);
          break;
      }

      // Met à jour le statut
      await this.pool.query(
        `UPDATE communication_events 
         SET status = $1, sent_at = CURRENT_TIMESTAMP, last_error = NULL 
         WHERE id = $2`,
        [result.success ? 'sent' : 'failed', eventId]
      );

      if (!result.success) {
        await this.scheduleRetry(eventId);
      }

      // Log audit
      await this.logAuditEvent(eventId, `sent_via_${channel}`, { result });
    } catch (error) {
      console.error(`Error sending via ${channel}:`, error);
      await this.pool.query(
        `UPDATE communication_events 
         SET status = $1, last_error = $2, next_retry_at = $3
         WHERE id = $4`,
        ['failed', (error as Error).message, this.getNextRetryTime(0), eventId]
      );
      throw error;
    }
  }

  /**
   * Envoie un SMS avec retry logic
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean }> {
    try {
      // Simplifie le message pour SMS (<160 caractères si possible)
      const smsMessage = this.simplifyMessageForSMS(message);

      const response = await axios.post(
        this.smsProvider.endpoint,
        {
          To: phoneNumber,
          Body: smsMessage,
          From: process.env.SMS_FROM_NUMBER || '+33612345678',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.smsProvider.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return { success: response.status === 200 };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false };
    }
  }

  /**
   * Envoie un email avec pièce jointe PDF
   */
  private async sendEmail(
    recipientEmail: string,
    subject: string,
    htmlContent: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@akig.com',
        to: recipientEmail,
        subject,
        html: htmlContent,
        replyTo: process.env.EMAIL_REPLY_TO || 'support@akig.com',
      });

      return { success: !!response.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false };
    }
  }

  /**
   * Envoie via WhatsApp avec Meta API
   */
  private async sendWhatsApp(phoneNumber: string, message: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        this.whatsappProvider.endpoint,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber.replace(/\D/g, ''), // Nettoie format
          type: 'text',
          text: {
            body: message,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappProvider.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: response.status === 200 };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false };
    }
  }

  /**
   * Génère une lettre PDF pour impression
   */
  private async generatePDFLetter(
    recipient: any,
    htmlContent: string
  ): Promise<{ success: boolean }> {
    try {
      const doc: any = new PDFDocument();
      const filename = `letter_${recipient.id}_${dayjs().format('YYYYMMDD')}.pdf`;
      const filepath = path.join(process.env.STORAGE_DIR || './uploads', filename);

      doc.pipe(fs.createWriteStream(filepath));

      // En-tête
      doc.fontSize(20).text('NOTIFICATION PRÉAVIS', 100, 50);
      doc.fontSize(10).text(`Date: ${dayjs().format('DD/MM/YYYY')}`, 100, 80);

      // Contenu
      doc.fontSize(12).text(`\nDestinaire: ${recipient.first_name} ${recipient.last_name}`, 100, 120);
      doc.fontSize(10).text(htmlContent.replace(/<[^>]*>/g, ''), 100, 160);

      // Pied de page
      doc.fontSize(8).text('---', 100, 700);
      doc.text('AKIG - Système de gestion des préavis', 100, 710);

      doc.end();

      // Attend fin d'écriture
      await new Promise(resolve => doc.on('finish', resolve));

      return { success: true };
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false };
    }
  }

  /**
   * Planifie une relance avec délai exponentiel
   */
  private async scheduleRetry(eventId: string): Promise<void> {
    try {
      const eventResult = await this.pool.query(
        'SELECT retry_count FROM communication_events WHERE id = $1',
        [eventId]
      );

      const retryCount = (eventResult.rows[0]?.retry_count || 0) + 1;
      const nextRetryTime = this.getNextRetryTime(retryCount);

      await this.pool.query(
        `UPDATE communication_events 
         SET retry_count = $1, next_retry_at = $2, status = $3
         WHERE id = $4`,
        [retryCount, nextRetryTime, retryCount > 5 ? 'failed' : 'queued', eventId]
      );
    } catch (error) {
      console.error('Error scheduling retry:', error);
    }
  }

  /**
   * Calcule le prochain délai de retry (backoff exponentiel)
   */
  private getNextRetryTime(retryCount: number): Date {
    const delayMinutes = Math.min(Math.pow(2, retryCount), 1440); // Max 24h
    return dayjs().add(delayMinutes, 'minutes').toDate();
  }

  /**
   * Simplifie le message pour SMS (<160 caractères)
   */
  private simplifyMessageForSMS(message: string): string {
    const cleanMessage = message.replace(/<[^>]*>/g, '');
    if (cleanMessage.length <= 160) return cleanMessage;

    return cleanMessage.substring(0, 157) + '...';
  }

  /**
   * Charge un template de message
   */
  private async getMessageTemplate(
    noticeType: string,
    channel: CommunicationChannel,
    language: string
  ): Promise<MessageTemplate> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM message_templates 
         WHERE notice_type = $1 AND channel = $2 AND language = $3`,
        [noticeType, channel, language]
      );

      if (result.rows.length === 0) {
        throw new Error(`No template for ${noticeType}/${channel}/${language}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }

  /**
   * Récupère les infos du destinataire
   */
  private async getRecipientInfo(recipientId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM tenants WHERE id = $1',
      [recipientId]
    );

    if (result.rows.length === 0) {
      throw new Error('Recipient not found');
    }

    return result.rows[0];
  }

  /**
   * Récupère l'adresse appropriée selon le canal
   */
  private getRecipientAddress(recipient: any, channel: CommunicationChannel): string {
    switch (channel) {
      case 'email':
        return recipient.email;
      case 'sms':
      case 'whatsapp':
        return recipient.phone;
      case 'letter':
        return recipient.address || 'unknown';
      default:
        return '';
    }
  }

  /**
   * Affiche un template avec variables dynamiques
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let content = template;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return content;
  }

  /**
   * Enregistre un événement d'audit
   */
  private async logAuditEvent(eventId: string, action: string, details: any): Promise<void> {
    try {
      const commResult = await this.pool.query(
        'SELECT notice_id FROM communication_events WHERE id = $1',
        [eventId]
      );

      if (commResult.rows.length > 0) {
        await this.pool.query(
          `INSERT INTO notice_audit_log (notice_id, action, actor_id, details)
           VALUES ($1, $2, $3, $4)`,
          [commResult.rows[0].notice_id, action, 'system', JSON.stringify(details)]
        );
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  /**
   * Marque un message comme lu (webhook from SMS/Email provider)
   */
  async markMessageAsRead(eventId: string, readAt: Date = new Date()): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE communication_events SET status = $1, read_at = $2 WHERE id = $3',
        ['read', readAt, eventId]
      );

      await this.logAuditEvent(eventId, 'message_read', { readAt });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Traite les relances planifiées (à appeler via cron job)
   */
  async processScheduledBatches(): Promise<void> {
    try {
      const query = `
        SELECT id FROM message_batches
        WHERE status = 'scheduled'
          AND scheduled_for <= CURRENT_TIMESTAMP
        LIMIT 50
      `;

      const batches = await this.pool.query(query);

      for (const batch of batches.rows) {
        await this.executeBatch(batch.id);
      }
    } catch (error) {
      console.error('Error processing scheduled batches:', error);
    }
  }

  /**
   * Exécute un lot de communications
   */
  private async executeBatch(batchId: string): Promise<void> {
    try {
      const batchQuery = `
        SELECT * FROM message_batches WHERE id = $1
      `;
      const batchResult = await this.pool.query(batchQuery, [batchId]);
      const batch = batchResult.rows[0];

      let successCount = 0;
      let failureCount = 0;

      for (const recipientId of batch.recipient_ids) {
        try {
          await this.sendNoticeNotification(
            batch.notice_id,
            recipientId,
            batch.channel_strategy === 'preferred' ? 'email' : 'sms',
            'fr'
          );
          successCount++;
        } catch (error) {
          failureCount++;
          console.error(`Error sending to recipient ${recipientId}:`, error);
        }
      }

      // Met à jour les métriques
      const successRate = successCount / (successCount + failureCount);
      await this.pool.query(
        `UPDATE message_batches 
         SET status = $1, success_rate = $2, deliverability_rate = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          failureCount === 0 ? 'completed' : 'partial_failure',
          successRate,
          successRate,
          batchId,
        ]
      );
    } catch (error) {
      console.error('Error executing batch:', error);
    }
  }
}

export default NoticeCommService;
