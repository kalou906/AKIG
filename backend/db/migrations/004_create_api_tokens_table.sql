-- Migration: Create API tokens table
-- Description: Manages API tokens for user authentication and authorization
-- Purpose: Allows users to generate revocable API tokens with specific scopes
-- Created: 2025-10-25

BEGIN;

-- Create the api_tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL, -- Array of scopes: {'read', 'write', 'admin', 'payments', 'exports', 'contracts'}
  name VARCHAR(255), -- Friendly name for the token (e.g., "Production API", "CI/CD Token")
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP, -- NULL means no expiration
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(255)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_api_tokens_revoked ON api_tokens(revoked);
CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at);

-- Create index for active tokens (not revoked, not expired)
CREATE INDEX IF NOT EXISTS idx_api_tokens_active 
ON api_tokens(user_id, revoked) 
WHERE revoked = false AND (expires_at IS NULL OR expires_at > NOW());

-- Create audit table for API token activity
CREATE TABLE IF NOT EXISTS api_token_audit_log (
  id SERIAL PRIMARY KEY,
  api_token_id INT NOT NULL REFERENCES api_tokens(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'used', 'revoked', 'rotated'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_api_token_audit_token_id ON api_token_audit_log(api_token_id);
CREATE INDEX IF NOT EXISTS idx_api_token_audit_action ON api_token_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_api_token_audit_created_at ON api_token_audit_log(created_at);

-- Add comment to table
COMMENT ON TABLE api_tokens IS 'Stores API tokens for programmatic access with scope-based permissions';
COMMENT ON COLUMN api_tokens.token IS 'Hashed API token (store hashed version for security)';
COMMENT ON COLUMN api_tokens.scopes IS 'Array of permission scopes granted to this token';
COMMENT ON COLUMN api_tokens.last_used_at IS 'Timestamp of the last successful API call using this token';
COMMENT ON COLUMN api_tokens.expires_at IS 'Token expiration timestamp; NULL means no expiration';
COMMENT ON COLUMN api_tokens.revoked IS 'Whether the token has been revoked and is no longer usable';

-- Add trigger to update last_used_at (can be called from application)
CREATE OR REPLACE FUNCTION update_api_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate data on insert/update
CREATE OR REPLACE FUNCTION validate_api_token_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that token is not empty
  IF NEW.token IS NULL OR NEW.token = '' THEN
    RAISE EXCEPTION 'API token cannot be empty';
  END IF;
  
  -- Validate that scopes array is not empty
  IF NEW.scopes IS NULL OR array_length(NEW.scopes, 1) IS NULL THEN
    RAISE EXCEPTION 'API token must have at least one scope';
  END IF;
  
  -- Validate that only valid scopes are used
  -- Valid scopes: read, write, admin, payments, exports, contracts, notifications
  IF NOT (NEW.scopes <@ ARRAY['read', 'write', 'admin', 'payments', 'exports', 'contracts', 'notifications']) THEN
    RAISE EXCEPTION 'Invalid scope in token. Valid scopes: read, write, admin, payments, exports, contracts, notifications';
  END IF;
  
  -- If revoking, set revoked_at timestamp
  IF NEW.revoked = true AND OLD.revoked = false THEN
    NEW.revoked_at = NOW();
  END IF;
  
  -- If un-revoking, clear revoked_at
  IF NEW.revoked = false AND OLD.revoked = true THEN
    NEW.revoked_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_api_token_data_trigger ON api_tokens;
CREATE TRIGGER validate_api_token_data_trigger
BEFORE INSERT OR UPDATE ON api_tokens
FOR EACH ROW
EXECUTE FUNCTION validate_api_token_data();

-- Create function to revoke token
CREATE OR REPLACE FUNCTION revoke_api_token(token_id INT, reason VARCHAR DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE api_tokens
  SET revoked = true,
      revoked_at = NOW(),
      revoked_reason = reason
  WHERE id = token_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get active tokens for user
CREATE OR REPLACE FUNCTION get_active_user_tokens(user_id_param INT)
RETURNS TABLE (
  id INT,
  name VARCHAR,
  scopes TEXT[],
  created_at TIMESTAMP,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    api_tokens.id,
    api_tokens.name,
    api_tokens.scopes,
    api_tokens.created_at,
    api_tokens.last_used_at,
    api_tokens.expires_at
  FROM api_tokens
  WHERE api_tokens.user_id = user_id_param
    AND api_tokens.revoked = false
    AND (api_tokens.expires_at IS NULL OR api_tokens.expires_at > NOW())
  ORDER BY api_tokens.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Ensure migration tracking table entry
INSERT INTO schema_migrations (name, description, executed_at)
VALUES ('004_create_api_tokens_table', 'Create API tokens table with scopes and audit logging', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;
