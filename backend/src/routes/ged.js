/**
 * Document Management Routes (GED)
 * backend/src/routes/ged.js
 * 
 * Endpoints pour la gestion des documents
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const GEDService = require('../services/ged.service');
const { authenticate } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

// Configuration multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/documents');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    cb(null, `${timestamp}-${random}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Middleware
router.use(authenticate);

/**
 * POST /api/ged/upload
 * Télécharge un nouveau document
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
      });
    }

    const { name, metadata } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du document est requis',
      });
    }

    const document = await GEDService.createDocument({
      agencyId: req.user.agency_id,
      name,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      metadata: metadata ? JSON.parse(metadata) : {},
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploadé avec succès',
      data: document,
    });
  } catch (error) {
    logger.error('Error uploading document', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du document',
    });
  }
});

/**
 * GET /api/ged/:documentId
 * Récupère les informations d'un document
 */
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await GEDService.getDocument(parseInt(documentId));

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Log l'accès
    await GEDService.logAccess(
      parseInt(documentId),
      req.user.id,
      'view',
      req.ip,
      req.get('user-agent')
    );

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Error fetching document', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du document',
    });
  }
});

/**
 * POST /api/ged/:documentId/version
 * Crée une nouvelle version du document
 */
router.post('/:documentId/version', upload.single('file'), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { notes } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
      });
    }

    const version = await GEDService.updateDocument(
      parseInt(documentId),
      req.file.path,
      req.file.size,
      notes || '',
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Nouvelle version créée',
      data: version,
    });
  } catch (error) {
    logger.error('Error creating document version', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la version',
    });
  }
});

/**
 * GET /api/ged/:documentId/history
 * Récupère l'historique des versions
 */
router.get('/:documentId/history', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { limit = 20 } = req.query;

    const history = await GEDService.getDocumentHistory(
      parseInt(documentId),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    logger.error('Error fetching document history', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
    });
  }
});

/**
 * POST /api/ged/:documentId/restore/:versionNumber
 * Restaure une version antérieure
 */
router.post('/:documentId/restore/:versionNumber', async (req, res) => {
  try {
    const { documentId, versionNumber } = req.params;

    const version = await GEDService.restoreVersion(
      parseInt(documentId),
      parseInt(versionNumber),
      req.user.id
    );

    res.json({
      success: true,
      message: 'Version restaurée',
      data: version,
    });
  } catch (error) {
    logger.error('Error restoring version', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la restauration',
    });
  }
});

/**
 * POST /api/ged/:documentId/share
 * Partage un document
 */
router.post('/:documentId/share', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { sharedWithUserId, permission = 'view', expiresAt } = req.body;

    if (!sharedWithUserId) {
      return res.status(400).json({
        success: false,
        message: 'sharedWithUserId est requis',
      });
    }

    const sharing = await GEDService.shareDocument(
      parseInt(documentId),
      parseInt(sharedWithUserId),
      permission,
      req.user.id,
      expiresAt
    );

    res.status(201).json({
      success: true,
      message: 'Document partagé',
      data: sharing,
    });
  } catch (error) {
    logger.error('Error sharing document', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors du partage',
    });
  }
});

/**
 * GET /api/ged/shared/with-me
 * Récupère les documents partagés avec moi
 */
router.get('/shared/with-me', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const documents = await GEDService.getSharedDocuments(
      req.user.id,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    logger.error('Error fetching shared documents', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
    });
  }
});

/**
 * GET /api/ged/agency/documents
 * Récupère les documents de l'agence
 */
router.get('/agency/documents', async (req, res) => {
  try {
    const { status, fileType, search, limit = 100 } = req.query;

    const documents = await GEDService.getAgencyDocuments(req.user.agency_id, {
      status,
      fileType,
      search,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    logger.error('Error fetching agency documents', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents',
    });
  }
});

/**
 * GET /api/ged/recent
 * Récupère les documents récents
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const documents = await GEDService.getRecentDocuments(parseInt(limit));

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    logger.error('Error fetching recent documents', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
    });
  }
});

/**
 * GET /api/ged/:documentId/stats
 * Récupère les statistiques d'accès
 */
router.get('/:documentId/stats', async (req, res) => {
  try {
    const { documentId } = req.params;

    const stats = await GEDService.getAccessStats(parseInt(documentId));

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching access stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
});

/**
 * DELETE /api/ged/:documentId
 * Supprime un document
 */
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await GEDService.deleteDocument(parseInt(documentId));

    res.json({
      success: true,
      message: 'Document supprimé',
      data: document,
    });
  } catch (error) {
    logger.error('Error deleting document', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
    });
  }
});

/**
 * POST /api/ged/:documentId/tags
 * Ajoute des tags à un document
 */
router.post('/:documentId/tags', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags doit être un tableau',
      });
    }

    const updatedTags = await GEDService.addTags(parseInt(documentId), tags);

    res.json({
      success: true,
      message: 'Tags ajoutés',
      data: { tags: updatedTags },
    });
  } catch (error) {
    logger.error('Error adding tags', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des tags',
    });
  }
});

module.exports = router;
