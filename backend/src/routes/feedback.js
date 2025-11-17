/**
 * Feedback Routes
 * src/routes/feedback.js
 * 
 * Endpoints pour la gestion du feedback utilisateur
 */

const express = require('express');
const FeedbackService = require('../services/feedback.service');
const feedbackSentiment = require('../services/feedbackSentiment');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

// Middleware pour toutes les routes
// router.use(authenticate);

/**
 * POST /api/feedback
 * Crée un nouveau feedback
 */
router.post('/', /* validateFeedback, */ async (req, res) => {
  try {
    const {
      agencyId,
      propertyId,
      tenantId,
      categoryId,
      typeId,
      score,
      title,
      comment,
    } = req.body;

    // Analyser le sentiment du commentaire
    const sentimentAnalysis = feedbackSentiment.analyze(comment);

    const feedbackData = {
      userId: req.user.id,
      agencyId,
      propertyId,
      tenantId,
      categoryId,
      typeId,
      score: parseInt(score),
      title,
      comment,
      sentiment: sentimentAnalysis.sentiment,
      sentiment_score: sentimentAnalysis.confidence,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      locale: req.get('accept-language')?.split(',')[0] || 'fr-FR',
    };

    const feedback = await FeedbackService.createFeedback(feedbackData);

    res.status(201).json({
      success: true,
      message: 'Feedback créé avec succès',
      data: feedback,
    });
  } catch (error) {
    logger.error('Erreur lors de la création du feedback', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du feedback',
    });
  }
});

/**
 * GET /api/feedback/:id
 * Récupère un feedback spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const feedback = await FeedbackService.getFeedbackById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback non trouvé',
      });
    }

    // Vérifier les permissions
    if (feedback.user_id !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du feedback', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du feedback',
    });
  }
});

/**
 * GET /api/feedback
 * Récupère tous les feedback avec filtrage
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      sentiment,
      priority,
      categoryId,
      typeId,
      minScore,
      maxScore,
      startDate,
      endDate,
      search,
      limit = 20,
      offset = 0,
    } = req.query;

    const filters = {
      status,
      sentiment,
      priority,
      categoryId,
      typeId,
      minScore: minScore ? parseInt(minScore) : undefined,
      maxScore: maxScore ? parseInt(maxScore) : undefined,
      startDate,
      endDate,
      search,
      limit: Math.min(parseInt(limit) || 20, 100),
      offset: parseInt(offset) || 0,
    };

    // Si l'utilisateur n'est pas admin, ne voir que ses propres feedback
    if (!req.user.roles.includes('admin')) {
      filters.userId = req.user.id;
    } else if (req.query.userId) {
      filters.userId = parseInt(req.query.userId);
    }

    // Si l'utilisateur est gestionnaire d'agence, voir les feedback de son agence
    if (req.user.roles.includes('agency_manager') && req.user.agencyId) {
      filters.agencyId = req.user.agencyId;
    } else if (req.query.agencyId) {
      filters.agencyId = parseInt(req.query.agencyId);
    }

    const result = await FeedbackService.getAllFeedback(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des feedback', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des feedback',
    });
  }
});

/**
 * PUT /api/feedback/:id
 * Met à jour un feedback
 */
router.put('/:id', authorize(['admin', 'agency_manager']), async (req, res) => {
  try {
    const { status, priority, categoryId, typeId, sentiment, sentimentScore } = req.body;

    const updateData = {
      status,
      priority,
      categoryId,
      typeId,
      sentiment,
      sentimentScore,
    };

    const feedback = await FeedbackService.updateFeedback(req.params.id, updateData);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Feedback mis à jour',
      data: feedback,
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du feedback', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du feedback',
    });
  }
});

/**
 * DELETE /api/feedback/:id
 * Supprime un feedback
 */
router.delete('/:id', authorize(['admin']), async (req, res) => {
  try {
    const feedback = await FeedbackService.deleteFeedback(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Feedback supprimé',
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression du feedback', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du feedback',
    });
  }
});

/**
 * POST /api/feedback/:id/responses
 * Ajoute une réponse à un feedback
 */
router.post('/:id/responses', /* authorize(['admin', 'agency_manager']), validateResponse, */ async (req, res) => {
  try {
    const { responseText, responseType = 'reply' } = req.body;

    const response = await FeedbackService.addResponse(
      req.params.id,
      req.user.id,
      responseText,
      responseType
    );

    res.status(201).json({
      success: true,
      message: 'Réponse ajoutée',
      data: response,
    });
  } catch (error) {
    logger.error("Erreur lors de l'ajout de la réponse", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de la réponse",
    });
  }
});

/**
 * GET /api/feedback/:id/responses
 * Récupère les réponses d'un feedback
 */
router.get('/:id/responses', async (req, res) => {
  try {
    const responses = await FeedbackService.getFeedbackResponses(req.params.id);

    res.json({
      success: true,
      data: responses,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des réponses', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réponses',
    });
  }
});

/**
 * POST /api/feedback/:id/ratings
 * Ajoute les évaluations détaillées
 */
router.post('/:id/ratings', /* validateResponse, */ async (req, res) => {
  try {
    const { npsScore, csatScore, cesScore, qualityScore, responsivenessScore } = req.body;

    const ratings = await FeedbackService.addRatings(req.params.id, {
      npsScore,
      csatScore,
      cesScore,
      qualityScore,
      responsivenessScore,
    });

    res.status(201).json({
      success: true,
      message: 'Évaluations ajoutées',
      data: ratings,
    });
  } catch (error) {
    logger.error("Erreur lors de l'ajout des évaluations", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout des évaluations",
    });
  }
});

/**
 * GET /api/feedback/stats/overview
 * Récupère les statistiques globales
 */
router.get('/stats/overview', authorize(['admin', 'agency_manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let agencyId = null;
    if (req.user.roles.includes('agency_manager') && req.user.agencyId) {
      agencyId = req.user.agencyId;
    } else if (req.query.agencyId && req.user.roles.includes('admin')) {
      agencyId = parseInt(req.query.agencyId);
    }

    const stats = await FeedbackService.getFeedbackStats({
      agencyId,
      startDate,
      endDate,
    });

    const summary = SentimentAnalyzer.generateSummary(
      await FeedbackService.getAllFeedback({
        agencyId,
        startDate,
        endDate,
        limit: 10000,
      }).then(r => r.data)
    );

    res.json({
      success: true,
      data: {
        stats,
        summary,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
});

/**
 * GET /api/feedback/stats/by-category
 * Récupère les statistiques par catégorie
 */
router.get('/stats/by-category', authorize(['admin', 'agency_manager']), async (req, res) => {
  try {
    let agencyId = null;
    if (req.user.roles.includes('agency_manager') && req.user.agencyId) {
      agencyId = req.user.agencyId;
    } else if (req.query.agencyId && req.user.roles.includes('admin')) {
      agencyId = parseInt(req.query.agencyId);
    }

    const categories = await FeedbackService.getFeedbackByCategory(agencyId);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des catégories', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
    });
  }
});

/**
 * GET /api/feedback/unresolved
 * Récupère les feedback non résolu
 */
router.get('/unresolved', authorize(['admin', 'agency_manager']), async (req, res) => {
  try {
    const { priority } = req.query;

    let agencyId = null;
    if (req.user.roles.includes('agency_manager') && req.user.agencyId) {
      agencyId = req.user.agencyId;
    }

    const unresolved = await FeedbackService.getUnresolvedFeedback(agencyId, priority);

    res.json({
      success: true,
      data: unresolved,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des feedback non résolu', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des feedback non résolu',
    });
  }
});

module.exports = router;
