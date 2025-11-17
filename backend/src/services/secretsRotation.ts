/**
 * Secrets Rotation Service - PRODUCTION SECURITY
 * 
 * Gère la rotation des secrets pour:
 * - JWT signing keys
 * - Database credentials  
 * - API keys 3rd party
 * - Encryption keys
 * 
 * Stratégie:
 * 1. Active/Passive keys (nouvelle clé générée, ancienne reste temporairement valide)
 * 2. Grace period avant invalidation (permettre aux clients de se synchroniser)
 * 3. Versioning des secrets (tracking des versions)
 * 4. Audit logging (qui a roté quoi et quand)
 */

import crypto from 'crypto';
import dayjs from 'dayjs';
import { Pool } from 'pg';
import { logger } from './logger';

export interface SecretRotationPolicy {
  name: string;
  rotationIntervalDays: number;
  gracePeriodDays: number;
  maxVersionsKept: number;
}

export interface RotatedSecret {
  id: string;
  name: string;
  activeVersion: number;
  versions: SecretVersion[];
  lastRotation: Date;
  nextRotation: Date;
  rotationPolicy: SecretRotationPolicy;
}

export interface SecretVersion {
  version: number;
  value: string; // Hashed/encrypted in DB
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isValidForVerification: boolean; // Peut encore vérifier les anciens tokens
}

class SecretsRotationService {
  private pool: Pool;

