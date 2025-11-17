/**
 * Operations Dashboard Routes
 * Provides KPIs, metrics, logging, and system analytics for administrators
 * All endpoints require admin role
 */

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { sanitizeQuery } = require('../middleware/security');
const { param, query, validationResult } = require('express-validator');

/**
 * Middleware to verify admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * GET /ops/kpis
 * Get key performance indicators dashboard data
 */
router.get('/ops/kpis', requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = req.app.get('db');

    // Get all metrics in parallel
    const [
      { rows: arrears },
      { rows: occupancy },
      { rows: revenueData },
      { rows: contractMetrics },
      { rows: paymentMetrics },
      { rows: userMetrics },
      { rows: systemMetrics }
    ] = await Promise.all([
      // Overdue invoices by agency
      pool.query(
        `SELECT agency_id, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
         FROM invoices 
         WHERE status = 'overdue' 
         GROUP BY agency_id
         ORDER BY total DESC`
      ),
      // Occupancy rates
      pool.query(
        `SELECT id AS agency_id, name, 
                (SELECT COUNT(*) FROM contracts WHERE agency_id = agencies.id AND status = 'active') AS active_contracts,
                (SELECT COUNT(*) FROM contracts WHERE agency_id = agencies.id) AS total_contracts
         FROM agencies
         ORDER BY active_contracts DESC`
      ),
      // Revenue metrics (last 30 days)
      pool.query(
        `SELECT 
           DATE_TRUNC('day', created_at)::DATE AS date,
           COUNT(*) AS transaction_count,
           SUM(amount) AS total_revenue,
           AVG(amount) AS avg_amount
         FROM payments
         WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY date DESC`
      ),
      // Contract metrics
      pool.query(
        `SELECT 
           status,
           COUNT(*) AS count,
           SUM(amount) AS total_value,
           AVG(amount) AS avg_value
         FROM contracts
         GROUP BY status`
      ),
      // Payment metrics
      pool.query(
        `SELECT 
           status,
           method,
           COUNT(*) AS count,
           SUM(amount) AS total,
           AVG(amount) AS avg_amount
         FROM payments
         WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY status, method`
      ),
      // User metrics
      pool.query(
        `SELECT 
           'total_users' AS metric, COUNT(*) AS value FROM users
         UNION ALL
         SELECT 'active_users', COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '7 days'
         UNION ALL
         SELECT 'new_users_30d', COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days'
         UNION ALL
         SELECT 'users_with_tokens', COUNT(DISTINCT user_id) FROM api_tokens WHERE revoked = false`
      ),
      // System health
      pool.query(
        `SELECT 
           'db_connections' AS metric, COUNT(*) AS value FROM pg_stat_activity
         UNION ALL
         SELECT 'slow_queries', COUNT(*) FROM query_log WHERE duration_ms > 1000 AND created_at > NOW() - INTERVAL '1 day'
         UNION ALL
         SELECT 'errors_24h', COUNT(*) FROM logs WHERE level = 'error' AND created_at > NOW() - INTERVAL '1 day'`
      )
    ]);

    // Calculate summary statistics
    const totalArrears = arrears.reduce((sum, row) => sum + parseFloat(row.total || 0), 0);
    const totalRevenue = revenueData.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);
    const activeContracts = contractMetrics.find(m => m.status === 'active') || { count: 0 };
    const completedPayments = paymentMetrics.filter(p => p.status === 'completed');
    const totalPayments = completedPayments.reduce((sum, row) => sum + parseFloat(row.total || 0), 0);

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalArrears,
        totalRevenue,
        activeContracts: activeContracts.count,
        successfulPayments: completedPayments.reduce((sum, row) => sum + row.count, 0),
        totalPaymentValue: totalPayments
      },
      metrics: {
        arrears: arrears.map(row => ({
          agencyId: row.agency_id,
          count: row.count,
          total: parseFloat(row.total)
        })),
        occupancy: occupancy.map(row => ({
          agencyId: row.agency_id,
          agencyName: row.name,
          activeContracts: row.active_contracts,
          totalContracts: row.total_contracts,
          rate: row.total_contracts > 0 ? ((row.active_contracts / row.total_contracts) * 100).toFixed(2) : '0.00'
        })),
        revenue: revenueData.map(row => ({
          date: row.date,
          transactions: row.transaction_count,
          total: parseFloat(row.total_revenue),
          average: parseFloat(row.avg_amount)
        })),
        contracts: contractMetrics.map(row => ({
          status: row.status,
          count: row.count,
          totalValue: parseFloat(row.total_value),
          averageValue: parseFloat(row.avg_value)
        })),
        payments: paymentMetrics.map(row => ({
          status: row.status,
          method: row.method,
          count: row.count,
          total: parseFloat(row.total),
          average: parseFloat(row.avg_amount)
        })),
        users: Object.fromEntries(
          userMetrics.map(row => [row.metric, row.value])
        ),
        system: Object.fromEntries(
          systemMetrics.map(row => [row.metric, row.value])
        )
      }
    });
  } catch (error) {
    console.error('GET /ops/kpis error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch KPIs'
    });
  }
});

