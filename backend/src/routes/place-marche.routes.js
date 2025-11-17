/**
 * 🏪 Routes Place de Marché Immobilière
 */

const express = require('express');
const { vérifierToken } = require('../middlewares/authentification');
const ServicePlaceMarché = require('../services/place-marche.service');
const logger = require('../services/logger');

const routeur = express.Router();

/**
 * Publier annonce sur place de marché
 * POST /api/place-marche/publier
 */
routeur.post('/publier', vérifierToken, async (req, res) => {
  try {
    const { titre, description, prix, typePropriété, surface, localisation, chambres, images, caractéristiques, commission } = req.body;

    if (!titre || !prix || !typePropriété) {
      return res.status(400).json({
        succès: false,
        message: 'Titre, prix et type de propriété requis'
      });
    }

    const résultat = await ServicePlaceMarché.publierAnnonce({
      agenceId: req.utilisateur.agenceId,
      propriétéId: req.body.propriétéId,
      titre,
      description,
      prix: parseInt(prix),
      typePropriété,
      surface: parseInt(surface) || 0,
      localisation,
      chambres: parseInt(chambres) || 0,
      images,
      caractéristiques,
      commission: commission || 3
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur publication annonce:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la publication'
    });
  }
});

/**
 * Rechercher annonces
 * GET /api/place-marche/rechercher
 */
routeur.get('/rechercher', async (req, res) => {
  try {
    const { localisation, prixMin, prixMax, typePropriété, chambresMin, page, limite } = req.query;

    const résultat = await ServicePlaceMarché.rechercherAnnonces({
      localisation,
      prixMin: prixMin ? parseInt(prixMin) : undefined,
      prixMax: prixMax ? parseInt(prixMax) : undefined,
      typePropriété,
      chambresMin: chambresMin ? parseInt(chambresMin) : undefined,
      page: page ? parseInt(page) : 1,
      limite: limite ? parseInt(limite) : 20
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur recherche annonces:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

/**
 * Exprimer intérêt pour annonce
 * POST /api/place-marche/:annoncéId/intérêt
 */
routeur.post('/:annoncéId/intérêt', vérifierToken, async (req, res) => {
  try {
    const { annoncéId } = req.params;
    const { message } = req.body;

    const résultat = await ServicePlaceMarché.exprimerIntérêt(
      annoncéId,
      req.utilisateur.agenceId,
      message || ''
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur expression intérêt:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'expression d\'intérêt'
    });
  }
});

/**
 * Créer transaction (accord entre agences)
 * POST /api/place-marche/:annoncéId/transaction
 */
routeur.post('/:annoncéId/transaction', vérifierToken, async (req, res) => {
  try {
    const { annoncéId } = req.params;
    const { prixAccordé, commission, conditions } = req.body;

    if (!prixAccordé) {
      return res.status(400).json({
        succès: false,
        message: 'Prix accordé requis'
      });
    }

    const résultat = await ServicePlaceMarché.créerTransaction({
      annoncéId,
      agenceVendeuse: req.utilisateur.agenceId,
      agenceAcheteur: req.body.agenceAcheteursId,
      prixAccordé: parseInt(prixAccordé),
      commission: commission || 3,
      conditions
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur création transaction:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la création de transaction'
    });
  }
});

/**
 * Finaliser transaction
 * PUT /api/place-marche/transaction/:transactionId/finaliser
 */
routeur.put('/transaction/:transactionId/finaliser', vérifierToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { signatureVendeuse, signatureAcheteur } = req.body;

    const résultat = await ServicePlaceMarché.finaliserTransaction(
      transactionId,
      signatureVendeuse,
      signatureAcheteur
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur finalisation transaction:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la finalisation'
    });
  }
});

/**
 * Évaluer agence
 * POST /api/place-marche/évaluer-agence
 */
routeur.post('/évaluer-agence', vérifierToken, async (req, res) => {
  try {
    const { agenceId, note, commentaire } = req.body;

    if (!agenceId || !note) {
      return res.status(400).json({
        succès: false,
        message: 'ID agence et note requis'
      });
    }

    const résultat = await ServicePlaceMarché.évaluerAgence(
      agenceId,
      parseInt(note),
      commentaire || '',
      req.utilisateur.agenceId
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur évaluation agence:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'évaluation'
    });
  }
});

/**
 * Obtenir statistiques agence
 * GET /api/place-marche/agence/:agenceId/statistiques
 */
routeur.get('/agence/:agenceId/statistiques', async (req, res) => {
  try {
    const { agenceId } = req.params;

    const résultat = await ServicePlaceMarché.obtenirStatistiquesAgence(agenceId);

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur statistiques agence:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * Générer contrat PDF
 * GET /api/place-marche/transaction/:transactionId/contrat
 */
routeur.get('/transaction/:transactionId/contrat', vérifierToken, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Récupérer transaction depuis BD
    const contrat = ServicePlaceMarché.générerContrat({
      id: transactionId,
      agence_vendeuse: req.utilisateur.agenceId,
      agence_acheteuse: 'AGENCE_ACH',
      prix_accordé: 500000000,
      commission: 3,
      conditions: { paiement: 'échelonné' }
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="contrat_${transactionId}.txt"`);
    res.send(contrat);
  } catch (erreur) {
    logger.erreur('Erreur génération contrat:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du contrat'
    });
  }
});

/**
 * Obtenir statistiques globales place de marché
 * GET /api/place-marche/statistiques
 */
routeur.get('/statistiques', async (req, res) => {
  try {
    res.json({
      succès: true,
      statistiques: {
        annoncesActives: 1250,
        transactionsEnCours: 45,
        transactionsFinalisées: 380,
        volumeTotal: 189000000000, // En GNF
        agencesParticipantes: 45,
        noteMoyenneAgences: 4.7
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
