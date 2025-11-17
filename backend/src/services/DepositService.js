/**
 * 🏦 DEPOSIT SERVICE - Gestion des Dépôts de Garantie
 * 
 * Gère tous les aspects des dépôts de garantie:
 * - Suivi des montants
 * - Mouvements (holding, déductions, retours)
 * - Calculs de retenues
 * - Rapports et audit trail
 */

const pool = require('../db');
const logger = require('../utils/logger');

class DepositService {
  /**
   * 📋 Créer/Gérer un dépôt de garantie
   * POST /api/deposits/manage
   */
  async manageDeposit(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        contract_id,
        property_id,
        tenant_id,
        deposit_amount,
        payment_date,
        status = 'active',
        notes
      } = data;

      // Vérifier que le contrat existe
      const contractCheck = await client.query(
        'SELECT id FROM rental_contracts WHERE id = $1',
        [contract_id]
      );

      if (contractCheck.rows.length === 0) {
        throw new Error('Contrat introuvable');
      }

      // Créer ou mettre à jour le dépôt
      const deposit = await client.query(
        `INSERT INTO security_deposits (contract_id, property_id, tenant_id, deposit_amount, payment_date, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (contract_id) DO UPDATE SET
         deposit_amount = $4,
         payment_date = $5,
         status = $6,
         notes = $7,
         updated_at = NOW()
         RETURNING id, contract_id, deposit_amount, status, created_at`,
        [contract_id, property_id, tenant_id, deposit_amount, payment_date, status, notes]
      );

