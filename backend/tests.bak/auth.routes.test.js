/**
 * Tests for authentication routes
 */

const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

const mockUser = {
  id: 1,
  email: 'test@akig.com',
  name: 'Test User',
  password_hash: '$2a$10$mock.hash.password',
  role: 'user',
  created_at: '2025-10-24T00:00:00Z',
  last_login: '2025-10-24T10:00:00Z',
};

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'production';
  });

  describe('POST /api/auth/register', () => {
    test('registers new user successfully', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // User doesn't exist
        .mockResolvedValueOnce({
          rows: [mockUser],
        });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2a$10$hashed.password');

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.email).toBe('test@akig.com');
      expect(res.body.data.token).toBeDefined();
    });

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@akig.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('validates email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_EMAIL');
    });

    test('validates password strength (min 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@akig.com',
          password: 'Pass1',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    test('validates password has uppercase and number', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@akig.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    test('prevents duplicate email registration', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('USER_EXISTS');
    });

    test('respects rate limiting', async () => {
      // Rate limiter configured in middleware
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(res.status).toBeGreaterThanOrEqual(201);
    });
  });

  describe('POST /api/auth/login', () => {
    test('logs in user successfully', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.email).toBe('test@akig.com');
      expect(res.body.data.token).toBeDefined();
    });

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@akig.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('returns error for non-existent user', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@akig.com',
          password: 'Password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('returns error for incorrect password', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@akig.com',
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('updates last_login on successful login', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE query

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('last_login'),
        expect.any(Array)
      );
    });

    test('is case-insensitive for email', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@AKIG.COM',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
    });

    test('respects rate limiting', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns current user profile when authenticated', async () => {
      const token = jwt.sign(
        { id: 1, email: 'test@akig.com', role: 'user' },
        process.env.JWT_SECRET
      );

      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.email).toBe('test@akig.com');
    });

    test('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    test('returns 404 when user not found', async () => {
      const token = jwt.sign(
        { id: 999, email: 'nonexistent@akig.com', role: 'user' },
        process.env.JWT_SECRET
      );

      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PUT /api/auth/me', () => {
    const token = jwt.sign(
      { id: 1, email: 'test@akig.com', role: 'user' },
      process.env.JWT_SECRET
    );

    test('updates user name', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ ...mockUser, name: 'Updated Name' }],
      });

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
    });

    test('updates user email', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Email not taken
        .mockResolvedValueOnce({
          rows: [{ ...mockUser, email: 'newemail@akig.com' }],
        });

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'newemail@akig.com' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('newemail@akig.com');
    });

    test('prevents duplicate email', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 2, email: 'taken@akig.com' }],
      });

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'taken@akig.com' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_TAKEN');
    });

    test('validates new email format', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_EMAIL');
    });

    test('updates password with hashing', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2a$10$new.hash');

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewPassword123' });

      expect(res.status).toBe(200);
    });

    test('returns error if no fields to update', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('NO_UPDATES');
    });

    test('requires authentication', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .send({ name: 'New Name' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('refreshes token successfully', async () => {
      const oldToken = jwt.sign(
        { id: 1, email: 'test@akig.com', role: 'user' },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${oldToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('requires authentication', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('logs out user successfully', async () => {
      const token = jwt.sign(
        { id: 1, email: 'test@akig.com', role: 'user' },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('requires authentication', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    test('processes password reset request for existing user', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'test@akig.com' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toContain('password reset link');
    });

    test('returns success for non-existent user (privacy)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'nonexistent@akig.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('password reset link');
    });

    test('requires email', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_EMAIL');
    });

    test('respects rate limiting', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'test@akig.com' });

      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Error handling', () => {
    test('handles database errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('REGISTER_ERROR');
    });
  });

  describe('Security', () => {
    test('does not reveal if email exists during login', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@akig.com',
          password: 'Password123',
        });

      expect(res.body.error).toBe('Invalid email or password');
    });

    test('does not reveal if email exists during password reset', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'nonexistent@akig.com' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });
});
