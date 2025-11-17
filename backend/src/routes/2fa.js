/**
 * Two-Factor Authentication Routes
 * Handles TOTP setup, verification, and backup code management
 * Supports Google Authenticator, Authy, and compatible apps
 */

const router = require('express').Router();
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { requireAuth } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/security');

/**
 * Hash a string for storage
 */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify hashed code
 */
function verifyHashedCode(code, hashedCode) {
  return hashCode(code) === hashedCode;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

/**
 * POST /2fa/setup
 * Initialize 2FA setup - generate secret and QR code
 */
router.post('/2fa/setup', requireAuth, sanitizeBody(), async (req, res) => {
  try {
    const pool = req.app.get('db');

    // Generate TOTP secret
    const secret = authenticator.generateSecret({
      name: `AKIG (${req.user.email})`,
      issuer: 'AKIG'
    });

    // Generate OTPAuth URI for QR code
    const otpauth = authenticator.keyuri(req.user.email, 'AKIG', secret);

    // Generate QR code as SVG
    const qrCodeSvg = await QRCode.toString(otpauth, {
      type: 'image/svg+xml',
      width: 300,
      margin: 1
    });

    // Generate backup codes (10 codes)
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(hashCode);

    // Store in database as pending setup
    await pool.query(
      `INSERT INTO user_2fa (user_id, secret, backup_codes, enabled)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (user_id) DO UPDATE
       SET secret = $2, backup_codes = $3, enabled = false, updated_at = NOW()`,
      [req.user.id, secret, hashedBackupCodes]
    );

    // Log the action
    await pool.query(
      `INSERT INTO user_2fa_logs (user_id, action, details, ip_address)
       VALUES ($1, 'generated', $2, $3)`,
      [req.user.id, JSON.stringify({ method: 'totp' }), req.ip]
    );

    res.status(200).json({
      message: '2FA setup initialized',
      secret,
      qrCode: qrCodeSvg,
      backupCodes: backupCodes.map((code, idx) => ({
        index: idx + 1,
        code
      })),
      warning: 'Save these backup codes in a secure location. Each code can only be used once.'
    });
  } catch (error) {
    console.error('POST /2fa/setup error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to initialize 2FA setup'
    });
  }
});

/**
 * POST /2fa/verify-setup
 * Verify TOTP code and enable 2FA
 */
router.post(
  '/2fa/verify-setup',
  requireAuth,
  sanitizeBody(),
  [
    body('code')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Code must be 6 digits')
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
      const { code } = req.body;

      // Get pending 2FA setup
      const { rows } = await pool.query(
        `SELECT secret, backup_codes FROM user_2fa WHERE user_id = $1 AND enabled = false`,
        [req.user.id]
      );

      if (!rows.length) {
        return res.status(400).json({
          error: 'Setup Not Found',
          message: 'No 2FA setup found or already enabled'
        });
      }

      const { secret, backup_codes } = rows[0];

      // Verify OTP code (allow ±30 seconds window)
      const isValid = authenticator.check(code, secret, {
        window: 1 // ±30 seconds
      });

      if (!isValid) {
        // Log failed verification
        await pool.query(
          `INSERT INTO user_2fa_logs (user_id, action, details, ip_address)
           VALUES ($1, 'failed', $2, $3)`,
          [req.user.id, JSON.stringify({ reason: 'invalid_code' }), req.ip]
        );

        return res.status(401).json({
          error: 'Invalid Code',
          message: 'The code you entered is incorrect or expired'
        });
      }

      // Enable 2FA
      await pool.query(
        `UPDATE user_2fa SET enabled = true, updated_at = NOW() WHERE user_id = $1`,
        [req.user.id]
      );

      // Log successful enablement
      await pool.query(
        `INSERT INTO user_2fa_logs (user_id, action, details, ip_address)
         VALUES ($1, 'enabled', $2, $3)`,
        [
          req.user.id,
          JSON.stringify({ backup_codes_count: backup_codes.length }),
          req.ip
        ]
      );

      res.json({
        message: '2FA enabled successfully',
        status: 'enabled'
      });
    } catch (error) {
      console.error('POST /2fa/verify-setup error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to enable 2FA'
      });
    }
  }
);

/**
 * POST /2fa/disable
 * Disable 2FA for user
 */
router.post(
  '/2fa/disable',
  requireAuth,
  sanitizeBody(),
  [
    body('password')
      .notEmpty()
      .withMessage('Password required to disable 2FA')
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
      const { password } = req.body;
      const bcrypt = require('bcryptjs');

      // Get user with password hash
      const { rows: userRows } = await pool.query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (!userRows.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        password,
        userRows[0].password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid Password',
          message: 'Password is incorrect'
        });
      }

      // Disable 2FA
      await pool.query(
        `UPDATE user_2fa 
         SET enabled = false, secret = '', backup_codes = '{}'::text[], updated_at = NOW()
         WHERE user_id = $1`,
        [req.user.id]
      );

      // Log disablement
      await pool.query(
        `INSERT INTO user_2fa_logs (user_id, action, ip_address)
         VALUES ($1, 'disabled', $2)`,
        [req.user.id, req.ip]
      );

      res.json({
        message: '2FA disabled successfully',
        status: 'disabled'
      });
    } catch (error) {
      console.error('POST /2fa/disable error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to disable 2FA'
      });
    }
  }
);

