-- ============================================================================
-- RBAC Seeding - Roles and Permissions
-- File: db/seeds/2025_10_rbac_seed.sql
-- Date: 2025-10-26
-- Purpose: Initialize default roles and permissions with role-permission mappings
-- ============================================================================

-- ============================================================================
-- 1. INSERT ROLES
-- ============================================================================
INSERT INTO roles(code, name) VALUES
('PDG','PDG'),
('COMPTA','Comptabilité'),
('AGENT','Agent'),
('LOCATAIRE','Locataire'),
('PROPRIETAIRE','Propriétaire')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. INSERT PERMISSIONS
-- ============================================================================
INSERT INTO permissions(code, description) VALUES
('tenants.view','Voir les locataires'),
('contracts.view','Voir les contrats'),
('contracts.generate','Générer les contrats'),
('payments.view','Voir les paiements'),
('payments.import','Importer des paiements CSV'),
('reports.view','Voir les rapports'),
('reminders.send','Envoyer des relances'),
('ai.assist','Utiliser l''assistant IA'),
('owners.view','Voir les propriétaires'),
('sites.view','Voir les sites'),
('audit.view','Voir le journal d''audit')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- PDG: Full access to all permissions
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code='PDG'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- COMPTA: Financial and accounting access
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r 
CROSS JOIN permissions p 
WHERE r.code='COMPTA' AND p.code IN (
  'tenants.view',
  'contracts.view',
  'payments.view',
  'payments.import',
  'reports.view',
  'ai.assist',
  'owners.view',
  'sites.view',
  'audit.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- AGENT: Field operations access
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r 
CROSS JOIN permissions p 
WHERE r.code='AGENT' AND p.code IN (
  'tenants.view',
  'contracts.view',
  'contracts.generate',
  'payments.view',
  'reminders.send',
  'ai.assist',
  'owners.view',
  'sites.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- LOCATAIRE: Read-only tenant portal
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r 
CROSS JOIN permissions p 
WHERE r.code='LOCATAIRE' AND p.code IN (
  'contracts.view',
  'payments.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PROPRIETAIRE: Property owner portal
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r 
CROSS JOIN permissions p 
WHERE r.code='PROPRIETAIRE' AND p.code IN (
  'reports.view',
  'contracts.view',
  'payments.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (run after seeding)
-- ============================================================================
-- SELECT 'Roles created:' as info, COUNT(*) as count FROM roles;
-- SELECT 'Permissions created:' as info, COUNT(*) as count FROM permissions;
-- SELECT r.code as role, COUNT(p.id) as permissions 
-- FROM roles r 
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id 
-- LEFT JOIN permissions p ON rp.permission_id = p.id 
-- GROUP BY r.code ORDER BY r.code;
