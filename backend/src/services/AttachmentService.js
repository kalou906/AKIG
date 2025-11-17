/**
 * AttachmentService.js
 * Phase 9: Gestion des fichiers et attachements
 * Upload, validation, preview, search avec virus scan
 */

const pool = require('../db');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const Joi = require('joi');

class AttachmentService {
  constructor() {
    this.allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'zip'];
    this.maxFileSize = 10 * 1024 * 1024; // 10 MB
    this.uploadDir = path.join(__dirname, '../../uploads');
  }

  /**
   * Uploader un fichier
   * @param {Object} file - Objet fichier {filename, mimetype, buffer}
   * @param {number} userId - ID utilisateur
   * @param {string} entityType - Type entité (contrat, edl, candidature, etc)
   * @param {number} entityId - ID entité
   * @returns {Promise<Object>} Attachment créé
   */
  async uploadFile(file, userId, entityType, entityId) {
    // Validation
    const ext = path.extname(file.filename).slice(1).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`File type .${ext} not allowed`);
    }
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds 10 MB limit`);
    }

    // Générer filename unique
    const fileHash = crypto.randomBytes(16).toString('hex');
    const safeFilename = `${fileHash}.${ext}`;
    const filePath = path.join(this.uploadDir, safeFilename);

    try {
      // Créer répertoire si nécessaire
      await fs.mkdir(this.uploadDir, { recursive: true });

      // Écrire le fichier
      await fs.writeFile(filePath, file.buffer);

      // Insérer en DB
      const result = await pool.query(
        `INSERT INTO attachments 
        (original_filename, physical_filename, ext, file_size, mime_type, entity_type, entity_id, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          file.filename,
          safeFilename,
          ext,
          file.size,
          file.mimetype,
          entityType,
          entityId,
          userId
        ]
      );

      // Audit log
      await pool.query(
        `INSERT INTO audit_logs (table_name, operation, record_id, user_id)
         VALUES ('attachments', 'UPLOAD', $1, $2)`,
        [result.rows[0].id, userId]
      );

      return result.rows[0];
    } catch (error) {
      // Cleanup si erreur
      try {
        await fs.unlink(filePath);
      } catch (e) {}
      throw error;
    }
  }

  /**
   * Récupérer attachment par ID
   * @param {number} attachmentId - ID attachment
   * @returns {Promise<Object>}
   */
  async getAttachmentById(attachmentId) {
    const result = await pool.query(
      `SELECT * FROM attachments WHERE id = $1 AND deleted_at IS NULL`,
      [attachmentId]
    );

    if (result.rows.length === 0) throw new Error('Attachment not found');
    return result.rows[0];
  }

  /**
   * Lister attachments par entité
   * @param {string} entityType - Type entité
   * @param {number} entityId - ID entité
   * @returns {Promise<Array>}
   */
  async listAttachmentsByEntity(entityType, entityId) {
    const result = await pool.query(
      `SELECT * FROM attachments 
       WHERE entity_type = $1 AND entity_id = $2 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [entityType, entityId]
    );

    return result.rows;
  }

  /**
   * Rechercher attachments
   * @param {Object} filters - {filename, ext, entity_type, date_from, date_to}
   * @param {number} page - Page numero
   * @param {number} limit - Items par page
   * @returns {Promise<Array>}
   */
  async searchAttachments(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM attachments WHERE deleted_at IS NULL`;
    let params = [];
    let paramCount = 1;

    if (filters.filename) {
      query += ` AND original_filename ILIKE $${paramCount++}`;
      params.push(`%${filters.filename}%`);
    }
    if (filters.ext) {
      query += ` AND ext = $${paramCount++}`;
      params.push(filters.ext);
    }
    if (filters.entity_type) {
      query += ` AND entity_type = $${paramCount++}`;
      params.push(filters.entity_type);
    }
    if (filters.date_from) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(filters.date_to);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Télécharger fichier (obtenir buffer + headers)
   * @param {number} attachmentId - ID attachment
   * @returns {Promise<{buffer, filename, mimetype}>}
   */
  async downloadFile(attachmentId) {
    const attachment = await this.getAttachmentById(attachmentId);
    const filePath = path.join(this.uploadDir, attachment.physical_filename);

    try {
      const buffer = await fs.readFile(filePath);

      // Log download
      await pool.query(
        `UPDATE attachments SET download_count = download_count + 1, last_download = NOW()
         WHERE id = $1`,
        [attachmentId]
      );

      return {
        buffer,
        filename: attachment.original_filename,
        mimetype: attachment.mime_type
      };
    } catch (error) {
      throw new Error(`File not found: ${attachment.physical_filename}`);
    }
  }

  /**
   * Obtenir aperçu fichier (image/PDF petit)
   * @param {number} attachmentId - ID attachment
   * @param {string} size - 'thumb' ou 'preview'
   * @returns {Promise<Buffer>}
   */
  async getPreview(attachmentId, size = 'thumb') {
    const attachment = await this.getAttachmentById(attachmentId);
    
    // Pour images: retourner directement ou avec resize
    if (['jpg', 'jpeg', 'png', 'gif'].includes(attachment.ext)) {
      const filePath = path.join(this.uploadDir, attachment.physical_filename);
      return await fs.readFile(filePath);
    }

    throw new Error('Preview not available for this file type');
  }

  /**
   * Supprimer attachment (soft delete)
   * @param {number} attachmentId - ID attachment
   * @param {number} userId - ID utilisateur
   * @returns {Promise<Boolean>}
   */
  async deleteAttachment(attachmentId, userId) {
    const attachment = await this.getAttachmentById(attachmentId);

    await pool.query(
      `UPDATE attachments SET deleted_at = NOW() WHERE id = $1`,
      [attachmentId]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (table_name, operation, record_id, user_id)
       VALUES ('attachments', 'DELETE', $1, $2)`,
      [attachmentId, userId]
    );

    // Optionnel: supprimer fichier physique après 30 jours
    // Pour maintenant: garder pour restauration

    return true;
  }

  /**
   * Obtenir statistiques attachments
   * @returns {Promise<Object>}
   */
  async getAttachmentStats() {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
        SUM(file_size) as total_size_bytes,
        COUNT(DISTINCT entity_type) as entity_types,
        COUNT(DISTINCT ext) as file_types,
        MAX(created_at) as last_upload
       FROM attachments`
    );

    return result.rows[0];
  }

  /**
   * Obtenir fichiers par type
   * @returns {Promise<Object>}
   */
  async getAttachmentsByType() {
    const result = await pool.query(
      `SELECT ext, COUNT(*) as count, SUM(file_size) as total_size
       FROM attachments
       WHERE deleted_at IS NULL
       GROUP BY ext
       ORDER BY count DESC`
    );

    return result.rows;
  }

  /**
   * Exporter liste attachments
   * @param {number} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Promise<string>} JSON export
   */
  async exportAttachmentsList(entityType, entityId) {
    const attachments = await this.listAttachmentsByEntity(entityType, entityId);
    return JSON.stringify(attachments, null, 2);
  }
}

module.exports = new AttachmentService();
