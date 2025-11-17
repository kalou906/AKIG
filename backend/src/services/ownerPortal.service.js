/**
 * Owner Portal Service
 * backend/src/services/ownerPortal.service.js
 * 
 * Service pour le portail propriétaire
 */

const pool = require('../db');
const logger = require('./logger');

class OwnerPortalService {
  /**
   * Récupère l'overview du propriétaire
   */
  static async getOwnerOverview(userId) {
    try {
      // Récupérer les propriétés du propriétaire
      const propsResult = await pool.query(
        `SELECT id, name, address, city, postal_code, surface, rooms, status
         FROM properties WHERE owner_id = $1 ORDER BY name`,
        [userId]
      );

      // Récupérer le flux de trésorerie
      const cashflowResult = await pool.query(
        `SELECT calc_cashflow_owner($1) as cashflow`,
        [userId]
      );

      // Récupérer les arriérés
      const arrearsResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_arrears
         FROM invoices 
         WHERE status = 'overdue' AND owner_id = $1`,
        [userId]
      );

      // Récupérer les loyers attendus ce mois
      const expectedRentResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_expected
         FROM invoices 
         WHERE status = 'pending' 
         AND owner_id = $1
         AND EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [userId]
      );

      // Récupérer les loyers reçus ce mois
      const receivedRentResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_received
         FROM payments 
         WHERE owner_id = $1
         AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [userId]
      );

      return {
        properties: propsResult.rows,
        propertyCount: propsResult.rows.length,
        cashflow: cashflowResult.rows[0]?.cashflow || 0,
        arrears: parseFloat(arrearsResult.rows[0]?.total_arrears || 0),
        expectedRent: parseFloat(expectedRentResult.rows[0]?.total_expected || 0),
        receivedRent: parseFloat(receivedRentResult.rows[0]?.total_received || 0),
      };
    } catch (error) {
      logger.error('Error fetching owner overview', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Récupère les propriétés du propriétaire
   */
  static async getOwnerProperties(userId) {
    try {
      const result = await pool.query(
        `SELECT id, name, address, city, postal_code, surface, rooms, status, created_at
         FROM properties 
         WHERE owner_id = $1 
         ORDER BY name`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching owner properties', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Récupère les détails d'une propriété
   */
  static async getPropertyDetails(propertyId, userId) {
    try {
      // Vérifier que le propriétaire a accès à cette propriété
      const result = await pool.query(
        `SELECT id, name, address, city, postal_code, surface, rooms, status, 
                rental_value, property_type, year_built, last_renovation
         FROM properties 
         WHERE id = $1 AND owner_id = $2`,
        [propertyId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const property = result.rows[0];

      // Récupérer les locataires actuels
      const tenantsResult = await pool.query(
        `SELECT id, first_name, last_name, email, phone, move_in_date
         FROM tenants 
         WHERE property_id = $1 AND status = 'active'`,
        [propertyId]
      );

      // Récupérer les contrats
      const contractsResult = await pool.query(
        `SELECT id, tenant_id, start_date, end_date, monthly_rent, status
         FROM contracts 
         WHERE property_id = $1 
         ORDER BY start_date DESC
         LIMIT 10`,
        [propertyId]
      );

      // Récupérer les factures récentes
      const invoicesResult = await pool.query(
        `SELECT id, tenant_id, amount, status, due_date, created_at
         FROM invoices 
         WHERE property_id = $1 
         ORDER BY created_at DESC
         LIMIT 10`,
        [propertyId]
      );

      return {
        property,
        tenants: tenantsResult.rows,
        contracts: contractsResult.rows,
        invoices: invoicesResult.rows,
      };
    } catch (error) {
      logger.error('Error fetching property details', { error: error.message, propertyId, userId });
      throw error;
    }
  }

  /**
   * Récupère le cash flow par propriété
   */
  static async getPropertyCashflow(propertyId, userId) {
    try {
      const result = await pool.query(
        `SELECT 
           p.id,
           p.name,
           COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as income,
           COALESCE(SUM(CASE WHEN e.type = 'maintenance' THEN e.amount ELSE 0 END), 0) as maintenance,
           COALESCE(SUM(CASE WHEN e.type = 'tax' THEN e.amount ELSE 0 END), 0) as taxes,
           COALESCE(SUM(CASE WHEN e.type = 'insurance' THEN e.amount ELSE 0 END), 0) as insurance,
           COALESCE(SUM(CASE WHEN e.type = 'other' THEN e.amount ELSE 0 END), 0) as other_expenses
         FROM properties p
         LEFT JOIN invoices i ON p.id = i.property_id AND i.status = 'paid'
         LEFT JOIN expenses e ON p.id = e.property_id
         WHERE p.id = $1 AND p.owner_id = $2
         GROUP BY p.id, p.name`,
        [propertyId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        propertyId: row.id,
        propertyName: row.name,
        income: parseFloat(row.income || 0),
        expenses: {
          maintenance: parseFloat(row.maintenance || 0),
          taxes: parseFloat(row.taxes || 0),
          insurance: parseFloat(row.insurance || 0),
          other: parseFloat(row.other_expenses || 0),
        },
        totalExpenses:
          parseFloat(row.maintenance || 0) +
          parseFloat(row.taxes || 0) +
          parseFloat(row.insurance || 0) +
          parseFloat(row.other_expenses || 0),
        netCashflow:
          parseFloat(row.income || 0) -
          (parseFloat(row.maintenance || 0) +
            parseFloat(row.taxes || 0) +
            parseFloat(row.insurance || 0) +
            parseFloat(row.other_expenses || 0)),
      };
    } catch (error) {
      logger.error('Error fetching property cashflow', { error: error.message, propertyId, userId });
      throw error;
    }
  }

  /**
   * Récupère les factures du propriétaire
   */
  static async getOwnerInvoices(userId, filters = {}) {
    try {
      let query = `
        SELECT i.id, i.property_id, p.name as property_name, i.tenant_id, 
               t.first_name, t.last_name, i.amount, i.status, i.due_date, i.created_at
        FROM invoices i
        JOIN properties p ON i.property_id = p.id
        LEFT JOIN tenants t ON i.tenant_id = t.id
        WHERE i.owner_id = $1
      `;

      const params = [userId];
      let paramCount = 2;

      if (filters.status) {
        query += ` AND i.status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters.propertyId) {
        query += ` AND i.property_id = $${paramCount}`;
        params.push(filters.propertyId);
        paramCount++;
      }

      query += ` ORDER BY i.created_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching owner invoices', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Récupère les paiements du propriétaire
   */
  static async getOwnerPayments(userId, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT p.id, p.property_id, pr.name as property_name, p.amount, 
                p.payment_date, p.payment_method
         FROM payments p
         JOIN properties pr ON p.property_id = pr.id
         WHERE p.owner_id = $1
         ORDER BY p.payment_date DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching owner payments', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Récupère les statistiques du propriétaire
   */
  static async getOwnerStats(userId) {
    try {
      const statsResult = await pool.query(
        `SELECT 
           COUNT(DISTINCT p.id) as total_properties,
           COUNT(DISTINCT t.id) as total_tenants,
           COUNT(DISTINCT c.id) as total_contracts,
           COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as total_income,
           COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.amount ELSE 0 END), 0) as total_arrears,
           COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END), 0) as total_pending
         FROM properties p
         LEFT JOIN tenants t ON p.id = t.property_id
         LEFT JOIN contracts c ON p.id = c.property_id
         LEFT JOIN invoices i ON p.id = i.property_id
         WHERE p.owner_id = $1`,
        [userId]
      );

      const stats = statsResult.rows[0];

      return {
        totalProperties: parseInt(stats.total_properties || 0),
        totalTenants: parseInt(stats.total_tenants || 0),
        totalContracts: parseInt(stats.total_contracts || 0),
        totalIncome: parseFloat(stats.total_income || 0),
        totalArrears: parseFloat(stats.total_arrears || 0),
        totalPending: parseFloat(stats.total_pending || 0),
      };
    } catch (error) {
      logger.error('Error fetching owner stats', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = OwnerPortalService;
