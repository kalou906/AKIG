/**
 * Migration: Document Management System (GED)
 * Date: 2025-10-25
 * Description: Create tables for document storage, versioning, and metadata management
 */

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  agency_id INT REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  original_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  version INT DEFAULT 1,
  status TEXT DEFAULT 'active',
  meta JSONB,
  tags TEXT[] DEFAULT '{}',
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_doc_per_agency UNIQUE (agency_id, name)
);

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INT NOT NULL,
  path TEXT NOT NULL,
  file_size BIGINT,
  checksum TEXT NOT NULL,
  file_type TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT unique_version UNIQUE (document_id, version)
);

-- Create document_categories table
CREATE TABLE IF NOT EXISTS document_categories (
  id SERIAL PRIMARY KEY,
  agency_id INT REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_category_per_agency UNIQUE (agency_id, name)
);

-- Create document_category_mapping table
CREATE TABLE IF NOT EXISTS document_category_mapping (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES document_categories(id) ON DELETE CASCADE,
  CONSTRAINT unique_doc_category UNIQUE (document_id, category_id)
);

-- Create document_sharing table
CREATE TABLE IF NOT EXISTS document_sharing (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  shared_with_agency_id INT REFERENCES agencies(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view',
  shared_by INT REFERENCES users(id) ON DELETE SET NULL,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  CONSTRAINT check_share_target CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_agency_id IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_agency_id IS NOT NULL)
  )
);

