/**
 * Feedback System Migration Runner (Standalone)
 * db/migrate-feedback.js
 * 
 * Applies only the feedback system migration (no external dependencies)
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateFeedback() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();

    console.log('📝 Applying feedback system migration...\n');
    
    // Read the standalone migration
    const migrationPath = path.join(__dirname, 'migrations', '005_feedback_system_standalone.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Created tables and views:');
    console.log('  ✓ feedback_categories');
    console.log('  ✓ feedback_types');
    console.log('  ✓ feedback');
    console.log('  ✓ feedback_responses');
    console.log('  ✓ feedback_attachments');
    console.log('  ✓ feedback_ratings');
    console.log('  ✓ feedback_sentiment_audit');
    console.log('  ✓ feedback_stats_daily');
    console.log('  ✓ feedback_tags');
    console.log('  ✓ vw_feedback_with_details');
    console.log('  ✓ vw_unresolved_feedback');
    console.log('\n🎉 Feedback system ready to use!');

    await client.release();
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) {
      console.error(`   PostgreSQL error code: ${error.code}`);
    }
    process.exit(1);
  }
}

migrateFeedback();
