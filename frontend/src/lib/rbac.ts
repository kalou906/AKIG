// ============================================================================
// RBAC Library (rbac.ts)
// File: src/lib/rbac.ts
// Purpose: Role and permission types, utilities for access control
// ============================================================================

/**
 * Available roles in the AKIG system
 */
export type Role = 'PDG' | 'COMPTA' | 'AGENT' | 'LOCATAIRE' | 'PROPRIETAIRE';

/**
 * Available permissions in the AKIG system
 * Organized by resource: resource.action
 */
export type Permission =
  | 'tenants.view'
  | 'contracts.view'
  | 'contracts.generate'
  | 'payments.view'
  | 'payments.import'
  | 'reports.view'
  | 'reminders.send'
  | 'ai.assist'
  | 'owners.view'
  | 'sites.view'
  | 'audit.view';

/**
 * User object with permissions
 */
export interface User {
  id?: number;
  email?: string;
  permissions: Permission[];
  roles?: Role[];
}

/**
 * Check if user has a specific permission
 * @param user - User object with permissions array
 * @param perm - Permission to check
 * @returns true if user has permission
 *
 * @example
 * if (can(user, 'payments.import')) {
 *   // User can import payments
 * }
 */
export function can(user: User | null | undefined, perm: Permission): boolean {
  return user?.permissions?.includes(perm) ?? false;
}

/**
 * Check if user has ALL specified permissions
 * @param user - User object with permissions array
 * @param perms - Permissions to check (all required)
 * @returns true if user has all permissions
 *
 * @example
 * if (canAll(user, ['contracts.view', 'contracts.generate'])) {
 *   // User can view and generate contracts
 * }
 */
export function canAll(user: User | null | undefined, perms: Permission[]): boolean {
  return perms.every(p => can(user, p));
}

/**
 * Check if user has ANY of the specified permissions
 * @param user - User object with permissions array
 * @param perms - Permissions to check (at least one required)
 * @returns true if user has at least one permission
 *
 * @example
 * if (canAny(user, ['payments.import', 'payments.view'])) {
 *   // User can import or view payments
 * }
 */
export function canAny(user: User | null | undefined, perms: Permission[]): boolean {
  return perms.some(p => can(user, p));
}

/**
 * Check if user has a specific role
 * @param user - User object with roles array
 * @param role - Role to check
 * @returns true if user has role
 *
 * @example
 * if (hasRole(user, 'PDG')) {
 *   // User is CEO
 * }
 */
export function hasRole(user: User | null | undefined, role: Role): boolean {
  return user?.roles?.includes(role) ?? false;
}

/**
 * Check if user has ANY of the specified roles
 * @param user - User object with roles array
 * @param roles - Roles to check
 * @returns true if user has at least one role
 *
 * @example
 * if (hasAnyRole(user, ['PDG', 'COMPTA'])) {
 *   // User is CEO or Accountant
 * }
 */
export function hasAnyRole(user: User | null | undefined, roles: Role[]): boolean {
  return roles.some(r => hasRole(user, r));
}

/**
 * Get readable permission label
 * @param perm - Permission code
 * @returns Human-readable label
 *
 * @example
 * const label = getPermissionLabel('payments.import');
 * // Returns: "Importer des paiements CSV"
 */
export function getPermissionLabel(perm: Permission): string {
  const labels: Record<Permission, string> = {
    'tenants.view': 'Voir les locataires',
    'contracts.view': 'Voir les contrats',
    'contracts.generate': 'Générer les contrats',
    'payments.view': 'Voir les paiements',
    'payments.import': 'Importer des paiements CSV',
    'reports.view': 'Voir les rapports',
    'reminders.send': 'Envoyer des relances',
    'ai.assist': "Utiliser l'assistant IA",
    'owners.view': 'Voir les propriétaires',
    'sites.view': 'Voir les sites',
    'audit.view': 'Voir le journal d\'audit'
  };

  return labels[perm] || perm;
}

/**
 * Get readable role label
 * @param role - Role code
 * @returns Human-readable label
 *
 * @example
 * const label = getRoleLabel('COMPTA');
 * // Returns: "Comptabilité"
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    PDG: 'PDG',
    COMPTA: 'Comptabilité',
    AGENT: 'Agent',
    LOCATAIRE: 'Locataire',
    PROPRIETAIRE: 'Propriétaire'
  };

  return labels[role] || role;
}

/**
 * Role permission mappings
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  PDG: [
    'tenants.view',
    'contracts.view',
    'contracts.generate',
    'payments.view',
    'payments.import',
    'reports.view',
    'reminders.send',
    'ai.assist',
    'owners.view',
    'sites.view',
    'audit.view'
  ],
  COMPTA: [
    'tenants.view',
    'contracts.view',
    'payments.view',
    'payments.import',
    'reports.view',
    'ai.assist',
    'owners.view',
    'sites.view',
    'audit.view'
  ],
  AGENT: [
    'tenants.view',
    'contracts.view',
    'contracts.generate',
    'payments.view',
    'reminders.send',
    'ai.assist',
    'owners.view',
    'sites.view'
  ],
  LOCATAIRE: ['contracts.view', 'payments.view'],
  PROPRIETAIRE: ['reports.view', 'contracts.view', 'payments.view']
};

const rbacUtils = {
  can,
  canAll,
  canAny,
  hasRole,
  hasAnyRole,
  getPermissionLabel,
  getRoleLabel,
  ROLE_PERMISSIONS
};

export default rbacUtils;
