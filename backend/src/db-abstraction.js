// ============================================================
// Database Abstraction Layer - Support PostgreSQL & SQLite
// ============================================================

const postgres = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let dbConnection = null;
let isPostgres = false;

/**
 * Initialize database connection
 * Tries PostgreSQL first, falls back to SQLite
 */
async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && databaseUrl.startsWith('postgresql')) {
    try {
      console.log('[DB] Attempting PostgreSQL connection...');
      const pool = new postgres.Pool({ connectionString: databaseUrl });
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('[DB] ✓ PostgreSQL connected successfully');
      isPostgres = true;
      return pool;
    } catch (error) {
      console.warn('[DB] PostgreSQL connection failed:', error.message);
      console.log('[DB] Falling back to SQLite...');
    }
  }
  
  // Fallback to SQLite
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '..', 'data', 'akig.db');
    console.log('[DB] Using SQLite at:', dbPath);
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('[DB] ✓ SQLite connected successfully');
        isPostgres = false;
        initializeSQLiteSchema(db);
        resolve(db);
      }
    });
  });
}

/**
 * Initialize SQLite schema for development
 */
function initializeSQLiteSchema(db) {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Contracts table
    db.run(`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        amount DECIMAL(10, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        contract_id TEXT,
        amount DECIMAL(10, 2),
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES contracts(id)
      )
    `);

    console.log('[DB] ✓ SQLite schema initialized');
  });
}

/**
 * Execute query - works with both PostgreSQL and SQLite
 */
async function query(sql, params = []) {
  if (isPostgres) {
    const result = await dbConnection.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount
    };
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      if (sql.toUpperCase().startsWith('SELECT')) {
        dbConnection.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows: rows || [], rowCount: (rows || []).length });
        });
      } else {
        dbConnection.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ rows: [], rowCount: this.changes });
        });
      }
    });
  }
}

/**
 * Get a single row
 */
async function getOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

/**
 * Get all rows
 */
async function getAll(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

module.exports = {
  initializeDatabase,
  query,
  getOne,
  getAll,
  isPostgres: () => isPostgres
};
