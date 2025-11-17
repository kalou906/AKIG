/**
 * Service de Caching Redis - AKIG
 * Gère le caching des données critiques pour performance
 * 
 * Stratégies:
 * - Permissions utilisateur (TTL: 5 min)
 * - Données impayés (TTL: 10 min)
 * - Missions agents (TTL: 5 min)
 * - Scores/classements (TTL: 1 heure)
 * - Locataires par site (TTL: 30 min)
 */

import { createClient, RedisClientOptions } from 'redis';
import dayjs from 'dayjs';

// Créer client Redis avec nouvelle API
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        return new Error('Max retries reached');
      }
      return Math.min(retries * 50, 500);
    },
  },
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connecté');
});

// Palettes de TTL (en secondes)
const TTL = {
  PERMISSIONS: 5 * 60,           // 5 minutes
  IMPAYES: 10 * 60,               // 10 minutes
  MISSIONS: 5 * 60,               // 5 minutes
  PERFORMANCES: 60 * 60,          // 1 heure
  LOCATAIRES: 30 * 60,            // 30 minutes
  SITES: 1 * 60 * 60,             // 1 heure
  BONS_PAYEURS: 60 * 60,          // 1 heure
  CLASSEMENTS: 60 * 60,           // 1 heure
  STATISTIQUES: 60 * 60,          // 1 heure
};

export class CacheService {
  /**
   * Récupérer valeur du cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache GET error [${key}]:`, error);
      return null;
    }
  }

  /**
   * Stocker valeur dans cache avec TTL
   */
  static async set<T>(key: string, value: T, ttl: number = TTL.PERMISSIONS): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache SET error [${key}]:`, error);
    }
  }

  /**
   * Supprimer une clé
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache DELETE error [${key}]:`, error);
    }
  }

  /**
   * Invalider toutes les clés correspondant à un pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error(`Cache INVALIDATE error [${pattern}]:`, error);
    }
  }

  /**
   * Vider tout le cache (⚠️ À utiliser avec prudence)
   */
  static async flush(): Promise<void> {
    try {
      await redisClient.flushDb();
      console.log('⚠️  Cache vidé complètement');
    } catch (error) {
      console.error('Cache FLUSH error:', error);
    }
  }

  /**
   * Récupérer stats du cache
   */
  static async getStats() {
    try {
      const info = await redisClient.info('stats');
      const dbSize = await redisClient.dbSize();
      return {
        connected: true,
        db_size: dbSize,
        info,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ==================== CLÉS DE CACHE PRÉDÉFINIES ====================

export const CACHE_KEYS = {
  // Permissions utilisateur
  USER_PERMISSIONS: (userId: string) => `perms:${userId}`,
  USER_ROLES: (userId: string) => `roles:${userId}`,

  // Impayés
  IMPAYES_BY_SITE: (siteId: string) => `impayes:site:${siteId}`,
  IMPAYES_BY_LOCATAIRE: (locataireId: string) => `impayes:loc:${locataireId}`,
  ALL_IMPAYES: () => `impayes:all`,

  // Missions
  MISSIONS_BY_AGENT: (agentId: string) => `missions:agent:${agentId}`,
  MISSIONS_BY_DATE: (date: string) => `missions:date:${date}`,
  ALL_MISSIONS: () => `missions:all`,

  // Performances
  AGENT_PERFORMANCE: (agentId: string) => `perf:agent:${agentId}`,
  AGENT_SCORE: (agentId: string, date: string) => `score:agent:${agentId}:${date}`,
  ALL_SCORES: (date: string) => `scores:${date}`,

  // Locataires
  LOCATAIRES_BY_SITE: (siteId: string) => `locs:site:${siteId}`,
  LOCATAIRE_DETAIL: (locataireId: string) => `loc:${locataireId}`,
  BONS_PAYEURS: () => `bons_payeurs:all`,

  // Sites
  SITE_DETAIL: (siteId: string) => `site:${siteId}`,
  SITE_STATS: (siteId: string) => `site_stats:${siteId}`,
  ALL_SITES: () => `sites:all`,

  // Classements
  CLASSEMENT_AGENTS: (date: string) => `classement:agents:${date}`,
  CLASSEMENT_SITES: (date: string) => `classement:sites:${date}`,

  // Statistiques
  STATS_RECOUVREMENT: (date: string) => `stats:recouvrement:${date}`,
  STATS_GLOBAL: () => `stats:global`,
};

export default CacheService;
