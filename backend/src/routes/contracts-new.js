/**
 * 📋 Routes API - Gestion des Contrats de Location
 */

const express = require('express');
const router = express.Router();
const ContractService = require('../services/ContractService');
const authMiddleware = require('../middleware/auth');

let contractService;

const useContractService = (req, res, next) => {
  if (!contractService && req.app.get('contractService')) {
    contractService = req.app.get('contractService');
  }
  next();
};

router.use(useContractService);
router.use(authMiddleware);

/**
 * GET /api/contracts
 * Lister tous les contrats
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      tenantId: req.query.tenantId,
      landlordId: req.query.landlordId,
      propertyId: req.query.propertyId,
      hasArrears: req.query.hasArrears === 'true',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await contractService.listContracts(filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur GET /contracts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/contracts/active
 * Lister les contrats actifs
 */
router.get('/active', async (req, res) => {
  try {
    const result = await contractService.getActiveContracts();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur contrats actifs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/contracts/expiring
 * Lister les contrats arrivant à expiration
 */
router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await contractService.getExpiringContracts(days);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur contrats expirant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/contracts/arrears
 * Lister les contrats avec arriérés
 */
router.get('/arrears', async (req, res) => {
  try {
    const result = await contractService.getContractsWithArrears();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur contrats arriérés:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/contracts/stats
 * Statistiques contrats
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await contractService.getContractStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur stats contrats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/contracts/:id
 * Obtenir un contrat spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }
    res.json({ success: true, data: contract });
  } catch (error) {
    console.error('❌ Erreur GET /contracts/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/contracts
 * Créer un nouveau contrat
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    req.body.createdBy = req.user.id;
    const result = await contractService.createContract(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur POST /contracts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/contracts/:id
 * Mettre à jour un contrat
 */
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    req.body.updatedBy = req.user.id;
    const result = await contractService.updateContract(req.params.id, req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur PUT /contracts/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/contracts/:id/sign
 * Signer un contrat
 */
router.post('/:id/sign', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const result = await contractService.signContract(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur signature contrat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/contracts/:id/terminate
 * Terminer un contrat
 */
router.post('/:id/terminate', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    const terminationData = {
      reason: req.body.reason || 'Résiliation',
      terminatedBy: req.user.id,
    };

    const result = await contractService.terminateContract(req.params.id, terminationData);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur résiliation contrat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
