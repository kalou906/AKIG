CREATE TABLE IF NOT EXISTS cautions (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  paid_on DATE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  restitution_on DATE,
  retained_amount NUMERIC(12,2) DEFAULT 0,
  retained_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
