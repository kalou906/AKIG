/**
 * usePermission Hook
 * Frontend hook for permission-based access control
 * 
 * Usage:
 *   const { hasPermission, permissions, loading } = usePermission();
 *   
 *   if (hasPermission('contracts.export')) {
 *     // Show export button
 *   }
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface UsePermissionReturn {
  permissions: string[];
  roles: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
  hasAnyRole: (roleCodes: string[]) => boolean;
  isAuthorized: boolean;
}

export function usePermission(): UsePermissionReturn {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user permissions from backend
  useEffect(() => {
    if (!user || !isAuthenticated) {
      setPermissions([]);
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setPermissions([]);
          setRoles([]);
          setError('No auth token found');
          return;
        }

        const response = await fetch('/api/auth/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const data = await response.json();
        setPermissions(data.permissions || []);
        setRoles(data.roles || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPermissions([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, isAuthenticated]);

  // Check if user has specific permission
  const hasPermission = useCallback((permissionCode: string): boolean => {
    return permissions.includes(permissionCode);
  }, [permissions]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => permissions.includes(code));
  }, [permissions]);

  // Check if user has all specified permissions
  const hasAllPermissions = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => permissions.includes(code));
  }, [permissions]);

  // Check if user has specific role
  const hasRole = useCallback((roleCode: string): boolean => {
    return roles.includes(roleCode);
  }, [roles]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roleCodes: string[]): boolean => {
    return roleCodes.some(code => roles.includes(code));
  }, [roles]);

  return {
    permissions,
    roles,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAuthorized: permissions.length > 0 || roles.length > 0
  };
}

export default usePermission;
