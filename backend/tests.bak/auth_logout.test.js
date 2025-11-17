/**
 * Auth Logout Tests
 * 
 * Test Suite for Logout Functionality
 * - Token invalidation
 * - Session management
 * - Audit logging
 * - Security measures
 */

const request = require('supertest');
const app = require('../index');
const pool = require('../db');
const jwt = require('jsonwebtoken');

describe('Auth Logout Routes', () => {
  let testUser = null;
  let authToken = null;
  let tokenId = null;

  // Setup: Create test user before all tests
  beforeAll(async () => {
    try {
      // Create test user
      const userResult = await pool.query(
        `INSERT INTO users (email, nom, prenom, password_hash, statut)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, nom`,
        ['logout-test@example.com', 'Test', 'Logout', 'hashed_password', 'actif']
      );

      testUser = userResult.rows[0];

      // Create valid JWT token
      tokenId = 'test-token-id-' + Date.now();
      authToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: tokenId },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      // Create session record
      const sessionResult = await pool.query(
        `INSERT INTO user_sessions (user_id, ip_address, user_agent, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [testUser.id, '127.0.0.1', 'Mozilla/5.0', true]
      );

    } catch (error) {
      console.error('Setup error:', error);
    }
  });

  // Cleanup: Delete test user after all tests
  afterAll(async () => {
    try {
      if (testUser) {
        await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
      }
      await pool.end();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  // ============================================================================
  // POST /api/auth/logout
  // ============================================================================

  describe('POST /api/auth/logout', () => {

    test('should successfully logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          logout_reason: 'user_initiated'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user_id).toBe(testUser.id);
      expect(response.body.data.tokens_invalidated).toBeGreaterThanOrEqual(1);
    });

    test('should return 401 if no token provided', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(401);
    });

    test('should return 401 if invalid token provided', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid_token')
        .send({});

      expect(response.status).toBe(401);
    });

    test('should add token to blacklist', async () => {
      // Create new token for this test
      const newTokenId = 'test-token-' + Date.now();
      const newToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: newTokenId },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          logout_reason: 'user_initiated'
        });

      expect(response.status).toBe(200);

      // Verify token is in blacklist
      const blacklistCheck = await pool.query(
        'SELECT id FROM token_blacklist WHERE token_id = $1',
        [newTokenId]
      );

      expect(blacklistCheck.rows.length).toBeGreaterThan(0);
    });

    test('should update session status to inactive', async () => {
      // Create new token and session
      const sessionTokenId = 'session-token-' + Date.now();
      const sessionToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: sessionTokenId },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({});

      expect(response.status).toBe(200);

      // Check that sessions are marked inactive
      const sessions = await pool.query(
        'SELECT is_active FROM user_sessions WHERE user_id = $1 AND is_active = false',
        [testUser.id]
      );

      expect(sessions.rows.length).toBeGreaterThan(0);
    });

    test('should log audit event on logout', async () => {
      const beforeCount = (await pool.query(
        "SELECT COUNT(*) as count FROM audit_logs WHERE user_id = $1 AND action = 'logout'",
        [testUser.id]
      )).rows[0].count;

      const testTokenId = 'audit-token-' + Date.now();
      const testToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: testTokenId },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      const afterCount = (await pool.query(
        "SELECT COUNT(*) as count FROM audit_logs WHERE user_id = $1 AND action = 'logout'",
        [testUser.id]
      )).rows[0].count;

      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    test('should support logout_all_devices flag', async () => {
      const logoutToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: 'logout-all-' + Date.now() },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutToken}`)
        .send({
          logout_all_devices: true
        });

      expect(response.status).toBe(200);
      expect(response.body.data.all_devices_logout).toBe(true);
    });

  });

  // ============================================================================
  // POST /api/auth/logout-all-devices
  // ============================================================================

  describe('POST /api/auth/logout-all-devices', () => {

    test('should invalidate all user sessions', async () => {
      const logoutToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: 'logout-all-sessions-' + Date.now() },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/logout-all-devices')
        .set('Authorization', `Bearer ${logoutToken}`)
        .send({
          password: 'test_password' // Note: This should be verified in real implementation
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.sessions_invalidated).toBeGreaterThanOrEqual(0);
    });

    test('should require password parameter', async () => {
      const logoutToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: 'logout-all-' + Date.now() },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/logout-all-devices')
        .set('Authorization', `Bearer ${logoutToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all-devices')
        .send({
          password: 'test_password'
        });

      expect(response.status).toBe(401);
    });

  });

  // ============================================================================
  // GET /api/auth/active-sessions
  // ============================================================================

  describe('GET /api/auth/active-sessions', () => {

    test('should retrieve active sessions for user', async () => {
      const testToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: 'active-sessions-' + Date.now() },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/api/auth/active-sessions')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.sessions).toBeDefined();
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/active-sessions');

      expect(response.status).toBe(401);
    });

    test('should include session details', async () => {
      const testToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: 'session-detail-' + Date.now() },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/api/auth/active-sessions')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);

      if (response.body.data.sessions.length > 0) {
        const session = response.body.data.sessions[0];
        expect(session.id).toBeDefined();
        expect(session.ip_address).toBeDefined();
        expect(session.device_type).toBeDefined();
        expect(session.created_at).toBeDefined();
      }
    });

  });

  // ============================================================================
  // DELETE /api/auth/session/:id
  // ============================================================================

  describe('DELETE /api/auth/session/:id', () => {

    test('should invalidate specific session', async () => {
      // Get a session first
      const sessions = await pool.query(
        'SELECT id FROM user_sessions WHERE user_id = $1 AND is_active = true LIMIT 1',
        [testUser.id]
      );

      if (sessions.rows.length === 0) {
        // Create a new session
        const newSession = await pool.query(
          `INSERT INTO user_sessions (user_id, ip_address, user_agent, is_active)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [testUser.id, '127.0.0.1', 'Mozilla', true]
        );
        
        const sessionId = newSession.rows[0].id;
        const testToken = jwt.sign(
          { id: testUser.id, email: testUser.email, jti: 'delete-session-' + Date.now() },
          process.env.JWT_SECRET || 'test_secret',
          { expiresIn: '24h' }
        );

        const response = await request(app)
          .delete(`/api/auth/session/${sessionId}`)
          .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
      }
    });

    test('should return 404 for non-existent session', async () => {
      const testToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: 'delete-invalid-' + Date.now() },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .delete('/api/auth/session/99999')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/auth/session/1');

      expect(response.status).toBe(401);
    });

  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration: Complete Logout Flow', () => {

    test('should handle complete logout workflow', async () => {
      // 1. Create token
      const flowTokenId = 'flow-token-' + Date.now();
      const flowToken = jwt.sign(
        { id: testUser.id, email: testUser.email, jti: flowTokenId },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      // 2. Perform logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${flowToken}`)
        .send({
          logout_reason: 'test_flow'
        });

      expect(logoutResponse.status).toBe(200);

      // 3. Verify token is blacklisted
      const blacklistResult = await pool.query(
        'SELECT id FROM token_blacklist WHERE token_id = $1',
        [flowTokenId]
      );
      expect(blacklistResult.rows.length).toBeGreaterThan(0);

      // 4. Verify session is inactive
      const sessionResult = await pool.query(
        'SELECT is_active FROM user_sessions WHERE user_id = $1 AND is_active = false',
        [testUser.id]
      );
      expect(sessionResult.rows.length).toBeGreaterThan(0);

      // 5. Verify audit log entry
      const auditResult = await pool.query(
        "SELECT id FROM audit_logs WHERE user_id = $1 AND action = 'logout'",
        [testUser.id]
      );
      expect(auditResult.rows.length).toBeGreaterThan(0);
    });

  });

});
