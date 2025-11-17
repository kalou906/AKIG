import React, { useState, useCallback, useContext, createContext } from 'react';

/**
 * Types pour le système de notifications
 */
export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number; // en ms, défaut 4000
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    message: string,
    type?: NotificationType,
    options?: { action?: Notification['action']; duration?: number }
  ) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

/**
 * Contexte de notifications
 */
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

/**
 * Provider pour les notifications
 */
export interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({
  children,
}: NotificationProviderProps): React.ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (
      message: string,
      type: NotificationType = 'info',
      options?: { action?: Notification['action']; duration?: number }
    ): string => {
      const id = `notif-${Date.now()}-${Math.random()}`;
      const duration = options?.duration ?? 4000;

      const notification: Notification = {
        id,
        type,
        message,
        action: options?.action,
        autoClose: true,
        duration,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-close si activé
      if (duration > 0) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook pour utiliser les notifications
 */
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification doit être utilisé dans un <NotificationProvider>'
    );
  }
  return context;
}

/**
 * Hook pour afficher facilement les notifications
 */
export function useNotificationShortcuts() {
  const { addNotification } = useNotification();

  return {
    success: (message: string, duration?: number) =>
      addNotification(message, 'success', { duration }),
    error: (message: string, duration?: number) =>
      addNotification(message, 'error', { duration }),
    warning: (message: string, duration?: number) =>
      addNotification(message, 'warning', { duration }),
    info: (message: string, duration?: number) =>
      addNotification(message, 'info', { duration }),
  };
}

/**
 * Composant de rendu des notifications
 */
export interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export function NotificationToast({
  notification,
  onClose,
}: NotificationToastProps): React.ReactElement {
  const getColors = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded shadow-lg max-w-xs ${getColors(
        notification.type
      )}`}
    >
      <span className="text-xl flex-shrink-0">{getIcon(notification.type)}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{notification.message}</p>
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="text-xs mt-1 underline hover:opacity-80"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 hover:opacity-75"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Conteneur pour afficher les toasts
 */
export interface NotificationContainerProps {
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
}

export function NotificationContainer({
  position = 'top-right',
}: NotificationContainerProps): React.ReactElement {
  const { notifications, removeNotification } = useNotification();

  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2 pointer-events-none`}
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast
            notification={notification}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  );
}
