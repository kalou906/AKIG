/**
 * 💬 Itinéraires Chatbot IA
 * Endpoints pour interactions conversationnelles
 */

const express = require('express');
const routeur = express.Router();
const ServiceChatbot = require('../services/chatbot-ia.service');
const { authentifier } = require('../middleware/auth.middleware');
const logger = require('../services/logger');

/**
 * POST /api/chatbot/envoyer-message
 * Envoyer message et recevoir réponse IA
 */
routeur.post('/envoyer-message', authentifier, async (req, res) => {
  try {
    const { message, contexte = {} } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        succès: false,
        message: 'Message vide'
      });
    }

    const réponse = await ServiceChatbot.traiterMessageUtilisateur(
      message,
      {
        utilisateurId: req.user?.id,
        ...contexte
      }
    );

    res.json({
      succès: true,
      message: 'Message traité',
      réponse
    });

    logger.info(`💬 Message chatbot traité pour utilisateur ${req.user?.id}`);
  } catch (erreur) {
    logger.erreur('Erreur traitement message chatbot:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur traitement message',
      erreur: erreur.message
    });
  }
});

/**
 * POST /api/chatbot/rechercher-propriete
 * Recherche conversationnelle de propriété
 */
routeur.post('/rechercher-propriete', authentifier, async (req, res) => {
  try {
    const { message, localisation, budget } = req.body;

    const réponse = await ServiceChatbot.traiterRecherchePropriété(
      message,
      localisation,
      budget
    );

    res.json({
      succès: true,
      message: 'Recherche conversationnelle effectuée',
      réponse
    });
  } catch (erreur) {
    logger.erreur('Erreur recherche conversationnelle:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur recherche',
      erreur: erreur.message
    });
  }
});

/**
 * POST /api/chatbot/analyser-prix
 * Analyse de prix conversationnelle
 */
routeur.post('/analyser-prix', authentifier, async (req, res) => {
  try {
    const { message, localisation } = req.body;

    const réponse = await ServiceChatbot.traiterAnalysePrix(message, localisation);

    res.json({
      succès: true,
      message: 'Analyse prix générée',
      réponse
    });

    logger.info(`📊 Analyse prix pour ${localisation}`);
  } catch (erreur) {
    logger.erreur('Erreur analyse prix:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur analyse',
      erreur: erreur.message
    });
  }
});

/**
 * POST /api/chatbot/conseil-investissement
 * Conseils d'investissement conversationnels
 */
routeur.post('/conseil-investissement', authentifier, async (req, res) => {
  try {
    const { message, budget } = req.body;

    const réponse = await ServiceChatbot.traiterConseilInvestissement(message, budget);

    res.json({
      succès: true,
      message: 'Conseils investissement générés',
      réponse
    });

    logger.info(`💡 Conseil investissement généré pour budget ${budget}`);
  } catch (erreur) {
    logger.erreur('Erreur conseil investissement:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur conseil',
      erreur: erreur.message
    });
  }
});

/**
 * GET /api/chatbot/tendances/:localisation
 * Tendances marché conversationnelles
 */
routeur.get('/tendances/:localisation', authentifier, async (req, res) => {
  try {
    const { localisation } = req.params;

    const réponse = await ServiceChatbot.traiterTendancesMarché('tendances', localisation);

    res.json({
      succès: true,
      message: 'Tendances marché',
      réponse
    });

    logger.info(`📈 Tendances marché pour ${localisation}`);
  } catch (erreur) {
    logger.erreur('Erreur tendances marché:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur tendances',
      erreur: erreur.message
    });
  }
});

/**
 * POST /api/chatbot/faq
 * Répondre aux questions fréquemment posées
 */
routeur.post('/faq', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        succès: false,
        message: 'Question manquante'
      });
    }

    const réponse = ServiceChatbot.traiterFAQ(question);

    res.json({
      succès: true,
      message: 'Réponse FAQ',
      réponse
    });

    logger.info('Question FAQ traitée');
  } catch (erreur) {
    logger.erreur('Erreur FAQ:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur FAQ',
      erreur: erreur.message
    });
  }
});

/**
 * POST /api/chatbot/contacter-agent
 * Demander contact avec agent
 */
routeur.post('/contacter-agent', authentifier, async (req, res) => {
  try {
    const { nom, email, téléphone, localisation, message } = req.body;

    // Enregistrer demande de contact
    // TODO: Intégrer avec système de gestion des leads

    res.json({
      succès: true,
      message: 'Demande de contact envoyée. Un agent vous contactera très bientôt.',
      référence: `CONTACT-${Date.now()}`
    });

    logger.info(`📞 Demande contact de ${nom} pour ${localisation}`);
  } catch (erreur) {
    logger.erreur('Erreur demande contact:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur demande contact',
      erreur: erreur.message
    });
  }
});

/**
 * GET /api/chatbot/historique
 * Récupérer historique conversations
 */
routeur.get('/historique', authentifier, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // TODO: Récupérer du base de données

    res.json({
      succès: true,
      message: 'Historique récupéré',
      conversations: []
    });
  } catch (erreur) {
    logger.erreur('Erreur récupération historique:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur historique',
      erreur: erreur.message
    });
  }
});

module.exports = routeur;
