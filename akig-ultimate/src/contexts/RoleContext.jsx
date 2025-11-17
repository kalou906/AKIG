import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('pdg'); // 'pdg', 'comptable', 'agent'
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'Admin User',
    email: 'admin@akig.com',
    role: 'pdg',
    department: 'Direction'
  });

  const rolePermissions = {
    pdg: {
      canViewFinances: true,
      canViewOperations: true,
      canViewReports: true,
      canManageUsers: true,
      canConfigureSystem: true,
      canViewAllData: true,
      canExportData: true,
      canApproveTransactions: true,
      viewLevel: 'full' // Accès complet
    },
    comptable: {
      canViewFinances: true,
      canViewOperations: false,
      canViewReports: true,
      canManageUsers: false,
      canConfigureSystem: false,
      canViewAllData: false,
      canExportData: true,
      canApproveTransactions: false,
      viewLevel: 'finance' // Accès finances seulement
    },
    agent: {
      canViewFinances: false,
      canViewOperations: true,
      canViewReports: false,
      canManageUsers: false,
      canConfigureSystem: false,
      canViewAllData: false,
      canExportData: false,
      canApproveTransactions: false,
      viewLevel: 'operations' // Accès opérations seulement
    }
  };

  const hasPermission = (permission) => {
    return rolePermissions[userRole]?.[permission] || false;
  };

  const canAccess = (requiredRole) => {
    const roleHierarchy = { pdg: 3, comptable: 2, agent: 1 };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const switchRole = (newRole) => {
    if (rolePermissions[newRole]) {
      setUserRole(newRole);
      setCurrentUser(prev => ({
        ...prev,
        role: newRole,
        name: `${newRole.charAt(0).toUpperCase() + newRole.slice(1)} User`,
        department: newRole === 'pdg' ? 'Direction' : newRole === 'comptable' ? 'Finance' : 'Opérations'
      }));
    }
  };

  return (
    <RoleContext.Provider value={{
      userRole,
      currentUser,
      hasPermission,
      canAccess,
      switchRole,
      rolePermissions,
      allRoles: ['pdg', 'comptable', 'agent']
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};
