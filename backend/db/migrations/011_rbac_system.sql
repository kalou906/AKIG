-- =============================================================================
-- Migration: AKIG RBAC (Role-Based Access Control) System
-- Date: 2025-10-26
-- Description: Create roles, permissions, and audit tables for AKIG platform
-- =============================================================================

-- ============================================================================
-- 1. ROLES TABLE - Define all application roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Define application roles: PDG, COMPTA, AGENT, LOCATAIRE, PROPRIETAIRE';
COMMENT ON COLUMN roles.code IS 'Role identifier: PDG, COMPTA, AGENT, LOCATAIRE, PROPRIETAIRE';
COMMENT ON COLUMN roles.name IS 'Display name of the role';

-- ============================================================================
-- 2. USERS TABLE - Enhanced with RBAC support
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  hashed_password TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(active);

COMMENT ON TABLE users IS 'Application users with authentication credentials';
COMMENT ON COLUMN users.active IS 'User account status (active/inactive)';

-- ============================================================================
-- 3. USER_ROLES TABLE - Link users to roles (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

COMMENT ON TABLE user_roles IS 'Associate users with roles (many-to-many relationship)';
COMMENT ON COLUMN user_roles.assigned_by IS 'User who assigned this role';

-- ============================================================================
-- 4. PERMISSIONS TABLE - Define granular permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  resource TEXT,                    -- ex: 'contracts', 'payments', 'tenants', 'reports'
  action TEXT,                      -- ex: 'view', 'create', 'edit', 'delete', 'export'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);

COMMENT ON TABLE permissions IS 'Define granular permissions for access control';
COMMENT ON COLUMN permissions.code IS 'Permission identifier: resource.action (e.g., contracts.view)';
COMMENT ON COLUMN permissions.resource IS 'Resource being controlled (contracts, payments, etc.)';
COMMENT ON COLUMN permissions.action IS 'Action type (view, create, edit, delete, export)';

-- ============================================================================
-- 5. ROLE_PERMISSIONS TABLE - Assign permissions to roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Map permissions to roles (many-to-many relationship)';

-- ============================================================================
-- 6. AUDIT_LOG TABLE - Track all user actions for compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,            -- ex: 'PAYMENT_IMPORT', 'CONTRACT_GENERATE', 'REMINDER_SEND'
  action_type TEXT,                -- ex: 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT'
  target TEXT,                     -- ex: 'contract:123', 'tenant:456', 'file:Export_Paiements_20251026.csv'
  target_id INT,                   -- ID of affected resource
  status TEXT DEFAULT 'SUCCESS',   -- SUCCESS, FAILED, PARTIAL
  description TEXT,
  meta JSONB,                      -- Additional metadata (before/after values, file paths, etc.)
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX idx_audit_log_target ON audit_log(target);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

COMMENT ON TABLE audit_log IS 'Immutable audit log for compliance and security tracking';
COMMENT ON COLUMN audit_log.action IS 'High-level action performed (PAYMENT_IMPORT, CONTRACT_GENERATE)';
COMMENT ON COLUMN audit_log.action_type IS 'Type of action (CREATE, UPDATE, DELETE, EXPORT, IMPORT)';
COMMENT ON COLUMN audit_log.target IS 'Resource identifier in format entity:id';
COMMENT ON COLUMN audit_log.meta IS 'JSON metadata: changes, file paths, quantities, etc.';

-- ============================================================================
-- 7. DEFAULT ROLES SETUP
-- ============================================================================
INSERT INTO roles (code, name, description) VALUES
  ('PDG', 'Président Directeur Général', 'Complete access to all features'),
  ('COMPTA', 'Comptable', 'Accounting and financial operations'),
  ('AGENT', 'Agent Collecteur', 'Field operations and data entry'),
  ('LOCATAIRE', 'Locataire', 'Tenant portal access'),
  ('PROPRIETAIRE', 'Propriétaire', 'Property owner portal access')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 8. DEFAULT PERMISSIONS SETUP
