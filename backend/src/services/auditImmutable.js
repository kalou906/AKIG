/**
 * Immutable Audit Service
 * Gère les logs d'audit avec chaîne de hachage blockchain-like
 * Assure la traçabilité et l'intégrité des données
 */

const crypto = require('crypto');
const { trace } = require('@opentelemetry/api');
const logger = require('./logger');

const tracer = trace.getTracer('audit-immutable');

// Cache du dernier hash en mémoire pour éviter les requêtes
let lastHashCache = null;
let cacheRefreshTime = 0;
const CACHE_TTL = 5000; // Rafraîchir toutes les 5 secondes

/**
 * Calcule le hash SHA256 d'une entrée audit
 * @param {Object} entry - Entrée audit
 * @param {string} prevHash - Hash précédent dans la chaîne
 * @returns {string} Hash SHA256 hex
 */
function calculateHash(entry, prevHash) {
  const data = {
    prev_hash: prevHash || '0',
    actor_id: entry.actor_id || '',
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entity_id || '',
    payload: entry.payload ? JSON.stringify(entry.payload) : '{}',
    ts: entry.ts,
  };

  const base = Object.values(data).join('|');
  return crypto.createHash('sha256').update(base).digest('hex');
}

/**
 * Récupère le dernier hash de la chaîne
 * @param {Pool} pool - Connection PostgreSQL
 * @returns {Promise<string|null>} Dernier hash ou null
 */
async function getLastHash(pool) {
  const span = tracer.startSpan('audit.getLastHash');

  try {
    // Utiliser le cache si valide
    if (lastHashCache !== null && Date.now() - cacheRefreshTime < CACHE_TTL) {
      span.addEvent('cache_hit');
      return lastHashCache;
    }

    // Récupérer depuis la base de données
    const { rows } = await pool.query(
      `SELECT curr_hash FROM audit_log_immutable ORDER BY id DESC LIMIT 1`
    );

    const hash = rows.length > 0 ? rows[0].curr_hash : null;
    
    // Mettre à jour le cache
    lastHashCache = hash;
    cacheRefreshTime = Date.now();

    span.setAttributes({
      'audit.last_hash': hash || 'null',
      'cache.updated': true,
    });

    return hash;
  } catch (error) {
    logger.error('Error fetching last hash', {
      error: error.message,
    });
    span.recordException(error);
    return null;
  } finally {
    span.end();
  }
}

/**
 * Ajoute une entrée d'audit à la chaîne immuable
 * @param {Pool} pool - Connection PostgreSQL
 * @param {Object} entry - Entrée d'audit
 * @param {number} entry.actor_id - ID de l'acteur
 * @param {string} entry.action - Action effectuée
 * @param {string} entry.entity - Entité affectée
 * @param {number} entry.entity_id - ID de l'entité (optionnel)
 * @param {Object} entry.payload - Données supplémentaires (optionnel)
 * @returns {Promise<Object>} Entrée insérée avec hash
 */
