/**
 * Prometheus Metrics Instrumentation
 * Fixes: Missing metrics endpoint (P2)
 */

const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP Request Counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP Request Duration
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Business Metrics
const paymentTotal = new client.Counter({
  name: 'akig_payments_total',
  help: 'Total payments received',
  labelNames: ['method', 'status'],
  registers: [register],
});

const revenueGauge = new client.Gauge({
  name: 'akig_revenue_gnf',
  help: 'Current total revenue in GNF',
  registers: [register],
});

const overduePaymentsGauge = new client.Gauge({
  name: 'akig_overdue_payments_count',
  help: 'Number of overdue payments',
  registers: [register],
});

const activeTenantsGauge = new client.Gauge({
  name: 'akig_active_tenants_count',
  help: 'Number of active tenants',
  registers: [register],
});

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
};

// Expose metrics endpoint
const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  paymentTotal,
  revenueGauge,
  overduePaymentsGauge,
  activeTenantsGauge,
};
