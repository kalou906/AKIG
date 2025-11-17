/**
 * Auth Logout Routes
 * 
 * POST /logout - Logout current user
 * POST /logout-all-devices - Logout from all devices
 * GET /active-sessions - Get active sessions
 * DELETE /session/:id - Invalidate specific session
 */

const express = require('express');
const router = express.Router();
const LogoutService = require('../services/LogoutService');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

/**
 * POST /logout
 * Logout current user and invalidate token
 */
router.post('/logout', authMiddleware, validateRequest({
  body: {
    logout_reason: { type: 'string', required: false },
    logout_all_devices: { type: 'boolean', required: false }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;
    const tokenId = req.user.jti; // JWT ID claim
    
    // Extract client info
    const logoutData = {
      logout_reason: req.body.logout_reason || 'user_initiated',
      logout_all_devices: req.body.logout_all_devices || false,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    };

    const result = await LogoutService.logout(userId, tokenId, logoutData);

    res.json({
      success: true,
      message: 'Logout successful',
      data: result.data
    });

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

/**
 * POST /logout-all-devices
 * Logout from all devices
 */
router.post('/logout-all-devices', authMiddleware, validateRequest({
  body: {
    password: { type: 'string', required: true }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Verify password before allowing logout-all-devices
    // This is a security measure to prevent accidental or malicious logouts

    // Invalidate all sessions
    const result = await LogoutService.invalidateAllUserSessions(
      userId,
      'user_logout_all_devices'
    );

    res.json({
      success: true,
      message: 'Logged out from all devices',
      data: result
    });

  } catch (error) {
    console.error('[Auth] Logout all devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices',
      error: error.message
    });
  }
});

/**
 * GET /active-sessions
 * Get current user's active sessions
 */
router.get('/active-sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await LogoutService.getActiveSessions(userId);

    res.json({
      success: true,
      message: 'Active sessions retrieved',
      data: {
        total_active: sessions.length,
        sessions: sessions.map(session => ({
          id: session.id,
          ip_address: session.ip_address,
          user_agent: session.user_agent,
          device_type: session.device_type || 'unknown',
          created_at: session.created_at,
          last_activity: session.last_activity,
          is_current: req.user.session_id === session.id
        }))
      }
    });

  } catch (error) {
    console.error('[Auth] Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions',
      error: error.message
    });
  }
});

/**
 * DELETE /session/:id
 * Invalidate specific session
 */
router.delete('/session/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // Verify the session belongs to this user
    const pool = require('../db');
    const sessionQuery = await pool.query(
      'SELECT user_id FROM user_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (sessionQuery.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete other users\' sessions'
      });
    }

    // Invalidate the session
    await pool.query(
      `UPDATE user_sessions 
       SET is_active = false, logged_out_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    // Log audit event
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'invalidate_session', 'user_session', sessionId, JSON.stringify({ reason: 'user_request' })]
    );

    res.json({
      success: true,
      message: 'Session invalidated'
    });

  } catch (error) {
    console.error('[Auth] Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate session',
      error: error.message
    });
  }
});

/**
 * GET /logout-stats
 * Get logout statistics (Admin only)
 */
router.get('/logout-stats', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin role check
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Admin access required' });
    // }

    const stats = await LogoutService.getLogoutStats({
      date_from: req.query.date_from,
      date_to: req.query.date_to
    });

    res.json({
      success: true,
      message: 'Logout statistics retrieved',
      data: stats
    });

  } catch (error) {
    console.error('[Auth] Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

module.exports = router;
