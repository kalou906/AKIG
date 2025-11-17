const { exit } = require('process');
const { randomUUID } = require('crypto');

let cachedConfig = null;

/**
 * Parse a comma-separated or JSON-based feature flag string into a normalized map
 * @param {string} raw
 */
function parseFeatureFlags(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error('[ENV] FEATURE_FLAGS doit être une chaîne non vide.');
  }

  const trimmed = raw.trim();
  let parsed;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      throw new Error(`[ENV] Impossible de parser FEATURE_FLAGS en JSON valide: ${error.message}`);
    }
  } else {
    parsed = trimmed.split(',').map((flag) => flag.trim()).filter(Boolean);
  }

  const flags = new Map();

  if (Array.isArray(parsed)) {
    parsed.forEach((flag) => {
      if (typeof flag !== 'string' || flag.trim() === '') {
        throw new Error('[ENV] Chaque feature flag doit être une chaîne non vide.');
      }
      flags.set(flag.trim(), true);
    });
  } else if (parsed && typeof parsed === 'object') {
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof key !== 'string' || key.trim() === '') {
        throw new Error('[ENV] Les clés de feature flag doivent être des chaînes non vides.');
      }
      flags.set(key.trim(), Boolean(value));
    });
  } else {
    throw new Error('[ENV] FEATURE_FLAGS doit être un tableau ou un objet JSON.');
  }

  if (flags.size === 0) {
    throw new Error('[ENV] Aucun feature flag actif. Renseignez au moins un flag.');
  }

  return flags;
}

function assertNonEmpty(key, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`[ENV] La variable ${key} est obligatoire et ne peut pas être vide.`);
  }
  return value.trim();
}

function buildEnvironmentConfig() {
  const requiredKeys = ['APP_ENV', 'DATABASE_URL', 'FEATURE_FLAGS', 'JWT_SECRET'];
  const missing = requiredKeys.filter((key) => !process.env[key] || process.env[key].trim() === '');

  if (missing.length > 0) {
    missing.forEach((key) => {
      console.error(`[ENV] Variable manquante: ${key}`);
    });
    throw new Error(`[ENV] Configuration invalide. Variables manquantes: ${missing.join(', ')}`);
  }

  const featureFlags = parseFeatureFlags(process.env.FEATURE_FLAGS);

  const config = {
    appEnv: assertNonEmpty('APP_ENV', process.env.APP_ENV),
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    apiVersion: assertNonEmpty('API_VERSION', process.env.API_VERSION || '1.0.0'),
    databaseUrl: assertNonEmpty('DATABASE_URL', process.env.DATABASE_URL),
    jwtSecret: assertNonEmpty('JWT_SECRET', process.env.JWT_SECRET),
    corsOrigin: assertNonEmpty('CORS_ORIGIN', process.env.CORS_ORIGIN || 'http://localhost:3000'),
    featureFlags,
    rawFeatureFlags: Array.from(featureFlags.entries()).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: Boolean(value),
    }), {}),
  };

  return config;
}

function getEnvironmentConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = buildEnvironmentConfig();
    return cachedConfig;
  } catch (error) {
    console.error('[ENV] Échec de la validation de configuration:', error.message);
    exit(1);
  }
}

function getRequestId(req) {
  if (req && req.headers && req.headers['x-request-id']) {
    return String(req.headers['x-request-id']);
  }
  return randomUUID();
}

module.exports = {
  getEnvironmentConfig,
  parseFeatureFlags,
  getRequestId,
};