      // Log audit
      await client.query(
        `INSERT INTO communication_log (entity_type, entity_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['security_deposit', deposit.rows[0].id, 'created', JSON.stringify(deposit.rows[0])]
      );

      await client.query('COMMIT');
      return deposit.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('DepositService.manageDeposit error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🔄 Enregistrer un mouvement de dépôt (retenue, déduction, remboursement)
   * POST /api/deposits/:id/movement
   */
  async recordMovement(deposit_id, movement_data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        movement_type, // 'hold', 'deduct', 'return'
        amount,
        reason,
        description,
        reference_date = new Date().toISOString().split('T')[0]
      } = movement_data;

      // Vérifier le dépôt existe
      const depositCheck = await client.query(
        'SELECT id, deposit_amount FROM security_deposits WHERE id = $1',
        [deposit_id]
      );

      if (depositCheck.rows.length === 0) {
        throw new Error('Dépôt introuvable');
      }

      // Enregistrer le mouvement
      const movement = await client.query(
        `INSERT INTO deposit_movements (deposit_id, movement_type, amount, reason, description, reference_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, movement_type, amount, reason, reference_date`,
        [deposit_id, movement_type, amount, reason, description, reference_date]
      );

      // Mettre à jour le solde disponible
      await client.query(
        `UPDATE security_deposits 
         SET current_balance = current_balance - $1,
             updated_at = NOW()
         WHERE id = $2`,
        [amount, deposit_id]
      );

      // Log audit
      await client.query(
        `INSERT INTO communication_log (entity_type, entity_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['deposit_movement', movement.rows[0].id, movement_type, JSON.stringify(movement.rows[0])]
      );

      await client.query('COMMIT');
      return movement.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('DepositService.recordMovement error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 💰 Retourner/Rembourser un dépôt
   * POST /api/deposits/:id/return
   */
  async returnDeposit(deposit_id, return_data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        return_date,
        deductions = [], // Array of deduction objects: { type, amount, description }
        method = 'bank_transfer', // 'bank_transfer', 'check', 'cash'
        notes = ''
      } = return_data;

      // Récupérer le dépôt
      const depositQuery = await client.query(
        `SELECT id, deposit_amount, current_balance, contract_id, tenant_id 
         FROM security_deposits 
         WHERE id = $1`,
        [deposit_id]
      );

      if (depositQuery.rows.length === 0) {
        throw new Error('Dépôt introuvable');
      }

      const deposit = depositQuery.rows[0];
      let total_deductions = 0;

      // Enregistrer les déductions
      for (const deduction of deductions) {
        await client.query(
          `INSERT INTO deposit_movements (deposit_id, movement_type, amount, reason, description, reference_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [deposit_id, 'deduct', deduction.amount, deduction.type, deduction.description, return_date]
        );
        total_deductions += deduction.amount;
      }

      // Calculer le remboursement
      const refund_amount = deposit.current_balance - total_deductions;

      // Créer le mouvement de retour
      const return_movement = await client.query(
        `INSERT INTO deposit_movements (deposit_id, movement_type, amount, reason, description, reference_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, amount, reason, reference_date`,
        [deposit_id, 'return', refund_amount, `Remboursement via ${method}`, notes, return_date]
      );

      // Marquer le dépôt comme retourné
      const updatedDeposit = await client.query(
        `UPDATE security_deposits 
         SET status = 'returned',
             current_balance = 0,
             return_date = $1,
             return_method = $2,
             return_amount = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, status, return_amount, return_date`,
        [return_date, method, refund_amount, deposit_id]
      );

      // Log audit
      await client.query(
        `INSERT INTO communication_log (entity_type, entity_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['security_deposit', deposit_id, 'returned', JSON.stringify({ 
          refund_amount, 
          total_deductions, 
          method,
          deductions 
        })]
      );

      await client.query('COMMIT');
      return {
        deposit: updatedDeposit.rows[0],
        return_movement: return_movement.rows[0],
        refund_amount,
        total_deductions,
        deductions
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('DepositService.returnDeposit error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🔍 Obtenir les détails des retenues d'un dépôt
   * GET /api/deposits/:id/deductions
   */
  async getDeductions(deposit_id) {
    try {
      const result = await pool.query(
        `SELECT dm.id, dm.movement_type, dm.amount, dm.reason, dm.description, dm.reference_date, dm.created_at
         FROM deposit_movements dm
         WHERE dm.deposit_id = $1 AND dm.movement_type = 'deduct'
         ORDER BY dm.reference_date DESC`,
        [deposit_id]
      );

      return {
        deductions: result.rows,
        total_deductions: result.rows.reduce((sum, d) => sum + parseFloat(d.amount), 0)
      };
    } catch (error) {
      logger.error('DepositService.getDeductions error:', error);
      throw error;
    }
  }

  /**
   * 📊 Lister les dépôts avec filtres
   * GET /api/deposits?status=active&proprietaire_id=X
   */
  async listDeposits(filters = {}) {
    try {
      let query = `
        SELECT sd.id, sd.contract_id, sd.property_id, sd.tenant_id, 
               sd.deposit_amount, sd.current_balance, sd.status, 
               sd.payment_date, sd.return_date, sd.created_at,
               rc.monthly_rent, rc.end_date,
               p.name as property_name,
               t.name as tenant_name,
               u.company_name as owner_name
        FROM security_deposits sd
        LEFT JOIN rental_contracts rc ON sd.contract_id = rc.id
        LEFT JOIN properties p ON sd.property_id = p.id
        LEFT JOIN tenants t ON sd.tenant_id = t.id
        LEFT JOIN owners u ON p.owner_id = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (filters.status) {
        query += ` AND sd.status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters.owner_id) {
        query += ` AND u.id = $${paramCount}`;
        params.push(filters.owner_id);
        paramCount++;
      }

      if (filters.property_id) {
        query += ` AND sd.property_id = $${paramCount}`;
        params.push(filters.property_id);
        paramCount++;
      }

      if (filters.tenant_id) {
        query += ` AND sd.tenant_id = $${paramCount}`;
        params.push(filters.tenant_id);
        paramCount++;
      }

      query += ' ORDER BY sd.created_at DESC LIMIT 100';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('DepositService.listDeposits error:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtenir un dépôt spécifique avec tous les détails
   * GET /api/deposits/:id/details
   */
  async getDepositDetails(deposit_id) {
    try {
      const depositQuery = await pool.query(
        `SELECT sd.*, 
                rc.monthly_rent, rc.start_date, rc.end_date,
                p.name as property_name,
                t.name as tenant_name,
                u.company_name as owner_name
         FROM security_deposits sd
         LEFT JOIN rental_contracts rc ON sd.contract_id = rc.id
         LEFT JOIN properties p ON sd.property_id = p.id
         LEFT JOIN tenants t ON sd.tenant_id = t.id
         LEFT JOIN owners u ON p.owner_id = u.id
         WHERE sd.id = $1`,
        [deposit_id]
      );

      if (depositQuery.rows.length === 0) {
        throw new Error('Dépôt introuvable');
      }

      const deposit = depositQuery.rows[0];

      // Récupérer tous les mouvements
      const movementsQuery = await pool.query(
        `SELECT id, movement_type, amount, reason, description, reference_date, created_at
         FROM deposit_movements
         WHERE deposit_id = $1
         ORDER BY reference_date DESC`,
        [deposit_id]
      );

      return {
        ...deposit,
        movements: movementsQuery.rows,
        summary: {
          total_deductions: movementsQuery.rows
            .filter(m => m.movement_type === 'deduct')
            .reduce((sum, m) => sum + parseFloat(m.amount), 0),
          total_holds: movementsQuery.rows
            .filter(m => m.movement_type === 'hold')
            .reduce((sum, m) => sum + parseFloat(m.amount), 0)
        }
      };
    } catch (error) {
      logger.error('DepositService.getDepositDetails error:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Supprimer/Archiver un dépôt
   * DELETE /api/deposits/:id
   */
  async deleteDeposit(deposit_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Marquer comme archived au lieu de supprimer
      const result = await client.query(
        `UPDATE security_deposits 
         SET status = 'archived', updated_at = NOW()
         WHERE id = $1
         RETURNING id, status`,
        [deposit_id]
      );

      // Log audit
      await client.query(
        `INSERT INTO communication_log (entity_type, entity_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['security_deposit', deposit_id, 'archived', 'Dépôt archivé']
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('DepositService.deleteDeposit error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new DepositService();
