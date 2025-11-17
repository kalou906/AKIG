/**
 * 👥 Service Client - Gestion des Clients/Locataires/Propriétaires
 */

const Client = require('../models/Client');

class ClientService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Créer un nouveau client
   */
  async createClient(data) {
    try {
      const client = new Client(data);
      const validation = client.validate();
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const query = `
        INSERT INTO clients (
          reference, type, status, first_name, last_name, full_name,
          date_of_birth, gender, nationality, profession, company,
          id_number, id_type, email, phone, mobile_phone, alternate_phone,
          country_code, street, district, city, region, zip_code,
          salary, employment_type, employment_status, source_of_funds,
          credit_score, property_type, bedrooms, bathrooms,
          price_min, price_max, preferred_area, furnished,
          max_commute, verified, verification_date, reliability_rating,
          payment_reliability, comments, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27,
          $28, $29, $30, $31,
          $32, $33, $34, $35,
          $36, $37, $38, $39,
          $40, $41, $42, $43
        ) RETURNING *
      `;

      const values = [
        data.reference || `CLIENT-${Date.now()}`,
        data.type || 'tenant',
        data.status || 'active',
        client.identity.firstName,
        client.identity.lastName,
        client.identity.fullName,
        client.identity.dateOfBirth,
        client.identity.gender,
        client.identity.nationality || 'Guinéenne',
        client.identity.profession,
        client.identity.company,
        client.identity.idNumber,
        client.identity.idType,
        client.contact.email,
        client.contact.phone,
        client.contact.mobilePhone,
        client.contact.alternatePhone,
        client.contact.countryCode || '+224',
        client.address.street,
        client.address.district,
        client.address.city || 'Conakry',
        client.address.region,
        client.address.zipCode,
        client.financial.salary,
        client.financial.employmentType,
        client.financial.employmentStatus,
        client.financial.sourceOfFunds,
        client.financial.creditScore,
        client.preferences.propertyType,
        client.preferences.bedrooms,
        client.preferences.bathrooms,
        client.preferences.priceRange.min,
        client.preferences.priceRange.max,
        client.preferences.preferredArea,
        client.preferences.furnished,
        client.preferences.maxCommute,
        client.documents.verified,
        client.documents.verificationDate,
        client.evaluation.reliability,
        client.evaluation.paymentReliability,
        client.evaluation.comments,
        data.createdBy || 'system',
        new Date()
      ];

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur création client:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir un client par ID
   */
  async getClientById(clientId) {
    try {
      const query = 'SELECT * FROM clients WHERE id = $1 AND deleted_at IS NULL';
      const result = await this.pool.query(query, [clientId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erreur lecture client:', error);
      return null;
    }
  }

  /**
   * Lister les clients avec filtres
   */
  async listClients(filters = {}) {
    try {
      let query = 'SELECT * FROM clients WHERE deleted_at IS NULL';
      const values = [];
      let paramCount = 1;

      if (filters.type) {
        query += ` AND type = $${paramCount}`;
        values.push(filters.type);
        paramCount++;
      }

      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.verified !== undefined) {
        query += ` AND verified = $${paramCount}`;
        values.push(filters.verified);
        paramCount++;
      }

      if (filters.city) {
        query += ` AND city = $${paramCount}`;
        values.push(filters.city);
        paramCount++;
      }

      if (filters.searchTerm) {
        query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
        values.push(`%${filters.searchTerm}%`);
        values.push(`%${filters.searchTerm}%`);
        values.push(`%${filters.searchTerm}%`);
        paramCount += 3;
      }

      // Pagination
      const limit = filters.limit || 20;
      const offset = ((filters.page || 1) - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);

      const result = await this.pool.query(query, values);
      const countResult = await this.pool.query('SELECT COUNT(*) FROM clients WHERE deleted_at IS NULL');
      const total = parseInt(countResult.rows[0].count);

      return {
        success: true,
        data: result.rows,
        pagination: { total, page: filters.page || 1, limit, pages: Math.ceil(total / limit) }
      };
    } catch (error) {
      console.error('❌ Erreur liste clients:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rechercher les clients qualifiés (vérifiés + fiables)
   */
  async getQualifiedClients() {
    try {
      const query = `
        SELECT * FROM clients 
        WHERE verified = true 
        AND reliability_rating >= 3
        AND deleted_at IS NULL
        ORDER BY payment_reliability DESC
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur clients qualifiés:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour un client
   */
  async updateClient(clientId, updateData) {
    try {
      const current = await this.getClientById(clientId);
      if (!current) return { success: false, error: 'Client non trouvé' };

      const query = `
        UPDATE clients SET
          full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          status = COALESCE($4, status),
          verified = COALESCE($5, verified),
          reliability_rating = COALESCE($6, reliability_rating),
          payment_reliability = COALESCE($7, payment_reliability),
          comments = COALESCE($8, comments),
          updated_by = $9,
          updated_at = NOW()
        WHERE id = $10 AND deleted_at IS NULL
        RETURNING *
      `;

      const values = [
        updateData.fullName,
        updateData.email,
        updateData.phone,
        updateData.status,
        updateData.verified,
        updateData.reliabilityRating,
        updateData.paymentReliability,
        updateData.comments,
        updateData.updatedBy || 'system',
        clientId
      ];

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur mise à jour client:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier les documents d'un client
   */
  async verifyClient(clientId, verifiedBy) {
    try {
      const query = `
        UPDATE clients SET
          verified = true,
          verification_date = NOW(),
          updated_by = $1,
          updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.pool.query(query, [verifiedBy || 'system', clientId]);
      return result.rows[0] ? { success: true, data: result.rows[0] } : { success: false, error: 'Client non trouvé' };
    } catch (error) {
      console.error('❌ Erreur vérification client:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajouter un incident à un client
   */
  async addIncident(clientId, incidentData) {
    try {
      const query = `
        UPDATE clients SET
          incidents = incidents || $1::jsonb,
          payment_reliability = CASE 
            WHEN payment_reliability > 1 THEN payment_reliability - 1 
            ELSE 1 
          END,
          updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const incident = {
        date: new Date(),
        type: incidentData.type,
        description: incidentData.description,
      };

      const result = await this.pool.query(query, [JSON.stringify([incident]), clientId]);
      return result.rows[0] ? { success: true } : { success: false, error: 'Client non trouvé' };
    } catch (error) {
      console.error('❌ Erreur ajout incident:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques des clients
   */
  async getClientStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_clients,
          COUNT(CASE WHEN type = 'tenant' THEN 1 END) as total_tenants,
          COUNT(CASE WHEN type = 'owner' THEN 1 END) as total_owners,
          COUNT(CASE WHEN verified = true THEN 1 END) as verified_clients,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
          COUNT(CASE WHEN payment_reliability >= 4 THEN 1 END) as reliable_payers,
          AVG(reliability_rating) as avg_reliability
        FROM clients
        WHERE deleted_at IS NULL
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur stats clients:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer un client (soft delete)
   */
  async deleteClient(clientId, deletedBy) {
    try {
      const query = `
        UPDATE clients SET
          deleted_at = NOW(),
          status = 'deleted',
          updated_by = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.pool.query(query, [deletedBy || 'system', clientId]);
      return result.rows[0] ? { success: true } : { success: false, error: 'Client non trouvé' };
    } catch (error) {
      console.error('❌ Erreur suppression client:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ClientService;
