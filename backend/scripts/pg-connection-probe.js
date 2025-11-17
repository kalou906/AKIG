#!/usr/bin/env node
// Minimal Postgres connection probe to validate real env connectivity
// Usage: node scripts/pg-connection-probe.js [env]
// Loads .env.production by default if NODE_ENV=production, else .env.development

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const argvEnv = process.argv[2];
const nodeEnv = argvEnv || process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development';

const envPath = path.join(__dirname, '..', envFile);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`[probe] Loaded env file: ${envFile}`);
} else {
  dotenv.config();
  console.log('[probe] Loaded default .env');
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[probe] ❌ DATABASE_URL not set');
  process.exit(2);
}
console.log(`[probe] DATABASE_URL host: ${url}`);

const pool = new Pool({ connectionString: url, max: 2 });

(async () => {
  try {
    const start = Date.now();
    const res = await pool.query('SELECT version(), current_database(), now()');
    console.log(`[probe] ✅ Connected in ${Date.now() - start}ms | db=${res.rows[0].current_database}`);

    // Keep connection alive briefly so netstat can see it
    setTimeout(async () => {
      try {
        await pool.end();
        console.log('[probe] Closed pool');
        process.exit(0);
      } catch (e) {
        console.error('[probe] Close error', e);
        process.exit(1);
      }
    }, 8000);
  } catch (e) {
    console.error('[probe] ❌ Connection failed', e.message);
    process.exit(2);
  }
})();
