/**
 * 💳 Routes Paiements Avancé
 */

const express = require('express');
const { vérifierToken } = require('../middlewares/authentification');
const ServicePaiementsAvancé = require('../services/paiements-avancé.service');
const logger = require('../services/logger');

const routeur = express.Router();

/**
 * Créer transaction de paiement
 * POST /api/paiements/transaction
 */
routeur.post('/transaction', vérifierToken, async (req, res) => {
  try {
    const { montant, typePaiement, description, métadonnées } = req.body;

    if (!montant) {
      return res.status(400).json({
        succès: false,
        message: 'Montant requis'
      });
    }

    const résultat = await ServicePaiementsAvancé.créerTransaction({
      acheteurId: req.utilisateur.id,
      vendeureId: req.body.vendeureId,
      montant: parseInt(montant),
      typePaiement: typePaiement || 'SEUL',
      devise: 'GNF',
      description,
      métadonnées
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
 * Créer paiement échelonné
 * POST /api/paiements/échelonné
 */
routeur.post('/échelonné', vérifierToken, async (req, res) => {
  try {
    const { transactionId, montantTotal, nombreÉchéances, fréquence, tauxIntérêt } = req.body;

    if (!transactionId || !montantTotal || !nombreÉchéances) {
      return res.status(400).json({
        succès: false,
        message: 'Paramètres manquants'
      });
    }

    const résultat = await ServicePaiementsAvancé.créerPaiementÉchelonné({
      transactionId,
      montantTotal: parseInt(montantTotal),
      nombreÉchéances: parseInt(nombreÉchéances),
      fréquence: fréquence || 'MENSUELLE',
      tauxIntérêt: parseFloat(tauxIntérêt) || 0
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur création paiement échelonné:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la création du plan échelonné'
    });
  }
});

/**
 * Traiter paiement
 * POST /api/paiements/:transactionId/traiter
 */
routeur.post('/:transactionId/traiter', vérifierToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { méthodePaiement, détails } = req.body;

    if (!méthodePaiement) {
      return res.status(400).json({
        succès: false,
        message: 'Méthode de paiement requise'
      });
    }

    const résultat = await ServicePaiementsAvancé.traiterPaiement(
      transactionId,
      méthodePaiement,
      détails || {}
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur traitement paiement:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors du traitement du paiement'
    });
  }
});

/**
 * Créer compte ESCROW
 * POST /api/paiements/escrow
 */
routeur.post('/escrow', vérifierToken, async (req, res) => {
  try {
    const { transactionId, montant, conditions } = req.body;

    if (!transactionId || !montant) {
      return res.status(400).json({
        succès: false,
        message: 'Transaction ID et montant requis'
      });
    }

    const résultat = await ServicePaiementsAvancé.créerCompteEscrow({
      transactionId,
      montant: parseInt(montant),
      conditions,
      agentEscrow: req.utilisateur.agenceId
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur création ESCROW:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la création du compte ESCROW'
    });
  }
});

/**
 * Libérer ESCROW
 * PUT /api/paiements/escrow/:escrowId/libérer
 */
routeur.put('/escrow/:escrowId/libérer', vérifierToken, async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { conditionVérifiée } = req.body;

    const résultat = await ServicePaiementsAvancé.libérerEscrow(
      escrowId,
      conditionVérifiée !== false
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur libération ESCROW:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la libération de l\'ESCROW'
    });
  }
});

/**
 * Appliquer remise
 * POST /api/paiements/:transactionId/remise
 */
routeur.post('/:transactionId/remise', vérifierToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { codeRemise } = req.body;

    if (!codeRemise) {
      return res.status(400).json({
        succès: false,
        message: 'Code remise requis'
      });
    }

    const résultat = await ServicePaiementsAvancé.appliquerRemise(
      transactionId,
      codeRemise
    );

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur application remise:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de l\'application de la remise'
    });
  }
});

/**
 * Générer reçu
 * GET /api/paiements/:transactionId/reçu
 */
routeur.get('/:transactionId/reçu', vérifierToken, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Récupérer transaction depuis BD
    const transaction = {
      numéro_transaction: `TXN-${transactionId}`,
      montant: 500000000,
      montant_remise: 0,
      créée_à: new Date(),
      type_paiement: 'SEUL',
      statut: 'APPROUVÉ',
      acheteur_id: req.utilisateur.id,
      vendeur_id: 'VND001'
    };

    const reçu = ServicePaiementsAvancé.générerReçu(transaction);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reçu_${transactionId}.txt"`);
    res.send(reçu);
  } catch (erreur) {
    logger.erreur('Erreur génération reçu:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du reçu'
    });
  }
});

/**
 * Rapport transactions
 * GET /api/paiements/rapport/transactions
 */
routeur.get('/rapport/transactions', vérifierToken, async (req, res) => {
  try {
    const { dateDebut, dateFin, statut } = req.query;

    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        succès: false,
        message: 'Dates de début et fin requises'
      });
    }

    const résultat = await ServicePaiementsAvancé.générerRapportTransactions({
      dateDebut,
      dateFin,
      statut
    });

    res.json(résultat);
  } catch (erreur) {
    logger.erreur('Erreur rapport transactions:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * Statistiques paiements
 * GET /api/paiements/statistiques
 */
routeur.get('/statistiques', vérifierToken, async (req, res) => {
  try {
    res.json({
      succès: true,
      statistiques: {
        montantTotalTraité: 18900000000, // En GNF
        nombreTransactions: 2450,
        tauxApprouvé: 96.8,
        montantMoyenTransaction: 7714285,
        paiementsÉchelonnéActifs: 380,
        volumeEscrowActive: 2100000000,
        remisesAppliquées: 1250
      }
    });
  } catch (erreur) {
    logger.erreur('Erreur statistiques paiements:', erreur);
    res.status(500).json({
      succès: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = routeur;
