const cron = require('node-cron');
const logger = require('../utils/logger');

// 5 du mois 07:00 – factures périodiques
cron.schedule('0 7 5 * *', async () => {
  try {
    logger.info('Cron: Génération factures périodiques (5 du mois)');
    // TODO: Générer factures selon periodicité des contrats et insérer dans factures/facture_lignes
  } catch (e) {
    logger.error('Erreur cron factures périodiques', { error: e.message });
  }
});

// Quotidien 00:01 – check retards
cron.schedule('1 0 * * *', async () => {
  try {
    logger.info('Cron: Vérification retards paiements (J+6/J+30)');
    // TODO: Appliquer pénalités 10%, flag fermeture
  } catch (e) {
    logger.error('Erreur cron retards paiements', { error: e.message });
  }
});

// Quotidien 08:00 – rappels paiements
cron.schedule('0 8 * * *', async () => {
  try {
    logger.info('Cron: Envoi rappels paiements quotidiens');
    // TODO: notificationService.sendPaymentReminder(...)
  } catch (e) {
    logger.error('Erreur cron rappels paiements', { error: e.message });
  }
});

// Quotidien 18:00 – préavis
cron.schedule('0 18 * * *', async () => {
  try {
    logger.info('Cron: Contrôle préavis fin de contrat');
    // TODO: Notifications renouvellement/reconduction tacite
  } catch (e) {
    logger.error('Erreur cron préavis', { error: e.message });
  }
});

// Le 25 à 09:00 – remise des clés
cron.schedule('0 9 25 * *', async () => {
  try {
    logger.info('Cron: Contrôle remise des clés (25)');
    // TODO: Bloquer restitution caution si EDL sortie manquant
  } catch (e) {
    logger.error('Erreur cron remise des clés', { error: e.message });
  }
});

module.exports = {};
