/**
 * 🔧 SETTLEMENT SERVICE - Gestion des Règlements Annuels
 * 
 * Gère tous les règlements (provisioning et régularisation):
 * - Calculs de charges provisionnelles
 * - Règlements annuels
 * - Décomptes de charges
 * - Déduction des dépôts
 */

const pool = require('../db');
const logger = require('../utils/logger');

class SettlementService {
  /**
   * 📊 Calculer les charges provisionnelles pour une charge donnée
   * POST /api/charges/:contractId/provision
   */
  async calculateProvisioning(contract_id, charge_data) {
    try {
      const {
        charge_type, // water, electricity, gas, coproperty, etc.
        monthly_amount,
        annual_estimated,
        start_date,
        notes = ''
      } = charge_data;

      // Récupérer le contrat
      const contractQuery = await pool.query(
        'SELECT id, start_date, end_date FROM rental_contracts WHERE id = $1',
        [contract_id]
      );

      if (contractQuery.rows.length === 0) {
        throw new Error('Contrat introuvable');
      }

      const contract = contractQuery.rows[0];
      const provision = {
        contract_id,
        charge_type,
        monthly_amount: parseFloat(monthly_amount),
        annual_estimated: parseFloat(annual_estimated) || parseFloat(monthly_amount) * 12,
        start_date,
        status: 'active',
        calculations: []
      };

      // Calculer les paiements provisionnels mensuels
      const startDate = new Date(start_date);
      const endDate = new Date(contract.end_date);
      let currentDate = new Date(startDate);
      let totalProvisioning = 0;

      while (currentDate < endDate) {
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const days = currentDate < endDate ? monthEnd.getDate() : 0;

        const monthlyProvisioning = parseFloat(monthly_amount);
        totalProvisioning += monthlyProvisioning;

        provision.calculations.push({
          month: currentDate.toISOString().split('T')[0],
          amount: monthlyProvisioning,
          days: days
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      provision.total_provisioning = totalProvisioning;
      provision.notes = notes;

      return provision;
    } catch (error) {
      logger.error('SettlementService.calculateProvisioning error:', error);
      throw error;
    }
  }

  /**
   * 💳 Effectuer un règlement annuel complet
   * POST /api/charges/:contractId/annual-settlement
   */
  async performAnnualSettlement(contract_id, settlement_data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        settlement_year,
        charges = [], // Array: { type, provisioning_paid, actual_cost }
        deposit_deductions = [],
        settlement_date = new Date().toISOString().split('T')[0],
        notes = ''
      } = settlement_data;

      // Récupérer le contrat et le tenant
      const contractQuery = await client.query(
        `SELECT rc.id, rc.contract_number, rc.monthly_rent, t.id as tenant_id, t.name as tenant_name, d.id as deposit_id
         FROM rental_contracts rc
         LEFT JOIN tenants t ON rc.tenant_id = t.id
         LEFT JOIN security_deposits d ON rc.id = d.contract_id
         WHERE rc.id = $1`,
        [contract_id]
      );

      if (contractQuery.rows.length === 0) {
        throw new Error('Contrat introuvable');
      }

      const contract = contractQuery.rows[0];
      const settlement = {
        contract_id,
        contract_number: contract.contract_number,
        tenant_name: contract.tenant_name,
        settlement_year,
        settlement_date,
        charges_breakdown: [],
        deposit_deductions: deposit_deductions,
        totals: {
          total_provisioning_paid: 0,
          total_actual_cost: 0,
          balance: 0
        }
      };

      // Traiter chaque charge
      for (const charge of charges) {
        const provisioning_paid = parseFloat(charge.provisioning_paid) || 0;
        const actual_cost = parseFloat(charge.actual_cost) || 0;
        const balance = actual_cost - provisioning_paid;

        settlement.charges_breakdown.push({
          charge_type: charge.type,
          provisioning_paid,
          actual_cost,
          balance,
          status: balance > 0 ? 'tenant_pays' : 'owner_refunds'
        });

        settlement.totals.total_provisioning_paid += provisioning_paid;
        settlement.totals.total_actual_cost += actual_cost;
      }

      settlement.totals.balance = 
        settlement.totals.total_actual_cost - settlement.totals.total_provisioning_paid;

      // Enregistrer le règlement
      const settlementRecord = await client.query(
        `INSERT INTO charge_settlements (contract_id, settlement_year, settlement_date, total_provisioning_paid, total_actual_cost, balance, status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id, contract_id, settlement_year, total_provisioning_paid, total_actual_cost, balance, status`,
        [
          contract_id,
          settlement_year,
          settlement_date,
          settlement.totals.total_provisioning_paid,
          settlement.totals.total_actual_cost,
          settlement.totals.balance,
          settlement.totals.balance > 0 ? 'balance_due' : 'refund_due',
          notes
        ]
      );

      const settlementId = settlementRecord.rows[0].id;

      // Enregistrer les détails des charges
      for (const charge of settlement.charges_breakdown) {
        await client.query(
          `INSERT INTO charge_adjustments (settlement_id, charge_type, provisioning_paid, actual_cost, balance, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            settlementId,
            charge.charge_type,
            charge.provisioning_paid,
            charge.actual_cost,
            charge.balance
          ]
        );
      }

      // Traiter les déductions de dépôt
      if (contract.deposit_id && deposit_deductions.length > 0) {
        for (const deduction of deposit_deductions) {
          await client.query(
            `INSERT INTO deposit_movements (deposit_id, movement_type, amount, reason, description, reference_date, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              contract.deposit_id,
              'deduct',
              deduction.amount,
              deduction.type,
              `Déduction de ${deduction.type} - Année ${settlement_year}`,
              settlement_date
            ]
          );
        }
      }

      // Log audit
      await client.query(
        `INSERT INTO communication_log (entity_type, entity_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['charge_settlement', settlementId, 'created', JSON.stringify(settlementRecord.rows[0])]
      );

      await client.query('COMMIT');
      return {
        settlement_id: settlementId,
        ...settlement,
        settlement_record: settlementRecord.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('SettlementService.performAnnualSettlement error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 📋 Obtenir le rapport de règlement pour une année
   * GET /api/charges/:contractId/settlement-report?year=2025
   */
  async getSettlementReport(contract_id, settlement_year) {
    try {
      // Récupérer le règlement principal
      const settlementQuery = await pool.query(
        `SELECT id, contract_id, settlement_year, settlement_date, 
                total_provisioning_paid, total_actual_cost, balance, status, notes
         FROM charge_settlements
         WHERE contract_id = $1 AND settlement_year = $2`,
        [contract_id, settlement_year]
      );

      if (settlementQuery.rows.length === 0) {
        return null;
      }

      const settlement = settlementQuery.rows[0];

      // Récupérer les détails des charges
      const adjustmentsQuery = await pool.query(
        `SELECT id, settlement_id, charge_type, provisioning_paid, actual_cost, balance
         FROM charge_adjustments
         WHERE settlement_id = $1
         ORDER BY charge_type`,
        [settlement.id]
      );

      // Récupérer le contrat pour plus de contexte
      const contractQuery = await pool.query(
        `SELECT rc.contract_number, rc.monthly_rent, rc.start_date, rc.end_date,
                t.name as tenant_name, p.name as property_name
         FROM rental_contracts rc
         LEFT JOIN tenants t ON rc.tenant_id = t.id
         LEFT JOIN properties p ON rc.property_id = p.id
         WHERE rc.id = $1`,
        [contract_id]
      );

      return {
        settlement: settlement,
        charges_breakdown: adjustmentsQuery.rows,
        contract_info: contractQuery.rows[0],
        summary: {
          provisioning_paid: settlement.total_provisioning_paid,
          actual_cost: settlement.total_actual_cost,
          balance_due_to_tenant: settlement.balance > 0 ? 0 : Math.abs(settlement.balance),
          balance_due_to_owner: settlement.balance > 0 ? settlement.balance : 0
        }
      };
    } catch (error) {
      logger.error('SettlementService.getSettlementReport error:', error);
      throw error;
    }
  }

  /**
   * 🔍 Lister tous les règlements d'un contrat
   * GET /api/charges/:contractId/settlements
   */
  async listSettlements(contract_id, filters = {}) {
    try {
      let query = `
        SELECT cs.id, cs.contract_id, cs.settlement_year, cs.settlement_date,
               cs.total_provisioning_paid, cs.total_actual_cost, cs.balance, cs.status,
               rc.contract_number, t.name as tenant_name
        FROM charge_settlements cs
        LEFT JOIN rental_contracts rc ON cs.contract_id = rc.id
        LEFT JOIN tenants t ON rc.tenant_id = t.id
        WHERE cs.contract_id = $1
      `;

      const params = [contract_id];
      let paramCount = 2;

      if (filters.status) {
        query += ` AND cs.status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters.year) {
        query += ` AND cs.settlement_year = $${paramCount}`;
        params.push(filters.year);
        paramCount++;
      }

      query += ' ORDER BY cs.settlement_year DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('SettlementService.listSettlements error:', error);
      throw error;
    }
  }

