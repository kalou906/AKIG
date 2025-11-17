/**
 * i18n Configuration
 * Système de traduction multi-langue avec support dynamique
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Ressources locales
import frTranslation from './locales/fr.json';
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';

// Namespaces (domaines de traduction)
import frCommon from './locales/namespaces/fr/common.json';
import frPayments from './locales/namespaces/fr/payments.json';
import frContracts from './locales/namespaces/fr/contracts.json';
import frTenants from './locales/namespaces/fr/tenants.json';
import frErrors from './locales/namespaces/fr/errors.json';
import frValidation from './locales/namespaces/fr/validation.json';

import enCommon from './locales/namespaces/en/common.json';
import enPayments from './locales/namespaces/en/payments.json';
import enContracts from './locales/namespaces/en/contracts.json';
import enTenants from './locales/namespaces/en/tenants.json';
import enErrors from './locales/namespaces/en/errors.json';
import enValidation from './locales/namespaces/en/validation.json';

import arCommon from './locales/namespaces/ar/common.json';
import arPayments from './locales/namespaces/ar/payments.json';
import arContracts from './locales/namespaces/ar/contracts.json';
import arTenants from './locales/namespaces/ar/tenants.json';
import arErrors from './locales/namespaces/ar/errors.json';
import arValidation from './locales/namespaces/ar/validation.json';

// Types de ressources
export const LANGUAGES = {
  FR: 'fr',
  EN: 'en',
  AR: 'ar',
} as const;

export const NAMESPACES = {
  COMMON: 'common',
  PAYMENTS: 'payments',
  CONTRACTS: 'contracts',
  TENANTS: 'tenants',
  ERRORS: 'errors',
  VALIDATION: 'validation',
} as const;

// Configuration des langues
const languageConfig = {
  [LANGUAGES.FR]: {
    name: 'Français',
    nativeName: 'Français',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm:ss',
    currency: 'EUR',
  },
  [LANGUAGES.EN]: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'hh:mm:ss a',
    currency: 'EUR',
  },
  [LANGUAGES.AR]: {
    name: 'العربية',
    nativeName: 'العربية',
    dir: 'rtl',
    dateFormat: 'yyyy/MM/dd',
    timeFormat: 'HH:mm:ss',
    currency: 'EUR',
  },
};

// Ressources structurées par langue et namespace
const resources = {
  [LANGUAGES.FR]: {
    translation: frTranslation,
    [NAMESPACES.COMMON]: frCommon,
    [NAMESPACES.PAYMENTS]: frPayments,
    [NAMESPACES.CONTRACTS]: frContracts,
    [NAMESPACES.TENANTS]: frTenants,
    [NAMESPACES.ERRORS]: frErrors,
    [NAMESPACES.VALIDATION]: frValidation,
  },
  [LANGUAGES.EN]: {
    translation: enTranslation,
    [NAMESPACES.COMMON]: enCommon,
    [NAMESPACES.PAYMENTS]: enPayments,
    [NAMESPACES.CONTRACTS]: enContracts,
    [NAMESPACES.TENANTS]: enTenants,
    [NAMESPACES.ERRORS]: enErrors,
    [NAMESPACES.VALIDATION]: enValidation,
  },
  [LANGUAGES.AR]: {
    translation: arTranslation,
    [NAMESPACES.COMMON]: arCommon,
    [NAMESPACES.PAYMENTS]: arPayments,
    [NAMESPACES.CONTRACTS]: arContracts,
    [NAMESPACES.TENANTS]: arTenants,
    [NAMESPACES.ERRORS]: arErrors,
    [NAMESPACES.VALIDATION]: arValidation,
  },
};

// Initialisation i18next
// @ts-ignore - i18n type compatibility issues
i18n
  // Utilise le backend HTTP pour charger les traductions (optionnel)
  .use(HttpBackend)
  // Détecte la langue du navigateur
  .use(LanguageDetector)
  // Initialise React i18next
  .use(initReactI18next)
  // @ts-ignore - i18n type compatibility issues
  .init({
    resources,
    defaultNS: NAMESPACES.COMMON,
    ns: Object.values(NAMESPACES),
    fallbackLng: LANGUAGES.FR,
    fallbackNS: NAMESPACES.COMMON,
    debug: process.env.NODE_ENV === 'development',

    // Interpolation
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
      // @ts-ignore - i18n type compatibility issue
      format: (value: any, format: string | undefined, lng: string) => {
        if (!format) return value;
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);

        // Formatage de date
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date(value));
        }

        // Formatage de devise
        if (format === 'currency') {
          const config = languageConfig[lng as keyof typeof languageConfig];
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: config?.currency || 'EUR',
          }).format(value);
        }

        // Formatage de nombre
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }

        return value;
      },
    },

    // Détection de langue
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Backend HTTP (pour chargement dynamique)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },

    // Réaction aux changements
    react: {
      useSuspense: false,
      bindI18nStore: 'added',
    },
  });

// Définir la direction du texte au changement de langue
i18n.on('languageChanged', (lng: string) => {
  const dir = languageConfig[lng as keyof typeof languageConfig]?.dir || 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  localStorage.setItem('preferredLanguage', lng);
});

export { languageConfig };
export default i18n;
