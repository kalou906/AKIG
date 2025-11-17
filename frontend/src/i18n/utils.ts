/**
 * i18n Utilities
 * Fonctions utilitaires pour i18n
 */

import i18n from './config';

/**
 * Obtenir la clé de traduction complète avec namespace
 * @param namespace - Namespace (ex: 'payments', 'contracts')
 * @param key - Clé de traduction (ex: 'title', 'list.columns.id')
 * @returns Clé formatée (ex: 'payments:title')
 */
export const getTranslationKey = (namespace: string, key: string): string => {
  return `${namespace}:${key}`;
};

/**
 * Obtenir la traduction directement
 * @param key - Clé complète (ex: 'payments:title' ou 'common:welcome')
 * @param options - Options d'interpolation
 * @returns Texte traduit
 */
export const t = (key: string, options?: Record<string, any>): string => {
  return String(i18n.t(key, options) || '');
};

/**
 * Changer la langue
 * @param language - Code langue (fr, en, ar)
 */
export const changeLanguage = async (language: string): Promise<void> => {
  await i18n.changeLanguage(language);
};

/**
 * Obtenir la langue actuelle
 */
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

/**
 * Obtenir toutes les langues disponibles
 */
export const getAvailableLanguages = (): string[] => {
  return Object.keys(i18n.options.resources || {});
};

/**
 * Vérifie si la langue est RTL (droite à gauche)
 */
export const isRTL = (language?: string): boolean => {
  const lang = language || i18n.language;
  return lang === 'ar';
};

/**
 * Obtenir le code HTML pour la langue
 */
export const getHtmlLanguageCode = (language?: string): string => {
  const lang = language || i18n.language;
  return lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr' : 'en';
};

/**
 * Obtenir la direction du texte (ltr ou rtl)
 */
export const getTextDirection = (language?: string): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

/**
 * Ajouter des ressources de traduction dynamiquement
 */
export const addResourcesBundle = (
  language: string,
  namespace: string,
  resources: Record<string, any>
): void => {
  i18n.addResourceBundle(language, namespace, resources, true, true);
};

/**
 * Formater une date selon la langue
 */
export const formatDateByLanguage = (
  date: Date | string,
  language?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const lang = language || i18n.language;
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  } as Intl.DateTimeFormatOptions;

  return new Intl.DateTimeFormat(lang, options || defaultOptions).format(
    typeof date === 'string' ? new Date(date) : date
  );
};

/**
 * Formater une devise selon la langue
 */
export const formatCurrencyByLanguage = (
  value: number,
  currency: string = 'EUR',
  language?: string,
  options?: Intl.NumberFormatOptions
): string => {
  const lang = language || i18n.language;
  const defaultOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  } as Intl.NumberFormatOptions;

  return new Intl.NumberFormat(lang, { ...defaultOptions, ...options }).format(value);
};

/**
 * Formater un nombre selon la langue
 */
export const formatNumberByLanguage = (
  value: number,
  language?: string,
  options?: Intl.NumberFormatOptions
): string => {
  const lang = language || i18n.language;
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  } as Intl.NumberFormatOptions;

  return new Intl.NumberFormat(lang, { ...defaultOptions, ...options }).format(value);
};

/**
 * Obtenir le locale complet pour la langue
 */
export const getLocaleForLanguage = (language?: string): string => {
  const lang = language || i18n.language;
  const localeMap: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA',
  };
  return localeMap[lang] || `${lang}-${lang.toUpperCase()}`;
};

export default {
  getTranslationKey,
  t,
  changeLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
  isRTL,
  getHtmlLanguageCode,
  getTextDirection,
  addResourcesBundle,
  formatDateByLanguage,
  formatCurrencyByLanguage,
  formatNumberByLanguage,
  getLocaleForLanguage,
};
