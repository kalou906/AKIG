/**
 * Audit Service - Simplified Version
 * backend/src/services/audit.js
 * 
 * Service d'audit simplifié avec signatures HMAC-SHA256
 */

const crypto = require('crypto');
const pool = require('../db');

const KEY = process.env.AUDIT_KEY || 'default-audit-key-change-in-production';

/**
 * Crée une signature HMAC-SHA256 pour une entrée d'audit
 */
function sign(entry) {
  const base = `${entry.actor_id}|${entry.action}|${entry.entity}|${entry.entity_id}|${entry.ts}`;
  return crypto.createHmac('sha256', KEY).update(base).digest('hex');
}

/**
 * Log une action dans l'audit trail avec signature
 */
async function log(entry) {
  try {
    entry.ts = new Date().toISOString();
    const signature = sign(entry);

    const result = await pool.query(
      `INSERT INTO audit_log(actor_id, action, entity, entity_id, payload, ts, signature, status)
       VALUES($1, $2, $3, $4, $5, $6, $7, 'success')
       RETURNING id, ts, signature`,
      [
        entry.actor_id,
        entry.action,
        entry.entity,
        entry.entity_id,
        entry.payload || null,
        entry.ts,
        signature,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Audit log error:', error);
    throw error;
  }
}

/**
 * Vérifie une signature d'audit
 */
function verify(entry, signature) {
  const expectedSignature = sign(entry);
  return expectedSignature === signature;
}

/**
 * Log une création
 */
async function logCreate(actorId, entity, entityId, payload) {
  return log({
    actor_id: actorId,
    action: 'CREATE',
    entity,
    entity_id: entityId,
    payload: JSON.stringify(payload),
  });
}

/**
 * Log une modification
 */
async function logUpdate(actorId, entity, entityId, payload) {
  return log({
    actor_id: actorId,
    action: 'UPDATE',
    entity,
    entity_id: entityId,
    payload: JSON.stringify(payload),
  });
}

/**
 * Log une suppression
 */
async function logDelete(actorId, entity, entityId, payload) {
  return log({
    actor_id: actorId,
    action: 'DELETE',
    entity,
    entity_id: entityId,
    payload: JSON.stringify(payload),
  });
}

/**
 * Log un accès
 */
async function logAccess(actorId, entity, entityId) {
  return log({
    actor_id: actorId,
    action: 'ACCESS',
    entity,
    entity_id: entityId,
    payload: null,
  });
}

/**
 * Log une connexion
 */
async function logLogin(actorId) {
  return log({
    actor_id: actorId,
    action: 'LOGIN',
    entity: 'AUTH',
    entity_id: actorId,
    payload: null,
  });
}

/**
 * Log une déconnexion
 */
async function logLogout(actorId) {
  return log({
    actor_id: actorId,
    action: 'LOGOUT',
    entity: 'AUTH',
    entity_id: actorId,
    payload: null,
  });
}

/**
 * Récupère l'historique d'audit pour une entité
 */
async function getTrail(entity, entityId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT id, actor_id, action, ts, signature, verified
       FROM audit_log
       WHERE entity = $1 AND entity_id = $2
       ORDER BY ts DESC
       LIMIT $3`,
      [entity, entityId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Get audit trail error:', error);
    throw error;
  }
}

/**
 * Récupère les logs d'audit récents
 */
async function getRecent(limit = 100) {
  try {
    const result = await pool.query(
      `SELECT al.id, u.first_name, u.last_name, al.action, al.entity, 
              al.entity_id, al.ts, al.status, al.verified
       FROM audit_log al
       LEFT JOIN users u ON al.actor_id = u.id
       ORDER BY al.ts DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Get recent audit logs error:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'audit
 */
async function getStats() {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN ts > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
         COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
         COUNT(CASE WHEN verified = false AND signature IS NOT NULL THEN 1 END) as unverified
       FROM audit_log`
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total),
      last24h: parseInt(row.last_24h),
      errors: parseInt(row.errors),
      unverified: parseInt(row.unverified),
    };
  } catch (error) {
    console.error('Get audit stats error:', error);
    throw error;
  }
}

/**
 * Archive les anciens logs
 */
async function archive(days = 90) {
  try {
    const result = await pool.query(
      `SELECT * FROM archive_audit_logs($1)`,
      [days]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Archive audit logs error:', error);
    throw error;
  }
}

module.exports = {
  log,
  sign,
  verify,
  logCreate,
  logUpdate,
  logDelete,
  logAccess,
  logLogin,
  logLogout,
  getTrail,
  getRecent,
  getStats,
  archive,
};