/**
 * GET /ops/logs
 * Get system logs with optional filtering
 */
router.get(
  '/ops/logs',
  requireAuth,
  requireAdmin,
  sanitizeQuery(),
  [
    query('reqId')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }),
    query('level')
      .optional()
      .isIn(['debug', 'info', 'warn', 'error']),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .toInt(),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const pool = req.app.get('db');
      const { reqId, level, limit = 200, offset = 0 } = req.query;

      // Build dynamic query
      let query = `SELECT ts, level, message, req_id, metadata, user_id 
                   FROM logs 
                   WHERE 1=1`;
      const params = [];

      if (reqId) {
        query += ` AND req_id = $${params.length + 1}`;
        params.push(reqId);
      }

      if (level) {
        query += ` AND level = $${params.length + 1}`;
        params.push(level);
      }

      query += ` ORDER BY ts DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { rows } = await pool.query(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) AS count FROM logs WHERE 1=1`;
      const countParams = [];

      if (reqId) {
        countQuery += ` AND req_id = $${countParams.length + 1}`;
        countParams.push(reqId);
      }

      if (level) {
        countQuery += ` AND level = $${countParams.length + 1}`;
        countParams.push(level);
      }

      const { rows: countResult } = await pool.query(countQuery, countParams);
      const total = countResult[0]?.count || 0;

      res.json({
        logs: rows.map(row => ({
          timestamp: row.ts,
          level: row.level,
          message: row.message,
          requestId: row.req_id,
          userId: row.user_id,
          metadata: row.metadata
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    } catch (error) {
      console.error('GET /ops/logs error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch logs'
      });
    }
  }
);

/**
 * GET /ops/health
 * Get detailed system health status
 */
router.get('/ops/health', requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = req.app.get('db');

    // Database health
    const { rows: dbHealth } = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM pg_stat_activity) AS active_connections,
         (SELECT max_conn FROM pg_settings WHERE name = 'max_connections') AS max_connections,
         (SELECT COUNT(*) FROM pg_stat_replication) AS replication_slots,
         (SELECT EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time()))) AS uptime_seconds`
    );

    // Cache health (if using Redis)
    let cacheHealth = { status: 'unknown', message: 'Cache not configured' };

    // API performance
    const { rows: apiPerf } = await pool.query(
      `SELECT 
         COUNT(*) AS total_requests,
         AVG(duration_ms) AS avg_response_time,
         MAX(duration_ms) AS max_response_time,
         PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_response_time,
         COUNT(CASE WHEN status_code >= 500 THEN 1 END) AS error_count
       FROM api_logs
       WHERE created_at > NOW() - INTERVAL '1 hour'`
    );

    res.json({
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: {
        activeConnections: dbHealth[0]?.active_connections,
        maxConnections: parseInt(dbHealth[0]?.max_connections),
        uptimeSeconds: Math.floor(dbHealth[0]?.uptime_seconds),
        replicationSlots: dbHealth[0]?.replication_slots
      },
      cache: cacheHealth,
      api: {
        totalRequests: apiPerf[0]?.total_requests || 0,
        avgResponseTime: parseFloat(apiPerf[0]?.avg_response_time || 0).toFixed(2),
        maxResponseTime: apiPerf[0]?.max_response_time || 0,
        p95ResponseTime: parseFloat(apiPerf[0]?.p95_response_time || 0).toFixed(2),
        errorCount: apiPerf[0]?.error_count || 0
      }
    });
  } catch (error) {
    console.error('GET /ops/health error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * GET /ops/alerts
 * Get active alerts and issues
 */
router.get(
  '/ops/alerts',
  requireAuth,
  requireAdmin,
  [
    query('severity')
      .optional()
      .isIn(['info', 'warning', 'critical'])
  ],
  async (req, res) => {
    try {
      const pool = req.app.get('db');
      const { severity } = req.query;

      let query = `
        SELECT id, severity, title, message, created_at, resolved_at, metadata
        FROM alerts
        WHERE 1=1
      `;
      const params = [];

      if (severity) {
        query += ` AND severity = $${params.length + 1}`;
        params.push(severity);
      }

      // Only unresolved or recent
      query += ` AND (resolved_at IS NULL OR resolved_at > NOW() - INTERVAL '7 days')
        ORDER BY created_at DESC
        LIMIT 100`;

      const { rows } = await pool.query(query, params);

      res.json({
        alerts: rows.map(row => ({
          id: row.id,
          severity: row.severity,
          title: row.title,
          message: row.message,
          createdAt: row.created_at,
          resolvedAt: row.resolved_at,
          metadata: row.metadata,
          isActive: !row.resolved_at
        })),
        total: rows.length,
        activeCount: rows.filter(r => !r.resolved_at).length
      });
    } catch (error) {
      console.error('GET /ops/alerts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch alerts'
      });
    }
  }
);

/**
 * GET /ops/performance
 * Get performance metrics and trends
 */
router.get('/ops/performance', requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = req.app.get('db');

    const { rows: performanceData } = await pool.query(
      `SELECT 
         endpoint,
         method,
         COUNT(*) AS total_requests,
         AVG(duration_ms) AS avg_duration,
         MAX(duration_ms) AS max_duration,
         MIN(duration_ms) AS min_duration,
         PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) AS p50,
         PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
         PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99,
         COUNT(CASE WHEN status_code >= 500 THEN 1 END) AS errors
       FROM api_logs
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY endpoint, method
       ORDER BY total_requests DESC
       LIMIT 50`
    );

    res.json({
      period: '24 hours',
      endpoints: performanceData.map(row => ({
        endpoint: row.endpoint,
        method: row.method,
        requests: row.total_requests,
        timing: {
          average: parseFloat(row.avg_duration).toFixed(2),
          min: row.min_duration,
          max: row.max_duration,
          p50: parseFloat(row.p50).toFixed(2),
          p95: parseFloat(row.p95).toFixed(2),
          p99: parseFloat(row.p99).toFixed(2)
        },
        errors: row.errors
      }))
    });
  } catch (error) {
    console.error('GET /ops/performance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch performance data'
    });
  }
});

/**
 * POST /ops/alerts/:alertId/resolve
 * Manually resolve an alert
 */
router.post(
  '/ops/alerts/:alertId/resolve',
  requireAuth,
  requireAdmin,
  param('alertId').isInt().toInt(),
  async (req, res) => {
    try {
      const pool = req.app.get('db');
      const { alertId } = req.params;

      await pool.query(
        `UPDATE alerts SET resolved_at = NOW() WHERE id = $1`,
        [alertId]
      );

      res.json({
        message: 'Alert resolved successfully',
        alertId
      });
    } catch (error) {
      console.error('POST /ops/alerts/:alertId/resolve error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to resolve alert'
      });
    }
  }
);

module.exports = router;
