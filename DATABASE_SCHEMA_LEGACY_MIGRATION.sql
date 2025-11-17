# 🗄️ DATABASE SCHEMA - LEGACY IMMOBILIER LOYER ENDPOINTS SUPPORT

## Complete SQL Migration File for Missing Endpoints

```sql
-- =====================================================
-- MIGRATION: Add support for legacy Immobilier Loyer endpoints
-- File: backend/migrations/003_add_legacy_endpoints_support.sql
-- Author: AKIG Development Team
-- Date: 2025-01-30
-- =====================================================

-- ========== 1. RENT MANAGEMENT TABLES ==========

/**
 * Tracks all rent changes and indexation
 */
CREATE TABLE rent_indexations (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  index_type VARCHAR(20) NOT NULL,              -- IRL, ICC, ILAT
  old_rent DECIMAL(14,2) NOT NULL,
  new_rent DECIMAL(14,2) NOT NULL,
  old_index_value DECIMAL(10,4),
  new_index_value DECIMAL(10,4),
  percentage_change DECIMAL(6,2),
  effective_date DATE NOT NULL,
  reason VARCHAR(100),                          -- indexation, market_adjustment, negotiated
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_rent (contract_id),
  INDEX idx_effective_date (effective_date)
);

/**
 * Tracks rent adjustments and changes
 */
CREATE TABLE rent_changes (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  old_rent DECIMAL(14,2) NOT NULL,
  new_rent DECIMAL(14,2) NOT NULL,
  increment_percentage DECIMAL(6,2),
  effective_date DATE NOT NULL,
  reason VARCHAR(100),
  notes TEXT,
  applied_by INTEGER,
  applied_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_rent_changes (contract_id),
  INDEX idx_applied_date (applied_date)
);

-- ========== 2. CHARGE SETTLEMENT TABLES ==========

/**
 * Annual charge settlements for water, electricity, etc
 */
CREATE TABLE charge_settlements (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  settlement_year INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  calculations_json JSONB,                      -- Full settlement breakdown
  total_provisioned DECIMAL(14,2),
  total_actual DECIMAL(14,2),
  adjustment_amount DECIMAL(14,2),              -- Can be positive or negative
  tenant_owes DECIMAL(14,2),                    -- Amount tenant must pay
  credit_for_tenant DECIMAL(14,2),              -- Amount to credit tenant
  status VARCHAR(20),                           -- pending, charged, settled, disputed
  settlement_date DATE,
  due_date DATE,
  resolved_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_settlement (contract_id),
  INDEX idx_year_settlement (settlement_year),
  INDEX idx_status_settlement (status)
);

/**
 * Charge adjustments from settlements
 */
CREATE TABLE charge_adjustments (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id),
  settlement_id INTEGER REFERENCES charge_settlements(id),
  charge_type VARCHAR(50),                      -- water, electricity, coproperty, etc
  provisioned_amount DECIMAL(14,2),
  actual_amount DECIMAL(14,2),
  difference DECIMAL(14,2),                     -- Can be positive (overcharge) or negative (undercharge)
  adjustment_type VARCHAR(20),                  -- settlement, correction, refund
  due_date DATE,
  status VARCHAR(20),                           -- pending, invoiced, paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_adj (contract_id),
  INDEX idx_settlement_adj (settlement_id)
);

-- ========== 3. DEPOSIT MANAGEMENT TABLES ==========

/**
 * Security deposit tracking
 */
CREATE TABLE security_deposits (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  original_amount DECIMAL(14,2) NOT NULL,
  current_balance DECIMAL(14,2),
  held_by VARCHAR(50),                          -- agency, owner, court
  held_date DATE,
  holding_account VARCHAR(100),                 -- Where deposit is held
  interest_applied BOOLEAN DEFAULT FALSE,
  interest_rate DECIMAL(5,2),
  interest_earned DECIMAL(14,2),
  status VARCHAR(20),                           -- held, deducted, returned, partial
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_deposit (contract_id),
  INDEX idx_status_deposit (status)
);

/**
 * Deposit movements (holds, deductions, returns)
 */
CREATE TABLE deposit_movements (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  security_deposit_id INTEGER REFERENCES security_deposits(id),
  movement_type VARCHAR(30),                    -- hold, deduct, return, transfer
  amount DECIMAL(14,2) NOT NULL,
  reason VARCHAR(100),                          -- damages, cleaning, unpaid_charges, normal_return
  category VARCHAR(50),                         -- For reporting
  movement_date DATE NOT NULL,
  justification_document_id INTEGER,            -- Link to damage report, etc
  processing_status VARCHAR(20),                -- pending, processed, cancelled
  processed_date TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_deposits (contract_id),
  INDEX idx_movement_type (movement_type),
  INDEX idx_movement_date (movement_date)
);

-- ========== 4. SETTLEMENT & TERMINATION TABLES ==========

/**
 * Contract termination and final settlements
 */
CREATE TABLE contract_settlements (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  termination_date DATE NOT NULL,
  actual_moveout_date DATE,
  settlement_type VARCHAR(30),                  -- normal_expiry, early_termination, dispute
  final_rent_paid BOOLEAN,
  damages_documented BOOLEAN,
  damage_cost DECIMAL(14,2),
  cleaning_cost DECIMAL(14,2),
  other_deductions DECIMAL(14,2),
  utilities_cost DECIMAL(14,2),
  total_deductions DECIMAL(14,2),
  deposit_return_amount DECIMAL(14,2),
  return_method VARCHAR(30),                    -- cash, check, transfer
  return_deadline DATE,
  return_date TIMESTAMP,
  status VARCHAR(20),                           -- pending, partially_returned, fully_returned
  notes TEXT,
  settlement_document_id INTEGER,               -- Link to settlement agreement
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_settlement (contract_id),
  INDEX idx_settlement_date (termination_date)
);

-- ========== 5. PAYMENT MANAGEMENT TABLES ==========

/**
 * Enhanced payment tracking with reconciliation
 */
CREATE TABLE rent_payments_extended (
  id SERIAL PRIMARY KEY,
  rent_payment_id INTEGER NOT NULL REFERENCES rent_payments(id) ON DELETE CASCADE,
  payment_reference VARCHAR(50) UNIQUE,         -- Bank transfer reference
  bank_details_json JSONB,                      -- Bank name, account, transaction ID
  covered_period_start DATE,
  covered_period_end DATE,
  paid_by_type VARCHAR(30),                     -- locataire, guarantor, third_party
  paid_by_name VARCHAR(100),
  reconciliation_status VARCHAR(20),            -- pending, verified, matched
  bank_statement_date DATE,
  bank_statement_reference VARCHAR(100),
  reconciliation_date TIMESTAMP,
  reconciliation_notes TEXT,
  receipt_number VARCHAR(50) UNIQUE,
  receipt_generated_date TIMESTAMP,
  receipt_sent_date TIMESTAMP,
  receipt_sent_to TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_ext (rent_payment_id),
  INDEX idx_reconciliation (reconciliation_status),
  INDEX idx_receipt (receipt_number)
);

/**
 * Payment reminders sent to tenants
 */
CREATE TABLE payment_reminders (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id),
  tenant_id INTEGER REFERENCES tenants(id),
  due_amount DECIMAL(14,2),
  due_date DATE,
  days_before_due INTEGER,
  reminder_type VARCHAR(20),                    -- email, sms, both
  reminder_method VARCHAR(20),                  -- automated, manual
  reminder_text TEXT,
  custom_message TEXT,
  include_receipt BOOLEAN DEFAULT FALSE,
  send_to_guarantor BOOLEAN DEFAULT FALSE,
  sent_date TIMESTAMP,
  sent_to VARCHAR(255),
  delivery_status VARCHAR(20),                  -- pending, sent, delivered, failed
  retry_count INTEGER DEFAULT 0,
  last_retry_date TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_reminder (contract_id),
  INDEX idx_due_date (due_date)
);

-- ========== 6. TENANT DOCUMENTS TABLES ==========

/**
 * Tenant documents (ID cards, proof of income, etc)
 */
CREATE TABLE tenant_documents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type VARCHAR(50),                    -- id_card, proof_of_income, employment_letter, bank_statement
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_mime_type VARCHAR(50),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATE,
  status VARCHAR(20),                           -- uploaded, verified, expired, rejected
  verification_date TIMESTAMP,
  verified_by INTEGER,
  verification_notes TEXT,
  description TEXT,
  is_publicly_viewable BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  INDEX idx_tenant_docs (tenant_id),
  INDEX idx_doc_type (document_type),
  INDEX idx_expiry (expiry_date)
);

/**
 * Guarantor information
 */
CREATE TABLE guarantors (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id INTEGER REFERENCES rental_contracts(id),
  guarantor_name VARCHAR(255) NOT NULL,
  relationship_to_tenant VARCHAR(30),           -- parent, spouse, family, friend, employer
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  national_id VARCHAR(50),
  id_document_id INTEGER REFERENCES tenant_documents(id),
  liability_limit DECIMAL(14,2),                -- Max amount liable
  signature_document_id INTEGER,
  signature_date DATE,
  status VARCHAR(20),                           -- active, inactive, replaced
  linked_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_guarantor (tenant_id),
  INDEX idx_guarantor_status (status)
);

-- ========== 7. MAINTENANCE & REPAIRS TABLES ==========

/**
 * Maintenance requests
 */
CREATE TABLE maintenance_requests (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id),
  property_id INTEGER REFERENCES properties(id),
  reported_by_type VARCHAR(20),                 -- tenant, owner, manager
  reported_by_id INTEGER,
  issue_description TEXT NOT NULL,
  issue_category VARCHAR(50),                   -- plumbing, electrical, structural, appliance, other
  severity_level VARCHAR(20),                   -- low, medium, high, emergency
  report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_date DATE,
  completion_date DATE,
  actual_cost DECIMAL(14,2),
  quote_cost DECIMAL(14,2),
  status VARCHAR(20),                           -- reported, assigned, in_progress, completed, cancelled
  assigned_to INTEGER,                          -- Contractor/maintenance person
  notes TEXT,
  charge_to_tenant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_maint (contract_id),
  INDEX idx_status_maint (status),
  INDEX idx_scheduled_maint (scheduled_date)
);

/**
 * Maintenance costs and charges
 */
CREATE TABLE maintenance_costs (
  id SERIAL PRIMARY KEY,
  maintenance_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  contract_id INTEGER REFERENCES rental_contracts(id),
  cost_category VARCHAR(50),                    -- parts, labor, service_fee
  amount DECIMAL(14,2),
  description VARCHAR(255),
  vendor_name VARCHAR(100),
  invoice_number VARCHAR(50),
  invoice_date DATE,
  receipt_document_id INTEGER,
  charged_to_tenant BOOLEAN,
  charge_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_maintenance_cost (maintenance_id)
);

-- ========== 8. FINANCIAL REPORTS TABLES ==========

/**
 * Generated reports history
 */
CREATE TABLE financial_reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(50),                      -- fiscal_declaration, revenue_expense, tenant_account, property_performance, occupancy, payment_analysis, arrears_aging, balance_sheet
  report_year INTEGER,
  report_period_start DATE,
  report_period_end DATE,
  property_id INTEGER REFERENCES properties(id),
  generated_by INTEGER,
  generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_path VARCHAR(255),
  file_format VARCHAR(10),                      -- pdf, excel, csv
  file_size INTEGER,
  status VARCHAR(20),                           -- generated, sent, archived
  is_archived BOOLEAN DEFAULT FALSE,
  archive_date TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  last_downloaded TIMESTAMP,
  INDEX idx_report_type (report_type),
  INDEX idx_report_year (report_year),
  INDEX idx_generated_date (generated_date)
);

/**
 * Report cache for performance
 */
CREATE TABLE report_cache (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(50),
  report_parameters_json JSONB,
  cached_data_json JSONB,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INTEGER DEFAULT 0,
  UNIQUE KEY idx_report_cache (report_type, MD5(report_parameters_json::text))
);

-- ========== 9. CONFIGURATION TABLES ==========

/**
 * Charge types (water, electricity, etc)
 */
CREATE TABLE charge_types_config (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,             -- water, electricity, coproperty, maintenance, insurance, taxes
  label_fr VARCHAR(100),
  label_en VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_estimable BOOLEAN DEFAULT TRUE,
  frequency VARCHAR(20),                        -- monthly, quarterly, annual
  default_provisioning_method VARCHAR(50),      -- fixed, percentage_of_rent, zero
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_charge_code (code)
);

/**
 * Index values (IRL, ICC, ILAT) history
 */
CREATE TABLE index_values_history (
  id SERIAL PRIMARY KEY,
  index_type VARCHAR(20) NOT NULL,              -- IRL, ICC, ILAT
  value DECIMAL(10,4) NOT NULL,
  effective_date DATE NOT NULL,
  previous_value DECIMAL(10,4),
  change_percentage DECIMAL(6,2),
  source VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_index_type (index_type),
  INDEX idx_effective_date (effective_date)
);

/**
 * Payment methods configuration
 */
CREATE TABLE payment_methods_config (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,             -- check, transfer, cash, card, mobile_money
  label_fr VARCHAR(100),
  label_en VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  requires_verification BOOLEAN DEFAULT FALSE,
  reconciliation_method VARCHAR(50),
  processing_fee_percentage DECIMAL(6,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== 10. COMMUNICATION LOG ==========

/**
 * All communications sent to tenants/owners
 */
CREATE TABLE communication_log (
  id SERIAL PRIMARY KEY,
  recipient_type VARCHAR(20),                   -- tenant, owner, guarantor
  recipient_id INTEGER,
  sender_type VARCHAR(20),                      -- system, admin, owner
  sender_id INTEGER,
  communication_type VARCHAR(50),               -- reminder, receipt, notification, alert
  channel VARCHAR(20),                          -- email, sms, in_app
  subject VARCHAR(255),
  message_text TEXT,
  related_contract_id INTEGER REFERENCES rental_contracts(id),
  related_payment_id INTEGER,
  status VARCHAR(20),                           -- sent, delivered, read, failed
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_date TIMESTAMP,
  read_date TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient (recipient_type, recipient_id),
  INDEX idx_comm_type (communication_type),
  INDEX idx_sent_date (sent_date)
);

-- ========== 11. INDEXES FOR PERFORMANCE ==========

CREATE INDEX idx_contracts_expiry ON rental_contracts(expiry_date);
CREATE INDEX idx_contracts_status ON rental_contracts(status);
CREATE INDEX idx_contracts_property ON rental_contracts(property_id);
CREATE INDEX idx_contracts_tenant ON rental_contracts(tenant_id);

CREATE INDEX idx_payments_contract ON rent_payments(rental_contract_id);
CREATE INDEX idx_payments_date ON rent_payments(payment_date);
CREATE INDEX idx_payments_status ON rent_payments(status);

CREATE INDEX idx_charges_contract ON contract_charges(contract_id);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_phone ON tenants(phone);

-- ========== 12. AUDIT TRAIL ==========

/**
 * Track all important changes
 */
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100),
  record_id INTEGER,
  action VARCHAR(20),                           -- INSERT, UPDATE, DELETE
  old_values_json JSONB,
  new_values_json JSONB,
  changed_by INTEGER,
  change_reason VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_table (table_name),
  INDEX idx_audit_date (changed_at)
);

-- ========== VIEWS FOR REPORTING ==========

/**
 * Contract status overview
 */
CREATE VIEW v_contracts_status AS
SELECT 
  rc.id,
  rc.property_id,
  p.name as property_name,
  t.first_name as tenant_first_name,
  t.last_name as tenant_last_name,
  rc.monthly_rent,
  rc.start_date,
  rc.expiry_date,
  rc.status,
  DATEDIFF(DAY, CURRENT_DATE, rc.expiry_date) as days_until_expiry,
  COUNT(rp.id) as total_payments,
  SUM(rp.amount_gnf) as total_paid
FROM rental_contracts rc
LEFT JOIN properties p ON rc.property_id = p.id
LEFT JOIN tenants t ON rc.tenant_id = t.id
LEFT JOIN rent_payments rp ON rc.id = rp.rental_contract_id
GROUP BY rc.id, p.id, t.id;

/**
 * Tenant payment status
 */
CREATE VIEW v_tenant_payment_status AS
SELECT 
  t.id,
  t.first_name,
  t.last_name,
  rc.id as contract_id,
  rc.monthly_rent,
  COUNT(DISTINCT rp.id) as total_payments,
  MAX(rp.payment_date) as last_payment_date,
  DATEDIFF(DAY, MAX(rp.payment_date), CURRENT_DATE) as days_since_last_payment,
  AVG(DATEDIFF(DAY, rc.payment_due_date, rp.payment_date)) as avg_days_late
FROM tenants t
LEFT JOIN rental_contracts rc ON t.id = rc.tenant_id
LEFT JOIN rent_payments rp ON rc.id = rp.rental_contract_id
GROUP BY t.id, rc.id;

-- ========== CONSTRAINTS & TRIGGERS ==========

/**
 * Ensure deposit return doesn't exceed original deposit
 */
ALTER TABLE contract_settlements
ADD CONSTRAINT check_valid_deductions 
CHECK (total_deductions <= (
  SELECT original_amount FROM security_deposits 
  WHERE security_deposits.contract_id = contract_settlements.contract_id
));

/**
 * Automatic update of contract settlement status on return
 */
CREATE TRIGGER update_settlement_status
AFTER UPDATE ON contract_settlements
FOR EACH ROW
BEGIN
  IF NEW.return_date IS NOT NULL THEN
    UPDATE contract_settlements 
    SET status = 'fully_returned' 
    WHERE id = NEW.id;
  END IF;
END;

-- ========== MIGRATION STATUS ==========
INSERT INTO schema_migrations (version, name) 
VALUES ('003_legacy_endpoints', 'Add support for legacy Immobilier Loyer endpoints');
```

