import React from 'react';
// import { Alerts } from './Alerts';
import { ScheduledReminders } from './ScheduledReminders';
import { AiSearch } from './AiSearch';

/**
 * Props pour le composant NotificationCenter
 */
export interface NotificationCenterProps {
  tenants: any[];
  contracts?: any[];
  onFilters?: (filters: any) => void;
  onRemind?: (contractId: string) => void;
  showAiSearch?: boolean;
  showAlerts?: boolean;
  showReminders?: boolean;
  year?: number;
}

/**
 * Composant NotificationCenter
 * Agrège tous les systèmes d'alertes et notifications
 *
 * Affiche :
 * - Alertes impayés (critiques, importants)
 * - Rappels planifiés
 * - Recherche IA
 *
 * Exemple d'utilisation :
 * <NotificationCenter
 *   tenants={tenantsList}
 *   contracts={contractsList}
 *   onFilters={(f) => applyFilters(f)}
 *   year={2025}
 * />
 */
export function NotificationCenter({
  tenants,
  contracts = [],
  onFilters,
  onRemind,
  showAiSearch = true,
  showAlerts = true,
  showReminders = true,
  year,
}: NotificationCenterProps): React.ReactElement {
  return (
    <div className="space-y-3">
      {/* Alertes - Commented out */}
      {/* {showAlerts && tenants.length > 0 && (
        <div className="flex-1">
          <Alerts tenants={tenants} year={year} />
        </div>
      )} */}

      {/* Rappels planifiés */}
      {showReminders && contracts.length > 0 && (
        <div className="flex-1">
          <ScheduledReminders contracts={contracts} onRemind={onRemind} />
        </div>
      )}

      {/* Recherche IA */}
      {showAiSearch && onFilters && (
        <div className="flex-1">
          <AiSearch onFilters={onFilters} />
        </div>
      )}
    </div>
  );
}

/**
 * Hook pour gérer les notifications
 */
export function useNotifications(tenants: any[], contracts: any[] = []) {
  const criticalAlerts = React.useMemo(() => {
    return tenants.filter((t) => Number(t.arrears_months || 0) > 3);
  }, [tenants]);

  const warningAlerts = React.useMemo(() => {
    return tenants.filter((t) => Number(t.arrears_months || 0) > 1 && Number(t.arrears_months || 0) <= 3);
  }, [tenants]);

  const upcomingReminders = React.useMemo(() => {
    return contracts.filter((c) =>
      String(c.frequency_note || '').toLowerCase().includes('le')
    );
  }, [contracts]);

  const hasUrgentNotifications = criticalAlerts.length > 0 || warningAlerts.length > 0;
  const hasReminders = upcomingReminders.length > 0;

  return {
    criticalAlerts,
    warningAlerts,
    upcomingReminders,
    hasUrgentNotifications,
    hasReminders,
    totalNotifications:
      criticalAlerts.length + warningAlerts.length + upcomingReminders.length,
  };
}

/**
 * Badge notificateur
 */
export interface NotificationBadgeProps {
  count: number;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClick?: () => void;
}

export function NotificationBadge({
  count,
  type = 'error',
  onClick,
}: NotificationBadgeProps): React.ReactElement | null {
  if (count === 0) return null;

  const colors: Record<string, string> = {
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
  };

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${colors[type]} hover:opacity-80 transition`}
      title={`${count} notification(s)`}
    >
      {count > 99 ? '99+' : count}
    </button>
  );
}

/**
 * Panel de notifications (barre en haut)
 */
export interface NotificationPanelProps {
  notifications: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    action?: { label: string; onClick: () => void };
  }>;
  onClose?: (id: string) => void;
}

export function NotificationPanel({
  notifications,
  onClose,
}: NotificationPanelProps): React.ReactElement | null {
  if (notifications.length === 0) return null;

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-3 rounded border flex items-start justify-between gap-3 ${getBgColor(
            notif.type
          )}`}
        >
          <div className="flex-1">
            <div className="text-sm font-medium">{notif.message}</div>
          </div>
          <div className="flex items-center gap-2">
            {notif.action && (
              <button
                onClick={notif.action.onClick}
                className="text-xs font-semibold px-2 py-1 bg-white rounded hover:opacity-80"
              >
                {notif.action.label}
              </button>
            )}
            <button
              onClick={() => onClose?.(notif.id)}
              className="text-xs hover:opacity-60"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
