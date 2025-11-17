/**
 * Export centralisé de tous les composants et utilitaires
 * Ce fichier facilite les imports dans le reste de l'application
 */

// === Pages ===
export { default as AkigPro } from './pages/AkigPro';

// === Componentsents UI ===
// export { Modal, ConfirmModal, useModal } from './components/Modal';
// export { FormBuilder, Validators, useForm } from './components/FormBuilder';
export { NotificationCenter, useNotifications, NotificationBadge, NotificationPanel } from './components/NotificationCenter';
export { BulkActions, useBulkSelection, BulkSelectCheckbox, SelectableTableRow, ContextMenu, useContextMenu } from './components/BulkActions';
export { ExportManager, QuickExport, ExportPanel, exportToCSV, exportToJSON, useExport } from './utils/export';
export { InputPhone } from './components/InputPhone';

// === Composants Autorisation ===
export {
  IfHasPermission,
  IfHasAnyPermission,
  IfHasAllPermissions,
  IfHasRole,
  IfHasAnyRole,
  withPermission,
  withRole,
  DisabledIfNoPermission,
  type IfHasPermissionProps,
  type IfHasAnyPermissionProps,
  type IfHasAllPermissionsProps,
  type IfHasRoleProps,
  type IfHasAnyRoleProps,
  type DisabledIfNoPermissionProps,
} from './components/ProtectedComponent';

// === Hooks Notifications ===
export {
  NotificationProvider,
  useNotification,
  useNotificationShortcuts,
  NotificationToast,
  NotificationContainer,
  type Notification,
  type NotificationType,
} from './hooks/useNotification';

// === Hooks Cache & Storage ===
export {
  CacheManager,
  cache,
  useCache,
  useLocalStorage,
  useUserPreferences,
  useSessionStorage,
  useSyncStorage,
  SyncStatus,
  CacheProvider,
  useCacheContext,
  type UserPreferences,
} from './hooks/useCache';

// === Hooks Authentification ===
export {
  AuthProvider,
  useAuth,
  ProtectedRoute,
  UserAvatar,
  UserMenu,
  useSessionTimeout,
  useFetch,
  type User,
} from './hooks/useAuth';

// === Hooks Permissions ===
export {
  usePermission,
  type UsePermissionReturn,
} from './hooks/usePermission';

// === Configuration & Thème ===
export { AppProviders, AppLayout, AppConfig, AppTheme } from './config/AppConfig';
export {
  akigTheme,
  statusColors,
  sizes,
  getResponsive,
  cn,
  getColor,
} from './theme/akigTheme';

// === Types ===
// export type { FormField, FormConfig, ValidationRule } from './components/FormBuilder';
export type { BulkActionProps } from './components/BulkActions';
// export type { ModalProps, ConfirmModalProps } from './components/Modal';
export type { ExportOptions, ExportManagerProps } from './utils/export';
export type { InputPhoneProps } from './components/InputPhone';

// === Logger ===
export { useLogger, logger } from './utils/logger';
