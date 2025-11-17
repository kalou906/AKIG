/**
 * Regional Rules Configuration
 * 
 * Définit les règles métier par région/pays:
 * - Taxes régionales (TPA, IFU, TVA)
 * - Délais légaux (préavis, notice, éviction)
 * - Méthodes de paiement autorisées
 * - Langue officielle des contrats
 * - Règles d'accès/permissions locales
 */

export interface RegionalRule {
  siteId: string;
  ruleType: string;
  ruleValue: number | string;
  description: string;
  effectiveDate: Date;
  expirationDate?: Date;
}

export interface RegionalConfig {
  siteId: string;
  country: string;
  region: string;
  taxes: TaxConfig;
  legalDeadlines: LegalDeadlineConfig;
  paymentMethods: PaymentMethodConfig;
  contractLanguage: string;
  currency: string;
  bankingInfo: BankingConfig;
}

export interface TaxConfig {
  tpa: number; // Taxe PAF Immobilier (Guinea)
  ifu?: number; // Impôt Foncier Urbain
  tva?: number; // TVA général
  housingTax?: number; // Taxe habitation
}

export interface LegalDeadlineConfig {
  noticeToQuit: number; // jours
  evictionNotice: number; // jours
  maintenanceResponse: number; // jours
  disputeResolution: number; // jours
  depositReturnDeadline: number; // jours
}

export interface PaymentMethodConfig {
  allowedMethods: Array<'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'crypto'>;
  preferredMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  maxCashTransaction?: number; // GNF ou devise locale
}

export interface BankingConfig {
  banksSupported: string[];
  mobileMoneyProviders: string[];
  bankingHoursStart?: string; // HH:MM
  bankingHoursEnd?: string;
  publicHolidaysClosedDays: string[]; // Dates spéciales fermées
}

/**
 * GUINEA REGIONAL RULES
 */
export const GUINEA_CONAKRY: RegionalConfig = {
  siteId: 'GN_CONAKRY',
  country: 'GN',
  region: 'Conakry',
  contractLanguage: 'fr',
  currency: 'GNF',
  taxes: {
    tpa: 0.05, // 5% Taxe PAF
    ifu: 0.08, // 8% IFU
    tva: 0.18, // 18% TVA
    housingTax: 0.02, // 2% taxe habitation
  },
  legalDeadlines: {
    noticeToQuit: 30, // 30 jours préavis
    evictionNotice: 15, // 15 jours notice éviction
    maintenanceResponse: 5, // 5 jours pour maintenance
    disputeResolution: 60, // 60 jours pour résoudre litige
    depositReturnDeadline: 30, // 30 jours retour dépôt
  },
  paymentMethods: {
    allowedMethods: ['cash', 'bank_transfer', 'mobile_money'],
    preferredMethod: 'bank_transfer',
    maxCashTransaction: 10_000_000, // 10M GNF max
  },
  bankingInfo: {
    banksSupported: [
      'BMCE Bank Africa',
      'BDK (Banque de la République de Guinée)',
      'BNDE (Banque Nationale pour le Développement Economique)',
      'Union Bank Guinea',
      'Bank Algeria Guinée',
    ],
    mobileMoneyProviders: [
      'Orange Money GN',
      'MTN Mobile Money',
      'Airtel Mobile Money',
    ],
    bankingHoursStart: '08:00',
    bankingHoursEnd: '17:00',
    publicHolidaysClosedDays: [
      '2024-01-01', // New Year
      '2024-02-03', // National Day
      '2024-04-04', // Islamic Holiday (varies)
      '2024-05-01', // Labour Day
      '2024-08-15', // Assumption
      '2024-11-01', // All Saints
      '2024-12-25', // Christmas
    ],
  },
};

export const GUINEA_KINDIA: RegionalConfig = {
  siteId: 'GN_KINDIA',
  country: 'GN',
  region: 'Kindia',
  contractLanguage: 'fr',
  currency: 'GNF',
  taxes: {
    tpa: 0.04, // 4% (légèrement moins urbain)
    ifu: 0.07,
    tva: 0.18,
  },
  legalDeadlines: {
    noticeToQuit: 30,
    evictionNotice: 20, // Plus strict en région
    maintenanceResponse: 7,
    disputeResolution: 90,
    depositReturnDeadline: 30,
  },
  paymentMethods: {
    allowedMethods: ['cash', 'bank_transfer', 'mobile_money'],
    preferredMethod: 'cash', // Moins de banques
    maxCashTransaction: 15_000_000,
  },
  bankingInfo: {
    banksSupported: [
      'BMCE Bank Africa - Kindia Branch',
      'Union Bank Guinea - Kindia',
    ],
    mobileMoneyProviders: [
      'Orange Money GN',
      'MTN Mobile Money',
    ],
    bankingHoursStart: '08:30',
    bankingHoursEnd: '16:30',
    publicHolidaysClosedDays: GUINEA_CONAKRY.bankingInfo.publicHolidaysClosedDays,
  },
};

