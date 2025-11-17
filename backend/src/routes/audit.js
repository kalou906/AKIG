/**
 * Audit Log Routes
 * backend/src/routes/audit.js
 * 
 * Endpoints pour la gestion des logs d'audit
 */

const express = require('express');
const AuditService = require('../services/audit.service');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

// Middleware pour authentification
router.use(authenticate);
const requireAdmin = authorize(['admin', 'super_admin']);

/**
 * GET /api/audit/logs
 * Récupère les logs d'audit (admin only)
 */
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const {
      actorId,
      action,
      entity,
      status,
      fromDate,
      toDate,
      verifiedOnly,
      limit = 100,
    } = req.query;

    const filters = {
      actorId: actorId ? parseInt(actorId) : undefined,
      action,
      entity,
      status,
      fromDate,
      toDate,
      verifiedOnly: verifiedOnly === 'true',
      limit: parseInt(limit),
    };

    const logs = await AuditService.getAuditLogs(filters);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    logger.error('Error fetching audit logs', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs d\'audit',
    });
  }
});

/**
 * GET /api/audit/trail/:entity/:entityId
 * Récupère l'historique d'audit pour une entité
 */
router.get('/trail/:entity/:entityId', async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const { limit = 100 } = req.query;

    const trail = await AuditService.getAuditTrail(
      entity,
      parseInt(entityId),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: trail,
      count: trail.length,
    });
  } catch (error) {
    logger.error('Error fetching audit trail', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
    });
  }
});

/**
 * GET /api/audit/recent
 * Récupère l'activité récente (admin only)
 */
router.get('/recent', requireAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const activity = await AuditService.getRecentActivity(parseInt(limit));

    res.json({
      success: true,
      data: activity,
      count: activity.length,
    });
  } catch (error) {
    logger.error('Error fetching recent audit activity', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'activité',
    });
  }
});

/**
 * GET /api/audit/compliance
 * Récupère le rapport de conformité (admin only)
 */
router.get('/compliance', requireAdmin, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'fromDate et toDate sont requis',
      });
    }

    const report = await AuditService.getComplianceReport(fromDate, toDate);

    res.json({
      success: true,
      data: report,
      count: report.length,
    });
  } catch (error) {
    logger.error('Error fetching compliance report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du rapport',
    });
  }
});

/**
 * GET /api/audit/stats
 * Récupère les statistiques d'audit (admin only)
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await AuditService.getAuditStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching audit stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
});

/**
 * POST /api/audit/verify/:logId
 * Vérifie une entrée d'audit (admin only)
 */
router.post('/verify/:logId', requireAdmin, async (req, res) => {
  try {
    const { logId } = req.params;
    const secret = process.env.AUDIT_SECRET_KEY;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Secret key not configured',
      });
    }

    const verified = await AuditService.verifyAuditEntry(
      parseInt(logId),
      secret
    );

    res.json({
      success: true,
      data: { verified },
      message: verified ? 'Signature vérifiée' : 'Signature invalide',
    });
  } catch (error) {
    logger.error('Error verifying audit entry', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
    });
  }
});

/**
 * POST /api/audit/archive
 * Archive les anciens logs (admin only)
 */
router.post('/archive', requireAdmin, async (req, res) => {
  try {
    const { days = 90 } = req.body;

    const result = await AuditService.archiveOldLogs(parseInt(days));

    res.json({
      success: true,
      message: `${result.archived} logs archivés, ${result.remaining} restants`,
      data: result,
    });
  } catch (error) {
    logger.error('Error archiving audit logs', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'archivage',
    });
  }
});

module.exports = router;
