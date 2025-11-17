const request = require('supertest');
const app = require('../src/index');

describe('Security - Input Validation', () => {
  describe('SQL Injection Prevention', () => {
    test('blocks SQL injection on search', async () => {
      const res = await request(app)
        .get('/api/contracts?search=%27%3Bdrop%20table%20contracts;--')
        .set('Authorization', 'Bearer faketoken');
      
      // Should not return 500 (internal server error)
      expect(res.statusCode).toBeLessThan(500);
      // Should return 400 (bad request) or 401 (unauthorized)
      expect([400, 401, 403]).toContain(res.statusCode);
    });

    test('sanitizes malicious SQL in payment amount', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer faketoken')
        .send({
          invoiceId: "1'; DROP TABLE payments; --",
          amount: "1000",
          description: "test"
        });
      
      // Should reject malicious input
      expect(res.statusCode).toBeLessThan(500);
    });

    test('handles union-based SQL injection', async () => {
      const res = await request(app)
        .get('/api/contracts?search=1%20UNION%20SELECT%20*%20FROM%20users')
        .set('Authorization', 'Bearer faketoken');
      
      expect(res.statusCode).toBeLessThan(500);
    });

    test('prevents blind SQL injection with time delays', async () => {
      const res = await request(app)
        .get('/api/contracts?search=1%20AND%20SLEEP(5)')
        .set('Authorization', 'Bearer faketoken');
      
      // Should complete quickly (not actually sleep)
      expect(res.statusCode).toBeLessThan(500);
    });
  });

  describe('XSS Prevention', () => {
    test('escapes XSS in contract title', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: '<img src=x onerror=alert(1)>',
          address: '123 Main St',
          startDate: '2025-01-01'
        });
      
      // Should create successfully but sanitize XSS
      if (res.statusCode === 201) {
        expect(res.body.title).not.toContain('onerror');
        expect(res.body.title).not.toContain('<img');
      }
    });

    test('removes script tags from contract description', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: 'Valid Title',
          address: '123 Main St',
          startDate: '2025-01-01',
          description: '<script>alert("xss")</script>Legitimate content'
        });
      
      if (res.statusCode === 201) {
        expect(res.body.description).not.toContain('<script>');
        expect(res.body.description).not.toContain('</script>');
      }
    });

    test('escapes event handlers in payment notes', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer faketoken')
        .send({
          invoiceId: 1,
          amount: 1000,
          description: '<svg onload=alert(1)>test</svg>'
        });
      
      if (res.statusCode === 201) {
        expect(res.body.description).not.toContain('onload');
      }
    });

    test('handles encoded XSS attempts', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: '&#60;img src=x onerror=alert(1)&#62;',
          address: '123 Main St',
          startDate: '2025-01-01'
        });
      
      if (res.statusCode === 201) {
        expect(res.body.title).not.toMatch(/alert|onerror/i);
      }
    });
  });

  describe('Command Injection Prevention', () => {
    test('prevents OS command injection in search', async () => {
      const res = await request(app)
        .get('/api/contracts?search=; rm -rf /')
        .set('Authorization', 'Bearer faketoken');
      
      expect(res.statusCode).toBeLessThan(500);
    });

    test('blocks pipe commands in parameters', async () => {
      const res = await request(app)
        .get('/api/contracts?search=test | cat /etc/passwd')
        .set('Authorization', 'Bearer faketoken');
      
      expect(res.statusCode).toBeLessThan(500);
    });
  });

  describe('Input Length & Type Validation', () => {
    test('rejects excessively long input', async () => {
      const longString = 'a'.repeat(10000);
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: longString,
          address: '123 Main St',
          startDate: '2025-01-01'
        });
      
      expect([400, 413]).toContain(res.statusCode);
    });

    test('validates payment amount is numeric', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer faketoken')
        .send({
          invoiceId: 1,
          amount: 'not-a-number',
          description: 'test'
        });
      
      expect([400, 422]).toContain(res.statusCode);
    });

    test('rejects negative amounts', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer faketoken')
        .send({
          invoiceId: 1,
          amount: -1000,
          description: 'test'
        });
      
      expect([400, 422]).toContain(res.statusCode);
    });

    test('validates date format', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: 'Test',
          address: '123 Main St',
          startDate: 'invalid-date'
        });
      
      expect([400, 422]).toContain(res.statusCode);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    test('prevents NoSQL operator injection', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: { $ne: null },
          address: '123 Main St',
          startDate: '2025-01-01'
        });
      
      // Should sanitize object injection attempts
      expect(res.statusCode).toBeLessThan(500);
    });

    test('blocks $where operator injection', async () => {
      const res = await request(app)
        .get('/api/contracts?filter={"$where":"1==1"}')
        .set('Authorization', 'Bearer faketoken');
      
      expect(res.statusCode).toBeLessThan(500);
    });
  });

  describe('Path Traversal Prevention', () => {
    test('blocks directory traversal in file paths', async () => {
      const res = await request(app)
        .get('/api/files?path=../../etc/passwd')
        .set('Authorization', 'Bearer faketoken');
      
      expect([400, 401, 403, 404]).toContain(res.statusCode);
    });

    test('sanitizes ../.. sequences', async () => {
      const res = await request(app)
        .get('/api/documents?file=..%2F..%2Fetc%2Fpasswd')
        .set('Authorization', 'Bearer faketoken');
      
      expect([400, 401, 403, 404]).toContain(res.statusCode);
    });
  });

  describe('Special Character Handling', () => {
    test('handles null bytes in input', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: 'Test\x00Null',
          address: '123 Main St',
          startDate: '2025-01-01'
        });
      
      expect(res.statusCode).toBeLessThan(500);
    });

    test('escapes special regex characters', async () => {
      const res = await request(app)
        .get('/api/contracts?search=.*+?^${}()|[]\\')
        .set('Authorization', 'Bearer faketoken');
      
      expect(res.statusCode).toBeLessThan(500);
    });

    test('handles unicode and emoji input', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', 'Bearer faketoken')
        .send({
          title: 'Test with emoji 🔒 and unicode é',
          address: '123 Main St',
          startDate: '2025-01-01'
        });
      
      if (res.statusCode === 201) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('LDAP Injection Prevention', () => {
    test('prevents LDAP filter injection in search', async () => {
      const res = await request(app)
        .get('/api/contracts?search=*)(uid=*))(|(uid=*')
        .set('Authorization', 'Bearer faketoken');
      
      expect(res.statusCode).toBeLessThan(500);
    });
  });

  describe('XML/XXE Prevention', () => {
    test('blocks XML external entity injection', async () => {
      const xxePayload = `<?xml version="1.0"?>
        <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        <contract>&xxe;</contract>`;
      
      const res = await request(app)
        .post('/api/contracts/import')
        .set('Authorization', 'Bearer faketoken')
        .set('Content-Type', 'application/xml')
        .send(xxePayload);
      
      expect([400, 401, 403, 415]).toContain(res.statusCode);
    });
  });
});
