/**
 * 🔍 Routes Recherche Avancée
 */

const express = require('express');
const { vérifierToken } = require('../middlewares/authentification');
const ServiceRechercheAvancée = require('../services/recherche-avancée.service');
const logger = require('../services/logger');

const routeur = express.Router();

/**
 * Recherche avancée multi-critères
 * GET /api/recherche/avancée
 */
routeur.get('/avancée', async (req, res) => {
  try {
    const {
      query,
      localisation,
      prixMin,
      prixMax,
      typePropriété,
      surfaceMin,
      surfaceMax,
      chambresMin,
      chambresMax,
      équipements,
      agencesId,
      tri,
      page,
      limite
    } = req.query;

    const résultat = await ServiceRechercheAvancée.rechercherAvancé({
      query,
      localisation,
      prixMin: prixMin ? parseInt(prixMin) : undefined,
      prixMax: prixMax ? parseInt(prixMax) : undefined,
      typePropriété,
      surfaceMin: surfaceMin ? parseInt(surfaceMin) : undefined,
      surfaceMax: surfaceMax ? parseInt(surfaceMax) : undefined,
      chambresMin: chambresMin ? parseInt(chambresMin) : undefined,
      chambresMax: chambresMax ? parseInt(chambresMax) : undefined,
      équipements: équipements ? équipements.split(',') : [],
      agencesId: agencesId ? agencesId.split(',') : [],
      tri: tri || 'pertinence',
      page: page ? parseInt(page) : 1,
      limite: limite ? parseInt(limite) : 20
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur recherche avancée:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

/**
 * Suggérer propriétés similaires
 * GET /api/recherche/similaires/:propriétéId
 */
routeur.get('/similaires/:propriétéId', async (req, res) => {
  try {
    const { propriétéId } = req.params;
    const { nombre } = req.query;

    const résultat = await ServiceRechercheAvancée.suggérerSimilaires(
      propriétéId,
      nombre ? parseInt(nombre) : 5
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur suggestions similaires:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des suggestions'
    });
  }
});

/**
 * Autocomplétion
 * GET /api/recherche/autocomplete
 */
routeur.get('/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({
        succès: true,
        complétions: []
      });
    }

    const résultat = await ServiceRechercheAvancée.complétionAutomatique(q);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur autocomplétion:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'autocomplétion'
    });
  }
});

/**
 * Recherche géographique (par rayons)
 * GET /api/recherche/géographique
 */
routeur.get('/géographique', async (req, res) => {
  try {
    const { latitude, longitude, rayon } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        succès: false,
        message: 'Latitude et longitude requises'
      });
    }

    const résultat = await ServiceRechercheAvancée.rechercheGéographique(
      parseFloat(latitude),
      parseFloat(longitude),
      rayon ? parseInt(rayon) : 5
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur recherche géographique:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la recherche géographique'
    });
  }
});

/**
 * Analyser tendances de recherche
 * GET /api/recherche/tendances
 */
routeur.get('/tendances', async (req, res) => {
  try {
    const { période } = req.query;

    const résultat = await ServiceRechercheAvancée.analyserTendances(
      période || '30jours'
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur analyses tendances:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'analyse des tendances'
    });
  }
});

/**
 * Sauvegarder recherche
 * POST /api/recherche/sauvegarder
 */
routeur.post('/sauvegarder', vérifierToken, async (req, res) => {
  try {
    const { critères, nom } = req.body;

    if (!critères || !nom) {
      return res.status(400).json({
        succès: false,
        message: 'Critères et nom de la recherche requis'
      });
    }

    const résultat = await ServiceRechercheAvancée.sauvegarderRecherche(
      req.utilisateur.id,
      critères,
      nom
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur sauvegarde recherche:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la sauvegarde de la recherche'
    });
  }
});

/**
 * Filtre disponibles
 * GET /api/recherche/filtres
 */
routeur.get('/filtres', async (req, res) => {
  try {
    res.json({
      succès: true,
      filtres: {
        localisations: [
          { valeur: 'Conakry', label: 'Conakry', nombre: 450 },
          { valeur: 'Dixinn', label: 'Dixinn', nombre: 320 },
          { valeur: 'Kindia', label: 'Kindia', nombre: 180 },
          { valeur: 'Mamou', label: 'Mamou', nombre: 95 },
          { valeur: 'Fria', label: 'Fria', nombre: 45 }
        ],
        types: [
          { valeur: 'Appartement', label: 'Appartement', nombre: 580 },
          { valeur: 'Maison', label: 'Maison', nombre: 340 },
          { valeur: 'Terrain', label: 'Terrain', nombre: 150 },
          { valeur: 'Commerce', label: 'Commerce', nombre: 85 },
          { valeur: 'Bureau', label: 'Bureau', nombre: 65 }
        ],
        équipements: [
          { valeur: 'Climatisation', label: 'Climatisation' },
          { valeur: 'Garage', label: 'Garage' },
          { valeur: 'Balcon', label: 'Balcon' },
          { valeur: 'Jardin', label: 'Jardin' },
          { valeur: 'Piscine', label: 'Piscine' },
          { valeur: 'Ascenseur', label: 'Ascenseur' }
        ],
        plages_prix: [
          { min: 0, max: 100000000, label: 'Moins de 100M GNF' },
          { min: 100000000, max: 300000000, label: '100M - 300M GNF' },
          { min: 300000000, max: 600000000, label: '300M - 600M GNF' },
          { min: 600000000, max: 1000000000, label: '600M - 1Mrd GNF' },
          { min: 1000000000, max: null, label: '1Mrd GNF et plus' }
        ]
      }
    });
  } catch (erreur) {
    logger.erreur('Erreur récupération filtres:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des filtres'
    });
  }
});

/**
 * Alertes de recherche
 * POST /api/recherche/alertes
 */
routeur.post('/alertes', vérifierToken, async (req, res) => {
  try {
    const { critères, fréquence } = req.body;

    if (!critères || !fréquence) {
      return res.status(400).json({
        succès: false,
        message: 'Critères et fréquence requis'
      });
    }

    res.json({
      succès: true,
      alerteId: `ALRT-${Date.now()}`,
      message: 'Alerte de recherche créée',
      critères,
      fréquence,
      notifications: {
        email: true,
        push: false,
        sms: false
      }
    });
  } catch (erreur) {
    logger.erreur('Erreur création alerte recherche:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la création de l\'alerte'
    });
  }
});

/**
 * Historique recherches
 * GET /api/recherche/historique
 */
routeur.get('/historique', vérifierToken, async (req, res) => {
  try {
    res.json({
      succès: true,
      historique: [
        {
          id: 'RCH001',
          query: 'Appartement Conakry',
          date: '2024-01-15T14:30:00',
          résultats: 45
        },
        {
          id: 'RCH002',
          query: 'Maison 4 chambres Dixinn',
          date: '2024-01-15T12:00:00',
          résultats: 12
        },
        {
          id: 'RCH003',
          query: 'Terrain Kindia',
          date: '2024-01-14T09:15:00',
          résultats: 8
        }
      ],
      pagination: {
        page: 1,
        limite: 10,
        total: 3
      }
    });
  } catch (erreur) {
    logger.erreur('Erreur historique recherches:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

module.exports = routeur;