export const GUINEA_MAMOU: RegionalConfig = {
  siteId: 'GN_MAMOU',
  country: 'GN',
  region: 'Mamou',
  contractLanguage: 'fr',
  currency: 'GNF',
  taxes: {
    tpa: 0.03,
    ifu: 0.06,
    tva: 0.18,
  },
  legalDeadlines: {
    noticeToQuit: 35, // Plus strict
    evictionNotice: 25,
    maintenanceResponse: 10,
    disputeResolution: 120,
    depositReturnDeadline: 45,
  },
  paymentMethods: {
    allowedMethods: ['cash', 'mobile_money'],
    preferredMethod: 'cash',
    maxCashTransaction: 20_000_000,
  },
  bankingInfo: {
    banksSupported: [],
    mobileMoneyProviders: ['Orange Money GN', 'MTN Mobile Money'],
    bankingHoursStart: '09:00',
    bankingHoursEnd: '16:00',
    publicHolidaysClosedDays: GUINEA_CONAKRY.bankingInfo.publicHolidaysClosedDays,
  },
};

export const GUINEA_LABE: RegionalConfig = {
  siteId: 'GN_LABE',
  country: 'GN',
  region: 'Labé',
  contractLanguage: 'ff', // Peulh region
  currency: 'GNF',
  taxes: {
    tpa: 0.03,
    ifu: 0.05,
    tva: 0.18,
  },
  legalDeadlines: {
    noticeToQuit: 40, // Plus conservateur
    evictionNotice: 30,
    maintenanceResponse: 14,
    disputeResolution: 150,
    depositReturnDeadline: 60,
  },
  paymentMethods: {
    allowedMethods: ['cash', 'mobile_money'],
    preferredMethod: 'cash',
    maxCashTransaction: 25_000_000,
  },
  bankingInfo: {
    banksSupported: [],
    mobileMoneyProviders: ['Orange Money GN'],
    bankingHoursStart: '09:30',
    bankingHoursEnd: '15:30',
    publicHolidaysClosedDays: [
      ...GUINEA_CONAKRY.bankingInfo.publicHolidaysClosedDays,
      // Ajouter jours fériés locaux Peulh
    ],
  },
};

/**
 * SENEGAL REGIONAL RULES
 */
export const SENEGAL_DAKAR: RegionalConfig = {
  siteId: 'SN_DAKAR',
  country: 'SN',
  region: 'Dakar',
  contractLanguage: 'fr',
  currency: 'XOF', // Franc CFA
  taxes: {
    tpa: 0.06, // Taxes Sénégal
    tva: 0.18,
    housingTax: 0.03,
  },
  legalDeadlines: {
    noticeToQuit: 30, // Droit sénégalais
    evictionNotice: 15,
    maintenanceResponse: 5,
    disputeResolution: 90,
    depositReturnDeadline: 30,
  },
  paymentMethods: {
    allowedMethods: ['bank_transfer', 'mobile_money', 'check'],
    preferredMethod: 'bank_transfer',
    maxCashTransaction: 500_000, // 500k XOF max (cash rare)
  },
  bankingInfo: {
    banksSupported: [
      'SGBS (Société Générale)',
      'BICIS',
      'BOA (Bank of Africa)',
      'CBAO',
      'Ecobank',
    ],
    mobileMoneyProviders: [
      'Wave Money',
      'Orange Money SN',
      'Tigo Money',
    ],
    bankingHoursStart: '08:00',
    bankingHoursEnd: '17:00',
    publicHolidaysClosedDays: [
      '2024-01-01',
      '2024-02-18', // Independence Day
      '2024-04-11', // Eid ul-Fitr (varies)
      '2024-05-01',
      '2024-08-15',
      '2024-11-01',
      '2024-12-25',
    ],
  },
};

/**
 * MALI REGIONAL RULES
 */