async function append(pool, entry) {
  const span = tracer.startSpan('audit.append', {
    attributes: {
      'audit.action': entry.action,
      'audit.entity': entry.entity,
      'audit.actor_id': entry.actor_id,
    },
  });

  try {
    // Valider l'entrée
    if (!entry.action || !entry.entity) {
      throw new Error('action et entity sont requis');
    }

    // Ajouter le timestamp
    const ts = new Date().toISOString();
    
    // Récupérer le hash précédent
    const prevHash = await getLastHash(pool);
    
    // Calculer le nouveau hash
    const currHash = calculateHash({ ...entry, ts }, prevHash);

    // Insérer l'entrée
    const { rows } = await pool.query(
      `INSERT INTO audit_log_immutable (actor_id, action, entity, entity_id, payload, ts, prev_hash, curr_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, actor_id, action, entity, entity_id, payload, ts, prev_hash, curr_hash`,
      [entry.actor_id, entry.action, entry.entity, entry.entity_id || null, entry.payload || {}, ts, prevHash, currHash]
    );

    const inserted = rows[0];

    // Mettre à jour le cache
    lastHashCache = currHash;
    cacheRefreshTime = Date.now();

    logger.info('Audit entry appended', {
      audit_id: inserted.id,
      action: entry.action,
      entity: entry.entity,
      actor_id: entry.actor_id,
      hash: currHash,
    });

    span.addEvent('entry_appended', {
      'audit.id': inserted.id,
      'audit.hash': currHash,
    });

    return inserted;
  } catch (error) {
    logger.error('Error appending audit entry', {
      action: entry.action,
      entity: entry.entity,
      error: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Vérifie l'intégrité de la chaîne de hachage
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number} startId - ID de départ (optionnel)
 * @param {number} endId - ID de fin (optionnel)
 * @returns {Promise<Object>} Résultats de vérification
 */
async function verifyChainIntegrity(pool, startId = null, endId = null) {
  const span = tracer.startSpan('audit.verifyChainIntegrity');

  try {
    // Récupérer les entrées à vérifier
    let query = 'SELECT id, actor_id, action, entity, entity_id, payload, ts, prev_hash, curr_hash FROM audit_log_immutable';
    const params = [];

    if (startId !== null || endId !== null) {
      const conditions = [];
      if (startId !== null) {
        conditions.push(`id >= $${params.length + 1}`);
        params.push(startId);
      }
      if (endId !== null) {
        conditions.push(`id <= $${params.length + 1}`);
        params.push(endId);
      }
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY id ASC';

    const { rows } = await pool.query(query, params);

    const results = {
      total_entries: rows.length,
      valid_entries: 0,
      invalid_entries: 0,
      details: [],
    };

    let expectedPrevHash = null;

    for (const entry of rows) {
      const calculatedHash = calculateHash(entry, entry.prev_hash);
      const isValid = calculatedHash === entry.curr_hash && entry.prev_hash === expectedPrevHash;

      results[isValid ? 'valid_entries' : 'invalid_entries']++;

      if (!isValid) {
        results.details.push({
          id: entry.id,
          is_valid: false,
          expected_hash: calculatedHash,
          actual_hash: entry.curr_hash,
          expected_prev_hash: expectedPrevHash,
          actual_prev_hash: entry.prev_hash,
          action: entry.action,
          entity: entry.entity,
          ts: entry.ts,
        });
      }

      expectedPrevHash = entry.curr_hash;
    }

    span.setAttributes({
      'audit.total_entries': results.total_entries,
      'audit.valid_entries': results.valid_entries,
      'audit.invalid_entries': results.invalid_entries,
      'chain.integrity': results.invalid_entries === 0,
    });

    logger.info('Chain integrity verification completed', {
      total: results.total_entries,
      valid: results.valid_entries,
      invalid: results.invalid_entries,
    });

    return results;
  } catch (error) {
    logger.error('Error verifying chain integrity', {
      error: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Récupère les événements d'audit pour un utilisateur
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number} userId - ID de l'utilisateur
 * @param {number} limit - Limite de résultats (défaut: 100)
 * @param {number} offset - Offset (défaut: 0)
 * @returns {Promise<Array>} Événements d'audit
 */
async function getUserAuditEvents(pool, userId, limit = 100, offset = 0) {
  const span = tracer.startSpan('audit.getUserAuditEvents', {
    attributes: {
      'user.id': userId,
      'pagination.limit': limit,
      'pagination.offset': offset,
    },
  });

  try {
    const { rows } = await pool.query(
      `SELECT id, action, entity, entity_id, payload, ts, curr_hash
       FROM audit_log_immutable
       WHERE actor_id = $1
       ORDER BY ts DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    span.addEvent('events_retrieved', {
      'events.count': rows.length,
    });

    return rows;
  } catch (error) {
    logger.error('Error fetching user audit events', {
      user_id: userId,
      error: error.message,
    });
    span.recordException(error);
    return [];
  } finally {
    span.end();
  }
}

/**
 * Récupère les événements d'audit pour une entité
 * @param {Pool} pool - Connection PostgreSQL
 * @param {string} entity - Nom de l'entité
 * @param {number} entityId - ID de l'entité
 * @param {number} limit - Limite de résultats (défaut: 100)
 * @returns {Promise<Array>} Événements d'audit
 */
async function getEntityAuditEvents(pool, entity, entityId, limit = 100) {
  const span = tracer.startSpan('audit.getEntityAuditEvents', {
    attributes: {
      'entity.type': entity,
      'entity.id': entityId,
      'pagination.limit': limit,
    },
  });

  try {
    const { rows } = await pool.query(
      `SELECT id, actor_id, action, payload, ts, curr_hash
       FROM audit_log_immutable
       WHERE entity = $1 AND entity_id = $2
       ORDER BY ts DESC
       LIMIT $3`,
      [entity, entityId, limit]
    );

    span.addEvent('events_retrieved', {
      'events.count': rows.length,
    });

    return rows;
  } catch (error) {
    logger.error('Error fetching entity audit events', {
      entity,
      entity_id: entityId,
      error: error.message,
    });
    span.recordException(error);
    return [];
  } finally {
    span.end();
  }
}

/**
 * Crée un digest périodique des logs d'audit
 * @param {Pool} pool - Connection PostgreSQL
 * @param {Date} periodStart - Début de la période
 * @param {Date} periodEnd - Fin de la période
 * @returns {Promise<Object>} Digest créé
 */
async function createDigest(pool, periodStart, periodEnd) {
  const span = tracer.startSpan('audit.createDigest', {
    attributes: {
      'period.start': periodStart.toISOString(),
      'period.end': periodEnd.toISOString(),
    },
  });

  try {
    const { rows } = await pool.query(
      `SELECT create_audit_digest($1, $2) as digest_id`,
      [periodStart, periodEnd]
    );

    const digestId = rows[0].digest_id;

    logger.info('Audit digest created', {
      digest_id: digestId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    span.addEvent('digest_created', {
      'digest.id': digestId,
    });

    return { id: digestId, period_start: periodStart, period_end: periodEnd };
  } catch (error) {
    logger.error('Error creating audit digest', {
      error: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Exporte les événements d'audit pour une période
 * @param {Pool} pool - Connection PostgreSQL
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {Promise<Array>} Événements d'audit
 */
async function exportAuditTrail(pool, startDate, endDate) {
  const span = tracer.startSpan('audit.exportAuditTrail', {
    attributes: {
      'period.start': startDate.toISOString(),
      'period.end': endDate.toISOString(),
    },
  });

  try {
    const { rows } = await pool.query(
      `SELECT id, actor_id, action, entity, entity_id, payload, ts, curr_hash
       FROM audit_log_immutable
       WHERE ts BETWEEN $1 AND $2
       ORDER BY ts ASC`,
      [startDate, endDate]
    );

    span.addEvent('trail_exported', {
      'events.count': rows.length,
    });

    return rows;
  } catch (error) {
    logger.error('Error exporting audit trail', {
      error: error.message,
    });
    span.recordException(error);
    return [];
  } finally {
    span.end();
  }
}

/**
 * Récupère les statistiques d'audit
 * @param {Pool} pool - Connection PostgreSQL
 * @param {Date} since - Depuis (optionnel)
 * @returns {Promise<Object>} Statistiques
 */
async function getAuditStats(pool, since = null) {
  const span = tracer.startSpan('audit.getAuditStats');

  try {
    let query = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT actor_id) as unique_actors,
        COUNT(DISTINCT entity) as unique_entities,
        COUNT(DISTINCT action) as unique_actions,
        MIN(ts) as oldest_entry,
        MAX(ts) as newest_entry
      FROM audit_log_immutable
    `;
    const params = [];

    if (since) {
      query += ' WHERE ts >= $1';
      params.push(since);
    }

    const { rows } = await pool.query(query, params);
    const stats = rows[0];

    // Récupérer les actions les plus fréquentes
    const { rows: topActions } = await pool.query(
      `SELECT action, COUNT(*) as count
       FROM audit_log_immutable
       ${since ? 'WHERE ts >= $1' : ''}
       GROUP BY action
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    stats.top_actions = topActions;

    span.setAttributes({
      'audit.total_entries': stats.total_entries,
      'audit.unique_actors': stats.unique_actors,
      'audit.unique_entities': stats.unique_entities,
    });

    return stats;
  } catch (error) {
    logger.error('Error fetching audit stats', {
      error: error.message,
    });
    span.recordException(error);
    return {};
  } finally {
    span.end();
  }
}

module.exports = {
  append,
  verifyChainIntegrity,
  getUserAuditEvents,
  getEntityAuditEvents,
  createDigest,
  exportAuditTrail,
  getAuditStats,
  calculateHash,
  getLastHash,
};
