/**
 * 🔐 AKIG Advanced Security Module
 * Two-Factor Authentication (2FA/MFA)
 * Anomaly Detection & Login Risk Assessment
 * Audit Trail Management
 * 
 * Features:
 * - Email/SMS 2FA verification codes
 * - Geographic anomaly detection
 * - Multi-session tracking
 * - Comprehensive audit logging
 * - Risk scoring on login attempts
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const logger = require('./logger');
const pool = require('../db');
const dayjs = require('dayjs');

class SecurityService {
  constructor() {
    this.maxAttemptsPerHour = 5;
    this.mfaCodeExpiry = 15; // minutes
    this.sessionTimeout = 30; // minutes
  }

  /**
   * Generate 2FA verification code
   * @param {string} userId
   * @param {string} method - 'email' | 'sms'
   * @returns {Promise<Object>}
   */
  async generateMFACode(userId, method = 'email') {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = dayjs().add(this.mfaCodeExpiry, 'minutes');
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

      // Store in database
      await pool.query(
        `INSERT INTO mfa_codes (user_id, code_hash, method, expires_at, used)
         VALUES ($1, $2, $3, $4, false)`,
        [userId, hashedCode, method, expiresAt.toDate()]
      );

      logger.info(`✓ MFA code generated for user ${userId} via ${method}`);

      return {
        success: true,
        expiresIn: this.mfaCodeExpiry,
        method,
        message: `Verification code sent via ${method}`
      };
    } catch (err) {
      logger.error('Error generating MFA code', err);
      throw err;
    }
  }

  /**
   * Verify 2FA code
   * @param {string} userId
   * @param {string} code
   * @returns {Promise<boolean>}
   */
  async verifyMFACode(userId, code) {
    try {
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

      const result = await pool.query(
        `SELECT * FROM mfa_codes 
         WHERE user_id = $1 
         AND code_hash = $2 
         AND expires_at > NOW() 
         AND used = false
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, hashedCode]
      );

      if (result.rows.length === 0) {
        logger.warn(`❌ Invalid or expired MFA code for user ${userId}`);
        return false;
      }

      // Mark as used
      await pool.query(
        'UPDATE mfa_codes SET used = true WHERE id = $1',
        [result.rows[0].id]
      );

      logger.info(`✓ MFA code verified for user ${userId}`);
      return true;
    } catch (err) {
      logger.error('Error verifying MFA code', err);
      throw err;
    }
  }

  /**
   * Detect anomalous login attempts
   * @param {string} userId
   * @param {Object} loginContext - { ip, userAgent, location, timestamp }
   * @returns {Promise<Object>} riskScore and alerts
   */
  async detectLoginAnomalies(userId, loginContext) {
    try {
      const { ip, userAgent, location } = loginContext;
      const riskFactors = [];
      let riskScore = 0;

      // 1. Check geographic anomaly (impossible travel)
      const lastLogin = await pool.query(
        `SELECT location, login_timestamp FROM login_history 
         WHERE user_id = $1 AND success = true
         ORDER BY login_timestamp DESC LIMIT 1`,
        [userId]
      );

      if (lastLogin.rows.length > 0) {
        const lastLocation = lastLogin.rows[0].location;
        const timeDiff = (new Date() - new Date(lastLogin.rows[0].login_timestamp)) / 1000 / 60; // minutes

        if (lastLocation && location && this.isImpossibleTravel(lastLocation, location, timeDiff)) {
          riskFactors.push('Impossible travel detected');
          riskScore += 40;
        }
      }

      // 2. Check new device/location
      const existingDevice = await pool.query(
        `SELECT COUNT(*) as count FROM login_history 
         WHERE user_id = $1 AND user_agent = $2 AND success = true`,
        [userId, userAgent]
      );

      if (existingDevice.rows[0].count === 0) {
        riskFactors.push('New device detected');
        riskScore += 20;
      }

      // 3. Check brute force attempts
      const recentAttempts = await pool.query(
        `SELECT COUNT(*) as count FROM login_history 
         WHERE user_id = $1 AND ip = $2 
         AND login_timestamp > NOW() - INTERVAL '1 hour'`,
        [userId, ip]
      );

      if (recentAttempts.rows[0].count > this.maxAttemptsPerHour) {
        riskFactors.push('Excessive login attempts');
        riskScore += 30;
      }

      // 4. Check time-based anomaly (unusual login hour)
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        riskFactors.push('Unusual login time');
        riskScore += 15;
      }

      // Store anomaly event
      if (riskScore >= 40) {
        await this.logSecurityEvent(userId, 'ANOMALOUS_LOGIN', {
          riskScore,
          riskFactors,
          ip,
          location
        });
      }

      return {
        riskScore: Math.min(riskScore, 100),
        riskFactors,
        requiresMFA: riskScore >= 50,
        requiresEmailVerification: riskScore >= 70
      };
    } catch (err) {
      logger.error('Error detecting login anomalies', err);
      throw err;
    }
  }

  /**
   * Check if travel between locations is impossible
   * @private
   */
  isImpossibleTravel(lastLocation, currentLocation, timeDiffMinutes) {
    // Simplified: assume max speed of 900 km/h (airplane)
    // In production, use geolocation library to calculate distance
    const maxDistanceKm = (timeDiffMinutes / 60) * 900;
    
    // For demo, flag any location change within 5 minutes as suspicious
    if (timeDiffMinutes < 5 && lastLocation !== currentLocation) {
      return true;
    }
    
    return false;
  }

  /**
   * Track active sessions
   * @param {string} userId
   * @param {string} sessionToken
   * @param {Object} context - { ip, userAgent, location }
   */
  async trackSession(userId, sessionToken, context) {
    try {
      const expiresAt = dayjs().add(this.sessionTimeout, 'minutes');

      await pool.query(
        `INSERT INTO active_sessions (user_id, session_token, ip, user_agent, location, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, sessionToken, context.ip, context.userAgent, context.location, expiresAt.toDate()]
      );

      logger.info(`✓ Session tracked for user ${userId}`);
    } catch (err) {
      logger.error('Error tracking session', err);
    }
  }

  /**
   * Detect multiple concurrent sessions from different IPs
   * @param {string} userId
   * @returns {Promise<Array>} concurrent sessions
   */
  async detectMultipleSessions(userId) {
    try {
      const result = await pool.query(
        `SELECT DISTINCT ip, user_agent, location, created_at 
         FROM active_sessions 
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY created_at DESC`,
        [userId]
      );

      if (result.rows.length > 1) {
        logger.warn(`⚠️ Multiple concurrent sessions detected for user ${userId}`);
        return result.rows;
      }

      return [];
    } catch (err) {
      logger.error('Error detecting multiple sessions', err);
      return [];
    }
  }

  /**
   * Log security event to audit trail
   * @param {string} userId
   * @param {string} eventType
   * @param {Object} details
   */
  async logSecurityEvent(userId, eventType, details = {}) {
    try {
      await pool.query(
        `INSERT INTO audit_trail (user_id, event_type, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, eventType, JSON.stringify(details)]
      );

      logger.info(`📋 Security event logged: ${eventType} for user ${userId}`);
    } catch (err) {
      logger.error('Error logging security event', err);
    }
  }

  /**
   * Get audit trail for user
   * @param {string} userId
   * @param {number} limit
   */
  async getAuditTrail(userId, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT * FROM audit_trail 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (err) {
      logger.error('Error fetching audit trail', err);
      return [];
    }
  }

  /**
   * Send MFA code via email
   * @param {string} email
   * @param {string} code
   */
  async sendMFAEmail(email, code) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Montserrat, sans-serif; }
    .container { max-width: 500px; margin: 0 auto; }
    .header { background: #004E89; color: white; padding: 20px; text-align: center; }
    .code { font-size: 32px; font-weight: bold; color: #CE1126; text-align: center; padding: 20px; }
    .footer { background: #f5f7fb; padding: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 AKIG Security Verification</h1>
    </div>
    <div style="padding: 20px;">
      <p>Your verification code is:</p>
      <div class="code">${code}</div>
      <p style="color: #666;">This code expires in 15 minutes.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2025 AKIG - Plateforme de Gestion Immobilière</p>
    </div>
  </div>
</body>
</html>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🔐 AKIG - Verification Code',
        html: htmlContent
      });

      logger.info(`✓ MFA email sent to ${email}`);
    } catch (err) {
      logger.error('Error sending MFA email', err);
      throw err;
    }
  }

  /**
   * Enforce session timeout
   * @param {string} sessionToken
   */
  async validateSession(sessionToken) {
    try {
      const result = await pool.query(
        `SELECT * FROM active_sessions 
         WHERE session_token = $1 AND expires_at > NOW()`,
        [sessionToken]
      );

      return result.rows.length > 0;
    } catch (err) {
      logger.error('Error validating session', err);
      return false;
    }
  }
}

module.exports = new SecurityService();
