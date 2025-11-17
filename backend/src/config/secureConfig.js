/**
 * Configuration sécurisée centralisée
 * Toutes les variables sensibles passent par ce fichier
 * JAMAIS hardcoder de secrets en production
 */

const requiredEnvVars = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
];

const optionalEnvVars = {
  JWT_REFRESH_SECRET: 'akig-refresh-key-default',
  JWT_EXPIRY: '24h',
  JWT_REFRESH_EXPIRY: '7d',
  LOG_LEVEL: 'info',
  CORS_ORIGIN: 'http://localhost:3000',
  DISABLE_REDIS: 'true',
  FEATURE_FLAGS: 'payments,sms,dashboard',
  TZ: 'UTC',
  NODE_ENV: 'development',
};

/**
 * Valider et récupérer config sécurisée
 */
function getSecureConfig() {
  const config = {};

  // Vérifier variables requises
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      throw new Error(
        `❌ VARIABLE D'ENVIRONNEMENT MANQUANTE: ${key}\n` +
        `Définissez-la dans .env ou comme variable d'environnement système.\n` +
        `Ne jamais committer de secrets dans le code source.`
      );
    }
    config[key] = process.env[key];
  }

  // Ajouter optionnelles avec défauts
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    config[key] = process.env[key] || defaultValue;
  }

  // Validations supplémentaires
  if (config.JWT_SECRET.length < 32) {
    throw new Error(
      `❌ JWT_SECRET doit faire au moins 32 caractères (longueur actuelle: ${config.JWT_SECRET.length})`
    );
  }

  if (config.NODE_ENV !== 'production' && config.JWT_SECRET.includes('key')) {
    console.warn(
      '⚠️  ATTENTION : JWT_SECRET semble être un défaut en développement. ' +
      'Changez-le en production !'
    );
  }

  return config;
}

module.exports = {
  getSecureConfig,
  requiredEnvVars,
  optionalEnvVars,
};
