#!/usr/bin/env node

require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const { verifyEnv } = require('../checkEnv');
const { runMigrations } = require('./runMigrations');

process.env.PORT = process.env.PORT || '4000';

(async () => {
  try {
    verifyEnv();
    await runMigrations({ silent: false, skipIfMissingDb: false });
    require('../index.js');
  } catch (error) {
    console.error('[START] Démarrage interrompu:', error.message);
    process.exit(1);
  }
})();
