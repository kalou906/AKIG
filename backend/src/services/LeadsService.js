/**
 * 📞 Leads Management Service
 * Gestion complète des leads immobiliers
 * 
 * backend/src/services/LeadsService.js
 */

const logger = require('./logger');

class LeadsService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Créer un nouveau lead
   */
  async createLead(data) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        source, // website, portal, referral, directCall, other
        propertyType,
        budget,
        status = 'new',
        notes = '',
        createdBy = 'system'
      } = data;

      // Validation
      if (!firstName || !lastName || !email) {
        return { success: false, error: 'Prénom, nom et email requis' };
      }

      const query = `
        INSERT INTO leads (
          first_name, last_name, email, phone, 
          source, property_type, budget, status,
          notes, score, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `;

      // Score initial basé sur données
      const initialScore = this.calculateLeadScore(data);

      const result = await this.pool.query(query, [
        firstName,
        lastName,
        email,
        phone || null,
        source || 'other',
        propertyType || null,
        budget || null,
        status,
        notes,
        initialScore,
        createdBy
      ]);

      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Erreur création lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer tous les leads
   */
  async getAllLeads(filters = {}) {
    try {
      let query = `
        SELECT * FROM leads 
        WHERE deleted_at IS NULL
      `;
      const values = [];
      let paramCount = 1;

      // Filtres
      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.source) {
        query += ` AND source = $${paramCount}`;
        values.push(filters.source);
        paramCount++;
      }

      if (filters.propertyType) {
        query += ` AND property_type = $${paramCount}`;
        values.push(filters.propertyType);
        paramCount++;
      }

      if (filters.minBudget) {
        query += ` AND budget >= $${paramCount}`;
        values.push(filters.minBudget);
        paramCount++;
      }

      if (filters.maxBudget) {
        query += ` AND budget <= $${paramCount}`;
        values.push(filters.maxBudget);
        paramCount++;
      }

      if (filters.search) {
        query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      query += ` ORDER BY score DESC, created_at DESC`;

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows, count: result.rows.length };
    } catch (error) {
      logger.error('Erreur récupération leads:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer un lead par ID
   */
  async getLeadById(leadId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM leads WHERE id = $1 AND deleted_at IS NULL`,
        [leadId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Lead non trouvé' };
      }

      // Récupérer l'historique d'interactions
      const interactionsResult = await this.pool.query(
        `SELECT * FROM lead_interactions WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [leadId]
      );

      const lead = result.rows[0];
      lead.interactions = interactionsResult.rows;

      return { success: true, data: lead };
    } catch (error) {
      logger.error('Erreur récupération lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour un lead
   */
  async updateLead(leadId, data) {
    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      // Champs pouvant être mises à jour
      const allowedFields = [
        'firstName', 'lastName', 'email', 'phone',
        'source', 'propertyType', 'budget', 'status', 'notes'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          const dbField = field
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .substring(1);
          updates.push(`${dbField} = $${paramCount}`);
          values.push(data[field]);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        return { success: false, error: 'Aucun champ à mettre à jour' };
      }

      updates.push(`updated_at = NOW()`);
      values.push(leadId);

      const query = `
        UPDATE leads SET ${updates.join(', ')}
        WHERE id = $${paramCount} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        return { success: false, error: 'Lead non trouvé' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Erreur mise à jour lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer un lead (soft delete)
   */
  async deleteLead(leadId, deletedBy = 'system') {
    try {
      const result = await this.pool.query(
        `
          UPDATE leads SET 
            deleted_at = NOW(),
            deleted_by = $1
          WHERE id = $2
          RETURNING id
        `,
        [deletedBy, leadId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Lead non trouvé' };
      }

      return { success: true, message: 'Lead supprimé' };
    } catch (error) {
      logger.error('Erreur suppression lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Changer le statut d'un lead
   */
  async updateLeadStatus(leadId, status) {
    try {
      const validStatuses = ['new', 'contacted', 'qualified', 'lost', 'converted'];

      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Statut invalide' };
      }

      const result = await this.pool.query(
        `
          UPDATE leads SET status = $1, updated_at = NOW()
          WHERE id = $2 AND deleted_at IS NULL
          RETURNING *
        `,
        [status, leadId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Lead non trouvé' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Erreur changement statut lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajouter une interaction (appel, email, visite, etc.)
   */
  async addInteraction(leadId, interaction) {
    try {
      const {
        type, // call, email, visit, message, meeting
        description,
        outcome, // positive, neutral, negative
        notes = '',
        recordedBy = 'system'
      } = interaction;

      if (!type || !description) {
        return { success: false, error: 'Type et description requis' };
      }

      const result = await this.pool.query(
        `
          INSERT INTO lead_interactions (
            lead_id, type, description, outcome, notes, recorded_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *
        `,
        [leadId, type, description, outcome || 'neutral', notes, recordedBy]
      );

      // Recalculer le score du lead après interaction
      await this.recalculateLeadScore(leadId);

      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Erreur ajout interaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer les interactions d'un lead
   */
  async getLeadInteractions(leadId, limit = 50) {
    try {
      const result = await this.pool.query(
        `
          SELECT * FROM lead_interactions 
          WHERE lead_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [leadId, limit]
      );

      return { success: true, data: result.rows, count: result.rows.length };
    } catch (error) {
      logger.error('Erreur récupération interactions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Attribuer un lead à un agent
   */
  async assignLeadToAgent(leadId, agentId) {
    try {
      const result = await this.pool.query(
        `
          UPDATE leads SET 
            assigned_to = $1,
            assigned_at = NOW(),
            status = 'contacted',
            updated_at = NOW()
          WHERE id = $2 AND deleted_at IS NULL
          RETURNING *
        `,
        [agentId, leadId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Lead non trouvé' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Erreur attribution lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculer le score d'un lead
   */
  calculateLeadScore(data) {
    let score = 0;

    // Source scoring
    const sourceScores = {
      website: 30,
      portal: 35,
      referral: 40,
      directCall: 45,
      other: 10
    };
    score += sourceScores[data.source] || 10;

    // Budget scoring
    if (data.budget) {
      if (data.budget > 500000000) score += 40; // >500M GNF = high value
      else if (data.budget > 200000000) score += 30; // 200-500M
      else if (data.budget > 50000000) score += 20; // 50-200M
      else score += 10; // <50M
    }

    // Property type scoring (selon demande)
    if (data.propertyType) score += 15;

    // Phone vs no phone
    if (data.phone) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Recalculer le score d'un lead basé sur interactions
   */
  async recalculateLeadScore(leadId) {
    try {
      // Récupérer les interactions
      const interactionsResult = await this.pool.query(
        `SELECT COUNT(*) as count, 
                SUM(CASE WHEN outcome = 'positive' THEN 1 ELSE 0 END) as positive_count
         FROM lead_interactions WHERE lead_id = $1`,
        [leadId]
      );

      const { count, positive_count } = interactionsResult.rows[0];
      const baseScore = 50; // Score initial
      const interactionBonus = Math.min(count * 5, 30); // Max +30 pour interactions
      const positiveBonus = Math.min((positive_count || 0) * 10, 20); // Max +20 pour positives

      const newScore = Math.min(baseScore + interactionBonus + positiveBonus, 100);

      await this.pool.query(
        `UPDATE leads SET score = $1 WHERE id = $2`,
        [newScore, leadId]
      );

      return newScore;
    } catch (error) {
      logger.error('Erreur recalcul score:', error);
      return null;
    }
  }

  /**
   * Obtenir les statistiques des leads
   */
  async getLeadsStatistics() {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_leads,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
          SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_leads,
          SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_leads,
          SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_leads,
          SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_leads,
          AVG(score) as average_score,
          SUM(CASE WHEN source = 'website' THEN 1 ELSE 0 END) as from_website,
          SUM(CASE WHEN source = 'portal' THEN 1 ELSE 0 END) as from_portal,
          SUM(CASE WHEN source = 'referral' THEN 1 ELSE 0 END) as from_referral
        FROM leads WHERE deleted_at IS NULL
      `);

      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Erreur statistiques leads:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer les leads par score (top leads)
   */
  async getTopLeads(limit = 10) {
    try {
      const result = await this.pool.query(
        `
          SELECT * FROM leads 
          WHERE deleted_at IS NULL
          ORDER BY score DESC
          LIMIT $1
        `,
        [limit]
      );

      return { success: true, data: result.rows };
    } catch (error) {
      logger.error('Erreur top leads:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convertir un lead en contrat (associer à propriété)
   */
  async convertLeadToContract(leadId, contractData) {
    try {
      // Mettre à jour le statut du lead
      await this.pool.query(
        `
          UPDATE leads SET 
            status = 'converted',
            updated_at = NOW()
          WHERE id = $1
        `,
        [leadId]
      );

      // Enregistrer l'interaction
      await this.addInteraction(leadId, {
        type: 'conversion',
        description: 'Lead converti en contrat',
        outcome: 'positive',
        recordedBy: 'system'
      });

      return { success: true, message: 'Lead converti avec succès' };
    } catch (error) {
      logger.error('Erreur conversion lead:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = LeadsService;
