-- ============================================================
-- seed.sql - Données de test pour tous les modules
-- Charge après les migrations (tables vides)
-- ============================================================

-- Désactiver les constraints temporairement
SET CONSTRAINTS ALL DEFERRED;

-- =====================================================
-- 1. UTILISATEURS & RÔLES
-- =====================================================

-- Admin system
INSERT INTO users (
  id, email, password_hash, first_name, last_name, 
  role, status, created_at
) VALUES (
  'usr-admin-001',
  'admin@akig.local',
  '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', -- bcrypt hash demo
  'Admin',
  'System',
  'ADMIN',
  'ACTIVE',
  NOW()
) ON CONFLICT DO NOTHING;

-- Agent immobilier
INSERT INTO users (
  id, email, password_hash, first_name, last_name,
  role, status, created_at
) VALUES (
  'usr-agent-001',
  'agent@akig.local',
  '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
  'Agent',
  'Immobilier',
  'AGENT',
  'ACTIVE',
  NOW()
) ON CONFLICT DO NOTHING;

-- Manager commercial
INSERT INTO users (
  id, email, password_hash, first_name, last_name,
  role, status, created_at
) VALUES (
  'usr-manager-001',
  'manager@akig.local',
  '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
  'Manager',
  'Commercial',
  'MANAGER',
  'ACTIVE',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. PROPRIÉTÉS
-- =====================================================

INSERT INTO properties (
  id, reference, address, city, postal_code, 
  country, property_type, ownership_type, status,
  created_by, created_at
) VALUES 
(
  'prop-001',
  'PROP-LAM-001',
  '123 Avenue de Lambagni',
  'Lambagni',
  '10000',
  'GUINÉE',
  'RESIDENTIAL',
  'OWNED',
  'ACTIVE',
  'usr-admin-001',
  NOW()
),
(
  'prop-002',
  'PROP-RAT-001',
  '456 Boulevard de Ratoma',
  'Ratoma',
  '10001',
  'GUINÉE',
  'COMMERCIAL',
  'OWNED',
  'ACTIVE',
  'usr-admin-001',
  NOW()
),
(
  'prop-003',
  'PROP-CENT-001',
  '789 Centre-Ville',
  'Conakry',
  '10002',
  'GUINÉE',
  'MIXED',
  'OWNED',
  'ACTIVE',
  'usr-admin-001',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. LOCATAIRES
-- =====================================================

INSERT INTO tenants (
  id, first_name, last_name, email, phone,
  id_type, id_number, marital_status, 
  profession, status, created_at
) VALUES
(
  'tenant-001',
  'Mamadou',
  'Diallo',
  'mamadou.diallo@email.com',
  '+224 621234567',
  'PASSPORT',
  'GN123456789',
  'MARRIED',
  'Ingénieur',
  'ACTIVE',
  NOW()
),
(
  'tenant-002',
  'Fatoumata',
  'Sow',
  'fatoumata.sow@email.com',
  '+224 625555666',
  'NATIONAL_ID',
  'GN987654321',
  'SINGLE',
  'Docteur',
  'ACTIVE',
  NOW()
),
(
  'tenant-003',
  'Ibrahima',
  'Camara',
  'ibrahima.camara@email.com',
  '+224 629876543',
  'PASSPORT',
  'GN111222333',
  'MARRIED',
  'Commerçant',
  'ACTIVE',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. GARANTS
-- =====================================================

INSERT INTO guarantors (
  id, tenant_id, first_name, last_name, 
  relationship, phone, income_monthly, status
) VALUES
(
  'guar-001',
  'tenant-001',
  'Abdoulaye',
  'Diallo',
  'FATHER',
  '+224 621111111',
  2500000, -- 2.5M FG
  'CONFIRMED'
),
(
  'guar-002',
  'tenant-002',
  'Aissatou',
  'Sow',
  'MOTHER',
  '+224 625555555',
  1800000, -- 1.8M FG
  'CONFIRMED'
),
(
  'guar-003',
  'tenant-003',
  'Sekou',
  'Camara',
  'BROTHER',
  '+224 629999999',
  3200000, -- 3.2M FG
  'CONFIRMED'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CONTRATS
-- =====================================================

INSERT INTO contracts (
  id, reference, property_id, tenant_id, 
  start_date, end_date, monthly_rent, currency,
  deposit_amount, utilities_included,
  status, created_by, created_at
) VALUES
(
  'contract-001',
  'CONT-2024-001',
  'prop-001',
  'tenant-001',
  '2024-01-01',
  '2025-12-31',
  850000, -- FG/mois
  'FG',
  1700000, -- 2 mois caution
  true,
  'ACTIVE',
  'usr-agent-001',
  NOW()
),
(
  'contract-002',
  'CONT-2024-002',
  'prop-002',
  'tenant-002',
  '2024-03-15',
  '2026-03-14',
  1200000,
  'FG',
  2400000,
  false,
  'ACTIVE',
  'usr-agent-001',
  NOW()
),
(
  'contract-003',
  'CONT-2024-003',
  'prop-003',
  'tenant-003',
  '2024-06-01',
  '2025-05-31',
  950000,
  'FG',
  1900000,
  true,
  'ACTIVE',
  'usr-agent-001',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. PAIEMENTS
-- =====================================================

INSERT INTO payments (
  id, contract_id, amount, currency, payment_date,
  payment_method, reference_number, status,
  created_at
) VALUES
(
  'pay-001',
  'contract-001',
  850000,
  'FG',
  '2024-01-05',
  'TRANSFER',
  'TRANSF-2024-001',
  'COMPLETED',
  NOW()
),
(
  'pay-002',
  'contract-001',
  850000,
  'FG',
  '2024-02-05',
  'TRANSFER',
  'TRANSF-2024-002',
  'COMPLETED',
  NOW()
),
(
  'pay-003',
  'contract-002',
  1200000,
  'FG',
  '2024-03-20',
  'CASH',
  'CASH-2024-001',
  'COMPLETED',
  NOW()
),
(
  'pay-004',
  'contract-002',
  1200000,
  'FG',
  '2024-04-20',
  'TRANSFER',
  'TRANSF-2024-003',
  'PENDING',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. PREAVIS
-- =====================================================

INSERT INTO preavis (
  id, contract_id, initiated_by, notice_type,
  notice_date, intended_departure, reason,
  status, created_at
) VALUES
(
  'preavis-001',
  'contract-003',
  'TENANT',
  'DEPARTURE',
  '2024-11-01',
  '2025-05-31',
  'Changement de région professionnelle',
  'SENT',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. LITIGES
-- =====================================================

INSERT INTO disputes (
  id, contract_id, dispute_type, description,
  amount_disputed, reported_date, status,
  created_at
) VALUES
(
  'disp-001',
  'contract-001',
  'RENT_ARREARS',
  'Loyer non payé pour mars 2024',
  850000,
  '2024-04-10',
  'OPEN',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. RECOUVREMENT
-- =====================================================

INSERT INTO recouvrement (
  id, dispute_id, recovery_type, amount,
  currency, initiated_date, deadline_date,
  status, created_at
) VALUES
(
  'recov-001',
  'disp-001',
  'AMICABLE',
  850000,
  'FG',
  '2024-04-15',
  '2024-05-15',
  'IN_PROGRESS',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. FRAIS & COÛTS
-- =====================================================

INSERT INTO costs (
  id, property_id, cost_type, description,
  amount, currency, invoice_date, status,
  created_at
) VALUES
(
  'cost-001',
  'prop-001',
  'MAINTENANCE',
  'Réparation toiture',
  450000,
  'FG',
  '2024-01-15',
  'COMPLETED',
  NOW()
),
(
  'cost-002',
  'prop-002',
  'UTILITIES',
  'Électricité - janvier',
  125000,
  'FG',
  '2024-02-01',
  'PENDING',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. PRÉDICTIONS IA & GAMIFICATION
-- =====================================================

INSERT INTO ai_predictions (
  id, contract_id, prediction_type, risk_score,
  confidence, predicted_outcome, created_at
) VALUES
(
  'pred-001',
  'contract-001',
  'DEFAULT_RISK',
  0.23,
  0.92,
  'LOW_RISK',
  NOW()
),
(
  'pred-002',
  'contract-002',
  'EARLY_TERMINATION_RISK',
  0.45,
  0.78,
  'MEDIUM_RISK',
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO gamification_points (
  id, user_id, action_type, points_earned,
  level, earned_at
) VALUES
(
  'game-001',
  'usr-agent-001',
  'CONTRACT_COMPLETED',
  100,
  'BRONZE',
  NOW()
),
(
  'game-002',
  'usr-manager-001',
  'ZERO_DEFAULTS',
  500,
  'SILVER',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. NOTIFICATIONS & LOGS
-- =====================================================

INSERT INTO notifications (
  id, user_id, type, message, link,
  is_read, created_at
) VALUES
(
  'notif-001',
  'usr-agent-001',
  'CONTRACT_CREATED',
  'Nouveau contrat créé: CONT-2024-001',
  '/contrats/contract-001',
  false,
  NOW()
),
(
  'notif-002',
  'usr-manager-001',
  'PAYMENT_RECEIVED',
  'Paiement reçu: 850 000 FG',
  '/paiements/pay-001',
  false,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (
  id, user_id, entity_type, entity_id,
  action, old_values, new_values, created_at
) VALUES
(
  'audit-001',
  'usr-admin-001',
  'CONTRACT',
  'contract-001',
  'CREATE',
  NULL,
  '{"status":"ACTIVE","monthly_rent":850000}',
  NOW()
),
(
  'audit-002',
  'usr-agent-001',
  'PAYMENT',
  'pay-001',
  'UPDATE',
  '{"status":"PENDING"}',
  '{"status":"COMPLETED"}',
  NOW()
) ON CONFLICT DO NOTHING;

-- Réactiver les constraints
SET CONSTRAINTS ALL IMMEDIATE;

-- =====================================================
-- 13. RÉSUMÉ FINAL
-- =====================================================

SELECT '✅ SEED DATA LOADED' as status;
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as properties FROM properties;
SELECT COUNT(*) as tenants FROM tenants;
SELECT COUNT(*) as guarantors FROM guarantors;
SELECT COUNT(*) as contracts FROM contracts;
SELECT COUNT(*) as payments FROM payments;
SELECT COUNT(*) as preavis FROM preavis;
SELECT COUNT(*) as disputes FROM disputes;
SELECT COUNT(*) as recouvrement FROM recouvrement;
SELECT COUNT(*) as costs FROM costs;
