// ============================================================================
// Contract Policies (contracts.ts)
// File: src/policies/contracts.ts
// Purpose: Fine-grained access control for contract operations
// ============================================================================

/**
 * Check if user can generate contracts
 * Allowed: PDG, AGENT (with permission)
 * COMPTA can only view, not generate
 *
 * @param user User object with permissions
 * @returns true if user can generate contracts
 */
export function canGenerateContract(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('contracts.generate');
}

/**
 * Check if user can view contracts
 * Allowed: PDG, COMPTA, AGENT, LOCATAIRE, PROPRIETAIRE (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can view contracts
 */
export function canViewContract(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('contracts.view');
}

/**
 * Check if user can send reminders
 * Allowed: PDG, COMPTA, AGENT (with permission)
 * LOCATAIRE and PROPRIETAIRE cannot send reminders
 *
 * @param user User object with permissions
 * @returns true if user can send reminders
 */
export function canSendReminder(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('reminders.send');
}

/**
 * Check if user can view tenant data
 * Allowed: PDG, COMPTA, AGENT, PROPRIETAIRE (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can view tenants
 */
export function canViewTenant(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('tenants.view');
}

/**
 * Check if user can view reports
 * Allowed: PDG, COMPTA, PROPRIETAIRE (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can view reports
 */
export function canViewReport(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('reports.view');
}

/**
 * Check if user can import payments
 * Allowed: PDG, COMPTA (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can import payments
 */
export function canImportPayments(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('payments.import');
}

/**
 * Check if user can view payments
 * Allowed: PDG, COMPTA, AGENT, LOCATAIRE, PROPRIETAIRE (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can view payments
 */
export function canViewPayment(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('payments.view');
}

/**
 * Check if user can view audit logs
 * Allowed: PDG, COMPTA (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can view audit logs
 */
export function canViewAudit(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('audit.view');
}

/**
 * Check if user can use AI assistance
 * Allowed: PDG, COMPTA, AGENT (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can use AI features
 */
export function canUseAI(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('ai.assist');
}

/**
 * Check if user can view owner information
 * Allowed: PDG, COMPTA, PROPRIETAIRE (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can view owners
 */
export function canViewOwner(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('owners.view');
}

/**
 * Check if user can view sites/properties
 * Allowed: PDG, AGENT, PROPRIETAIRE (with permission)
 *
 * @param user User object with permissions
 * @returns true if user can view sites
 */
export function canViewSite(user: any): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes('sites.view');
}

export default {
  canGenerateContract,
  canViewContract,
  canSendReminder,
  canViewTenant,
  canViewReport,
  canImportPayments,
  canViewPayment,
  canViewAudit,
  canUseAI,
  canViewOwner,
  canViewSite
};
