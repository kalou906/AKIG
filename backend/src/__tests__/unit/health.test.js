const request = require('supertest');
const express = require('express');

// Build a minimal app wiring only the health router to avoid unrelated middleware
const buildApp = () => {
  const app = express();
  const healthRouter = require('../../routes/health');
  app.use('/api/health', healthRouter);
  return app;
};

describe('Health endpoints', () => {
  it('GET /api/health/status returns ok without DB dependency', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/health/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /api/health responds with 200 (healthy) or 503 (degraded)', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('db');
    expect(res.body.db).toHaveProperty('healthy');
  });
});
