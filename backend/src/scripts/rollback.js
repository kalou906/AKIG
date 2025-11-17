#!/usr/bin/env node

require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { verifyEnv } = require('../checkEnv');

const MIGRATIONS_TABLE = 'akig_schema_migrations';
const DOWN_DIR = path.resolve(__dirname, '..', 'migrations', 'down');

async function main() {
  try {
    verifyEnv(['DATABASE_URL']);
  } catch (error) {
    console.error('[ROLLBACK] Configuration invalide:', error.message);
    process.exit(1);
  }

  if (!fs.existsSync(DOWN_DIR)) {
    console.error(`[ROLLBACK] Répertoire des scripts de rollback absent: ${DOWN_DIR}`);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const appliedMigrations = await client.query(
      `SELECT name, applied_at FROM ${MIGRATIONS_TABLE} ORDER BY applied_at DESC, id DESC`
    );

    if (appliedMigrations.rowCount === 0) {
      console.log('[ROLLBACK] Aucune migration appliquée. Rien à annuler.');
      return;
    }

    const args = process.argv.slice(2);
    let targetArg = args[0];
    let migrationsToRollback;

    if (!targetArg) {
      migrationsToRollback = [appliedMigrations.rows[0]];
    } else if (targetArg === 'all') {
      migrationsToRollback = appliedMigrations.rows;
    } else {
      const targetIndex = appliedMigrations.rows.findIndex((row) => row.name === targetArg);
      if (targetIndex === -1) {
        console.error(`[ROLLBACK] Migration ${targetArg} introuvable dans l'historique.`);
        process.exit(1);
      }
      migrationsToRollback = appliedMigrations.rows.slice(0, targetIndex + 1);
    }

    console.log('[ROLLBACK] Migrations à annuler:', migrationsToRollback.map((row) => row.name).join(', '));

    for (const migration of migrationsToRollback) {
      const downFile = migration.name.replace(/\.sql$/, '.down.sql');
      const downPath = path.join(DOWN_DIR, downFile);

      if (!fs.existsSync(downPath)) {
        console.error(`[ROLLBACK] Script de rollback manquant: ${downFile}`);
        process.exit(1);
      }

      const downSql = fs.readFileSync(downPath, 'utf8');
      console.log(`[ROLLBACK] ➤ Annulation de ${migration.name}...`);

      try {
        await client.query('BEGIN');
        await client.query(downSql);
        await client.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`, [migration.name]);
        await client.query('COMMIT');
        console.log(`[ROLLBACK] ✅ ${migration.name} annulée.`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[ROLLBACK] ❌ Échec de ${migration.name}:`, error.message);
        process.exit(1);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[ROLLBACK] Erreur inattendue:', error.message);
  process.exit(1);
});
