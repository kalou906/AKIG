const pool = require('./db');

/**
 * Execute a query with error handling and logging
 */
const query = async (text, params = []) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.DEBUG_SQL === 'true') {
      console.log('Query executed successfully', {
        text: text.substring(0, 100),
        duration,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      text: text.substring(0, 100),
      params,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get a single row from query
 */
const queryOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows[0] || null;
};

/**
 * Get multiple rows from query
 */
const queryMany = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows;
};

/**
 * Execute INSERT and return inserted row
 */
const insert = async (table, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  const text = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  return queryOne(text, values);
};

/**
 * Execute UPDATE and return updated row
 */
const update = async (table, data, where) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const whereClause = whereKeys
    .map((key, i) => `${key} = $${keys.length + i + 1}`)
    .join(' AND ');
  
  const text = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *
  `;
  
  return queryOne(text, [...values, ...whereValues]);
};

/**
 * Execute DELETE
 */
const deleteRecord = async (table, where) => {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  const whereClause = whereKeys
    .map((key, i) => `${key} = $${i + 1}`)
    .join(' AND ');
  
  const text = `DELETE FROM ${table} WHERE ${whereClause}`;
  
  const result = await query(text, whereValues);
  return result.rowCount;
};

/**
 * Get database connection statistics
 */
const getPoolStats = () => {
  return {
    size: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
};

/**
 * Check database connection health
 */
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return {
      healthy: true,
      timestamp: result.rows[0].now,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
};

/**
 * Transaction support
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  queryOne,
  queryMany,
  insert,
  update,
  deleteRecord,
  getPoolStats,
  healthCheck,
  transaction,
  pool,
};
