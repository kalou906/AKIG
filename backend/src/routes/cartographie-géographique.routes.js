/**
 * 🗺️ Routes Cartographie Géographique
 */

const express = require('express');
const { vérifierToken } = require('../middlewares/authentification');
const ServiceCartographie = require('../services/cartographie-géographique.service');
const logger = require('../services/logger');

const routeur = express.Router();

/**
 * Générer carte propriétés par localisation
 * POST /api/cartographie/générer-carte
 */
routeur.post('/générer-carte', async (req, res) => {
  try {
    const { propriétés, zoom } = req.body;

    if (!propriétés || propriétés.length === 0) {
      return res.status(400).json({
        succès: false,
        message: 'Liste de propriétés requise'
      });
    }

    const résultat = await ServiceCartographie.générerCarteLocalisations(
      propriétés,
      zoom || 12
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur génération carte:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération de la carte'
    });
  }
});

/**
 * Propriétés dans une zone géographique
 * GET /api/cartographie/zone
 */
routeur.get('/zone', async (req, res) => {
  try {
    const { latMin, latMax, lngMin, lngMax } = req.query;

    if (!latMin || !latMax || !lngMin || !lngMax) {
      return res.status(400).json({
        succès: false,
        message: 'Limites de zone requises (latMin, latMax, lngMin, lngMax)'
      });
    }

    const résultat = await ServiceCartographie.obtenirPropriétésZone(
      parseFloat(latMin),
      parseFloat(latMax),
      parseFloat(lngMin),
      parseFloat(lngMax)
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur propriétés zone:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des propriétés'
    });
  }
});

/**
 * Calculer itinéraire
 * POST /api/cartographie/itinéraire
 */
routeur.post('/itinéraire', async (req, res) => {
  try {
    const { départ, arrivée, mode } = req.body;

    if (!départ || !arrivée) {
      return res.status(400).json({
        succès: false,
        message: 'Points de départ et d\'arrivée requis'
      });
    }

    const résultat = await ServiceCartographie.calculerItinéraire(
      départ,
      arrivée,
      mode || 'DRIVING'
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur calcul itinéraire:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors du calcul de l\'itinéraire'
    });
  }
});

/**
 * Heatmap - Intensité zone
 * GET /api/cartographie/heatmap/:localisation
 */
routeur.get('/heatmap/:localisation', async (req, res) => {
  try {
    const { localisation } = req.params;

    const résultat = await ServiceCartographie.analyserIntensitéZone(localisation);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur heatmap:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération de la heatmap'
    });
  }
});

/**
 * Détails localisation
 * GET /api/cartographie/localisation/:nom
 */
routeur.get('/localisation/:nom', async (req, res) => {
  try {
    const { nom } = req.params;

    const résultat = await ServiceCartographie.obtenirDétailsLocalisation(nom);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur détails localisation:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des détails'
    });
  }
});

/**
 * Créer zone d'intérêt personnalisée
 * POST /api/cartographie/zones
 */
routeur.post('/zones', vérifierToken, async (req, res) => {
  try {
    const { nom, polygon, couleur, description } = req.body;

    if (!nom || !polygon) {
      return res.status(400).json({
        succès: false,
        message: 'Nom et polygon requis'
      });
    }

    const résultat = await ServiceCartographie.créerZoneIntérêt({
      nom,
      polygon,
      couleur,
      description
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur création zone:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la création de la zone'
    });
  }
});

/**
 * Exporter carte
 * GET /api/cartographie/:carteId/exporter
 */
routeur.get('/:carteId/exporter', vérifierToken, async (req, res) => {
  try {
    const { carteId } = req.params;
    const { format } = req.query;

    const résultat = await ServiceCartographie.exporterCarte(
      carteId,
      format || 'PNG'
    );

    if (résultat.statut === 'succès') {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${résultat.fichier.nom}"`);
    }

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur export carte:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'export de la carte'
    });
  }
});

/**
 * Recommandations basées sur localisation
 * GET /api/cartographie/recommandations
 */
routeur.get('/recommandations', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        succès: false,
        message: 'Latitude et longitude requises'
      });
    }

    const résultat = await ServiceCartographie.obtenirRecommandations(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur recommandations:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des recommandations'
    });
  }
});

/**
 * Rapport géographique
 * GET /api/cartographie/rapport/:localisation
 */
routeur.get('/rapport/:localisation', async (req, res) => {
  try {
    const { localisation } = req.params;

    const résultat = await ServiceCartographie.générerRapportGéographique(localisation);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur rapport géographique:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * Télécharger rapport géographique
 * GET /api/cartographie/:localisation/télécharger-rapport
 */
routeur.get('/:localisation/télécharger-rapport', vérifierToken, async (req, res) => {
  try {
    const { localisation } = req.params;

    const résultat = await ServiceCartographie.générerRapportGéographique(localisation);

    if (résultat.statut === 'succès') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rapport_geo_${localisation}.txt"`);
      res.send(résultat.rapport);
    } else {
      res.status(400).json(résultat);
    }
  } catch (erreur) {
    logger.erreur('Erreur téléchargement rapport:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors du téléchargement'
    });
  }
});

/**
 * Localisations disponibles
 * GET /api/cartographie/localisations
 */
routeur.get('/localisations', async (req, res) => {
  try {
    res.json({
      succès: true,
      localisations: [
        {
          nom: 'Conakry',
          centre: { latitude: 9.5412, longitude: -13.7114 },
          propriétés: 450,
          demande: 'TRÈS_HAUTE'
        },
        {
          nom: 'Dixinn',
          centre: { latitude: 9.5198, longitude: -13.7321 },
          propriétés: 320,
          demande: 'HAUTE'
        },
        {
          nom: 'Kindia',
          centre: { latitude: 9.4697, longitude: -10.0000 },
          propriétés: 180,
          demande: 'MODÉRÉE'
        },
        {
          nom: 'Mamou',
          centre: { latitude: 10.3760, longitude: -10.7599 },
          propriétés: 95,
          demande: 'MODÉRÉE'
        },
        {
          nom: 'Fria',
          centre: { latitude: 10.7500, longitude: -8.7500 },
          propriétés: 45,
          demande: 'FAIBLE'
        },
        {
          nom: 'Matoto',
          centre: { latitude: 9.5025, longitude: -13.6987 },
          propriétés: 120,
          demande: 'CROISSANCE'
        },
        {
          nom: 'Kaloum',
          centre: { latitude: 9.5245, longitude: -13.7089 },
          propriétés: 85,
          demande: 'HAUTE'
        }
      ]
    });
  } catch (erreur) {
    logger.erreur('Erreur localisations:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des localisations'
    });
  }
});

module.exports = routeur;
