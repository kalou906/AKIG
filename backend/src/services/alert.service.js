/**
 * Service Alertes SMS/Email
 * Notifications pour impayés critiques, paiements reçus
 * backend/src/services/alert.service.js
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Configuration transporteur Email
 * Utilise SMTP (Gmail, Outlook, etc.)
 */
function createEmailTransporter() {
  // Configuration SMTP depuis variables d'environnement
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true = 465, false = 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };

  if (!emailConfig.auth.user || !emailConfig.auth.password) {
    logger.warn('SMTP non configuré - alertes email désactivées');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
}

/**
 * Service Alertes
 */
const AlertService = {
  emailTransporter: createEmailTransporter(),

  /**
   * Envoyer alerte email impayé critique
   * @param {Object} impaye - Données impayé
   * @param {Object} tenant - Données locataire
   */
  async sendImpayeAlert(impaye, tenant) {
    if (!this.emailTransporter) {
      logger.warn('Transporteur email non disponible');
      return;
    }

    try {
      const { id, montant, periode, statut, dateEcheance } = impaye;
      const { nom, email, telephone } = tenant;

      const subject = `⚠️ ALERTE IMPAYÉ - ${nom} - ${montant}€`;
      const htmlContent = `
        <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; direction: rtl;">
            <h2 style="color: #d32f2f;">⚠️ ALERTE IMPAYÉ CRITIQUE</h2>
            
            <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff6f00; margin: 15px 0;">
              <p><strong>Locataire:</strong> ${nom}</p>
              <p><strong>Montant impayé:</strong> <span style="color: #d32f2f; font-weight: bold;">${montant}€</span></p>
              <p><strong>Période:</strong> ${periode}</p>
              <p><strong>Statut:</strong> ${statut}</p>
              <p><strong>Référence:</strong> #${id}</p>
              <p><strong>Date échéance:</strong> ${new Date(dateEcheance).toLocaleDateString('fr-FR')}</p>
            </div>

            <h3>Actions recommandées:</h3>
            <ul>
              <li>Contacter le locataire par SMS: ${telephone}</li>
              <li>Envoyer mise en demeure</li>
              <li>Consulter l'historique des paiements</li>
            </ul>

            <hr>
            <p style="color: #999; font-size: 12px;">
              Alerte automatique - Ne pas répondre à cet email
            </p>
          </body>
        </html>
      `;

      const textContent = `
ALERTE IMPAYÉ CRITIQUE

Locataire: ${nom}
Montant: ${montant}€
Période: ${periode}
Statut: ${statut}
ID: ${id}
Date: ${new Date(dateEcheance).toLocaleDateString('fr-FR')}

Téléphone: ${telephone}
      `;

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL || 'admin@akig.local',
        subject,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Priority': '1', // Urgent
          'Importance': 'high'
        }
      });

      logger.info('Email impayé envoyé', { impayeId: id, tenant: nom });
    } catch (err) {
      logger.error('Erreur envoi email impayé', err);
    }
  },

  /**
   * Envoyer alerte paiement reçu
   * @param {Object} payment - Données paiement
   * @param {Object} tenant - Données locataire
   */
  async sendPaymentReceivedAlert(payment, tenant) {
    if (!this.emailTransporter) return;

    try {
      const { id, montant, date, methode, reference } = payment;
      const { nom, email } = tenant;

      const subject = `✅ Paiement reçu - ${montant}€`;
      const htmlContent = `
        <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; direction: rtl;">
            <h2 style="color: #4caf50;">✅ PAIEMENT CONFIRMÉ</h2>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 15px 0;">
              <p><strong>Montant reçu:</strong> <span style="color: #4caf50; font-weight: bold;">${montant}€</span></p>
              <p><strong>Méthode:</strong> ${methode}</p>
              <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Référence:</strong> ${reference}</p>
              <p><strong>ID Transaction:</strong> #${id}</p>
            </div>

            <p>Merci pour votre paiement. Votre compte a été crédité.</p>

            <hr>
            <p style="color: #999; font-size: 12px;">
              Confirmation automatique - Conservez cet email comme preuve
            </p>
          </body>
        </html>
      `;

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        html: htmlContent
      });

      logger.info('Confirmation paiement envoyée', { paymentId: id, tenant: nom });
    } catch (err) {
      logger.error('Erreur envoi confirmation paiement', err);
    }
  },

  /**
   * Envoyer alerte rapport quotidien
   * @param {Array} impayesOuverts - List impayés ouverts
   * @param {number} montantTotal - Total montants impayés
   */
  async sendDailyReport(impayesOuverts, montantTotal) {
    if (!this.emailTransporter) return;

    try {
      const today = new Date().toLocaleDateString('fr-FR');
      const rows = impayesOuverts
        .map(i => `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">#${i.id}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.nomTenant}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.montant}€</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.periode}</td>
        </tr>`)
        .join('');

      const htmlContent = `
        <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; direction: rtl;">
            <h2>📊 Rapport Impayés - ${today}</h2>
            
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
              <p><strong>Total impayés ouverts:</strong> <span style="color: #d32f2f; font-size: 24px; font-weight: bold;">${montantTotal}€</span></p>
              <p><strong>Nombre de dossiers:</strong> ${impayesOuverts.length}</p>
            </div>

            <h3>Détails des impayés:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 8px; text-align: right;">ID</th>
                  <th style="padding: 8px; text-align: right;">Locataire</th>
                  <th style="padding: 8px; text-align: right;">Montant</th>
                  <th style="padding: 8px; text-align: right;">Période</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <hr>
            <p style="color: #999; font-size: 12px;">
              Rapport automatique généré par AKIG - ${today}
            </p>
          </body>
        </html>
      `;

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL || 'admin@akig.local',
        subject: `📊 Rapport Impayés - ${today} (${montantTotal}€)`,
        html: htmlContent
      });

      logger.info('Rapport quotidien envoyé', { 
        impayesCount: impayesOuverts.length,
        montantTotal 
      });
    } catch (err) {
      logger.error('Erreur envoi rapport quotidien', err);
    }
  },

  /**
   * Envoyer notification quittance générée
   * @param {Object} quittance - Données quittance
   * @param {Object} tenant - Données locataire
   */
  async sendQuittanceNotification(quittance, tenant) {
    if (!this.emailTransporter) return;

    try {
      const { id, montant, periode, dateQuittance } = quittance;
      const { nom, email } = tenant;

      const subject = `📄 Quittance de loyer - ${periode}`;
      const htmlContent = `
        <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; direction: rtl;">
            <h2>📄 QUITTANCE DE LOYER</h2>
            
            <p>Chère Mme/M. ${nom},</p>

            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
              <p><strong>Période:</strong> ${periode}</p>
              <p><strong>Montant:</strong> ${montant}€</p>
              <p><strong>Date quittance:</strong> ${new Date(dateQuittance).toLocaleDateString('fr-FR')}</p>
              <p><strong>Référence:</strong> #${id}</p>
            </div>

            <p>Votre quittance est disponible en pièce jointe ou en ligne sur votre compte.</p>

            <hr>
            <p style="color: #999; font-size: 12px;">
              Quittance automatique - Conservez-la à titre de preuve
            </p>
          </body>
        </html>
      `;

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        html: htmlContent
      });

      logger.info('Notification quittance envoyée', { quittanceId: id, tenant: nom });
    } catch (err) {
      logger.error('Erreur envoi notification quittance', err);
    }
  },

  /**
   * Tester configuration email
   */
  async testEmailConnection() {
    if (!this.emailTransporter) {
      throw new Error('Transporteur email non configuré');
    }

    try {
      await this.emailTransporter.verify();
      logger.info('Email SMTP vérifié avec succès');
      return true;
    } catch (err) {
      logger.error('Erreur vérification SMTP', err);
      throw err;
    }
  }
};

module.exports = AlertService;
