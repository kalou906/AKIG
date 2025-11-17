/**
 * phase5_maintenance.js - Routes API Phase 5: Maintenance
 * 8 endpoints pour gérer les tickets de maintenance
 */

const express = require('express');
const router = express.Router();
const MaintenanceService = require('../services/MaintenanceService');
const { validateRequest } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware d'authentification
router.use(authenticateToken);

/**
 * POST /api/maintenance/create
 * Créer un nouveau ticket de maintenance
 */
router.post('/create', validateRequest, async (req, res) => {
  try {
    const ticketData = req.body;

    if (!ticketData.propriete_id || !ticketData.description) {
      return res.status(400).json({
        success: false,
        error: 'Propriété et description requis',
      });
    }

    const result = await MaintenanceService.createTicket(ticketData);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`POST /create error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création du ticket',
    });
  }
});

/**
 * PATCH /api/maintenance/:id/update
 * Mettre à jour un ticket de maintenance
 */
router.patch('/:id/update', validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de ticket invalide',
      });
    }

    const result = await MaintenanceService.updateTicket(parseInt(id), updates);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`PATCH /:id/update error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour',
    });
  }
});

/**
 * GET /api/maintenance/list
 * Lister tous les tickets avec filtres
 */
router.get('/list', async (req, res) => {
  try {
    const {
      propriete_id,
      statut,
      priorite,
      type_intervention,
      page = 1,
      limit = 50,
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (propriete_id) filters.propriete_id = parseInt(propriete_id);
    if (statut) filters.statut = statut;
    if (priorite) filters.priorite = priorite;
    if (type_intervention) filters.type_intervention = type_intervention;

    const result = await MaintenanceService.listTickets(filters);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`GET /list error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des tickets',
    });
  }
});

/**
 * GET /api/maintenance/:id
 * Récupérer les détails d'un ticket
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de ticket invalide',
      });
    }

    const result = await MaintenanceService.getTicket(parseInt(id));
    res.status(200).json(result);
  } catch (error) {
    logger.error(`GET /:id error: ${error.message}`);

    if (error.message === 'Ticket non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Ticket non trouvé',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération du ticket',
    });
  }
});

/**
 * POST /api/maintenance/:id/assign
 * Assigner un technicien à un ticket
 */
router.post('/:id/assign', validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const assignmentData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de ticket invalide',
      });
    }

    if (!assignmentData.technicien_id) {
      return res.status(400).json({
        success: false,
        error: 'ID technicien requis',
      });
    }

    const result = await MaintenanceService.assignTechnician(
      parseInt(id),
      assignmentData
    );
    res.status(201).json(result);
  } catch (error) {
    logger.error(`POST /:id/assign error: ${error.message}`);

    if (error.message === 'Ticket non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Ticket non trouvé',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'assignation',
    });
  }
});

/**
 * PATCH /api/maintenance/:id/complete
 * Marquer un ticket comme complété
 */
router.patch('/:id/complete', validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const completionData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de ticket invalide',
      });
    }

    const result = await MaintenanceService.completeTicket(
      parseInt(id),
      completionData
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`PATCH /:id/complete error: ${error.message}`);

    if (error.message === 'Ticket non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Ticket non trouvé',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la complétion',
    });
  }
});

/**
 * GET /api/maintenance/:id/history
 * Récupérer l'historique d'un ticket
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de ticket invalide',
      });
    }

    const result = await MaintenanceService.getTicketHistory(parseInt(id));
    res.status(200).json(result);
  } catch (error) {
    logger.error(`GET /:id/history error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération de l\'historique',
    });
  }
});

/**
 * GET /api/maintenance/:id/costs
 * Récupérer les coûts associés à un ticket
 */
router.get('/:id/costs', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de ticket invalide',
      });
    }

    const result = await MaintenanceService.calculateTicketCosts(parseInt(id));
    res.status(200).json(result);
  } catch (error) {
    logger.error(`GET /:id/costs error: ${error.message}`);

    if (error.message === 'Ticket non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Ticket non trouvé',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du calcul des coûts',
    });
  }
});

module.exports = router;
