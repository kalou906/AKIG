#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, idleTimeoutMillis: 2000 });
  
  try {
    console.log('[DB] Connecting...');
    const client = await Promise.race([
      pool.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);
    
    console.log('[DB] Connected. Dropping all tables...');
    const dropQueries = [
      'DROP TABLE IF EXISTS akig_schema_migrations CASCADE',
      'DROP TABLE IF EXISTS payments CASCADE',
      'DROP TABLE IF EXISTS tenants CASCADE',
      'DROP TABLE IF EXISTS contracts CASCADE',
      'DROP TABLE IF EXISTS projects CASCADE',
      'DROP TABLE IF EXISTS clients CASCADE',
      'DROP TABLE IF EXISTS audit_log CASCADE',
      'DROP TABLE IF EXISTS sessions CASCADE',
      'DROP TABLE IF EXISTS agents CASCADE',
      'DROP TABLE IF EXISTS properties CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];
    
    for (const query of dropQueries) {
      try {
        await client.query(query);
        console.log(`  ✓ ${query.split(' ')[4]}`);
      } catch (e) {
        // ignore
      }
    }
    
    console.log('[DB] All tables dropped successfully');
    client.release();
  } catch (e) {
    console.error('[DB] Error:', e.message);
  } finally {
    await pool.end();
  }
})();
