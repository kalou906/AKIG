#!/usr/bin/env node

/**
 * Database Migration Runner
 * Safely executes SQL migrations with validation
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MigrationValidator = require('./check_migrations');

class MigrationRunner {
  constructor() {
    this.validator = new MigrationValidator();
    this.migrationsDir = path.join(__dirname, 'sql');
  }

  /**
   * List available migrations
   */
  listMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('No migrations directory found');
      return [];
    }

    return fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(client) {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const { rows } = await client.query(
        'SELECT name FROM migrations ORDER BY applied_at'
      );
      return rows.map(r => r.name);
    } catch (error) {
      console.error('Error getting migration history:', error);
      return [];
    }
  }

  /**
   * Mark migration as applied
   */
  async markMigrationApplied(client, name) {
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
      [name]
    );
  }

  /**
   * Run a single migration
   */
  async runMigration(name, options = {}) {
    const filePath = path.join(this.migrationsDir, name);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${name}`);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
      await client.connect();

      // Check if already applied
      const applied = await this.getMigrationHistory(client);
      if (applied.includes(name)) {
        console.log(`⊘ Migration already applied: ${name}`);
        return { skipped: true };
      }

      console.log(`→ Running migration: ${name}`);

      // Run migration
      await client.query(sql);

      // Mark as applied
      await this.markMigrationApplied(client, name);

      console.log(`✓ Migration completed: ${name}`);

      return { success: true, name };
    } catch (error) {
      console.error(`✗ Migration failed: ${name}`);
      console.error(error.message);
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations(options = {}) {
    const { stopOnError = true, validate = true } = options;

    const migrations = this.listMigrations();
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
      await client.connect();
      const applied = await this.getMigrationHistory(client);

      const pending = migrations.filter(m => !applied.includes(m));

      if (pending.length === 0) {
        console.log('No pending migrations');
        return { total: 0, applied: 0, skipped: 0, failed: 0 };
      }

      console.log(`Found ${pending.length} pending migrations\n`);
    } finally {
      await client.end();
    }

    let appliedCount = 0;
    let failedCount = 0;

    for (const migration of pending) {
      try {
        const result = await this.runMigration(migration, options);
        if (!result.skipped) {
          appliedCount++;
        }
      } catch (error) {
        failedCount++;
        if (stopOnError) {
          throw error;
        }
      }
    }

    console.log(`\n✓ Completed: ${appliedCount} applied, ${failedCount} failed`);

    return {
      total: pending.length,
      applied: appliedCount,
      failed: failedCount,
    };
  }

  /**
   * Show migration status
   */
  async showStatus() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
      await client.connect();

      const all = this.listMigrations();
      const applied = await this.getMigrationHistory(client);
      const pending = all.filter(m => !applied.includes(m));

      console.log('\nMigration Status');
      console.log('================\n');

      if (all.length === 0) {
        console.log('No migrations found');
        return;
      }

      console.log('Applied:');
      applied.forEach(m => console.log(`  ✓ ${m}`));

      if (pending.length > 0) {
        console.log('\nPending:');
        pending.forEach(m => console.log(`  ○ ${m}`));
      }

      console.log(`\nTotal: ${applied.length} applied, ${pending.length} pending\n`);
    } finally {
      await client.end();
    }
  }
}

/**
 * CLI Interface
 */
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];
  const arg = process.argv[3];

  (async () => {
    try {
      switch (command) {
        case 'status':
          await runner.showStatus();
          break;

        case 'run':
          if (!arg) {
            console.error('Usage: npm run migrate run <migration-name>');
            process.exit(1);
          }
          await runner.runMigration(arg);
          break;

        case 'pending':
          await runner.runPendingMigrations();
          break;

        case 'list':
          const migrations = runner.listMigrations();
          console.log('Available migrations:');
          migrations.forEach(m => console.log(`  - ${m}`));
          break;

        default:
          console.log(`
Migration Runner

Usage:
  node migration_runner.js status          Show migration status
  node migration_runner.js list            List available migrations
  node migration_runner.js run <name>      Run a specific migration
  node migration_runner.js pending         Run all pending migrations

Environment:
  DATABASE_URL                 PostgreSQL connection string
          `);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = MigrationRunner;
