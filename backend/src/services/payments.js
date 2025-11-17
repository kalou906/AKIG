/**
 * Service de validation des paiements
 */

const { trace } = require('@opentelemetry/api');

// Obtenir un traceur pour ce service
const tracer = trace.getTracer('akig-payments');

class PaymentValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'PaymentValidationError';
  }
}

/**
 * Valide un paiement avant traitement
 * @param {Object} payment - Objet paiement à valider
 * @throws {PaymentValidationError} Si validation échoue
 */
function validatePayment(payment) {
  const span = tracer.startSpan('validatePayment');
  
  try {
    if (!payment) {
      const error = new PaymentValidationError('INVALID_PAYMENT', 'Paiement invalide');
      span.recordException(error);
      throw error;
    }

    span.setAttributes({
      'payment.amount': payment.amount || 0,
      'payment.invoice_id': payment.invoiceId || 'unknown',
    });

    // Valider le montant
    if (payment.amount === undefined || payment.amount === null) {
      const error = new PaymentValidationError('MISSING_AMOUNT', 'Montant manquant');
      span.recordException(error);
      throw error;
    }

    if (typeof payment.amount !== 'number' || payment.amount < 0) {
      const error = new PaymentValidationError('INVALID_AMOUNT', 'Montant invalide (doit être >= 0)');
      span.recordException(error);
      throw error;
    }

    // Valider l'état de la facture si présent
    if (payment.invoiceStatus) {
      const validStatuses = ['pending', 'partial', 'paid', 'cancelled'];
      if (!validStatuses.includes(payment.invoiceStatus)) {
        const error = new PaymentValidationError('INVALID_INVOICE_STATUS', `Statut facture invalide: ${payment.invoiceStatus}`);
        span.recordException(error);
        throw error;
      }

      // Une facture annulée ne peut pas être payée
      if (payment.invoiceStatus === 'cancelled') {
        const error = new PaymentValidationError('INVOICE_NOT_PAYABLE', 'Facture annulée: paiement impossible');
        span.recordException(error);
        throw error;
      }

      span.setAttribute('payment.invoice_status', payment.invoiceStatus);
    }

    span.setStatus({ code: 0 }); // OK
    return true;
  } finally {
    span.end();
  }
}

/**
 * Calcule le montant total d'un paiement avec frais
 * @param {number} baseAmount - Montant de base
 * @param {string} method - Méthode de paiement (cash, mobile_money, bank)
 * @returns {number} Montant total avec frais
 */
function calculateTotalWithFees(baseAmount, method) {
  const span = tracer.startSpan('calculateTotalWithFees');
  
  try {
    span.setAttributes({
      'payment.base_amount': baseAmount,
      'payment.method': method,
    });

    const fees = {
      cash: 0,
      mobile_money: baseAmount * 0.02, // 2% pour mobile money
      bank: baseAmount * 0.01 // 1% pour virement
    };

    const totalAmount = baseAmount + (fees[method] || 0);
    
    span.setAttributes({
      'payment.fee_amount': fees[method] || 0,
      'payment.total_amount': totalAmount,
    });

    return totalAmount;
  } finally {
    span.end();
  }
}

module.exports = {
  validatePayment,
  calculateTotalWithFees,
  PaymentValidationError
};
