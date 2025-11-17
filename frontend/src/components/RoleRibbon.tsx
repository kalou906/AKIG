// ============================================================================
// Role Ribbon Component (RoleRibbon.tsx)
// File: src/components/RoleRibbon.tsx
// Purpose: Display role badge with color coding for UI
// ============================================================================

import React from 'react';

export type RoleType = 'PDG' | 'COMPTA' | 'AGENT' | 'LOCATAIRE' | 'PROPRIETAIRE';

export interface RoleRibbonProps {
  role: RoleType;
  className?: string;
}

/**
 * RoleRibbon Component
 * Displays a styled badge for user roles
 *
 * @example
 * <RoleRibbon role="COMPTA" />
 * // Output: <span className="px-3 py-1 rounded-xl text-sm bg-akig-gold text-white">COMPTA</span>
 *
 * @example
 * <RoleRibbon role="LOCATAIRE" />
 * // Output: <span className="px-3 py-1 rounded-xl text-sm bg-gray-200 text-akig-text">LOCATAIRE</span>
 */
export const RoleRibbon: React.FC<RoleRibbonProps> = ({ role, className = '' }) => {
  const colorMap: Record<RoleType, string> = {
    PDG: 'bg-blue-600 text-white',
    COMPTA: 'bg-amber-500 text-white',
    AGENT: 'bg-green-600 text-white',
    LOCATAIRE: 'bg-gray-200 text-gray-800',
    PROPRIETAIRE: 'bg-blue-100 text-blue-800',
  };

  const roleLabel: Record<RoleType, string> = {
    PDG: 'PDG (CEO)',
    COMPTA: 'Comptable',
    AGENT: 'Agent',
    LOCATAIRE: 'Locataire',
    PROPRIETAIRE: 'Propriétaire',
  };

  const bgColor = colorMap[role];
  const label = roleLabel[role];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${className}`}
      title={`Role: ${label}`}
    >
      {role}
    </span>
  );
};

/**
 * RoleList Component
 * Display multiple role ribbons in a row
 *
 * @example
 * <RoleList roles={['PDG', 'COMPTA']} />
 */
export interface RoleListProps {
  roles: RoleType[];
  className?: string;
}

export const RoleList: React.FC<RoleListProps> = ({ roles, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {roles.map((role) => (
        <RoleRibbon key={role} role={role} />
      ))}
    </div>
  );
};

export default RoleRibbon;
