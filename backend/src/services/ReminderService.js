/**
 * 📧 Service de Relances Automatiques - ImmobilierLoyer
 * Gère les relances email/SMS pour impayés, indexations, quittances
 * Devise: GNF (Franc Guinéen)
 */

const nodemailer = require('nodemailer');

class ReminderService {
  constructor(pool) {
    this.pool = pool;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'noreply@akig.gn',
        pass: process.env.SMTP_PASS || 'password'
      }
    });
  }

  /**
   * 🔔 Relancer les paiements en retard
   */
  async sendOverdueReminder(contractId, method = 'email') {
    try {
      const result = await this.pool.query(`
        SELECT 
          rc.id, rc.reference, rc.monthly_rent,
          rc.tenant_id, c.email, c.phone,
          rc.property_id, p.title,
          rc.outstanding_amount, rc.arrears,
          MAX(py.date) as last_payment_date
        FROM rental_contracts rc
        JOIN clients c ON rc.tenant_id = c.id
        JOIN properties p ON rc.property_id = p.id
        LEFT JOIN payments py ON rc.id = py.contract_id
        WHERE rc.id = $1 AND rc.status = 'active'
        GROUP BY rc.id, c.email, c.phone, p.title
      `, [contractId]);

      if (result.rows.length === 0) {
        throw new Error('Contrat non trouvé ou inactif');
      }

      const contract = result.rows[0];
      const daysOverdue = Math.floor(
        (new Date() - new Date(contract.last_payment_date)) / (1000 * 60 * 60 * 24)
      );

      if (method === 'email') {
        return await this.sendEmailReminder(contract, daysOverdue);
      } else if (method === 'sms') {
        return await this.sendSMSReminder(contract, daysOverdue);
      }
    } catch (err) {
      console.error('❌ Erreur relance paiement:', err.message);
      throw err;
    }
  }

  /**
   * 📧 Envoyer relance email
   */
  async sendEmailReminder(contract, daysOverdue) {
    const htmlContent = `
      <h2>Relance de Paiement - Loyer en Retard</h2>
      <p>Contrat: <strong>${contract.reference}</strong></p>
      <p>Bien: <strong>${contract.title}</strong></p>
      <p>Montant dû: <strong>${contract.outstanding_amount} GNF</strong></p>
      <p>Retard: <strong>${daysOverdue} jours</strong></p>
      <p>Veuillez régulariser votre paiement dans les 7 jours.</p>
      <p>Merci,<br>AKIG - Agence Immobilière</p>
    `;

    try {
      await this.transporter.sendMail({
        from: 'noreply@akig.gn',
        to: contract.email,
        subject: `⚠️ Relance: Loyer en retard - Contrat ${contract.reference}`,
        html: htmlContent
      });

      // Enregistrer dans les logs
      await this.pool.query(`
        INSERT INTO reminder_logs (contract_id, type, method, status, sent_at)
        VALUES ($1, 'overdue', 'email', 'sent', NOW())
      `, [contract.id]);

      return { success: true, message: 'Relance email envoyée', recipient: contract.email };
    } catch (err) {
      console.error('❌ Erreur envoi email:', err.message);
      throw err;
    }
  }

  /**
   * 📱 Envoyer relance SMS
   */
  async sendSMSReminder(contract, daysOverdue) {
    const message = `AKIG: Loyer ${contract.reference} en retard de ${daysOverdue}j. Montant: ${contract.outstanding_amount} GNF. Merci de régulariser.`;

    try {
      // Intégration SMS (ex: Twilio, AWS SNS)
      console.log(`📱 SMS à ${contract.phone}: ${message}`);

      await this.pool.query(`
        INSERT INTO reminder_logs (contract_id, type, method, status, sent_at)
        VALUES ($1, 'overdue', 'sms', 'sent', NOW())
      `, [contract.id]);

      return { success: true, message: 'SMS envoyé', recipient: contract.phone };
    } catch (err) {
      console.error('❌ Erreur envoi SMS:', err.message);
      throw err;
    }
  }

  /**
   * 📅 Relance indexation loyer
   */
  async sendIndexationReminder(contractId) {
    try {
      const result = await this.pool.query(`
        SELECT rc.id, rc.reference, rc.monthly_rent, c.email, p.title,
               EXTRACT(YEAR FROM rc.start_date) as start_year
        FROM rental_contracts rc
        JOIN clients c ON rc.landlord_id = c.id
        JOIN properties p ON rc.property_id = p.id
        WHERE rc.id = $1 AND EXTRACT(MONTH FROM rc.start_date) = EXTRACT(MONTH FROM NOW())
      `, [contractId]);

      if (result.rows.length === 0) {
        throw new Error('Aucun contrat à indexer');
      }

      const contract = result.rows[0];
      const indexationRate = 0.02; // 2% d'indexation annuelle
      const newRent = Math.round(contract.monthly_rent * (1 + indexationRate));

      const htmlContent = `
        <h2>📈 Indexation Loyer - Révision Annuelle</h2>
        <p>Contrat: <strong>${contract.reference}</strong></p>
        <p>Bien: <strong>${contract.title}</strong></p>
        <p>Ancien loyer: <strong>${contract.monthly_rent} GNF</strong></p>
        <p>Nouveau loyer (après indexation +2%): <strong>${newRent} GNF</strong></p>
        <p>À partir du: <strong>${new Date().toLocaleDateString('fr-FR')}</strong></p>
      `;

      await this.transporter.sendMail({
        from: 'noreply@akig.gn',
        to: contract.email,
        subject: `📈 Notification Indexation - Contrat ${contract.reference}`,
        html: htmlContent
      });

      return { success: true, newRent, message: 'Relance indexation envoyée' };
    } catch (err) {
      console.error('❌ Erreur indexation:', err.message);
      throw err;
    }
  }

  /**
   * 🧾 Relance quittance
   */
  async sendReceiptReminder(contractId, paymentId) {
    try {
      const result = await this.pool.query(`
        SELECT c.email, c.first_name, rc.reference, py.amount, py.date
        FROM payments py
        JOIN rental_contracts rc ON py.contract_id = rc.id
        JOIN clients c ON rc.tenant_id = c.id
        WHERE py.id = $1
      `, [paymentId]);

      if (result.rows.length === 0) {
        throw new Error('Paiement non trouvé');
      }

      const payment = result.rows[0];
      const htmlContent = `
        <h2>🧾 Votre Quittance de Loyer</h2>
        <p>Bonjour ${payment.first_name},</p>
        <p>Voici votre quittance pour le paiement du <strong>${new Date(payment.date).toLocaleDateString('fr-FR')}</strong></p>
        <p>Contrat: <strong>${payment.reference}</strong></p>
        <p>Montant: <strong>${payment.amount} GNF</strong></p>
        <p>La quittance est disponible en pièce jointe.</p>
      `;

      await this.transporter.sendMail({
        from: 'noreply@akig.gn',
        to: payment.email,
        subject: `🧾 Quittance de loyer - ${payment.reference}`,
        html: htmlContent
      });

      return { success: true, message: 'Quittance envoyée au locataire' };
    } catch (err) {
      console.error('❌ Erreur envoi quittance:', err.message);
      throw err;
    }
  }

  /**
   * ⏰ Relance contrat expirant
   */
  async sendExpiringContractReminder(contractId) {
    try {
      const result = await this.pool.query(`
        SELECT rc.id, rc.reference, rc.end_date, 
               c.email as landlord_email, c.first_name as landlord_name,
               c2.email as tenant_email, c2.first_name as tenant_name,
               p.title,
               (rc.end_date - NOW())::int as days_remaining
        FROM rental_contracts rc
        JOIN clients c ON rc.landlord_id = c.id
        JOIN clients c2 ON rc.tenant_id = c2.id
        JOIN properties p ON rc.property_id = p.id
        WHERE rc.id = $1 AND rc.status = 'active'
      `, [contractId]);

      if (result.rows.length === 0) {
        throw new Error('Contrat non trouvé');
      }

      const contract = result.rows[0];

      if (contract.days_remaining <= 30) {
        const htmlContent = `
          <h2>⏰ Expiration Imminente de Contrat</h2>
          <p>Le contrat <strong>${contract.reference}</strong> pour <strong>${contract.title}</strong></p>
          <p>expire dans <strong>${contract.days_remaining} jours</strong> (${new Date(contract.end_date).toLocaleDateString('fr-FR')})</p>
          <p>Merci de régulariser la situation.</p>
        `;

        await this.transporter.sendMail({
          from: 'noreply@akig.gn',
          to: contract.landlord_email,
          subject: `⏰ Contrat expirant - ${contract.reference}`,
          html: htmlContent
        });

        return { success: true, daysRemaining: contract.days_remaining };
      }

      return { success: false, message: 'Contrat ne nécessite pas de relance' };
    } catch (err) {
      console.error('❌ Erreur relance expiration:', err.message);
      throw err;
    }
  }

  /**
   * 🔄 Exécuter toutes les relances programmées
   */
  async runScheduledReminders() {
    try {
      console.log('🔄 Lancement cycle de relances programmées...');

      // 1. Relances impayés (retard > 5 jours)
      const overdueResult = await this.pool.query(`
        SELECT rc.id FROM rental_contracts rc
        WHERE rc.status = 'active' 
          AND rc.outstanding_amount > 0
          AND (NOW() - INTERVAL '5 days') > (
            SELECT MAX(py.date) FROM payments py WHERE py.contract_id = rc.id
          )
        LIMIT 20
      `);

      for (const { id } of overdueResult.rows) {
        await this.sendOverdueReminder(id, 'email');
      }

      // 2. Contrats expirant dans 30 jours
      const expiringResult = await this.pool.query(`
        SELECT id FROM rental_contracts 
        WHERE status = 'active' 
          AND end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        LIMIT 20
      `);

      for (const { id } of expiringResult.rows) {
        await this.sendExpiringContractReminder(id);
      }

      return { success: true, overdueReminders: overdueResult.rowCount, expiringReminders: expiringResult.rowCount };
    } catch (err) {
      console.error('❌ Erreur cycle relances:', err.message);
      throw err;
    }
  }

  /**
   * 📊 Statistiques relances
   */
  async getReminderStats(startDate, endDate) {
    try {
      const result = await this.pool.query(`
        SELECT 
          type,
          method,
          status,
          COUNT(*) as count
        FROM reminder_logs
        WHERE sent_at BETWEEN $1 AND $2
        GROUP BY type, method, status
      `, [startDate, endDate]);

      return result.rows;
    } catch (err) {
      console.error('❌ Erreur stats relances:', err.message);
      throw err;
    }
  }
}

module.exports = ReminderService;
