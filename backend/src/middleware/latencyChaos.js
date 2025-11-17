/**
 * Latency Chaos Middleware
 * 
 * Injects random latency into requests for chaos engineering testing.
 * Helps identify and fix performance issues and timeout problems.
 * 
 * Environment Variables:
 * - CHAOS_ENABLED: Enable/disable chaos injection (default: false)
 * - CHAOS_LATENCY_MS: Fixed latency in milliseconds
 * - CHAOS_LATENCY_MIN_MS: Minimum random latency
 * - CHAOS_LATENCY_MAX_MS: Maximum random latency
 * - CHAOS_ERROR_RATE: Probability of injecting errors (0-1)
 * - CHAOS_ROUTES: Comma-separated routes to target (optional)
 * - CHAOS_EXCLUDED_ROUTES: Comma-separated routes to exclude (optional)
 * - CHAOS_VERBOSE: Enable verbose logging (default: false)
 */

const { trace } = require('@opentelemetry/api');
const logger = require('../services/logger');

const tracer = trace.getTracer('chaos-latency');

/**
 * Generate random latency within specified range
 * @param {number} min - Minimum latency in ms
 * @param {number} max - Maximum latency in ms
 * @returns {number} Random latency value
 */
function getRandomLatency(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if route should be targeted by chaos injection
 * @param {string} path - Request path
 * @param {string[]} targetRoutes - Routes to target (if empty, target all)
 * @param {string[]} excludedRoutes - Routes to exclude
 * @returns {boolean} Whether to apply chaos
 */
function shouldApplyChaos(path, targetRoutes = [], excludedRoutes = []) {
  // Check if route is in excluded list
  if (excludedRoutes.some(route => path.startsWith(route))) {
    return false;
  }

  // If target routes specified, only apply to those
  if (targetRoutes.length > 0) {
    return targetRoutes.some(route => path.startsWith(route));
  }

  // Apply to all routes by default
  return true;
}

/**
 * Main latency chaos middleware with OpenTelemetry integration
 * Supports fixed, random, and probabilistic latency injection
 */
function latencyChaos(req, res, next) {
  // Vérifier si le chaos est activé
  const chaosEnabled = process.env.CHAOS_LATENCY_ENABLED !== 'false';
  
  if (!chaosEnabled) {
    return next();
  }

  // Vérifier les chemins exclus
  const excludePaths = (process.env.CHAOS_LATENCY_EXCLUDE_PATHS || '/api/health,/metrics')
    .split(',')
    .map(p => p.trim())
    .filter(p => p);

  if (excludePaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Calculer la latence à injecter
  let latencyMs = 0;

  if (process.env.CHAOS_LATENCY_MS) {
    // Latence fixe
    latencyMs = Number(process.env.CHAOS_LATENCY_MS);
  } else if (process.env.CHAOS_LATENCY_MIN && process.env.CHAOS_LATENCY_MAX) {
    // Latence aléatoire entre min et max
    const min = Number(process.env.CHAOS_LATENCY_MIN);
    const max = Number(process.env.CHAOS_LATENCY_MAX);
    latencyMs = getRandomLatency(min, max);
  } else {
    // Pas de latence configurée
    return next();
  }

  // Vérifier la probabilité d'injection
  const probability = Number(process.env.CHAOS_LATENCY_PROBABILITY || '1.0');
  
  if (Math.random() > probability) {
    return next();
  }

  // Créer un span OpenTelemetry
  const span = tracer.startSpan('chaos.latency', {
    attributes: {
      'chaos.type': 'latency',
      'chaos.latency_ms': latencyMs,
      'http.method': req.method,
      'http.url': req.url,
      'http.target': req.path,
    },
  });

  // Enregistrer le log
  const logLevel = latencyMs > 5000 ? 'warn' : 'debug';
  logger[logLevel]('Latency chaos injection', {
    method: req.method,
    path: req.path,
    latency_ms: Math.round(latencyMs),
    probability,
    request_id: req.id,
  });

  // Ajouter des headers pour tracking
  res.setHeader('X-Chaos-Latency-Injected', Math.round(latencyMs));
  res.setHeader('X-Chaos-Request-Id', span.spanContext().spanId);

  // Injecter la latence
  const startTime = Date.now();
  
  return setTimeout(() => {
    const actualLatency = Date.now() - startTime;
    
    // Mettre à jour le span avec la latence réelle
    span.addEvent('latency_injected', {
      'latency.requested_ms': latencyMs,
      'latency.actual_ms': actualLatency,
    });

    // Wrapper du next pour capturer la fin de la requête
    const originalSend = res.send;
    
    res.send = function(data) {
      span.end();
      return originalSend.call(this, data);
    };

    const originalJson = res.json;
    
    res.json = function(data) {
      span.end();
      return originalJson.call(this, data);
    };

    next();
  }, latencyMs);
}

/**
 * Chaos profiles for easy configuration
 */
const CHAOS_PROFILES = {
  none: {
    enabled: false
  },
  low: {
    min: 50,
    max: 100,
    probability: 0.5
  },
  medium: {
    min: 100,
    max: 300,
    probability: 0.7
  },
  high: {
    min: 500,
    max: 1000,
    probability: 0.9
  },
  extreme: {
    min: 1000,
    max: 5000,
    probability: 1.0
  },
  payment_stress: {
    min: 200,
    max: 800,
    probability: 0.8,
    targetPaths: ['/api/payments']
  }
};

/**
 * Fonction utilitaire pour obtenir la configuration actuelle
 * @returns {Object} Configuration de latency chaos
 */
function getChaosConfig() {
  return {
    enabled: process.env.CHAOS_LATENCY_ENABLED !== 'false',
    fixed_latency_ms: process.env.CHAOS_LATENCY_MS 
      ? Number(process.env.CHAOS_LATENCY_MS) 
      : null,
    min_latency_ms: process.env.CHAOS_LATENCY_MIN 
      ? Number(process.env.CHAOS_LATENCY_MIN) 
      : null,
    max_latency_ms: process.env.CHAOS_LATENCY_MAX 
      ? Number(process.env.CHAOS_LATENCY_MAX)
      : null,
    probability: Number(process.env.CHAOS_LATENCY_PROBABILITY || '1.0'),
    excluded_paths: (process.env.CHAOS_LATENCY_EXCLUDE_PATHS || '/api/health').split(','),
  };
}

module.exports = latencyChaos;
module.exports.getChaosConfig = getChaosConfig;
module.exports.getRandomLatency = getRandomLatency;
module.exports.shouldApplyChaos = shouldApplyChaos;
module.exports.CHAOS_PROFILES = CHAOS_PROFILES;
