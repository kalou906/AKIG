/**
 * Service de gestion des paiements
 * backend/src/services/payments.service.js
 */

const pool = require('../db');
const { DatabaseError, ValidationError, NotFoundError } = require('../utils/errors');
const { formatGNF } = require('../utils/formatters');
const { PAYMENT_STATUS } = require('../config/constants');

class PaymentsService {
  /**
   * Récupère tous les paiements avec pagination et filtres
   */
  static async getPayments(filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'created_at', order = 'DESC' } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, t.full_name as tenant_name, c.title as contract_title
      FROM payments p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN contracts c ON p.contract_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Filtres
    if (filters.status) {
      params.push(filters.status);
      query += ` AND p.status = $${++paramCount}`;
    }

    if (filters.tenant_id) {
      params.push(filters.tenant_id);
      query += ` AND p.tenant_id = $${++paramCount}`;
    }

    if (filters.contract_id) {
      params.push(filters.contract_id);
      query += ` AND p.contract_id = $${++paramCount}`;
    }

    if (filters.minAmount !== undefined) {
      params.push(filters.minAmount);
      query += ` AND p.amount >= $${++paramCount}`;
    }

    if (filters.maxAmount !== undefined) {
      params.push(filters.maxAmount);
      query += ` AND p.amount <= $${++paramCount}`;
    }

    if (filters.startDate) {
      params.push(new Date(filters.startDate));
      query += ` AND p.created_at >= $${++paramCount}`;
    }

    if (filters.endDate) {
      params.push(new Date(filters.endDate));
      query += ` AND p.created_at <= $${++paramCount}`;
    }

    // Tri
    const validSortFields = ['id', 'created_at', 'amount', 'status', 'payment_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    params.push(limit);
    query += ` LIMIT $${++paramCount}`;

    params.push(offset);
    query += ` OFFSET $${++paramCount}`;

    try {
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM payments p WHERE 1=1${
          filters.status ? ` AND p.status = $1` : ''
        }`,
        filters.status ? [filters.status] : []
      );

      const result = await pool.query(query, params);

      return {
        data: result.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        limit,
      };
    } catch (error) {
      throw new DatabaseError('Erreur lors de la récupération des paiements', error.message);
    }
  }

  /**
   * Récupère un paiement par ID
   */
  static async getPaymentById(id) {
    try {
      const result = await pool.query(
        `SELECT p.*, t.full_name as tenant_name, c.title as contract_title
         FROM payments p
         LEFT JOIN tenants t ON p.tenant_id = t.id
         LEFT JOIN contracts c ON p.contract_id = c.id
         WHERE p.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Paiement');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Erreur lors de la récupération du paiement', error.message);
    }
  }

  /**
   * Crée un nouveau paiement
   */
  static async createPayment(paymentData) {
    const { tenant_id, contract_id, amount, reference, payment_date, due_date } = paymentData;

    // Validations
    if (!tenant_id && !contract_id) {
      throw new ValidationError('Tenant ou contrat requis');
    }

    if (!amount || amount <= 0) {
      throw new ValidationError('Montant doit être supérieur à 0');
    }

    try {
      const result = await pool.query(
        `INSERT INTO payments (tenant_id, contract_id, amount, status, reference, payment_date, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          tenant_id || null,
          contract_id || null,
          amount,
          PAYMENT_STATUS.PENDING,
          reference || null,
          payment_date || null,
          due_date || null,
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Erreur lors de la création du paiement', error.message);
    }
  }

  /**
   * Met à jour un paiement
   */
  static async updatePayment(id, updateData) {
    const { status, amount, reference, payment_date } = updateData;

    try {
      const fields = [];
      const params = [];
      let paramCount = 1;

      if (status) {
        fields.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (amount !== undefined) {
        fields.push(`amount = $${paramCount++}`);
        params.push(amount);
      }

      if (reference) {
        fields.push(`reference = $${paramCount++}`);
        params.push(reference);
      }

      if (payment_date) {
        fields.push(`payment_date = $${paramCount++}`);
        params.push(payment_date);
      }

      fields.push(`updated_at = NOW()`);

      params.push(id);

      const query = `UPDATE payments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        throw new NotFoundError('Paiement');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Erreur lors de la mise à jour du paiement', error.message);
    }
  }

  /**
   * Supprime un paiement
   */
  static async deletePayment(id) {
    try {
      const result = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        throw new NotFoundError('Paiement');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Erreur lors de la suppression du paiement', error.message);
    }
  }

  /**
   * Récupère les statistiques de paiement
   */
  static async getPaymentStats(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filters.tenant_id) {
        whereClause += ` AND tenant_id = $${params.length + 1}`;
        params.push(filters.tenant_id);
      }

      if (filters.status) {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(filters.status);
      }

      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_received,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
          AVG(amount) as avg_amount,
          MAX(amount) as max_amount,
          MIN(amount) as min_amount
         FROM payments ${whereClause}`,
        params
      );

      const stats = result.rows[0];
      return {
        totalPayments: parseInt(stats.total_payments),
        totalReceived: formatGNF(stats.total_received || 0),
        totalPending: formatGNF(stats.total_pending || 0),
        averageAmount: formatGNF(stats.avg_amount || 0),
        maxAmount: formatGNF(stats.max_amount || 0),
        minAmount: formatGNF(stats.min_amount || 0),
      };
    } catch (error) {
      throw new DatabaseError('Erreur lors de la récupération des statistiques', error.message);
    }
  }

  /**
   * Récupère les paiements en retard
   */
  static async getOverduePayments(daysThreshold = 30) {
    try {
      const result = await pool.query(
        `SELECT p.*, t.full_name as tenant_name
         FROM payments p
         LEFT JOIN tenants t ON p.tenant_id = t.id
         WHERE p.status != 'completed' 
         AND CURRENT_DATE - p.due_date >= $1
         ORDER BY p.due_date ASC`,
        [daysThreshold]
      );

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Erreur lors de la récupération des paiements en retard', error.message);
    }
  }
}

module.exports = PaymentsService;
