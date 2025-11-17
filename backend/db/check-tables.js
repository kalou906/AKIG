/**
 * Check existing tables
 * db/check-tables.js
 */

require('dotenv').config();
const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();

    // Check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Existing tables in "akig" database:\n');
    
    if (result.rows.length === 0) {
      console.log('   (none - database is empty)');
    } else {
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

    console.log('\n');

    await client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
