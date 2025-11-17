/**
 * TenantService.js - Phase 4: Locataires & Garanteurs
 * 6 méthodes pour gérer les profils locataires et les garanteurs
 * Production-ready avec transactions, validation et audit logging
 */

const pool = require('../db');
const logger = require('../utils/logger');

class TenantService {
  /**
   * Créer un nouveau locataire
   * @param {Object} tenantData - Données du locataire
   * @returns {Promise<Object>} - Locataire créé avec ID
   */
  async createTenant(tenantData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        nom,
        prenom,
        email,
        telephone,
        adresse_personnelle,
        date_naissance,
        profession,
        entreprise,
        salaire_mensuel,
        propriete_id,
        reference_propriete,
        statut_contrat,
        garanteur_requis,
      } = tenantData;

      // Validation des données obligatoires
      if (!nom || !prenom || !propriete_id) {
        throw new Error('Nom, prénom et propriété requis');
      }

      // Créer le locataire
      const tenantResult = await client.query(
        `INSERT INTO locataires (
          nom, prenom, email, telephone, adresse_personnelle,
          date_naissance, profession, entreprise, salaire_mensuel,
          propriete_id, reference_propriete, statut_contrat, 
          garanteur_requis, date_creation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING id, nom, prenom, email, statut_contrat, date_creation`,
        [
          nom,
          prenom,
          email,
          telephone,
          adresse_personnelle,
          date_naissance,
          profession,
          entreprise,
          salaire_mensuel,
          propriete_id,
          reference_propriete,
          statut_contrat || 'actif',
          garanteur_requis || false,
        ]
      );

