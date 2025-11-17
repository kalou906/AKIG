/**
 * API Token Middleware
 * Handles verification, validation, and audit logging of API tokens
 * Supports scope-based access control and token expiration
 */

const crypto = require('crypto');
const { validationResult } = require('express-validator');

/**
 * Hash an API token using SHA-256
 * @param {string} token - Raw token to hash
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a new API token
 * Format: akig_<random_32_chars>
 * @returns {object} { token, hash }
 */
function generateToken() {
  const randomPart = crypto.randomBytes(24).toString('hex');
  const token = `akig_${randomPart}`;
  const hash = hashToken(token);
  return { token, hash };
}

/**
 * Verify API token and check scopes
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {string} token - Raw API token
 * @param {string[]} scopesNeeded - Required scopes
 * @returns {Promise<object|null>} Token object or null if invalid
 */
async function verifyToken(pool, token, scopesNeeded = []) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const tokenHash = hashToken(token.trim());

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, scopes, created_at, expires_at, last_used_at, name
       FROM api_tokens 
       WHERE token = $1 
       AND revoked = false 
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [tokenHash]
    );

    if (!rows.length) {
      return null;
    }

    const tokenRecord = rows[0];

    // Verify scopes
    if (scopesNeeded && scopesNeeded.length > 0) {
      const hasAllScopes = scopesNeeded.every(scope =>
        tokenRecord.scopes.includes(scope)
      );

      if (!hasAllScopes) {
        return null;
      }
    }

    return tokenRecord;
  } catch (error) {
    console.error('Error verifying API token:', error.message);
    return null;
  }
}

/**
 * Middleware to extract and verify API token from headers
 * @param {string[]} scopesNeeded - Required scopes (optional)
 * @returns {Function} Express middleware
 */
function requireApiToken(scopesNeeded = []) {
  return async (req, res, next) => {
    try {
      const token = (req.headers['x-api-token'] || '').trim();

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing API token in X-API-Token header'
        });
      }

      const pool = req.app.get('db');
      if (!pool) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Database not configured'
        });
      }

      const tokenRecord = await verifyToken(pool, token, scopesNeeded);

      if (!tokenRecord) {
        // Log failed attempt
        await logTokenAudit(pool, null, 'rejected', {
          reason: 'invalid_token',
          scopes_needed: scopesNeeded
        }).catch(err => console.error('Audit log error:', err));

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid or expired API token'
        });
      }

      // Update last_used_at and log successful use
      await pool.query(
        `UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1`,
        [tokenRecord.id]
      );

      await logTokenAudit(pool, tokenRecord.id, 'used', {
        user_id: tokenRecord.user_id,
        scopes: tokenRecord.scopes,
        endpoint: req.path,
        method: req.method
      }).catch(err => console.error('Audit log error:', err));

      // Attach token info to request
      req.apiToken = {
        id: tokenRecord.id,
        userId: tokenRecord.user_id,
        scopes: tokenRecord.scopes,
        name: tokenRecord.name,
        createdAt: tokenRecord.created_at,
        lastUsedAt: tokenRecord.last_used_at,
        expiresAt: tokenRecord.expires_at
      };

      next();
    } catch (error) {
      console.error('API token middleware error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Token verification failed'
      });
    }
  };
}

/**
 * Middleware to require specific scopes
 * @param {string[]} scopesRequired - Required scopes
 * @returns {Function} Express middleware
 */
function requireScopes(scopesRequired = []) {
  return (req, res, next) => {
    if (!req.apiToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API token required'
      });
    }

    const hasAllScopes = scopesRequired.every(scope =>
      req.apiToken.scopes.includes(scope)
    );

    if (!hasAllScopes) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required scopes: ${scopesRequired.join(', ')}`,
        availableScopes: req.apiToken.scopes
      });
    }

    next();
  };
}

/**
 * Log API token activity to audit table
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} tokenId - API token ID
 * @param {string} action - Action type (created, used, revoked, rotated)
 * @param {object} details - Additional details (JSON)
 * @returns {Promise<object>} Audit log record
 */
async function logTokenAudit(pool, tokenId, action, details = {}) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO api_token_audit_log (api_token_id, action, details, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, api_token_id, action, created_at`,
      [tokenId, action, JSON.stringify(details)]
    );

    return rows[0];
  } catch (error) {
    console.error('Error logging token audit:', error.message);
    throw error;
  }
}

