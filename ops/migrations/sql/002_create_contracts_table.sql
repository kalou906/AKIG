-- Migration: Create contracts table
-- Created: 2025-10-25
-- Description: Core contracts table with user relationships

BEGIN;

CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Create indexes
CREATE INDEX idx_contracts_user_id ON contracts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_created_at ON contracts(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION update_contracts_updated_at();

COMMIT;
