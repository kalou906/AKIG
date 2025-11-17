/**
 * Archive Routes
 * backend/src/routes/archive.js
 * 
 * Endpoints pour l'archivage légal et PDF/A
 */

const express = require('express');
const PDFAService = require('../services/pdfa.js');
const GEDService = require('../services/ged.js');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

// Middleware
router.use(authenticate);
const requireAdmin = authorize(['admin', 'super_admin']);

/**
 * POST /api/archive/document/:documentId
 * Archive un document en PDF/A
 */
router.post('/document/:documentId', requireAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { retentionYears = 10 } = req.body;

    // Récupérer le document
    const doc = await GEDService.getDocument(parseInt(documentId));

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Créer document d'archive
    const archiveDoc = await PDFAService.createArchiveDocument(
      Buffer.alloc(0), // En production, lire le fichier réel
      {
        document_id: documentId,
        document_name: doc.name,
        retention_years: retentionYears,
        agency_id: req.user.agency_id,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Document archivé en PDF/A',
      data: {
        document_id: documentId,
        format: archiveDoc.format,
        checksum: archiveDoc.checksum,
        timestamp: archiveDoc.timestamp,
        retention_until: new Date(
          new Date(archiveDoc.metadata.archived_at).getTime() +
            retentionYears * 365.25 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error archiving document', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'archivage',
    });
  }
});

/**
 * POST /api/archive/verify/:documentId
 * Vérifie l'intégrité d'un document archivé
 */
router.post('/verify/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { archiveDocument } = req.body;

    if (!archiveDocument) {
      return res.status(400).json({
        success: false,
        message: 'archiveDocument est requis',
      });
    }

    const verification = PDFAService.verifyArchiveDocument(archiveDocument);

    res.json({
      success: true,
      data: {
        document_id: documentId,
        ...verification,
      },
    });
  } catch (error) {
    logger.error('Error verifying archive', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
    });
  }
});

/**
 * POST /api/archive/manifest
 * Crée un manifeste d'archivage
 */
router.post('/manifest', requireAdmin, async (req, res) => {
  try {
    const { documents = [] } = req.body;

    const manifest = await PDFAService.createManifest(documents);

    res.status(201).json({
      success: true,
      message: 'Manifeste d\'archivage créé',
      data: manifest,
    });
  } catch (error) {
    logger.error('Error creating manifest', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du manifeste',
    });
  }
});

/**
 * POST /api/archive/verify-manifest
 * Vérifie un manifeste d'archivage
 */
router.post('/verify-manifest', async (req, res) => {
  try {
    const { manifest } = req.body;

    if (!manifest) {
      return res.status(400).json({
        success: false,
        message: 'manifest est requis',
      });
    }

    const isValid = PDFAService.verifyManifest(manifest);

    res.json({
      success: true,
      data: {
        valid: isValid,
        manifest_checksum: manifest.checksum,
      },
    });
  } catch (error) {
    logger.error('Error verifying manifest', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du manifeste',
    });
  }
});

/**
 * GET /api/archive/report
 * Génère un rapport d'archivage
 */
router.get('/report', requireAdmin, async (req, res) => {
  try {
    const { documents = [] } = req.query;

    const report = PDFAService.generateArchiveReport(
      typeof documents === 'string' ? JSON.parse(documents) : documents
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error generating archive report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
    });
  }
});

/**
 * POST /api/archive/timestamp
 * Crée un timestamp pour un payload
 */
router.post('/timestamp', async (req, res) => {
  try {
    const { payload } = req.body;

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'payload est requis',
      });
    }

    const ts = await PDFAService.timestamp(payload);

    res.status(201).json({
      success: true,
      message: 'Timestamp créé',
      data: ts,
    });
  } catch (error) {
    logger.error('Error creating timestamp', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du timestamp',
    });
  }
});

/**
 * POST /api/archive/verify-timestamp
 * Vérifie un timestamp
 */
router.post('/verify-timestamp', async (req, res) => {
  try {
    const { payload, timestamp } = req.body;

    if (!payload || !timestamp) {
      return res.status(400).json({
        success: false,
        message: 'payload et timestamp sont requis',
      });
    }

    const isValid = PDFAService.verifyTimestamp(payload, timestamp);

    res.json({
      success: true,
      data: {
        valid: isValid,
        timestamp: timestamp.timestamp,
      },
    });
  } catch (error) {
    logger.error('Error verifying timestamp', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du timestamp',
    });
  }
});

module.exports = router;
