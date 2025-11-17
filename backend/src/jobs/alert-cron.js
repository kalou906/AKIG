/**
 * Tâches Cron Alertes
 * Vérifie impayés critiques, envoie rapports quotidiens
 * backend/src/jobs/alert-cron.js
 */

const cron = require('node-cron');
const logger = require('../services/logger');
const AlertService = require('../services/alert.service');
const pool = require('../db');

/**
 * Vérifie impayés ouverts > 30 jours et envoie alerte
 */
async function checkCriticalArrears() {
  try {
    logger.info('Vérification impayés critiques...');

    const result = await pool.query(`
      SELECT 
        i.id, i.montant, i.periode, i.statut, i.date_echeance,
        t.nom, t.email, t.telephone
      FROM impayes i
      JOIN tenants t ON i.tenant_id = t.id
      WHERE i.statut = 'ouvert' 
        AND DATE_PART('day', NOW() - i.created_at) > 30
      ORDER BY i.montant DESC
      LIMIT 50
    `);

    for (const impaye of result.rows) {
      const tenant = {
        nom: impaye.nom,
        email: impaye.email,
        telephone: impaye.telephone
      };

      await AlertService.sendImpayeAlert(impaye, tenant);
    }

    logger.info('Vérification impayés critiques terminée', { 
      count: result.rows.length 
    });
  } catch (err) {
    logger.error('Erreur vérification impayés critiques', err);
  }
}

/**
 * Génère rapport impayés quotidien à 08:00
 */
async function dailyArrearsReport() {
  try {
    logger.info('Génération rapport quotidien impayés...');

    const result = await pool.query(`
      SELECT 
        i.id, i.montant, i.periode, i.tenant_id,
        t.nom as nomTenant
      FROM impayes i
      JOIN tenants t ON i.tenant_id = t.id
      WHERE i.statut = 'ouvert'
      ORDER BY i.montant DESC
    `);

    if (result.rows.length === 0) {
      logger.info('Aucun impayé ouvert');
      return;
    }

    const montantTotal = result.rows.reduce((sum, i) => sum + i.montant, 0);

    await AlertService.sendDailyReport(result.rows, montantTotal);

    logger.info('Rapport quotidien envoyé', {
      impayesCount: result.rows.length,
      montantTotal
    });
  } catch (err) {
    logger.error('Erreur génération rapport quotidien', err);
  }
}

/**
 * Envoie rappels paiements en retard > 15 jours
 */
async function sendPaymentReminders() {
  try {
    logger.info('Envoi rappels paiements...');

    const result = await pool.query(`
      SELECT 
        i.id, i.montant, i.periode, i.date_echeance,
        t.id as tenant_id, t.nom, t.email, t.telephone
      FROM impayes i
      JOIN tenants t ON i.tenant_id = t.id
      WHERE i.statut = 'ouvert'
        AND DATE_PART('day', NOW() - i.date_echeance) > 15
        AND i.reminder_sent = FALSE
      ORDER BY i.date_echeance ASC
      LIMIT 30
    `);

    for (const impaye of result.rows) {
      try {
        const tenant = {
          nom: impaye.nom,
          email: impaye.email,
          telephone: impaye.telephone
        };

        await AlertService.sendImpayeAlert(impaye, tenant);

        // Marquer rappel envoyé
        await pool.query(
          'UPDATE impayes SET reminder_sent = TRUE WHERE id = $1',
          [impaye.id]
        );
      } catch (err) {
        logger.error('Erreur envoi rappel', { impayeId: impaye.id, err });
      }
    }

    logger.info('Rappels envoyés', { count: result.rows.length });
  } catch (err) {
    logger.error('Erreur envoi rappels', err);
  }
}

/**
 * Réinitialise flags reminder quotidiennement
 * pour relancer les rappels chaque semaine
 */
async function resetReminderFlags() {
  try {
    const result = await pool.query(`
      UPDATE impayes 
      SET reminder_sent = FALSE
      WHERE statut = 'ouvert' 
        AND reminder_sent = TRUE
        AND DATE_PART('day', NOW() - last_reminder_date) >= 7
      RETURNING id
    `);

    logger.info('Flags reminders réinitialisés', { count: result.rowCount });
  } catch (err) {
    logger.error('Erreur réinitialisation reminders', err);
  }
}

/**
 * Initialise toutes les tâches cron
 */
function initializeCronJobs() {
  try {
    logger.info('Initialisation tâches cron alertes...');

    // Chaque 2 heures: vérifier impayés > 30 jours
    cron.schedule('0 */2 * * *', checkCriticalArrears, {
      scheduled: true,
      timezone: 'Africa/Algiers'
    });
    logger.info('Cron: Vérification impayés critiques (chaque 2h)');

    // Quotidien 08:00: rapport impayés
    cron.schedule('0 8 * * *', dailyArrearsReport, {
      scheduled: true,
      timezone: 'Africa/Algiers'
    });
    logger.info('Cron: Rapport quotidien (08:00)');

    // Quotidien 09:00: rappels paiements
    cron.schedule('0 9 * * *', sendPaymentReminders, {
      scheduled: true,
      timezone: 'Africa/Algiers'
    });
    logger.info('Cron: Rappels paiements (09:00)');

    // Quotidien 23:00: réinitialiser flags
    cron.schedule('0 23 * * *', resetReminderFlags, {
      scheduled: true,
      timezone: 'Africa/Algiers'
    });
    logger.info('Cron: Réinitialisation reminders (23:00)');

    logger.info('✅ Toutes les tâches cron initialisées');
  } catch (err) {
    logger.error('Erreur initialisation cron jobs', err);
  }
}

/**
 * Arrête toutes les tâches cron
 */
function stopCronJobs() {
  cron.getTasks().forEach(task => {
    task.stop();
  });
  logger.info('Tâches cron arrêtées');
}

module.exports = {
  initializeCronJobs,
  stopCronJobs,
  checkCriticalArrears,
  dailyArrearsReport,
  sendPaymentReminders,
  resetReminderFlags
};
