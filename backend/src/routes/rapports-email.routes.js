/**
 * 📧 Routes Rapports Email Automatisés
 */

const express = require('express');
const { vérifierToken } = require('../middlewares/authentification');
const ServiceRapportsEmail = require('../services/rapports-email.service');
const logger = require('../services/logger');

const routeur = express.Router();

/**
 * Créer rapport programmé
 * POST /api/rapports/programmer
 */
routeur.post('/programmer', vérifierToken, async (req, res) => {
  try {
    const {
      typeRapport,
      fréquence,
      joursExécution,
      heure,
      minute,
      destinataires
    } = req.body;

    if (!typeRapport || !fréquence) {
      return res.status(400).json({
        succès: false,
        message: 'Type et fréquence de rapport requis'
      });
    }

    const résultat = await ServiceRapportsEmail.créerRapportProgrammé({
      agenceId: req.utilisateur.agenceId,
      typeRapport,
      fréquence,
      joursExécution: joursExécution || [0],
      heure: heure || 9,
      minute: minute || 0,
      destinataires: destinataires || [req.utilisateur.email]
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur création rapport programmé:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la création du rapport'
    });
  }
});

/**
 * Générer rapport immédiatement
 * POST /api/rapports/:rapportId/générer
 */
routeur.post('/:rapportId/générer', vérifierToken, async (req, res) => {
  try {
    const { rapportId } = req.params;

    const rapport = await ServiceRapportsEmail.générerRapport(rapportId);

    res.json({
      succès: true,
      rapport
    });
  } catch (erreur) {
    logger.erreur('Erreur génération rapport:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * Télécharger rapport
 * GET /api/rapports/:rapportId/télécharger
 */
routeur.get('/:rapportId/télécharger', vérifierToken, async (req, res) => {
  try {
    const { rapportId } = req.params;

    const contenu = await ServiceRapportsEmail.générerRapport(rapportId);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rapport_${rapportId}.txt"`);
    res.send(contenu);
  } catch (erreur) {
    logger.erreur('Erreur téléchargement rapport:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors du téléchargement'
    });
  }
});

/**
 * Annuler rapport programmé
 * DELETE /api/rapports/:rapportId
 */
routeur.delete('/:rapportId', vérifierToken, async (req, res) => {
  try {
    const { rapportId } = req.params;

    const résultat = await ServiceRapportsEmail.annulerRapport(rapportId);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur annulation rapport:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'annulation du rapport'
    });
  }
});

/**
 * Lister rapports programmés
 * GET /api/rapports/mes-rapports
 */
routeur.get('/mes-rapports', vérifierToken, async (req, res) => {
  try {
    const résultat = await ServiceRapportsEmail.obtenirRapportsProgrammés(
      req.utilisateur.agenceId
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur récupération rapports:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des rapports'
    });
  }
});

/**
 * Aperçu rapport
 * GET /api/rapports/aperçu/:typeRapport
 */
routeur.get('/aperçu/:typeRapport', vérifierToken, async (req, res) => {
  try {
    const { typeRapport } = req.params;

    let aperçu = '';

    switch(typeRapport) {
      case 'VENTES':
        aperçu = `
📊 APERÇU RAPPORT DE VENTES
Contient: Nombre de ventes, montant total, prix moyen, statistiques par localisation
Fréquence recommandée: Mensuelle
Destinataires suggérés: Direction, Comptabilité
        `;
        break;

      case 'PROPRIÉTÉS':
        aperçu = `
📋 APERÇU RAPPORT D'INVENTAIRE
Contient: Statuts propriétés, localisations, types, marché
Fréquence recommandée: Hebdomadaire
Destinataires suggérés: Commerciaux, Direction
        `;
        break;

      case 'TRANSACTIONS':
        aperçu = `
💳 APERÇU RAPPORT TRANSACTIONS
Contient: Paiements traités, ESCROW, taux approbation, sécurité
Fréquence recommandée: Hebdomadaire
Destinataires suggérés: Finance, Trésorier
        `;
        break;

      case 'PERFORMANCE':
        aperçu = `
📈 APERÇU RAPPORT PERFORMANCE
Contient: KPI, classements, objectifs, recommandations
Fréquence recommandée: Mensuelle
Destinataires suggérés: Direction, Management
        `;
        break;

      case 'MARCHÉ':
        aperçu = `
🌍 APERÇU RAPPORT MARCHÉ
Contient: Tendances, prix, localisations, opportunités, risques
Fréquence recommandée: Trimestrielle
Destinataires suggérés: Stratégie, Direction générale
        `;
        break;
    }

    res.json({
      succès: true,
      aperçu
    });
  } catch (erreur) {
    logger.erreur('Erreur aperçu rapport:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération de l\'aperçu'
    });
  }
});

/**
 * Modèles de rapports disponibles
 * GET /api/rapports/modèles
 */
routeur.get('/modèles', async (req, res) => {
  try {
    res.json({
      succès: true,
      modèles: [
        {
          type: 'VENTES',
          nom: 'Rapport de Ventes',
          description: 'Analyse mensuelle des ventes',
          fréquences: ['QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL']
        },
        {
          type: 'PROPRIÉTÉS',
          nom: 'Inventaire Propriétés',
          description: 'État du portefeuille de propriétés',
          fréquences: ['QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL']
        },
        {
          type: 'TRANSACTIONS',
          nom: 'Rapport Transactions',
          description: 'Analyse des paiements et transactions',
          fréquences: ['QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL']
        },
        {
          type: 'PERFORMANCE',
          nom: 'Performance Agence',
          description: 'KPI et indicateurs de performance',
          fréquences: ['HEBDOMADAIRE', 'MENSUEL']
        },
        {
          type: 'MARCHÉ',
          nom: 'Analyse de Marché',
          description: 'Tendances et analyse du marché',
          fréquences: ['MENSUEL', 'TRIMESTRIEL']
        }
      ]
    });
  } catch (erreur) {
    logger.erreur('Erreur modèles rapports:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des modèles'
    });
  }
});

/**
 * Historique rapports envoyés
 * GET /api/rapports/historique
 */
routeur.get('/historique', vérifierToken, async (req, res) => {
  try {
    res.json({
      succès: true,
      historique: [
        {
          id: 'RPT001',
          type: 'VENTES',
          dateCréation: '2024-01-15',
          dateEnvoi: '2024-01-15T09:00:00',
          destinataires: 3,
          statut: 'ENVOYÉ'
        },
        {
          id: 'RPT002',
          type: 'PERFORMANCE',
          dateCréation: '2024-01-08',
          dateEnvoi: '2024-01-08T10:30:00',
          destinataires: 2,
          statut: 'ENVOYÉ'
        },
        {
          id: 'RPT003',
          type: 'MARCHÉ',
          dateCréation: '2024-01-01',
          dateEnvoi: '2024-01-01T09:00:00',
          destinataires: 4,
          statut: 'ENVOYÉ'
        }
      ],
      pagination: {
        page: 1,
        limite: 20,
        total: 3
      }
    });
  } catch (erreur) {
    logger.erreur('Erreur historique rapports:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

module.exports = routeur;
