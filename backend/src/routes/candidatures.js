/**
 * candidatures.js
 * Phase 8: Routes API pour gestion des candidatures
 * 8 endpoints avec JWT auth, validation, error handling
 */

const express = require('express');
const router = express.Router();
const CandidatureService = require('../services/CandidatureService');
const { authenticateJWT, authorize } = require('../middleware/auth');

/**
 * POST /api/candidatures
 * Créer une nouvelle candidature
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });

    const candidature = await CandidatureService.createCandidature(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: candidature,
      message: 'Candidature créée avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/candidatures
 * Lister candidatures avec filtres et pagination
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, local_id, proprietaire_id, search } = req.query;
    
    const filters = {};
    if (statut) filters.statut = statut;
    if (local_id) filters.local_id = parseInt(local_id);
    if (proprietaire_id) filters.proprietaire_id = parseInt(proprietaire_id);
    if (search) filters.search = search;

    const candidatures = await CandidatureService.listCandidatures(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: candidatures,
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
 * GET /api/candidatures/:id
 * Récupérer détails candidature
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const candidature = await CandidatureService.getCandidatureById(req.params.id);
    
    res.json({
      success: true,
      data: candidature
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/candidatures/:id
 * Mettre à jour candidature
 */
router.patch('/:id', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });

    const candidature = await CandidatureService.updateCandidature(
      req.params.id,
      req.body,
      req.user.id
    );

    res.json({
      success: true,
      data: candidature,
      message: 'Candidature mise à jour'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/candidatures/:id
 * Supprimer candidature (soft delete)
 */
router.delete('/:id', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    await CandidatureService.deleteCandidature(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Candidature supprimée'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/candidatures/:id/dossierfacile
 * Intégrer avec Dossierfacile
 */
router.post('/:id/dossierfacile', authenticateJWT, async (req, res) => {
  try {
    const { df_id } = req.body;
    if (!df_id) throw new Error('df_id required');

    const candidature = await CandidatureService.integrateDossierfacile(req.params.id, df_id);

    res.json({
      success: true,
      data: candidature,
      message: 'Dossierfacile intégré'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/candidatures/stats/overview
 * Statistiques candidatures
 */
router.get('/stats/overview', authenticateJWT, async (req, res) => {
  try {
    const { proprietaire_id } = req.query;
    
    const stats = await CandidatureService.getCandidatureStats(
      proprietaire_id ? parseInt(proprietaire_id) : null
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/candidatures/export
 * Exporter candidatures
 */
router.post('/export', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const { candidature_ids, format = 'json' } = req.body;
    
    if (!Array.isArray(candidature_ids) || candidature_ids.length === 0) {
      throw new Error('candidature_ids must be a non-empty array');
    }

    const data = await CandidatureService.exportCandidatures(candidature_ids, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=candidatures.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }

    res.send(data);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
