/**
 * 📞 Routes: Leads Management
 * Endpoints pour gestion leads immobiliers
 * 
 * backend/src/routes/leads.routes.js
 */

const express = require('express');
const router = express.Router();
const LeadsService = require('../services/LeadsService');
const { authenticate, authorize } = require('../middleware/auth');
const pool = require('../db');
const logger = require('../services/logger');

const leadsService = new LeadsService(pool);

/**
 * POST /api/leads
 * Créer un nouveau lead
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const result = await leadsService.createLead({
      ...req.body,
      createdBy: req.user?.id || 'system'
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Lead créé avec succès'
    });
  } catch (err) {
    logger.error('Erreur création lead:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads
 * Récupérer tous les leads avec filtres
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      source: req.query.source,
      propertyType: req.query.propertyType,
      minBudget: req.query.minBudget ? parseInt(req.query.minBudget) : null,
      maxBudget: req.query.maxBudget ? parseInt(req.query.maxBudget) : null,
      search: req.query.search
    };

    const result = await leadsService.getAllLeads(filters);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      message: `${result.count} leads trouvés`
    });
  } catch (err) {
    logger.error('Erreur récupération leads:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/:id
 * Récupérer un lead par ID avec ses interactions
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await leadsService.getLeadById(req.params.id);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Lead récupéré'
    });
  } catch (err) {
    logger.error('Erreur récupération lead:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/leads/:id
 * Mettre à jour un lead
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const result = await leadsService.updateLead(req.params.id, req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Lead modifié avec succès'
    });
  } catch (err) {
    logger.error('Erreur mise à jour lead:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/leads/:id
 * Supprimer un lead
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await leadsService.deleteLead(req.params.id, req.user?.id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    logger.error('Erreur suppression lead:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/leads/:id/status
 * Changer le statut d'un lead
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Statut requis' });
    }

    const result = await leadsService.updateLeadStatus(req.params.id, status);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: `Statut changé à: ${status}`
    });
  } catch (err) {
    logger.error('Erreur changement statut:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/:id/interactions
 * Ajouter une interaction (appel, email, visite, etc.)
 */
router.post('/:id/interactions', authenticate, async (req, res) => {
  try {
    const result = await leadsService.addInteraction(req.params.id, {
      ...req.body,
      recordedBy: req.user?.id || 'system'
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Interaction enregistrée'
    });
  } catch (err) {
    logger.error('Erreur ajout interaction:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/:id/interactions
 * Récupérer les interactions d'un lead
 */
router.get('/:id/interactions', authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const result = await leadsService.getLeadInteractions(req.params.id, limit);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      message: 'Interactions récupérées'
    });
  } catch (err) {
    logger.error('Erreur récupération interactions:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/leads/:id/assign
 * Attribuer un lead à un agent
 */
router.patch('/:id/assign', authenticate, async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: 'ID agent requis' });
    }

    const result = await leadsService.assignLeadToAgent(req.params.id, agentId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Lead attribué avec succès'
    });
  } catch (err) {
    logger.error('Erreur attribution lead:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/stats/overview
 * Obtenir les statistiques des leads
 */
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const result = await leadsService.getLeadsStatistics();

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Statistiques des leads'
    });
  } catch (err) {
    logger.error('Erreur statistiques:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/top
 * Récupérer les meilleurs leads (par score)
 */
router.get('/top/:limit', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const result = await leadsService.getTopLeads(limit);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      count: result.data.length,
      message: 'Top leads récupérés'
    });
  } catch (err) {
    logger.error('Erreur top leads:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/:id/convert
 * Convertir un lead en contrat
 */
router.post('/:id/convert', authenticate, async (req, res) => {
  try {
    const result = await leadsService.convertLeadToContract(req.params.id, req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    logger.error('Erreur conversion lead:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
