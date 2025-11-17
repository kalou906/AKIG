/**
 * Audit Log Service
 * backend/src/services/audit.service.js
 * 
 * Service pour l'enregistrement et la vérification des logs d'audit
 */

const crypto = require('crypto');
const pool = require('../db');
const logger = require('./logger');

class AuditService {
  /**
   * Crée une entrée d'audit signée
   */
  static async logAction(data) {
    const {
      actorId,
      action,
      entity,
      entityId,
      payload = null,
      changes = null,
      ipAddress = null,
      userAgent = null,
    } = data;

    try {
      // Créer l'entrée d'audit
      const result = await pool.query(
        `SELECT create_audit_entry($1, $2, $3, $4, $5, $6, $7, $8) as log_id`,
        [actorId, action, entity, entityId, payload, changes, ipAddress, userAgent]
      );

      const logId = result.rows[0].log_id;

      // Signer l'entrée si une clé secrète est disponible
      if (process.env.AUDIT_SECRET_KEY) {
        await this.signAuditEntry(logId, process.env.AUDIT_SECRET_KEY);
      }

      logger.info('Audit entry created', {
        logId,
        action,
        entity,
        actorId,
      });

      return logId;
    } catch (error) {
      logger.error('Error creating audit entry', {
        error: error.message,
        action,
        entity,
      });
      throw error;
    }
  }

  /**
   * Signe une entrée d'audit
   */
  static async signAuditEntry(logId, secret) {
    try {
      const result = await pool.query(
        `SELECT sign_audit_entry($1, $2) as signature`,
        [logId, secret]
      );

      logger.info('Audit entry signed', { logId });
      return result.rows[0].signature;
    } catch (error) {
      logger.error('Error signing audit entry', {
        error: error.message,
        logId,
      });
      throw error;
    }
  }

  /**
   * Vérifie une entrée d'audit
   */
  static async verifyAuditEntry(logId, secret) {
    try {
      const result = await pool.query(
        `SELECT verify_audit_entry($1, $2) as verified`,
        [logId, secret]
      );

      const verified = result.rows[0].verified;

      logger.info('Audit entry verification', { logId, verified });
      return verified;
    } catch (error) {
      logger.error('Error verifying audit entry', {
        error: error.message,
        logId,
      });
      throw error;
    }
  }

  /**
   * Récupère l'historique d'audit pour une entité
   */
  static async getAuditTrail(entity, entityId, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT * FROM get_audit_trail($1, $2, $3)`,
        [entity, entityId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching audit trail', {
        error: error.message,
        entity,
        entityId,
      });
      throw error;
    }
  }

  /**
   * Récupère les logs d'audit avec filtrage
   */
  static async getAuditLogs(filters = {}) {
    try {
      let query = 'SELECT * FROM audit_log WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (filters.actorId) {
        query += ` AND actor_id = $${paramCount}`;
        params.push(filters.actorId);
        paramCount++;
      }

      if (filters.action) {
        query += ` AND action = $${paramCount}`;
        params.push(filters.action);
        paramCount++;
      }

      if (filters.entity) {
        query += ` AND entity = $${paramCount}`;
        params.push(filters.entity);
        paramCount++;
      }

      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters.fromDate) {
        query += ` AND ts >= $${paramCount}`;
        params.push(filters.fromDate);
        paramCount++;
      }

      if (filters.toDate) {
        query += ` AND ts <= $${paramCount}`;
        params.push(filters.toDate);
        paramCount++;
      }

      if (filters.verifiedOnly) {
        query += ` AND verified = true`;
      }

      query += ` ORDER BY ts DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching audit logs', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Obtient l'activité récente d'audit
   */
  static async getRecentActivity(limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM vw_recent_audit_activity LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching recent audit activity', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtient le rapport de conformité
   */
  static async getComplianceReport(fromDate, toDate) {
    try {
      const result = await pool.query(
        `SELECT * FROM vw_audit_compliance_report 
         WHERE audit_date BETWEEN $1 AND $2
         ORDER BY audit_date DESC`,
        [fromDate, toDate]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching compliance report', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Archive les anciens logs d'audit
   */
  static async archiveOldLogs(days = 90) {
    try {
      const result = await pool.query(
        `SELECT * FROM archive_audit_logs($1)`,
        [days]
      );

      const { archived_count, remaining_count } = result.rows[0];

      logger.info('Audit logs archived', {
        archived_count,
        remaining_count,
        days,
      });

      return {
        archived: archived_count,
        remaining: remaining_count,
      };
    } catch (error) {
      logger.error('Error archiving audit logs', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtient les stats d'audit
   */
  static async getAuditStats() {
    try {
      const totalResult = await pool.query(
        'SELECT COUNT(*) as total FROM audit_log'
      );

      const last24hResult = await pool.query(
        `SELECT COUNT(*) as count FROM audit_log 
         WHERE ts > NOW() - INTERVAL '24 hours'`
      );

      const failuresResult = await pool.query(
        `SELECT COUNT(*) as count FROM audit_log 
         WHERE status = 'error'`
      );

      const unverifiedResult = await pool.query(
        `SELECT COUNT(*) as count FROM audit_log 
         WHERE verified = false AND signature IS NOT NULL`
      );

      return {
        totalEntries: parseInt(totalResult.rows[0].total),
        last24Hours: parseInt(last24hResult.rows[0].count),
        failedActions: parseInt(failuresResult.rows[0].count),
        unverifiedSignatures: parseInt(unverifiedResult.rows[0].count),
      };
    } catch (error) {
      logger.error('Error fetching audit stats', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Log une action de création
   */
  static async logCreate(userId, entity, entityId, data, ipAddress, userAgent) {
    return this.logAction({
      actorId: userId,
      action: 'CREATE',
      entity,
      entityId,
      payload: data,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de modification
   */
  static async logUpdate(userId, entity, entityId, oldData, newData, ipAddress, userAgent) {
    return this.logAction({
      actorId: userId,
      action: 'UPDATE',
      entity,
      entityId,
      payload: newData,
      changes: {
        before: oldData,
        after: newData,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de suppression
   */
  static async logDelete(userId, entity, entityId, data, ipAddress, userAgent) {
    return this.logAction({
      actorId: userId,
      action: 'DELETE',
      entity,
      entityId,
      payload: data,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action d'accès
   */
  static async logAccess(userId, entity, entityId, ipAddress, userAgent) {
    return this.logAction({
      actorId: userId,
      action: 'ACCESS',
      entity,
      entityId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de login
   */
  static async logLogin(userId, ipAddress, userAgent, success = true) {
    return this.logAction({
      actorId: userId,
      action: 'LOGIN',
      entity: 'AUTH',
      payload: { success },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de logout
   */
  static async logLogout(userId, ipAddress, userAgent) {
    return this.logAction({
      actorId: userId,
      action: 'LOGOUT',
      entity: 'AUTH',
      ipAddress,
      userAgent,
    });
  }
}

module.exports = AuditService;
