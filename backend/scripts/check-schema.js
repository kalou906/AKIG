#!/usr/bin/env node
const pool = require('../src/db');

async function checkSchema() {
  try {
    const tables = ['contracts', 'payments', 'users', 'roles', 'permissions', 'properties', 'tenants', 'role_permissions'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\n📋 Table: ${table} (${result.rows.length} columns)`);
      result.rows.forEach(row => {
        console.log(`   • ${row.column_name.padEnd(20)} ${row.data_type}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
