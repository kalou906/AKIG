/**
 * Service Prometheus Metrics
 * Métriques pour HTTP, cache, base données, erreurs
 * backend/src/services/metrics.service.js
 */

const prometheus = require('prom-client');

// Enregistrement par défaut
const register = prometheus.register;

/**
 * Métriques HTTP
 */
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000, 5000]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total des requêtes HTTP',
  labelNames: ['method', 'route', 'status_code']
});

/**
 * Métriques Cache
 */
const cacheHits = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total des cache hits',
  labelNames: ['endpoint']
});

const cacheMisses = new prometheus.Counter({
  name: 'cache_misses_total',
  help: 'Total des cache misses',
  labelNames: ['endpoint']
});

const cacheInvalidations = new prometheus.Counter({
  name: 'cache_invalidations_total',
  help: 'Total des invalidations cache',
  labelNames: ['pattern']
});

/**
 * Métriques Compression
 */
const compressionBytesTotal = new prometheus.Counter({
  name: 'compression_bytes_total',
  help: 'Total des bytes compressés',
  labelNames: ['algorithm']
});

/**
 * Métriques Base de Données
 */
const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_ms',
  help: 'Durée des requêtes SQL en millisecondes',
  labelNames: ['operation', 'table'],
  buckets: [1, 10, 50, 100, 500, 1000]
});

const dbErrors = new prometheus.Counter({
  name: 'db_errors_total',
  help: 'Total des erreurs base de données',
  labelNames: ['operation', 'error_type']
});

/**
 * Métriques API
 */
const apiErrors = new prometheus.Counter({
  name: 'api_errors_total',
  help: 'Total des erreurs API',
  labelNames: ['route', 'error_type', 'status_code']
});

const validationErrors = new prometheus.Counter({
  name: 'validation_errors_total',
  help: 'Total des erreurs de validation',
  labelNames: ['field']
});

/**
 * Métriques Auth
 */
const loginAttempts = new prometheus.Counter({
  name: 'login_attempts_total',
  help: 'Total des tentatives de connexion',
  labelNames: ['success']
});

const tokenExpired = new prometheus.Counter({
  name: 'token_expired_total',
  help: 'Total des tokens expirés',
  labelNames: []
});

/**
 * Métriques Business
 */
const impayesCreated = new prometheus.Counter({
  name: 'impayes_created_total',
  help: 'Total des impayes créés',
  labelNames: []
});

const paymentsProcessed = new prometheus.Counter({
  name: 'payments_processed_total',
  help: 'Total des paiements traités',
  labelNames: ['method']
});

const impayesMontantTotal = new prometheus.Gauge({
  name: 'impayes_montant_gnf',
  help: 'Montant total impayés en GNF',
  labelNames: ['status']
});

/**
 * Fonctions helper
 */
const MetricsService = {
  /**
   * Record HTTP request
   */
  recordHttpRequest: (method, route, statusCode, durationMs) => {
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(durationMs);
    
    httpRequestTotal
      .labels(method, route, statusCode)
      .inc();
  },

  /**
   * Record cache hit
   */
  recordCacheHit: (endpoint) => {
    cacheHits.labels(endpoint).inc();
  },

  /**
   * Record cache miss
   */
  recordCacheMiss: (endpoint) => {
    cacheMisses.labels(endpoint).inc();
  },

  /**
   * Record cache invalidation
   */
  recordCacheInvalidation: (pattern) => {
    cacheInvalidations.labels(pattern).inc();
  },

  /**
   * Record database query
   */
  recordDbQuery: (operation, table, durationMs) => {
    dbQueryDuration
      .labels(operation, table)
      .observe(durationMs);
  },

  /**
   * Record database error
   */
  recordDbError: (operation, errorType) => {
    dbErrors.labels(operation, errorType).inc();
  },

  /**
   * Record API error
   */
  recordApiError: (route, errorType, statusCode) => {
    apiErrors.labels(route, errorType, statusCode).inc();
  },

  /**
   * Record validation error
   */
  recordValidationError: (field) => {
    validationErrors.labels(field).inc();
  },

  /**
   * Record login attempt
   */
  recordLoginAttempt: (success) => {
    loginAttempts.labels(success ? 'true' : 'false').inc();
  },

  /**
   * Record token expiration
   */
  recordTokenExpired: () => {
    tokenExpired.labels().inc();
  },

  /**
   * Record compression
   */
  recordCompression: (bytes, algorithm = 'gzip') => {
    compressionBytesTotal.labels(algorithm).inc(bytes);
  },

  /**
   * Record impayé created
   */
  recordImpayeCreated: () => {
    impayesCreated.labels().inc();
  },

  /**
   * Record payment processed
   */
  recordPaymentProcessed: (method) => {
    paymentsProcessed.labels(method).inc();
  },

  /**
   * Update total impayes montant
   */
  updateImpayesMontant: (montant, status = 'total') => {
    impayesMontantTotal.labels(status).set(montant);
  },

  /**
   * Get all metrics
   */
  getMetrics: async () => {
    return await register.metrics();
  },

  /**
   * Get content type
   */
  getContentType: () => {
    return register.contentType;
  }
};

module.exports = MetricsService;
