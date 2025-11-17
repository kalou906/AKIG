/**
 * i18n utilities - Traductions dynamiques avec pluralisation
 */

type TranslationFunction = (param?: any) => string;

interface TranslationFunctions {
  [key: string]: TranslationFunction;
}

interface I18nDictionary {
  [language: string]: TranslationFunctions;
}

/**
 * Dictionnaire de traductions
 */
export const t: I18nDictionary = {
  fr: {
    // Pluralisation des locataires
    tenants_count: (n: number = 0): string => {
      if (n === 0) return 'Aucun locataire';
      if (n === 1) return '1 locataire';
      return `${n} locataires`;
    },

    // Pluralisation des contrats
    contracts_count: (n: number = 0): string => {
      if (n === 0) return 'Aucun contrat';
      if (n === 1) return '1 contrat';
      return `${n} contrats`;
    },

    // Affichage des délais d'échéance
    due_in_days: (d: number = 0): string => {
      if (d === 0) return 'Échéance aujourd\'hui';
      if (d === 1) return 'Échéance dans 1 jour';
      if (d < 0) return `Retard de ${Math.abs(d)} jour${Math.abs(d) > 1 ? 's' : ''}`;
      return `Échéance dans ${d} jours`;
    },

    // Montants en GNF
    amount_gnf: (amount: number = 0): string => {
      return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0,
      }).format(amount);
    },

    // Statut de paiement
    payment_status: (status: string = ''): string => {
      const statuses: Record<string, string> = {
        paid: '✅ Payé',
        pending: '⏳ En attente',
        overdue: '❌ En retard',
        partial: '⚠️ Paiement partiel',
        cancelled: '🚫 Annulé',
      };
      return statuses[status] || status;
    },

    // Statut de contrat
    contract_status: (status: string = ''): string => {
      const statuses: Record<string, string> = {
        active: '✅ Actif',
        expired: '⏸️ Expiré',
        ending_soon: '⚠️ Expire bientôt',
        terminated: '🚫 Résilié',
        pending: '⏳ En attente',
      };
      return statuses[status] || status;
    },

    // Formattage de date relative
    date_relative: (date: Date | string): string => {
      if (typeof date === 'string') {
        date = new Date(date);
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins}m`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays}j`;

      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    },

    // Pluralisation générique
    pluralize: (count: number = 0): string => {
      return count <= 1 ? 'singular' : 'plural';
    },
  },

  en: {
    // English translations
    tenants_count: (n: number = 0): string => {
      if (n === 0) return 'No tenants';
      if (n === 1) return '1 tenant';
      return `${n} tenants`;
    },

    contracts_count: (n: number = 0): string => {
      if (n === 0) return 'No contracts';
      if (n === 1) return '1 contract';
      return `${n} contracts`;
    },

    due_in_days: (d: number = 0): string => {
      if (d === 0) return 'Due today';
      if (d === 1) return 'Due in 1 day';
      if (d < 0) return `Overdue by ${Math.abs(d)} day${Math.abs(d) > 1 ? 's' : ''}`;
      return `Due in ${d} days`;
    },

    amount_gnf: (amount: number = 0): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0,
      }).format(amount);
    },

    payment_status: (status: string = ''): string => {
      const statuses: Record<string, string> = {
        paid: '✅ Paid',
        pending: '⏳ Pending',
        overdue: '❌ Overdue',
        partial: '⚠️ Partial',
        cancelled: '🚫 Cancelled',
      };
      return statuses[status] || status;
    },

    contract_status: (status: string = ''): string => {
      const statuses: Record<string, string> = {
        active: '✅ Active',
        expired: '⏸️ Expired',
        ending_soon: '⚠️ Ending soon',
        terminated: '🚫 Terminated',
        pending: '⏳ Pending',
      };
      return statuses[status] || status;
    },

    date_relative: (date: Date | string): string => {
      if (typeof date === 'string') {
        date = new Date(date);
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    },

    plural: (count: number = 0): string => {
      return count <= 1 ? 'singular' : 'plural';
    },
  },
};

/**
 * Helper pour obtenir une traduction
 */
export function translate(key: string, lang: string = 'fr', param?: number | string): string {
  const langDict = t[lang];
  if (!langDict) {
    console.warn(`Language '${lang}' not found, falling back to 'fr'`);
    return t.fr[key]?.(param) || key;
  }

  const translator = langDict[key];
  if (!translator) {
    console.warn(`Translation key '${key}' not found`);
    return key;
  }

  return translator(param);
}

/**
 * Hook pour les traductions (version simplifiée pour usage dans hooks)
 */
export function useTranslations(lang: string = 'fr') {
  return (key: string, param?: number | string): string => {
    return translate(key, lang, param);
  };
}

/**
 * Déterminer la langue de l'utilisateur
 */
export function detectLanguage(): string {
  if (typeof navigator === 'undefined') return 'fr';

  // Récupérer de localStorage
  const stored = localStorage.getItem('language');
  if (stored) return stored;

  // Utiliser la langue du navigateur
  const browserLang = navigator.language.split('-')[0];
  return ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';
}

/**
 * Définir la langue
 */
export function setLanguage(lang: string): void {
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
}

/**
 * Langue actuelle
 */
export function getCurrentLanguage(): string {
  return localStorage.getItem('language') || detectLanguage();
}
