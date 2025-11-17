/**
 * Configuration Export PDF Avancé
 * backend/src/utils/PDF_SETUP.md
 */

/**
 * INTÉGRATION ROUTES DANS index.js
 * 
 * Ajouter dans section routes (après autres routes):
 * 
 * const pdfRoutes = require('./routes/pdf.routes');
 * app.use('/api/pdf', pdfRoutes);
 * 
 */

/**
 * ENDPOINTS PDF DISPONIBLES
 * 
 * 1. GET /api/pdf/quittance/:quittanceId
 *    - Génère quittance PDF
 *    - Auth: Oui (Bearer token)
 *    - Réponse: Fichier PDF téléchargé
 *    - Exemple: GET /api/pdf/quittance/123
 * 
 * 2. GET /api/pdf/rapport-impayes?month=12&year=2024
 *    - Génère rapport impayés mensuel
 *    - Auth: Oui
 *    - Query params: month (1-12), year (optionnel)
 *    - Réponse: Fichier PDF téléchargé
 * 
 * 3. GET /api/pdf/contrat/:contractId
 *    - Génère contrat locatif PDF
 *    - Auth: Oui
 *    - Réponse: Fichier PDF téléchargé
 * 
 * 4. GET /api/pdf/bordereau-paiements?dateStart=2024-01-01&dateEnd=2024-12-31
 *    - Génère bordereau paiements PDF
 *    - Auth: Oui
 *    - Query params: dateStart, dateEnd (optionnel)
 *    - Réponse: Fichier PDF téléchargé
 * 
 */

/**
 * EXEMPLES UTILISATION
 * 
 * 1. Télécharger quittance:
 * 
 * const response = await fetch('/api/pdf/quittance/123', {
 *   headers: {
 *     'Authorization': 'Bearer ' + token
 *   }
 * });
 * 
 * const blob = await response.blob();
 * const url = window.URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'quittance.pdf';
 * a.click();
 * 
 * 2. Rapport impayés du mois en cours:
 * 
 * GET /api/pdf/rapport-impayes
 * 
 * 3. Bordereau année complète:
 * 
 * GET /api/pdf/bordereau-paiements?dateStart=2024-01-01&dateEnd=2024-12-31
 * 
 */

/**
 * FONCTIONNALITÉS PDF
 * 
 * Quittance:
 * ✅ En-tête AKIG
 * ✅ Infos propriété
 * ✅ Infos locataire (nom, tél, email)
 * ✅ Détails montants (loyer, charges, total)
 * ✅ Statut paiement (Payé/Impayé)
 * ✅ QR Code vérification en ligne
 * ✅ Pied de page légal
 * ✅ Support multilingue (FR/AR)
 * 
 * Rapport Impayés:
 * ✅ Statistiques globales (total, count, statuts)
 * ✅ Tableau 20 premiers impayés
 * ✅ Couleurs code (Rouge >60j, Orange >30j)
 * ✅ Jours d'ancienneté calculés
 * ✅ Date génération
 * 
 * Contrat:
 * ✅ Numéro contrat
 * ✅ Parties (locataire, propriétaire)
 * ✅ Conditions (loyer, dates, durée)
 * ✅ Zones signatures
 * 
 * Bordereau Paiements:
 * ✅ Tableau chronologique
 * ✅ Colonnes: Date, Locataire, Montant, Méthode, Ref
 * ✅ Total montants
 * ✅ Filtrage date
 * 
 */

/**
 * SÉCURITÉ
 * 
 * ✅ Authentification Bearer token requis
 * ✅ Limite 20 impayés dans rapport (pagination possible)
 * ✅ Fichiers temporaires dans /public/pdf
 * ✅ Logs toutes générations PDF
 * ✅ Gestion erreurs avec try/catch
 * ✅ Verbes correct (GET pour téléchargements)
 * 
 */

/**
 * AMÉLIORATIONS FUTURES
 * 
 * [ ] Nettoyage fichiers > 24h (cron job)
 * [ ] Envoi email quittance auto après génération
 * [ ] Multi-page rapport pour > 20 impayés
 * [ ] Support langues (FR/AR) dans PDF
 * [ ] Compression PDF pour réduire taille
 * [ ] Watermark "DRAFT" pour documents non finaux
 * [ ] Export Excel en complément PDF
 * [ ] Signature électronique sur contrats
 * 
 */

/**
 * DÉPANNAGE
 * 
 * Erreur: "Directory not found /public/pdf"
 * Solution: Le dossier est créé automatiquement par pdf.service.js
 * 
 * Erreur: "Quittance non trouvée"
 * Cause: ID invalide ou quittance supprimée
 * Solution: Vérifier l'ID existe dans BD
 * 
 * Erreur: "QR code génération échouée"
 * Cause: Connexion Internet problématique
 * Impact: PDF généré sans QR code
 * Solution: Non bloquant, quittance valide
 * 
 * PDF vide/incomplet
 * Cause: BD connection timeout
 * Solution: Vérifier pool PostgreSQL active
 * 
 */

module.exports = {
  documentation: 'Voir ci-dessus pour configuration complète'
};
