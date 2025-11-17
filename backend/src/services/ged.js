/**
 * Document Management Service (GED) - Simplified
 * backend/src/services/ged.js
 * 
 * Service simplifié pour la gestion documentaire
 */

const crypto = require('crypto');
const pool = require('../db');

/**
 * Crée un checksum SHA256 pour un buffer
 */
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sauvegarde une nouvelle version d'un document
 */
async function saveNewVersion(docId, buffer, filePath, notes = '') {
  try {
    const checksum = sha256(buffer);

    // Incrémenter la version
    await pool.query(
      `UPDATE documents SET version = version + 1, path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [filePath, docId]
    );

    // Récupérer le numéro de version
    const versionResult = await pool.query(
      `SELECT version FROM documents WHERE id = $1`,
      [docId]
    );

    const newVersion = versionResult.rows[0].version;

    // Créer l'entrée dans document_versions
    const result = await pool.query(
      `INSERT INTO document_versions(document_id, version, path, checksum, file_size, notes)
       VALUES($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [docId, newVersion, filePath, checksum, buffer.length, notes]
    );

    return {
      version: newVersion,
      checksum: checksum,
      size: buffer.length,
      path: filePath,
    };
  } catch (error) {
    console.error('Error saving new version:', error);
    throw error;
  }
}

/**
 * Crée un nouveau document
 */
async function createDocument(agencyId, name, filePath, buffer, mimeType, createdBy) {
  try {
    const checksum = sha256(buffer);

    // Créer le document
    const docResult = await pool.query(
      `INSERT INTO documents(agency_id, name, path, original_name, file_type, file_size, created_by)
       VALUES($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [agencyId, name, filePath, name, mimeType, buffer.length, createdBy]
    );

    const documentId = docResult.rows[0].id;

    // Créer la première version
    await pool.query(
      `INSERT INTO document_versions(document_id, version, path, checksum, file_size, created_by)
       VALUES($1, $2, $3, $4, $5, $6)`,
      [documentId, 1, filePath, checksum, buffer.length, createdBy]
    );

    return {
      id: documentId,
      name: name,
      checksum: checksum,
      size: buffer.length,
      path: filePath,
    };
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

/**
 * Récupère un document
 */
async function getDocument(docId) {
  try {
    const result = await pool.query(
      `SELECT id, name, path, version, file_type, file_size, status, created_at, updated_at
       FROM documents
       WHERE id = $1`,
      [docId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

/**
 * Récupère l'historique des versions
 */
async function getVersionHistory(docId, limit = 20) {
  try {
    const result = await pool.query(
      `SELECT version, path, file_size, checksum, created_at, notes
       FROM document_versions
       WHERE document_id = $1
       ORDER BY version DESC
       LIMIT $2`,
      [docId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting version history:', error);
    throw error;
  }
}

/**
 * Restaure une version antérieure
 */
async function restoreVersion(docId, versionNum, restoredBy) {
  try {
    // Récupérer la version à restaurer
    const versionResult = await pool.query(
      `SELECT * FROM document_versions 
       WHERE document_id = $1 AND version = $2`,
      [docId, versionNum]
    );

    if (versionResult.rows.length === 0) {
      throw new Error('Version not found');
    }

    const version = versionResult.rows[0];

    // Créer une nouvelle version avec le chemin de l'ancienne
    return await saveNewVersion(
      docId,
      Buffer.alloc(0),
      version.path,
      `Restored from version ${versionNum}`
    );
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
}

/**
 * Vérifie l'intégrité d'une version
 */
async function verifyVersion(docId, versionNum, buffer) {
  try {
    const result = await pool.query(
      `SELECT checksum FROM document_versions 
       WHERE document_id = $1 AND version = $2`,
      [docId, versionNum]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const expectedChecksum = result.rows[0].checksum;
    const actualChecksum = sha256(buffer);

    return expectedChecksum === actualChecksum;
  } catch (error) {
    console.error('Error verifying version:', error);
    throw error;
  }
}

/**
 * Enregistre l'accès à un document
 */
async function logAccess(docId, userId, action, ipAddress = null, userAgent = null) {
  try {
    await pool.query(
      `INSERT INTO document_access_log(document_id, user_id, action, ip_address, user_agent)
       VALUES($1, $2, $3, $4, $5)`,
      [docId, userId, action, ipAddress, userAgent]
    );

    return true;
  } catch (error) {
    console.error('Error logging access:', error);
    return false;
  }
}

/**
 * Partage un document
 */
async function shareDocument(docId, userId, permission = 'view', sharedBy) {
  try {
    const result = await pool.query(
      `INSERT INTO document_sharing(document_id, shared_with_user_id, permission, shared_by)
       VALUES($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [docId, userId, permission, sharedBy]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error sharing document:', error);
    throw error;
  }
}

/**
 * Récupère les documents partagés avec un utilisateur
 */
async function getSharedDocuments(userId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.file_type, d.file_size, 
              ds.permission, ds.shared_at, ds.expires_at
       FROM document_sharing ds
       JOIN documents d ON ds.document_id = d.id
       WHERE ds.shared_with_user_id = $1
       AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
       ORDER BY ds.shared_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting shared documents:', error);
    throw error;
  }
}

/**
 * Récupère les documents d'une agence
 */
async function getAgencyDocuments(agencyId, filters = {}) {
  try {
    let query = `SELECT id, name, file_type, file_size, version, status, created_at
                 FROM documents WHERE agency_id = $1`;
    const params = [agencyId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
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
    console.error('Error getting agency documents:', error);
    throw error;
  }
}

/**
 * Supprime un document
 */
async function deleteDocument(docId) {
  try {
    const result = await pool.query(
      `DELETE FROM documents WHERE id = $1 RETURNING *`,
      [docId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'accès
 */
async function getAccessStats(docId) {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_accesses,
         COUNT(DISTINCT user_id) as unique_users,
         MAX(accessed_at) as last_accessed,
         COUNT(CASE WHEN action = 'download' THEN 1 END) as downloads,
         COUNT(CASE WHEN action = 'view' THEN 1 END) as views
       FROM document_access_log
       WHERE document_id = $1`,
      [docId]
    );

    const row = result.rows[0];
    return {
      totalAccesses: parseInt(row.total_accesses),
      uniqueUsers: parseInt(row.unique_users),
      lastAccessed: row.last_accessed,
      downloads: parseInt(row.downloads),
      views: parseInt(row.views),
    };
  } catch (error) {
    console.error('Error getting access stats:', error);
    throw error;
  }
}

module.exports = {
  sha256,
  saveNewVersion,
  createDocument,
  getDocument,
  getVersionHistory,
  restoreVersion,
  verifyVersion,
  logAccess,
  shareDocument,
  getSharedDocuments,
  getAgencyDocuments,
  deleteDocument,
  getAccessStats,
};
