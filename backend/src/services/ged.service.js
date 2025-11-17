/**
 * Document Management Service (GED)
 * backend/src/services/ged.service.js
 * 
 * Service pour la gestion des documents avec versioning
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../db');
const logger = require('./logger');

class GEDService {
  /**
   * Crée un checksum SHA256 pour un fichier
   */
  static async createChecksum(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      logger.error('Error creating checksum', { error: error.message });
      throw error;
    }
  }

  /**
   * Crée un nouveau document
   */
  static async createDocument(data) {
    const {
      agencyId,
      name,
      filePath,
      fileName,
      fileType,
      fileSize,
      metadata = {},
      createdBy,
    } = data;

    try {
      const checksum = await this.createChecksum(filePath);

      // Créer le document
      const docResult = await pool.query(
        `INSERT INTO documents (agency_id, name, path, original_name, file_type, file_size, meta, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [agencyId, name, filePath, fileName, fileType, fileSize, JSON.stringify(metadata), createdBy]
      );

      const document = docResult.rows[0];

      // Créer la première version
      await pool.query(
        `INSERT INTO document_versions (document_id, version, path, file_size, checksum, file_type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [document.id, 1, filePath, fileSize, checksum, fileType, createdBy]
      );

      logger.info('Document created', { documentId: document.id, name });
      return document;
    } catch (error) {
      logger.error('Error creating document', { error: error.message, name });
      throw error;
    }
  }

  /**
   * Récupère un document par ID
   */
  static async getDocument(documentId) {
    try {
      const result = await pool.query(
        `SELECT * FROM get_document_info($1)`,
        [documentId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching document', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Met à jour un document (crée une nouvelle version)
   */
  static async updateDocument(documentId, newFilePath, fileSize, notes = '', updatedBy) {
    try {
      const checksum = await this.createChecksum(newFilePath);

      // Obtenir le document courant
      const docResult = await pool.query(
        `SELECT * FROM documents WHERE id = $1`,
        [documentId]
      );

      if (docResult.rows.length === 0) {
        throw new Error('Document not found');
      }

      const document = docResult.rows[0];

      // Incrémenter la version
      const newVersion = document.version + 1;

      // Créer la nouvelle version
      const versionResult = await pool.query(
        `INSERT INTO document_versions (document_id, version, path, file_size, checksum, created_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [documentId, newVersion, newFilePath, fileSize, checksum, updatedBy, notes]
      );

      // Mettre à jour le document
      await pool.query(
        `UPDATE documents SET path = $1, version = $2, file_size = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [newFilePath, newVersion, fileSize, updatedBy, documentId]
      );

      logger.info('Document updated', { documentId, newVersion });
      return versionResult.rows[0];
    } catch (error) {
      logger.error('Error updating document', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Récupère l'historique d'un document
   */
  static async getDocumentHistory(documentId, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT * FROM get_document_history($1, $2)`,
        [documentId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching document history', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Restaure une version antérieure
   */
  static async restoreVersion(documentId, versionNumber, restoredBy) {
    try {
      // Obtenir la version à restaurer
      const versionResult = await pool.query(
        `SELECT * FROM document_versions WHERE document_id = $1 AND version = $2`,
        [documentId, versionNumber]
      );

      if (versionResult.rows.length === 0) {
        throw new Error('Version not found');
      }

      const version = versionResult.rows[0];

      // Créer une nouvelle version avec le contenu de l'ancienne
      const newVersion = await this.updateDocument(
        documentId,
        version.path,
        version.file_size,
        `Restored from version ${versionNumber}`,
        restoredBy
      );

      logger.info('Document version restored', { documentId, restoredVersion: versionNumber });
      return newVersion;
    } catch (error) {
      logger.error('Error restoring version', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Partage un document
   */
  static async shareDocument(documentId, sharedWithUserId, permission = 'view', sharedBy, expiresAt = null) {
    try {
      const result = await pool.query(
        `INSERT INTO document_sharing (document_id, shared_with_user_id, permission, shared_by, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [documentId, sharedWithUserId, permission, sharedBy, expiresAt]
      );

      logger.info('Document shared', { documentId, sharedWithUserId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error sharing document', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Récupère les documents partagés avec un utilisateur
   */
  static async getSharedDocuments(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM get_shared_documents($1, $2)`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching shared documents', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Enregistre un accès à un document
   */
  static async logAccess(documentId, userId, action, ipAddress = null, userAgent = null) {
    try {
      await pool.query(
        `SELECT log_document_access($1, $2, $3, $4, $5)`,
        [documentId, userId, action, ipAddress, userAgent]
      );

      return true;
    } catch (error) {
      logger.error('Error logging document access', { error: error.message });
      // Ne pas lever l'erreur, juste logger
      return false;
    }
  }

  /**
   * Récupère les documents d'une agence
   */
  static async getAgencyDocuments(agencyId, filters = {}) {
    try {
      let query = `SELECT * FROM documents WHERE agency_id = $1`;
      const params = [agencyId];
      let paramCount = 2;

      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters.fileType) {
        query += ` AND file_type = $${paramCount}`;
        params.push(filters.fileType);
        paramCount++;
      }

      if (filters.search) {
        query += ` AND name ILIKE $${paramCount}`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching agency documents', { error: error.message, agencyId });
      throw error;
    }
  }

  /**
   * Supprime un document
   */
  static async deleteDocument(documentId) {
    try {
      const result = await pool.query(
        `DELETE FROM documents WHERE id = $1 RETURNING *`,
        [documentId]
      );

      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      logger.info('Document deleted', { documentId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting document', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'accès aux documents
   */
  static async getAccessStats(documentId) {
    try {
      const result = await pool.query(
        `SELECT * FROM vw_document_access_stats WHERE id = $1`,
        [documentId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching access stats', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Obtient les documents récents
   */
  static async getRecentDocuments(limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM vw_recent_documents LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching recent documents', { error: error.message });
      throw error;
    }
  }

  /**
   * Ajoute des tags à un document
   */
  static async addTags(documentId, tags) {
    try {
      const result = await pool.query(
        `UPDATE documents SET tags = array_cat(COALESCE(tags, '{}'), $2)
         WHERE id = $1
         RETURNING tags`,
        [documentId, tags]
      );

      return result.rows[0].tags;
    } catch (error) {
      logger.error('Error adding tags', { error: error.message, documentId });
      throw error;
    }
  }

  /**
   * Recherche les documents par tags
   */
  static async searchByTags(agencyId, tags) {
    try {
      const result = await pool.query(
        `SELECT * FROM documents 
         WHERE agency_id = $1 AND tags && $2
         ORDER BY created_at DESC`,
        [agencyId, tags]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error searching by tags', { error: error.message });
      throw error;
    }
  }
}

module.exports = GEDService;
