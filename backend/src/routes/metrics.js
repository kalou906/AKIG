/**
 * Metrics Routes
 * Expose les métriques Prometheus et les endpoints de gestion
 * Accessibles uniquement aux administrateurs
 */

const express = require('express');
const { trace } = require('@opentelemetry/api');
const rateLimit = require('express-rate-limit');
const logger = require('../services/logger');
const businessMetrics = require('../metrics/business');
const { authenticate, authorize } = require('../middleware/auth');

const tracer = trace.getTracer('metrics-routes');
const router = express.Router();

// Limiteurs de taux
const metricsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par minute
  message: 'Trop de requêtes métriques',
  keyGenerator: (req) => {
    const { ipKeyGenerator } = require('express-rate-limit');
    return ipKeyGenerator(req);
  },
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Limiter les appels admin
});

// ============================================
// 1. Endpoint Prometheus Metrics (Public-Read)
// ============================================

/**
 * GET /metrics
 * Expose les métriques au format Prometheus
 * Accessible: Prometheus scraper, administrateurs
 */
router.get('/metrics', metricsLimiter, async (req, res) => {
  const span = tracer.startSpan('metrics.get', {
    attributes: {
      'http.method': 'GET',
      'http.url': '/metrics',
      'client.ip': req.ip,
    },
  });

  try {
    // Vérifier le header Authorization ou API key
    const authHeader = req.headers.authorization;
    const allowPublic = process.env.METRICS_PUBLIC === 'true';

    // Si pas public, vérifier l'auth
    if (!allowPublic && !authHeader) {
      span.addEvent('metrics_access_denied_no_auth');
      logger.warn('Metrics access denied - no auth', { ip: req.ip });
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Récupérer les métriques
    const metrics = await businessMetrics.registry.metrics();

    // Ajouter des métadonnées
    const metricsWithMetadata = [
      `# HELP akig_metrics_timestamp Timestamp de génération des métriques`,
      `# TYPE akig_metrics_timestamp gauge`,
      `akig_metrics_timestamp{} ${Date.now()}`,
      '',
      metrics,
    ].join('\n');

    res.set('Content-Type', businessMetrics.registry.contentType);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('X-Metrics-Timestamp', new Date().toISOString());

    span.addEvent('metrics_returned', {
      'metrics.size_bytes': Buffer.byteLength(metricsWithMetadata),
    });

    logger.debug('Metrics exported', {
      ip: req.ip,
      size_bytes: Buffer.byteLength(metricsWithMetadata),
    });

    res.send(metricsWithMetadata);
  } catch (error) {
    logger.error('Error exporting metrics', {
      error: error.message,
      ip: req.ip,
    });
    span.recordException(error);
    res.status(500).json({ error: 'Failed to export metrics' });
  } finally {
    span.end();
  }
});

// ============================================
// 2. Endpoint de Rafraîchissement (Admin-Only)
// ============================================

/**
 * POST /admin/metrics/refresh
 * Force le rafraîchissement des métriques métier
 * Accessible: Administrateurs
 */
router.post('/admin/metrics/refresh', authenticate, authorize('admin'), adminLimiter, async (req, res) => {
  const span = tracer.startSpan('metrics.refresh_admin', {
    attributes: {
      'user.id': req.user.id,
      'user.role': req.user.role,
    },
  });

  try {
    const agencyId = req.body.agencyId || null;

    logger.info('Metrics refresh requested', {
      user_id: req.user.id,
      agency_id: agencyId,
    });

    // Rafraîchir les métriques (asynchrone en arrière-plan)
    setImmediate(async () => {
      try {
        await businessMetrics.refreshAllMetrics(req.app.locals.pool, agencyId);
        logger.info('Metrics refresh completed', { agency_id: agencyId });
      } catch (error) {
        logger.error('Error refreshing metrics', { error: error.message });
      }
    });

    span.addEvent('refresh_queued', { 'agency_id': agencyId });

    res.status(202).json({
      message: 'Metrics refresh queued',
      agency_id: agencyId,
    });
  } catch (error) {
    logger.error('Error queuing metrics refresh', {
      user_id: req.user.id,
      error: error.message,
    });
    span.recordException(error);
    res.status(500).json({ error: 'Failed to queue refresh' });
  } finally {
    span.end();
  }
});

// ============================================
// 3. Endpoint Métriques Métier (Lecture)
// ============================================

/**
 * GET /api/metrics/occupancy
 * Métriques d'occupation par agence
 */
router.get('/api/metrics/occupancy', authenticate, metricsLimiter, async (req, res) => {
  const span = tracer.startSpan('metrics.occupancy_get');

  try {
    const agencyId = req.query.agencyId || req.user.agency_id;

    // Vérifier que l'utilisateur a accès à l'agence
    if (req.user.role !== 'admin' && req.user.agency_id !== agencyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await req.app.locals.pool.query(
      `SELECT 
        agency_id,
        COUNT(*) as total_units,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status = 'vacant' THEN 1 END) as vacant,
        ROUND((COUNT(CASE WHEN status = 'occupied' THEN 1 END)::numeric / 
               NULLIF(COUNT(*), 0) * 100), 2) as occupancy_rate
       FROM contracts
       WHERE status = 'active' AND agency_id = $1
       GROUP BY agency_id`,
      [agencyId]
    );

    span.addEvent('occupancy_data_retrieved', {
      'agency_id': agencyId,
      'units_count': rows[0]?.total_units || 0,
    });

    res.json({
      agency_id: agencyId,
      data: rows[0] || {
        occupancy_rate: 0,
        total_units: 0,
        occupied: 0,
        vacant: 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching occupancy metrics', { error: error.message });
    span.recordException(error);
    res.status(500).json({ error: 'Failed to fetch occupancy metrics' });
  } finally {
    span.end();
  }
});

/**
 * GET /api/metrics/financial
 * Métriques financières par agence
 */
router.get('/api/metrics/financial', authenticate, metricsLimiter, async (req, res) => {
  const span = tracer.startSpan('metrics.financial_get');

  try {
    const agencyId = req.query.agencyId || req.user.agency_id;
    const period = req.query.period || 'month'; // month, quarter, year

    if (req.user.role !== 'admin' && req.user.agency_id !== agencyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let periodCondition = `DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`;
    if (period === 'quarter') {
      periodCondition = `DATE_TRUNC('quarter', created_at) = DATE_TRUNC('quarter', NOW())`;
    } else if (period === 'year') {
      periodCondition = `DATE_TRUNC('year', created_at) = DATE_TRUNC('year', NOW())`;
    }

    const { rows } = await req.app.locals.pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as collected,
        COALESCE(SUM(amount), 0) as expected,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as arrears,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        ROUND((COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::numeric / 
               NULLIF(SUM(amount), 0) * 100), 2) as collection_rate
       FROM invoices
       WHERE agency_id = $1 AND ${periodCondition}`,
      [agencyId]
    );

    span.addEvent('financial_data_retrieved', {
      'agency_id': agencyId,
      'period': period,
    });

    res.json({
      agency_id: agencyId,
      period,
      data: rows[0] || {
        collected: 0,
        expected: 0,
        arrears: 0,
        collection_rate: 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching financial metrics', { error: error.message });
    span.recordException(error);
    res.status(500).json({ error: 'Failed to fetch financial metrics' });
  } finally {
    span.end();
  }
});

/**
 * GET /api/metrics/contracts
 * Métriques de contrats
 */
router.get('/api/metrics/contracts', authenticate, metricsLimiter, async (req, res) => {
  const span = tracer.startSpan('metrics.contracts_get');

  try {
    const agencyId = req.query.agencyId || req.user.agency_id;

    if (req.user.role !== 'admin' && req.user.agency_id !== agencyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await req.app.locals.pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'terminated') as terminated,
        COUNT(*) FILTER (WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') as expiring_soon,
        ROUND(AVG(EXTRACT(DAY FROM (end_date - start_date)) / 30.44)::numeric, 1) as avg_length_months
       FROM contracts
       WHERE agency_id = $1`,
      [agencyId]
    );

    span.addEvent('contract_data_retrieved', {
      'agency_id': agencyId,
    });

    res.json({
      agency_id: agencyId,
      data: rows[0] || {},
    });
  } catch (error) {
    logger.error('Error fetching contract metrics', { error: error.message });
    span.recordException(error);
    res.status(500).json({ error: 'Failed to fetch contract metrics' });
  } finally {
    span.end();
  }
});

/**
 * GET /api/metrics/tenants
 * Métriques de locataires
 */
router.get('/api/metrics/tenants', authenticate, metricsLimiter, async (req, res) => {
  const span = tracer.startSpan('metrics.tenants_get');

  try {
    const agencyId = req.query.agencyId || req.user.agency_id;

    if (req.user.role !== 'admin' && req.user.agency_id !== agencyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await req.app.locals.pool.query(
      `SELECT
        COUNT(DISTINCT u.id) as total,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', NOW()) 
                           THEN u.id END) as new_this_month,
        COUNT(DISTINCT CASE WHEN EXISTS(
          SELECT 1 FROM invoices i 
          WHERE i.contract_id = c.id AND i.status = 'overdue'
        ) THEN u.id END) as in_default
       FROM users u
       JOIN contracts c ON u.id = c.tenant_id
       WHERE c.status = 'active' AND c.agency_id = $1`,
      [agencyId]
    );

    span.addEvent('tenant_data_retrieved', {
      'agency_id': agencyId,
    });

    res.json({
      agency_id: agencyId,
      data: rows[0] || {},
    });
  } catch (error) {
    logger.error('Error fetching tenant metrics', { error: error.message });
    span.recordException(error);
    res.status(500).json({ error: 'Failed to fetch tenant metrics' });
  } finally {
    span.end();
  }
});

// ============================================
// 4. Endpoint de Santé (Public)
// ============================================

/**
 * GET /health/metrics
 * Vérification de santé du système de métriques
 */
router.get('/health/metrics', metricsLimiter, async (req, res) => {
  const span = tracer.startSpan('metrics.health_check');

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        registry_accessible: true,
        business_metrics_available: true,
      },
    };

    // Vérifier que les métriques peuvent être lues
    try {
      await businessMetrics.registry.metrics();
    } catch (error) {
      health.status = 'degraded';
      health.metrics.registry_accessible = false;
    }

    span.setAttributes({
      'health.status': health.status,
    });

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Error checking metrics health', { error: error.message });
    span.recordException(error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  } finally {
    span.end();
  }
});

module.exports = router;