      const tenant = tenantResult.rows[0];

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        ['locataires', 'CREATE', tenant.id, JSON.stringify(tenant)]
      );

      await client.query('COMMIT');
      logger.info(`Tenant created: ${tenant.id} - ${tenant.nom} ${tenant.prenom}`);

      return {
        success: true,
        data: tenant,
        message: `Locataire ${tenant.nom} créé avec succès`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating tenant: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mettre à jour un locataire
   * @param {number} tenantId - ID du locataire
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} - Locataire mis à jour
   */
  async updateTenant(tenantId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        nom,
        prenom,
        email,
        telephone,
        adresse_personnelle,
        profession,
        entreprise,
        salaire_mensuel,
        statut_contrat,
        garanteur_requis,
      } = updates;

      // Construire la requête dynamiquement
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (nom !== undefined) {
        fields.push(`nom = $${paramIndex++}`);
        values.push(nom);
      }
      if (prenom !== undefined) {
        fields.push(`prenom = $${paramIndex++}`);
        values.push(prenom);
      }
      if (email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(email);
      }
      if (telephone !== undefined) {
        fields.push(`telephone = $${paramIndex++}`);
        values.push(telephone);
      }
      if (adresse_personnelle !== undefined) {
        fields.push(`adresse_personnelle = $${paramIndex++}`);
        values.push(adresse_personnelle);
      }
      if (profession !== undefined) {
        fields.push(`profession = $${paramIndex++}`);
        values.push(profession);
      }
      if (entreprise !== undefined) {
        fields.push(`entreprise = $${paramIndex++}`);
        values.push(entreprise);
      }
      if (salaire_mensuel !== undefined) {
        fields.push(`salaire_mensuel = $${paramIndex++}`);
        values.push(salaire_mensuel);
      }
      if (statut_contrat !== undefined) {
        fields.push(`statut_contrat = $${paramIndex++}`);
        values.push(statut_contrat);
      }
      if (garanteur_requis !== undefined) {
        fields.push(`garanteur_requis = $${paramIndex++}`);
        values.push(garanteur_requis);
      }

      if (fields.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      values.push(tenantId);

      const result = await client.query(
        `UPDATE locataires SET ${fields.join(', ')}, date_modification = NOW()
        WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Locataire non trouvé');
      }

      const updatedTenant = result.rows[0];

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        ['locataires', 'UPDATE', tenantId, JSON.stringify(updates)]
      );

      await client.query('COMMIT');
      logger.info(`Tenant updated: ${tenantId}`);

      return {
        success: true,
        data: updatedTenant,
        message: 'Locataire mis à jour avec succès',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error updating tenant: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupérer les détails d'un locataire avec garanteur
   * @param {number} tenantId - ID du locataire
   * @returns {Promise<Object>} - Détails locataire + garanteur
   */
  async getTenant(tenantId) {
    try {
      const result = await pool.query(
        `SELECT l.*, 
                g.id as garanteur_id, g.nom as garanteur_nom, 
                g.prenom as garanteur_prenom, g.email as garanteur_email,
                g.telephone as garanteur_telephone, g.relation
         FROM locataires l
         LEFT JOIN garanteurs g ON l.id = g.locataire_id
         WHERE l.id = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Locataire non trouvé');
      }

      const tenant = result.rows[0];
      const guarantor = tenant.garanteur_id ? {
        id: tenant.garanteur_id,
        nom: tenant.garanteur_nom,
        prenom: tenant.garanteur_prenom,
        email: tenant.garanteur_email,
        telephone: tenant.garanteur_telephone,
        relation: tenant.relation,
      } : null;

      // Nettoyer les champs dupliqués
      delete tenant.garanteur_id;
      delete tenant.garanteur_nom;
      delete tenant.garanteur_prenom;
      delete tenant.garanteur_email;
      delete tenant.garanteur_telephone;
      delete tenant.relation;

      return {
        success: true,
        data: { tenant, guarantor },
      };
    } catch (error) {
      logger.error(`Error getting tenant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lister tous les locataires avec pagination
   * @param {Object} filters - Filtres de recherche
   * @returns {Promise<Array>} - Liste des locataires
   */
  async listTenants(filters = {}) {
    try {
      const { propriete_id, statut_contrat, page = 1, limit = 50 } = filters;

      let query = `SELECT id, nom, prenom, email, telephone, profession, 
                          statut_contrat, propriete_id, salaire_mensuel, date_creation
                   FROM locataires WHERE 1=1`;
      const values = [];
      let paramIndex = 1;

      if (propriete_id) {
        query += ` AND propriete_id = $${paramIndex++}`;
        values.push(propriete_id);
      }

      if (statut_contrat) {
        query += ` AND statut_contrat = $${paramIndex++}`;
        values.push(statut_contrat);
      }

      // Pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY date_creation DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      // Récupérer le total
      let countQuery = `SELECT COUNT(*) FROM locataires WHERE 1=1`;
      const countValues = [];
      let countParamIndex = 1;

      if (propriete_id) {
        countQuery += ` AND propriete_id = $${countParamIndex++}`;
        countValues.push(propriete_id);
      }

      if (statut_contrat) {
        countQuery += ` AND statut_contrat = $${countParamIndex++}`;
        countValues.push(statut_contrat);
      }

      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      return {
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error listing tenants: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ajouter ou mettre à jour un garanteur
   * @param {number} tenantId - ID du locataire
   * @param {Object} guarantorData - Données du garanteur
   * @returns {Promise<Object>} - Garanteur créé/mis à jour
   */
  async addGuarantor(tenantId, guarantorData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Vérifier que le locataire existe
      const tenantCheck = await client.query(
        'SELECT id FROM locataires WHERE id = $1',
        [tenantId]
      );

      if (tenantCheck.rows.length === 0) {
        throw new Error('Locataire non trouvé');
      }

      const {
        nom,
        prenom,
        email,
        telephone,
        adresse,
        profession,
        relation,
      } = guarantorData;

      // Vérifier si un garanteur existe déjà
      const existingGuarantor = await client.query(
        'SELECT id FROM garanteurs WHERE locataire_id = $1',
        [tenantId]
      );

      let guarantor;

      if (existingGuarantor.rows.length > 0) {
        // Mettre à jour le garanteur existant
        const result = await client.query(
          `UPDATE garanteurs SET nom = $1, prenom = $2, email = $3, 
           telephone = $4, adresse = $5, profession = $6, relation = $7,
           date_modification = NOW()
           WHERE locataire_id = $8 RETURNING *`,
          [nom, prenom, email, telephone, adresse, profession, relation, tenantId]
        );
        guarantor = result.rows[0];
      } else {
        // Créer un nouveau garanteur
        const result = await client.query(
          `INSERT INTO garanteurs 
           (locataire_id, nom, prenom, email, telephone, adresse, 
            profession, relation, date_creation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           RETURNING *`,
          [tenantId, nom, prenom, email, telephone, adresse, profession, relation]
        );
        guarantor = result.rows[0];
      }

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        ['garanteurs', existingGuarantor.rows.length > 0 ? 'UPDATE' : 'CREATE', 
         guarantor.id, JSON.stringify(guarantor)]
      );

      await client.query('COMMIT');
      logger.info(`Guarantor added/updated for tenant: ${tenantId}`);

      return {
        success: true,
        data: guarantor,
        message: `Garanteur ${nom} ${prenom} enregistré avec succès`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error adding guarantor: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Supprimer un locataire (soft delete)
   * @param {number} tenantId - ID du locataire
   * @returns {Promise<Object>} - Résultat de la suppression
   */
  async deleteTenant(tenantId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Soft delete - marquer comme inactif
      const result = await client.query(
        `UPDATE locataires SET statut_contrat = 'archivé', 
         date_modification = NOW() WHERE id = $1 RETURNING id, nom, prenom`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Locataire non trouvé');
      }

      const deletedTenant = result.rows[0];

      // Audit logging
      await client.query(
        `INSERT INTO audit_logs (entite, action, entite_id, details, date_action)
        VALUES ($1, $2, $3, $4, NOW())`,
        ['locataires', 'DELETE', tenantId, `Locataire archivé: ${deletedTenant.nom} ${deletedTenant.prenom}`]
      );

      await client.query('COMMIT');
      logger.info(`Tenant archived: ${tenantId}`);

      return {
        success: true,
        data: deletedTenant,
        message: 'Locataire archivé avec succès',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error deleting tenant: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new TenantService();
