-- =============================================================================
-- Access Audit Log Migration
-- =============================================================================
-- Purpose: Track all user access, modifications, and sensitive operations
-- Compliance: GDPR, SOC 2, audit trail requirements
-- =============================================================================

-- =============================================================================
-- 1. MAIN ACCESS AUDIT TABLE
-- =============================================================================

CREATE TABLE access_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  
  -- Resource change tracking
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Status & outcome
  status VARCHAR(20),
  error_message TEXT,
  
  -- Authentication context
  session_id UUID,
  auth_method VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accessed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 2. SENSITIVE OPERATIONS AUDIT TABLE
-- =============================================================================

CREATE TABLE sensitive_operations_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  operation_type VARCHAR(100) NOT NULL,
  operation_code VARCHAR(50) NOT NULL,
  
  -- Operation details
  description TEXT,
  risk_level VARCHAR(20),
  
  -- Resource affected
  resource_type VARCHAR(100),
  resource_id INT,
  resource_amount DECIMAL(15,2),
  
  -- Approval tracking
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(20),
  approved_by INT,
  approved_at TIMESTAMP,
  approval_reason TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  
  -- Timestamps
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =============================================================================
-- 3. DATA EXPORT AUDIT TABLE
-- =============================================================================

CREATE TABLE data_export_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  export_type VARCHAR(50) NOT NULL,
  
  -- Export details
  exported_records_count INT,
  exported_fields TEXT[],
  filters JSONB,
  
  -- File info
  file_name VARCHAR(255),
  file_hash VARCHAR(64),
  file_size_bytes INT,
  encryption_method VARCHAR(50),
  
  -- Delivery method
  delivery_method VARCHAR(50),
  delivery_recipient TEXT,
  
  -- Context
  reason_code VARCHAR(50),
  reason_description TEXT,
  
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  
  -- Status
  status VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 4. LOGIN ATTEMPT AUDIT TABLE
-- =============================================================================

