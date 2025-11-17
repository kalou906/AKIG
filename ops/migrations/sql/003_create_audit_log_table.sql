-- Migration: Create audit log table
-- Created: 2025-10-25
-- Description: Track all data changes for compliance and debugging

BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Partition by date for large tables (optional)
-- CREATE TABLE audit_log_2025_10 PARTITION OF audit_log
-- FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

COMMIT;