/**
 * Create a new API token for a user
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string[]} scopes - Token scopes
 * @param {object} options - Additional options
 * @returns {Promise<object>} { token, tokenRecord }
 */
async function createApiToken(pool, userId, scopes, options = {}) {
  const { name, expiresIn = null } = options;

  // Validate scopes
  const validScopes = [
    'read',
    'write',
    'admin',
    'payments',
    'exports',
    'contracts',
    'notifications'
  ];

  const invalidScopes = scopes.filter(s => !validScopes.includes(s));
  if (invalidScopes.length > 0) {
    throw new Error(
      `Invalid scopes: ${invalidScopes.join(', ')}. Valid scopes: ${validScopes.join(', ')}`
    );
  }

  const { token, hash } = generateToken();

  let expiresAt = null;
  if (expiresIn) {
    const expireMs = parseTimeToMs(expiresIn);
    expiresAt = new Date(Date.now() + expireMs);
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO api_tokens (user_id, token, scopes, name, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, scopes, name, created_at, expires_at`,
      [userId, hash, scopes, name || null, expiresAt]
    );

    const tokenRecord = rows[0];

    // Log token creation
    await logTokenAudit(pool, tokenRecord.id, 'created', {
      user_id: userId,
      scopes,
      name,
      expires_in: expiresIn
    });

    return {
      token, // Raw token (show only once)
      tokenRecord
    };
  } catch (error) {
    console.error('Error creating API token:', error.message);
    throw error;
  }
}

/**
 * Revoke an API token
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} tokenId - Token ID to revoke
 * @param {string} reason - Reason for revocation
 * @returns {Promise<boolean>} Success status
 */
async function revokeApiToken(pool, tokenId, reason = 'Manual revocation') {
  try {
    const result = await pool.query(
      `UPDATE api_tokens 
       SET revoked = true, revoked_at = NOW(), revoked_reason = $2
       WHERE id = $1`,
      [tokenId, reason]
    );

    if (result.rowCount > 0) {
      // Log revocation
      await logTokenAudit(pool, tokenId, 'revoked', { reason });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error revoking API token:', error.message);
    throw error;
  }
}

/**
 * List active API tokens for a user
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @returns {Promise<array>} Array of active tokens
 */
async function getUserTokens(pool, userId) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, scopes, created_at, last_used_at, expires_at
       FROM api_tokens
       WHERE user_id = $1 AND revoked = false
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows;
  } catch (error) {
    console.error('Error fetching user tokens:', error.message);
    throw error;
  }
}

/**
 * Get token audit history
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} tokenId - Token ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<array>} Audit log entries
 */
async function getTokenAuditLog(pool, tokenId, limit = 50) {
  try {
    const { rows } = await pool.query(
      `SELECT id, api_token_id, action, details, created_at
       FROM api_token_audit_log
       WHERE api_token_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [tokenId, limit]
    );

    return rows;
  } catch (error) {
    console.error('Error fetching audit log:', error.message);
    throw error;
  }
}

/**
 * Parse time string to milliseconds
 * @param {string} timeStr - Time string (e.g., "30d", "1h", "60s")
 * @returns {number} Milliseconds
 */
function parseTimeToMs(timeStr) {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(
      'Invalid time format. Use: 30s, 5m, 24h, 30d'
    );
  }

  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
}

/**
 * Middleware to optionally use API token (doesn't fail if missing)
 * @returns {Function} Express middleware
 */
function optionalApiToken() {
  return async (req, res, next) => {
    try {
      const token = (req.headers['x-api-token'] || '').trim();

      if (!token) {
        return next();
      }

      const pool = req.app.get('db');
      if (!pool) {
        return next();
      }

      const tokenRecord = await verifyToken(pool, token);

      if (tokenRecord) {
        req.apiToken = {
          id: tokenRecord.id,
          userId: tokenRecord.user_id,
          scopes: tokenRecord.scopes,
          name: tokenRecord.name,
          createdAt: tokenRecord.created_at,
          lastUsedAt: tokenRecord.last_used_at,
          expiresAt: tokenRecord.expires_at
        };
      }

      next();
    } catch (error) {
      console.error('Optional API token middleware error:', error);
      next();
    }
  };
}

module.exports = {
  hashToken,
  generateToken,
  verifyToken,
  requireApiToken,
  requireScopes,
  optionalApiToken,
  createApiToken,
  revokeApiToken,
  getUserTokens,
  getTokenAuditLog,
  logTokenAudit,
  parseTimeToMs
};
