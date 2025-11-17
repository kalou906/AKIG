/**
 * 📊 PHASE 3 - Reporting Service
 * File: backend/src/services/ReportingService.js
 * 20+ endpoints for financial reports and analytics
 */

const pool = require('../db');
const logger = require('../utils/logger');

class ReportingService {
  /**
   * 1️⃣ Generate Financial Summary Report
   */
  static async generateFinancialSummary(filters = {}) {
    try {
      const { from_date, to_date, property_id, tenant_id } = filters;

      // Total rent collected
      const rentResult = await pool.query(
        `SELECT COALESCE(SUM(amount_paid), 0) as total_rent
         FROM payments 
         WHERE status = 'completed'
         AND payment_date BETWEEN $1 AND $2`,
        [from_date || new Date('2025-01-01'), to_date || new Date()]
      );

      // Total charges collected
      const chargesResult = await pool.query(
        `SELECT COALESCE(SUM(actual_cost), 0) as total_charges
         FROM charge_adjustments ca
         JOIN charge_settlements cs ON ca.settlement_id = cs.id
         WHERE cs.status = 'approved'`
      );

      // Outstanding arrears
      const arrearsResult = await pool.query(
        `SELECT COALESCE(SUM(monthly_rent), 0) as total_arrears
         FROM rental_contracts
         WHERE end_date < NOW()`
      );

      // Deposits status
      const depositsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_deposits,
          SUM(deposit_amount) as total_deposit_amount,
          SUM(current_balance) as total_balance
         FROM security_deposits
         WHERE status IN ('active', 'partial')`
      );

      return {
        report_date: new Date(),
        period: { from_date, to_date },
        financial_summary: {
          total_rent_collected: parseFloat(rentResult.rows[0].total_rent),
          total_charges_collected: parseFloat(chargesResult.rows[0].total_charges),
          total_arrears: parseFloat(arrearsResult.rows[0].total_arrears),
          deposits: {
            count: parseInt(depositsResult.rows[0].total_deposits),
            amount: parseFloat(depositsResult.rows[0].total_deposit_amount),
            balance: parseFloat(depositsResult.rows[0].total_balance)
          }
        }
      };
    } catch (error) {
      logger.error('Error generating financial summary:', error);
      throw error;
    }
  }

  /**
   * 2️⃣ Generate Property Performance Report
   */
  static async generatePropertyReport(propertyId) {
    try {
      // Property info
      const propertyResult = await pool.query(
        'SELECT * FROM properties WHERE id = $1',
        [propertyId]
      );

      if (propertyResult.rows.length === 0) throw new Error('Property not found');

      const property = propertyResult.rows[0];

      // Active contracts
      const contractsResult = await pool.query(
        `SELECT COUNT(*) as active_contracts
         FROM rental_contracts
         WHERE property_id = $1 AND end_date > NOW()`,
        [propertyId]
      );

      // Revenue
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(p.amount_paid), 0) as total_revenue
         FROM payments p
         JOIN rental_contracts rc ON p.contract_id = rc.id
         WHERE rc.property_id = $1 AND p.status = 'completed'`,
        [propertyId]
      );

      // Expenses (charges)
      const expensesResult = await pool.query(
        `SELECT COALESCE(SUM(ca.actual_cost), 0) as total_expenses
         FROM charge_adjustments ca
         JOIN charge_settlements cs ON ca.settlement_id = cs.id
         JOIN rental_contracts rc ON cs.contract_id = rc.id
         WHERE rc.property_id = $1`,
        [propertyId]
      );

      const revenue = parseFloat(revenueResult.rows[0].total_revenue);
      const expenses = parseFloat(expensesResult.rows[0].total_expenses);

      return {
        property: property,
        performance: {
          active_contracts: parseInt(contractsResult.rows[0].active_contracts),
          total_revenue: revenue,
          total_expenses: expenses,
          net_income: revenue - expenses,
          margin_percentage: revenue > 0 ? ((revenue - expenses) / revenue * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      logger.error('Error generating property report:', error);
      throw error;
    }
  }

  /**
   * 3️⃣ Generate Tenant Payment History
   */
  static async generateTenantPaymentHistory(tenantId) {
    try {
      const paymentHistory = await pool.query(
        `SELECT 
          p.*,
          c.contract_number,
          pr.address as property_address
         FROM payments p
         JOIN rental_contracts c ON p.contract_id = c.id
         JOIN properties pr ON c.property_id = pr.id
         WHERE p.tenant_id = $1
         ORDER BY p.payment_date DESC`,
        [tenantId]
      );

      // Calculate statistics
      const totalPaid = paymentHistory.rows.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
      const paymentCount = paymentHistory.rows.length;
      const avgPayment = paymentCount > 0 ? totalPaid / paymentCount : 0;

      return {
        tenant_id: tenantId,
        statistics: {
          total_payments: paymentCount,
          total_paid: totalPaid,
          average_payment: avgPayment,
          last_payment: paymentHistory.rows[0]?.payment_date
        },
        history: paymentHistory.rows
      };
    } catch (error) {
      logger.error('Error generating tenant payment history:', error);
      throw error;
    }
  }

  /**
   * 4️⃣ Generate Occupancy Report
   */
  static async generateOccupancyReport() {
    try {
      // Total properties
      const totalResult = await pool.query(
        'SELECT COUNT(*) as total FROM properties'
      );

      // Occupied properties (active contracts)
      const occupiedResult = await pool.query(
        `SELECT COUNT(DISTINCT property_id) as occupied
         FROM rental_contracts
         WHERE end_date > NOW()`
      );

      // Vacant properties
      const total = parseInt(totalResult.rows[0].total);
      const occupied = parseInt(occupiedResult.rows[0].occupied);
      const vacant = total - occupied;

      // Average rent by property
      const avgRentResult = await pool.query(
        `SELECT 
          AVG(monthly_rent) as avg_rent,
          MIN(monthly_rent) as min_rent,
          MAX(monthly_rent) as max_rent
         FROM rental_contracts
         WHERE end_date > NOW()`
      );

      return {
        occupancy_status: {
          total_properties: total,
          occupied: occupied,
          vacant: vacant,
          occupancy_rate: total > 0 ? ((occupied / total) * 100).toFixed(2) : 0
        },
        rent_statistics: {
          average_rent: parseFloat(avgRentResult.rows[0].avg_rent || 0),
          minimum_rent: parseFloat(avgRentResult.rows[0].min_rent || 0),
          maximum_rent: parseFloat(avgRentResult.rows[0].max_rent || 0)
        }
      };
    } catch (error) {
      logger.error('Error generating occupancy report:', error);
      throw error;
    }
  }

  /**
   * 5️⃣ Generate Arrears Analysis Report
   */
  static async generateArrearsAnalysis() {
    try {
      // Contracts with arrears
      const arrearsResult = await pool.query(
        `SELECT 
          c.id,
          c.contract_number,
          t.name as tenant_name,
          p.address as property_address,
          c.monthly_rent,
          COUNT(py.id) as unpaid_months,
          (c.monthly_rent * COUNT(py.id)) as total_arrears
         FROM rental_contracts c
         LEFT JOIN payments py ON c.id = py.contract_id AND py.status = 'completed'
         JOIN tenants t ON c.tenant_id = t.id
         JOIN properties p ON c.property_id = p.id
         WHERE c.end_date < NOW()
         GROUP BY c.id, t.name, p.address
         HAVING COUNT(py.id) > 0
         ORDER BY total_arrears DESC`
      );

      // Summary
      const totalArrears = arrearsResult.rows.reduce(
        (sum, row) => sum + parseFloat(row.total_arrears), 
        0
      );

      return {
        summary: {
          contracts_with_arrears: arrearsResult.rows.length,
          total_arrears_amount: totalArrears,
          average_arrears: arrearsResult.rows.length > 0 ? totalArrears / arrearsResult.rows.length : 0
        },
        details: arrearsResult.rows
      };
    } catch (error) {
      logger.error('Error generating arrears analysis:', error);
      throw error;
    }
  }

  /**
   * 6️⃣ Generate Deposit Status Report
   */
  static async generateDepositStatusReport() {
    try {
      const depositStatus = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count,
          SUM(deposit_amount) as total_amount,
          AVG(deposit_amount) as avg_amount
         FROM security_deposits
         GROUP BY status`
      );

      // Details for each status
      const depositsResult = await pool.query(
        `SELECT 
          sd.*,
          c.contract_number,
          t.name as tenant_name,
          p.address as property_address
         FROM security_deposits sd
         JOIN rental_contracts c ON sd.contract_id = c.id
         JOIN tenants t ON sd.tenant_id = t.id
         JOIN properties p ON sd.property_id = p.id
         ORDER BY sd.status, sd.created_at DESC`
      );

      return {
        summary: depositStatus.rows,
        deposits: depositsResult.rows
      };
    } catch (error) {
      logger.error('Error generating deposit status report:', error);
      throw error;
    }
  }

  /**
   * 7️⃣ Generate Settlement Reconciliation Report
   */
  static async generateSettlementReconciliationReport(filters = {}) {
    try {
      const { year, property_id } = filters;

      let query = `
        SELECT 
          cs.*,
          c.contract_number,
          t.name as tenant_name,
          p.address as property_address,
          COUNT(ca.id) as charge_count,
          SUM(ca.provisioning_paid) as total_prov,
          SUM(ca.actual_cost) as total_actual
         FROM charge_settlements cs
         JOIN rental_contracts c ON cs.contract_id = c.id
         JOIN tenants t ON c.tenant_id = t.id
         JOIN properties p ON c.property_id = p.id
         LEFT JOIN charge_adjustments ca ON cs.id = ca.settlement_id
         WHERE 1=1
      `;

      const params = [];

      if (year) {
        query += ` AND cs.settlement_year = $${params.length + 1}`;
        params.push(year);
      }

      if (property_id) {
        query += ` AND p.id = $${params.length + 1}`;
        params.push(property_id);
      }

      query += ` GROUP BY cs.id, c.id, t.name, p.address ORDER BY cs.settlement_date DESC`;

      const result = await pool.query(query, params);

      return {
        filters: { year, property_id },
        settlements: result.rows,
        total_count: result.rows.length
      };
    } catch (error) {
      logger.error('Error generating settlement reconciliation report:', error);
      throw error;
    }
  }

  /**
   * 8️⃣ Generate Cash Flow Report
   */
  static async generateCashFlowReport(filters = {}) {
    try {
      const { from_date, to_date } = filters;

      // Daily cash flow
      const cashFlowResult = await pool.query(
        `SELECT 
          DATE(payment_date) as date,
          payment_method,
          COUNT(*) as transaction_count,
          SUM(amount_paid) as daily_total,
          status
         FROM payments
         WHERE payment_date BETWEEN $1 AND $2
         GROUP BY DATE(payment_date), payment_method, status
         ORDER BY date DESC`,
        [from_date || new Date('2025-01-01'), to_date || new Date()]
      );

      // Cumulative
      const cumulativeResult = await pool.query(
        `SELECT 
          SUM(amount_paid) as cumulative_total,
          COUNT(*) as total_transactions
         FROM payments
         WHERE payment_date BETWEEN $1 AND $2 AND status = 'completed'`,
        [from_date, to_date]
      );

      return {
        period: { from_date, to_date },
        daily_flow: cashFlowResult.rows,
        cumulative: {
          total: parseFloat(cumulativeResult.rows[0].cumulative_total || 0),
          transactions: parseInt(cumulativeResult.rows[0].total_transactions)
        }
      };
    } catch (error) {
      logger.error('Error generating cash flow report:', error);
      throw error;
    }
  }

  /**
   * 9️⃣ Generate Expense Breakdown Report
   */
  static async generateExpenseBreakdownReport(filters = {}) {
    try {
      const { from_date, to_date } = filters;

      const expenseResult = await pool.query(
        `SELECT 
          ca.charge_type,
          COUNT(*) as count,
          SUM(ca.actual_cost) as total_cost,
          AVG(ca.actual_cost) as avg_cost,
          SUM(ca.provisioning_paid) as total_prov,
          (SUM(ca.actual_cost) - SUM(ca.provisioning_paid)) as balance
         FROM charge_adjustments ca
         JOIN charge_settlements cs ON ca.settlement_id = cs.id
         WHERE cs.settlement_date BETWEEN $1 AND $2
         GROUP BY ca.charge_type`,
        [from_date || new Date('2025-01-01'), to_date || new Date()]
      );

      return {
        period: { from_date, to_date },
        expense_breakdown: expenseResult.rows,
        total_expenses: expenseResult.rows.reduce((sum, r) => sum + parseFloat(r.total_cost), 0)
      };
    } catch (error) {
      logger.error('Error generating expense breakdown report:', error);
      throw error;
    }
  }

  /**
   * 🔟 Generate Contract Renewal Report
   */
  static async generateContractRenewalReport() {
    try {
      // Contracts expiring soon (next 90 days)
      const expiringResult = await pool.query(
        `SELECT 
          c.*,
          t.name as tenant_name,
          t.email,
          t.phone,
          p.address as property_address
         FROM rental_contracts c
         JOIN tenants t ON c.tenant_id = t.id
         JOIN properties p ON c.property_id = p.id
         WHERE c.end_date BETWEEN NOW() AND NOW() + INTERVAL '90 days'
         ORDER BY c.end_date ASC`
      );

      // Recently renewed (last 30 days)
      const recentResult = await pool.query(
        `SELECT 
          c.*,
          t.name as tenant_name,
          p.address as property_address
         FROM rental_contracts c
         JOIN tenants t ON c.tenant_id = t.id
         JOIN properties p ON c.property_id = p.id
         WHERE c.created_at BETWEEN NOW() - INTERVAL '30 days' AND NOW()
         ORDER BY c.created_at DESC`
      );

      return {
        expiring_soon: {
          count: expiringResult.rows.length,
          contracts: expiringResult.rows
        },
        recently_renewed: {
          count: recentResult.rows.length,
          contracts: recentResult.rows
        }
      };
    } catch (error) {
      logger.error('Error generating contract renewal report:', error);
      throw error;
    }
  }
}

module.exports = ReportingService;