/**
 * GET /2fa/status
 * Get 2FA status for current user
 */
router.get('/2fa/status', requireAuth, async (req, res) => {
  try {
    const pool = req.app.get('db');

    const { rows } = await pool.query(
      `SELECT 
        enabled,
        method,
        created_at,
        updated_at,
        last_used_at,
        array_length(backup_codes, 1) AS backup_codes_remaining
       FROM user_2fa
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.json({
        status: 'not_setup',
        enabled: false,
        backupCodesRemaining: 0
      });
    }

    const twofa = rows[0];
    res.json({
      status: twofa.enabled ? 'enabled' : 'pending',
      enabled: twofa.enabled,
      method: twofa.method,
      createdAt: twofa.created_at,
      updatedAt: twofa.updated_at,
      lastUsedAt: twofa.last_used_at,
      backupCodesRemaining: twofa.backup_codes_remaining || 0
    });
  } catch (error) {
    console.error('GET /2fa/status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get 2FA status'
    });
  }
});

/**
 * POST /2fa/verify-login
 * Verify TOTP code during login (after password verification)
 */
router.post(
  '/2fa/verify-login',
  sanitizeBody(),
  [
    body('userId').isInt().toInt().withMessage('Invalid user ID'),
    body('code')
      .trim()
      .matches(/^(\d{6}|[A-F0-9]{8})$/)
      .withMessage('Code must be 6 digits or 8-character backup code')
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
      const { userId, code } = req.body;

      // Get 2FA settings
      const { rows } = await pool.query(
        `SELECT secret, backup_codes, enabled FROM user_2fa WHERE user_id = $1`,
        [userId]
      );

      if (!rows.length || !rows[0].enabled) {
        return res.status(400).json({
          error: '2FA Not Enabled',
          message: '2FA is not enabled for this account'
        });
      }

      const { secret, backup_codes } = rows[0];

      // Check if code is TOTP or backup code
      const isTotpValid = authenticator.check(code, secret, { window: 1 });
      const isBackupCodeValid = backup_codes.some(hashed =>
        verifyHashedCode(code, hashed)
      );

      if (!isTotpValid && !isBackupCodeValid) {
        // Log failed attempt
        await pool.query(
          `INSERT INTO user_2fa_logs (user_id, action, details, ip_address)
           VALUES ($1, 'failed', $2, $3)`,
          [userId, JSON.stringify({ reason: 'invalid_code' }), req.ip]
        );

        return res.status(401).json({
          error: 'Invalid Code',
          message: 'The code you entered is incorrect'
        });
      }

      // If backup code was used, remove it
      if (isBackupCodeValid) {
        const hashedCodeToRemove = backup_codes.find(hashed =>
          verifyHashedCode(code, hashed)
        );

        await pool.query(
          `UPDATE user_2fa SET backup_codes = array_remove(backup_codes, $1) WHERE user_id = $2`,
          [hashedCodeToRemove, userId]
        );

        // Log backup code usage
        await pool.query(
          `INSERT INTO user_2fa_logs (user_id, action, ip_address)
           VALUES ($1, 'backup_used', $2)`,
          [userId, req.ip]
        );
      } else {
        // Log successful OTP verification
        await pool.query(
          `INSERT INTO user_2fa_logs (user_id, action, ip_address)
           VALUES ($1, 'verified', $2)`,
          [userId, req.ip]
        );
      }

      // Create session token
      const jwtSecret = process.env.JWT_SECRET;
      const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: '24h' });

      res.json({
        message: '2FA verification successful',
        token,
        method: isBackupCodeValid ? 'backup_code' : 'totp'
      });
    } catch (error) {
      console.error('POST /2fa/verify-login error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify 2FA code'
      });
    }
  }
);

/**
 * POST /2fa/backup-codes/regenerate
 * Regenerate backup codes
 */
router.post(
  '/2fa/backup-codes/regenerate',
  requireAuth,
  sanitizeBody(),
  [
    body('password')
      .notEmpty()
      .withMessage('Password required to regenerate backup codes')
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
      const { password } = req.body;
      const bcrypt = require('bcryptjs');

      // Verify password
      const { rows: userRows } = await pool.query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (!userRows.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        userRows[0].password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid Password',
          message: 'Password is incorrect'
        });
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedBackupCodes = backupCodes.map(hashCode);

      // Update database
      await pool.query(
        `UPDATE user_2fa SET backup_codes = $2 WHERE user_id = $1`,
        [req.user.id, hashedBackupCodes]
      );

      // Log regeneration
      await pool.query(
        `INSERT INTO user_2fa_logs (user_id, action, details, ip_address)
         VALUES ($1, 'generated', $2, $3)`,
        [
          req.user.id,
          JSON.stringify({ type: 'regenerated' }),
          req.ip
        ]
      );

      res.json({
        message: 'Backup codes regenerated successfully',
        backupCodes: backupCodes.map((code, idx) => ({
          index: idx + 1,
          code
        })),
        warning: 'Old backup codes are no longer valid. Save these new codes in a secure location.'
      });
    } catch (error) {
      console.error('POST /2fa/backup-codes/regenerate error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to regenerate backup codes'
      });
    }
  }
);

module.exports = router;
