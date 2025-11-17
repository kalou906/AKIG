/**
 * Developer Portal Routes
 * Handles API token management and developer-focused endpoints
 * Includes token creation, revocation, and audit logging
 */

const router = require('express').Router();
const { body, validationResult, param } = require('express-validator');
const {
  requireApiToken,
  requireScopes,
  optionalApiToken,
  createApiToken,
  revokeApiToken,
  getUserTokens,
  getTokenAuditLog,
  parseTimeToMs
} = require('../middleware/apiToken');
const { requireAuth } = require('../middleware/auth');
const { sanitizeBody, sanitizeQuery } = require('../middleware/security');

/**
 * GET /dev/me
 * Get current authenticated user info
 * Supports both session auth and API token auth
 */
router.get('/dev/me', optionalApiToken(), async (req, res) => {
  try {
    // Determine which auth method was used
    let userId;
    let authMethod;

    if (req.apiToken) {
      userId = req.apiToken.userId;
      authMethod = 'api_token';
    } else if (req.user) {
      userId = req.user.id;
      authMethod = 'session';
    } else {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const pool = req.app.get('db');
    const { rows } = await pool.query(
      `SELECT id, email, name, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      authMethod,
      apiToken: req.apiToken ? {
        name: req.apiToken.name,
        scopes: req.apiToken.scopes,
        createdAt: req.apiToken.createdAt,
        expiresAt: req.apiToken.expiresAt
      } : null
    });
  } catch (error) {
    console.error('GET /dev/me error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user info'
    });
  }
});

/**
 * GET /dev/tokens
 * List all API tokens for the authenticated user
 */
router.get(
  '/dev/tokens',
  requireAuth,
  async (req, res) => {
    try {
      const pool = req.app.get('db');

      const { rows } = await pool.query(
        `SELECT id, name, scopes, created_at, last_used_at, expires_at,
                CASE 
                  WHEN last_used_at IS NULL THEN 'Never'
                  WHEN last_used_at > NOW() - INTERVAL '1 day' THEN 'Today'
                  WHEN last_used_at > NOW() - INTERVAL '7 days' THEN 'This week'
                  WHEN last_used_at > NOW() - INTERVAL '30 days' THEN 'This month'
                  ELSE 'Over a month ago'
                END AS last_used
         FROM api_tokens
         WHERE user_id = $1 AND revoked = false
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json({
        tokens: rows.map(t => ({
          id: t.id,
          name: t.name,
          scopes: t.scopes,
          createdAt: t.created_at,
          lastUsedAt: t.last_used_at,
          lastUsed: t.last_used,
          expiresAt: t.expires_at,
          isExpired: t.expires_at && new Date(t.expires_at) < new Date()
        })),
        total: rows.length
      });
    } catch (error) {
      console.error('GET /dev/tokens error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list tokens'
      });
    }
  }
);

/**
 * POST /dev/tokens
 * Create a new API token
 * Body: { name, scopes, expiresIn }
 */
router.post(
  '/dev/tokens',
  requireAuth,
  sanitizeBody(),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Token name must be 1-255 characters'),
    body('scopes')
      .isArray({ min: 1 })
      .withMessage('Scopes must be an array with at least one item')
      .custom(scopes => {
        const validScopes = [
          'read',
          'write',
          'admin',
          'payments',
          'exports',
          'contracts',
          'notifications'
        ];
        return scopes.every(s => validScopes.includes(s));
      })
      .withMessage(
        'Invalid scope. Valid scopes: read, write, admin, payments, exports, contracts, notifications'
      ),
    body('expiresIn')
      .optional()
      .trim()
      .matches(/^\d+[smhd]$/)
      .withMessage('expiresIn format: 30s, 5m, 24h, 30d')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const pool = req.app.get('db');
      const { name, scopes, expiresIn } = req.body;

      // Create new token
      const { token, tokenRecord } = await createApiToken(
        pool,
        req.user.id,
        scopes,
        {
          name: name || 'Unnamed Token',
          expiresIn
        }
      );

      res.status(201).json({
        message: 'Token created successfully',
        token: {
          id: tokenRecord.id,
          name: tokenRecord.name,
          scopes: tokenRecord.scopes,
          createdAt: tokenRecord.created_at,
          expiresAt: tokenRecord.expires_at,
          // WARNING: Token is shown only once
          value: token,
          warning: 'Save this token somewhere safe. You will not be able to see it again.'
        }
      });
    } catch (error) {
      console.error('POST /dev/tokens error:', error);

      if (error.message.includes('Invalid scopes')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create token'
      });
    }
  }
);

/**
 * GET /dev/tokens/:tokenId
 * Get details about a specific token
 */
router.get(
  '/dev/tokens/:tokenId',
  requireAuth,
  param('tokenId').isInt().toInt(),
  async (req, res) => {
    try {
      const pool = req.app.get('db');
      const { tokenId } = req.params;

      const { rows } = await pool.query(
        `SELECT id, user_id, name, scopes, created_at, last_used_at, expires_at, revoked
         FROM api_tokens
         WHERE id = $1`,
        [tokenId]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Token not found'
        });
      }

      const token = rows[0];

      // Verify ownership
      if (token.user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this token'
        });
      }

      res.json({
        id: token.id,
        name: token.name,
        scopes: token.scopes,
        createdAt: token.created_at,
        lastUsedAt: token.last_used_at,
        expiresAt: token.expires_at,
        revoked: token.revoked
      });
    } catch (error) {
      console.error('GET /dev/tokens/:tokenId error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch token'
      });
    }
  }
);

