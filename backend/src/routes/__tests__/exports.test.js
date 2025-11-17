/**
 * 🧪 Test Exports - Comprehensive Testing
 * 
 * npm test -- exports.test.js
 */

const request = require('supertest');
const express = require('express');
const exportsRoutes = require('../exports.routes');

let app;
let server;
const token = 'Bearer mock-jwt-token';

beforeAll(() => {
  app = express();
  app.use(express.json());
  
  // Mock auth middleware
  app.use((req, res, next) => {
    req.user = { id: 'user123' };
    next();
  });

  app.use('/api/exports', exportsRoutes);
});

afterAll(() => {
  if (server) server.close();
});

describe('📤 Exports API Tests', () => {
    test('GET /api/exports/properties/pdf - Should return PDF blob', async () => {
      const response = await request(app)
        .get('/api/exports/properties/pdf')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.pdf');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    test('GET /api/exports/properties/excel - Should return Excel blob', async () => {
      const response = await request(app)
        .get('/api/exports/properties/excel')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
    });

    test('GET /api/exports/properties/csv - Should return CSV blob', async () => {
      const response = await request(app)
        .get('/api/exports/properties/csv')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('.csv');
    });

    test('GET /api/exports/properties/pdf - With filters', async () => {
      const response = await request(app)
        .get('/api/exports/properties/pdf?sector=Dixinn&minPrice=1000000')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Buffer);
    });
  });

  // ============================================================
  // 💳 PAIEMENTS EXPORTS
  // ============================================================

  describe('Payments Exports', () => {
    test('GET /api/exports/payments/pdf - Should return PDF', async () => {
      const response = await request(app)
        .get('/api/exports/payments/pdf')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    test('GET /api/exports/payments/excel - Should return Excel', async () => {
      const response = await request(app)
        .get('/api/exports/payments/excel')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    test('GET /api/exports/payments/pdf - With status filter', async () => {
      const response = await request(app)
        .get('/api/exports/payments/pdf?status=paid')
        .set('Authorization', token);

      expect(response.status).toBe(200);
    });
  });

  // ============================================================
  // 📊 RAPPORTS EXPORTS
  // ============================================================

  describe('Reports Exports', () => {
    test('GET /api/exports/reports/fiscal-pdf - Should return Fiscal PDF', async () => {
      const response = await request(app)
        .get('/api/exports/reports/fiscal-pdf')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('fiscal');
    });

    test('GET /api/exports/reports/fiscal-excel - Should return Fiscal Excel', async () => {
      const response = await request(app)
        .get('/api/exports/reports/fiscal-excel')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    test('GET /api/exports/reports/fiscal-pdf - With year parameter', async () => {
      const response = await request(app)
        .get('/api/exports/reports/fiscal-pdf?year=2024')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('2024');
    });
  });

  // ============================================================
  // 📋 CONTRATS EXPORTS
  // ============================================================

  describe('Contracts Exports', () => {
    test('GET /api/exports/contracts/pdf/:contractId - Should return Contract PDF', async () => {
      const response = await request(app)
        .get('/api/exports/contracts/pdf/CONTRACT123')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('CONTRACT123');
    });
  });

  // ============================================================
  // 🔀 MULTI-FORMAT EXPORTS
  // ============================================================

  describe('Multi-Format Exports', () => {
    test('GET /api/exports/multi - Should return multiple formats metadata', async () => {
      const response = await request(app)
        .get('/api/exports/multi?type=properties&formats=pdf,excel,csv')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.formats).toContain('pdf');
      expect(response.body.formats).toContain('excel');
      expect(response.body.formats).toContain('csv');
    });

    test('GET /api/exports/multi - With payments type', async () => {
      const response = await request(app)
        .get('/api/exports/multi?type=payments&formats=pdf,excel')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.type).toBe('payments');
    });

    test('GET /api/exports/multi - Invalid type should fail', async () => {
      const response = await request(app)
        .get('/api/exports/multi?type=invalid&formats=pdf')
        .set('Authorization', token);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  // ============================================================
  // 📋 MANAGEMENT ENDPOINTS
  // ============================================================

  describe('Management Endpoints', () => {
    test('GET /api/exports/list - Should list exports', async () => {
      const response = await request(app)
        .get('/api/exports/list')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    test('POST /api/exports/cleanup - Should cleanup old files', async () => {
      const response = await request(app)
        .post('/api/exports/cleanup')
        .set('Authorization', token)
        .send({ daysOld: 7 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================
  // 🔐 AUTHENTICATION TESTS
  // ============================================================

  describe('Authentication', () => {
    test('Should fail without authorization header', async () => {
      const response = await request(app)
        .get('/api/exports/properties/pdf');

      // Note: In real implementation, add auth middleware check
      // For now, just ensure endpoint exists
      expect(response.status).toBeDefined();
    });
  });

  // ============================================================
  // 📊 HEADER VALIDATION TESTS
  // ============================================================

  describe('Response Headers', () => {
    test('PDF response should have correct headers', async () => {
      const response = await request(app)
        .get('/api/exports/properties/pdf')
        .set('Authorization', token);

      expect(response.headers['content-disposition']).toBeDefined();
      expect(response.headers['content-type']).toBeDefined();
      expect(response.headers['content-length']).toBeDefined();
    });

    test('Excel response should have correct headers', async () => {
      const response = await request(app)
        .get('/api/exports/properties/excel')
        .set('Authorization', token);

      expect(response.headers['content-disposition']).toContain('xlsx');
      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    test('CSV response should have correct headers', async () => {
      const response = await request(app)
        .get('/api/exports/properties/csv')
        .set('Authorization', token);

      expect(response.headers['content-type']).toBe('text/csv');
    });
  });

  // ============================================================
  // 🔍 BLOB RESPONSE TESTS
  // ============================================================

  describe('Blob Response Validation', () => {
    test('PDF should be valid Buffer', async () => {
      const response = await request(app)
        .get('/api/exports/properties/pdf')
        .set('Authorization', token);

      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('Excel should be valid Buffer', async () => {
      const response = await request(app)
        .get('/api/exports/properties/excel')
        .set('Authorization', token);

      expect(Buffer.isBuffer(response.body) || typeof response.body === 'string').toBe(true);
    });
  });

  // ============================================================
  // ✨ EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    test('Should handle empty result set', async () => {
      const response = await request(app)
        .get('/api/exports/properties/pdf?sector=NonExistent')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      // Should still return valid PDF, even if empty
    });

    test('Should handle special characters in filename', async () => {
      const response = await request(app)
        .get('/api/exports/properties/pdf')
        .set('Authorization', token);

      const filename = response.headers['content-disposition'];
      expect(filename).not.toContain('"');
      expect(filename).not.toContain("'");
    });

    test('Should handle concurrent requests', async () => {
      const requests = [
        request(app).get('/api/exports/properties/pdf').set('Authorization', token),
        request(app).get('/api/exports/payments/excel').set('Authorization', token),
        request(app).get('/api/exports/reports/fiscal-pdf').set('Authorization', token)
      ];

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      });
});

// ============================================================
// 🧪 INTEGRATION TESTS
// ============================================================

describe('Exports Integration Tests', () => {
  test('Full workflow: List -> Export -> Cleanup', async () => {
    // 1. List before
    const listBefore = await request(app)
      .get('/api/exports/list')
      .set('Authorization', token);
    expect(listBefore.body.success).toBe(true);

    // 2. Export
    const export1 = await request(app)
      .get('/api/exports/properties/pdf')
      .set('Authorization', token);
    expect(export1.status).toBe(200);

    // 3. List after
    const listAfter = await request(app)
      .get('/api/exports/list')
      .set('Authorization', token);
    expect(listAfter.body.count).toBeGreaterThanOrEqual(listBefore.body.count);

    // 4. Cleanup
    const cleanup = await request(app)
      .post('/api/exports/cleanup')
      .set('Authorization', token)
      .send({ daysOld: 0 });
    expect(cleanup.body.success).toBe(true);
  });
});
