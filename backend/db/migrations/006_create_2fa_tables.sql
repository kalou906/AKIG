-- Migration: Create 2FA tables
-- Description: Two-factor authentication with TOTP and backup codes
-- Purpose: Enable secure 2FA for user accounts with recovery options
-- Created: 2025-10-25

BEGIN;

-- Create user 2FA settings table
CREATE TABLE IF NOT EXISTS user_2fa (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- TOTP secret (encrypted in application)
  enabled BOOLEAN DEFAULT false, -- Whether 2FA is enabled
  backup_codes TEXT[] DEFAULT '{}'::text[], -- Hashed backup codes
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP, -- When 2FA was last used
  method VARCHAR(50) DEFAULT 'totp' CHECK (method IN ('totp', 'sms', 'email')) -- 2FA method
);

-- Create 2FA verification log for audit trail
CREATE TABLE IF NOT EXISTS user_2fa_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('generated', 'enabled', 'disabled', 'verified', 'backup_used', 'failed')),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create session 2FA state table (for pending 2FA verification)
CREATE TABLE IF NOT EXISTS pending_2fa (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL, -- Session before 2FA verification
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(enabled);
CREATE INDEX IF NOT EXISTS idx_user_2fa_method ON user_2fa(method);

CREATE INDEX IF NOT EXISTS idx_user_2fa_logs_user_id ON user_2fa_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_logs_action ON user_2fa_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_2fa_logs_created_at ON user_2fa_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pending_2fa_user_id ON pending_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_2fa_session_token ON pending_2fa(session_token);
CREATE INDEX IF NOT EXISTS idx_pending_2fa_expires_at ON pending_2fa(expires_at);

-- Create composite index for finding active pending 2FA
CREATE INDEX IF NOT EXISTS idx_pending_2fa_active 
ON pending_2fa(user_id, expires_at DESC) 
WHERE expires_at > NOW();

-- Update user_2fa on update
CREATE OR REPLACE FUNCTION update_user_2fa_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_2fa_timestamp_trigger ON user_2fa;
CREATE TRIGGER update_user_2fa_timestamp_trigger
BEFORE UPDATE ON user_2fa
FOR EACH ROW
EXECUTE FUNCTION update_user_2fa_timestamp();

-- Validate 2FA data
CREATE OR REPLACE FUNCTION validate_2fa_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure secret is not empty
  IF NEW.secret IS NULL OR NEW.secret = '' THEN
    RAISE EXCEPTION '2FA secret cannot be empty';
  END IF;
  
  -- If enabling 2FA, ensure backup codes exist
  IF NEW.enabled AND (NEW.backup_codes IS NULL OR array_length(NEW.backup_codes, 1) IS NULL) THEN
    RAISE EXCEPTION '2FA requires backup codes to be enabled';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_2fa_data_trigger ON user_2fa;
CREATE TRIGGER validate_2fa_data_trigger
BEFORE INSERT OR UPDATE ON user_2fa
FOR EACH ROW
EXECUTE FUNCTION validate_2fa_data();

-- Function to create 2FA setup
CREATE OR REPLACE FUNCTION create_2fa_setup(
  p_user_id INT,
  p_secret TEXT,
  p_method VARCHAR DEFAULT 'totp'
)
RETURNS user_2fa AS $$
DECLARE
  v_2fa user_2fa;
BEGIN
  INSERT INTO user_2fa (user_id, secret, method, enabled)
  VALUES (p_user_id, p_secret, p_method, false)
  ON CONFLICT (user_id) DO UPDATE
  SET secret = p_secret, method = p_method
  RETURNING * INTO v_2fa;
  
  -- Log the action
  INSERT INTO user_2fa_logs (user_id, action, details)
  VALUES (p_user_id, 'generated', jsonb_build_object('method', p_method));
  
  RETURN v_2fa;
END;
$$ LANGUAGE plpgsql;

-- Function to enable 2FA
CREATE OR REPLACE FUNCTION enable_2fa(
  p_user_id INT,
  p_backup_codes TEXT[]
)
RETURNS user_2fa AS $$
DECLARE
  v_2fa user_2fa;
BEGIN
  UPDATE user_2fa
  SET enabled = true, backup_codes = p_backup_codes, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_2fa;
  
  -- Log the action
  INSERT INTO user_2fa_logs (user_id, action, details)
  VALUES (
    p_user_id, 
    'enabled', 
    jsonb_build_object('backup_codes_count', array_length(p_backup_codes, 1))
  );
  
  RETURN v_2fa;
END;
$$ LANGUAGE plpgsql;

-- Function to disable 2FA
CREATE OR REPLACE FUNCTION disable_2fa(
  p_user_id INT,
  p_reason VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_2fa
  SET enabled = false, secret = '', backup_codes = '{}'::text[], updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the action
  INSERT INTO user_2fa_logs (user_id, action, details)
  VALUES (p_user_id, 'disabled', jsonb_build_object('reason', p_reason));
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to log 2FA verification
CREATE OR REPLACE FUNCTION log_2fa_verification(
  p_user_id INT,
  p_action VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS user_2fa_logs AS $$
DECLARE
  v_log user_2fa_logs;
BEGIN
  INSERT INTO user_2fa_logs (user_id, action, ip_address, details)
  VALUES (p_user_id, p_action, p_ip_address, p_details)
  RETURNING * INTO v_log;
  
  -- Update last_used_at for successful verification
  IF p_action = 'verified' THEN
    UPDATE user_2fa SET last_used_at = NOW() WHERE user_id = p_user_id;
  END IF;
  
  RETURN v_log;
END;
$$ LANGUAGE plpgsql;

-- Function to create pending 2FA session
CREATE OR REPLACE FUNCTION create_pending_2fa(
  p_user_id INT,
  p_session_token TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_expires_in_minutes INT DEFAULT 15
)
RETURNS pending_2fa AS $$
DECLARE
  v_pending pending_2fa;
BEGIN
  INSERT INTO pending_2fa (user_id, session_token, ip_address, user_agent, expires_at)
  VALUES (p_user_id, p_session_token, p_ip_address, p_user_agent, NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL)
  RETURNING * INTO v_pending;
  
  RETURN v_pending;
END;
$$ LANGUAGE plpgsql;

-- Function to get and verify pending 2FA session
CREATE OR REPLACE FUNCTION get_pending_2fa_session(
  p_session_token TEXT
)
RETURNS TABLE(
  session_id INT,
  user_id INT,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pending_2fa.id,
    pending_2fa.user_id,
    pending_2fa.ip_address,
    pending_2fa.user_agent,
    pending_2fa.expires_at,
    pending_2fa.expires_at < NOW() AS is_expired
  FROM pending_2fa
  WHERE session_token = p_session_token;
END;
$$ LANGUAGE plpgsql;

-- Function to complete 2FA verification and create session
CREATE OR REPLACE FUNCTION complete_2fa_verification(
  p_session_token TEXT
)
RETURNS TABLE(
  user_id INT,
  verified_at TIMESTAMP
) AS $$
DECLARE
  v_user_id INT;
BEGIN
  -- Get user ID from pending session
  SELECT pending_2fa.user_id INTO v_user_id
  FROM pending_2fa
  WHERE session_token = p_session_token AND expires_at > NOW();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired 2FA session';
  END IF;
  
  -- Delete the pending session
  DELETE FROM pending_2fa WHERE session_token = p_session_token;
  
  -- Log successful verification
  INSERT INTO user_2fa_logs (user_id, action)
  VALUES (v_user_id, 'verified');
  
  RETURN QUERY SELECT v_user_id, NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired pending 2FA sessions
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_sessions()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  DELETE FROM pending_2fa WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to get 2FA statistics
CREATE OR REPLACE FUNCTION get_2fa_statistics()
RETURNS TABLE(
  total_users BIGINT,
  users_with_2fa BIGINT,
  users_with_2fa_enabled BIGINT,
  adoption_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM users)::BIGINT,
    (SELECT COUNT(*) FROM user_2fa)::BIGINT,
    (SELECT COUNT(*) FROM user_2fa WHERE enabled = true)::BIGINT,
    ROUND(
      ((SELECT COUNT(*) FROM user_2fa WHERE enabled = true)::NUMERIC / 
       NULLIF((SELECT COUNT(*) FROM users)::NUMERIC, 0) * 100),
      2
    );
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE user_2fa IS 'User 2FA settings and secrets';
COMMENT ON TABLE user_2fa_logs IS 'Audit trail for 2FA events';
COMMENT ON TABLE pending_2fa IS 'Pending 2FA verification sessions';

COMMENT ON COLUMN user_2fa.secret IS 'TOTP secret (encrypted by application)';
COMMENT ON COLUMN user_2fa.backup_codes IS 'Array of hashed backup codes for recovery';
COMMENT ON COLUMN user_2fa.enabled IS 'Whether 2FA is active for user';
COMMENT ON COLUMN user_2fa.method IS 'Authentication method (totp, sms, email)';
COMMENT ON COLUMN user_2fa_logs.action IS 'Action type: generated, enabled, disabled, verified, backup_used, failed';

-- Ensure migration tracking
INSERT INTO schema_migrations (name, description, executed_at)
VALUES ('006_create_2fa_tables', 'Create 2FA tables with TOTP support and backup codes', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;
