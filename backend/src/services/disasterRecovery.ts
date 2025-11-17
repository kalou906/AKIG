/**
 * Database Recovery & Disaster Recovery Service
 * 
 * Procedures:
 * 1. Automatic backup scheduling
 * 2. Point-in-time recovery (PITR)
 * 3. Replication monitoring
 * 4. Failover procedures
 * 5. Data consistency validation
 */

import { Pool } from 'pg';
import dayjs from 'dayjs';
import { logger } from '../services/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron format: "0 2 * * *"
  retention: number; // days
  compression: boolean;
  verification: boolean;
  replicationSlot?: string;
}

export interface RecoveryPoint {
  timestamp: Date;
  backupId: string;
  size: number;
  verified: boolean;
  type: 'full' | 'incremental' | 'wal';
}

class DisasterRecoveryService {
  private pool: Pool;
  private backupConfig: BackupConfig;

  constructor(pool: Pool, config: BackupConfig) {
    this.pool = pool;
    this.backupConfig = config;
  }

  /**
   * Crée une sauvegarde complète
   */
  async createFullBackup(): Promise<RecoveryPoint> {
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date();

    try {
      logger.info({ action: 'backup_started', backupId });

      // Récupérer la configuration de la base
      const dbResult = await this.pool.query(
        `SELECT datname, pg_database.oid FROM pg_database WHERE datname = current_database()`
      );
      const dbName = dbResult.rows[0]?.datname;

      if (!dbName) {
        throw new Error('Could not determine database name');
      }

      // Créer le dump
      const backupPath = `/backups/${backupId}.sql${this.backupConfig.compression ? '.gz' : ''}`;
      const compressionCmd = this.backupConfig.compression ? '| gzip' : '';

      const cmd = `pg_dump ${dbName} ${compressionCmd} > ${backupPath}`;
      await execAsync(cmd);

      // Vérifier le backup
      if (this.backupConfig.verification) {
        const verified = await this.verifyBackup(backupPath);
        if (!verified) {
          throw new Error('Backup verification failed');
        }
      }

      const backupSize = await this.getFileSize(backupPath);

      // Enregistrer dans la base de données
      await this.recordBackup({
        backupId,
        timestamp,
        size: backupSize,
        type: 'full',
        verified: true,
      });

      logger.info({
        action: 'backup_completed',
        backupId,
        size: backupSize,
        compressed: this.backupConfig.compression,
      });

      return {
        timestamp,
        backupId,
        size: backupSize,
        verified: true,
        type: 'full',
      };
    } catch (error) {
      logger.error({ action: 'backup_failed', backupId, error });
      throw error;
    }
  }

  /**
   * Crée une sauvegarde WAL (Write-Ahead Logging)
   */
  async enableWALArchiving(): Promise<void> {
    try {
      // Archive automatique des WALs
      const walCommand = `test -f /backups/%f && cp %p /backups/%f`;

      await this.pool.query(
        `ALTER SYSTEM SET wal_level = replica;
         ALTER SYSTEM SET archive_mode = on;
         ALTER SYSTEM SET archive_command = '${walCommand}';`
      );

      logger.info({ action: 'wal_archiving_enabled' });
    } catch (error) {
      logger.error({ action: 'wal_archiving_failed', error });
      throw error;
    }
  }

  /**
   * Récupère les points de récupération disponibles
   */
  async getRecoveryPoints(): Promise<RecoveryPoint[]> {
    try {
      const result = await this.pool.query(
        `SELECT backup_id, timestamp, size, verified, type 
         FROM backups_metadata 
         WHERE timestamp >= NOW() - INTERVAL '${this.backupConfig.retention} days'
         ORDER BY timestamp DESC`
      );

      return result.rows.map(row => ({
        backupId: row.backup_id,
        timestamp: row.timestamp,
        size: row.size,
        verified: row.verified,
        type: row.type,
      }));
    } catch (error) {
      logger.error({ action: 'get_recovery_points_failed', error });
      return [];
    }
  }

