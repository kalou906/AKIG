/**
 * 🏘️ Routes API - Gestion des Propriétés
 * GET, POST, PUT, DELETE propriétés immobilières pour agence guinéenne
 */

const express = require('express');
const router = express.Router();
const PropertyService = require('../services/PropertyService');

// Middleware
const authMiddleware = require('../middleware/auth');

// Initialiser le service (le pool PostgreSQL sera injecté depuis l'app)
let propertyService;

// Middleware pour injecter le service
const usePropertyService = (req, res, next) => {
  if (!propertyService && req.app.get('propertyService')) {
    propertyService = req.app.get('propertyService');
  }
  next();
};

router.use(usePropertyService);
router.use(authMiddleware);

/**
 * GET /api/properties
 * Lister toutes les propriétés avec filtres
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status || 'available',
      city: req.query.city || 'Conakry',
      district: req.query.district,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      bedrooms: req.query.bedrooms,
      agentId: req.query.agentId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await propertyService.listProperties(filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur GET /properties:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/search
 * Recherche avancée de propriétés
 */
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const filters = {
      type: req.query.type,
      status: req.query.status,
    };

    const result = await propertyService.searchProperties(searchTerm, filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur recherche propriétés:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/available
 * Lister les propriétés disponibles
 */
router.get('/available', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      district: req.query.district,
    };

    const result = await propertyService.getAvailableProperties(filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur propriétés disponibles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/stats
 * Statistiques de marché immobilier
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await propertyService.getMarketStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur stats marché:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/:id
 * Obtenir une propriété spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Propriété non trouvée' });
    }
    res.json({ success: true, data: property });
  } catch (error) {
    console.error('❌ Erreur GET /properties/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/agent/:agentId
 * Propriétés gérées par un agent
 */
router.get('/agent/:agentId', async (req, res) => {
  try {
    const result = await propertyService.getAgentProperties(req.params.agentId);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur propriétés agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/properties
 * Créer une nouvelle propriété
 */
router.post('/', async (req, res) => {
  try {
    // Vérifier les permissions
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    req.body.createdBy = req.user.id;
    const result = await propertyService.createProperty(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur POST /properties:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/properties/:id
 * Mettre à jour une propriété
 */
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    req.body.updatedBy = req.user.id;
    const result = await propertyService.updateProperty(req.params.id, req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur PUT /properties/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/properties/:id
 * Supprimer une propriété (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const result = await propertyService.deleteProperty(req.params.id, req.user.id);
    
    if (result.success) {
      res.json({ success: true, message: 'Propriété supprimée' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur DELETE /properties/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