-- Create document_access_log table
CREATE TABLE IF NOT EXISTS document_access_log (
  id BIGSERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id INT REFERENCES document_versions(id) ON DELETE SET NULL,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id SERIAL PRIMARY KEY,
  agency_id INT REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_content BYTEA,
  template_type TEXT,
  mime_type TEXT,
  variables JSONB,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_template_per_agency UNIQUE (agency_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_agency_id ON documents(agency_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_checksum ON document_versions(checksum);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_sharing_document_id ON document_sharing(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sharing_user_id ON document_sharing(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_document_sharing_agency_id ON document_sharing(shared_with_agency_id);

CREATE INDEX IF NOT EXISTS idx_document_access_log_document_id ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user_id ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_action ON document_access_log(action);
CREATE INDEX IF NOT EXISTS idx_document_access_log_accessed_at ON document_access_log(accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_templates_agency_id ON document_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type);

-- Create function to increment document version
CREATE OR REPLACE FUNCTION increment_document_version(p_document_id INT)
RETURNS INT AS $$
DECLARE
  v_new_version INT;
BEGIN
  UPDATE documents
  SET version = version + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_document_id
  RETURNING version INTO v_new_version;

  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql;

-- Create function to get document with latest version info
CREATE OR REPLACE FUNCTION get_document_info(p_document_id INT)
RETURNS TABLE(
  id INT,
  name TEXT,
  path TEXT,
  version INT,
  file_type TEXT,
  file_size BIGINT,
  status TEXT,
  created_by_name TEXT,
  updated_at TIMESTAMP,
  latest_version_path TEXT,
  version_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.path,
    d.version,
    d.file_type,
    d.file_size,
    d.status,
    COALESCE(u.first_name || ' ' || u.last_name, 'System') as created_by_name,
    d.updated_at,
    dv.path as latest_version_path,
    COUNT(dv.id) OVER (PARTITION BY d.id)::INT as version_count
  FROM documents d
  LEFT JOIN users u ON d.created_by = u.id
  LEFT JOIN document_versions dv ON d.id = dv.document_id AND dv.version = d.version
  WHERE d.id = p_document_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get document history
CREATE OR REPLACE FUNCTION get_document_history(p_document_id INT, p_limit INT DEFAULT 20)
RETURNS TABLE(
  version INT,
  path TEXT,
  file_size BIGINT,
  created_by_name TEXT,
  created_at TIMESTAMP,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dv.version,
    dv.path,
    dv.file_size,
    COALESCE(u.first_name || ' ' || u.last_name, 'System') as created_by_name,
    dv.created_at,
    dv.notes
  FROM document_versions dv
  LEFT JOIN users u ON dv.created_by = u.id
  WHERE dv.document_id = p_document_id
  ORDER BY dv.version DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
  p_document_id INT,
  p_user_id INT,
  p_action TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO document_access_log (document_id, user_id, action, ip_address, user_agent)
  VALUES (p_document_id, p_user_id, p_action, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql;

-- Create function to get shared documents
CREATE OR REPLACE FUNCTION get_shared_documents(p_user_id INT, p_limit INT DEFAULT 50)
RETURNS TABLE(
  id INT,
  name TEXT,
  shared_by_name TEXT,
  permission TEXT,
  shared_at TIMESTAMP,
  expires_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    COALESCE(u.first_name || ' ' || u.last_name, 'System') as shared_by_name,
    ds.permission,
    ds.shared_at,
    ds.expires_at
  FROM document_sharing ds
  JOIN documents d ON ds.document_id = d.id
  LEFT JOIN users u ON ds.shared_by = u.id
  WHERE ds.shared_with_user_id = p_user_id
  AND (ds.expires_at IS NULL OR ds.expires_at > CURRENT_TIMESTAMP)
  ORDER BY ds.shared_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_documents_timestamp();

-- Create trigger for document_templates
DROP TRIGGER IF EXISTS trg_document_templates_updated_at ON document_templates;
CREATE TRIGGER trg_document_templates_updated_at
BEFORE UPDATE ON document_templates
FOR EACH ROW
EXECUTE FUNCTION update_documents_timestamp();

-- Create views
CREATE OR REPLACE VIEW vw_recent_documents AS
SELECT 
  d.id,
  d.agency_id,
  d.name,
  d.file_type,
  d.file_size,
  d.version,
  d.status,
  u.first_name || ' ' || u.last_name as created_by_name,
  d.created_at,
  d.updated_at,
  COUNT(dv.id) as version_count
FROM documents d
LEFT JOIN users u ON d.created_by = u.id
LEFT JOIN document_versions dv ON d.id = dv.document_id
GROUP BY d.id, u.id
ORDER BY d.created_at DESC;

CREATE OR REPLACE VIEW vw_document_access_stats AS
SELECT 
  d.id,
  d.name,
  COUNT(dal.id) as total_accesses,
  COUNT(DISTINCT dal.user_id) as unique_users,
  MAX(dal.accessed_at) as last_accessed_at,
  COUNT(CASE WHEN dal.action = 'download' THEN 1 END) as downloads,
  COUNT(CASE WHEN dal.action = 'view' THEN 1 END) as views
FROM documents d
LEFT JOIN document_access_log dal ON d.id = dal.document_id
GROUP BY d.id;

-- Insert default categories
INSERT INTO document_categories (agency_id, name, description, icon, color) VALUES
  (NULL, 'Contracts', 'Contract documents', '📄', '#3498db'),
  (NULL, 'Invoices', 'Invoice documents', '💰', '#27ae60'),
  (NULL, 'Property', 'Property documents', '🏠', '#e74c3c'),
  (NULL, 'Maintenance', 'Maintenance reports', '🔧', '#f39c12'),
  (NULL, 'Tenant', 'Tenant documents', '👤', '#9b59b6'),
  (NULL, 'Other', 'Other documents', '📎', '#95a5a6')
ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE documents IS 'Main document storage with versioning support';
COMMENT ON TABLE document_versions IS 'Version history of documents';
COMMENT ON TABLE document_sharing IS 'Document sharing permissions';
COMMENT ON TABLE document_access_log IS 'Audit trail for document access';
COMMENT ON TABLE document_templates IS 'Document templates for generation';
COMMENT ON COLUMN documents.checksum IS 'Document integrity verification';
COMMENT ON COLUMN document_versions.checksum IS 'Version file integrity checksum';
