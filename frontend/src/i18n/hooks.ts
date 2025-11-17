/**
 * Custom Hooks for i18n
 * Utilitaires React pour utiliser les traductions facilement
 */

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { LANGUAGES, NAMESPACES, languageConfig } from './config';

/**
 * Hook pour obtenir une traduction avec namespace optionnel
 * Usage: const { t } = useI18n(); const message = t('common:welcome');
 */
export function useI18n(namespace?: string) {
  const { t } = useTranslation(namespace || NAMESPACES.COMMON);
  return { t };
}

/**
 * Hook pour gérer la langue et ses préférences
 * Usage: const { language, setLanguage, getLanguageConfig } = useLanguage();
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as keyof typeof LANGUAGES;

  const setLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
      // Sauvegarder la préférence
      localStorage.setItem('preferredLanguage', lng);
    },
    [i18n]
  );

  const getLanguageConfig = useCallback(
    (lng?: string) => {
      const language = lng || currentLanguage;
      return languageConfig[language as keyof typeof languageConfig];
    },
    [currentLanguage]
  );

  const getAvailableLanguages = useCallback(() => {
    return Object.entries(languageConfig).map(([code, config]) => ({
      code,
      name: config.name,
      nativeName: config.nativeName,
      dir: config.dir,
    }));
  }, []);

  return {
    language: currentLanguage,
    setLanguage,
    getLanguageConfig,
    getAvailableLanguages,
    isRTL: () => languageConfig[currentLanguage as keyof typeof languageConfig]?.dir === 'rtl',
  };
}

/**
 * Hook pour formater les dates selon la langue
 * Usage: const { formatDate } = useDateFormatter(); const str = formatDate(new Date());
 */
export function useDateFormatter() {
  const { language } = useLanguage();

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const config = languageConfig[language as keyof typeof languageConfig];
      const locale = language as string;
      const defaultOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      } as Intl.DateTimeFormatOptions;

      return new Intl.DateTimeFormat(locale, options || defaultOptions).format(
        typeof date === 'string' ? new Date(date) : date
      );
    },
    [language]
  );

  const formatTime = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const locale = language as string;
      const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      } as Intl.DateTimeFormatOptions;

      return new Intl.DateTimeFormat(locale, options || defaultOptions).format(
        typeof date === 'string' ? new Date(date) : date
      );
    },
    [language]
  );

  const formatDateTime = useCallback(
    (date: Date | string, dateOptions?: Intl.DateTimeFormatOptions, timeOptions?: Intl.DateTimeFormatOptions) => {
      const formattedDate = formatDate(date, dateOptions);
      const formattedTime = formatTime(date, timeOptions);
      return `${formattedDate} ${formattedTime}`;
    },
    [formatDate, formatTime]
  );

  return { formatDate, formatTime, formatDateTime };
}

/**
 * Hook pour formater les nombres et devises
 * Usage: const { formatCurrency, formatNumber } = useNumberFormatter();
 */
export function useNumberFormatter() {
  const { language } = useLanguage();
  const locale = language as string;

  const formatCurrency = useCallback(
    (value: number, currency: string = 'EUR', options?: Intl.NumberFormatOptions) => {
      const defaultOptions = {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      } as Intl.NumberFormatOptions;

      return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      const defaultOptions = {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      } as Intl.NumberFormatOptions;

      return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value);
    },
    [locale]
  );

  const formatPercent = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      const defaultOptions = {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      } as Intl.NumberFormatOptions;

      return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value);
    },
    [locale]
  );

  return { formatCurrency, formatNumber, formatPercent };
}

/**
 * Hook pour validation avec messages localisés
 * Usage: const { getErrorMessage } = useValidationMessages(); const msg = getErrorMessage('email');
 */
export function useValidationMessages() {
  const { t } = useI18n(NAMESPACES.VALIDATION);
  const { t: tErrors } = useTranslation(NAMESPACES.ERRORS);

  const getErrorMessage = useCallback(
    (errorKey: string, params?: Record<string, any>): string => {
      const message = t(`validation:${errorKey}`, params || {});
      return String(message || `Error: ${errorKey}`);
    },
    [t]
  );

  const getHttpErrorMessage = useCallback(
    (statusCode: number): string => {
      const message = tErrors(`errors:http_errors.${statusCode}`);
      return message || 'An error occurred';
    },
    [tErrors]
  );

  return { getErrorMessage, getHttpErrorMessage };
}

/**
 * Hook pour messages de notification
 * Usage: const { getSuccessMessage } = useMessages();
 */
export function useMessages() {
  const { t } = useTranslation(NAMESPACES.COMMON);
  const { t: tPayments } = useTranslation(NAMESPACES.PAYMENTS);
  const { t: tContracts } = useTranslation(NAMESPACES.CONTRACTS);

  return {
    // Messages généraux
    success: () => t('common:messages.saved_successfully'),
    deleted: () => t('common:messages.deleted_successfully'),
    updated: () => t('common:messages.updated_successfully'),
    error: () => t('common:messages.operation_failed'),
    confirmDelete: () => t('common:messages.confirm_delete'),
    confirmAction: () => t('common:messages.confirm_action'),

    // Messages métier
    paymentRecorded: () => tPayments('payments:messages.payment_recorded'),
    receiptSent: () => tPayments('payments:messages.receipt_sent'),
    contractCreated: () => tContracts('contracts:messages.contract_created'),
    contractTerminated: () => tContracts('contracts:messages.contract_terminated'),
  };
}

/**
 * Hook pour gérer les formats de liste (pagination, etc.)
 * Usage: const { formatPagination } = useFormatting();
 */
export function useFormatting() {
  const { t } = useI18n(NAMESPACES.COMMON);

  const formatPagination = useCallback(
    (from: number, to: number, total: number): string => {
      return String(t('common:pagination.showing', { from, to, total }));
    },
    [t]
  );

  const getStatusBadge = useCallback((status: string): string => {
    const statusKey = `common:common.${status}`;
    return String(t(statusKey) || status);
  }, [t]);

  return { formatPagination, getStatusBadge };
}

export default {
  useI18n,
  useLanguage,
  useDateFormatter,
  useNumberFormatter,
  useValidationMessages,
  useMessages,
  useFormatting,
};
