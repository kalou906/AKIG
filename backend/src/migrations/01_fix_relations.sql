-- ============================================================
-- AKIG - Database Relations Fix & Performance Optimization
-- Fixes: Circular dependencies, missing indexes (P0)
-- ============================================================

-- Fix 1: Remove circular dependency between tenants and contracts
-- tenants.contract_id is redundant since contracts already has tenant_id
ALTER TABLE tenants DROP COLUMN IF EXISTS contract_id;

-- Ensure contracts.tenant_id has proper foreign key
ALTER TABLE contracts 
  DROP CONSTRAINT IF EXISTS contracts_tenant_id_fkey;

ALTER TABLE contracts
  ADD CONSTRAINT contracts_tenant_id_fkey
  FOREIGN KEY (tenant_id) 
  REFERENCES tenants(id) 
  ON DELETE CASCADE;

-- Fix 2: Add missing cascade delete for properties
ALTER TABLE contracts
  DROP CONSTRAINT IF EXISTS contracts_property_id_fkey;

ALTER TABLE contracts
  ADD CONSTRAINT contracts_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE CASCADE;

-- Fix 3: Performance - Critical indexes for common queries
-- Index for overdue payments query (most frequent)
CREATE INDEX IF NOT EXISTS idx_payments_overdue 
  ON payments(due_date, status) 
  WHERE status = 'pending' AND due_date < CURRENT_DATE;

-- Index for active contracts
CREATE INDEX IF NOT EXISTS idx_contracts_active 
  ON contracts(status, end_date) 
  WHERE status = 'active';

-- Index for tenant search by email/name
CREATE INDEX IF NOT EXISTS idx_tenants_email 
  ON tenants(email) 
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_name_trgm 
  ON tenants USING gin(name gin_trgm_ops);

-- Requires pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for payments by contract (history lookup)
CREATE INDEX IF NOT EXISTS idx_payments_contract_date 
  ON payments(contract_id, paid_date DESC);

-- Index for user authentication
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email) 
  WHERE active = true;

-- Fix 4: Add missing constraints
-- Ensure payment amount is positive
ALTER TABLE payments
  ADD CONSTRAINT payments_amount_positive 
  CHECK (amount > 0);

-- Ensure contract dates are logical
ALTER TABLE contracts
  ADD CONSTRAINT contracts_dates_logical
  CHECK (end_date IS NULL OR end_date > start_date);

-- Fix 5: Add updated_at triggers for auto-timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix 6: Add composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_payments_analytics 
  ON payments(status, paid_date, amount);

CREATE INDEX IF NOT EXISTS idx_contracts_analytics 
  ON contracts(status, start_date, rent_amount);

-- Analyze tables for query planner
ANALYZE users;
ANALYZE tenants;
ANALYZE properties;
ANALYZE contracts;
ANALYZE payments;
ANALYZE projects;
ANALYZE clients;
