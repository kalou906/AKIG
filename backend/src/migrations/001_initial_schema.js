/**
 * Database Migration Schema
 * Creates all required tables for AKIG platform
 * Includes: properties, tenants, leases, payments, users, gamification, offline sync
 */

const migration = `

-- ==================== USERS & AUTHENTICATION ====================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'agent',
  phone VARCHAR(20),
  address TEXT,
  total_points INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== PROPERTIES ====================

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  property_type VARCHAR(50),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area DECIMAL(10, 2),
  rent_amount DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT,
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== TENANTS ====================

CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  id_number VARCHAR(50),
  country VARCHAR(100),
  employment_status VARCHAR(50),
  income DECIMAL(12, 2),
  credit_score INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== LEASES ====================

CREATE TABLE IF NOT EXISTS leases (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  agent_id INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(10, 2),
  deposit_amount DECIMAL(10, 2),
  terms TEXT,
  status VARCHAR(50) DEFAULT 'active',
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ==================== PAYMENTS ====================

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (lease_id) REFERENCES leases(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ==================== MAINTENANCE ====================

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  tenant_id INTEGER,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open',
  assigned_to INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- ==================== GAMIFICATION ====================

CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  badge_id VARCHAR(100) NOT NULL,
  points INTEGER,
  reason TEXT,
  awarded_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS training_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  module_id VARCHAR(100) NOT NULL,
  section_id VARCHAR(100),
  score INTEGER,
  completed_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, module_id, section_id)
);

-- ==================== OFFLINE SYNC ====================

CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  retries INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id SERIAL PRIMARY KEY,
  sync_queue_id INTEGER,
  resolution_strategy VARCHAR(50),
  client_data JSONB,
  server_data JSONB,
  resolved_data JSONB,
  resolved_at TIMESTAMP,
  FOREIGN KEY (sync_queue_id) REFERENCES offline_sync_queue(id)
);

-- ==================== COMPLIANCE & AUDIT ====================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS compliance_checks (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  country VARCHAR(100),
  framework VARCHAR(100),
  status VARCHAR(50),
  findings JSONB,
  checked_at TIMESTAMP DEFAULT NOW()
);

-- ==================== CURRENCY & CONVERSION ====================

CREATE TABLE IF NOT EXISTS currency_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(10),
  to_currency VARCHAR(10),
  rate DECIMAL(15, 8),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- ==================== DISASTER RECOVERY ====================

CREATE TABLE IF NOT EXISTS backup_logs (
  id SERIAL PRIMARY KEY,
  backup_type VARCHAR(50),
  status VARCHAR(50),
  size_bytes BIGINT,
  location TEXT,
  backup_date TIMESTAMP,
  retention_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES ====================

CREATE INDEX idx_properties_agency ON properties(agency_id);
CREATE INDEX idx_tenants_agency ON tenants(agency_id);
CREATE INDEX idx_leases_property ON leases(property_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_payments_lease ON payments(lease_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_user_badges ON user_badges(user_id);
CREATE INDEX idx_training_progress ON training_progress(user_id);
CREATE INDEX idx_offline_sync_queue ON offline_sync_queue(user_id, status);
CREATE INDEX idx_audit_logs ON audit_logs(user_id, timestamp);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_backup_logs ON backup_logs(backup_date);

`;

module.exports = { migration };