export const MALI_BAMAKO: RegionalConfig = {
  siteId: 'ML_BAMAKO',
  country: 'ML',
  region: 'Bamako',
  contractLanguage: 'fr',
  currency: 'XOF',
  taxes: {
    tpa: 0.04,
    tva: 0.18,
  },
  legalDeadlines: {
    noticeToQuit: 30, // Droit malien
    evictionNotice: 20,
    maintenanceResponse: 7,
    disputeResolution: 120,
    depositReturnDeadline: 45,
  },
  paymentMethods: {
    allowedMethods: ['bank_transfer', 'mobile_money'],
    preferredMethod: 'bank_transfer',
  },
  bankingInfo: {
    banksSupported: [
      'BMCE Bank Mali',
      'BDM (Banque de Développement du Mali)',
      'Ecobank Mali',
    ],
    mobileMoneyProviders: [
      'Orange Money Mali',
      'Moov Money',
      'Malitel Mobile Money',
    ],
    bankingHoursStart: '08:00',
    bankingHoursEnd: '17:00',
    publicHolidaysClosedDays: [
      '2024-01-01',
      '2024-01-20', // Armed Forces Day
      '2024-03-08', // Women's Day
      '2024-05-01',
      '2024-09-22', // Independence Day
      '2024-12-25',
    ],
  },
};

/**
 * Récupérer config régionale
 */
export function getRegionalConfig(siteId: string): RegionalConfig | null {
  const configs: Record<string, RegionalConfig> = {
    GN_CONAKRY,
    GN_KINDIA,
    GN_MAMOU,
    GN_LABE,
    SN_DAKAR,
    ML_BAMAKO,
  };

  return configs[siteId] || null;
}

/**
 * Appliquer taxes régionales
 */
export function calculateRegionalTaxes(
  siteId: string,
  amount: number,
  taxType: 'tpa' | 'ifu' | 'tva' | 'housing'
): number {
  const config = getRegionalConfig(siteId);
  if (!config) return 0;

  let rate = 0;
  switch (taxType) {
    case 'tpa':
      rate = config.taxes.tpa;
      break;
    case 'ifu':
      rate = config.taxes.ifu || 0;
      break;
    case 'tva':
      rate = config.taxes.tva || 0;
      break;
    case 'housing':
      rate = config.taxes.housingTax || 0;
      break;
  }

  return amount * rate;
}

/**
 * Vérifier si date est un jour ouvrable
 */
export function isBusinessDay(siteId: string, date: Date): boolean {
  const config = getRegionalConfig(siteId);
  if (!config) return true;

  // Vérifier weekend
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Vérifier jours fériés
  const dateStr = date.toISOString().split('T')[0];
  return !config.bankingInfo.publicHolidaysClosedDays.includes(dateStr);
}

/**
 * Calculer deadline légale
 */
export function calculateLegalDeadline(
  siteId: string,
  startDate: Date,
  deadlineType: 'notice_to_quit' | 'eviction' | 'maintenance' | 'dispute' | 'deposit_return'
): Date {
  const config = getRegionalConfig(siteId);
  if (!config) return startDate;

  let days = 0;
  switch (deadlineType) {
    case 'notice_to_quit':
      days = config.legalDeadlines.noticeToQuit;
      break;
    case 'eviction':
      days = config.legalDeadlines.evictionNotice;
      break;
    case 'maintenance':
      days = config.legalDeadlines.maintenanceResponse;
      break;
    case 'dispute':
      days = config.legalDeadlines.disputeResolution;
      break;
    case 'deposit_return':
      days = config.legalDeadlines.depositReturnDeadline;
      break;
  }

  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + days);

  // Ajuster si deadline tombe sur weekend/jour férié
  while (!isBusinessDay(siteId, deadline)) {
    deadline.setDate(deadline.getDate() + 1);
  }

  return deadline;
}

/**
 * Vérifier si méthode paiement est permise
 */
export function isPaymentMethodAllowed(
  siteId: string,
  method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'crypto'
): boolean {
  const config = getRegionalConfig(siteId);
  if (!config) return false;

  return config.paymentMethods.allowedMethods.includes(method);
}

/**
 * Formater devise régionale
 */
export function formatCurrency(siteId: string, amount: number): string {
  const config = getRegionalConfig(siteId);
  if (!config) return amount.toString();

  // Format: "10,000 GNF" ou "500,000 XOF"
  return `${amount.toLocaleString('fr-FR')} ${config.currency}`;
}

export default {
  getRegionalConfig,
  calculateRegionalTaxes,
  isBusinessDay,
  calculateLegalDeadline,
  isPaymentMethodAllowed,
  formatCurrency,
};
