/**
 * Branding Service
 * backend/src/services/branding.js
 * 
 * Gestion du branding et templates pour communications
 */

/**
 * Formate un email avec le header AKIG
 */
function email(html) {
  return `
    <div style="background:#0b5;color:#fff;padding:12px;font-weight:bold;font-size:18px">AKIG</div>
    <div style="padding:16px;font-family:Arial,sans-serif;line-height:1.6">${html}</div>
    <div style="background:#f5f5f5;padding:12px;font-size:12px;color:#666;margin-top:20px;border-top:1px solid #ddd">
      <p>© 2025 AKIG. Tous droits réservés.</p>
    </div>
  `;
}

/**
 * Formate un SMS avec le prefix AKIG
 */
function sms(text) {
  return `AKIG: ${text}`;
}

/**
 * Template pour email de bienvenue
 */
function welcomeEmail(userName) {
  return email(`
    <h2>Bienvenue sur AKIG!</h2>
    <p>Bonjour ${userName},</p>
    <p>Nous sommes ravis de vous accueillir sur notre plateforme de gestion immobilière.</p>
    <p>Vous pouvez maintenant accéder à tous les modules de gestion pour optimiser votre activité.</p>
    <p><a href="https://akig.app/dashboard" style="background:#0b5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">Accéder au tableau de bord</a></p>
  `);
}

/**
 * Template pour email de réinitialisation de mot de passe
 */
function resetPasswordEmail(resetLink) {
  return email(`
    <h2>Réinitialiser votre mot de passe</h2>
    <p>Vous avez demandé une réinitialisation de mot de passe.</p>
    <p>Cliquez sur le lien ci-dessous pour continuer:</p>
    <p><a href="${resetLink}" style="background:#0b5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">Réinitialiser le mot de passe</a></p>
    <p><strong>Important:</strong> Ce lien expirera dans 24 heures.</p>
    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
  `);
}

/**
 * Template pour email de confirmation
 */
function confirmationEmail(confirmLink) {
  return email(`
    <h2>Confirmer votre adresse email</h2>
    <p>Merci de confirmer votre adresse email pour accéder à AKIG.</p>
    <p><a href="${confirmLink}" style="background:#0b5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">Confirmer mon email</a></p>
    <p>Ce lien expirera dans 48 heures.</p>
  `);
}

/**
 * Template pour email de notification de feedback
 */
function feedbackNotificationEmail(feedbackData) {
  return email(`
    <h2>Nouveau feedback reçu</h2>
    <p><strong>Catégorie:</strong> ${feedbackData.category}</p>
    <p><strong>Score:</strong> ${feedbackData.score}/10</p>
    <p><strong>Sentiment:</strong> ${getSentimentLabel(feedbackData.sentiment)}</p>
    <p><strong>Commentaire:</strong></p>
    <blockquote style="background:#f0f0f0;padding:12px;border-left:4px solid #0b5;margin:10px 0">
      ${feedbackData.comment}
    </blockquote>
    <p><a href="https://akig.app/feedback/${feedbackData.id}" style="background:#0b5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">Voir le feedback</a></p>
  `);
}

/**
 * Template pour email de contrat expirant
 */
function contractExpiringEmail(contractData) {
  return email(`
    <h2>Alerte: Contrat expirant</h2>
    <p><strong>Propriété:</strong> ${contractData.propertyName}</p>
    <p><strong>Locataire:</strong> ${contractData.tenantName}</p>
    <p><strong>Date d'expiration:</strong> ${contractData.expirationDate}</p>
    <p>Veuillez renouveler ce contrat ou prendre les mesures nécessaires avant la date d'expiration.</p>
    <p><a href="https://akig.app/contracts/${contractData.id}" style="background:#0b5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">Gérer le contrat</a></p>
  `);
}

/**
 * Template pour email de paiement
 */
function paymentConfirmationEmail(paymentData) {
  return email(`
    <h2>Confirmation de paiement</h2>
    <p>Votre paiement a été traité avec succès.</p>
    <p><strong>Montant:</strong> ${paymentData.amount}€</p>
    <p><strong>Date:</strong> ${paymentData.date}</p>
    <p><strong>Référence:</strong> ${paymentData.reference}</p>
    <p><a href="https://akig.app/payments/${paymentData.id}" style="background:#0b5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">Voir le reçu</a></p>
  `);
}

/**
 * Template pour SMS d'alerte
 */
function alertSMS(message) {
  return sms(message);
}

/**
 * Template pour SMS de code de vérification
 */
function verificationCodeSMS(code) {
  return sms(`Votre code de vérification est: ${code}`);
}

/**
 * Helper pour obtenir le libellé du sentiment
 */
function getSentimentLabel(sentiment) {
  const labels = {
    positive: '😊 Positif',
    negative: '😔 Négatif',
    neutral: '😐 Neutre',
  };
  return labels[sentiment] || sentiment;
}

/**
 * Helper pour obtenir la couleur du sentiment (pour HTML/CSS)
 */
function getSentimentColor(sentiment) {
  const colors = {
    positive: '#27ae60',
    negative: '#e74c3c',
    neutral: '#f39c12',
  };
  return colors[sentiment] || '#95a5a6';
}

/**
 * Helper pour formater une date
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Helper pour formater un montant
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

module.exports = {
  email,
  sms,
  welcomeEmail,
  resetPasswordEmail,
  confirmationEmail,
  feedbackNotificationEmail,
  contractExpiringEmail,
  paymentConfirmationEmail,
  alertSMS,
  verificationCodeSMS,
  getSentimentLabel,
  getSentimentColor,
  formatDate,
  formatCurrency,
};