  /**
   * 💡 Obtenir les charges récentes d'un contrat pour préparer le règlement
   * GET /api/charges/:contractId/recent-charges
   */
  async getRecentCharges(contract_id, months = 12) {
    try {
      const result = await pool.query(
        `SELECT charge_type, monthly_amount, annual_estimated
         FROM charge_adjustments
         WHERE contract_id = $1
         GROUP BY charge_type, monthly_amount, annual_estimated
         ORDER BY charge_type`,
        [contract_id]
      );

      return result.rows;
    } catch (error) {
      logger.error('SettlementService.getRecentCharges error:', error);
      throw error;
    }
  }

  /**
   * 📊 Générer un rapport de régularisation (pour impression/PDF)
   * GET /api/charges/:contractId/settlement-statement?year=2025
   */
  async generateSettlementStatement(contract_id, settlement_year) {
    try {
      const report = await this.getSettlementReport(contract_id, settlement_year);

      if (!report) {
        throw new Error('Rapport de règlement non trouvé');
      }

      // Formater pour PDF/impression
      const statement = {
        title: `Décompte de charges - ${settlement_year}`,
        date: new Date().toLocaleDateString('fr-FR'),
        contract_number: report.contract_info.contract_number,
        property_name: report.contract_info.property_name,
        tenant_name: report.contract_info.tenant_name,
        rent: report.contract_info.monthly_rent,
        period: `Du ${report.contract_info.start_date} au ${report.contract_info.end_date}`,
        
        charges_details: report.charges_breakdown.map(charge => ({
          type: charge.charge_type,
          provisioning: charge.provisioning_paid,
          actual: charge.actual_cost,
          balance: charge.balance,
          status: charge.balance > 0 ? 'Tenant doit' : 'Propriétaire doit'
        })),
        
        financial_summary: {
          total_provisioning: report.settlement.total_provisioning_paid,
          total_actual: report.settlement.total_actual_cost,
          balance: report.settlement.balance,
          balance_desc: report.settlement.balance > 0 
            ? `Le locataire doit ${report.settlement.balance}€`
            : `Le propriétaire doit ${Math.abs(report.settlement.balance)}€`
        },

        notes: report.settlement.notes || ''
      };

      return statement;
    } catch (error) {
      logger.error('SettlementService.generateSettlementStatement error:', error);
      throw error;
    }
  }

  /**
   * ✅ Marquer un règlement comme approuvé/clôturé
   * PATCH /api/charges/:contractId/settlement/:id/approve
   */
  async approveSettlement(settlement_id, approval_data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { approved_by, approval_date = new Date().toISOString().split('T')[0], notes = '' } = approval_data;

      const result = await client.query(
        `UPDATE charge_settlements 
         SET status = 'approved', 
             approved_by = $1,
             approval_date = $2,
             notes = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, status, approval_date`,
        [approved_by, approval_date, notes, settlement_id]
      );

      // Log audit
      await client.query(
        `INSERT INTO communication_log (entity_type, entity_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['charge_settlement', settlement_id, 'approved', JSON.stringify({ approved_by, approval_date })]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('SettlementService.approveSettlement error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new SettlementService();
