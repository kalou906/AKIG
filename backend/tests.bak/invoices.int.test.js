// backend/tests/invoices.int.test.js
const request = require('supertest');
const app = require('../src/index');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Générer un token valide pour les tests
const mockToken = jwt.sign(
  { id: 1, email: 'test@example.com', role: 'user' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

describe('POST /api/payments - Validations de champs', () => {
  test('refuse paiement sans token', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ contract_id: 1, paid_at: '2025-01-01', amount: 1000 });
    
    expect(res.statusCode).toBe(401);
  });

  test('refuse paiement si montant manquant', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ contract_id: 1, paid_at: '2025-01-01' });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Missing fields');
  });

  test('refuse paiement si contract_id manquant', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ paid_at: '2025-01-01', amount: 1000 });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Missing fields');
  });

  test('refuse paiement si date manquante', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ contract_id: 1, amount: 1000 });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Missing fields');
  });
});

describe('GET /api/health', () => {
  test('vérifie que l\'endpoint santé fonctionne', async () => {
    const res = await request(app)
      .get('/api/health');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Invoice Service - checkInvoicePayable', () => {
  const { checkInvoicePayable } = require('../src/services/invoices');

  test('accepte facture en statut pending', () => {
    const invoice = { id: 1, status: 'pending', amount: 1000 };
    const result = checkInvoicePayable(invoice);
    expect(result.payable).toBe(true);
  });

  test('accepte facture en statut partial', () => {
    const invoice = { id: 1, status: 'partial', amount: 1000 };
    const result = checkInvoicePayable(invoice);
    expect(result.payable).toBe(true);
  });

  test('refuse facture annulée', () => {
    const invoice = { id: 1, status: 'cancelled', amount: 1000 };
    const result = checkInvoicePayable(invoice);
    expect(result.payable).toBe(false);
    expect(result.code).toBe('INVOICE_NOT_PAYABLE');
  });

  test('refuse facture déjà payée', () => {
    const invoice = { id: 1, status: 'paid', amount: 1000 };
    const result = checkInvoicePayable(invoice);
    expect(result.payable).toBe(false);
    expect(result.code).toBe('INVOICE_ALREADY_PAID');
  });

  test('refuse facture inexistante', () => {
    const result = checkInvoicePayable(null);
    expect(result.payable).toBe(false);
    expect(result.code).toBe('INVOICE_NOT_FOUND');
  });
});
