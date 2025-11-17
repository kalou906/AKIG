/**
 * Configuration Alertes SMS/Email
 * backend/src/utils/ALERTS_SETUP.js (documentation)
 */

/**
 * CONFIGURATION SMTP REQUISE
 * 
 * Variables d'environnement à ajouter au .env:
 * 
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_SECURE=false
 * SMTP_USER=votre-email@gmail.com
 * SMTP_PASSWORD=votre-app-password
 * SMTP_FROM=noreply@akig.local
 * ALERT_EMAIL=admin@akig.local
 * 
 */

/**
 * GMAIL SETUP (recommandé)
 * 
 * 1. Activer 2FA sur compte Gmail
 * 2. Générer "App Password":
 *    - Google Account > Security > 2-Step Verification
 *    - App passwords > Select app "Mail" > Generate
 *    - Copier mot de passe 16 caractères
 * 
 * 3. Configuration .env:
 *    SMTP_HOST=smtp.gmail.com
 *    SMTP_PORT=587
 *    SMTP_SECURE=false
 *    SMTP_USER=your-email@gmail.com
 *    SMTP_PASSWORD=xxxx xxxx xxxx xxxx
 * 
 */

/**
 * OUTLOOK SETUP
 * 
 * Configuration .env:
 * SMTP_HOST=smtp-mail.outlook.com
 * SMTP_PORT=587
 * SMTP_SECURE=false
 * SMTP_USER=your-email@outlook.com
 * SMTP_PASSWORD=your-password
 * 
 */

/**
 * INTÉGRATION DANS index.js
 * 
 * Ajouter après app.use(...) middleware:
 * 
 * const alertCron = require('./jobs/alert-cron');
 * 
 * // Initialiser tâches cron au démarrage
 * if (process.env.NODE_ENV !== 'test') {
 *   alertCron.initializeCronJobs();
 * }
 * 
 * // Arrêter tâches en fermeture
 * process.on('SIGTERM', () => {
 *   alertCron.stopCronJobs();
 *   pool.end();
 *   process.exit(0);
 * });
 * 
 */

/**
 * TEST CONFIGURATION
 * 
 * Endpoint de test:
 * 
 * router.post('/api/alerts/test-email', authenticate, async (req, res) => {
 *   try {
 *     await AlertService.testEmailConnection();
 *     res.json({ message: 'Connexion SMTP OK' });
 *   } catch (err) {
 *     res.status(500).json({ error: err.message });
 *   }
 * });
 * 
 * Appel:
 * POST /api/alerts/test-email
 * Headers: Authorization: Bearer {token}
 * 
 */

/**
 * CALENDRIER CRON CONFIGURÉ
 * 
 * Toutes les heures:
 * ┌───────────── minute (0 - 59)
 * │ ┌───────────── heure (0 - 23)
 * │ │ ┌───────────── jour du mois (1 - 31)
 * │ │ │ ┌───────────── mois (1 - 12)
 * │ │ │ │ ┌───────────── jour de la semaine (0 - 6) (0 = Dimanche)
 * │ │ │ │ │
 * │ │ │ │ │
 * * * * * *
 * 
 * JOBS ACTIFS:
 * 
 * 1. Vérification impayés critiques (> 30 jours):
 *    "0 */2 * * *" = Chaque 2 heures à :00
 *    Exécution: 00:00, 02:00, 04:00, ... 22:00
 * 
 * 2. Rapport quotidien impayés:
 *    "0 8 * * *" = Tous les jours à 08:00
 *    Timezone: Africa/Algiers (UTC+1)
 * 
 * 3. Rappels paiements (> 15 jours):
 *    "0 9 * * *" = Tous les jours à 09:00
 * 
 * 4. Réinitialisation flags reminders:
 *    "0 23 * * *" = Tous les jours à 23:00
 * 
 */

/**
 * ALERTES DISPONIBLES
 * 
 * 1. sendImpayeAlert(impaye, tenant)
 *    - Email au gestionnaire
 *    - Sujet: "⚠️ ALERTE IMPAYÉ - [Nom] - [Montant]€"
 *    - Contenu: Détails impayé, actions recommandées
 *    - Déclenché par: Cron automatique (> 30 jours)
 * 
 * 2. sendPaymentReceivedAlert(payment, tenant)
 *    - Email au locataire
 *    - Sujet: "✅ Paiement reçu - [Montant]€"
 *    - Contenu: Confirmation paiement
 *    - À déclencher: Lors enregistrement paiement
 * 
 * 3. sendDailyReport(impayesOuverts, montantTotal)
 *    - Email au gestionnaire
 *    - Contenu: Tableau impayés, total, actions
 *    - Déclenché: 08:00 quotidien
 * 
 * 4. sendQuittanceNotification(quittance, tenant)
 *    - Email au locataire
 *    - Sujet: "📄 Quittance de loyer - [Période]"
 *    - Contenu: Détails quittance
 *    - À déclencher: Lors génération quittance
 * 
 */

/**
 * INTÉGRATION ROUTES PAIEMENTS
 * 
 * routes/payments.js:
 * 
 * router.post('/api/payments', authenticate, async (req, res) => {
 *   try {
 *     // ... enregistrer paiement ...
 *     
 *     // Récupérer tenant
 *     const tenant = await pool.query(
 *       'SELECT * FROM tenants WHERE id = $1',
 *       [payment.tenant_id]
 *     );
 *     
 *     // Envoyer confirmation
 *     await AlertService.sendPaymentReceivedAlert(
 *       payment,
 *       tenant.rows[0]
 *     );
 *     
 *     res.json({ message: 'Paiement enregistré' });
 *   } catch (err) {
 *     res.status(500).json({ error: err.message });
 *   }
 * });
 * 
 */

/**
 * DÉPANNAGE
 * 
 * Problème: "Connexion SMTP échouée"
 * Solution: 
 * - Vérifier SMTP_USER et SMTP_PASSWORD corrects
 * - Vérifier SMTP_HOST et SMTP_PORT
 * - Checker pare-feu bloque port SMTP
 * - Test: npm run test:email
 * 
 * Problème: "Emails rejetés comme spam"
 * Solution:
 * - Configurer SPF, DKIM, DMARC dans DNS
 * - Utiliser email domaine (pas Gmail personnel)
 * - Ajouter unsubscribe link (good practice)
 * 
 * Problème: "Tâches cron ne s'exécutent pas"
 * Solution:
 * - Vérifier NODE_ENV !== 'test'
 * - Vérifier logs: npm run dev | grep "Cron"
 * - Vérifier BD connection active
 * - Test manuel: node -e "require('./src/jobs/alert-cron').checkCriticalArrears()"
 * 
 */

module.exports = {
  documentation: 'Voir commentaires ci-dessus pour configuration complète'
};
