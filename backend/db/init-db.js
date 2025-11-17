/**
 * Database Initialization Script
 * db/init-db.js
 * 
 * Create the database if it doesn't exist, then run migrations
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  // Connect to default postgres database
  const defaultPool = new Pool({
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'akig2025',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default database
  });

  try {
    console.log('🔌 Connecting to PostgreSQL server...');
    const client = await defaultPool.connect();

    // Check if database exists
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'akig'"
    );

    if (dbCheckResult.rows.length === 0) {
      console.log('📦 Creating database "akig"...');
      await client.query('CREATE DATABASE akig;');
      console.log('✅ Database "akig" created');
    } else {
      console.log('✅ Database "akig" already exists');
    }

    await client.release();
    await defaultPool.end();

    // Now connect to the akig database and run migrations
    console.log('\n📝 Running migrations...');
    const akigPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const akigClient = await akigPool.connect();

    try {
      // Read and execute migration
      const migrationPath = path.join(__dirname, 'migrations', '005_feedback_system.sql');
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log('⚙️  Executing feedback system migration...');
      await akigClient.query(sql);

      console.log('✅ Migration completed successfully!');
      console.log('\n📊 Created tables:');
      console.log('  ✓ feedback_categories');
      console.log('  ✓ feedback_types');
      console.log('  ✓ feedback');
      console.log('  ✓ feedback_responses');
      console.log('  ✓ feedback_attachments');
      console.log('  ✓ feedback_ratings');
      console.log('  ✓ feedback_sentiment_audit');
      console.log('  ✓ feedback_stats_daily');
      console.log('  ✓ feedback_tags');
      console.log('\n🎉 Database initialization complete!');

    } finally {
      await akigClient.release();
      await akigPool.end();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '3D000') {
      console.error('   Database does not exist. Check your PostgreSQL connection.');
    }
    process.exit(1);
  }
}

initializeDatabase();
