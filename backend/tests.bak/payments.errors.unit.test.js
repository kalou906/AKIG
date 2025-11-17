// backend/tests/payments.errors.unit.test.js
const { validatePayment, PaymentValidationError } = require('../src/services/payments');

describe('validatePayment', () => {
  it('refuse un paiement < 0', () => {
    expect(() => validatePayment({ amount: -1 })).toThrow();
    try {
      validatePayment({ amount: -1 });
    } catch (e) {
      expect(e.code).toBe('INVALID_AMOUNT');
    }
  });

  it('refuse une facture invalide', () => {
    try {
      validatePayment({ invoiceStatus: 'cancelled', amount: 1000 });
      fail('Should have thrown');
    } catch (e) {
      expect(e.code).toBe('INVOICE_NOT_PAYABLE');
    }
  });

  it('accepte un paiement valide', () => {
    expect(() => validatePayment({ amount: 1000 })).not.toThrow();
  });

  it('refuse un montant manquant', () => {
    try {
      validatePayment({ invoiceStatus: 'pending' });
      fail('Should have thrown');
    } catch (e) {
      expect(e.code).toBe('MISSING_AMOUNT');
    }
  });

  it('refuse un montant invalide (non numérique)', () => {
    try {
      validatePayment({ amount: 'mille' });
      fail('Should have thrown');
    } catch (e) {
      expect(e.code).toBe('INVALID_AMOUNT');
    }
  });

  it('accepte un paiement avec statut facture valide (pending)', () => {
    expect(() => validatePayment({ 
      amount: 1000, 
      invoiceStatus: 'pending' 
    })).not.toThrow();
  });

  it('accepte un paiement avec statut facture valide (partial)', () => {
    expect(() => validatePayment({ 
      amount: 500, 
      invoiceStatus: 'partial' 
    })).not.toThrow();
  });

  it('refuse un statut facture invalide', () => {
    try {
      validatePayment({ 
        amount: 1000, 
        invoiceStatus: 'unknown' 
      });
      fail('Should have thrown');
    } catch (e) {
      expect(e.code).toBe('INVALID_INVOICE_STATUS');
    }
  });

  it('refuse un objet paiement null', () => {
    try {
      validatePayment(null);
      fail('Should have thrown');
    } catch (e) {
      expect(e.code).toBe('INVALID_PAYMENT');
    }
  });

  it('refuse un objet paiement undefined', () => {
    try {
      validatePayment(undefined);
      fail('Should have thrown');
    } catch (e) {
      expect(e.code).toBe('INVALID_PAYMENT');
    }
  });
});
