/**
 * phase4_tenants.js - Routes API Phase 4: Locataires & Garanteurs
 * 6 endpoints pour gérer les locataires et leurs garanteurs
 */

const express = require('express');
const router = express.Router();
const TenantService = require('../services/TenantService');
const { validateRequest } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

/**
 * POST /api/tenants/create
 * Créer un nouveau locataire
 */
router.post('/create', validateRequest, async (req, res) => {
  try {
    const tenantData = req.body;

    // Validation de base
    if (!tenantData.nom || !tenantData.prenom || !tenantData.propriete_id) {
      return res.status(400).json({
        success: false,
        error: 'Nom, prénom et propriété requis',
      });
    }

    const result = await TenantService.createTenant(tenantData);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`POST /create error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création du locataire',
    });
  }
});

/**
 * PATCH /api/tenants/:id/update
 * Mettre à jour un locataire
 */
router.patch('/:id/update', validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validation de l'ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de locataire invalide',
      });
    }

    const result = await TenantService.updateTenant(parseInt(id), updates);
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
 * GET /api/tenants/list
 * Lister tous les locataires avec pagination
 */
router.get('/list', async (req, res) => {
  try {
    const { propriete_id, statut_contrat, page = 1, limit = 50 } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (propriete_id) filters.propriete_id = parseInt(propriete_id);
    if (statut_contrat) filters.statut_contrat = statut_contrat;

    const result = await TenantService.listTenants(filters);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`GET /list error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des locataires',
    });
  }
});

/**
 * GET /api/tenants/:id
 * Récupérer les détails d'un locataire
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de locataire invalide',
      });
    }

    const result = await TenantService.getTenant(parseInt(id));
    res.status(200).json(result);
  } catch (error) {
    logger.error(`GET /:id error: ${error.message}`);

    if (error.message === 'Locataire non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Locataire non trouvé',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération du locataire',
    });
  }
});

/**
 * POST /api/tenants/:id/guarantor
 * Ajouter ou mettre à jour un garanteur pour un locataire
 */
router.post('/:id/guarantor', validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const guarantorData = req.body;

    // Validation de l'ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de locataire invalide',
      });
    }

    // Validation des données du garanteur
    if (!guarantorData.nom || !guarantorData.prenom) {
      return res.status(400).json({
        success: false,
        error: 'Nom et prénom du garanteur requis',
      });
    }

    const result = await TenantService.addGuarantor(parseInt(id), guarantorData);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`POST /:id/guarantor error: ${error.message}`);

    if (error.message === 'Locataire non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Locataire non trouvé',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'ajout du garanteur',
    });
  }
});

/**
 * DELETE /api/tenants/:id
 * Supprimer (archiver) un locataire
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de locataire invalide',
      });
    }

    const result = await TenantService.deleteTenant(parseInt(id));
    res.status(200).json(result);
  } catch (error) {
    logger.error(`DELETE /:id error: ${error.message}`);

    if (error.message === 'Locataire non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Locataire non trouvé',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression du locataire',
    });
  }
});

module.exports = router;
