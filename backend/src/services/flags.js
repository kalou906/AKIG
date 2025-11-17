/**
 * Feature Flags Service
 * Manages feature flag evaluation, caching, and usage tracking
 * Supports scope-based targeting (user, tenant, agency)
 */

const { trace } = require('@opentelemetry/api');
const logger = require('./logger');

const tracer = trace.getTracer('feature-flags');

/**
 * Check if a feature flag is enabled for a specific context
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {string} key - Feature flag key
 * @param {Object} context - Context object with user_id, tenant_id, agency_id
 * @returns {Promise<boolean>} - Whether feature is enabled
 */
async function isEnabled(pool, key, context = {}) {
  const span = tracer.startSpan('flags.isEnabled');

  try {
    span.setAttributes({
      'flag.key': key,
      'context.user_id': context.user_id,
      'context.tenant_id': context.tenant_id,
      'context.agency_id': context.agency_id,
    });

    // Query the database for the feature flag
    const { rows } = await pool.query(
      `SELECT id, enabled, scope FROM feature_flags WHERE key = $1`,
      [key]
    );

    if (!rows.length) {
      logger.warn('Feature flag not found', { flag_key: key });
      span.addEvent('flag_not_found');
      return false;
    }

    const flag = rows[0];

    // Check if globally disabled
    if (!flag.enabled) {
      logger.debug('Feature flag disabled', { flag_key: key });
      span.addEvent('flag_disabled');
      return false;
    }

    // Check scope restrictions
    if (flag.scope && Object.keys(flag.scope).length > 0) {
      // User scope check
      if (context.user_id && flag.scope.users) {
        if (!flag.scope.users.includes(context.user_id)) {
          logger.debug('User not in flag scope', {
            flag_key: key,
            user_id: context.user_id,
          });
          span.addEvent('user_not_in_scope');
          return false;
        }
      }

      // Tenant scope check
      if (context.tenant_id && flag.scope.tenants) {
        if (!flag.scope.tenants.includes(context.tenant_id)) {
          logger.debug('Tenant not in flag scope', {
            flag_key: key,
            tenant_id: context.tenant_id,
          });
          span.addEvent('tenant_not_in_scope');
          return false;
        }
      }

      // Agency scope check
      if (context.agency_id && flag.scope.agencies) {
        if (!flag.scope.agencies.includes(context.agency_id)) {
          logger.debug('Agency not in flag scope', {
            flag_key: key,
            agency_id: context.agency_id,
          });
          span.addEvent('agency_not_in_scope');
          return false;
        }
      }

      // Percentage rollout check
      if (flag.scope.rollout_percentage !== undefined) {
        const percentage = flag.scope.rollout_percentage;
        const userId = context.user_id || context.tenant_id || 0;
        const hash = Math.abs(hashCode(`${key}:${userId}`)) % 100;

        if (hash >= percentage) {
          logger.debug('User not in rollout percentage', {
            flag_key: key,
            user_id: context.user_id,
            hash,
            percentage,
          });
          span.addEvent('not_in_rollout_percentage');
          return false;
        }
      }
    }

    // Record usage
    recordFlagUsage(pool, flag.id, context.user_id, true).catch((err) => {
      logger.error('Error recording flag usage', {
        flag_key: key,
        error: err.message,
      });
    });

    span.addEvent('flag_enabled');
    return true;
  } catch (error) {
    logger.error('Error checking feature flag', {
      flag_key: key,
      error: error.message,
    });
    span.recordException(error);
    return false;
  } finally {
    span.end();
  }
}

/**
 * Get all enabled features for a user
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} - Array of enabled feature keys
 */
async function getEnabledFeaturesForUser(pool, userId) {
  const span = tracer.startSpan('flags.getEnabledFeaturesForUser');

  try {
    span.setAttributes({
      'user.id': userId,
    });

    const { rows } = await pool.query(
      `SELECT key FROM feature_flags 
       WHERE enabled = true 
       AND (scope IS NULL OR scope = '{}'::jsonb OR scope->'users' ? $1::text)`,
      [userId.toString()]
    );

    const features = rows.map((r) => r.key);
    span.addEvent('features_retrieved', {
      'features.count': features.length,
    });

    return features;
  } catch (error) {
    logger.error('Error fetching enabled features', {
      user_id: userId,
      error: error.message,
    });
    span.recordException(error);
    return [];
  } finally {
    span.end();
  }
}

/**
 * Create a new feature flag
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {Object} flag - Flag object {key, enabled, scope, description}
 * @param {number} userId - Creator user ID
 * @returns {Promise<Object>} - Created flag
 */
