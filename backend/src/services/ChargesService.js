/**
 * 💰 Service Charges et Régularisation - ImmobilierLoyer
 * Gère: eau, électricité, copropriété, dépôt de garantie
 * Devise: GNF (Franc Guinéen)
 */

class ChargesService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * ➕ Ajouter charges mensuelles à un contrat
   */
  async addCharges(contractId, chargesData) {
    try {
      const { type, amount, description, startDate, endDate } = chargesData;

      // Validation
      if (!['water', 'electricity', 'coproperty', 'maintenance', 'insurance', 'taxes'].includes(type)) {
        throw new Error('Type de charge invalide');
      }
      if (amount <= 0) throw new Error('Montant doit être positif');

      const result = await this.pool.query(`
        INSERT INTO contract_charges (
          contract_id, type, amount_gnf, description, start_date, end_date, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, contract_id, type, amount_gnf, start_date
      `, [contractId, type, amount, description, startDate, endDate]);

      console.log('✅ Charge ajoutée:', result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error('❌ Erreur ajout charge:', err.message);
      throw err;
    }
  }

  /**
   * 📋 Lister les charges d'un contrat
   */
  async getContractCharges(contractId) {
    try {
      const result = await this.pool.query(`
        SELECT 
          id, type, amount_gnf, description, 
          start_date, end_date, 
          created_at, updated_at
        FROM contract_charges
        WHERE contract_id = $1
        ORDER BY start_date DESC
      `, [contractId]);

      return result.rows;
    } catch (err) {
      console.error('❌ Erreur lecture charges:', err.message);
      throw err;
    }
  }

  /**
   * 💶 Calculer total charges pour une période
   */
  async calculateChargesForPeriod(contractId, startDate, endDate) {
    try {
      const result = await this.pool.query(`
        SELECT 
          type,
          SUM(amount_gnf) as total_amount,
          COUNT(*) as count
        FROM contract_charges
        WHERE contract_id = $1 
          AND start_date <= $3
          AND end_date >= $2
        GROUP BY type
      `, [contractId, startDate, endDate]);

      const totalCharges = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);

      return {
        contractId,
        period: { startDate, endDate },
        byType: result.rows,
        totalCharges: Math.round(totalCharges * 100) / 100,
        chargeCount: result.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
      };
    } catch (err) {
      console.error('❌ Erreur calcul charges:', err.message);
      throw err;
    }
  }

  /**
   * 🔄 Régularisation annuelle des charges
   */
  async regularizeCharges(contractId, yearToSettle) {
    try {
      // 1. Récupérer contrat et charges de l'année
      const contractResult = await this.pool.query(`
        SELECT rc.monthly_rent, rc.tenant_id, rc.landlord_id, rc.reference
        FROM rental_contracts rc WHERE rc.id = $1
      `, [contractId]);

      if (contractResult.rows.length === 0) {
        throw new Error('Contrat non trouvé');
      }

      const contract = contractResult.rows[0];

      // 2. Calculer charges théoriques (prévisions) vs réelles (factures)
      const startOfYear = new Date(yearToSettle, 0, 1);
      const endOfYear = new Date(yearToSettle, 11, 31);

      const chargesResult = await this.pool.query(`
        SELECT 
          type,
          SUM(CASE WHEN is_estimate = true THEN amount_gnf ELSE 0 END) as estimated,
          SUM(CASE WHEN is_estimate = false THEN amount_gnf ELSE 0 END) as actual
        FROM contract_charges
        WHERE contract_id = $1 
          AND start_date >= $2 AND end_date <= $3
        GROUP BY type
      `, [contractId, startOfYear, endOfYear]);

      // 3. Calculer différence
      let totalDifference = 0;
      const chargeDetails = [];

      for (const charge of chargesResult.rows) {
        const estimated = parseFloat(charge.estimated) || 0;
        const actual = parseFloat(charge.actual) || 0;
        const difference = actual - estimated;
        totalDifference += difference;

        chargeDetails.push({
          type: charge.type,
          estimated,
          actual,
          difference
        });
      }

      // 4. Enregistrer régularisation
      let regularizationType = totalDifference > 0 ? 'due_by_tenant' : 'due_by_landlord';
      const regularizationAmount = Math.abs(totalDifference);

      const regularizationResult = await this.pool.query(`
        INSERT INTO charge_regularizations (
          contract_id, year, estimated_total, actual_total, 
          difference_amount, type, status, settled_date
        )
        VALUES ($1, $2, 
          (SELECT SUM(estimated) FROM (SELECT SUM(amount_gnf) FROM contract_charges) t),
          (SELECT SUM(actual) FROM (SELECT SUM(amount_gnf) FROM contract_charges) t),
          $3, $4, 'pending', NULL)
        RETURNING id, difference_amount, type
      `, [contractId, yearToSettle, regularizationAmount, regularizationType]);

      console.log('✅ Régularisation créée:', regularizationResult.rows[0]);

      return {
        regularizationId: regularizationResult.rows[0].id,
        year: yearToSettle,
        chargeDetails,
        totalDifference: Math.round(totalDifference * 100) / 100,
        type: regularizationType,
        message: totalDifference > 0 
          ? `Locataire doit ${regularizationAmount} GNF` 
          : `Propriétaire doit ${regularizationAmount} GNF`
      };
    } catch (err) {
      console.error('❌ Erreur régularisation:', err.message);
      throw err;
    }
  }

  /**
   * 🛡️ Gérer dépôt de garantie
   */
  async handleSecurityDeposit(contractId, action, amount) {
    try {
      const validActions = ['create', 'hold', 'partial_return', 'full_return', 'deduct'];

      if (!validActions.includes(action)) {
        throw new Error('Action invalide sur dépôt de garantie');
      }

      const result = await this.pool.query(`
        SELECT id, security_deposit, security_deposit_status 
        FROM rental_contracts 
        WHERE id = $1
      `, [contractId]);

      if (result.rows.length === 0) {
        throw new Error('Contrat non trouvé');
      }

      const contract = result.rows[0];
      const currentDeposit = parseFloat(contract.security_deposit) || 0;

      let newStatus, depositLog;

      switch (action) {
        case 'create':
          newStatus = 'held';
          depositLog = `Dépôt de garantie ${amount} GNF créé`;
          break;

        case 'hold':
          newStatus = 'held';
          depositLog = `Dépôt de garantie bloqué`;
          break;

        case 'partial_return':
          const remainingDeposit = currentDeposit - amount;
          newStatus = remainingDeposit > 0 ? 'partial_return' : 'full_return';
          depositLog = `Restitution partielle ${amount} GNF, reste ${remainingDeposit} GNF`;
          break;

        case 'full_return':
          newStatus = 'returned';
          depositLog = `Dépôt de garantie entièrement restitué ${currentDeposit} GNF`;
          break;

        case 'deduct':
          const deductedAmount = Math.min(amount, currentDeposit);
          const newDepositAmount = currentDeposit - deductedAmount;
          newStatus = newDepositAmount > 0 ? 'held' : 'exhausted';
          depositLog = `Déduction de ${deductedAmount} GNF pour dégâts, reste ${newDepositAmount} GNF`;
          break;
      }

      // Enregistrer transaction
      await this.pool.query(`
        INSERT INTO security_deposit_transactions 
        (contract_id, action, amount_gnf, status, description, transaction_date)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [contractId, action, amount, newStatus, depositLog]);

      return {
        contractId,
        action,
        status: newStatus,
        message: depositLog,
        timestamp: new Date()
      };
    } catch (err) {
      console.error('❌ Erreur gestion dépôt:', err.message);
      throw err;
    }
  }

  /**
   * 📊 État détaillé des charges
   */
  async getChargesStatement(contractId, year) {
    try {
      const result = await this.pool.query(`
        SELECT 
          cc.type,
          cc.amount_gnf,
          cc.description,
          cc.start_date,
          cc.end_date,
          cc.is_estimate
        FROM contract_charges cc
        WHERE cc.contract_id = $1
          AND EXTRACT(YEAR FROM cc.start_date) = $2
        ORDER BY cc.start_date
      `, [contractId, year]);

      // Calculer totaux
      const estimated = result.rows
        .filter(r => r.is_estimate)
        .reduce((sum, r) => sum + parseFloat(r.amount_gnf), 0);

      const actual = result.rows
        .filter(r => !r.is_estimate)
        .reduce((sum, r) => sum + parseFloat(r.amount_gnf), 0);

      return {
        contractId,
        year,
        charges: result.rows,
        summary: {
          estimatedTotal: Math.round(estimated * 100) / 100,
          actualTotal: Math.round(actual * 100) / 100,
          difference: Math.round((actual - estimated) * 100) / 100,
          chargeCount: result.rows.length
        }
      };
    } catch (err) {
      console.error('❌ Erreur relevé charges:', err.message);
      throw err;
    }
  }

  /**
   * 🔔 Alertes sur charges
   */
  async checkChargeAlerts(contractId) {
    try {
      const alerts = [];

      // 1. Charges élevées (> 30% du loyer)
      const chargesResult = await this.pool.query(`
        SELECT SUM(amount_gnf) as total_charges, 
               rc.monthly_rent
        FROM contract_charges cc
        JOIN rental_contracts rc ON cc.contract_id = rc.id
        WHERE cc.contract_id = $1
          AND cc.start_date >= NOW() - INTERVAL '1 month'
        GROUP BY rc.monthly_rent
      `, [contractId]);

      if (chargesResult.rows.length > 0) {
        const row = chargesResult.rows[0];
        const chargesRatio = parseFloat(row.total_charges) / parseFloat(row.monthly_rent);
        
        if (chargesRatio > 0.3) {
          alerts.push({
            level: 'warning',
            type: 'high_charges',
            message: `Charges représentent ${(chargesRatio * 100).toFixed(1)}% du loyer`
          });
        }
      }

      // 2. Dépôt de garantie insuffisant
      const depositResult = await this.pool.query(`
        SELECT security_deposit, monthly_rent
        FROM rental_contracts
        WHERE id = $1
      `, [contractId]);

      if (depositResult.rows.length > 0) {
        const row = depositResult.rows[0];
        if (parseFloat(row.security_deposit) < parseFloat(row.monthly_rent)) {
          alerts.push({
            level: 'info',
            type: 'low_deposit',
            message: 'Dépôt de garantie < 1 mois de loyer'
          });
        }
      }

      return alerts;
    } catch (err) {
      console.error('❌ Erreur alertes charges:', err.message);
      throw err;
    }
  }
}

module.exports = ChargesService;
