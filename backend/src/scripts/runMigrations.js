#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { Pool } = require('pg');
const { verifyEnv } = require('../checkEnv');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');
const MIGRATIONS_TABLE = 'akig_schema_migrations';

async function runMigrations(options = {}) {
  const { silent = false, skipIfMissingDb = false } = options;

  require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

  try {
    verifyEnv(['DATABASE_URL']);
  } catch (error) {
    if (skipIfMissingDb) {
      if (!silent) {
        console.warn('[MIGRATION] DATABASE_URL absent. Aucune migration exécutée.');
      }
      return;
    }
    throw error;
  }

  const connectionString = process.env.DATABASE_URL;

  const pool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 5_000 });

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    if (!silent) {
      console.log('[MIGRATION] Aucun répertoire de migrations trouvé.');
    }
    await pool.end();
    return;
  }

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    if (!silent) {
      console.log('[MIGRATION] Aucun fichier SQL trouvé.');
    }
    await pool.end();
    return;
  }

  const client = await pool.connect();

  try {
    await client.query(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (\n      id SERIAL PRIMARY KEY,\n      name TEXT UNIQUE NOT NULL,\n      checksum TEXT NOT NULL,\n      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n    )`);
  } finally {
    client.release();
  }

  const appliedMigrations = await pool.query(`SELECT name, checksum FROM ${MIGRATIONS_TABLE}`);
  const applied = new Map(appliedMigrations.rows.map((row) => [row.name, row.checksum]));

  for (const fileName of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, fileName);
    const sql = fs.readFileSync(filePath, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');

    if (applied.has(fileName)) {
      const previousChecksum = applied.get(fileName);
      if (previousChecksum !== checksum) {
        throw new Error(`La migration ${fileName} a déjà été appliquée mais le contenu a changé.`);
      }
      if (!silent) {
        console.log(`[MIGRATION] ${fileName} déjà appliquée.`);
      }
      continue;
    }

    const migrationClient = await pool.connect();
    try {
      if (!silent) {
        console.log(`[MIGRATION] Application de ${fileName}…`);
      }
      await migrationClient.query('BEGIN');
      await migrationClient.query(sql);
      await migrationClient.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name, checksum) VALUES ($1, $2)`,
        [fileName, checksum]
      );
      await migrationClient.query('COMMIT');
      if (!silent) {
        console.log(`[MIGRATION] ${fileName} appliquée avec succès.`);
      }
    } catch (error) {
      await migrationClient.query('ROLLBACK');
      console.error(`[MIGRATION] Échec de ${fileName}:`, error.message);
      throw error;
    } finally {
      migrationClient.release();
    }
  }

  await pool.end();

  if (!silent) {
    console.log('[MIGRATION] Toutes les migrations sont à jour.');
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('[MIGRATION] Arrêt du processus:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigrations };
