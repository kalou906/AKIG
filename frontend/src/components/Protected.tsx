// ============================================================================
// Protected Component (Protected.tsx)
// File: src/components/Protected.tsx
// Purpose: Render content conditionally based on user permissions
// ============================================================================

import React from 'react';
import { can, canAll, canAny, hasRole, Permission, Role, User } from '../lib/rbac';

/**
 * Props for Protected component
 */
export interface ProtectedProps {
  user: User | null | undefined;
  perm?: Permission;
  perms?: Permission[];
  mode?: 'all' | 'any'; // 'all' = user needs ALL perms, 'any' = user needs ANY perm
  role?: Role;
  roles?: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Protected Component
 * Renders children only if user has required permissions/roles
 *
 * @example
 * // Check single permission
 * <Protected user={user} perm="payments.import">
 *   <ImportButton />
 * </Protected>
 *
 * @example
 * // Check multiple permissions (ANY)
 * <Protected user={user} perms={['contracts.view', 'contracts.generate']} mode="any">
 *   <ContractMenu />
 * </Protected>
 *
 * @example
 * // Check role
 * <Protected user={user} role="PDG">
 *   <AdminPanel />
 * </Protected>
 *
 * @example
 * // With fallback
 * <Protected user={user} perm="audit.view" fallback={<p>Access Denied</p>}>
 *   <AuditLog />
 * </Protected>
 */
export const Protected: React.FC<ProtectedProps> = ({
  user,
  perm,
  perms,
  mode = 'all',
  role,
  roles,
  fallback = null,
  children
}) => {
  // Check permission
  if (perm && !can(user, perm)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (perms && perms.length > 0) {
    const hasPermission = mode === 'all' ? canAll(user, perms) : canAny(user, perms);
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  // Check role
  if (role && !hasRole(user, role)) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    const hasAnyRole = roles.some(r => hasRole(user, r));
    if (!hasAnyRole) {
      return <>{fallback}</>;
    }
  }

  // All checks passed
  return <>{children}</>;
};

/**
 * Higher-Order Component to protect a component with permission check
 *
 * @example
 * const ProtectedPaymentImport = withPermission(PaymentImportForm, 'payments.import');
 * <ProtectedPaymentImport user={user} />
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P & { user?: User }) {
    const { user, ...rest } = props;
    return (
      <Protected user={user} perm={permission} fallback={fallback}>
        <Component {...(rest as P)} />
      </Protected>
    );
  };
}

/**
 * Higher-Order Component to protect a component with role check
 *
 * @example
 * const AdminPanel = withRole(AdminSection, 'PDG');
 * <AdminPanel user={user} />
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: Role,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P & { user?: User }) {
    const { user, ...rest } = props;
    return (
      <Protected user={user} role={role} fallback={fallback}>
        <Component {...(rest as P)} />
      </Protected>
    );
  };
}

/**
 * Conditional button component - disabled if user lacks permission
 *
 * @example
 * <PermissionButton user={user} perm="payments.import">
 *   Import Payments
 * </PermissionButton>
 */
export interface PermissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  user: User | null | undefined;
  perm: Permission;
  children: React.ReactNode;
  title?: string;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  user,
  perm,
  children,
  title,
  disabled,
  className = '',
  ...props
}) => {
  const hasPermission = can(user, perm);

  return (
    <button
      disabled={disabled || !hasPermission}
      title={!hasPermission ? `Permission required: ${perm}` : title}
      className={`${className} ${!hasPermission ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Protected;
