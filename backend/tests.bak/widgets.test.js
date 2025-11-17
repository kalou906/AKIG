/**
 * Widgets Integration Tests
 * backend/tests/widgets.test.js
 * 
 * Tests E2E pour le système de widgets
 */

const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/db');

describe('Widgets API', () => {
  let authToken;
  let userId;
  let widgetId;

  // Setup: Authentifier l'utilisateur
  beforeAll(async () => {
    try {
      // Register
      const registerRes = await request(app).post('/api/auth/register').send({
        email: `widget-test-${Date.now()}@test.com`,
        password: 'TestPassword123',
        firstName: 'Widget',
        lastName: 'Tester',
        phoneNumber: '+33600000000',
      });

      authToken = registerRes.body.token;
      userId = registerRes.body.user.id;
    } catch (err) {
      console.error('Setup error:', err);
    }
  });

  // Cleanup
  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/widgets', () => {
    it('should return widgets for authenticated user', async () => {
      const res = await request(app)
        .get('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/widgets');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/widgets/available', () => {
    it('should return available widgets', async () => {
      const res = await request(app)
        .get('/api/widgets/available')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('description');
      expect(res.body[0]).toHaveProperty('icon');
    });
  });

  describe('POST /api/widgets', () => {
    it('should create a new widget', async () => {
      const res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'overview',
          title: 'Test Overview Widget',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('overview');
      expect(res.body.title).toBe('Test Overview Widget');
      expect(res.body.is_visible).toBe(true);

      widgetId = res.body.id;
    });

    it('should fail without widget type', async () => {
      const res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Widget',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should create widget with custom config', async () => {
      const res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'cashflow',
          title: 'My Cashflow',
          config: { months: 24, showPending: true },
          size: 'large',
        });

      expect(res.status).toBe(201);
      expect(res.body.config).toEqual({ months: 24, showPending: true });
      expect(res.body.size).toBe('large');
    });
  });

  describe('GET /api/widgets/:id', () => {
    it('should return a specific widget', async () => {
      const res = await request(app)
        .get(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(widgetId);
      expect(res.body.type).toBe('overview');
    });

    it('should return 404 for non-existent widget', async () => {
      const res = await request(app)
        .get('/api/widgets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/widgets/:id/data', () => {
    it('should fetch widget data', async () => {
      const res = await request(app)
        .get(`/api/widgets/${widgetId}/data`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('type');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('fetchedAt');
    });

    it('should handle different widget types', async () => {
      // Create multiple widgets
      const types = ['cashflow', 'properties', 'payments'];

      for (const type of types) {
        const createRes = await request(app)
          .post('/api/widgets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ type });

        const dataRes = await request(app)
          .get(`/api/widgets/${createRes.body.id}/data`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(dataRes.status).toBe(200);
        expect(dataRes.body.type).toBe(type);
      }
    });

    it('should apply widget configuration', async () => {
      const createRes = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'cashflow',
          config: { months: 6 },
        });

      const dataRes = await request(app)
        .get(`/api/widgets/${createRes.body.id}/data`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(dataRes.status).toBe(200);
      expect(dataRes.body.config.months).toBe(6);
    });
  });

  describe('PATCH /api/widgets/:id', () => {
    it('should update widget title', async () => {
      const res = await request(app)
        .patch(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });

    it('should update widget position', async () => {
      const res = await request(app)
        .patch(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.position).toBe(5);
    });

    it('should update widget config', async () => {
      const res = await request(app)
        .patch(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: { newKey: 'newValue' },
        });

      expect(res.status).toBe(200);
      expect(res.body.config).toEqual({ newKey: 'newValue' });
    });

    it('should update widget visibility', async () => {
      const res = await request(app)
        .patch(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          is_visible: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.is_visible).toBe(false);
    });

    it('should update widget size', async () => {
      const res = await request(app)
        .patch(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: 'large',
        });

      expect(res.status).toBe(200);
      expect(res.body.size).toBe('large');
    });

    it('should fail without update fields', async () => {
      const res = await request(app)
        .patch(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/widgets/toggle/:id', () => {
    it('should toggle widget visibility', async () => {
      const getRes1 = await request(app)
        .get(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const oldVisibility = getRes1.body.is_visible;

      const toggleRes = await request(app)
        .post(`/api/widgets/toggle/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.is_visible).toBe(!oldVisibility);

      const getRes2 = await request(app)
        .get(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes2.body.is_visible).toBe(!oldVisibility);
    });
  });

  describe('POST /api/widgets/reorder', () => {
    it('should reorder widgets', async () => {
      // Créer plusieurs widgets
      const widget1Res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'overview' });

      const widget2Res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'cashflow' });

      const reorderRes = await request(app)
        .post('/api/widgets/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          widgetOrder: [
            { id: widget2Res.body.id, position: 0 },
            { id: widget1Res.body.id, position: 1 },
          ],
        });

      expect(reorderRes.status).toBe(200);
      expect(reorderRes.body.success).toBe(true);
    });

    it('should fail with invalid widgetOrder', async () => {
      const res = await request(app)
        .post('/api/widgets/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          widgetOrder: 'invalid',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/widgets/reset', () => {
    it('should reset to default widgets', async () => {
      const res = await request(app)
        .post('/api/widgets/reset')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.widgets)).toBe(true);
      expect(res.body.widgets.length).toBeGreaterThan(0);

      // Vérifier que les widgets par défaut sont présents
      const types = res.body.widgets.map((w) => w.type);
      expect(types).toContain('overview');
      expect(types).toContain('cashflow');
    });
  });

  describe('DELETE /api/widgets/:id', () => {
    it('should delete a widget', async () => {
      // Créer un widget
      const createRes = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'properties' });

      const deleteId = createRes.body.id;

      // Supprimer
      const deleteRes = await request(app)
        .delete(`/api/widgets/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(204);

      // Vérifier que le widget n'existe plus
      const getRes = await request(app)
        .get(`/api/widgets/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    });

    it('should return 404 when deleting non-existent widget', async () => {
      const res = await request(app)
        .delete('/api/widgets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Authorization', () => {
    it('should not allow deleting another users widget', async () => {
      // Créer un autre utilisateur
      const user2Res = await request(app).post('/api/auth/register').send({
        email: `widget-test-2-${Date.now()}@test.com`,
        password: 'TestPassword123',
        firstName: 'Widget',
        lastName: 'Tester2',
        phoneNumber: '+33600000001',
      });

      const user2Token = user2Res.body.token;

      // Essayer de supprimer le widget du premier utilisateur
      const deleteRes = await request(app)
        .delete(`/api/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(deleteRes.status).toBe(404);
    });
  });
});
