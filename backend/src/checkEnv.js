#!/usr/bin/env node

const REQUIRED_KEYS = ['PORT', 'DATABASE_URL', 'JWT_SECRET'];

function verifyEnv(requiredKeys = REQUIRED_KEYS) {
  const missing = requiredKeys.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    missing.forEach((key) => {
      console.error(`❌ Manque: ${key}`);
    });
    throw new Error(`Configuration incomplète. Variables manquantes: ${missing.join(', ')}`);
  }

  return true;
}

if (require.main === module) {
  try {
    verifyEnv();
    console.log('✅ Variables d\'environnement critiques présentes.');
  } catch (error) {
    console.error(`[ENV] ${error.message}`);
    process.exit(1);
  }
}

module.exports = { verifyEnv };
