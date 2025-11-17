-- Migration: Add feature flags table
-- Purpose: Store feature flags with scope-based control (user, tenant, global)
-- Date: 2025-10-25

BEGIN;

-- ============================================
-- 1. Feature Flags Table
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  scope JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT valid_scope CHECK (jsonb_typeof(scope) = 'object')
);

-- ============================================
-- 2. Feature Flag Audit Log
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flag_audit (
  id SERIAL PRIMARY KEY,
  flag_id INTEGER NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_value JSONB,
  new_value JSONB,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. Feature Flag Usage Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flag_usage (
  id SERIAL PRIMARY KEY,
  flag_id INTEGER NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  result BOOLEAN DEFAULT true
);

-- ============================================
-- 4. Indexes
-- ============================================

CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flag_audit_flag_id ON feature_flag_audit(flag_id);
CREATE INDEX idx_feature_flag_audit_changed_at ON feature_flag_audit(changed_at);
CREATE INDEX idx_feature_flag_usage_flag_id ON feature_flag_usage(flag_id);
CREATE INDEX idx_feature_flag_usage_user_id ON feature_flag_usage(user_id);
CREATE INDEX idx_feature_flag_usage_accessed_at ON feature_flag_usage(accessed_at);

-- ============================================
-- 5. Audit Trigger
-- ============================================

CREATE OR REPLACE FUNCTION trigger_feature_flag_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feature_flag_audit (flag_id, action, old_value, new_value, changed_by)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_ARGV[0]::VARCHAR,
    to_jsonb(OLD),
    to_jsonb(NEW),
    CURRENT_SETTING('app.current_user_id', TRUE)::INTEGER
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_audit_insert
AFTER INSERT ON feature_flags
FOR EACH ROW EXECUTE FUNCTION trigger_feature_flag_audit('create');

CREATE TRIGGER feature_flags_audit_update
AFTER UPDATE ON feature_flags
FOR EACH ROW EXECUTE FUNCTION trigger_feature_flag_audit('update');

CREATE TRIGGER feature_flags_audit_delete
AFTER DELETE ON feature_flags
FOR EACH ROW EXECUTE FUNCTION trigger_feature_flag_audit('delete');

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Check if a feature is enabled for a user/tenant
CREATE OR REPLACE FUNCTION is_feature_enabled(
  p_flag_key TEXT,
  p_user_id INTEGER DEFAULT NULL,
  p_tenant_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_flag_enabled BOOLEAN;
  v_scope JSONB;
  v_user_enabled BOOLEAN;
  v_tenant_enabled BOOLEAN;
BEGIN
  -- Get feature flag and its scope
  SELECT enabled, scope INTO v_flag_enabled, v_scope
  FROM feature_flags
  WHERE key = p_flag_key;

  -- If flag doesn't exist, return false
  IF v_flag_enabled IS NULL THEN
    RETURN FALSE;
  END IF;

  -- If flag is globally disabled, return false
  IF NOT v_flag_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check scope restrictions
  IF v_scope IS NOT NULL AND v_scope != '{}' THEN
    -- Check user scope
    IF p_user_id IS NOT NULL THEN
      v_user_enabled := (v_scope ->> 'users') IS NULL 
        OR v_scope -> 'users' ? p_user_id::TEXT;
      IF NOT v_user_enabled THEN
        RETURN FALSE;
      END IF;
    END IF;

    -- Check tenant scope
    IF p_tenant_id IS NOT NULL THEN
      v_tenant_enabled := (v_scope ->> 'tenants') IS NULL 
        OR v_scope -> 'tenants' ? p_tenant_id::TEXT;
      IF NOT v_tenant_enabled THEN
        RETURN FALSE;
      END IF;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all enabled features for a user
CREATE OR REPLACE FUNCTION get_user_features(p_user_id INTEGER)
RETURNS TABLE(key TEXT, enabled BOOLEAN, scope JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT ff.key, ff.enabled, ff.scope
  FROM feature_flags ff
  WHERE is_feature_enabled(ff.key, p_user_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- Record feature usage
CREATE OR REPLACE FUNCTION record_feature_usage(
  p_flag_key TEXT,
  p_user_id INTEGER DEFAULT NULL,
  p_result BOOLEAN DEFAULT TRUE
) RETURNS VOID AS $$
DECLARE
  v_flag_id INTEGER;
BEGIN
  SELECT id INTO v_flag_id
  FROM feature_flags
  WHERE key = p_flag_key;

  IF v_flag_id IS NOT NULL THEN
    INSERT INTO feature_flag_usage (flag_id, user_id, result)
    VALUES (v_flag_id, p_user_id, p_result);
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
