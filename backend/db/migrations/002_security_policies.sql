-- Migration: Add security policies and audit tables
-- Purpose: Store configurable security policies and audit trails for compliance
-- Date: 2025-10-24

BEGIN;

-- ============================================
-- 1. Security Policies Table
-- ============================================

CREATE TABLE IF NOT EXISTS security_policies (
  id SERIAL PRIMARY KEY,
  
  -- Password policy
  password_min_length INTEGER DEFAULT 8 NOT NULL CHECK (password_min_length >= 8),
  password_require_upper BOOLEAN DEFAULT true NOT NULL,
  password_require_digit BOOLEAN DEFAULT true NOT NULL,
  password_require_special BOOLEAN DEFAULT false NOT NULL,
  password_expire_days INTEGER DEFAULT 180 CHECK (password_expire_days IS NULL OR password_expire_days > 0),
  password_history_count INTEGER DEFAULT 5 CHECK (password_history_count >= 0),
  
  -- Account lockout policy
  max_failed_login_attempts INTEGER DEFAULT 5 CHECK (max_failed_login_attempts > 0),
  lockout_duration_minutes INTEGER DEFAULT 30 CHECK (lockout_duration_minutes > 0),
  
  -- Session policy
  session_timeout_minutes INTEGER DEFAULT 60 CHECK (session_timeout_minutes > 0),
  session_max_concurrent INTEGER DEFAULT 3 CHECK (session_max_concurrent > 0),
  
  -- MFA policy
  require_mfa BOOLEAN DEFAULT false NOT NULL,
  
  -- IP whitelist/blacklist
  enable_ip_whitelist BOOLEAN DEFAULT false NOT NULL,
  enable_ip_blacklist BOOLEAN DEFAULT false NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT password_policies CHECK (
    (password_require_upper IS NOT NULL) AND 
    (password_require_digit IS NOT NULL) AND
    (password_require_special IS NOT NULL)
  )
);

CREATE TRIGGER security_policies_updated_at
BEFORE UPDATE ON security_policies
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

COMMENT ON TABLE security_policies IS 'Configurable security policies for password, session, and account management';
COMMENT ON COLUMN security_policies.password_min_length IS 'Minimum password length (minimum 8)';
COMMENT ON COLUMN security_policies.password_require_upper IS 'Require uppercase letters in password';
COMMENT ON COLUMN security_policies.password_require_digit IS 'Require digits in password';
COMMENT ON COLUMN security_policies.password_require_special IS 'Require special characters in password';
COMMENT ON COLUMN security_policies.password_expire_days IS 'Days until password expires (NULL = never)';
COMMENT ON COLUMN security_policies.password_history_count IS 'Number of previous passwords to remember';
COMMENT ON COLUMN security_policies.max_failed_login_attempts IS 'Failed attempts before lockout';
COMMENT ON COLUMN security_policies.lockout_duration_minutes IS 'Duration of account lockout in minutes';
COMMENT ON COLUMN security_policies.require_mfa IS 'Require multi-factor authentication';

-- Insert default policy
INSERT INTO security_policies (
  password_min_length,
  password_require_upper,
  password_require_digit,
  password_require_special,
  password_expire_days,
  password_history_count,
  max_failed_login_attempts,
  lockout_duration_minutes,
  session_timeout_minutes,
  session_max_concurrent,
  require_mfa,
  enable_ip_whitelist,
  enable_ip_blacklist
) VALUES (
  8,      -- password_min_length
  true,   -- password_require_upper
  true,   -- password_require_digit
  false,  -- password_require_special
  180,    -- password_expire_days
  5,      -- password_history_count
  5,      -- max_failed_login_attempts
  30,     -- lockout_duration_minutes
  60,     -- session_timeout_minutes
  3,      -- session_max_concurrent
  false,  -- require_mfa
  false,  -- enable_ip_whitelist
  false   -- enable_ip_blacklist
) ON CONFLICT DO NOTHING;

