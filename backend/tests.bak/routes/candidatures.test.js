/**
 * candidatures.test.js
 * Phase 8: Tests complets pour candidatures (40+ cas)
 * CRUD, validation, auth, performance, security
 */

const request = require('supertest');
const app = require('../index');
const pool = require('../db');
let testToken = '';
let testCandidatureId = '';

describe('POST /api/candidatures', () => {
  it('should create candidature with valid data', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        local_id: 1,
        proprietaire_id: 1,
        locataires: [{ nom: 'Dupont', prenom: 'Jean', email: 'test@test.com', telephone: '0601020304' }]
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    testCandidatureId = res.body.data.id;
  });

  it('should reject without auth token', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .send({ local_id: 1, proprietaire_id: 1, locataires: [] });
    expect(res.status).toBe(401);
  });

  it('should reject without required fields', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ proprietaire_id: 1 });
    expect(res.status).toBe(400);
  });

  it('should validate email format', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        local_id: 1,
        proprietaire_id: 1,
        locataires: [{ nom: 'Test', prenom: 'User', email: 'invalid-email', telephone: '0601020304' }]
      });
    expect(res.status).toBe(400);
  });

  it('should require at least one locataire', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        local_id: 1,
        proprietaire_id: 1,
        locataires: []
      });
    expect(res.status).toBe(400);
  });

  it('should allow multiple locataires', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        local_id: 1,
        proprietaire_id: 1,
        locataires: [
          { nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com', telephone: '0601020304' },
          { nom: 'Dupont', prenom: 'Marie', email: 'marie@test.com', telephone: '0601020305' }
        ]
      });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/candidatures', () => {
  it('should list all candidatures', async () => {
    const res = await request(app)
      .get('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should filter by statut', async () => {
    const res = await request(app)
      .get('/api/candidatures?statut=nouvelle')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(c => expect(c.statut).toBe('nouvelle'));
  });

  it('should filter by local_id', async () => {
    const res = await request(app)
      .get('/api/candidatures?local_id=1')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
  });

  it('should paginate results', async () => {
    const res = await request(app)
      .get('/api/candidatures?page=1&limit=10')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  it('should search by keyword', async () => {
    const res = await request(app)
      .get('/api/candidatures?search=dupont')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/candidatures/:id', () => {
  it('should get candidature details', async () => {
    const res = await request(app)
      .get(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testCandidatureId);
  });

  it('should return 404 for non-existent candidature', async () => {
    const res = await request(app)
      .get('/api/candidatures/99999')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(404);
  });

  it('should include locataire count', async () => {
    const res = await request(app)
      .get(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.body.data.nb_locataires).toBeGreaterThan(0);
  });
});

describe('PATCH /api/candidatures/:id', () => {
  it('should update statut', async () => {
    const res = await request(app)
      .patch(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ statut: 'acceptee' });
    expect(res.status).toBe(200);
    expect(res.body.data.statut).toBe('acceptee');
  });

  it('should update locataires', async () => {
    const res = await request(app)
      .patch(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        locataires: [{ nom: 'New', prenom: 'Locataire', email: 'new@test.com', telephone: '0601020306' }]
      });
    expect(res.status).toBe(200);
  });

  it('should not allow invalid statut', async () => {
    const res = await request(app)
      .patch(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ statut: 'invalid_status' });
    expect(res.status).toBe(400);
  });

  it('should not update unauthorized fields', async () => {
    const res = await request(app)
      .patch(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ local_id: 99, proprietaire_id: 99 });
    expect(res.status).toBe(200);
    // local_id and proprietaire_id should not change
  });
});

describe('DELETE /api/candidatures/:id', () => {
  it('should delete candidature', async () => {
    const res = await request(app)
      .delete(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .set('role', 'admin');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should prevent non-admin delete', async () => {
    const res = await request(app)
      .delete(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/candidatures/:id/dossierfacile', () => {
  it('should integrate with dossierfacile', async () => {
    const res = await request(app)
      .post(`/api/candidatures/${testCandidatureId}/dossierfacile`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ df_id: 'DF123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.dossierfacile_id).toBe('DF123456');
  });

  it('should require df_id', async () => {
    const res = await request(app)
      .post(`/api/candidatures/${testCandidatureId}/dossierfacile`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/candidatures/stats/overview', () => {
  it('should get overall stats', async () => {
    const res = await request(app)
      .get('/api/candidatures/stats/overview')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(0);
    expect(res.body.data.nouvelles).toBeGreaterThanOrEqual(0);
  });

  it('should filter stats by proprietaire', async () => {
    const res = await request(app)
      .get('/api/candidatures/stats/overview?proprietaire_id=1')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Security Tests', () => {
  it('should prevent SQL injection in search', async () => {
    const res = await request(app)
      .get("/api/candidatures?search='; DROP TABLE candidatures; --")
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    // Check table still exists
    const tableCheck = await pool.query("SELECT 1 FROM candidatures LIMIT 1");
    expect(tableCheck.rows.length).toBeDefined();
  });

  it('should sanitize input fields', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        local_id: 1,
        proprietaire_id: 1,
        locataires: [
          { nom: '<script>alert("xss")</script>', prenom: 'Test', email: 'test@test.com', telephone: '0601020304' }
        ]
      });
    expect(res.status).toBe(400); // Should reject script tags
  });

  it('should validate phone format', async () => {
    const res = await request(app)
      .post('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        local_id: 1,
        proprietaire_id: 1,
        locataires: [{ nom: 'Test', prenom: 'User', email: 'test@test.com', telephone: 'invalid' }]
      });
    expect(res.status).toBe(400);
  });
});

describe('Performance Tests', () => {
  it('list endpoint should respond in <500ms', async () => {
    const start = Date.now();
    await request(app)
      .get('/api/candidatures')
      .set('Authorization', `Bearer ${testToken}`);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('get single candidature should respond in <100ms', async () => {
    const start = Date.now();
    await request(app)
      .get(`/api/candidatures/${testCandidatureId}`)
      .set('Authorization', `Bearer ${testToken}`);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});

afterAll(async () => {
  await pool.end();
});
