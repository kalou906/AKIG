/**
 * ============================================================
 * backend/src/services/notification-service.js - Service Notifications
 * Envoi d'emails/SMS pour rappels de paiement et alertes
 * ============================================================
 */

const nodemailer = require("nodemailer");
const { pool } = require("../db");

/**
 * Configuration SMTP
 * Utiliser variables d'environnement en production
 */
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "noreply@akig.gn",
    pass: process.env.EMAIL_PASS || "your-password",
  },
});

/**
 * Envoyer une notification de paiement en attente
 */
async function notifyPendingPayment(paymentId) {
  try {
    const paymentQuery = await pool.query(
      `SELECT
         pe.id, pe.amount, pe.reference_number, pe.payment_date,
         pe.payment_method,
         t.first_name, t.last_name, t.email, t.phone,
         c.reference as contract_ref,
         p.address, p.city
       FROM payments_enhanced pe
       LEFT JOIN tenants t ON pe.tenant_id = t.id
       LEFT JOIN contracts c ON pe.contract_id = c.id
       LEFT JOIN properties p ON c.property_id = p.id
       WHERE pe.id = $1`,
      [paymentId]
    );

    if (paymentQuery.rows.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = paymentQuery.rows[0];

    // Email
    const emailContent = `
      <h1>Avis de Paiement</h1>
      <p>Cher(e) ${payment.first_name} ${payment.last_name},</p>
      
      <p>Votre paiement est actuellement <strong>en attente de confirmation</strong>.</p>
      
      <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <p><strong>Détails du Paiement:</strong></p>
        <ul>
          <li><strong>Montant:</strong> ${payment.amount.toLocaleString()} FG</li>
          <li><strong>Contrat:</strong> ${payment.contract_ref}</li>
          <li><strong>Référence:</strong> ${payment.reference_number || "N/A"}</li>
          <li><strong>Méthode:</strong> ${formatPaymentMethod(payment.payment_method)}</li>
          <li><strong>Date:</strong> ${new Date(payment.payment_date).toLocaleDateString("fr-FR")}</li>
        </ul>
      </div>

      <p>Statut actuel: <strong>EN ATTENTE</strong></p>
      <p>Veuillez ne pas effectuer un nouveau paiement. Nous vérifierons votre paiement sous peu.</p>

      <p>Cordialement,<br/>
      L'équipe AKIG Agency</p>
    `;

    await sendEmail(
      payment.email,
      `Avis de Paiement - ${payment.contract_ref}`,
      emailContent
    );

    // Log notification
    await logNotification(
      paymentId,
      "EMAIL",
      "PENDING_PAYMENT",
      payment.email,
      "sent"
    );

    console.log(`📧 Email sent to ${payment.email} for payment ${paymentId}`);
  } catch (error) {
    console.error("Error notifying pending payment:", error);
    await logNotification(paymentId, "EMAIL", "PENDING_PAYMENT", "", "failed", error.message);
  }
}

/**
 * Envoyer rappel de paiement
 */
async function sendPaymentReminder(contractId) {
  try {
    const contractQuery = await pool.query(
      `SELECT
         c.id, c.reference, c.monthly_rent,
         t.first_name, t.last_name, t.email,
         p.address, p.city
       FROM contracts c
       LEFT JOIN tenants t ON c.tenant_id = t.id
       LEFT JOIN properties p ON c.property_id = p.id
       WHERE c.id = $1`,
      [contractId]
    );

    if (contractQuery.rows.length === 0) {
      throw new Error("Contract not found");
    }

    const contract = contractQuery.rows[0];

    // Vérifier paiements du mois
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const paymentsThisMonth = await pool.query(
      `SELECT COUNT(*) as count FROM payments_enhanced
       WHERE contract_id = $1 
       AND status = 'COMPLETED'
       AND payment_date >= $2 AND payment_date <= $3`,
      [contractId, startOfMonth, endOfMonth]
    );

    // Si pas payé ce mois
    if (paymentsThisMonth.rows[0].count === 0) {
      const emailContent = `
        <h1>Rappel de Paiement</h1>
        <p>Cher(e) ${contract.first_name} ${contract.last_name},</p>
        
        <p>Nous vous rappelons que votre <strong>loyer du mois est dû</strong>.</p>
        
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Informations de Paiement:</strong></p>
          <ul>
            <li><strong>Contrat:</strong> ${contract.reference}</li>
            <li><strong>Montant mensuel:</strong> ${contract.monthly_rent.toLocaleString()} FG</li>
            <li><strong>Propriété:</strong> ${contract.address}, ${contract.city}</li>
          </ul>
        </div>

        <p>Veuillez effectuer votre paiement rapidement pour éviter des pénalités.</p>

        <p><strong>Méthodes de paiement disponibles:</strong></p>
        <ul>
          <li>✓ Espèces à l'agence</li>
          <li>✓ Virement bancaire</li>
          <li>✓ Orange Money</li>
          <li>✓ Chèque bancaire</li>
        </ul>

        <p>Pour plus d'informations, contactez-nous:<br/>
        📞 +224 XXXXXXX<br/>
        📧 contact@akig.gn</p>

        <p>Cordialement,<br/>
        L'équipe AKIG Agency</p>
      `;

      await sendEmail(
        contract.email,
        `Rappel de Paiement - ${contract.reference}`,
        emailContent
      );

      // Log dans payment_reminders
      await pool.query(
        `INSERT INTO payment_reminders (contract_id, reminder_type, sent_via, sent_at, status)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [contractId, "MONTHLY", "EMAIL", "sent"]
      );

      console.log(
        `📧 Reminder email sent to ${contract.email} for contract ${contractId}`
      );
    }
  } catch (error) {
    console.error("Error sending payment reminder:", error);
  }
}

/**
 * Envoyer alerte de paiement échoué
 */
async function notifyPaymentFailed(paymentId, reason) {
  try {
    const paymentQuery = await pool.query(
      `SELECT
         pe.id, pe.amount, pe.reference_number,
         t.first_name, t.last_name, t.email,
         c.reference as contract_ref
       FROM payments_enhanced pe
       LEFT JOIN tenants t ON pe.tenant_id = t.id
       LEFT JOIN contracts c ON pe.contract_id = c.id
       WHERE pe.id = $1`,
      [paymentId]
    );

    if (paymentQuery.rows.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = paymentQuery.rows[0];

    const emailContent = `
      <h1>⚠️ Alerte de Paiement</h1>
      <p>Cher(e) ${payment.first_name} ${payment.last_name},</p>
      
      <p>Nous avons une <strong>anomalie avec votre paiement</strong>.</p>
      
      <div style="background: #f8d7da; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
        <p><strong>Détails:</strong></p>
        <ul>
          <li><strong>Référence:</strong> ${payment.reference_number || "N/A"}</li>
          <li><strong>Montant:</strong> ${payment.amount.toLocaleString()} FG</li>
          <li><strong>Contrat:</strong> ${payment.contract_ref}</li>
          <li><strong>Raison:</strong> ${reason || "Vérification en cours"}</li>
        </ul>
      </div>

      <p>Nous avons détecté un problème avec votre paiement. Veuillez:</p>
      <ol>
        <li>Vérifier les détails de votre paiement initial</li>
        <li>Nous contacter immédiatement si vous avez des questions</li>
        <li>Effectuer un nouveau paiement si nécessaire</li>
      </ol>

      <p>Contactez-nous:<br/>
      📞 +224 XXXXXXX<br/>
      📧 contact@akig.gn</p>

      <p>Cordialement,<br/>
      L'équipe AKIG Agency</p>
    `;

    await sendEmail(
      payment.email,
      `⚠️ Alerte Paiement - ${payment.contract_ref}`,
      emailContent
    );

    await logNotification(
      paymentId,
      "EMAIL",
      "PAYMENT_FAILED",
      payment.email,
      "sent"
    );

    console.log(`🚨 Alert email sent to ${payment.email} for payment ${paymentId}`);
  } catch (error) {
    console.error("Error notifying payment failed:", error);
  }
}

/**
 * Envoyer notification de confirmation de paiement
 */
async function notifyPaymentConfirmed(paymentId) {
  try {
    const paymentQuery = await pool.query(
      `SELECT
         pe.id, pe.amount, pe.reference_number, pe.payment_date,
         pe.payment_method,
         t.first_name, t.last_name, t.email,
         c.reference as contract_ref,
         u.first_name as agent_first, u.last_name as agent_last
       FROM payments_enhanced pe
       LEFT JOIN tenants t ON pe.tenant_id = t.id
       LEFT JOIN contracts c ON pe.contract_id = c.id
       LEFT JOIN users u ON pe.verified_by = u.id
       WHERE pe.id = $1`,
      [paymentId]
    );

    if (paymentQuery.rows.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = paymentQuery.rows[0];

    const emailContent = `
      <h1>✅ Paiement Confirmé</h1>
      <p>Cher(e) ${payment.first_name} ${payment.last_name},</p>
      
      <p>Nous vous confirmons la <strong>réception et validation de votre paiement</strong>.</p>
      
      <div style="background: #d4edda; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745;">
        <p><strong>Détails du Paiement Confirmé:</strong></p>
        <ul>
          <li><strong>Montant:</strong> ${payment.amount.toLocaleString()} FG</li>
          <li><strong>Contrat:</strong> ${payment.contract_ref}</li>
          <li><strong>Référence:</strong> ${payment.reference_number || "N/A"}</li>
          <li><strong>Méthode:</strong> ${formatPaymentMethod(payment.payment_method)}</li>
          <li><strong>Date de paiement:</strong> ${new Date(payment.payment_date).toLocaleDateString("fr-FR")}</li>
          <li><strong>Statut:</strong> <strong style="color: green;">CONFIRMÉ</strong></li>
        </ul>
      </div>

      <p>Votre quittance est disponible dans votre portail locataire.</p>

      <p>Merci de votre confiance!<br/>
      L'équipe AKIG Agency</p>
    `;

    await sendEmail(
      payment.email,
      `✅ Paiement Confirmé - ${payment.contract_ref}`,
      emailContent
    );

    await logNotification(
      paymentId,
      "EMAIL",
      "PAYMENT_CONFIRMED",
      payment.email,
      "sent"
    );

    console.log(
      `✅ Confirmation email sent to ${payment.email} for payment ${paymentId}`
    );
  } catch (error) {
    console.error("Error notifying payment confirmed:", error);
  }
}

/**
 * Envoyer email générique
 */
async function sendEmail(to, subject, htmlContent) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@akig.gn",
      to,
      subject,
      html: htmlContent,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Logger une notification
 */
async function logNotification(
  paymentId,
  type,
  notificationType,
  recipient,
  status,
  errorMsg = null
) {
  try {
    if (paymentId) {
      // Si table notifications existe
      await pool.query(
        `INSERT INTO notifications (payment_id, type, notification_type, recipient, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [paymentId, type, notificationType, recipient, status, errorMsg]
      );
    }
  } catch (error) {
    console.error("Error logging notification:", error);
  }
}

/**
 * Utilitaires
 */
function formatPaymentMethod(method) {
  const methods = {
    CASH: "Espèces",
    CHECK: "Chèque",
    TRANSFER: "Virement Bancaire",
    ORANGE_MONEY: "Orange Money",
    MTN_MOBILE_MONEY: "MTN Mobile Money",
    MERCHANT: "Merchant Mobile Money",
  };
  return methods[method] || method;
}

/**
 * Planifier rappels mensuels (à lancer via cron job)
 */
async function scheduleMonthlyReminders() {
  try {
    const contracts = await pool.query(
      `SELECT c.id FROM contracts c
       WHERE c.status = 'ACTIVE'
       LIMIT 100`
    );

    for (const contract of contracts.rows) {
      await sendPaymentReminder(contract.id);
    }

    console.log(`📅 Scheduled reminders for ${contracts.rows.length} contracts`);
  } catch (error) {
    console.error("Error scheduling reminders:", error);
  }
}

module.exports = {
  notifyPendingPayment,
  sendPaymentReminder,
  notifyPaymentFailed,
  notifyPaymentConfirmed,
  sendEmail,
  logNotification,
  scheduleMonthlyReminders,
  formatPaymentMethod,
};
