/**
 * Service de gestion des factures
 */

const { pool } = require('../db');

/**
 * Récupère une facture par ID
 * @param {number} invoiceId - ID de la facture
 * @returns {Promise<Object>} Objet facture
 */
async function getInvoiceById(invoiceId) {
  const query = `
    SELECT id, contract_id, amount, status, created_at, due_date
    FROM invoices
    WHERE id = $1
  `;
  const result = await pool.query(query, [invoiceId]);
  return result.rows[0] || null;
}

/**
 * Vérifie si une facture peut être payée
 * @param {Object} invoice - Objet facture
 * @returns {Object} Résultat de la vérification
 */
function checkInvoicePayable(invoice) {
  if (!invoice) {
    return {
      payable: false,
      code: 'INVOICE_NOT_FOUND',
      message: 'Facture non trouvée'
    };
  }

  if (invoice.status === 'cancelled') {
    return {
      payable: false,
      code: 'INVOICE_NOT_PAYABLE',
      message: 'Facture annulée: paiement impossible'
    };
  }

  if (invoice.status === 'paid') {
    return {
      payable: false,
      code: 'INVOICE_ALREADY_PAID',
      message: 'Facture déjà payée'
    };
  }

  return {
    payable: true,
    code: 'OK',
    message: 'Facture peut être payée'
  };
}

/**
 * Enregistre un paiement pour une facture
 * @param {number} invoiceId - ID de la facture
 * @param {number} amount - Montant payé
 * @param {string} method - Méthode de paiement
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Paiement enregistré
 */
async function recordPayment(invoiceId, amount, method, userId) {
  const query = `
    INSERT INTO payments (invoice_id, amount, method, paid_by, paid_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, invoice_id, amount, method, paid_at
  `;
  
  const result = await pool.query(query, [invoiceId, amount, method, userId]);
  return result.rows[0];
}

/**
 * Met à jour le statut d'une facture
 * @param {number} invoiceId - ID de la facture
 * @param {string} status - Nouveau statut (pending, partial, paid, cancelled)
 * @returns {Promise<Object>} Facture mise à jour
 */
async function updateInvoiceStatus(invoiceId, status) {
  const validStatuses = ['pending', 'partial', 'paid', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Statut invalide: ${status}`);
  }

  const query = `
    UPDATE invoices
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, status, updated_at
  `;
  
  const result = await pool.query(query, [status, invoiceId]);
  return result.rows[0];
}

/**
 * Récupère toutes les factures d'un contrat
 * @param {number} contractId - ID du contrat
 * @returns {Promise<Array>} Liste des factures
 */
async function getInvoicesByContractId(contractId) {
  const query = `
    SELECT id, contract_id, amount, status, created_at, due_date
    FROM invoices
    WHERE contract_id = $1
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query, [contractId]);
  return result.rows;
}

module.exports = {
  getInvoiceById,
  checkInvoicePayable,
  recordPayment,
  updateInvoiceStatus,
  getInvoicesByContractId
};