-- ============================================
-- 2. Audit Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Entity being audited
  entity_type VARCHAR(50) NOT NULL, -- 'user', 'contract', 'invoice', etc.
  entity_id INTEGER NOT NULL,
  
  -- Action information
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', etc.
  status VARCHAR(20) DEFAULT 'SUCCESS' NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  
  -- Actor information
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT, -- Human-readable description
  
  -- Metadata
  request_id VARCHAR(36), -- For correlation with logs
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  duration_ms INTEGER, -- How long the operation took
  
  -- Security
  sensitive_data_present BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance and security monitoring';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity being audited';
COMMENT ON COLUMN audit_logs.action IS 'The action performed (CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values of changed fields (JSONB)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values of changed fields (JSONB)';
COMMENT ON COLUMN audit_logs.sensitive_data_present IS 'Flag indicating if log contains sensitive data';

-- ============================================
-- 3. Failed Login Attempts Table
-- ============================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  
  user_id INTEGER,
  email VARCHAR(255),
  ip_address INET NOT NULL,
  
  attempt_count INTEGER DEFAULT 1 NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT at_least_email_or_user CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_failed_login_user ON failed_login_attempts(user_id);
CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_login_locked_until ON failed_login_attempts(locked_until);

CREATE TRIGGER failed_login_attempts_updated_at
BEFORE UPDATE ON failed_login_attempts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

COMMENT ON TABLE failed_login_attempts IS 'Track failed login attempts for account lockout';

-- ============================================
-- 4. IP Whitelist/Blacklist Tables
-- ============================================

CREATE TABLE IF NOT EXISTS ip_whitelist (
  id SERIAL PRIMARY KEY,
  
  ip_address INET NOT NULL UNIQUE,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT ip_format CHECK (family(ip_address) IN (4, 6))
);

CREATE INDEX idx_ip_whitelist_address ON ip_whitelist(ip_address);
CREATE INDEX idx_ip_whitelist_user ON ip_whitelist(user_id);
CREATE INDEX idx_ip_whitelist_expires ON ip_whitelist(expires_at);

COMMENT ON TABLE ip_whitelist IS 'Whitelist of IP addresses allowed to access system';
COMMENT ON COLUMN ip_whitelist.ip_address IS 'IPv4 or IPv6 address';
COMMENT ON COLUMN ip_whitelist.expires_at IS 'Optional expiration date';

CREATE TABLE IF NOT EXISTS ip_blacklist (
  id SERIAL PRIMARY KEY,
  
  ip_address INET NOT NULL UNIQUE,
  reason VARCHAR(255) NOT NULL, -- 'brute_force', 'suspicious_activity', 'manual_block', etc.
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT ip_format CHECK (family(ip_address) IN (4, 6))
);

CREATE INDEX idx_ip_blacklist_address ON ip_blacklist(ip_address);
CREATE INDEX idx_ip_blacklist_reason ON ip_blacklist(reason);
CREATE INDEX idx_ip_blacklist_expires ON ip_blacklist(expires_at);

COMMENT ON TABLE ip_blacklist IS 'Blacklist of IP addresses blocked from accessing system';

-- ============================================
-- 5. Password History Table
-- ============================================

