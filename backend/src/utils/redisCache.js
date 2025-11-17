/**
 * Redis Cache Client
 * Provides caching layer for frequently accessed data
 * Implements automatic invalidation and TTL strategies
 */

const redis = require('redis');
const logger = require('../utils/logger');

let client = null;
let isConnected = false;

// ============================================
// 🔌 Redis Client Configuration
// ============================================
async function initRedis() {
  // Always disable Redis for development
  console.log('⏭️  Redis disabled for development/stability');
  return null;
}

// ============================================
// 💾 Cache Operations
// ============================================

/**
 * Get value from cache
 * @param {string} key
 * @returns {Promise<any>}
 */
async function get(key) {
  if (!client || !isConnected) return null;
  try {
    const data = await client.get(key);
    if (data) {
      console.log(`✅ Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.error(`❌ Cache GET error for ${key}:`, err.message);
    return null;
  }
}

/**
 * Set value in cache with TTL
 * @param {string} key
 * @param {any} value
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 */
async function set(key, value, ttl = 3600) {
  if (!client || !isConnected) return false;
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
    console.log(`✅ Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    console.error(`❌ Cache SET error for ${key}:`, err.message);
    return false;
  }
}

/**
 * Delete cache key
 * @param {string} key
 */
async function del(key) {
  if (!client || !isConnected) return false;
  try {
    await client.del(key);
    console.log(`✅ Cache DELETE: ${key}`);
    return true;
  } catch (err) {
    console.error(`❌ Cache DELETE error for ${key}:`, err.message);
    return false;
  }
}

/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Redis pattern (e.g., "contracts:*")
 */
async function delPattern(pattern) {
  if (!client || !isConnected) return false;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`✅ Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Cache DELETE PATTERN error for ${pattern}:`, err.message);
    return false;
  }
}

/**
 * Flush entire cache
 */
async function flush() {
  if (!client || !isConnected) return false;
  try {
    await client.flushDb();
    console.log('✅ Cache FLUSHED');
    return true;
  } catch (err) {
    console.error('❌ Cache FLUSH error:', err.message);
    return false;
  }
}

/**
 * Get or set cache (compute if not exists)
 * @param {string} key
 * @param {Function} fn - Function to compute value if not in cache
 * @param {number} ttl
 */
async function getOrSet(key, fn, ttl = 3600) {
  const cached = await get(key);
  if (cached) return cached;

  const value = await fn();
  await set(key, value, ttl);
  return value;
}

/**
 * Check if cache is available
 */
function isAvailable() {
  return isConnected;
}

/**
 * Get cache statistics
 */
async function stats() {
  if (!client || !isConnected) return null;
  try {
    const info = await client.info('stats');
    return info;
  } catch (err) {
    console.error('❌ Error getting cache stats:', err.message);
    return null;
  }
}

/**
 * Close Redis connection
 */
async function close() {
  if (client) {
    await client.quit();
    console.log('✅ Redis connection closed');
  }
}

module.exports = {
  initRedis,
  get,
  set,
  del,
  delPattern,
  flush,
  getOrSet,
  isAvailable,
  stats,
  close
};
