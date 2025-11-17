/**
 * Middleware Prometheus Metrics
 * Enregistre métriques HTTP automatiquement
 * backend/src/middleware/prometheus.middleware.js
 */

const MetricsService = require('../services/metrics.service');

/**
 * Middleware pour enregistrer les métriques HTTP
 */
function prometheusMiddleware() {
  return (req, res, next) => {
    const start = Date.now();
    
    // Intercepter la réponse
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route?.path || req.path || 'unknown';
      
      // Enregistrer la métrique
      MetricsService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration
      );
    });
    
    next();
  };
}

/**
 * Route pour exposer les métriques Prometheus
 */
function setupMetricsRoute(app) {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', MetricsService.getContentType());
      const metrics = await MetricsService.getMetrics();
      res.end(metrics);
    } catch (error) {
      res.status(500).end(error);
    }
  });
}

module.exports = {
  prometheusMiddleware,
  setupMetricsRoute
};