CREATE TABLE IF NOT EXISTS password_history (
  id BIGSERIAL PRIMARY KEY,
  
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_password_history_user ON password_history(user_id, created_at DESC);

COMMENT ON TABLE password_history IS 'Track user password changes to prevent reuse';

-- ============================================
-- 6. Session Table
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  is_revoked BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_revoked ON sessions(is_revoked);

COMMENT ON TABLE sessions IS 'User sessions with expiration and revocation support';

-- ============================================
-- 7. Security Events Table
-- ============================================

CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  
  event_type VARCHAR(50) NOT NULL, 
  -- Examples: 'failed_login', 'password_changed', 'account_locked',
  -- 'suspicious_activity', 'mfa_enabled', 'ip_blacklist_added', etc.
  
  severity VARCHAR(10) DEFAULT 'INFO' NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  
  description TEXT NOT NULL,
  details JSONB,
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  acknowledged BOOLEAN DEFAULT false NOT NULL,
  acknowledged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX idx_security_events_unacknowledged ON security_events(acknowledged) 
  WHERE NOT acknowledged;

COMMENT ON TABLE security_events IS 'Real-time security events for monitoring and alerts';

-- ============================================
-- 8. Helper Function: Update Timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Helper Function: Check Password Policy
-- ============================================

CREATE OR REPLACE FUNCTION check_password_policy(password TEXT)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
DECLARE
  policy RECORD;
  message_list TEXT[] := '{}';
BEGIN
  SELECT * INTO policy FROM security_policies LIMIT 1;
  
  IF policy IS NULL THEN
    RETURN QUERY SELECT true, 'No policy configured'::TEXT;
    RETURN;
  END IF;
  
  -- Check length
  IF LENGTH(password) < policy.password_min_length THEN
    message_list := array_append(message_list, 
      'Password must be at least ' || policy.password_min_length || ' characters');
  END IF;
  
  -- Check uppercase
  IF policy.password_require_upper AND password !~ '[A-Z]' THEN
    message_list := array_append(message_list, 'Password must contain uppercase letter');
  END IF;
  
  -- Check digit
  IF policy.password_require_digit AND password !~ '[0-9]' THEN
    message_list := array_append(message_list, 'Password must contain digit');
  END IF;
  
  -- Check special character
  IF policy.password_require_special AND password !~ '[!@#$%^&*()_+\-=\[\]{};:'\'",.<>?/\\|`~]' THEN
    message_list := array_append(message_list, 'Password must contain special character');
  END IF;
  
  RETURN QUERY SELECT 
    (array_length(message_list, 1) IS NULL)::BOOLEAN,
    COALESCE(array_to_string(message_list, '; '), 'Password is valid');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_password_policy IS 'Validate password against current security policy';

-- ============================================
-- 10. Helper Function: Add Audit Log
-- ============================================

CREATE OR REPLACE FUNCTION add_audit_log(
  p_entity_type VARCHAR(50),
  p_entity_id INTEGER,
  p_action VARCHAR(50),
  p_user_id INTEGER,
  p_ip_address INET,
  p_user_agent TEXT,
  p_old_values JSONB,
  p_new_values JSONB,
  p_changes_summary TEXT,
  p_request_id VARCHAR(36),
  p_duration_ms INTEGER,
  p_sensitive_data_present BOOLEAN DEFAULT false
)
RETURNS BIGINT AS $$
DECLARE
  log_id BIGINT;
BEGIN
  INSERT INTO audit_logs (
    entity_type, entity_id, action, status,
    user_id, ip_address, user_agent,
    old_values, new_values, changes_summary,
    request_id, duration_ms, sensitive_data_present
  ) VALUES (
    p_entity_type, p_entity_id, p_action, 'SUCCESS',
    p_user_id, p_ip_address, p_user_agent,
    p_old_values, p_new_values, p_changes_summary,
    p_request_id, p_duration_ms, p_sensitive_data_present
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_audit_log IS 'Insert an audit log entry';

-- ============================================
-- 11. Helper Function: Check IP Allowed
-- ============================================

CREATE OR REPLACE FUNCTION is_ip_allowed(p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  policy RECORD;
BEGIN
  SELECT * INTO policy FROM security_policies LIMIT 1;
  
  IF policy IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if IP is blacklisted
  IF policy.enable_ip_blacklist THEN
    IF EXISTS (
      SELECT 1 FROM ip_blacklist 
      WHERE ip_address = p_ip_address 
      AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check if IP is whitelisted (if whitelist enabled)
  IF policy.enable_ip_whitelist THEN
    RETURN EXISTS (
      SELECT 1 FROM ip_whitelist 
      WHERE ip_address = p_ip_address 
      AND (expires_at IS NULL OR expires_at > NOW())
    );
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_ip_allowed IS 'Check if IP address is allowed to access system';

-- ============================================
-- Cleanup old audit logs (older than 1 year)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Remove audit logs older than 1 year';

-- ============================================
-- Cleanup expired sessions
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions IS 'Remove expired sessions';

-- ============================================
-- Cleanup expired IP whitelist entries
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_ip_whitelist()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ip_whitelist 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_ip_whitelist IS 'Remove expired IP whitelist entries';

COMMIT;