-- ============================================================================
INSERT INTO permissions (code, name, description, resource, action) VALUES
  -- Contracts Permissions
  ('contracts.view', 'View Contracts', 'View contract list and details', 'contracts', 'view'),
  ('contracts.create', 'Create Contract', 'Create new contracts', 'contracts', 'create'),
  ('contracts.edit', 'Edit Contract', 'Edit existing contracts', 'contracts', 'edit'),
  ('contracts.delete', 'Delete Contract', 'Delete contracts', 'contracts', 'delete'),
  ('contracts.generate', 'Generate Contract', 'Generate contract documents', 'contracts', 'create'),
  ('contracts.export', 'Export Contracts', 'Export contracts to file', 'contracts', 'export'),
  ('contracts.import', 'Import Contracts', 'Import contracts from file', 'contracts', 'import'),
  
  -- Payments Permissions
  ('payments.view', 'View Payments', 'View payment records', 'payments', 'view'),
  ('payments.create', 'Record Payment', 'Record new payments', 'payments', 'create'),
  ('payments.edit', 'Edit Payment', 'Edit payment records', 'payments', 'edit'),
  ('payments.delete', 'Delete Payment', 'Delete payment records', 'payments', 'delete'),
  ('payments.import', 'Import Payments', 'Import payment data', 'payments', 'import'),
  ('payments.export', 'Export Payments', 'Export payment records', 'payments', 'export'),
  ('payments.reconcile', 'Reconcile Payments', 'Reconcile payments with bank', 'payments', 'edit'),
  
  -- Tenants Permissions
  ('tenants.view', 'View Tenants', 'View tenant list and details', 'tenants', 'view'),
  ('tenants.create', 'Create Tenant', 'Add new tenants', 'tenants', 'create'),
  ('tenants.edit', 'Edit Tenant', 'Edit tenant information', 'tenants', 'edit'),
  ('tenants.delete', 'Delete Tenant', 'Delete tenants', 'tenants', 'delete'),
  ('tenants.export', 'Export Tenants', 'Export tenant data', 'tenants', 'export'),
  
  -- Reports Permissions
  ('reports.view', 'View Reports', 'Access all reports', 'reports', 'view'),
  ('reports.generate', 'Generate Reports', 'Generate custom reports', 'reports', 'create'),
  ('reports.export', 'Export Reports', 'Export reports to file', 'reports', 'export'),
  ('reports.payment_status', 'Payment Status Reports', 'View payment status reports', 'reports', 'view'),
  ('reports.collection', 'Collection Reports', 'View collection reports', 'reports', 'view'),
  
  -- Reminders & Communications
  ('reminders.view', 'View Reminders', 'View payment reminders', 'reminders', 'view'),
  ('reminders.create', 'Send Reminder', 'Send payment reminders', 'reminders', 'create'),
  ('reminders.schedule', 'Schedule Reminders', 'Schedule automatic reminders', 'reminders', 'create'),
  
  -- Settings & Administration
  ('settings.view', 'View Settings', 'Access application settings', 'settings', 'view'),
  ('settings.edit', 'Edit Settings', 'Modify application settings', 'settings', 'edit'),
  ('users.manage', 'Manage Users', 'Manage user accounts and roles', 'users', 'edit'),
  ('audit.view', 'View Audit Log', 'Access audit trail', 'audit', 'view'),
  
  -- Dashboard & Analytics
  ('dashboard.view', 'View Dashboard', 'Access main dashboard', 'dashboard', 'view'),
  ('analytics.view', 'View Analytics', 'Access analytics and metrics', 'analytics', 'view')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 9. ROLE-PERMISSION MAPPINGS
-- ============================================================================
-- PDG: Full access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'PDG'
ON CONFLICT DO NOTHING;

-- COMPTA: Financial and accounting access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'COMPTA' AND p.code IN (
  'payments.view', 'payments.create', 'payments.edit', 'payments.import', 'payments.export', 'payments.reconcile',
  'contracts.view', 'contracts.edit', 'contracts.generate',
  'reports.view', 'reports.generate', 'reports.export', 'reports.payment_status',
  'tenants.view', 'tenants.export',
  'dashboard.view', 'analytics.view',
  'settings.view'
)
ON CONFLICT DO NOTHING;

-- AGENT: Field operations and data entry
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'AGENT' AND p.code IN (
  'payments.view', 'payments.create',
  'contracts.view', 'contracts.export',
  'tenants.view',
  'reminders.view', 'reminders.create',
  'reports.view',
  'dashboard.view'
)
ON CONFLICT DO NOTHING;

-- LOCATAIRE: Tenant portal (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'LOCATAIRE' AND p.code IN (
  'contracts.view',
  'payments.view',
  'reports.view',
  'dashboard.view'
)
ON CONFLICT DO NOTHING;

-- PROPRIETAIRE: Property owner access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'PROPRIETAIRE' AND p.code IN (
  'contracts.view', 'contracts.edit',
  'payments.view',
  'reports.view', 'reports.payment_status', 'reports.collection',
  'tenants.view',
  'dashboard.view', 'analytics.view'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. AUDIT LOG TRIGGERS (Optional but recommended)
-- ============================================================================
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for roles table
CREATE TRIGGER roles_update_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER users_update_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. HELPER VIEWS
-- ============================================================================
-- View: User permissions (flattened)
CREATE OR REPLACE VIEW user_permissions AS
SELECT DISTINCT
  u.id as user_id,
  u.full_name,
  u.email,
  r.id as role_id,
  r.code as role_code,
  r.name as role_name,
  p.id as permission_id,
  p.code as permission_code,
  p.name as permission_name,
  p.resource,
  p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.active = TRUE;

-- View: Role summary
CREATE OR REPLACE VIEW role_summary AS
SELECT
  r.id,
  r.code,
  r.name,
  COUNT(DISTINCT ur.user_id) as user_count,
  COUNT(DISTINCT rp.permission_id) as permission_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code, r.name;

-- ============================================================================
-- 12. MIGRATION STATUS
-- ============================================================================
-- Log migration status (optional)
INSERT INTO audit_log (user_id, action, action_type, target, status, description, meta)
VALUES (
  NULL,
  'SCHEMA_MIGRATION',
  'CREATE',
  'schema:rbac',
  'SUCCESS',
  'RBAC system tables created',
  jsonb_build_object(
    'tables', ARRAY['roles', 'users', 'user_roles', 'permissions', 'role_permissions', 'audit_log'],
    'timestamp', NOW()
  )
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
