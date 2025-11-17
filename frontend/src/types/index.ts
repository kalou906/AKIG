/**
 * Types TypeScript globaux
 * frontend/src/types/index.ts
 */

// ============================================================================
// Types de base
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// Types métier
// ============================================================================

export interface User {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  roles?: Role[];
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Owner {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Site {
  id: number;
  name: string;
  owner_id: number;
  address?: string;
  city?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Tenant {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  current_site_id?: number;
  status?: 'active' | 'inactive' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id: number;
  title: string;
  tenant_id?: number;
  site_id?: number;
  owner_id?: number;
  start_date?: string;
  end_date?: string;
  amount?: number;
  status?: 'draft' | 'active' | 'expired' | 'terminated';
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  contract_id?: number;
  tenant_id?: number;
  amount: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date?: string;
  due_date?: string;
  reference?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

// ============================================================================
// Types de requête/réponse
// ============================================================================

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface CreateContractRequest {
  title: string;
  tenant_id?: number;
  site_id?: number;
  start_date?: string;
  end_date?: string;
  amount?: number;
}

export interface CreatePaymentRequest {
  contract_id?: number;
  tenant_id?: number;
  amount: number;
  reference?: string;
}

export interface UpdateContractRequest {
  title?: string;
  start_date?: string;
  end_date?: string;
  amount?: number;
  status?: string;
}

// ============================================================================
// Types pour les formulaires
// ============================================================================

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  label: string;
  required?: boolean;
  placeholder?: string;
  value?: any;
  error?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isSubmitting: boolean;
}

// ============================================================================
// Types pour l'UI
// ============================================================================

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

// ============================================================================
// Types pour les statistiques
// ============================================================================

export interface PaymentStats {
  totalArrearsAmount: number;
  totalReceivedAmount: number;
  collectionRate: number;
  pendingPayments: number;
  overduePayments: number;
}

export interface DashboardStats {
  totalTenants: number;
  activeContracts: number;
  pendingPayments: number;
  monthlyRevenue: number;
  collectionRate: number;
}

// ============================================================================
// Types d'énumération
// ============================================================================

export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
}

export enum ContractStatus {
  Draft = 'draft',
  Active = 'active',
  Expired = 'expired',
  Terminated = 'terminated',
}

export enum TenantStatus {
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived',
}
