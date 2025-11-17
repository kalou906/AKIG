/**
 * 🚀 SUPER-SYSTÈME AKIG - NIVEAU ENTERPRISE
 * Gestion Documents Agence + Branding + IA Avancée
 * 
 * backend/src/services/agency-documents.service.js
 */

const fs = require('fs').promises;
const path = require('path');
const pool = require('../db');
const logger = require('./logger');

const DOCUMENTS_DIR = path.join(__dirname, '../../public/agency-documents');
const TEMPLATES_DIR = path.join(__dirname, '../../templates/agency');

/**
 * Service gestion documents agence
 * Contrats de location, gérance, audits, références
 */
const AgencyDocumentsService = {
  /**
   * Initialiser les répertoires
   */
  async initialize() {
    try {
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
      await fs.mkdir(TEMPLATES_DIR, { recursive: true });
      logger.info('Répertoires documents agence initialisés');
    } catch (err) {
      logger.error('Erreur init répertoires documents', err);
    }
  },

  /**
   * Importer document agence (contrat, gérance, audit)
   * @param {Object} params - { type, file, metadata }
   * @returns {Promise<Object>} Document importé
   */
  async importAgencyDocument(params) {
    const { type, file, metadata = {} } = params;

    try {
      if (!['location', 'gerance', 'audit', 'reference'].includes(type)) {
        throw new Error(`Type invalide: ${type}`);
      }

      const documentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileExt = path.extname(file.originalname);
      const savedPath = path.join(DOCUMENTS_DIR, `${documentId}${fileExt}`);

      // Sauvegarder le fichier
      await fs.writeFile(savedPath, file.buffer);

      // Enregistrer en BD
      const result = await pool.query(
        `INSERT INTO agency_documents 
         (id, type, filename, file_path, metadata, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [documentId, type, file.originalname, savedPath, JSON.stringify(metadata), 'imported']
      );

      logger.info('Document agence importé', { type, documentId });
      return result.rows[0];
    } catch (err) {
      logger.error('Erreur import document agence', err);
      throw err;
    }
  },

  /**
   * Récupérer tous les documents d'un type
   * @param {string} type - 'location', 'gerance', 'audit', 'reference'
   */
  async getDocumentsByType(type) {
    try {
      const result = await pool.query(
        `SELECT * FROM agency_documents 
         WHERE type = $1 AND status = 'imported'
         ORDER BY created_at DESC`,
        [type]
      );
      return result.rows;
    } catch (err) {
      logger.error('Erreur récupération documents', err);
      throw err;
    }
  },

  /**
   * Récupérer document avec son contenu
   */
  async getDocumentWithContent(documentId) {
    try {
      const docResult = await pool.query(
        'SELECT * FROM agency_documents WHERE id = $1',
        [documentId]
      );

      if (docResult.rows.length === 0) {
        throw new Error('Document non trouvé');
      }

      const doc = docResult.rows[0];
      const content = await fs.readFile(doc.file_path, 'utf8');

      return { ...doc, content };
    } catch (err) {
      logger.error('Erreur lecture document', err);
      throw err;
    }
  },

  /**
   * Utiliser document comme template
   * Remplacer variables et générer document personnalisé
   */
  async generateDocumentFromTemplate(params) {
    const { documentId, replacements = {}, format = 'pdf' } = params;

    try {
      const doc = await this.getDocumentWithContent(documentId);
      let processedContent = doc.content;

      // Remplacer variables {{variable}}
      Object.entries(replacements).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedContent = processedContent.replace(regex, value || '');
      });

      logger.info('Document généré depuis template', { documentId });
      return { content: processedContent, format };
    } catch (err) {
      logger.error('Erreur génération document template', err);
      throw err;
    }
  },

  /**
   * Exporter tous les documents pour intégration système
   */
  async exportAllDocuments() {
    try {
      const result = await pool.query(
        `SELECT id, type, filename, metadata, created_at 
         FROM agency_documents 
         WHERE status = 'imported'
         ORDER BY type, created_at DESC`
      );

      const documentsIndex = {
        location: [],
        gerance: [],
        audit: [],
        reference: [],
        exportDate: new Date().toISOString(),
        totalCount: result.rows.length
      };

      result.rows.forEach(doc => {
        documentsIndex[doc.type].push({
          id: doc.id,
          filename: doc.filename,
          metadata: doc.metadata,
          importedAt: doc.created_at
        });
      });

      logger.info('Documents exportés', { count: result.rowCount });
      return documentsIndex;
    } catch (err) {
      logger.error('Erreur export documents', err);
      throw err;
    }
  },

  /**
   * Associer document à contrat/tenant
   */
  async attachDocumentToEntity(params) {
    const { documentId, entityType, entityId } = params;

    try {
      const result = await pool.query(
        `INSERT INTO document_attachments 
         (document_id, entity_type, entity_id, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [documentId, entityType, entityId]
      );

      logger.info('Document attaché', { documentId, entityType, entityId });
      return result.rows[0];
    } catch (err) {
      logger.error('Erreur attachement document', err);
      throw err;
    }
  },

  /**
   * Récupérer documents associés à une entité
   */
  async getAttachedDocuments(entityType, entityId) {
    try {
      const result = await pool.query(
        `SELECT ad.*, da.created_at as attached_at
         FROM agency_documents ad
         JOIN document_attachments da ON ad.id = da.document_id
         WHERE da.entity_type = $1 AND da.entity_id = $2
         ORDER BY da.created_at DESC`,
        [entityType, entityId]
      );

      return result.rows;
    } catch (err) {
      logger.error('Erreur récupération documents attachés', err);
      throw err;
    }
  }
};

module.exports = AgencyDocumentsService;