/**
 * PATCH /dev/tokens/:tokenId
 * Update token metadata (name only)
 */
router.patch(
  '/dev/tokens/:tokenId',
  requireAuth,
  param('tokenId').isInt().toInt(),
  sanitizeBody(),
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Token name must be 1-255 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const pool = req.app.get('db');
      const { tokenId } = req.params;
      const { name } = req.body;

      // Verify ownership
      const { rows: tokenRows } = await pool.query(
        `SELECT user_id FROM api_tokens WHERE id = $1`,
        [tokenId]
      );

      if (!tokenRows.length) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Token not found'
        });
      }

      if (tokenRows[0].user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this token'
        });
      }

      // Update name
      await pool.query(
        `UPDATE api_tokens SET name = $2 WHERE id = $1`,
        [tokenId, name]
      );

      res.json({
        message: 'Token updated successfully',
        id: tokenId,
        name
      });
    } catch (error) {
      console.error('PATCH /dev/tokens/:tokenId error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update token'
      });
    }
  }
);

/**
 * DELETE /dev/tokens/:tokenId
 * Revoke an API token
 */
router.delete(
  '/dev/tokens/:tokenId',
  requireAuth,
  param('tokenId').isInt().toInt(),
  async (req, res) => {
    try {
      const pool = req.app.get('db');
      const { tokenId } = req.params;

      // Verify ownership
      const { rows: tokenRows } = await pool.query(
        `SELECT user_id FROM api_tokens WHERE id = $1`,
        [tokenId]
      );

      if (!tokenRows.length) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Token not found'
        });
      }

      if (tokenRows[0].user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this token'
        });
      }

      // Revoke token
      await revokeApiToken(pool, tokenId, 'User revocation');

      res.json({
        message: 'Token revoked successfully',
        id: tokenId
      });
    } catch (error) {
      console.error('DELETE /dev/tokens/:tokenId error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to revoke token'
      });
    }
  }
);

/**
 * GET /dev/tokens/:tokenId/audit
 * View audit log for a specific token
 */
router.get(
  '/dev/tokens/:tokenId/audit',
  requireAuth,
  param('tokenId').isInt().toInt(),
  sanitizeQuery(),
  [
    body('limit')
      .optional()
      .isInt({ min: 1, max: 500 })
      .toInt()
      .withMessage('Limit must be between 1 and 500')
  ],
  async (req, res) => {
    try {
      const pool = req.app.get('db');
      const { tokenId } = req.params;
      const limit = req.query.limit || 50;

      // Verify ownership
      const { rows: tokenRows } = await pool.query(
        `SELECT user_id FROM api_tokens WHERE id = $1`,
        [tokenId]
      );

      if (!tokenRows.length) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Token not found'
        });
      }

      if (tokenRows[0].user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this token'
        });
      }

      // Get audit log
      const auditLog = await getTokenAuditLog(pool, tokenId, limit);

      res.json({
        tokenId,
        total: auditLog.length,
        auditLog: auditLog.map(entry => ({
          id: entry.id,
          action: entry.action,
          details: entry.details,
          createdAt: entry.created_at
        }))
      });
    } catch (error) {
      console.error('GET /dev/tokens/:tokenId/audit error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch audit log'
      });
    }
  }
);

/**
 * GET /dev/docs
 * API documentation for developers
 */
router.get('/dev/docs', (req, res) => {
  res.json({
    title: 'AKIG API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    authentication: {
      type: 'Bearer Token',
      header: 'X-API-Token',
      example: 'X-API-Token: akig_your_token_here'
    },
    endpoints: [
      {
        method: 'GET',
        path: '/dev/me',
        description: 'Get current authenticated user info',
        auth: 'Optional (API token or session)',
        response: 'User object with authentication method'
      },
      {
        method: 'GET',
        path: '/dev/tokens',
        description: 'List all API tokens for current user',
        auth: 'Required (Session)',
        response: 'Array of token objects'
      },
      {
        method: 'POST',
        path: '/dev/tokens',
        description: 'Create a new API token',
        auth: 'Required (Session)',
        body: {
          name: 'Token name (optional)',
          scopes: ['read', 'write'],
          expiresIn: '30d'
        },
        response: 'New token object (token value shown once)'
      },
      {
        method: 'GET',
        path: '/dev/tokens/:tokenId',
        description: 'Get token details',
        auth: 'Required (Session)',
        response: 'Token object'
      },
      {
        method: 'PATCH',
        path: '/dev/tokens/:tokenId',
        description: 'Update token name',
        auth: 'Required (Session)',
        body: { name: 'New token name' },
        response: 'Updated token'
      },
      {
        method: 'DELETE',
        path: '/dev/tokens/:tokenId',
        description: 'Revoke an API token',
        auth: 'Required (Session)',
        response: 'Success message'
      },
      {
        method: 'GET',
        path: '/dev/tokens/:tokenId/audit',
        description: 'View audit log for token',
        auth: 'Required (Session)',
        response: 'Audit log entries'
      }
    ],
    scopes: [
      {
        name: 'read',
        description: 'Read-only access to data'
      },
      {
        name: 'write',
        description: 'Write access to data'
      },
      {
        name: 'admin',
        description: 'Administrative access'
      },
      {
        name: 'payments',
        description: 'Payment processing'
      },
      {
        name: 'exports',
        description: 'Data export capabilities'
      },
      {
        name: 'contracts',
        description: 'Contract management'
      },
      {
        name: 'notifications',
        description: 'Notification management'
      }
    ]
  });
});

module.exports = router;
