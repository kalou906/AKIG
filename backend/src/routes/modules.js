/**
 * Modules Routes
 * backend/src/routes/modules.js
 * 
 * Endpoints pour la gestion des modules
 */

const express = require('express');
const ModulesService = require('../services/modules.service');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

// Middleware pour vérifier l'authentification admin
router.use(authenticate);
const requireAdmin = authorize(['admin', 'super_admin']);

/**
 * GET /api/modules
 * Récupère tous les modules globaux
 */
router.get('/', async (req, res) => {
  try {
    const modules = await ModulesService.getAllModules();
    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    logger.error('Error fetching modules', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des modules',
    });
  }
});

/**
 * GET /api/modules/:agencyId
 * Récupère les modules pour une agence spécifique
 */
router.get('/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const modules = await ModulesService.getAgencyModules(parseInt(agencyId));
    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    logger.error('Error fetching agency modules', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des modules',
    });
  }
});

/**
 * GET /api/modules/code/:code
 * Récupère un module par son code
 */
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const module = await ModulesService.getModuleByCode(code);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module non trouvé',
      });
    }

    res.json({
      success: true,
      data: module,
    });
  } catch (error) {
    logger.error('Error fetching module', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du module',
    });
  }
});

/**
 * POST /api/modules
 * Crée un nouveau module (admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { code, name, description, enabled, agencyId } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Code et nom sont requis',
      });
    }

    const module = await ModulesService.createModule({
      code,
      name,
      description,
      enabled: enabled || false,
      agencyId: agencyId || null,
    });

    res.status(201).json({
      success: true,
      message: 'Module créé avec succès',
      data: module,
    });
  } catch (error) {
    logger.error('Error creating module', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du module',
    });
  }
});

/**
 * PATCH /api/modules/:code/enable/:agencyId
 * Active un module pour une agence
 */
router.patch('/:code/enable/:agencyId', requireAdmin, async (req, res) => {
  try {
    const { code, agencyId } = req.params;
    const module = await ModulesService.enableModule(code, parseInt(agencyId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Module activé avec succès',
      data: module,
    });
  } catch (error) {
    logger.error('Error enabling module', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du module',
    });
  }
});

/**
 * PATCH /api/modules/:code/disable/:agencyId
 * Désactive un module pour une agence
 */
router.patch('/:code/disable/:agencyId', requireAdmin, async (req, res) => {
  try {
    const { code, agencyId } = req.params;
    const module = await ModulesService.disableModule(code, parseInt(agencyId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Module désactivé avec succès',
      data: module,
    });
  } catch (error) {
    logger.error('Error disabling module', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du module',
    });
  }
});

/**
 * PATCH /api/modules/:code
 * Met à jour un module (admin only)
 */
router.patch('/:code', requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, description, enabled } = req.body;

    const module = await ModulesService.updateModule(code, {
      name,
      description,
      enabled,
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Module mis à jour avec succès',
      data: module,
    });
  } catch (error) {
    logger.error('Error updating module', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du module',
    });
  }
});

/**
 * DELETE /api/modules/:code
 * Supprime un module (admin only)
 */
router.delete('/:code', requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { agencyId } = req.body;

    const module = await ModulesService.deleteModule(code, agencyId || null);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Module supprimé avec succès',
      data: module,
    });
  } catch (error) {
    logger.error('Error deleting module', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du module',
    });
  }
});

/**
 * GET /api/modules/missing/:agencyId
 * Récupère les modules manquants pour une agence
 */
router.get('/missing/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const modules = await ModulesService.getMissingModules(parseInt(agencyId));

    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    logger.error('Error fetching missing modules', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des modules manquants',
    });
  }
});

/**
 * POST /api/modules/assign-defaults/:agencyId
 * Assigne les modules par défaut à une agence
 */
router.post('/assign-defaults/:agencyId', requireAdmin, async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { moduleCodes } = req.body;

    const modules = await ModulesService.assignDefaultModules(
      parseInt(agencyId),
      moduleCodes
    );

    res.status(201).json({
      success: true,
      message: `${modules.length} module(s) assigné(s) avec succès`,
      data: modules,
    });
  } catch (error) {
    logger.error('Error assigning default modules', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation des modules',
    });
  }
});

/**
 * POST /api/modules/toggle
 * Bascule l'état d'un module pour une agence
 */
router.post('/toggle', async (req, res) => {
  try {
    const { code, enabled } = req.body;
    
    if (!code || enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Code et enabled sont requis',
      });
    }

    // Vérifier les permissions - l'utilisateur doit être admin ou propriétaire de l'agence
    if (!req.user.agency_id && !req.user.roles.includes('super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    const result = await ModulesService.updateModule(code, {
      enabled,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Module non trouvé',
      });
    }

    res.json({
      success: true,
      message: `Module ${enabled ? 'activé' : 'désactivé'} avec succès`,
      data: result,
    });
  } catch (error) {
    logger.error('Error toggling module', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la bascule du module',
    });
  }
});

module.exports = router;