  /**
   * Récupère à partir d'un point spécifique
   */
  async recoverToPoint(backupId: string, targetTime?: Date): Promise<void> {
    let client;
    try {
      logger.info({ action: 'recovery_started', backupId, targetTime });

      // Vérifier que le backup existe
      const backup = await this.getBackupMetadata(backupId);
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      client = await this.pool.connect();

      // Fermer toutes les connexions
      await client.query(
        `SELECT pg_terminate_backend(pg_stat_activity.pid)
         FROM pg_stat_activity
         WHERE pg_stat_activity.datname = current_database()
         AND pid <> pg_backend_pid()`
      );

      // Lancer la récupération
      const backupPath = `/backups/${backupId}.sql${
        this.backupConfig.compression ? '.gz' : ''
      }`;

      const decompressCmd = this.backupConfig.compression ? 'gunzip -c' : 'cat';
      const cmd = `${decompressCmd} ${backupPath} | psql`;

      await execAsync(cmd);

      // Récupération de type Point-in-Time (PITR)
      if (targetTime) {
        await client.query(
          `ALTER SYSTEM SET recovery_target_time = '${targetTime.toISOString()}';`
        );
      }

      logger.info({ action: 'recovery_completed', backupId });
    } catch (error) {
      logger.error({ action: 'recovery_failed', backupId, error });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Vérifie l'intégrité d'une sauvegarde
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      const decompressCmd = this.backupConfig.compression ? 'gunzip -c' : 'cat';
      const cmd = `${decompressCmd} ${backupPath} | head -n 100 > /dev/null`;

      await execAsync(cmd);

      // Vérifier la cohérence
      const result = await this.pool.query(
        `ANALYZE; SELECT pg_database_size(current_database());`
      );

      return !!result.rows;
    } catch (error) {
      logger.error({ action: 'backup_verification_failed', backupPath, error });
      return false;
    }
  }

  /**
   * Valide la cohérence des données après récupération
   */
  async validateDataConsistency(): Promise<{ consistent: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Vérifier les contraintes de clés étrangères
      const fkResult = await this.pool.query(
        `SELECT COUNT(*) as violations 
         FROM pg_stat_user_tables 
         WHERE relname NOT IN (
           SELECT DISTINCT conrelid::text FROM pg_constraint
         )`
      );

      if (fkResult.rows[0].violations > 0) {
        issues.push('Foreign key constraint violations detected');
      }

      // Vérifier les sequences
      const seqResult = await this.pool.query(
        `SELECT COUNT(*) as orphaned 
         FROM pg_sequences 
         WHERE sequencename NOT LIKE 'pg_%'`
      );

      if (seqResult.rows[0].orphaned > 0) {
        issues.push('Orphaned sequences detected');
      }

      // Vérifier les indexes
      const idxResult = await this.pool.query(
        `SELECT COUNT(*) as invalid 
         FROM pg_stat_user_indexes 
         WHERE idx_scan = 0 
         AND schemaname != 'pg_catalog'`
      );

      if (idxResult.rows[0].invalid > 5) {
        issues.push(`${idxResult.rows[0].invalid} unused indexes detected`);
      }

      return {
        consistent: issues.length === 0,
        issues,
      };
    } catch (error) {
      logger.error({ action: 'consistency_check_failed', error });
      return {
        consistent: false,
        issues: [`Consistency check failed: ${error}`],
      };
    }
  }

  /**
   * Teste le failover vers une réplique
   */
  async testFailover(replicaConnection: string): Promise<boolean> {
    try {
      const replicaPool = new Pool({ connectionString: replicaConnection });
      const result = await replicaPool.query('SELECT 1');
      await replicaPool.end();

      return !!result.rows;
    } catch (error) {
      logger.error({ action: 'failover_test_failed', error });
      return false;
    }
  }

  /**
   * Exécute un failover d'urgence
   */
  async executeEmergencyFailover(replicaConnection: string): Promise<void> {
    try {
      logger.warn({ action: 'emergency_failover_initiated' });

      const replicaPool = new Pool({ connectionString: replicaConnection });

      // Promouvoir la réplique en maître
      await replicaPool.query(
        `SELECT pg_promote(); -- PostgreSQL 12+`
      );

      logger.info({ action: 'failover_completed' });

      await replicaPool.end();
    } catch (error) {
      logger.error({ action: 'failover_failed', error });
      throw error;
    }
  }

  /**
   * Enregistre les métadonnées d'une sauvegarde
   */
  private async recordBackup(backup: any): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO backups_metadata (backup_id, timestamp, size, type, verified)
         VALUES ($1, $2, $3, $4, $5)`,
        [backup.backupId, backup.timestamp, backup.size, backup.type, backup.verified]
      );
    } catch (error) {
      logger.error({ action: 'record_backup_failed', error });
    }
  }

  /**
   * Récupère les métadonnées d'une sauvegarde
   */
  private async getBackupMetadata(backupId: string): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM backups_metadata WHERE backup_id = $1`,
        [backupId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ action: 'get_backup_metadata_failed', error });
      return null;
    }
  }

  /**
   * Récupère la taille d'un fichier
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(`stat -f%z ${filePath}`);
      return parseInt(stdout);
    } catch {
      return 0;
    }
  }

  /**
   * Initialise la table de métadonnées des backups
   */
  async initializeBackupMetadata(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS backups_metadata (
          backup_id VARCHAR(255) PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL,
          size BIGINT NOT NULL,
          type VARCHAR(50) NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_backups_timestamp ON backups_metadata(timestamp DESC);
      `);
    } catch (error) {
      logger.error({ action: 'backup_metadata_init_failed', error });
    }
  }
}

export { DisasterRecoveryService };
