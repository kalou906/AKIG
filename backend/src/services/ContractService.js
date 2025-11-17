/**
 * 📋 Service Contrats - Gestion des Contrats de Location
 */

const RentalContract = require('../models/RentalContract');

class ContractService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Créer un nouveau contrat
   */
  async createContract(data) {
    try {
      const contract = new RentalContract(data);
      const validation = contract.validate();
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const query = `
        INSERT INTO rental_contracts (
          reference, number, start_date, end_date, signed_date, renewal_date,
          duration, landlord_id, landlord_name, landlord_phone, landlord_email,
          tenant_id, tenant_name, tenant_phone, tenant_email,
          guarantor_id, guarantor_name, guarantor_phone, guarantor_email, guarantor_address,
          agent_id, agent_name, agent_phone,
          property_id, property_reference, property_title, property_address, property_type,
          monthly_rent, security_deposit, commission_agency, utilities, taxes_and_charges,
          payment_method, payment_day_of_month,
          renewal_option, notice_for_termination, pet_policy, sublet_allowed,
          maintenance_responsibility, insurance_required, furnished, smoking_allowed,
          business_use_allowed, status, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23,
          $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33,
          $34, $35,
          $36, $37, $38, $39,
          $40, $41, $42, $43,
          $44, $45, $46, $47
        ) RETURNING *
      `;

      const values = [
        data.reference || `CONT-${Date.now()}`,
        data.number,
        contract.dates.startDate,
        contract.dates.endDate,
        contract.dates.signedDate,
        contract.dates.renewalDate,
        contract.dates.duration,
        contract.parties.landlord.id,
        contract.parties.landlord.name,
        contract.parties.landlord.phone,
        contract.parties.landlord.email,
        contract.parties.tenant.id,
        contract.parties.tenant.name,
        contract.parties.tenant.phone,
        contract.parties.tenant.email,
        contract.parties.guarantor.id,
        contract.parties.guarantor.name,
        contract.parties.guarantor.phone,
        contract.parties.guarantor.email,
        contract.parties.guarantor.address,
        contract.parties.agent.id,
        contract.parties.agent.name,
        contract.parties.agent.phone,
        contract.property.id,
        contract.property.reference,
        contract.property.title,
        contract.property.address,
        contract.property.type,
        contract.financial.monthlyRent,
        contract.financial.securityDeposit,
        contract.financial.commissionAgency,
        contract.financial.utilities,
        contract.financial.taxesAndCharges,
        contract.financial.paymentMethod,
        contract.financial.paymentDayOfMonth,
        contract.conditions.renewalOption,
        contract.conditions.noticeForTermination,
        contract.conditions.petPolicy,
        contract.conditions.subletAllowed,
        contract.conditions.maintenanceResponsibility,
        contract.conditions.insuranceRequired,
        contract.conditions.furnished,
        contract.conditions.smokingAllowed,
        contract.conditions.businessUseAllowed,
        'draft',
        data.createdBy || 'system',
        new Date()
      ];

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur création contrat:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir un contrat par ID
   */
  async getContractById(contractId) {
    try {
      const query = 'SELECT * FROM rental_contracts WHERE id = $1 AND deleted_at IS NULL';
      const result = await this.pool.query(query, [contractId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erreur lecture contrat:', error);
      return null;
    }
  }

  /**
   * Lister les contrats avec filtres
   */
  async listContracts(filters = {}) {
    try {
      let query = `
        SELECT rc.*, 
               COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments
        FROM rental_contracts rc
        LEFT JOIN payments p ON rc.id = p.contract_id
        WHERE rc.deleted_at IS NULL
      `;
      const values = [];
      let paramCount = 1;

      if (filters.status) {
        query += ` AND rc.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.tenantId) {
        query += ` AND rc.tenant_id = $${paramCount}`;
        values.push(filters.tenantId);
        paramCount++;
      }

      if (filters.landlordId) {
        query += ` AND rc.landlord_id = $${paramCount}`;
        values.push(filters.landlordId);
        paramCount++;
      }

      if (filters.propertyId) {
        query += ` AND rc.property_id = $${paramCount}`;
        values.push(filters.propertyId);
        paramCount++;
      }

      if (filters.hasArrears) {
        query += ` AND rc.arrears > 0`;
      }

      query += ` GROUP BY rc.id ORDER BY rc.created_at DESC`;

      // Pagination
      const limit = filters.limit || 20;
      const offset = ((filters.page || 1) - 1) * limit;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);

      const result = await this.pool.query(query, values);
      const countResult = await this.pool.query('SELECT COUNT(*) FROM rental_contracts WHERE deleted_at IS NULL');
      const total = parseInt(countResult.rows[0].count);

      return {
        success: true,
        data: result.rows,
        pagination: { total, page: filters.page || 1, limit, pages: Math.ceil(total / limit) }
      };
    } catch (error) {
      console.error('❌ Erreur liste contrats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les contrats actifs
   */
  async getActiveContracts() {
    try {
      const query = `
        SELECT * FROM rental_contracts
        WHERE status = 'active' 
        AND start_date <= NOW() 
        AND end_date >= NOW()
        AND deleted_at IS NULL
        ORDER BY end_date ASC
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur contrats actifs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les contrats arrivant à expiration
   */
  async getExpiringContracts(daysBeforeExpiry = 30) {
    try {
      const query = `
        SELECT * FROM rental_contracts
        WHERE status = 'active'
        AND deleted_at IS NULL
        AND end_date BETWEEN NOW() AND NOW() + INTERVAL '${daysBeforeExpiry} days'
        ORDER BY end_date ASC
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur contrats expirant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Signer un contrat
   */
  async signContract(contractId, signedBy) {
    try {
      const query = `
        UPDATE rental_contracts SET
          status = 'active',
          signed_date = NOW(),
          updated_by = $1,
          updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.pool.query(query, [signedBy || 'system', contractId]);
      return result.rows[0] ? { success: true, data: result.rows[0] } : { success: false, error: 'Contrat non trouvé' };
    } catch (error) {
      console.error('❌ Erreur signature contrat:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Terminer un contrat
   */
  async terminateContract(contractId, terminationData) {
    try {
      const query = `
        UPDATE rental_contracts SET
          status = 'terminated',
          termination_date = NOW(),
          extra_conditions = array_append(extra_conditions, $1::text),
          updated_by = $2,
          updated_at = NOW()
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const terminationNote = `Terminé le: ${new Date().toLocaleDateString('fr-FR')} - Raison: ${terminationData.reason}`;
      const result = await this.pool.query(query, [terminationNote, terminationData.terminatedBy || 'system', contractId]);
      
      return result.rows[0] ? { success: true, data: result.rows[0] } : { success: false, error: 'Contrat non trouvé' };
    } catch (error) {
      console.error('❌ Erreur résiliation contrat:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les contrats avec arriérés
   */
  async getContractsWithArrears() {
    try {
      const query = `
        SELECT rc.*, 
               COALESCE(SUM(p.amount_gross - p.amount_actual), 0) as arrears_amount,
               COUNT(p.id) as pending_payments
        FROM rental_contracts rc
        LEFT JOIN payments p ON rc.id = p.contract_id AND p.status != 'completed'
        WHERE rc.status = 'active'
        AND rc.deleted_at IS NULL
        GROUP BY rc.id
        HAVING COALESCE(SUM(p.amount_gross - p.amount_actual), 0) > 0
        ORDER BY arrears_amount DESC
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur contrats arriérés:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques des contrats
   */
  async getContractStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_contracts,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contracts,
          COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_contracts,
          SUM(monthly_rent) as total_monthly_rent,
          AVG(monthly_rent) as avg_monthly_rent,
          COUNT(CASE WHEN arrears > 0 THEN 1 END) as contracts_with_arrears,
          SUM(arrears) as total_arrears
        FROM rental_contracts
        WHERE deleted_at IS NULL
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur stats contrats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour un contrat
   */
  async updateContract(contractId, updateData) {
    try {
      const current = await this.getContractById(contractId);
      if (!current) return { success: false, error: 'Contrat non trouvé' };

      const query = `
        UPDATE rental_contracts SET
          end_date = COALESCE($1, end_date),
          monthly_rent = COALESCE($2, monthly_rent),
          status = COALESCE($3, status),
          extra_conditions = COALESCE($4, extra_conditions),
          updated_by = $5,
          updated_at = NOW()
        WHERE id = $6 AND deleted_at IS NULL
        RETURNING *
      `;

      const values = [
        updateData.endDate,
        updateData.monthlyRent,
        updateData.status,
        updateData.extraConditions,
        updateData.updatedBy || 'system',
        contractId
      ];

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur mise à jour contrat:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ContractService;