CREATE TABLE login_attempt_audit (
  id BIGSERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  user_id INT,
  
  -- Authentication details
  auth_method VARCHAR(50),
  mfa_required BOOLEAN,
  mfa_verified BOOLEAN,
  
  -- Outcome
  success BOOLEAN,
  failure_reason VARCHAR(255),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  country_code VARCHAR(2),
  city VARCHAR(100),
  is_vpn BOOLEAN,
  is_tor BOOLEAN,
  
  -- Risk assessment
  risk_score INT,
  suspicious BOOLEAN,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- 5. PERMISSION CHANGE AUDIT TABLE
-- =============================================================================

CREATE TABLE permission_change_audit (
  id BIGSERIAL PRIMARY KEY,
  changed_by INT NOT NULL,
  user_id INT NOT NULL,
  
  -- Permission/Role changes
  change_type VARCHAR(50),
  role_name VARCHAR(100),
  permission_code VARCHAR(100),
  
  -- Before & after
  previous_roles TEXT[],
  new_roles TEXT[],
  previous_permissions TEXT[],
  new_permissions TEXT[],
  
  -- Reason
  change_reason TEXT,
  justification TEXT,
  
  -- Approval
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by INT,
  approved_at TIMESTAMP,
  
  -- Context
  ip_address INET,
  request_id UUID,
  
  effective_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =============================================================================
-- 6. DATA RETENTION AUDIT TABLE
-- =============================================================================

CREATE TABLE data_retention_audit (
  id BIGSERIAL PRIMARY KEY,
  retention_policy_id INT,
  
  -- Affected data
  entity_type VARCHAR(100),
  entity_ids INT[],
  record_count INT,
  
  -- Retention details
  retention_days INT,
  retention_reason VARCHAR(255),
  delete_reason VARCHAR(255),
  
  -- Action
  action_type VARCHAR(50),
  status VARCHAR(20),
  
  deleted_records_count INT,
  archived_records_count INT,
  
  -- Context
  executed_by INT,
  ip_address INET,
  request_id UUID,
  
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- 7. CONFIGURATION CHANGE AUDIT TABLE
-- =============================================================================

CREATE TABLE configuration_change_audit (
  id BIGSERIAL PRIMARY KEY,
  changed_by INT NOT NULL,
  
  -- Configuration details
  config_section VARCHAR(100),
  config_key VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  is_sensitive BOOLEAN,
  
  -- Context
  change_reason TEXT,
  ip_address INET,
  request_id UUID,
  
  -- Approval tracking
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(20),
  approved_by INT,
  approved_at TIMESTAMP,
  
  effective_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =============================================================================
-- 8. API TOKEN USAGE AUDIT TABLE
-- =============================================================================

CREATE TABLE api_token_usage_audit (
  id BIGSERIAL PRIMARY KEY,
  token_id INT NOT NULL,
  user_id INT NOT NULL,
  
  -- API request details
  endpoint_path VARCHAR(255),
  http_method VARCHAR(10),
  
  -- Request/Response
  request_body_size INT,
  response_status_code INT,
  response_size INT,
  
  -- Performance
  response_time_ms INT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (token_id) REFERENCES api_tokens(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 9. COMPLIANCE REPORT TABLE
-- =============================================================================

CREATE TABLE compliance_reports (
  id BIGSERIAL PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  
  -- Report details
  title VARCHAR(255),
  description TEXT,
  
  -- Filters
  start_date DATE,
  end_date DATE,
  user_ids INT[],
  entity_types VARCHAR(100)[],
  
  -- Report content
  content JSONB,
  total_records INT,
  
  -- Delivery
  generated_by INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_method VARCHAR(50),
  delivered_to TEXT[],
  delivered_at TIMESTAMP,
  
  -- File
  file_name VARCHAR(255),
  file_hash VARCHAR(64),
  
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- 10. AUDIT SUMMARY TABLE (for performance)
-- =============================================================================

CREATE TABLE audit_summary (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  
  -- Daily statistics
  total_access_logs INT,
  total_failed_logins INT,
  total_permission_changes INT,
  total_data_exports INT,
  total_sensitive_operations INT,
  total_config_changes INT,
  
  -- Risk metrics
  suspicious_logins INT,
  blocked_attacks INT,
  policy_violations INT,
  
  -- User activity
  active_users INT,
  new_users INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Access audit indexes
CREATE INDEX idx_access_audit_user_id ON access_audit(user_id);
CREATE INDEX idx_access_audit_entity ON access_audit(entity_type, entity_id);
CREATE INDEX idx_access_audit_created ON access_audit(created_at DESC);
CREATE INDEX idx_access_audit_action ON access_audit(action);
CREATE INDEX idx_access_audit_status ON access_audit(status);
CREATE INDEX idx_access_audit_request_id ON access_audit(request_id);

-- Sensitive operations indexes
CREATE INDEX idx_sensitive_ops_user ON sensitive_operations_audit(user_id);
CREATE INDEX idx_sensitive_ops_type ON sensitive_operations_audit(operation_type);
CREATE INDEX idx_sensitive_ops_status ON sensitive_operations_audit(approval_status);
CREATE INDEX idx_sensitive_ops_initiated ON sensitive_operations_audit(initiated_at DESC);

-- Data export indexes
CREATE INDEX idx_export_audit_user ON data_export_audit(user_id);
CREATE INDEX idx_export_audit_type ON data_export_audit(export_type);
CREATE INDEX idx_export_audit_created ON data_export_audit(created_at DESC);

-- Login attempt indexes
CREATE INDEX idx_login_attempt_user ON login_attempt_audit(user_id);
CREATE INDEX idx_login_attempt_email ON login_attempt_audit(user_email);
CREATE INDEX idx_login_attempt_created ON login_attempt_audit(created_at DESC);
CREATE INDEX idx_login_attempt_ip ON login_attempt_audit(ip_address);
CREATE INDEX idx_login_attempt_success ON login_attempt_audit(success);

-- Permission change indexes
CREATE INDEX idx_perm_change_user ON permission_change_audit(user_id);
CREATE INDEX idx_perm_change_changed_by ON permission_change_audit(changed_by);
CREATE INDEX idx_perm_change_created ON permission_change_audit(created_at DESC);

-- Data retention indexes
CREATE INDEX idx_retention_entity ON data_retention_audit(entity_type);
CREATE INDEX idx_retention_executed ON data_retention_audit(executed_at DESC);

-- Configuration change indexes
CREATE INDEX idx_config_change_section ON configuration_change_audit(config_section);
CREATE INDEX idx_config_change_created ON configuration_change_audit(created_at DESC);
CREATE INDEX idx_config_change_user ON configuration_change_audit(changed_by);

-- API token usage indexes
CREATE INDEX idx_api_token_usage_token ON api_token_usage_audit(token_id);
CREATE INDEX idx_api_token_usage_user ON api_token_usage_audit(user_id);
CREATE INDEX idx_api_token_usage_created ON api_token_usage_audit(created_at DESC);
CREATE INDEX idx_api_token_usage_endpoint ON api_token_usage_audit(endpoint_path);

-- Compliance report indexes
CREATE INDEX idx_compliance_report_type ON compliance_reports(report_type);
CREATE INDEX idx_compliance_report_generated ON compliance_reports(generated_at DESC);

-- Audit summary indexes
CREATE INDEX idx_audit_summary_date ON audit_summary(date DESC);

-- =============================================================================
-- PARTITIONING FOR LARGE TABLES (monthly partitions)
-- =============================================================================

-- Create partitioned access_audit table (monthly)
-- This improves query performance for large datasets

-- Example partition creation (to be run in application/deployment)
-- CREATE TABLE access_audit_2025_10 PARTITION OF access_audit
--   FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- =============================================================================
-- VIEWS FOR AUDIT ANALYSIS
-- =============================================================================

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.email,
  COUNT(DISTINCT aa.id) as total_actions,
  COUNT(DISTINCT CASE WHEN aa.action = 'login' THEN aa.id END) as login_count,
  COUNT(DISTINCT CASE WHEN aa.status = 'failed' THEN aa.id END) as failed_actions,
  MAX(aa.created_at) as last_activity,
  MIN(aa.created_at) as first_activity,
  COUNT(DISTINCT aa.ip_address) as unique_ips
FROM users u
LEFT JOIN access_audit aa ON u.id = aa.user_id
GROUP BY u.id, u.email;

-- Sensitive operations awaiting approval
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
  soa.id,
  soa.operation_type,
  soa.operation_code,
  u.email as requested_by,
  soa.initiated_at,
  soa.resource_type,
  soa.resource_id,
  soa.risk_level
FROM sensitive_operations_audit soa
JOIN users u ON soa.user_id = u.id
WHERE soa.approval_status = 'pending'
ORDER BY soa.risk_level DESC, soa.initiated_at;

-- Failed login attempts by IP
CREATE OR REPLACE VIEW failed_login_analysis AS
SELECT 
  ip_address,
  COUNT(*) as failed_attempts,
  COUNT(DISTINCT user_email) as unique_users_targeted,
  MAX(created_at) as latest_attempt,
  AVG(risk_score) as avg_risk_score,
  COUNT(CASE WHEN suspicious THEN 1 END) as suspicious_count
FROM login_attempt_audit
WHERE success = FALSE
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 3
ORDER BY failed_attempts DESC;

-- Data exports by user
CREATE OR REPLACE VIEW data_export_summary AS
SELECT 
  u.email,
  COUNT(*) as export_count,
  SUM(exported_records_count) as total_records_exported,
  SUM(file_size_bytes) as total_size_bytes,
  array_agg(DISTINCT export_type) as export_types,
  MAX(created_at) as last_export
FROM data_export_audit dea
JOIN users u ON dea.user_id = u.id
GROUP BY u.email
ORDER BY export_count DESC;

-- Permission changes audit trail
CREATE OR REPLACE VIEW permission_changes_trail AS
SELECT 
  pca.id,
  changed_by_user.email as changed_by,
  affected_user.email as user_affected,
  pca.change_type,
  pca.previous_roles,
  pca.new_roles,
  pca.change_reason,
  pca.created_at
FROM permission_change_audit pca
JOIN users changed_by_user ON pca.changed_by = changed_by_user.id
JOIN users affected_user ON pca.user_id = affected_user.id
ORDER BY pca.created_at DESC;

-- =============================================================================
-- STORED PROCEDURES
-- =============================================================================

-- Log access event
CREATE OR REPLACE FUNCTION log_access(
  p_user_id INT,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id INT,
  p_description TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_request_id UUID
) RETURNS BIGINT AS $$
DECLARE
  v_audit_id BIGINT;
BEGIN
  INSERT INTO access_audit (
    user_id,
    action,
    entity_type,
    entity_id,
    description,
    ip_address,
    user_agent,
    request_id,
    status
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_description,
    p_ip_address,
    p_user_agent,
    p_request_id,
    'success'
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Log permission change
CREATE OR REPLACE FUNCTION log_permission_change(
  p_changed_by INT,
  p_user_id INT,
  p_change_type VARCHAR,
  p_new_roles TEXT[],
  p_reason TEXT
) RETURNS BIGINT AS $$
DECLARE
  v_old_roles TEXT[];
  v_audit_id BIGINT;
BEGIN
  SELECT array_agg(r.name)
  INTO v_old_roles
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;
  
  INSERT INTO permission_change_audit (
    changed_by,
    user_id,
    change_type,
    previous_roles,
    new_roles,
    change_reason,
    created_at
  ) VALUES (
    p_changed_by,
    p_user_id,
    p_change_type,
    v_old_roles,
    p_new_roles,
    p_reason,
    NOW()
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_retention_days INT
) RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM access_audit
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC LOGGING
-- =============================================================================

-- Trigger to log user updates
CREATE OR REPLACE FUNCTION trigger_log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO access_audit (
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      changed_fields,
      status
    ) VALUES (
      NEW.id,
      'update',
      'users',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      ARRAY(SELECT key FROM jsonb_each(to_jsonb(NEW)) WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key),
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
CREATE TRIGGER users_audit_trigger
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_log_user_changes();

-- =============================================================================
-- SAMPLE DATA (for testing)
-- =============================================================================

-- Insert sample audit entries (commented out for production)
-- INSERT INTO access_audit (user_id, action, entity_type, entity_id, description, status)
-- VALUES (1, 'login', 'auth', 1, 'User login successful', 'success');

-- INSERT INTO login_attempt_audit (user_email, success, ip_address)
-- VALUES ('admin@akig.com', true, '203.0.113.42');

-- =============================================================================
-- GRANTS (security)
-- =============================================================================

-- Only audit role can insert/update audit tables
-- GRANT INSERT, SELECT ON access_audit TO audit_role;
-- GRANT INSERT, SELECT ON login_attempt_audit TO audit_role;
-- GRANT SELECT ON user_activity_summary TO report_role;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE access_audit IS 'Complete audit trail of all user access and operations';
COMMENT ON TABLE sensitive_operations_audit IS 'High-risk operations requiring approval and tracking';
COMMENT ON TABLE data_export_audit IS 'All data export operations with full details';
COMMENT ON TABLE login_attempt_audit IS 'All login attempts including failed logins for security';
COMMENT ON TABLE permission_change_audit IS 'Audit trail for all permission and role changes';
COMMENT ON COLUMN access_audit.old_values IS 'Previous values before change (JSON)';
COMMENT ON COLUMN access_audit.new_values IS 'New values after change (JSON)';
COMMENT ON VIEW user_activity_summary IS 'Aggregated user activity metrics';
COMMENT ON VIEW failed_login_analysis IS 'Analysis of failed login attempts with risk scoring';
