/**
 * Migration: Modules System
 * Date: 2025-10-25
 * Description: Create modules table for feature management
 */

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  agency_id INT REFERENCES agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_module_per_agency UNIQUE (code, agency_id)
);

-- Create index on agency_id for faster queries
CREATE INDEX IF NOT EXISTS idx_modules_agency_id ON modules(agency_id);
CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);
CREATE INDEX IF NOT EXISTS idx_modules_enabled ON modules(enabled);

-- Insert default modules
INSERT INTO modules (code, name, description, enabled) VALUES
  ('tax_pro', 'Tax Professional Module', 'Advanced tax management and reporting', true),
  ('bi_pack', 'Business Intelligence Pack', 'Analytics and reporting dashboard', true),
  ('insurance', 'Insurance Management', 'Insurance policy tracking and claims', false),
  ('accounting', 'Advanced Accounting', 'Full accounting suite with GL', true),
  ('audit', 'Audit Trail', 'Complete audit logging and compliance', true),
  ('api', 'API Access', 'REST API access for integrations', false),
  ('webhooks', 'Webhooks', 'Event-driven webhooks system', false),
  ('export_pdf', 'PDF Export', 'PDF generation and export features', true),
  ('export_csv', 'CSV Export', 'CSV export functionality', true),
  ('notifications', 'Advanced Notifications', 'Multi-channel notifications', true)
ON CONFLICT (code) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_modules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_modules_updated_at ON modules;
CREATE TRIGGER trg_modules_updated_at
BEFORE UPDATE ON modules
FOR EACH ROW
EXECUTE FUNCTION update_modules_timestamp();

-- Create function to check if module is enabled
CREATE OR REPLACE FUNCTION is_module_enabled(
  p_code TEXT,
  p_agency_id INT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM modules
    WHERE code = p_code
    AND (agency_id = p_agency_id OR agency_id IS NULL)
    AND enabled = true
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get enabled modules for agency
CREATE OR REPLACE FUNCTION get_agency_modules(p_agency_id INT)
RETURNS TABLE(
  id INT,
  code TEXT,
  name TEXT,
  description TEXT,
  enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.code, m.name, m.description, m.enabled
  FROM modules m
  WHERE m.agency_id = p_agency_id OR m.agency_id IS NULL
  ORDER BY m.code;
END;
$$ LANGUAGE plpgsql;