  // Stratégies de rotation par secret
  private policies: Map<string, SecretRotationPolicy> = new Map([
    [
      'JWT_SECRET',
      {
        name: 'JWT Signing Key',
        rotationIntervalDays: 90,
        gracePeriodDays: 30,
        maxVersionsKept: 3,
      },
    ],
    [
      'JWT_REFRESH_SECRET',
      {
        name: 'JWT Refresh Key',
        rotationIntervalDays: 180,
        gracePeriodDays: 30,
        maxVersionsKept: 2,
      },
    ],
    [
      'ENCRYPTION_KEY',
      {
        name: 'Data Encryption Key',
        rotationIntervalDays: 365,
        gracePeriodDays: 60,
        maxVersionsKept: 2,
      },
    ],
    [
      'API_KEY_INTERNAL',
      {
        name: 'Internal API Key',
        rotationIntervalDays: 180,
        gracePeriodDays: 14,
        maxVersionsKept: 2,
      },
    ],
  ]);

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Initialise la table de suivi des secrets
   */
  async initializeDatabase(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS secrets_rotation (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          secret_name VARCHAR(255) NOT NULL UNIQUE,
          active_version INTEGER NOT NULL,
          metadata JSONB,
          last_rotation TIMESTAMP NOT NULL DEFAULT NOW(),
          next_rotation TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS secret_versions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          secret_id UUID NOT NULL REFERENCES secrets_rotation(id) ON DELETE CASCADE,
          version INTEGER NOT NULL,
          value_hash VARCHAR(255) NOT NULL,
          value_encrypted TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          is_valid_for_verification BOOLEAN DEFAULT TRUE,
          CONSTRAINT unique_secret_version UNIQUE(secret_id, version)
        );

        CREATE TABLE IF NOT EXISTS rotation_audit (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          secret_name VARCHAR(255) NOT NULL,
          action VARCHAR(50) NOT NULL,
          old_version INTEGER,
          new_version INTEGER,
          triggered_by VARCHAR(255) NOT NULL,
          reason TEXT,
          status VARCHAR(50) NOT NULL,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_secret_versions_secret_id ON secret_versions(secret_id);
        CREATE INDEX IF NOT EXISTS idx_secret_versions_expires_at ON secret_versions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_rotation_audit_secret_name ON rotation_audit(secret_name);
      `);

      logger.info('Secrets rotation database initialized');
    } catch (error) {
      logger.error('Error initializing secrets rotation database:', error);
      throw error;
    }
  }

  /**
   * Génère un nouveau secret
   */
  private generateSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hache un secret pour stockage sécurisé
   */
  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /**
   * Chiffre un secret avec la clé maître
   */
  private encryptSecret(secret: string): string {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(masterKey, 'hex'), iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  /**
   * Déchiffre un secret
   */
  private decryptSecret(encrypted: string): string {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    const [ivHex, tagHex, encryptedData] = encrypted.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(masterKey, 'hex'), iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Rotate un secret
   */
  async rotateSecret(secretName: string, triggeredBy: string = 'system'): Promise<SecretVersion> {
    let client;
    try {
      client = await this.pool.connect();
      await client.query('BEGIN');

      const policy = this.policies.get(secretName);
      if (!policy) {
        throw new Error(`No rotation policy found for secret: ${secretName}`);
      }

      // Récupérer le secret actuel
      const currentResult = await client.query(
        `SELECT id, active_version FROM secrets_rotation 
         WHERE secret_name = $1`,
        [secretName]
      );

      let secretId: string;
      let currentVersion = 0;

      if (currentResult.rows.length === 0) {
        // Créer le secret
        const createResult = await client.query(
          `INSERT INTO secrets_rotation (secret_name, active_version, next_rotation) 
           VALUES ($1, 0, $2) 
           RETURNING id`,
          [secretName, dayjs().add(policy.rotationIntervalDays, 'days').toDate()]
        );
        secretId = createResult.rows[0].id;
      } else {
        secretId = currentResult.rows[0].id;
        currentVersion = currentResult.rows[0].active_version;
      }

      // Générer la nouvelle version
      const newVersion = currentVersion + 1;
      const newSecret = this.generateSecret();
      const encryptedSecret = this.encryptSecret(newSecret);
      const secretHash = this.hashSecret(newSecret);

      const expiresAt = dayjs().add(policy.gracePeriodDays, 'days').toDate();

      // Insérer la nouvelle version
      const versionResult = await client.query(
        `INSERT INTO secret_versions 
         (secret_id, version, value_hash, value_encrypted, created_at, expires_at, is_active, is_valid_for_verification)
         VALUES ($1, $2, $3, $4, NOW(), $5, TRUE, TRUE)
         RETURNING *`,
        [secretId, newVersion, secretHash, encryptedSecret, expiresAt]
      );

      // Marquer l'ancienne version comme inactif pour les nouveaux tokens
      // mais garder valide pour la vérification (grace period)
      if (currentVersion > 0) {
        await client.query(
          `UPDATE secret_versions 
           SET is_active = FALSE
           WHERE secret_id = $1 AND version = $2`,
          [secretId, currentVersion]
        );
      }

      // Mettre à jour le secret comme actif
      await client.query(
        `UPDATE secrets_rotation 
         SET active_version = $1, last_rotation = NOW(), 
             next_rotation = $2, updated_at = NOW()
         WHERE id = $3`,
        [newVersion, dayjs().add(policy.rotationIntervalDays, 'days').toDate(), secretId]
      );

      // Nettoyer les vieilles versions
      await this.cleanupOldVersions(client, secretId, policy.maxVersionsKept);

      // Audit logging
      await client.query(
        `INSERT INTO rotation_audit 
         (secret_name, action, old_version, new_version, triggered_by, reason, status)
         VALUES ($1, 'ROTATE', $2, $3, $4, 'Scheduled rotation', 'SUCCESS')`,
        [secretName, currentVersion, newVersion, triggeredBy]
      );

      await client.query('COMMIT');

      logger.info({
        action: 'secret_rotated',
        secretName,
        newVersion,
        oldVersion: currentVersion,
        triggeredBy,
      });

      // Stocker le secret en mémoire/cache pour accès rapide
      await this.cacheSecretVersion(secretName, newVersion, newSecret);

      return versionResult.rows[0];
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }

      logger.error({
        action: 'secret_rotation_failed',
        secretName,
        error: error instanceof Error ? error.message : String(error),
      });

      // Audit
      try {
        await this.pool.query(
          `INSERT INTO rotation_audit 
           (secret_name, action, triggered_by, status, error_message)
           VALUES ($1, 'ROTATE', $2, 'FAILED', $3)`,
          [secretName, triggeredBy, error instanceof Error ? error.message : String(error)]
        );
      } catch (auditError) {
        logger.error('Failed to log rotation audit:', auditError);
      }

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Nettoie les vieilles versions d'un secret
   */
  private async cleanupOldVersions(
    client: any,
    secretId: string,
    maxVersions: number
  ): Promise<void> {
    try {
      const versionCount = await client.query(
        `SELECT COUNT(*) as count FROM secret_versions WHERE secret_id = $1`,
        [secretId]
      );

      if (versionCount.rows[0].count > maxVersions) {
        const toDelete = versionCount.rows[0].count - maxVersions;
        await client.query(
          `DELETE FROM secret_versions 
           WHERE secret_id = $1 
           AND version IN (
             SELECT version FROM secret_versions 
             WHERE secret_id = $1 
             ORDER BY version ASC 
             LIMIT $2
           )`,
          [secretId, toDelete]
        );
      }
    } catch (error) {
      logger.error('Error cleaning up old secret versions:', error);
    }
  }

  /**
   * Cache la version d'un secret pour accès rapide
   */
  private async cacheSecretVersion(secretName: string, version: number, value: string): Promise<void> {
    // À implémenter avec Redis/Memcached
    // Pour l'instant, on stocke en mémoire
    process.env[`CACHED_${secretName}_${version}`] = value;
  }

  /**
   * Récupère la version active d'un secret
   */
  async getActiveSecret(secretName: string): Promise<string | null> {
    try {
      // Chercher en cache d'abord
      const cached = process.env[`CACHED_${secretName}_ACTIVE`];
      if (cached) return cached;

      // Sinon, récupérer de la base de données
      const result = await this.pool.query(
        `SELECT sv.value_encrypted 
         FROM secret_versions sv
         JOIN secrets_rotation sr ON sv.secret_id = sr.id
         WHERE sr.secret_name = $1 AND sv.is_active = TRUE
         LIMIT 1`,
        [secretName]
      );

      if (result.rows.length === 0) {
        logger.warn(`No active secret found for: ${secretName}`);
        return null;
      }

      const decrypted = this.decryptSecret(result.rows[0].value_encrypted);
      process.env[`CACHED_${secretName}_ACTIVE`] = decrypted;
      return decrypted;
    } catch (error) {
      logger.error(`Error retrieving active secret: ${secretName}`, error);
      return null;
    }
  }

  /**
   * Récupère toutes les versions valides pour la vérification (incl. grace period)
   */
  async getVerificationSecrets(secretName: string): Promise<string[]> {
    try {
      const result = await this.pool.query(
        `SELECT sv.value_encrypted 
         FROM secret_versions sv
         JOIN secrets_rotation sr ON sv.secret_id = sr.id
         WHERE sr.secret_name = $1 
         AND sv.is_valid_for_verification = TRUE
         AND sv.expires_at > NOW()
         ORDER BY sv.version DESC`,
        [secretName]
      );

      return result.rows.map(row => this.decryptSecret(row.value_encrypted));
    } catch (error) {
      logger.error(`Error retrieving verification secrets: ${secretName}`, error);
      return [];
    }
  }

  /**
   * Invalide une version expirée
   */
  async invalidateExpiredVersions(): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE secret_versions 
         SET is_valid_for_verification = FALSE
         WHERE expires_at <= NOW()
         AND is_valid_for_verification = TRUE
         RETURNING secret_id, version`
      );

      if (result.rows.length > 0) {
        logger.info({
          action: 'expired_secrets_invalidated',
          count: result.rows.length,
        });
      }
    } catch (error) {
      logger.error('Error invalidating expired secrets:', error);
    }
  }

  /**
   * Reporte les secrets qui doivent bientôt être rotatés
   */
  async getSecretsNeedingRotation(): Promise<string[]> {
    try {
      const result = await this.pool.query(
        `SELECT secret_name FROM secrets_rotation 
         WHERE next_rotation <= NOW() + INTERVAL '7 days'
         AND next_rotation > NOW()`
      );

      return result.rows.map(row => row.secret_name);
    } catch (error) {
      logger.error('Error getting secrets needing rotation:', error);
      return [];
    }
  }

  /**
   * Récupère l'historique de rotation d'un secret
   */
  async getRotationHistory(secretName: string, limit: number = 10): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT secret_name, action, old_version, new_version, triggered_by, reason, status, created_at
         FROM rotation_audit
         WHERE secret_name = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [secretName, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error retrieving rotation history:', error);
      return [];
    }
  }

  /**
   * Démarre un job de rotation périodique
   */
  startRotationScheduler(intervalMinutes: number = 1440): NodeJS.Timer {
    return setInterval(async () => {
      try {
        const needsRotation = await this.getSecretsNeedingRotation();

        for (const secretName of needsRotation) {
          try {
            await this.rotateSecret(secretName, 'scheduler');
          } catch (error) {
            logger.error(`Failed to rotate secret: ${secretName}`, error);
          }
        }

        // Invalider les versions expirées
        await this.invalidateExpiredVersions();
      } catch (error) {
        logger.error('Error in rotation scheduler:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

export { SecretsRotationService };
