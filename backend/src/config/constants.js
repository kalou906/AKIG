/**
 * Constantes et configuration globales
 * backend/src/config/constants.js
 */

// ============================================================================
// Statuts de paiement
// ============================================================================
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS_LABELS = {
  pending: 'En attente',
  completed: 'Complété',
  failed: 'Échoué',
  refunded: 'Remboursé',
  cancelled: 'Annulé',
};

// ============================================================================
// Statuts de contrat
// ============================================================================
const CONTRACT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
  ARCHIVED: 'archived',
};

const CONTRACT_STATUS_LABELS = {
  draft: 'Brouillon',
  active: 'Actif',
  expired: 'Expiré',
  terminated: 'Résilié',
  archived: 'Archivé',
};

// ============================================================================
// Statuts de locataire
// ============================================================================
const TENANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  SUSPENDED: 'suspended',
};

const TENANT_STATUS_LABELS = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
  suspended: 'Suspendu',
};

// ============================================================================
// Rôles et permissions
// ============================================================================
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  OWNER: 'owner',
  USER: 'user',
};

const ROLE_LABELS = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  manager: 'Gestionnaire',
  agent: 'Agent',
  owner: 'Propriétaire',
  user: 'Utilisateur',
};

const PERMISSIONS = {
  // Audit
  AUDIT_VIEW: 'audit.view',
  AUDIT_EXPORT: 'audit.export',

  // Utilisateurs
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Contrats
  CONTRACTS_VIEW: 'contracts.view',
  CONTRACTS_CREATE: 'contracts.create',
  CONTRACTS_UPDATE: 'contracts.update',
  CONTRACTS_DELETE: 'contracts.delete',
  CONTRACTS_SIGN: 'contracts.sign',
  CONTRACTS_SEND: 'contracts.send',

  // Paiements
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_UPDATE: 'payments.update',
  PAYMENTS_DELETE: 'payments.delete',
  PAYMENTS_EXPORT: 'payments.export',

  // Locataires
  TENANTS_VIEW: 'tenants.view',
  TENANTS_CREATE: 'tenants.create',
  TENANTS_UPDATE: 'tenants.update',
  TENANTS_DELETE: 'tenants.delete',

  // Rapports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',

  // Configuration
  CONFIG_VIEW: 'config.view',
  CONFIG_UPDATE: 'config.update',
};

// ============================================================================
// Types d'alertes
// ============================================================================
const ALERT_TYPES = {
  PAYMENT_OVERDUE: 'payment_overdue',
  PAYMENT_RECEIVED: 'payment_received',
  CONTRACT_EXPIRING: 'contract_expiring',
  CONTRACT_EXPIRED: 'contract_expired',
  SYSTEM_ERROR: 'system_error',
  AUDIT_LOG: 'audit_log',
};

const ALERT_TYPE_LABELS = {
  payment_overdue: 'Paiement en retard',
  payment_received: 'Paiement reçu',
  contract_expiring: 'Contrat expire bientôt',
  contract_expired: 'Contrat expiré',
  system_error: 'Erreur système',
  audit_log: 'Journal d\'audit',
};

const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// ============================================================================
// Limites et pagination
// ============================================================================
const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  POINT_COST: 1,
};

// ============================================================================
// Format dates et devises
// ============================================================================
const LOCALE = 'fr-GN';
const CURRENCY = 'GNF';
const TIMEZONE = 'Africa/Conakry';

// ============================================================================
// Limites métier
// ============================================================================
const BUSINESS_RULES = {
  MIN_RENT_AMOUNT: 1000, // GNF
  MAX_RENT_AMOUNT: 10000000, // GNF
  PAYMENT_GRACE_DAYS: 3, // Jours de grâce avant retard
  DUNNING_DAYS: 7, // Jours avant premier rappel
  OVERDUE_THRESHOLD_DAYS: 30, // Jours avant considéré comme arriéré
};

// ============================================================================
// Logging et monitoring
// ============================================================================
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

module.exports = {
  // Statuts
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  CONTRACT_STATUS,
  CONTRACT_STATUS_LABELS,
  TENANT_STATUS,
  TENANT_STATUS_LABELS,

  // Rôles et permissions
  ROLES,
  ROLE_LABELS,
  PERMISSIONS,

  // Alertes
  ALERT_TYPES,
  ALERT_TYPE_LABELS,
  ALERT_SEVERITY,

  // Configuration
  PAGINATION,
  RATE_LIMIT,
  LOCALE,
  CURRENCY,
  TIMEZONE,
  BUSINESS_RULES,
  LOG_LEVELS,
};
