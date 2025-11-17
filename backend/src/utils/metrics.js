/**
 * Prometheus Metrics
 * Collects metrics for monitoring and alerting
 */

const promClient = require('prom-client');

// ============================================
// 📊 Default Metrics
// ============================================
promClient.collectDefaultMetrics({
  prefix: 'akig_',
  timeout: 5000
});

// ============================================
// 📈 Custom Metrics
// ============================================

// HTTP Request metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'akig_http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000, 2000, 5000]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'akig_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Database metrics
const dbQueryDuration = new promClient.Histogram({
  name: 'akig_db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['query_type', 'table'],
  buckets: [1, 5, 10, 50, 100, 500, 1000]
});

const dbConnectionPoolSize = new promClient.Gauge({
  name: 'akig_db_pool_size',
  help: 'Current database connection pool size'
});

const dbConnectionErrors = new promClient.Counter({
  name: 'akig_db_connection_errors_total',
  help: 'Total database connection errors',
  labelNames: ['error_type']
});

// Cache metrics
const cacheHits = new promClient.Counter({
  name: 'akig_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type']
});

const cacheMisses = new promClient.Counter({
  name: 'akig_cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type']
});

const cacheOperationDuration = new promClient.Histogram({
  name: 'akig_cache_operation_duration_ms',
  help: 'Duration of cache operations in ms',
  labelNames: ['operation', 'cache_type'],
  buckets: [0.1, 1, 5, 10, 50]
});

// Authentication metrics
const authAttempts = new promClient.Counter({
  name: 'akig_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['status', 'method']
});

// Business metrics
const contractsCreated = new promClient.Counter({
  name: 'akig_contracts_created_total',
  help: 'Total contracts created'
});

const paymentsProcessed = new promClient.Counter({
  name: 'akig_payments_processed_total',
  help: 'Total payments processed',
  labelNames: ['status']
});

const paymentAmount = new promClient.Gauge({
  name: 'akig_payment_amount_total',
  help: 'Total payment amount processed'
});

// Error tracking
const errorCount = new promClient.Counter({
  name: 'akig_errors_total',
  help: 'Total errors',
  labelNames: ['error_type', 'endpoint']
});

const rateLimit = new promClient.Counter({
  name: 'akig_rate_limit_exceeded_total',
  help: 'Total rate limit exceeded events',
  labelNames: ['endpoint', 'ip']
});

// ============================================
// 📊 Middleware for HTTP metrics
// ============================================
function metricsMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const route = req.route?.path || req.path;

      // Record HTTP metrics
      httpRequestDuration
        .labels(req.method, route, res.statusCode)
        .observe(duration);

      httpRequestsTotal
        .labels(req.method, route, res.statusCode)
        .inc();

      // Track errors
      if (res.statusCode >= 400) {
        errorCount
          .labels(`${res.statusCode}`, route)
          .inc();
      }

      // Track rate limit
      if (res.statusCode === 429) {
        rateLimit
          .labels(route, req.ip)
          .inc();
      }
    });

    next();
  };
}

// ============================================
// 📊 Metrics Registry Endpoint
// ============================================
function metricsRouter() {
  const express = require('express');
  const router = express.Router();

  router.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', promClient.register.contentType);
      const metrics = await promClient.register.metrics();
      res.end(metrics);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate metrics' });
    }
  });

  return router;
}

module.exports = {
  // Middleware
  metricsMiddleware,
  metricsRouter,

  // HTTP metrics
  httpRequestDuration,
  httpRequestsTotal,

  // Database metrics
  dbQueryDuration,
  dbConnectionPoolSize,
  dbConnectionErrors,

  // Cache metrics
  cacheHits,
  cacheMisses,
  cacheOperationDuration,

  // Auth metrics
  authAttempts,

  // Business metrics
  contractsCreated,
  paymentsProcessed,
  paymentAmount,

  // Error tracking
  errorCount,
  rateLimit
};
