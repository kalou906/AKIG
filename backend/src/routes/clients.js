/**
 * 👥 Routes API - Gestion des Clients
 * Locataires, Propriétaires, Investisseurs
 */

const express = require('express');
const router = express.Router();
const ClientService = require('../services/ClientService');
const authMiddleware = require('../middleware/auth');

let clientService;

const useClientService = (req, res, next) => {
  if (!clientService && req.app.get('clientService')) {
    clientService = req.app.get('clientService');
  }
  next();
};

router.use(useClientService);
router.use(authMiddleware);

/**
 * GET /api/clients
 * Lister tous les clients
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      type: req.query.type, // tenant, owner, buyer, investor
      status: req.query.status,
      verified: req.query.verified ? req.query.verified === 'true' : undefined,
      city: req.query.city,
      searchTerm: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await clientService.listClients(filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur GET /clients:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clients/qualified
 * Lister les clients qualifiés (vérifiés et fiables)
 */
router.get('/qualified', async (req, res) => {
  try {
    const result = await clientService.getQualifiedClients();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur clients qualifiés:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clients/stats
 * Statistiques clients
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await clientService.getClientStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur stats clients:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clients/:id
 * Obtenir un client spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const client = await clientService.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client non trouvé' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    console.error('❌ Erreur GET /clients/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/clients
 * Créer un nouveau client
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    req.body.createdBy = req.user.id;
    const result = await clientService.createClient(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur POST /clients:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/clients/:id
 * Mettre à jour un client
 */
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    req.body.updatedBy = req.user.id;
    const result = await clientService.updateClient(req.params.id, req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur PUT /clients/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/clients/:id/verify
 * Vérifier les documents d'un client
 */
router.post('/:id/verify', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const result = await clientService.verifyClient(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur vérification client:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/clients/:id/incident
 * Ajouter un incident à un client
 */
router.post('/:id/incident', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const result = await clientService.addIncident(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur ajout incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/clients/:id
 * Supprimer un client (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const result = await clientService.deleteClient(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur DELETE /clients/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