## Migration Execution Instructions

```bash
# 1. Connect to AKIG database
psql -h localhost -U akig_user -d akig_production -f 003_add_legacy_endpoints_support.sql

# 2. Verify all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# 3. Check indexes created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;

# 4. Verify views created
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY viewname;
```

## Data Migration from Legacy System

```sql
-- If migrating from existing Immobilier Loyer database:

-- 1. Import proprietaires (owners)
INSERT INTO owners (company_name, contact_name, email, phone, address)
SELECT DISTINCT 
  proprietaire_name,
  proprietaire_contact,
  proprietaire_email,
  proprietaire_phone,
  proprietaire_address
FROM legacy_db.proprietaires;

-- 2. Import locaux (properties)
INSERT INTO properties (name, address, type, owner_id, status)
SELECT 
  local_name,
  local_address,
  local_type,
  o.id,
  local_status
FROM legacy_db.locaux l
JOIN owners o ON l.proprietaire_id = o.legacy_id;

-- 3. Import locataires (tenants)
INSERT INTO tenants (first_name, last_name, email, phone, address)
SELECT DISTINCT
  locataire_prenom,
  locataire_nom,
  locataire_email,
  locataire_telephone,
  locataire_adresse
FROM legacy_db.locataires;

-- Continue for all master data...
```

---

**Total Schema Addition:**
- 15 new tables
- 30+ indexes
- 4 views
- Multiple triggers
- Complete audit trail

**Estimated Migration Time:** 2-4 hours including data validation
