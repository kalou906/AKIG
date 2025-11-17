/**
 * 🗄️ Database Schema Migrations for Advanced Features (Phase 7)
 * 
 * Run these migrations to support the new services
 */

-- ============================================================
-- SECURITY SERVICE TABLES
-- ============================================================

-- MFA Codes Table
CREATE TABLE IF NOT EXISTS mfa_codes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  code_hash VARCHAR(256) NOT NULL,
  method VARCHAR(50) NOT NULL CHECK (method IN ('email', 'sms')),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_code_per_user UNIQUE(user_id, method)
);

CREATE INDEX idx_mfa_codes_user_id ON mfa_codes(user_id);
CREATE INDEX idx_mfa_codes_expires_at ON mfa_codes(expires_at);

-- Active Sessions Table
CREATE TABLE IF NOT EXISTS active_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  session_token VARCHAR(256) NOT NULL UNIQUE,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  location VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX idx_active_sessions_expires_at ON active_sessions(expires_at);

-- Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_event_type ON audit_trail(event_type);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at DESC);
CREATE INDEX idx_audit_trail_details ON audit_trail USING GIN(details);

-- ============================================================
-- GAMIFICATION SERVICE TABLES
-- ============================================================

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  awarded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_badges_agent_id ON badges(agent_id);
CREATE INDEX idx_badges_type ON badges(type);
CREATE INDEX idx_badges_awarded_at ON badges(awarded_at DESC);

-- Training Completion Table
CREATE TABLE IF NOT EXISTS training_completion (
  id SERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL,
  quiz_score INTEGER,
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_agent_id ON training_completion(agent_id);
CREATE INDEX idx_training_module_id ON training_completion(module_id);
CREATE UNIQUE INDEX idx_training_unique ON training_completion(agent_id, module_id);

-- ============================================================
-- UX SERVICE TABLES
-- ============================================================

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(50) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'highContrast')),
  font_size VARCHAR(50) DEFAULT 'base',
  language VARCHAR(10) DEFAULT 'en',
  high_contrast BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,
  screen_reader BOOLEAN DEFAULT false,
  tutorials_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Completed Tutorials Table
CREATE TABLE IF NOT EXISTS completed_tutorials (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  tutorial_key VARCHAR(100) NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_tutorial_completion UNIQUE(user_id, tutorial_key)
);

CREATE INDEX idx_completed_tutorials_user_id ON completed_tutorials(user_id);

-- ============================================================
-- PUBLIC API SERVICE TABLES
-- ============================================================

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(256) NOT NULL UNIQUE,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  request_count INTEGER DEFAULT 0,
  reset_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_api_keys_partner_id ON api_keys(partner_id);
CREATE INDEX idx_api_keys_active ON api_keys(active);
CREATE INDEX idx_api_keys_created_at ON api_keys(created_at DESC);

-- Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  events JSONB NOT NULL,
  secret VARCHAR(256) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_partner_id ON webhooks(partner_id);
CREATE INDEX idx_webhooks_active ON webhooks(active);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

-- API Audit Log Table
CREATE TABLE IF NOT EXISTS api_audit_log (
  id BIGSERIAL PRIMARY KEY,
  api_key_hash VARCHAR(256) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_audit_log_key ON api_audit_log(api_key_hash);
CREATE INDEX idx_api_audit_log_endpoint ON api_audit_log(endpoint);
CREATE INDEX idx_api_audit_log_timestamp ON api_audit_log(timestamp DESC);

-- ============================================================
-- OFFLINE SERVICE TABLES (Optional persistence)
-- ============================================================

-- Sync Queue Table
CREATE TABLE IF NOT EXISTS sync_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_created_at ON sync_queue(created_at);

-- ============================================================
-- AGENT RATINGS TABLE (For gamification & recommendations)
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_ratings (
  id SERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_ratings_agent_id ON agent_ratings(agent_id);
CREATE INDEX idx_agent_ratings_created_at ON agent_ratings(created_at DESC);

-- ============================================================
-- COUNTRY & TAX CONFIGURATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS country_config (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  currency_symbol VARCHAR(5) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) NOT NULL,
  tax_rate NUMERIC(5,4) NOT NULL,
  deposit_max_months NUMERIC(3,1) NOT NULL,
  notice_required_days INTEGER NOT NULL,
  config_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_country_config_code ON country_config(country_code);

-- Pre-populate country configurations
INSERT INTO country_config (country_code, country_name, currency_code, currency_symbol, language, timezone, tax_rate, deposit_max_months, notice_required_days, config_data)
VALUES
  ('GN', 'Guinea', 'GNF', 'FG', 'fr', 'Africa/Conakry', 0.18, 1.0, 30, '{}'),
  ('US', 'United States', 'USD', '$', 'en', 'America/New_York', 0.20, 1.5, 30, '{}'),
  ('FR', 'France', 'EUR', '€', 'fr', 'Europe/Paris', 0.20, 2.0, 90, '{}'),
  ('SN', 'Senegal', 'XOF', 'CFA', 'fr', 'Africa/Dakar', 0.18, 1.0, 30, '{}')
ON CONFLICT (country_code) DO NOTHING;

-- ============================================================
-- PARTNERS TABLE (For public API)
-- ============================================================

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  api_tier VARCHAR(50) DEFAULT 'free',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_partners_email ON partners(email);

-- ============================================================
-- GRANTS & VIEWS
-- ============================================================

-- Grant permissions to backend service role
GRANT SELECT, INSERT, UPDATE ON mfa_codes TO akig_service;
GRANT SELECT, INSERT, UPDATE ON active_sessions TO akig_service;
GRANT INSERT ON audit_trail TO akig_service;
GRANT SELECT ON audit_trail TO akig_service;
GRANT SELECT, INSERT ON badges TO akig_service;
GRANT SELECT, INSERT ON training_completion TO akig_service;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO akig_service;
GRANT INSERT ON completed_tutorials TO akig_service;
GRANT SELECT, INSERT, UPDATE ON api_keys TO akig_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO akig_service;
GRANT INSERT ON api_audit_log TO akig_service;
GRANT SELECT, INSERT, UPDATE ON sync_queue TO akig_service;
GRANT SELECT, INSERT ON agent_ratings TO akig_service;
GRANT SELECT ON country_config TO akig_service;
GRANT SELECT, INSERT ON partners TO akig_service;

-- ============================================================
-- HELPFUL QUERIES FOR VERIFICATION
-- ============================================================

-- Check if tables were created successfully
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
-- AND tablename IN ('mfa_codes', 'active_sessions', 'audit_trail', 'badges', 
--   'training_completion', 'user_preferences', 'completed_tutorials', 'api_keys',
--   'webhooks', 'api_audit_log', 'sync_queue', 'agent_ratings', 'country_config', 'partners')
-- ORDER BY tablename;

-- Check table row counts
-- SELECT schemaname, tablename, 
--   (SELECT COUNT(*) FROM mfa_codes) as mfa_codes,
--   (SELECT COUNT(*) FROM active_sessions) as active_sessions,
--   (SELECT COUNT(*) FROM audit_trail) as audit_trail,
--   (SELECT COUNT(*) FROM badges) as badges,
--   (SELECT COUNT(*) FROM training_completion) as training_completion
-- FROM pg_tables WHERE tablename = 'mfa_codes' LIMIT 1;
