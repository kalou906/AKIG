/**
 * CandidatureService.js
 * Phase 8: Gestion des candidatures de location
 * 8 méthodes core, validation complète, filters, audit logging
 */

const pool = require('../db');
const Joi = require('joi');

class CandidatureService {
  /**
   * Créer une nouvelle candidature
   * @param {Object} data - Données candidature
   * @param {number} userId - ID utilisateur créateur
   * @returns {Promise<Object>} Candidature créée
   */
  async createCandidature(data, userId) {
    const { error, value } = this.validateCandidature(data);
    if (error) throw new Error(`Validation: ${error.message}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const locatairesJson = JSON.stringify(value.locataires || []);
      const result = await client.query(
        `INSERT INTO candidatures 
        (local_id, proprietaire_id, statut, locataires, dossierfacile_integration, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          value.local_id,
          value.proprietaire_id,
          value.statut || 'nouvelle',
          locatairesJson,
          value.dossierfacile_integration || false,
          userId
        ]
      );

      // Log d'audit
      await client.query(
        `INSERT INTO audit_logs (table_name, operation, record_id, user_id, changes)
         VALUES ('candidatures', 'INSERT', $1, $2, $3)`,
        [result.rows[0].id, userId, JSON.stringify(value)]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Récupérer candidature par ID
   * @param {number} candidatureId - ID candidature
   * @returns {Promise<Object>}
   */
  async getCandidatureById(candidatureId) {
    const result = await pool.query(
      `SELECT c.*, 
              COUNT(DISTINCT l.id) as nb_locataires,
              p.email as proprietaire_email,
              prop.nom as local_nom
       FROM candidatures c
       LEFT JOIN jsonb_to_recordset(c.locataires) AS l(id INT, nom TEXT, email TEXT)
       LEFT JOIN users p ON c.proprietaire_id = p.id
       LEFT JOIN properties prop ON c.local_id = prop.id
       WHERE c.id = $1 AND c.deleted_at IS NULL
       GROUP BY c.id, p.email, prop.nom`,
      [candidatureId]
    );
    
    if (result.rows.length === 0) throw new Error('Candidature not found');
    return result.rows[0];
  }

  /**
   * Lister candidatures avec filtres et pagination
   * @param {Object} filters - {status, local_id, proprietaire_id, search}
   * @param {number} page - Page numero
   * @param {number} limit - Items par page
   * @returns {Promise<Array>}
   */
  async listCandidatures(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM candidatures WHERE deleted_at IS NULL`;
    let params = [];
    let paramCount = 1;

    if (filters.statut) {
      query += ` AND statut = $${paramCount++}`;
      params.push(filters.statut);
    }
    if (filters.local_id) {
      query += ` AND local_id = $${paramCount++}`;
      params.push(filters.local_id);
    }
    if (filters.proprietaire_id) {
      query += ` AND proprietaire_id = $${paramCount++}`;
      params.push(filters.proprietaire_id);
    }
    if (filters.search) {
      query += ` AND (locataires::text ILIKE $${paramCount++})`;
      params.push(`%${filters.search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    return pool.query(query, params).then(r => r.rows);
  }

  /**
   * Mettre à jour candidature
   * @param {number} candidatureId - ID candidature
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} userId - ID utilisateur
   * @returns {Promise<Object>}
   */
  async updateCandidature(candidatureId, updateData, userId) {
    const allowed = ['statut', 'locataires', 'dossierfacile_integration', 'df_statut'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowed.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');

    const values = [...Object.values(updates), candidatureId, userId];

    const result = await pool.query(
      `UPDATE candidatures 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${Object.keys(updates).length + 1}
       AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('Candidature not found');

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (table_name, operation, record_id, user_id, changes)
       VALUES ('candidatures', 'UPDATE', $1, $2, $3)`,
      [candidatureId, userId, JSON.stringify(updates)]
    );

    return result.rows[0];
  }

  /**
   * Supprimer (soft delete) candidature
   * @param {number} candidatureId - ID candidature
   * @param {number} userId - ID utilisateur
   * @returns {Promise<Boolean>}
   */
  async deleteCandidature(candidatureId, userId) {
    const result = await pool.query(
      `UPDATE candidatures 
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [candidatureId]
    );

    if (result.rows.length === 0) throw new Error('Candidature not found');

    await pool.query(
      `INSERT INTO audit_logs (table_name, operation, record_id, user_id)
       VALUES ('candidatures', 'DELETE', $1, $2)`,
      [candidatureId, userId]
    );

    return true;
  }

  /**
   * Intégrer avec Dossierfacile
   * @param {number} candidatureId - ID candidature
   * @param {string} dfId - ID Dossierfacile
   * @returns {Promise<Object>}
   */
  async integrateDossierfacile(candidatureId, dfId) {
    const result = await pool.query(
      `UPDATE candidatures 
       SET dossierfacile_id = $1, dossierfacile_integration = true, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [dfId, candidatureId]
    );

    if (result.rows.length === 0) throw new Error('Candidature not found');
    return result.rows[0];
  }

  /**
   * Obtenir statistiques candidatures
   * @param {number} proprietaireId - Filtrer par propriétaire (optional)
   * @returns {Promise<Object>}
   */
  async getCandidatureStats(proprietaireId = null) {
    let query = `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN statut = 'nouvelle' THEN 1 END) as nouvelles,
      COUNT(CASE WHEN statut = 'acceptee' THEN 1 END) as acceptees,
      COUNT(CASE WHEN statut = 'rejetee' THEN 1 END) as rejetees,
      COUNT(CASE WHEN dossierfacile_integration THEN 1 END) as dossierfacile_count,
      COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today
      FROM candidatures 
      WHERE deleted_at IS NULL`;
    
    let params = [];
    if (proprietaireId) {
      query += ` AND proprietaire_id = $1`;
      params.push(proprietaireId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Exporter candidatures (CSV/JSON)
   * @param {Array<number>} candidatureIds - IDs à exporter
   * @param {string} format - 'json' ou 'csv'
   * @returns {Promise<string>}
   */
  async exportCandidatures(candidatureIds, format = 'json') {
    const result = await pool.query(
      `SELECT * FROM candidatures 
       WHERE id = ANY($1) AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [candidatureIds]
    );

    if (format === 'json') {
      return JSON.stringify(result.rows, null, 2);
    }

    // CSV format
    if (result.rows.length === 0) return '';
    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows
      .map(row => Object.values(row)
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(','))
      .join('\n');
    
    return `${headers}\n${rows}`;
  }

  /**
   * Validation schema pour candidature
   */
  validateCandidature(data) {
    const schema = Joi.object({
      local_id: Joi.number().integer().required(),
      proprietaire_id: Joi.number().integer().required(),
      statut: Joi.string().valid('nouvelle', 'acceptee', 'rejetee').default('nouvelle'),
      locataires: Joi.array()
        .items(
          Joi.object({
            nom: Joi.string().max(100).required(),
            prenom: Joi.string().max(100).required(),
            email: Joi.string().email().required(),
            telephone: Joi.string().pattern(/^[0-9\s\-\+\.]+$/).max(20)
          })
        )
        .min(1)
        .required(),
      dossierfacile_integration: Joi.boolean().default(false),
      df_statut: Joi.string().max(50)
    });

    return schema.validate(data, { abortEarly: false });
  }
}

module.exports = new CandidatureService();
