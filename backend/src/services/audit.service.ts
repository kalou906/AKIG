/**
 * Audit Service - Complete Audit Logging System
 * Every action: appels, visites, paiements, changes
 * Tracé: timestamp, user, action, before/after values, IP address
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export interface AuditLogEntry {
  id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name?: string;
  changes?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp?: Date;
  status: 'success' | 'failure' | 'warning';
  error_message?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  constructor(private pool: Pool) {}

  /**
   * Log une action avec détails complets
   */
  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    userId: string,
    options: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      status?: 'success' | 'failure' | 'warning';
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const auditId = uuidv4();
    const timestamp = dayjs().toDate();

    // Calculer les changements
    const changes = this.calculateChanges(options.oldValues || {}, options.newValues || {});

    try {
      await this.pool.query(
        `INSERT INTO audit_logs (
          id, action, entity_type, entity_id, user_id, 
          changes, old_values, new_values, ip_address, user_agent,
          timestamp, status, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          auditId,
          action,
          entityType,
          entityId,
          userId,
          JSON.stringify(changes),
          JSON.stringify(options.oldValues || {}),
          JSON.stringify(options.newValues || {}),
          options.ipAddress || null,
          options.userAgent || null,
          timestamp,
          options.status || 'success',
          options.errorMessage || null,
          JSON.stringify(options.metadata || {})
        ]
      );

      // Optionnel: trigger pour notification temps-réel
      await this.notifyAuditSubscribers(auditId, {
        action,
        entityType,
        entityId,
        userId,
        timestamp
      });

      return auditId;
    } catch (error) {
      console.error('Audit logging error:', error);
      // Ne pas bloquer l'application si audit échoue
      throw error;
    }
  }

  /**
   * Calculer les différences avant/après
   */
  private calculateChanges(
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    // Nouvelles clés
    for (const key in newValues) {
      if (!(key in oldValues)) {
        changes[key] = { old: null, new: newValues[key] };
      } else if (oldValues[key] !== newValues[key]) {
        changes[key] = { old: oldValues[key], new: newValues[key] };
      }
    }

    // Clés supprimées
    for (const key in oldValues) {
      if (!(key in newValues)) {
        changes[key] = { old: oldValues[key], new: null };
      }
    }

    return changes;
  }

  /**
   * Récupérer l'historique complet d'une entité
   */
  async getEntityHistory(entityType: string, entityId: string, limit = 100): Promise<AuditLogEntry[]> {
    const result = await this.pool.query(
      `SELECT * FROM audit_logs 
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [entityType, entityId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      user_id: row.user_id,
      changes: row.changes,
      old_values: row.old_values,
      new_values: row.new_values,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      timestamp: row.timestamp,
      status: row.status,
      error_message: row.error_message,
      metadata: row.metadata
    }));
  }

  /**
   * Audit pour appel téléphonique
   */
  async auditAppel(
    appelId: string,
    userId: string,
    action: 'create' | 'update' | 'delete',
    details: any,
    ipAddress?: string
  ): Promise<string> {
    return this.logAction('APPEL_' + action.toUpperCase(), 'appel', appelId, userId, {
      newValues: details,
      ipAddress,
      status: 'success',
      metadata: { type: 'appel' }
    });
  }

  /**
   * Audit pour visite terrain
   */
  async auditVisite(
    visiteId: string,
    userId: string,
    action: 'create' | 'update' | 'delete',
    details: any,
    ipAddress?: string
  ): Promise<string> {
    return this.logAction('VISITE_' + action.toUpperCase(), 'visite', visiteId, userId, {
      newValues: details,
      ipAddress,
      status: 'success',
      metadata: { type: 'visite' }
    });
  }

  /**
   * Audit pour paiement
   */
  async auditPaiement(
    paiementId: string,
    userId: string,
    action: 'create' | 'update' | 'delete',
    details: any,
    ipAddress?: string
  ): Promise<string> {
    return this.logAction('PAIEMENT_' + action.toUpperCase(), 'paiement', paiementId, userId, {
      newValues: details,
      ipAddress,
      status: 'success',
      metadata: { type: 'paiement', montant: details.montant }
    });
  }

  /**
   * Audit pour promesse
   */
  async auditPromesse(
    promesseId: string,
    userId: string,
    action: 'create' | 'update' | 'delete',
    oldValues?: any,
    newValues?: any,
    ipAddress?: string
  ): Promise<string> {
    return this.logAction('PROMESSE_' + action.toUpperCase(), 'promesse', promesseId, userId, {
      oldValues,
      newValues,
      ipAddress,
      status: 'success',
      metadata: { type: 'promesse' }
    });
  }

  /**
   * Audit pour changement statut impayé
   */
  async auditImpayeChange(
    impayeId: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logAction('IMPAYE_STATUS_CHANGE', 'impaye', impayeId, userId, {
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      ipAddress,
      status: 'success',
      metadata: { oldStatus, newStatus }
    });
  }

  /**
   * Récupérer logs d'audit avec filtres
   */
  async getAuditLogs(filters: {
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'success' | 'failure' | 'warning';
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (filters.action) {
      query += ` AND action = $${params.length + 1}`;
      params.push(filters.action);
    }
    if (filters.entityType) {
      query += ` AND entity_type = $${params.length + 1}`;
      params.push(filters.entityType);
    }
    if (filters.userId) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(filters.userId);
    }
    if (filters.startDate) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(filters.endDate);
    }
    if (filters.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
    params.push(filters.limit || 1000);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Export audit logs pour compliance
   */
  async exportAuditReport(
    format: 'json' | 'csv' = 'json',
    filters?: any
  ): Promise<string> {
    const logs = await this.getAuditLogs(filters || {});

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Action',
      'Entity Type',
      'Entity ID',
      'User ID',
      'Timestamp',
      'Status',
      'IP Address'
    ];
    const rows = logs.map(log => [
      log.id,
      log.action,
      log.entity_type,
      log.entity_id,
      log.user_id,
      log.timestamp,
      log.status,
      log.ip_address || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup old logs (retention policy)
   */
  async cleanupOldLogs(retentionDays = 90): Promise<number> {
    const cutoffDate = dayjs().subtract(retentionDays, 'day').toDate();

    const result = await this.pool.query(
      `DELETE FROM audit_logs WHERE timestamp < $1 AND status = 'success'`,
      [cutoffDate]
    );

    return result.rowCount || 0;
  }

  /**
   * Subscriber for real-time audit notifications (via WebSocket)
   */
  private async notifyAuditSubscribers(auditId: string, details: any): Promise<void> {
    // À intégrer avec websocket/event emitter
    // Notification temps-réel pour compliance officers
  }

  /**
   * Recherche full-text dans audit logs
   */
  async searchAuditLogs(query: string, limit = 50): Promise<AuditLogEntry[]> {
    const result = await this.pool.query(
      `SELECT * FROM audit_logs 
       WHERE to_tsvector('french', action || ' ' || entity_type || ' ' || COALESCE(error_message, ''))
             @@ plainto_tsquery('french', $1)
       ORDER BY timestamp DESC
       LIMIT $2`,
      [query, limit]
    );

    return result.rows;
  }
}
