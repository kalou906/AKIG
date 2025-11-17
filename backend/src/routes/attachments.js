/**
 * attachments.js
 * Phase 9: Routes API pour gestion des fichiers
 * 5 endpoints: upload, download, delete, preview, search
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const AttachmentService = require('../services/AttachmentService');
const { authenticateJWT, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'zip'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} not allowed`));
    }
  }
});

/**
 * POST /api/attachments/upload
 * Uploader un fichier
 */
router.post('/upload', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { entity_type, entity_id } = req.body;
    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type and entity_id required' });
    }

    const attachment = await AttachmentService.uploadFile(
      {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      },
      req.user.id,
      entity_type,
      entity_id
    );

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/attachments/:id/download
 * Télécharger fichier
 */
router.get('/:id/download', authenticateJWT, async (req, res) => {
  try {
    const file = await AttachmentService.downloadFile(req.params.id);

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/attachments/:id/preview
 * Aperçu fichier (images uniquement)
 */
router.get('/:id/preview', authenticateJWT, async (req, res) => {
  try {
    const { size = 'thumb' } = req.query;
    const buffer = await AttachmentService.getPreview(req.params.id, size);

    const attachment = await AttachmentService.getAttachmentById(req.params.id);
    res.setHeader('Content-Type', attachment.mime_type);
    res.send(buffer);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/attachments/:id
 * Supprimer fichier (soft delete)
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    await AttachmentService.deleteAttachment(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'File deleted'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/attachments/entity/:type/:id
 * Lister fichiers par entité
 */
router.get('/entity/:type/:id', authenticateJWT, async (req, res) => {
  try {
    const attachments = await AttachmentService.listAttachmentsByEntity(
      req.params.type,
      req.params.id
    );

    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/attachments/search
 * Rechercher fichiers
 */
router.get('/search', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, filename, ext, entity_type, date_from, date_to } = req.query;

    const filters = {};
    if (filename) filters.filename = filename;
    if (ext) filters.ext = ext;
    if (entity_type) filters.entity_type = entity_type;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const attachments = await AttachmentService.searchAttachments(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: attachments,
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/attachments/stats/overview
 * Statistiques attachments
 */
router.get('/stats/overview', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const stats = await AttachmentService.getAttachmentStats();
    const byType = await AttachmentService.getAttachmentsByType();

    res.json({
      success: true,
      data: { ...stats, by_type: byType }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
