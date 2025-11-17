-- Migration: 001_create_property_management.sql
-- Description: Crée les tables pour la gestion complète de propriétés, locataires, contrats et paiements

-- Améliorations de la table users (propriétaires, gestionnaires)
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'owner', 'manager', 'tenant', 'user'));
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS notes TEXT;

-- Table pour les propriétés/immeubles
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Guinea',
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_type TEXT CHECK(property_type IN ('residential', 'commercial', 'mixed', 'other')),
  total_area NUMERIC,
  year_built INTEGER,
  number_of_units INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'for_sale', 'under_renovation')),
  latitude NUMERIC,
  longitude NUMERIC,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_id, address)
);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Table pour les locaux (appartements, bureaux, etc)
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  unit_type TEXT NOT NULL CHECK(unit_type IN ('apartment', 'room', 'office', 'shop', 'warehouse', 'other')),
  floor_number INTEGER,
  area NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  furnished BOOLEAN DEFAULT false,
  rent_amount NUMERIC NOT NULL,
  deposit_amount NUMERIC,
  maintenance_fee NUMERIC DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'available' CHECK(status IN ('available', 'rented', 'under_renovation', 'archived')),
  photo_url TEXT,
  amenities TEXT, -- JSON array as string
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);

-- Amélioration de la table contracts (contrats de location)
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'rental' CHECK(contract_type IN ('rental', 'service', 'purchase', 'lease', 'other'));
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'monthly' CHECK(payment_frequency IN ('monthly', 'quarterly', 'semi-annual', 'annual'));
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'active', 'suspended', 'terminated', 'completed'));
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS termination_date DATE;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_unit ON contracts(unit_id);
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_property ON contracts(property_id);

-- Table pour les dépôts de caution
CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  received_date DATE NOT NULL,
  receipt_number TEXT UNIQUE,
  payment_method TEXT CHECK(payment_method IN ('cash', 'bank_transfer', 'check', 'card', 'other')),
  reference_number TEXT,
  status TEXT DEFAULT 'held' CHECK(status IN ('held', 'refunded', 'partially_refunded', 'deducted', 'disputed')),
  refund_amount NUMERIC,
  refund_date DATE,
  refund_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposits_contract ON deposits(contract_id);
CREATE INDEX IF NOT EXISTS idx_deposits_tenant ON deposits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- Table pour les quittances de paiement
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  receipt_type TEXT DEFAULT 'rent' CHECK(receipt_type IN ('rent', 'deposit', 'maintenance', 'other')),
  amount_paid NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('cash', 'bank_transfer', 'check', 'card', 'online', 'other')),
  period_start_date DATE,
  period_end_date DATE,
  reference_number TEXT,
  pdf_path TEXT,
  status TEXT DEFAULT 'issued' CHECK(status IN ('issued', 'sent', 'viewed', 'archived')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_contract ON receipts(contract_id);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_payment ON receipts(payment_id);

-- Amélioration de la table payments
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'rent' CHECK(payment_type IN ('rent', 'deposit', 'maintenance', 'utilities', 'other'));
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK(payment_method IN ('cash', 'bank_transfer', 'check', 'card', 'online', 'other'));
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded'));
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS period_start_date DATE;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS period_end_date DATE;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS receipt_generated BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_unit ON payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);

-- Table pour les rapports de paiement
CREATE TABLE IF NOT EXISTS payment_reports (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER,
  year INTEGER,
  due_date DATE,
  amount_due NUMERIC,
  amount_paid NUMERIC DEFAULT 0,
  balance NUMERIC,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contract_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_payment_reports_contract ON payment_reports(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_reports_property ON payment_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_payment_reports_tenant ON payment_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_reports_status ON payment_reports(status);
CREATE INDEX IF NOT EXISTS idx_payment_reports_year_month ON payment_reports(year, month);

-- Table pour l'historique des paiements par période
CREATE TABLE IF NOT EXISTS payment_history (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  period_start_date DATE,
  period_end_date DATE,
  receipt_number TEXT REFERENCES receipts(receipt_number),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_contract ON payment_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON payment_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date);

-- Créer une séquence pour les numéros de quittance
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START WITH 1001;

-- Créer une séquence pour les numéros de dépôt
CREATE SEQUENCE IF NOT EXISTS deposit_receipt_seq START WITH 5001;

-- Créer une fonction pour générer automatiquement les numéros de quittance
CREATE OR REPLACE FUNCTION generate_receipt_number() 
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(NEXTVAL('receipt_number_seq')::TEXT, 6, '0');
  RETURN 'QT-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Ajouter les indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_contracts_status_active ON contracts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(payment_date);

COMMIT;
