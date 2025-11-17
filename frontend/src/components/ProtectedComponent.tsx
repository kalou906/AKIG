/**
 * ProtectedComponent & Authorization Wrappers
 * Components for conditional rendering based on permissions and roles
 * 
 * Usage:
 *   <IfHasPermission permission="contracts.export">
 *     <button>Export</button>
 *   </IfHasPermission>
 */

import React from 'react';
import { usePermission } from '../hooks/usePermission';

/**
 * Props for permission-based components
 */
export interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export interface IfHasPermissionProps extends PermissionGateProps {
  permission: string;
}

export interface IfHasAnyPermissionProps extends PermissionGateProps {
  permissions: string[];
}

export interface IfHasAllPermissionsProps extends PermissionGateProps {
  permissions: string[];
}

export interface IfHasRoleProps extends PermissionGateProps {
  role: string;
}

export interface IfHasAnyRoleProps extends PermissionGateProps {
  roles: string[];
}

/**
 * Component: Show content if user has specific permission
 * 
 * Usage:
 *   <IfHasPermission permission="contracts.export">
 *     <ExportButton />
 *   </IfHasPermission>
 */
export function IfHasPermission({
  children,
  permission,
  fallback,
  loading
}: IfHasPermissionProps): React.ReactElement | null {
  const { hasPermission, loading: isLoading } = usePermission();

  if (isLoading) {
    return loading ? <>{loading}</> : null;
  }

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Component: Show content if user has ANY of the specified permissions
 * 
 * Usage:
 *   <IfHasAnyPermission permissions={['contracts.export', 'contracts.import']}>
 *     <Button>Export/Import</Button>
 *   </IfHasAnyPermission>
 */
export function IfHasAnyPermission({
  children,
  permissions,
  fallback,
  loading: loadingNode
}: IfHasAnyPermissionProps): React.ReactElement | null {
  const { hasAnyPermission, loading } = usePermission();

  if (loading) {
    return loadingNode ? <>{loadingNode}</> : null;
  }

  if (!hasAnyPermission(permissions)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Component: Show content if user has ALL of the specified permissions
 * 
 * Usage:
 *   <IfHasAllPermissions permissions={['contracts.view', 'contracts.edit']}>
 *     <EditContractForm />
 *   </IfHasAllPermissions>
 */
export function IfHasAllPermissions({
  children,
  permissions,
  fallback,
  loading: loadingNode
}: IfHasAllPermissionsProps): React.ReactElement | null {
  const { hasAllPermissions, loading } = usePermission();

  if (loading) {
    return loadingNode ? <>{loadingNode}</> : null;
  }

  if (!hasAllPermissions(permissions)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Component: Show content if user has specific role
 * 
 * Usage:
 *   <IfHasRole role="PDG">
 *     <AdminPanel />
 *   </IfHasRole>
 */
export function IfHasRole({
  children,
  role,
  fallback,
  loading: loadingNode
}: IfHasRoleProps): React.ReactElement | null {
  const { hasRole, loading } = usePermission();

  if (loading) {
    return loadingNode ? <>{loadingNode}</> : null;
  }

  if (!hasRole(role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Component: Show content if user has ANY of the specified roles
 * 
 * Usage:
 *   <IfHasAnyRole roles={['PDG', 'COMPTA']}>
 *     <ReportDashboard />
 *   </IfHasAnyRole>
 */
export function IfHasAnyRole({
  children,
  roles,
  fallback,
  loading: loadingNode
}: IfHasAnyRoleProps): React.ReactElement | null {
  const { hasAnyRole, loading } = usePermission();

  if (loading) {
    return loadingNode ? <>{loadingNode}</> : null;
  }

  if (!hasAnyRole(roles)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Higher-Order Component: Protect a component with permission check
 * 
 * Usage:
 *   const ProtectedExport = withPermission(ExportButton, 'contracts.export');
 *   <ProtectedExport />
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P) {
    return (
      <IfHasPermission permission={permission} fallback={fallback}>
        <Component {...props} />
      </IfHasPermission>
    );
  };
}

/**
 * Higher-Order Component: Protect a component with role check
 * 
 * Usage:
 *   const AdminOnly = withRole(AdminPanel, 'PDG');
 *   <AdminOnly />
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: string,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P) {
    return (
      <IfHasRole role={role} fallback={fallback}>
        <Component {...props} />
      </IfHasRole>
    );
  };
}

/**
 * Utility: Disable button if user lacks permission
 * 
 * Usage:
 *   <button disabled={!canExport}>Export</button>
 */
export interface DisabledIfNoPermissionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  permission: string;
  title?: string;
}

export function DisabledIfNoPermission({
  children,
  permission,
  title,
  disabled,
  className,
  ...props
}: DisabledIfNoPermissionProps): React.ReactElement {
  const { hasPermission } = usePermission();
  const hasAccess = hasPermission(permission);

  return (
    <button
      disabled={disabled || !hasAccess}
      title={!hasAccess ? `Permission required: ${permission}` : title}
      className={`${className || ''} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default IfHasPermission;
