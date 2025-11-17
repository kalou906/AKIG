/**
 * 📊 Routes Dashboards Personnalisés
 */

const express = require('express');
const { vérifierToken } = require('../middlewares/authentification');
const ServiceDashboard = require('../services/dashboard-personnalisé.service');
const logger = require('../services/logger');

const routeur = express.Router();

/**
 * Créer dashboard personnalisé
 * POST /api/dashboards/créer
 */
routeur.post('/créer', vérifierToken, async (req, res) => {
  try {
    const { nom, type, widgets, colorTheme, layout } = req.body;

    if (!nom) {
      return res.status(400).json({
        succès: false,
        message: 'Nom du dashboard requis'
      });
    }

    const résultat = await ServiceDashboard.créerDashboard({
      userId: req.utilisateur.id,
      agenceId: req.utilisateur.agenceId,
      nom,
      type: type || 'GÉNÉRAL',
      widgets: widgets || [],
      colorTheme: colorTheme || 'bleu',
      layout: layout || 'grille'
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur création dashboard:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la création du dashboard'
    });
  }
});

/**
 * Obtenir dashboard
 * GET /api/dashboards/:dashboardId
 */
routeur.get('/:dashboardId', vérifierToken, async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const résultat = await ServiceDashboard.obtenirDashboard(dashboardId);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur récupération dashboard:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération du dashboard'
    });
  }
});

/**
 * Widget - Statistiques Ventes
 * GET /api/dashboards/widgets/ventes
 */
routeur.get('/widgets/ventes', vérifierToken, async (req, res) => {
  try {
    const { période } = req.query;

    const widget = ServiceDashboard.générerWidgetVentes(
      req.utilisateur.agenceId,
      période || '30jours'
    );

    res.json({
      succès: true,
      widget
    });
  } catch (erreur) {
    logger.erreur('Erreur widget ventes:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du widget'
    });
  }
});

/**
 * Widget - Inventaire Propriétés
 * GET /api/dashboards/widgets/propriétés
 */
routeur.get('/widgets/propriétés', vérifierToken, async (req, res) => {
  try {
    const widget = ServiceDashboard.générerWidgetPropriétés(req.utilisateur.agenceId);

    res.json({
      succès: true,
      widget
    });
  } catch (erreur) {
    logger.erreur('Erreur widget propriétés:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du widget'
    });
  }
});

/**
 * Widget - Performance
 * GET /api/dashboards/widgets/performance
 */
routeur.get('/widgets/performance', vérifierToken, async (req, res) => {
  try {
    const widget = ServiceDashboard.générerWidgetPerformance(req.utilisateur.agenceId);

    res.json({
      succès: true,
      widget
    });
  } catch (erreur) {
    logger.erreur('Erreur widget performance:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du widget'
    });
  }
});

/**
 * Widget - Marché
 * GET /api/dashboards/widgets/marché
 */
routeur.get('/widgets/marché', async (req, res) => {
  try {
    const widget = ServiceDashboard.générerWidgetMarché();

    res.json({
      succès: true,
      widget
    });
  } catch (erreur) {
    logger.erreur('Erreur widget marché:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du widget'
    });
  }
});

/**
 * Widget - Notifications
 * GET /api/dashboards/widgets/notifications
 */
routeur.get('/widgets/notifications', vérifierToken, async (req, res) => {
  try {
    const widget = ServiceDashboard.générerWidgetNotifications(req.utilisateur.id);

    res.json({
      succès: true,
      widget
    });
  } catch (erreur) {
    logger.erreur('Erreur widget notifications:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du widget'
    });
  }
});

/**
 * Widget - Transactions
 * GET /api/dashboards/widgets/transactions
 */
routeur.get('/widgets/transactions', vérifierToken, async (req, res) => {
  try {
    const widget = ServiceDashboard.générerWidgetTransactions(req.utilisateur.agenceId);

    res.json({
      succès: true,
      widget
    });
  } catch (erreur) {
    logger.erreur('Erreur widget transactions:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du widget'
    });
  }
});

/**
 * Dashboard complet par type
 * GET /api/dashboards/complet/:type
 */
routeur.get('/complet/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const résultat = ServiceDashboard.générerDashboardComplet(type);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur dashboard complet:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du dashboard'
    });
  }
});

/**
 * Exporter dashboard
 * GET /api/dashboards/:dashboardId/exporter
 */
routeur.get('/:dashboardId/exporter', vérifierToken, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { format } = req.query;

    const résultat = await ServiceDashboard.exporterDashboard(
      dashboardId,
      format || 'PDF'
    );

    if (résultat.statut === 'succès') {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${résultat.fichier.nom}"`);
    }

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur export:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'export'
    });
  }
});

/**
 * Modèles de dashboards
 * GET /api/dashboards/modèles
 */
routeur.get('/modèles', async (req, res) => {
  try {
    const modèles = ServiceDashboard.obtenirModèles();

    res.json({
      succès: true,
      modèles
    });
  } catch (erreur) {
    logger.erreur('Erreur modèles:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des modèles'
    });
  }
});

/**
 * Dashboard général pour accueil
 * GET /api/dashboards/principal
 */
routeur.get('/principal', vérifierToken, async (req, res) => {
  try {
    const résultat = ServiceDashboard.générerDashboardComplet('GÉNÉRAL');

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur dashboard principal:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du dashboard'
    });
  }
});

/**
 * Statistiques globales plateforme
 * GET /api/dashboards/statistiques-globales
 */
routeur.get('/statistiques-globales', async (req, res) => {
  try {
    res.json({
      succès: true,
      statistiques: {
        utilisateurs: {
          actifs: 2845,
          inscriptions_mois: 340,
          taux_retention: '87%'
        },
        propriétés: {
          total: 12450,
          actives: 8230,
          vendues_30j: 185,
          nouvelle_30j: 420
        },
        transactions: {
          montant_traité: 1890000000000,
          nombre: 24500,
          taux_approbation: 96.8,
          volume_moyen: 77142857
        },
        marché: {
          prix_moyen_m2: '48.5M GNF',
          croissance_prix: '+3.2%',
          temps_vente_moyen: '32 jours',
          demande_trend: '↑ +18%'
        },
        agences: {
          actives: 85,
          moy_propriétés: 146,
          note_moyenne: 4.6,
          nouveaux_agents: 42
        }
      }
    });
  } catch (erreur) {
    logger.erreur('Erreur statistiques globales:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = routeur;
