/**
 * i18n Service - Multi-language Support (FR/EN)
 * Supports database-stored translations with fallback
 */

import { Pool } from 'pg';

export type Language = 'fr' | 'en';

export interface Translation {
  key: string;
  language: Language;
  value: string;
  context?: string; // Optional context (e.g., 'ui', 'email', 'report')
}

export class I18nService {
  private cache: Map<string, Map<string, string>> = new Map();

  constructor(private pool: Pool) {
    this.initializeDefaultLanguages();
  }

  /**
   * Initialize default languages
   */
  private initializeDefaultLanguages(): void {
    this.cache.set('fr', new Map());
    this.cache.set('en', new Map());
  }

  /**
   * Get translation for key in given language
   */
  async translate(key: string, language: Language = 'fr'): Promise<string> {
    // Check cache first
    const langCache = this.cache.get(language);
    if (langCache?.has(key)) {
      return langCache.get(key) || key;
    }

    // Query database
    const result = await this.pool.query(
      `SELECT value FROM translations WHERE key = $1 AND language = $2`,
      [key, language]
    );

    if (result.rows.length > 0) {
      const translation = result.rows[0].value;
      langCache?.set(key, translation);
      return translation;
    }

    // Fallback to key if not found
    return key;
  }

  /**
   * Translate multiple keys at once
   */
  async translateBatch(keys: string[], language: Language = 'fr'): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    for (const key of keys) {
      result[key] = await this.translate(key, language);
    }

    return result;
  }

  /**
   * Set translation
   */
  async setTranslation(key: string, value: string, language: Language): Promise<void> {
    await this.pool.query(
      `INSERT INTO translations (key, value, language)
       VALUES ($1, $2, $3)
       ON CONFLICT (key, language) DO UPDATE SET value = $2`,
      [key, value, language]
    );

    // Update cache
    this.cache.get(language)?.set(key, value);
  }

  /**
   * Batch set translations
   */
  async setTranslationBatch(
    translations: Translation[],
    language: Language
  ): Promise<void> {
    for (const t of translations) {
      await this.setTranslation(t.key, t.value, language);
    }
  }

  /**
   * Get all translation keys
   */
  async getAllKeys(): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT key FROM translations ORDER BY key`
    );

    return result.rows.map(r => r.key);
  }

  /**
   * Get all translations for a language
   */
  async getLanguageTranslations(language: Language): Promise<Record<string, string>> {
    const result = await this.pool.query(
      `SELECT key, value FROM translations WHERE language = $1`,
      [language]
    );

    const translations: Record<string, string> = {};

    for (const row of result.rows) {
      translations[row.key] = row.value;
    }

    return translations;
  }

  /**
   * Clear cache (for refresh)
   */
  async refreshCache(): Promise<void> {
    this.cache.clear();
    this.initializeDefaultLanguages();
  }
}

/**
 * Default translations for AKIG
 */
export const DEFAULT_TRANSLATIONS = {
  // UI Elements
  'ui.appels': { fr: 'Appels', en: 'Calls' },
  'ui.visites': { fr: 'Visites', en: 'Visits' },
  'ui.promesses': { fr: 'Promesses', en: 'Promises' },
  'ui.paiements': { fr: 'Paiements', en: 'Payments' },
  'ui.impayes': { fr: 'Impayés', en: 'Unpaid' },
  'ui.agents': { fr: 'Agents', en: 'Agents' },
  'ui.sites': { fr: 'Sites', en: 'Sites' },
  'ui.dashboard': { fr: 'Tableau de Bord', en: 'Dashboard' },
  'ui.analytics': { fr: 'Analyses', en: 'Analytics' },
  'ui.settings': { fr: 'Paramètres', en: 'Settings' },
  'ui.logout': { fr: 'Déconnexion', en: 'Logout' },

  // Actions
  'action.create': { fr: 'Créer', en: 'Create' },
  'action.edit': { fr: 'Modifier', en: 'Edit' },
  'action.delete': { fr: 'Supprimer', en: 'Delete' },
  'action.save': { fr: 'Enregistrer', en: 'Save' },
  'action.cancel': { fr: 'Annuler', en: 'Cancel' },
  'action.submit': { fr: 'Soumettre', en: 'Submit' },
  'action.export': { fr: 'Exporter', en: 'Export' },
  'action.import': { fr: 'Importer', en: 'Import' },

  // Messages
  'message.success': { fr: 'Opération réussie', en: 'Operation successful' },
  'message.error': { fr: 'Erreur', en: 'Error' },
  'message.confirm_delete': { fr: 'Êtes-vous sûr?', en: 'Are you sure?' },
  'message.loading': { fr: 'Chargement...', en: 'Loading...' },

  // Business
  'business.collect_rate': { fr: 'Taux de recouvrement', en: 'Collection rate' },
  'business.unpaid_amount': { fr: 'Montant impayé', en: 'Unpaid amount' },
  'business.promise_rate': { fr: 'Taux de promesses', en: 'Promise rate' },
  'business.agent_score': { fr: 'Score agent', en: 'Agent score' },
  'business.high_risk': { fr: 'Haut risque', en: 'High risk' },
  'business.critical': { fr: 'Critique', en: 'Critical' },

  // Report
  'report.monthly': { fr: 'Rapport Mensuel', en: 'Monthly Report' },
  'report.quarterly': { fr: 'Rapport Trimestriel', en: 'Quarterly Report' },
  'report.generated': { fr: 'Généré le', en: 'Generated on' },
  'report.summary': { fr: 'Résumé', en: 'Summary' }
};
