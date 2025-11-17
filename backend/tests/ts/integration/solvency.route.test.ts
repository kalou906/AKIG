import request from 'supertest';

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

jest.mock('../../../src/container', () => ({
  solvencyService: {
    calculateScore: jest.fn().mockResolvedValue({
      tenant_id: TENANT_ID,
      payment_probability: 0.85,
      risk_level: 'GOOD',
      badge: '🟡',
      color: '#f59e0b',
      expected_payment_date: new Date().toISOString(),
      confidence_score: 0.8,
      factors: [],
      calculated_at: new Date().toISOString(),
    }),
  },
}));

const app = require('../../../src/app.ts').default;

describe('GET /tenants/:id/solvency (TS)', () => {
  it('returns solvency score', async () => {
    const res = await request(app).get(`/tenants/${TENANT_ID}/solvency`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tenant_id).toBe(TENANT_ID);
  });
});
