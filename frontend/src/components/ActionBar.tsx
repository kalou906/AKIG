// ============================================================================
// Action Bar Component (ActionBar.tsx)
// File: src/components/ActionBar.tsx
// Purpose: Display permission-based action buttons
// ============================================================================

import React from 'react';
import { Protected } from './Protected';
import { User, Permission } from '../lib/rbac';

export interface ActionBarProps {
  user: User | null | undefined;
  tenant?: any;
  onGenerateContract?: () => void;
  onSendReminder?: () => void;
  onExport?: () => void;
  onImportPayments?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ActionBar Component
 * Display action buttons based on user permissions
 * Each button is wrapped in a Protected component
 *
 * @example
 * <ActionBar
 *   user={user}
 *   tenant={tenant}
 *   onGenerateContract={() => handleGenerate()}
 *   onSendReminder={() => handleReminder()}
 * />
 */
export const ActionBar: React.FC<ActionBarProps> = ({
  user,
  tenant,
  onGenerateContract,
  onSendReminder,
  onExport,
  onImportPayments,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {/* Generate Contract Button */}
      <Protected user={user} perm="contracts.generate">
        <button
          onClick={onGenerateContract}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Generate a new contract"
        >
          📄 Generate Contract
        </button>
      </Protected>

      {/* Send Reminder Button */}
      <Protected user={user} perm="reminders.send">
        <button
          onClick={onSendReminder}
          disabled={disabled}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send payment reminder"
        >
          📤 Send Reminder
        </button>
      </Protected>

      {/* View/Export Reports Button */}
      <Protected user={user} perm="reports.view">
        <button
          onClick={onExport}
          disabled={disabled}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Export reports and data"
        >
          📊 Export
        </button>
      </Protected>

      {/* Import Payments Button */}
      <Protected user={user} perm="payments.import">
        <button
          onClick={onImportPayments}
          disabled={disabled}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Import payment records"
        >
          💳 Import Payments
        </button>
      </Protected>

      {/* Fallback message if no permissions */}
      {!user?.permissions?.some((p: Permission) =>
        ['contracts.generate', 'reminders.send', 'reports.view', 'payments.import'].includes(p)
      ) && (
        <div className="text-sm text-gray-500 italic">
          No actions available
        </div>
      )}
    </div>
  );
};

/**
 * ActionButton Component
 * Single action button with permission check
 *
 * @example
 * <ActionButton
 *   user={user}
 *   perm="contracts.generate"
 *   icon="📄"
 *   label="Generate"
 *   onClick={handleClick}
 * />
 */
export interface ActionButtonProps {
  user: User | null | undefined;
  perm: Permission;
  icon?: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  user,
  perm,
  icon = '▶',
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  className = ''
}) => {
  const variantClasses: Record<string, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700'
  };

  return (
    <Protected user={user} perm={perm}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variantClasses[variant]} ${className}`}
      >
        {icon} {label}
      </button>
    </Protected>
  );
};

export default ActionBar;
