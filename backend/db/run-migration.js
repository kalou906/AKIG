/**
 * Migration Runner for Feedback System
 * db/run-migration.js
 * 
 * Execute the feedback system migration
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('📦 Starting feedback system migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '005_feedback_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Created tables:');
    console.log('  - feedback_categories');
    console.log('  - feedback_types');
    console.log('  - feedback');
    console.log('  - feedback_responses');
    console.log('  - feedback_attachments');
    console.log('  - feedback_ratings');
    console.log('  - feedback_sentiment_audit');
    console.log('  - feedback_stats_daily');
    console.log('  - feedback_tags');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigration();
