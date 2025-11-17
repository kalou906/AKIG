/**
 * ============================================================
 * src/config/envValidator.js - Validation des variables d'env
 * Fail-fast: refuse le démarrage si config critique manque
 * ============================================================
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'NODE_ENV',
  'CORS_ORIGIN',
];

const OPTIONAL_VARS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMS_PROVIDER',
  'SMS_ACCOUNT_SID',
  'SMS_AUTH_TOKEN',
  'REDIS_URL',
  'SENTRY_DSN',
];

/**
 * Valider que toutes les variables critiques sont présentes
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Vérifier variables requises
  REQUIRED_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Vérifier variables optionnelles
  OPTIONAL_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Vérifier JWT_SECRET longueur (min 32 chars en prod)
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET?.length < 32) {
    missing.push('JWT_SECRET (trop court, min 32 chars en production)');
  }

  // Vérifier DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgres')) {
    missing.push('DATABASE_URL (doit commencer par postgres://)');
  }

  // FAIL-FAST: si variables critiques manquent
  if (missing.length > 0) {
    console.error('❌ ERREUR CONFIGURATION: Variables critiques manquantes:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\n📖 Copier .env.example en .env et configurer les valeurs.');
    console.error('🚫 Démarrage refusé.\n');
    process.exit(1);
  }

  // WARNINGS: si variables optionnelles manquent
  if (warnings.length > 0) {
    console.warn('⚠️  AVERTISSEMENT: Variables optionnelles non configurées:');
    warnings.forEach((v) => console.warn(`   - ${v}`));
    console.warn('   (SMS/Email peuvent ne pas fonctionner)\n');
  }

  // Afficher config chargée
  console.log('✅ Configuration d\'environnement validée:');
  console.log(`   Node Env: ${process.env.NODE_ENV}`);
  console.log(`   Port: ${process.env.PORT}`);
  console.log(`   Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[1] || 'inconnu'}`);
  console.log(`   CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`   Feature Flags: ${process.env.FEATURE_FLAGS || 'aucun'}\n`);

  return {
    isValid: missing.length === 0,
    missingVars: missing,
    warnings,
  };
}

module.exports = { validateEnv, REQUIRED_VARS, OPTIONAL_VARS };
