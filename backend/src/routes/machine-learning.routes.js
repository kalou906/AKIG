/**
 * 🤖 Itinéraires Apprentissage Automatique
 * Prédictions de prix, analyse de tendances, recommandations
 */

const express = require('express');
const routeur = express.Router();
const ServiceAM = require('../services/machine-learning.service');
const { authentifier } = require('../middleware/auth.middleware');
const logger = require('../services/logger');

/**
 * POST /api/apprentissage-automatique/predire-prix
 * Prédire le prix d'une propriété
 */
routeur.post('/predire-prix', authentifier, async (req, res) => {
  try {
    const {
      localisation,
      surface,
      chambres,
      typePropriété,
      condition,
      équipements
    } = req.body;

    if (!localisation || !surface || !chambres) {
      return res.status(400).json({
        succès: false,
        message: 'Données manquantes: localisation, surface, chambres obligatoires'
      });
    }

    const prédiction = await ServiceAM.prédirePrixPropriété({
      localisation,
      surface,
      chambres,
      typePropriété: typePropriété || 'APPARTEMENT',
      condition: condition || 'BON',
      équipements: équipements || {}
    });

    res.json({
      succès: true,
      message: 'Prédiction de prix générée',
      données: prédiction
    });

    logger.info('Prédiction prix générée', {
      utilisateur: req.user?.id,
      localisation,
      surface,
      prix: prédiction.prixPrédits
    });
  } catch (erreur) {
    logger.erreur('Erreur prédiction prix:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur prédiction prix',
      erreur: erreur.message
    });
  }
});

/**
 * GET /api/apprentissage-automatique/tendances/:localisation
 * Analyser tendances du marché
 */
routeur.get('/tendances/:localisation', authentifier, async (req, res) => {
  try {
    const { localisation } = req.params;
    const { mois = 6 } = req.query;

    const tendances = await ServiceAM.analyserTendancesMarché(
      localisation,
      parseInt(mois)
    );

    res.json({
      succès: true,
      message: 'Analyse tendances générée',
      données: tendances
    });

    logger.info('Analyse tendances', {
      utilisateur: req.user?.id,
      localisation,
      mois
    });
  } catch (erreur) {
    logger.erreur('Erreur analyse tendances:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur analyse tendances',
      erreur: erreur.message
    });
  }
});

/**
 * POST /api/apprentissage-automatique/recommander-proprietes
 * Recommander propriétés basé sur profil
 */
routeur.post('/recommander-proprietes', authentifier, async (req, res) => {
  try {
    const {
      budget,
      localisation,
      typeRecherche,
      tolérance,
      profitCible
    } = req.body;

    if (!budget || !localisation) {
      return res.status(400).json({
        succès: false,
        message: 'Budget et localisation obligatoires'
      });
    }

    const recommandations = await ServiceAM.recommanderPropriétés({
      budget,
      localisation,
      typeRecherche: typeRecherche || 'meilleur_prix',
      tolérance: tolérance || 0.1,
      profitCible: profitCible || 0.05
    });

    res.json({
      succès: true,
      message: 'Recommandations générées',
      données: recommandations
    });

    logger.info('Recommandations générées', {
      utilisateur: req.user?.id,
      budget,
      localisation
    });
  } catch (erreur) {
    logger.erreur('Erreur recommandations:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur recommandations',
      erreur: erreur.message
    });
  }
});

/**
 * GET /api/apprentissage-automatique/anomalies/:localisation
 * Détecter propriétés surévaliées/sous-évaluées
 */
routeur.get('/anomalies/:localisation', authentifier, async (req, res) => {
  try {
    const { localisation } = req.params;

    const anomalies = await ServiceAM.détecterAnomaliesPrix(localisation);

    res.json({
      succès: true,
      message: 'Anomalies détectées',
      données: anomalies
    });

    logger.info('Détection anomalies', {
      utilisateur: req.user?.id,
      localisation
    });
  } catch (erreur) {
    logger.erreur('Erreur détection anomalies:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur détection anomalies',
      erreur: erreur.message
    });
  }
});

/**
 * GET /api/apprentissage-automatique/rendement/:proprieteId
 * Estimer rendement de location
 */
routeur.get('/rendement/:proprieteId', authentifier, async (req, res) => {
  try {
    const { proprieteId } = req.params;

    const rendement = await ServiceAM.estimerRendementLocation(proprieteId);

    res.json({
      succès: true,
      message: 'Estimation rendement générée',
      données: rendement
    });

    logger.info('Estimation rendement', {
      utilisateur: req.user?.id,
      proprieteId,
      rendement: rendement.estimations?.rendement
    });
  } catch (erreur) {
    logger.erreur('Erreur estimation rendement:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur estimation rendement',
      erreur: erreur.message
    });
  }
});

/**
 * POST /api/apprentissage-automatique/analyse-portefeuille
 * Analyser portefeuille global
 */
routeur.post('/analyse-portefeuille', authentifier, async (req, res) => {
  try {
    const { propriétéIds } = req.body;

    if (!propriétéIds || !Array.isArray(propriétéIds)) {
      return res.status(400).json({
        succès: false,
        message: 'Liste de propriétéIds obligatoire'
      });
    }

    // Analyser chaque propriété
    const analyses = await Promise.all(
      propriétéIds.map(id => ServiceAM.estimerRendementLocation(id))
    );

    // Calculer statistiques globales
    const rendements = analyses
      .filter(a => a.estimations)
      .map(a => a.estimations.rendement);

    const revenuTotal = analyses
      .filter(a => a.estimations)
      .reduce((acc, a) => acc + a.estimations.revenuAnnuel, 0);

    const analyseGlobale = {
      nombrePropriétés: analyses.length,
      rendementMoyen: rendements.length > 0 
        ? (rendements.reduce((a, b) => a + b) / rendements.length).toFixed(2)
        : 0,
      revenuAnnuelTotal: Math.round(revenuTotal),
      meilleureProprieté: analyses.reduce((max, a) => 
        a.estimations?.rendement > (max.estimations?.rendement || 0) ? a : max
      ),
      propriétésAnalysées: analyses
    };

    res.json({
      succès: true,
      message: 'Analyse portefeuille complète',
      données: analyseGlobale
    });
  } catch (erreur) {
    logger.erreur('Erreur analyse portefeuille:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur analyse portefeuille',
      erreur: erreur.message
    });
  }
});

module.exports = routeur;