async function createFlag(pool, flag, userId) {
  const span = tracer.startSpan('flags.createFlag');

  try {
    span.setAttributes({
      'flag.key': flag.key,
      'flag.enabled': flag.enabled,
      'user.id': userId,
    });

    const { rows } = await pool.query(
      `INSERT INTO feature_flags (key, enabled, scope, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, key, enabled, scope, description, created_at`,
      [flag.key, flag.enabled || false, flag.scope || {}, flag.description, userId]
    );

    logger.info('Feature flag created', {
      flag_key: flag.key,
      flag_id: rows[0].id,
      created_by: userId,
    });

    span.addEvent('flag_created', { 'flag.id': rows[0].id });
    return rows[0];
  } catch (error) {
    logger.error('Error creating feature flag', {
      flag_key: flag.key,
      error: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Update a feature flag
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {string} key - Flag key
 * @param {Object} updates - Fields to update {enabled, scope, description}
 * @param {number} userId - Modifier user ID
 * @returns {Promise<Object>} - Updated flag
 */
async function updateFlag(pool, key, updates, userId) {
  const span = tracer.startSpan('flags.updateFlag');

  try {
    span.setAttributes({
      'flag.key': key,
      'user.id': userId,
    });

    // Get current flag for audit
    const current = await pool.query(
      `SELECT * FROM feature_flags WHERE key = $1`,
      [key]
    );

    if (!current.rows.length) {
      throw new Error(`Feature flag '${key}' not found`);
    }

    // Update flag
    const { rows } = await pool.query(
      `UPDATE feature_flags 
       SET enabled = COALESCE($1, enabled),
           scope = COALESCE($2, scope),
           description = COALESCE($3, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE key = $4
       RETURNING id, key, enabled, scope, description, updated_at`,
      [updates.enabled, updates.scope, updates.description, key]
    );

    logger.info('Feature flag updated', {
      flag_key: key,
      changes: Object.keys(updates),
      updated_by: userId,
    });

    span.addEvent('flag_updated');
    return rows[0];
  } catch (error) {
    logger.error('Error updating feature flag', {
      flag_key: key,
      error: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Delete a feature flag
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {string} key - Flag key
 * @param {number} userId - Deleter user ID
 * @returns {Promise<boolean>} - Whether deletion succeeded
 */
async function deleteFlag(pool, key, userId) {
  const span = tracer.startSpan('flags.deleteFlag');

  try {
    span.setAttributes({
      'flag.key': key,
      'user.id': userId,
    });

    const { rowCount } = await pool.query(`DELETE FROM feature_flags WHERE key = $1`, [key]);

    if (rowCount > 0) {
      logger.info('Feature flag deleted', {
        flag_key: key,
        deleted_by: userId,
      });
      span.addEvent('flag_deleted');
      return true;
    }

    logger.warn('Feature flag not found for deletion', { flag_key: key });
    return false;
  } catch (error) {
    logger.error('Error deleting feature flag', {
      flag_key: key,
      error: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Get feature flag usage statistics
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {string} key - Flag key
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Object>} - Usage statistics
 */
async function getFlagUsage(pool, key, days = 7) {
  const span = tracer.startSpan('flags.getFlagUsage');

  try {
    span.setAttributes({
      'flag.key': key,
      'period.days': days,
    });

    const { rows } = await pool.query(
      `SELECT 
         COUNT(*) as total_accesses,
         SUM(CASE WHEN result = true THEN 1 ELSE 0 END) as successful,
         SUM(CASE WHEN result = false THEN 1 ELSE 0 END) as failed,
         COUNT(DISTINCT user_id) as unique_users,
         MIN(accessed_at) as first_access,
         MAX(accessed_at) as last_access
       FROM feature_flag_usage
       WHERE flag_id = (SELECT id FROM feature_flags WHERE key = $1)
       AND accessed_at >= NOW() - INTERVAL '1 day' * $2`,
      [key, days]
    );

    const stats = rows[0] || {
      total_accesses: 0,
      successful: 0,
      failed: 0,
      unique_users: 0,
      first_access: null,
      last_access: null,
    };

    span.addEvent('usage_retrieved', {
      'stats.total_accesses': parseInt(stats.total_accesses),
    });

    return stats;
  } catch (error) {
    logger.error('Error fetching flag usage', {
      flag_key: key,
      error: error.message,
    });
    span.recordException(error);
    return {
      total_accesses: 0,
      successful: 0,
      failed: 0,
      unique_users: 0,
    };
  } finally {
    span.end();
  }
}

/**
 * Record feature flag usage
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} flagId - Flag ID
 * @param {number} userId - User ID (optional)
 * @param {boolean} result - Whether feature worked (default: true)
 * @returns {Promise<void>}
 */
async function recordFlagUsage(pool, flagId, userId = null, result = true) {
  try {
    await pool.query(
      `INSERT INTO feature_flag_usage (flag_id, user_id, result)
       VALUES ($1, $2, $3)`,
      [flagId, userId, result]
    );
  } catch (error) {
    logger.error('Error recording flag usage', {
      flag_id: flagId,
      error: error.message,
    });
  }
}

/**
 * Simple hash function for rollout percentage
 * @param {string} str - String to hash
 * @returns {number} - Hash value
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

module.exports = {
  isEnabled,
  getEnabledFeaturesForUser,
  createFlag,
  updateFlag,
  deleteFlag,
  getFlagUsage,
  recordFlagUsage,
};
