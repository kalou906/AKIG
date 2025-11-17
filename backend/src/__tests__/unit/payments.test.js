/**
 * Backend Unit Tests - Payments
 */

const request = require('supertest');
const app = require('../../app');
const pool = require('../../db');

describe('Payments API', () => {
  let authToken;

  beforeAll(async () => {
    // Create test user and get auth token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123',
      });
    authToken = res.body?.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/payments', () => {
    it('should validate amount is positive', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -100,
          method: 'CASH',
          contract_id: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/amount|positive/i);
    });

    it('should validate payment method enum', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          method: 'INVALID_METHOD',
          contract_id: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/method/i);
    });

    it('should require valid contract_id', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          method: 'CASH',
          contract_id: 'invalid',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments', () => {
    it('should return paginated results', async () => {
      const res = await request(app)
        .get('/api/payments?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should reject invalid pagination params', async () => {
      const res = await request(app)
        .get('/api/payments?page=-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });
});
