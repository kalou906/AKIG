/**
 * Multi-Site Router Middleware
 * 
 * Gère le routage de requêtes par site/agence
 * - Isolation de données par site
 * - Failover inter-sites
 * - Règles métier localisées
 * 
 * Architecture:
 * - Tenant → Site mapping
 * - Request → Site context injection
 * - Data → Partitioned by site_id
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

export interface RequestWithSite extends Request {
  siteId?: string;
  siteName?: string;
  siteRegion?: string;
  siteLanguage?: string;
  userSitePermissions?: string[]; // ['read', 'write', 'approve_payments']
}

/**
 * Multi-Site Configuration
 * Défini les agences/sites supportés
 */
export const SITE_CONFIG = {
  GN_CONAKRY: {
    siteId: 'GN_CONAKRY',
    name: 'Conakry Headquarters',
    country: 'GN',
    region: 'Conakry',
    timezone: 'GMT',
    currency: 'GNF',
    language: 'fr',
    maxTenants: 5000,
    maxProperties: 1000,
  },
  GN_KINDIA: {
    siteId: 'GN_KINDIA',
    name: 'Kindia Branch',
    country: 'GN',
    region: 'Kindia',
    timezone: 'GMT',
    currency: 'GNF',
    language: 'fr',
    maxTenants: 2000,
    maxProperties: 400,
  },
  GN_MAMOU: {
    siteId: 'GN_MAMOU',
    name: 'Mamou Branch',
    country: 'GN',
    region: 'Mamou',
    timezone: 'GMT',
    currency: 'GNF',
    language: 'fr',
    maxTenants: 1500,
    maxProperties: 300,
  },
  GN_LABE: {
    siteId: 'GN_LABE',
    name: 'Labé Branch',
    country: 'GN',
    region: 'Labé',
    timezone: 'GMT',
    currency: 'GNF',
    language: 'ff', // Peulh region
    maxTenants: 1000,
    maxProperties: 200,
  },
  SN_DAKAR: {
    siteId: 'SN_DAKAR',
    name: 'Dakar Regional HQ (Senegal)',
    country: 'SN',
    region: 'Dakar',
    timezone: 'GMT',
    currency: 'XOF',
    language: 'fr',
    maxTenants: 3000,
    maxProperties: 600,
  },
  ML_BAMAKO: {
    siteId: 'ML_BAMAKO',
    name: 'Bamako Regional HQ (Mali)',
    country: 'ML',
    region: 'Bamako',
    timezone: 'GMT',
    currency: 'XOF',
    language: 'fr',
    maxTenants: 2500,
    maxProperties: 500,
  },
};

/**
 * Multi-Site Routing Middleware
 * 1. Détermine site de l'utilisateur
 * 2. Injecte site_context dans request
 * 3. Enrichit queries avec filtrage site_id
 */
export class MultiSiteRouter {
  private pool: Pool;
  private siteCache: Map<string, any> = new Map();

  constructor(pool: Pool) {
    this.pool = pool;
    this.initializeSiteCache();
  }

  /**
   * Initialiser cache des configurations sites
   */
  private async initializeSiteCache(): Promise<void> {
    try {
      const result = await this.pool.query(
        `SELECT id, name, region, country, timezone, currency, language, 
                is_active, max_tenants, max_properties
         FROM sites 
         WHERE is_active = true`
      );

      for (const row of result.rows) {
        this.siteCache.set(row.id, row);
      }

      logger.info(`Initialized ${this.siteCache.size} active sites`);
    } catch (error) {
      logger.error('Error initializing site cache:', error);
    }
  }

