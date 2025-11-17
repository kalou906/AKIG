/**
 * Complete Database Initialization Script
 * db/init-all.js
 * 
 * Create database and run all migrations in order
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS = [
  '001_user_preferences.sql',
  '002_security_policies.sql',
  '003_feature_flags.sql',
  '004_audit_immutable.sql',
  '005_feedback_system.sql',
];

async function runAllMigrations() {
  // First, create database if needed
  const defaultPool = new Pool({
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'akig2025',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
  });

  try {
    console.log('🔌 Connecting to PostgreSQL server...\n');
    const client = await defaultPool.connect();

    // Check if database exists
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'akig'"
    );

    if (dbCheckResult.rows.length === 0) {
      console.log('📦 Creating database "akig"...');
      await client.query('CREATE DATABASE akig;');
      console.log('✅ Database "akig" created\n');
    } else {
      console.log('✅ Database "akig" already exists\n');
    }

    await client.release();
    await defaultPool.end();

    // Now run all migrations
    const akigPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const dbClient = await akigPool.connect();

    try {
      for (const migrationFile of MIGRATIONS) {
        const migrationPath = path.join(__dirname, 'migrations', migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
          console.warn(`⚠️  Migration not found: ${migrationFile}`);
          continue;
        }

        console.log(`📝 Running migration: ${migrationFile}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await dbClient.query(sql);
          console.log(`✅ ${migrationFile} completed\n`);
        } catch (error) {
          if (error.code === '42P07' || error.code === '23505') {
            // Table already exists or duplicate key
            console.log(`⏭️  ${migrationFile} already applied (skipping)\n`);
          } else {
            throw error;
          }
        }
      }

      console.log('🎉 All migrations completed successfully!\n');
      console.log('📊 System initialized with:');
      console.log('  ✓ User preferences');
      console.log('  ✓ Security policies');
      console.log('  ✓ Feature flags');
      console.log('  ✓ Audit immutability');
      console.log('  ✓ Feedback system');

    } finally {
      await dbClient.release();
      await akigPool.end();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runAllMigrations();
