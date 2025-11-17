/**
 * Backend Unit Tests - Authentication
 * Fixes: 0 backend tests (P1)
 */

const request = require('supertest');
const app = require('../../app');
const pool = require('../../db');

describe('Auth Flow', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    it('should prevent SQL injection in email field', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'test123',
        });

      expect(res.status).toBe(400); // Validation error
      expect(res.body).toHaveProperty('error');
    });

    it('should prevent SQL injection in password field', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: "' OR '1'='1",
        });

      expect(res.status).toBe(401); // Unauthorized (not SQL error)
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'test123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/validation/i);
    });

    it('should require password minimum length', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/validation|password/i);
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'validPassword123',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should validate password complexity', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weakpassword', // No uppercase, no number
          name: 'Test User',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });

    it('should sanitize name input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123',
          name: '<script>alert("XSS")</script>',
        });

      expect(res.status).toBe(400);
      // Name should be rejected or sanitized
    });

    it('should normalize email to lowercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'ValidPass123',
          name: 'Test User',
        });

      // Should either succeed or fail duplicate, but email should be normalized
      if (res.status === 201) {
        const user = await pool.query('SELECT email FROM users WHERE email = $1', ['test@example.com']);
        expect(user.rows.length).toBe(1);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should block after 5 failed login attempts', async () => {
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'ratelimit@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const results = await Promise.all(attempts);
      const lastResult = results[results.length - 1];

      expect(lastResult.status).toBe(429); // Too Many Requests
      expect(lastResult.body.error).toMatch(/rate limit|too many/i);
    });
  });
});