  /**
   * Middleware pour injecter contexte de site dans chaque requête
   */
  middleware() {
    return async (req: RequestWithSite, res: Response, next: NextFunction) => {
      try {
        // Déterminer site de l'utilisateur
        const siteId = await this.determineSiteId(req);

        if (!siteId) {
          return res.status(400).json({ error: 'Site not determined' });
        }

        // Récupérer configuration du site
        const siteConfig = this.siteCache.get(siteId);
        if (!siteConfig) {
          return res.status(404).json({ error: `Site ${siteId} not found` });
        }

        // Injecter contexte dans request
        req.siteId = siteId;
        req.siteName = siteConfig.name;
        req.siteRegion = siteConfig.region;
        req.siteLanguage = siteConfig.language;

        // Récupérer permissions utilisateur pour ce site
        if (req.user?.id) {
          req.userSitePermissions = await this.getUserSitePermissions(req.user.id, siteId);
        }

        // Logger pour debugging
        logger.debug(`Request routed to site: ${siteId}`, {
          userId: req.user?.id,
          method: req.method,
          path: req.path,
        });

        next();
      } catch (error) {
        logger.error('Error in multi-site middleware:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Déterminer le site d'un utilisateur
   */
  private async determineSiteId(req: RequestWithSite): Promise<string | null> {
    // 1. Vérifier header X-Site-ID (pour tests/admin)
    const headerSiteId = req.headers['x-site-id'] as string;
    if (headerSiteId && this.siteCache.has(headerSiteId)) {
      return headerSiteId;
    }

    // 2. Query parameter ?site=GN_CONAKRY
    const querySiteId = req.query.site as string;
    if (querySiteId && this.siteCache.has(querySiteId)) {
      return querySiteId;
    }

    // 3. Déterminer depuis JWT (si utilisateur est authentifié)
    if (req.user?.id) {
      return await this.getUserPrimarySite(req.user.id);
    }

    // 4. IP-based geolocation (fallback)
    return await this.determineSiteFromIP(req);
  }

  /**
   * Récupérer site primaire d'un utilisateur
   */
  private async getUserPrimarySite(userId: string): Promise<string | null> {
    try {
      const result = await this.pool.query(
        `SELECT site_id FROM user_site_assignments 
         WHERE user_id = $1 AND is_primary = true 
         LIMIT 1`,
        [userId]
      );

      return result.rows[0]?.site_id || null;
    } catch (error) {
      logger.error(`Error getting primary site for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Récupérer permissions utilisateur pour un site
   */
  private async getUserSitePermissions(userId: string, siteId: string): Promise<string[]> {
    try {
      const result = await this.pool.query(
        `SELECT p.permission_name 
         FROM user_site_assignments usa
         JOIN role_permissions rp ON usa.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE usa.user_id = $1 AND usa.site_id = $2`,
        [userId, siteId]
      );

      return result.rows.map(row => row.permission_name);
    } catch (error) {
      logger.error(`Error getting site permissions:`, error);
      return [];
    }
  }

  /**
   * Déterminer site via géolocalisation IP
   */
  private async determineSiteFromIP(req: Request): Promise<string | null> {
    // TODO: Implémenter géolocalisation IP
    // Pour maintenant: retourner site principal (Conakry)
    return 'GN_CONAKRY';
  }

  /**
   * Wrapper pour requêtes SQL: ajouter filtrage site_id
   */
  async querySiteFiltered(
    query: string,
    params: any[],
    siteId: string,
    table: string
  ): Promise<any> {
    // Injecter site_id dans WHERE clause
    const filteredQuery = `${query} AND ${table}.site_id = $${params.length + 1}`;
    const filteredParams = [...params, siteId];

    return this.pool.query(filteredQuery, filteredParams);
  }

  /**
   * Récupérer tous les sites accessibles à un utilisateur
   */
  async getUserAccessibleSites(userId: string): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT DISTINCT s.* 
         FROM user_site_assignments usa
         JOIN sites s ON usa.site_id = s.id
         WHERE usa.user_id = $1 AND s.is_active = true
         ORDER BY usa.is_primary DESC, s.name ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error getting accessible sites for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Failover: Si un site est down, router vers site backup
   */
  async getFailoverSite(primarySiteId: string): Promise<string | null> {
    try {
      // Vérifier status du site primaire
      const siteResult = await this.pool.query(
        `SELECT id, failover_site_id, is_active 
         FROM sites 
         WHERE id = $1`,
        [primarySiteId]
      );

      if (siteResult.rows[0]?.is_active === false) {
        // Retourner site failover
        return siteResult.rows[0]?.failover_site_id || null;
      }

      return null; // Site primaire OK
    } catch (error) {
      logger.error(`Error checking failover for site ${primarySiteId}:`, error);
      return null;
    }
  }

  /**
   * Appliquer règles métier régionales
   */
  async applyRegionalRules(
    req: RequestWithSite,
    entity: 'contract' | 'payment' | 'notice',
    data: any
  ): Promise<any> {
    if (!req.siteId) return data;

    try {
      const siteConfig = this.siteCache.get(req.siteId);
      if (!siteConfig) return data;

      // Appliquer règles spécifiques par région
      const regionRules = await this.pool.query(
        `SELECT rule_type, rule_value 
         FROM regional_rules 
         WHERE site_id = $1 AND entity_type = $2`,
        [req.siteId, entity]
      );

      for (const rule of regionRules.rows) {
        // Exemple: Appliquer taxes régionales
        if (rule.rule_type === 'tax_rate') {
          data.tax = (data.amount || 0) * (rule.rule_value / 100);
        }

        // Exemple: Délais légaux de notice
        if (rule.rule_type === 'notice_delay_days') {
          data.legal_deadline = new Date();
          data.legal_deadline.setDate(data.legal_deadline.getDate() + rule.rule_value);
        }
      }

      return data;
    } catch (error) {
      logger.error(`Error applying regional rules:`, error);
      return data;
    }
  }
}

/**
 * Helper: Vérifier si utilisateur a permission pour une action sur un site
 */
export function requireSitePermission(permission: string) {
  return (req: RequestWithSite, res: Response, next: NextFunction) => {
    if (!req.userSitePermissions?.includes(permission)) {
      return res.status(403).json({
        error: `Permission denied: ${permission} not granted for site ${req.siteId}`,
      });
    }
    next();
  };
}

/**
 * DB Schema Migrations Requises:
 * 
 * 1. Créer table sites:
 *    CREATE TABLE sites (
 *      id VARCHAR(50) PRIMARY KEY,
 *      name VARCHAR(255) NOT NULL,
 *      region VARCHAR(100),
 *      country VARCHAR(10),
 *      timezone VARCHAR(50),
 *      currency VARCHAR(10),
 *      language VARCHAR(10),
 *      is_active BOOLEAN DEFAULT true,
 *      max_tenants INT,
 *      max_properties INT,
 *      failover_site_id VARCHAR(50),
 *      created_at TIMESTAMP DEFAULT NOW()
 *    );
 * 
 * 2. Ajouter site_id aux tables principales:
 *    ALTER TABLE contracts ADD COLUMN site_id VARCHAR(50);
 *    ALTER TABLE payments ADD COLUMN site_id VARCHAR(50);
 *    ALTER TABLE tenants ADD COLUMN site_id VARCHAR(50);
 *    ALTER TABLE notices ADD COLUMN site_id VARCHAR(50);
 *    ALTER TABLE litigations ADD COLUMN site_id VARCHAR(50);
 *    ALTER TABLE properties ADD COLUMN site_id VARCHAR(50);
 * 
 * 3. Ajouter indexes:
 *    CREATE INDEX idx_contracts_site ON contracts(site_id);
 *    CREATE INDEX idx_payments_site ON payments(site_id);
 *    ... etc
 * 
 * 4. Créer table permissions utilisateur:
 *    CREATE TABLE user_site_assignments (
 *      id SERIAL PRIMARY KEY,
 *      user_id VARCHAR(50),
 *      site_id VARCHAR(50),
 *      role_id VARCHAR(50),
 *      is_primary BOOLEAN DEFAULT false,
 *      created_at TIMESTAMP DEFAULT NOW()
 *    );
 * 
 * 5. Créer table règles régionales:
 *    CREATE TABLE regional_rules (
 *      id SERIAL PRIMARY KEY,
 *      site_id VARCHAR(50),
 *      entity_type VARCHAR(50),
 *      rule_type VARCHAR(100),
 *      rule_value NUMERIC,
 *      effective_date DATE,
 *      created_at TIMESTAMP DEFAULT NOW()
 *    );
 */

export default MultiSiteRouter;
