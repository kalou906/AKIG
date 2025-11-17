/**
 * Logout Service
 * 
 * Handles:
 * - Session invalidation
 * - Token blacklisting
 * - Audit logging
 * - User notifications
 * - Security cleanup
 */

const pool = require('../db');

class LogoutService {
  /**
   * Perform logout and invalidate session
   * 
   * @param {string} userId - User ID from token
   * @param {string} tokenId - JWT token ID (jti claim)
   * @param {object} logoutData - Additional logout info
   * @returns {Promise<object>} - Logout result
   */
  static async logout(userId, tokenId, logoutData = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Check if user exists and is active
      const userQuery = await client.query(
        'SELECT id, email, nom, statut FROM users WHERE id = $1',
        [userId]
      );

      if (userQuery.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userQuery.rows[0];

      // 2. Invalidate the current token by adding to blacklist
      if (tokenId) {
        await client.query(
          `INSERT INTO token_blacklist (token_id, user_id, revoked_at, reason, ip_address)
           VALUES ($1, $2, NOW(), $3, $4)
           ON CONFLICT (token_id) DO NOTHING`,
          [tokenId, userId, 'user_logout', logoutData.ip_address || 'unknown']
        );
      }

      // 3. Get current session info (if stored)
      const sessionQuery = await client.query(
        `SELECT id, created_at, last_activity 
         FROM user_sessions 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      const sessionId = sessionQuery.rows.length > 0 ? sessionQuery.rows[0].id : null;

      // 4. Mark session as inactive
      if (sessionId) {
        await client.query(
          `UPDATE user_sessions 
           SET is_active = false, logged_out_at = NOW()
           WHERE id = $1`,
          [sessionId]
        );
      }

      // 5. Log audit event
      const auditLog = {
        action: 'user_logout',
        user_id: userId,
        timestamp: new Date().toISOString(),
        details: {
          reason: logoutData.logout_reason || 'user_initiated',
          ip_address: logoutData.ip_address || 'unknown',
          user_agent: logoutData.user_agent || 'unknown',
          session_duration_minutes: sessionQuery.rows.length > 0 
            ? Math.round((new Date() - new Date(sessionQuery.rows[0].created_at)) / 60000)
            : 0
        }
      };

      await client.query(
        `INSERT INTO audit_logs 
         (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          'logout',
          'user_session',
          sessionId || 'system',
          JSON.stringify(auditLog.details),
          logoutData.ip_address || 'unknown',
          logoutData.user_agent || 'unknown'
        ]
      );

      // 6. Optional: Invalidate all tokens for "logout everywhere"
      if (logoutData.logout_all_devices) {
        await client.query(
          `INSERT INTO token_blacklist (user_id, revoked_at, reason)
           SELECT $1, NOW(), 'user_logout_all_devices'
           FROM token_blacklist
           WHERE user_id = $1`,
          [userId]
        );
      }

      // 7. Log security event
      await client.query(
        `INSERT INTO security_logs (user_id, event_type, event_details, severity)
         VALUES ($1, $2, $3, $4)`,
        [
          userId,
          'logout',
          JSON.stringify({
            reason: logoutData.logout_reason || 'user_initiated',
            session_id: sessionId,
            timestamp: new Date().toISOString()
          }),
          'info'
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Logout successful',
        data: {
          user_id: userId,
          email: user.email,
          logout_time: new Date().toISOString(),
          session_ended: true,
          tokens_invalidated: 1,
          all_devices_logout: logoutData.logout_all_devices || false
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[LogoutService] Logout error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify if token is blacklisted
   * 
   * @param {string} tokenId - JWT token ID (jti claim)
   * @returns {Promise<boolean>} - True if blacklisted
   */
  static async isTokenBlacklisted(tokenId) {
    try {
      const result = await pool.query(
        'SELECT id FROM token_blacklist WHERE token_id = $1',
        [tokenId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('[LogoutService] Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user
   * 
   * @param {string} userId - User ID
   * @param {string} reason - Reason for invalidation
   * @returns {Promise<object>} - Result
   */
  static async invalidateAllUserSessions(userId, reason = 'admin_action') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Mark all active sessions as inactive
      const result = await client.query(
        `UPDATE user_sessions 
         SET is_active = false, logged_out_at = NOW()
         WHERE user_id = $1 AND is_active = true
         RETURNING id`,
        [userId]
      );

      const sessionsInvalidated = result.rows.length;

      // Log audit event
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, changes)
         VALUES ($1, $2, $3, $4)`,
        [
          userId,
          'invalidate_all_sessions',
          'user_sessions',
          JSON.stringify({ sessions_invalidated: sessionsInvalidated, reason })
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        sessions_invalidated: sessionsInvalidated,
        reason: reason
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[LogoutService] Error invalidating sessions:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's active sessions
   * 
   * @param {string} userId - User ID
   * @returns {Promise<array>} - List of active sessions
   */
  static async getActiveSessions(userId) {
    try {
      const result = await pool.query(
        `SELECT id, ip_address, user_agent, created_at, last_activity, device_type
         FROM user_sessions
         WHERE user_id = $1 AND is_active = true
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('[LogoutService] Error fetching sessions:', error);
      throw error;
    }
  }

  /**
   * Clean up old blacklisted tokens
   * 
   * @param {number} daysOld - Delete tokens older than N days
   * @returns {Promise<number>} - Number of deleted tokens
   */
  static async cleanupOldBlacklistedTokens(daysOld = 90) {
    try {
      const result = await pool.query(
        `DELETE FROM token_blacklist
         WHERE revoked_at < NOW() - INTERVAL '1 day' * $1
         RETURNING id`,
        [daysOld]
      );
      
      console.log(`[LogoutService] Cleaned up ${result.rows.length} old blacklisted tokens`);
      return result.rows.length;
    } catch (error) {
      console.error('[LogoutService] Error cleaning up tokens:', error);
      throw error;
    }
  }

  /**
   * Get logout statistics
   * 
   * @param {object} filters - Filter options (date_from, date_to, user_id)
   * @returns {Promise<object>} - Logout statistics
   */
  static async getLogoutStats(filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_logouts,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(EXTRACT(EPOCH FROM (logged_out_at - created_at))/60) as avg_session_minutes,
          MAX(logged_out_at) as last_logout
        FROM user_sessions
        WHERE logged_out_at IS NOT NULL
      `;

      const params = [];

      if (filters.date_from) {
        query += ` AND logged_out_at >= $${params.length + 1}`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ` AND logged_out_at <= $${params.length + 1}`;
        params.push(filters.date_to);
      }

      if (filters.user_id) {
        query += ` AND user_id = $${params.length + 1}`;
        params.push(filters.user_id);
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('[LogoutService] Error fetching logout stats:', error);
      throw error;
    }
  }
}

module.exports = LogoutService;
