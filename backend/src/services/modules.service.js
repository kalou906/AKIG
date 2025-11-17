/**
 * Modules Service
 * backend/src/services/modules.service.js
 * 
 * Gestion des modules de fonctionnalités
 */

const pool = require('../db');
const logger = require('./logger');

class ModulesService {
  /**
   * Récupère tous les modules
   */
  static async getAllModules() {
    try {
      const result = await pool.query(
        'SELECT id, code, name, description, enabled FROM modules ORDER BY code'
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching modules', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les modules activés pour une agence
   */
  static async getAgencyModules(agencyId) {
    try {
      const result = await pool.query(
        'SELECT * FROM get_agency_modules($1)',
        [agencyId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching agency modules', { error: error.message, agencyId });
      throw error;
    }
  }

  /**
   * Récupère un module par son code
   */
  static async getModuleByCode(code) {
    try {
      const result = await pool.query(
        'SELECT id, code, name, description, enabled FROM modules WHERE code = $1',
        [code]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching module', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Crée un nouveau module
   */
  static async createModule(data) {
    const { code, name, description, enabled = false, agencyId = null } = data;
    try {
      const result = await pool.query(
        `INSERT INTO modules (code, name, description, enabled, agency_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, code, name, description, enabled, agency_id, created_at`,
        [code, name, description, enabled, agencyId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating module', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Vérifie si un module est activé
   */
  static async isModuleEnabled(code, agencyId = null) {
    try {
      const result = await pool.query(
        'SELECT is_module_enabled($1, $2) as enabled',
        [code, agencyId]
      );
      return result.rows[0]?.enabled || false;
    } catch (error) {
      logger.error('Error checking module status', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Active un module pour une agence
   */
  static async enableModule(code, agencyId) {
    try {
      const result = await pool.query(
        `UPDATE modules SET enabled = true
         WHERE code = $1 AND (agency_id = $2 OR agency_id IS NULL)
         RETURNING *`,
        [code, agencyId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error enabling module', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Désactive un module pour une agence
   */
  static async disableModule(code, agencyId) {
    try {
      const result = await pool.query(
        `UPDATE modules SET enabled = false
         WHERE code = $1 AND agency_id = $2
         RETURNING *`,
        [code, agencyId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error disabling module', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Met à jour un module
   */
  static async updateModule(code, data) {
    const { name, description, enabled } = data;
    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (enabled !== undefined) {
        updates.push(`enabled = $${paramCount++}`);
        values.push(enabled);
      }

      if (updates.length === 0) return null;

      values.push(code);
      const result = await pool.query(
        `UPDATE modules SET ${updates.join(', ')} WHERE code = $${paramCount}
         RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating module', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Supprime un module
   */
  static async deleteModule(code, agencyId = null) {
    try {
      const query = agencyId
        ? 'DELETE FROM modules WHERE code = $1 AND agency_id = $2 RETURNING *'
        : 'DELETE FROM modules WHERE code = $1 RETURNING *';
      
      const values = agencyId ? [code, agencyId] : [code];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting module', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Récupère les modules manquants pour une agence
   */
  static async getMissingModules(agencyId) {
    try {
      const result = await pool.query(
        `SELECT id, code, name, description
         FROM modules
         WHERE agency_id IS NULL
         AND code NOT IN (
           SELECT code FROM modules WHERE agency_id = $1
         )
         ORDER BY code`,
        [agencyId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching missing modules', { error: error.message, agencyId });
      throw error;
    }
  }

  /**
   * Assigne les modules par défaut à une agence
   */
  static async assignDefaultModules(agencyId, moduleCodes = []) {
    try {
      const codes = moduleCodes.length > 0 ? moduleCodes : ['accounting', 'export_pdf', 'export_csv', 'notifications'];
      
      const result = await pool.query(
        `INSERT INTO modules (code, name, description, enabled, agency_id)
         SELECT code, name, description, enabled, $1
         FROM modules
         WHERE code = ANY($2) AND agency_id IS NULL
         ON CONFLICT (code, agency_id) DO NOTHING
         RETURNING *`,
        [agencyId, codes]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error assigning default modules', { error: error.message, agencyId });
      throw error;
    }
  }
}

module.exports = ModulesService;
