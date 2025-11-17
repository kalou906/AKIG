/**
 * Query Optimization Utilities
 * Helps identify and fix N+1 queries and optimize performance
 */

const pool = require('../db');
const metrics = require('./metrics');

// ============================================
// 📊 Query Analyzer
// ============================================
class QueryAnalyzer {
  constructor() {
    this.queries = [];
    this.startTime = null;
  }

  start() {
    this.startTime = Date.now();
    this.queries = [];
  }

  recordQuery(sql, params, duration) {
    this.queries.push({
      sql,
      params,
      duration,
      timestamp: Date.now()
    });
  }

  getReport() {
    const total = this.queries.reduce((sum, q) => sum + q.duration, 0);
    const slowQueries = this.queries.filter(q => q.duration > 100);
    const similarQueries = this.identifySimilarQueries();

    return {
      totalQueries: this.queries.length,
      totalDuration: total,
      averageDuration: total / this.queries.length,
      slowQueries: slowQueries.length,
      potentialN1: similarQueries.length > 1 ? similarQueries : [],
      queries: this.queries
    };
  }

  identifySimilarQueries() {
    const patterns = {};
    this.queries.forEach(q => {
      const pattern = q.sql.replace(/\d+/g, '?'); // Normalize numbers
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    return Object.entries(patterns)
      .filter(([_, count]) => count > 3) // More than 3 similar queries
      .map(([pattern, count]) => ({ pattern, count }));
  }
}

// ============================================
// 🔧 Query Optimization Strategies
// ============================================

/**
 * Batch load related data instead of N+1 queries
 * Example: Load all user contracts at once instead of one per user
 */
async function batchLoad(ids, table, foreignKey, selectColumns = '*') {
  if (ids.length === 0) return [];

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const query = `SELECT ${selectColumns} FROM ${table} WHERE ${foreignKey} IN (${placeholders})`;

  const result = await pool.query(query, ids);
  return result.rows;
}

/**
 * Use dataloader pattern for deferred loading
 */
class DataLoader {
  constructor(batchFn) {
    this.batchFn = batchFn;
    this.cache = new Map();
    this.queue = [];
  }

  async load(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    this.queue.push(id);

    // Defer batch loading to next tick
    return new Promise((resolve) => {
      setImmediate(async () => {
        const results = await this.batchFn(this.queue);
        results.forEach((result, index) => {
          this.cache.set(this.queue[index], result);
        });

        resolve(this.cache.get(id));
        this.queue = [];
      });
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// ============================================
// ✅ Common Optimized Queries
// ============================================

/**
 * Get contracts with user and status efficiently
 */
async function getContractsOptimized(userId = null, status = null) {
  let query = `
    SELECT 
      c.id, c.title, c.description, c.status, c.created_at,
      u.id as user_id, u.name, u.email
    FROM contracts c
    JOIN users u ON c.user_id = u.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (userId) {
    query += ` AND c.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  if (status) {
    query += ` AND c.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  query += ` ORDER BY c.created_at DESC LIMIT 100`;

  const start = Date.now();
  const result = await pool.query(query, params);
  const duration = Date.now() - start;

  // Record metric
  metrics.dbQueryDuration
    .labels('SELECT', 'contracts')
    .observe(duration);

  return result.rows;
}

/**
 * Get payments with contract details efficiently
 */
async function getPaymentsOptimized(contractId = null, userId = null) {
  let query = `
    SELECT 
      p.id, p.amount, p.status, p.created_at,
      c.id as contract_id, c.title as contract_title,
      u.id as user_id, u.name, u.email
    FROM payments p
    JOIN contracts c ON p.contract_id = c.id
    JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (contractId) {
    query += ` AND p.contract_id = $${paramIndex}`;
    params.push(contractId);
    paramIndex++;
  }

  if (userId) {
    query += ` AND p.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  query += ` ORDER BY p.created_at DESC LIMIT 100`;

  const start = Date.now();
  const result = await pool.query(query, params);
  const duration = Date.now() - start;

  // Record metric
  metrics.dbQueryDuration
    .labels('SELECT', 'payments')
    .observe(duration);

  return result.rows;
}

/**
 * Get user with all related data (contracts, payments, permissions)
 */
async function getUserWithDetailsOptimized(userId) {
  const query = `
    SELECT 
      u.id, u.email, u.name, u.role, u.created_at,
      json_agg(DISTINCT c.*) as contracts,
      json_agg(DISTINCT p.*) as payments,
      json_agg(DISTINCT pr.name) as permissions
    FROM users u
    LEFT JOIN contracts c ON u.id = c.user_id
    LEFT JOIN payments p ON u.id = p.user_id
    LEFT JOIN role_permissions rp ON u.id = rp.role_id
    LEFT JOIN permissions pr ON rp.permission_id = pr.id
    WHERE u.id = $1
    GROUP BY u.id
  `;

  const start = Date.now();
  const result = await pool.query(query, [userId]);
  const duration = Date.now() - start;

  // Record metric
  metrics.dbQueryDuration
    .labels('SELECT', 'users')
    .observe(duration);

  return result.rows[0];
}

// ============================================
// 📈 Performance Tips
// ============================================

/**
 * ANALYZE query execution plan
 */
async function explainQuery(query, params = []) {
  const result = await pool.query(`EXPLAIN ANALYZE ${query}`, params);
  console.log('📊 Query Plan:');
  result.rows.forEach(row => console.log(row['QUERY PLAN']));
  return result.rows;
}

/**
 * Find slow queries
 */
async function findSlowQueries(minDuration = 1000) {
  const query = `
    SELECT query, calls, total_time, mean_time 
    FROM pg_stat_statements 
    WHERE mean_time > $1 
    ORDER BY mean_time DESC 
    LIMIT 10
  `;

  const result = await pool.query(query, [minDuration]);
  return result.rows;
}

module.exports = {
  QueryAnalyzer,
  DataLoader,
  batchLoad,
  getContractsOptimized,
  getPaymentsOptimized,
  getUserWithDetailsOptimized,
  explainQuery,
  findSlowQueries
};
