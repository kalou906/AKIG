const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Database Migration Validator
 * Checks data integrity before and after migrations
 */

class MigrationValidator {
  constructor(connectionString = process.env.DATABASE_URL) {
    this.connectionString = connectionString;
  }

  /**
   * Count rows in a table
   */
  async countTable(client, table) {
    try {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS c FROM ${table}`
      );
      return rows[0].c;
    } catch (error) {
      console.warn(`Warning: Could not count ${table}:`, error.message);
      return null;
    }
  }

  /**
   * Get table structure
   */
  async getTableStructure(client, table) {
    try {
      const { rows } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      return rows;
    } catch (error) {
      console.warn(`Warning: Could not get structure for ${table}:`, error.message);
      return [];
    }
  }

  /**
   * Get constraint status
   */
  async getConstraints(client) {
    try {
      const { rows } = await client.query(`
        SELECT conname, contype, convalidated
        FROM pg_constraint
        WHERE contype IN ('c', 'f', 'u', 'p')
        ORDER BY conname
      `);
      return rows;
    } catch (error) {
      console.warn('Warning: Could not get constraints:', error.message);
      return [];
    }
  }

  /**
   * Get index status
   */
  async getIndexes(client) {
    try {
      const { rows } = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY indexname
      `);
      return rows;
    } catch (error) {
      console.warn('Warning: Could not get indexes:', error.message);
      return [];
    }
  }

  /**
   * Check for invalid constraints
   */
  async validateConstraints(client) {
    try {
      const { rows } = await client.query(`
        SELECT conname
        FROM pg_constraint
        WHERE convalidated = false AND contype IN ('c', 'f', 'u')
      `);
      return rows.length === 0;
    } catch (error) {
      console.warn('Warning: Could not validate constraints:', error.message);
      return true;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(client) {
    try {
      const tableStats = await client.query(`
        SELECT schemaname, tablename, n_live_tup as row_count
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

      return {
        timestamp: new Date().toISOString(),
        tables: tableStats.rows,
      };
    } catch (error) {
      console.warn('Warning: Could not get database stats:', error.message);
      return { timestamp: new Date().toISOString(), tables: [] };
    }
  }

  /**
   * Take pre-migration snapshot
   */
  async snapshotBefore(tables = []) {
    const client = new Client({ connectionString: this.connectionString });

    try {
      await client.connect();

      const snapshot = {
        timestamp: new Date().toISOString(),
        tables: {},
        constraints: await this.getConstraints(client),
        indexes: await this.getIndexes(client),
        stats: await this.getDatabaseStats(client),
      };

      // Count rows in specified tables
      for (const table of tables) {
        snapshot.tables[table] = {
          count: await this.countTable(client, table),
          structure: await this.getTableStructure(client, table),
        };
      }

      console.log('✓ Pre-migration snapshot taken');
      return snapshot;
    } finally {
      await client.end();
    }
  }

  /**
   * Take post-migration snapshot
   */
  async snapshotAfter(tables = []) {
    const client = new Client({ connectionString: this.connectionString });

    try {
      await client.connect();

      const snapshot = {
        timestamp: new Date().toISOString(),
        tables: {},
        constraints: await this.getConstraints(client),
        indexes: await this.getIndexes(client),
        stats: await this.getDatabaseStats(client),
      };

      // Count rows in specified tables
      for (const table of tables) {
        snapshot.tables[table] = {
          count: await this.countTable(client, table),
          structure: await this.getTableStructure(client, table),
        };
      }

      console.log('✓ Post-migration snapshot taken');
      return snapshot;
    } finally {
      await client.end();
    }
  }

  /**
   * Validate data integrity
   */
  validate(before, after, options = {}) {
    const {
      allowTableCreation = true,
      allowColumnAddition = true,
      allowRowChanges = false,
      allowConstraintModification = false,
    } = options;

    const issues = [];
    const warnings = [];

    // Check table counts
    for (const table of Object.keys(before.tables)) {
      const beforeCount = before.tables[table].count;
      const afterCount = after.tables[table]?.count;

      if (afterCount === null) {
        if (!allowTableCreation) {
          issues.push(`Table ${table} not found after migration`);
        } else {
          warnings.push(`Table ${table} was dropped`);
        }
      } else if (beforeCount !== afterCount && !allowRowChanges) {
        issues.push(
          `Table ${table}: row count changed from ${beforeCount} to ${afterCount}`
        );
      }
    }

    // Check for invalid constraints
    const invalidConstraints = after.constraints.filter(c => !c.convalidated);
    if (invalidConstraints.length > 0 && !allowConstraintModification) {
      issues.push(
        `Found ${invalidConstraints.length} unvalidated constraints: ${invalidConstraints.map(c => c.conname).join(', ')}`
      );
    }

    return { valid: issues.length === 0, issues, warnings };
  }

  /**
   * Run migration with validation
   */
  async runWithValidation(migrationFn, tables = [], options = {}) {
    console.log('Starting migration with validation...\n');

    // Take pre-migration snapshot
    const before = await this.snapshotBefore(tables);
    console.log(`Pre-migration state: ${JSON.stringify(before.tables, null, 2)}\n`);

    try {
      // Execute migration
      console.log('Executing migration...');
      await migrationFn();
      console.log('✓ Migration completed\n');
    } catch (error) {
      console.error('✗ Migration failed:', error.message);
      throw error;
    }

    // Take post-migration snapshot
    const after = await this.snapshotAfter(tables);
    console.log(`Post-migration state: ${JSON.stringify(after.tables, null, 2)}\n`);

    // Validate
    const result = this.validate(before, after, options);

    if (result.valid) {
      console.log('✓ Migration validation passed');
    } else {
      console.error('✗ Migration validation failed:');
      result.issues.forEach(issue => console.error(`  - ${issue}`));
    }

    if (result.warnings.length > 0) {
      console.warn('⚠ Migration warnings:');
      result.warnings.forEach(warn => console.warn(`  - ${warn}`));
    }

    return result;
  }
}

/**
 * Example usage and CLI
 */
if (require.main === module) {
  const validator = new MigrationValidator();

  // Example: Validate a migration
  (async () => {
    try {
      // Define tables to monitor
      const tableNames = ['users', 'invoices', 'contracts'];

      // Define your migration function
      const migration = async () => {
        // Example: Add a column to users table
        const client = new Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        
        try {
          // Your migration SQL here
          // await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50)');
          console.log('Migration SQL executed');
        } finally {
          await client.end();
        }
      };

      // Run with validation
      const result = await validator.runWithValidation(migration, tableNames, {
        allowRowChanges: false,
        allowTableCreation: false,
        allowConstraintModification: false,
      });

      process.exit(result.valid ? 0 : 1);
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = MigrationValidator;
