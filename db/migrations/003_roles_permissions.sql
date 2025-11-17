-- Migration: Create roles and permissions system
-- Date: 2025-10-25
-- Description: Implement role-based access control (RBAC) with granular permissions

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'INVOICE', 'PAYMENT', 'USER', 'REPORT'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT REFERENCES users(id),
  PRIMARY KEY(user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('SUPER_ADMIN', 'Full system access with all permissions'),
  ('OWNER', 'Property owner - can manage properties, agencies, and view analytics'),
  ('AGENCY', 'Agency admin - can manage tenants and invoices for assigned properties'),
  ('TENANT', 'Tenant - can view own invoices and make payments'),
  ('ACCOUNTANT', 'Finance team - can view reports and manage payments'),
  ('SUPPORT', 'Customer support - can view tickets and assist users')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions for Invoice Management
INSERT INTO permissions (code, description, category) VALUES
  ('INVOICE_CREATE', 'Create new invoices', 'INVOICE'),
  ('INVOICE_VIEW', 'View invoices', 'INVOICE'),
  ('INVOICE_EDIT', 'Edit invoices', 'INVOICE'),
  ('INVOICE_DELETE', 'Delete invoices', 'INVOICE'),
  ('INVOICE_EXPORT', 'Export invoices to CSV/PDF', 'INVOICE'),
  ('INVOICE_SEND', 'Send invoices to tenants', 'INVOICE'),
  ('INVOICE_BULK_SEND', 'Bulk send invoices', 'INVOICE')
ON CONFLICT (code) DO NOTHING;

-- Insert permissions for Payment Management
INSERT INTO permissions (code, description, category) VALUES
  ('PAYMENT_VIEW', 'View payments', 'PAYMENT'),
  ('PAYMENT_PROCESS', 'Process payments', 'PAYMENT'),
  ('PAYMENT_REFUND', 'Issue refunds', 'PAYMENT'),
  ('PAYMENT_EXPORT', 'Export payment reports', 'PAYMENT'),
  ('PAYMENT_RECONCILE', 'Reconcile payments', 'PAYMENT'),
  ('PAYMENT_CONFIG', 'Configure payment methods', 'PAYMENT')
ON CONFLICT (code) DO NOTHING;

-- Insert permissions for User Management
INSERT INTO permissions (code, description, category) VALUES
  ('USER_CREATE', 'Create new users', 'USER'),
  ('USER_VIEW', 'View user details', 'USER'),
  ('USER_EDIT', 'Edit user information', 'USER'),
  ('USER_DELETE', 'Delete users', 'USER'),
  ('USER_ASSIGN_ROLE', 'Assign roles to users', 'USER'),
  ('USER_RESET_PASSWORD', 'Reset user passwords', 'USER'),
  ('USER_DISABLE_2FA', 'Disable 2FA for users', 'USER')
ON CONFLICT (code) DO NOTHING;

-- Insert permissions for Reporting
INSERT INTO permissions (code, description, category) VALUES
  ('REPORT_VIEW', 'View reports', 'REPORT'),
  ('REPORT_EXPORT', 'Export reports', 'REPORT'),
  ('REPORT_ANALYTICS', 'View analytics dashboard', 'REPORT'),
  ('REPORT_CASHFLOW', 'View cashflow reports', 'REPORT'),
  ('REPORT_ARREARS', 'View arrears reports', 'REPORT')
ON CONFLICT (code) DO NOTHING;

-- Insert permissions for Contract Management
INSERT INTO permissions (code, description, category) VALUES
  ('CONTRACT_CREATE', 'Create contracts', 'CONTRACT'),
  ('CONTRACT_VIEW', 'View contracts', 'CONTRACT'),
  ('CONTRACT_EDIT', 'Edit contracts', 'CONTRACT'),
  ('CONTRACT_DELETE', 'Delete contracts', 'CONTRACT'),
  ('CONTRACT_SIGN', 'Sign contracts', 'CONTRACT'),
  ('CONTRACT_RENEW', 'Renew contracts', 'CONTRACT')
ON CONFLICT (code) DO NOTHING;

-- Insert permissions for System Administration
INSERT INTO permissions (code, description, category) VALUES
  ('SYSTEM_CONFIG', 'Configure system settings', 'SYSTEM'),
  ('SYSTEM_AUDIT', 'View audit logs', 'SYSTEM'),
  ('SYSTEM_BACKUP', 'Manage backups', 'SYSTEM'),
  ('SYSTEM_METRICS', 'View system metrics', 'SYSTEM'),
  ('SYSTEM_USERS', 'Manage system users', 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- Assign permissions to SUPER_ADMIN (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'OWNER' AND p.code IN (
  'INVOICE_VIEW', 'INVOICE_EXPORT',
  'PAYMENT_VIEW', 'PAYMENT_EXPORT',
  'USER_VIEW', 'USER_ASSIGN_ROLE',
  'REPORT_VIEW', 'REPORT_EXPORT', 'REPORT_ANALYTICS', 'REPORT_CASHFLOW', 'REPORT_ARREARS',
  'CONTRACT_VIEW',
  'SYSTEM_AUDIT'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to AGENCY
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'AGENCY' AND p.code IN (
  'INVOICE_CREATE', 'INVOICE_VIEW', 'INVOICE_EDIT', 'INVOICE_EXPORT', 'INVOICE_SEND', 'INVOICE_BULK_SEND',
  'PAYMENT_VIEW', 'PAYMENT_EXPORT',
  'USER_VIEW',
  'REPORT_VIEW', 'REPORT_EXPORT',
  'CONTRACT_CREATE', 'CONTRACT_VIEW', 'CONTRACT_EDIT', 'CONTRACT_SIGN'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to TENANT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'TENANT' AND p.code IN (
  'INVOICE_VIEW',
  'PAYMENT_VIEW', 'PAYMENT_PROCESS',
  'CONTRACT_VIEW',
  'REPORT_VIEW'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to ACCOUNTANT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ACCOUNTANT' AND p.code IN (
  'INVOICE_VIEW', 'INVOICE_EXPORT',
  'PAYMENT_VIEW', 'PAYMENT_EXPORT', 'PAYMENT_RECONCILE',
  'USER_VIEW',
  'REPORT_VIEW', 'REPORT_EXPORT', 'REPORT_ANALYTICS', 'REPORT_CASHFLOW', 'REPORT_ARREARS',
  'SYSTEM_AUDIT'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to SUPPORT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPPORT' AND p.code IN (
  'INVOICE_VIEW',
  'PAYMENT_VIEW',
  'USER_VIEW',
  'REPORT_VIEW',
  'CONTRACT_VIEW',
  'SYSTEM_AUDIT'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_roles_name ON roles(name);

-- Create view for user permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  u.id as user_id,
  u.email,
  r.id as role_id,
  r.name as role_name,
  p.id as permission_id,
  p.code as permission_code,
  p.category as permission_category
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id;

-- Add comment describing the RBAC system
COMMENT ON TABLE roles IS 'Stores user roles in the system';
COMMENT ON TABLE permissions IS 'Stores granular permissions that can be assigned to roles';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE user_roles IS 'Junction table linking users to roles';
COMMENT ON VIEW user_permissions_view IS 'View showing all user permissions for authorization checks';
