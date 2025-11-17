-- =========================================================
-- DATABASE SCHEMA MIGRATIONS FOR JUPITER-GRADE P1
-- =========================================================
-- These migrations add support for:
-- 1. Multi-Site Architecture
-- 2. Tenant Retention Service
-- 3. Task Prioritization
-- 4. AI Explainability
-- 5. Advanced KPIs
-- =========================================================

-- =============== PHASE 1: Multi-Site Tables ===============

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  country VARCHAR(10),
  timezone VARCHAR(50),
  currency VARCHAR(10),
  language VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  max_tenants INT,
  max_properties INT,
  failover_site_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add site_id to core tables
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) REFERENCES sites(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) REFERENCES sites(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) REFERENCES sites(id);
ALTER TABLE notices ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) REFERENCES sites(id);
ALTER TABLE litigations ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) REFERENCES sites(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) REFERENCES sites(id);

-- Create indexes for site filtering
CREATE INDEX IF NOT EXISTS idx_contracts_site ON contracts(site_id);
CREATE INDEX IF NOT EXISTS idx_payments_site ON payments(site_id);
CREATE INDEX IF NOT EXISTS idx_tenants_site ON tenants(site_id);
CREATE INDEX IF NOT EXISTS idx_notices_site ON notices(site_id);
CREATE INDEX IF NOT EXISTS idx_litigations_site ON litigations(site_id);
CREATE INDEX IF NOT EXISTS idx_properties_site ON properties(site_id);

-- User site assignments
CREATE TABLE IF NOT EXISTS user_site_assignments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  site_id VARCHAR(50) NOT NULL REFERENCES sites(id),
  role_id VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- Regional rules
CREATE TABLE IF NOT EXISTS regional_rules (
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(50) NOT NULL REFERENCES sites(id),
  entity_type VARCHAR(50), -- 'contract', 'payment', 'notice'
  rule_type VARCHAR(100),
  rule_value NUMERIC,
  description TEXT,
  effective_date DATE,
  expiration_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, entity_type, rule_type)
);

CREATE INDEX IF NOT EXISTS idx_regional_rules_site ON regional_rules(site_id);

-- =============== PHASE 2: Tenant Retention Tables ===============

-- Tenant profiles for retention analysis
CREATE TABLE IF NOT EXISTS tenant_profiles (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL UNIQUE REFERENCES tenants(id),
  contract_duration INT, -- months
  payment_reliability DECIMAL(3,2), -- 0-1
  activity_trend VARCHAR(20), -- 'stable', 'declining', 'increasing'
  referral_count INT DEFAULT 0,
  satisfaction_score DECIMAL(2,1), -- 0-10
  last_analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Retention scores and campaigns
CREATE TABLE IF NOT EXISTS retention_scores (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id),
  score INT, -- 0-100
  risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  risk_factors TEXT[], -- array of factors
  estimated_churn_probability DECIMAL(3,2),
  potential_ltv_loss NUMERIC,
  recommended_intervention_date TIMESTAMP,
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_scores_risk ON retention_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_retention_scores_date ON retention_scores(calculated_at DESC);

-- Retention actions and campaigns
CREATE TABLE IF NOT EXISTS retention_actions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id),
  action_type VARCHAR(50), -- 'discount', 'vip_program', 'service_addon', etc.
  description TEXT,
  incentive_value NUMERIC,
  expected_conversion_rate DECIMAL(3,2),
  duration_days INT,
  requires_approval BOOLEAN DEFAULT false,
  approved_by VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'executed', 'completed'
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retention_campaigns (
  campaign_id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tenant_count INT,
  budget NUMERIC,
  expected_roi DECIMAL(3,2),
  start_date DATE,
  end_date DATE,
  actual_engagement INT,
  actual_conversion INT,
  actual_revenue NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============== PHASE 3: Task Management Tables ===============

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(100) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL REFERENCES agents(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50), -- 'notice', 'payment_follow', 'litige', etc.
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  tenant_id VARCHAR(255) REFERENCES tenants(id),
  contract_id VARCHAR(255),
  property_id VARCHAR(255)
);

-- Task prioritization
CREATE TABLE IF NOT EXISTS task_prioritizations (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL REFERENCES agents(id),
  task_id VARCHAR(100) NOT NULL REFERENCES tasks(id),
  priority_score INT, -- 0-100
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL REFERENCES tasks(id),
  depends_on_task_id VARCHAR(100) NOT NULL REFERENCES tasks(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============== PHASE 4: AI & Explainability Tables ===============

-- AI Alerts
CREATE TABLE IF NOT EXISTS ai_alerts (
  alert_id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id),
  alert_type VARCHAR(50), -- 'payment_risk', 'notice_overdue', etc.
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  risk_score INT, -- 0-100
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' -- 'active', 'resolved', 'ignored'
);

CREATE INDEX IF NOT EXISTS idx_ai_alerts_tenant ON ai_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_status ON ai_alerts(status);

-- AI Alert Context & Explainability
CREATE TABLE IF NOT EXISTS ai_alert_context (
  id SERIAL PRIMARY KEY,
  alert_id VARCHAR(100) NOT NULL UNIQUE REFERENCES ai_alerts(alert_id),
  engine VARCHAR(100), -- 'delinquency_pattern', 'seasonality', etc.
  confidence INT, -- 0-100
  data_points INT,
  signals JSONB, -- Array of signals with weights
  historical_accuracy INT, -- %
  created_at TIMESTAMP DEFAULT NOW()
);

-- Similar cases for explainability
CREATE TABLE IF NOT EXISTS similar_cases (
  case_id VARCHAR(100) PRIMARY KEY,
  alert_type VARCHAR(50),
  similarity_score INT, -- 0-100
  outcome VARCHAR(20), -- 'resolved', 'escalated', 'lost'
  action_taken TEXT,
  result TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert explanations (audit trail)
CREATE TABLE IF NOT EXISTS alert_explanations (
  id SERIAL PRIMARY KEY,
  alert_id VARCHAR(100) NOT NULL REFERENCES ai_alerts(alert_id),
  explanation_json JSONB,
  explainability_score INT, -- 0-100
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============== PHASE 5: Advanced KPI Tables ===============

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(50) REFERENCES sites(id),
  period_start DATE,
  period_end DATE,
  
  -- Core metrics
  avg_resolution_time DECIMAL(5,2), -- days
  resolution_rate DECIMAL(3,2), -- %
  deposit_return_rate DECIMAL(3,2), -- %
  deposit_return_time DECIMAL(5,2), -- days
  nps_score INT, -- -100 to 100
  tenant_retention_rate DECIMAL(3,2), -- %
  agent_productivity DECIMAL(5,2), -- contracts/agent/month
  revenue_per_agent NUMERIC,
  occupancy_rate DECIMAL(3,2), -- %
  portfolio_risk_score INT, -- 0-100
  payment_collection_rate DECIMAL(3,2), -- %
  renewal_rate DECIMAL(3,2), -- %
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_period ON kpi_snapshots(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_site ON kpi_snapshots(site_id);

-- KPI Anomalies detected by AI
CREATE TABLE IF NOT EXISTS kpi_anomalies (
  id SERIAL PRIMARY KEY,
  alert_id VARCHAR(100) REFERENCES ai_alerts(alert_id),
  anomaly_type VARCHAR(100),
  expected_value NUMERIC,
  actual_value NUMERIC,
  z_score DECIMAL(5,2),
  severity VARCHAR(20),
  detected_at TIMESTAMP DEFAULT NOW()
);

-- Surveys for NPS, satisfaction tracking
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) REFERENCES tenants(id),
  site_id VARCHAR(50) REFERENCES sites(id),
  survey_type VARCHAR(50), -- 'nps', 'satisfaction', 'experience'
  rating INT, -- 0-10
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============== PHASE 6: Gamification & Engagement Tables ===============

-- Achievement tracking
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id),
  achievement_type VARCHAR(50), -- 'no_disputes', '12_months_clean', 'referrals', etc.
  badge_name VARCHAR(100),
  badge_emoji VARCHAR(10),
  points INT,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboards (persisted)
CREATE TABLE IF NOT EXISTS leaderboard_positions (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL REFERENCES agents(id),
  site_id VARCHAR(50) REFERENCES sites(id),
  rank INT,
  metric_type VARCHAR(100), -- 'contracts_closed', 'revenue', 'nps', etc.
  metric_value NUMERIC,
  period_month DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============== PHASE 7: Training & Development Tables ===============

CREATE TABLE IF NOT EXISTS training_modules (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT,
  difficulty VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  content_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_training_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  module_id VARCHAR(100) NOT NULL REFERENCES training_modules(id),
  status VARCHAR(20), -- 'started', 'in_progress', 'completed'
  progress_percentage INT, -- 0-100
  completed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT NOW()
);

-- =============== PHASE 8: Insert Initial Data ===============

-- Insert Guinea sites
INSERT INTO sites (id, name, region, country, timezone, currency, language, is_active, max_tenants, max_properties)
VALUES
  ('GN_CONAKRY', 'Conakry Headquarters', 'Conakry', 'GN', 'GMT', 'GNF', 'fr', true, 5000, 1000),
  ('GN_KINDIA', 'Kindia Branch', 'Kindia', 'GN', 'GMT', 'GNF', 'fr', true, 2000, 400),
  ('GN_MAMOU', 'Mamou Branch', 'Mamou', 'GN', 'GMT', 'GNF', 'fr', true, 1500, 300),
  ('GN_LABE', 'Labé Branch', 'Labé', 'GN', 'GMT', 'GNF', 'ff', true, 1000, 200),
  ('SN_DAKAR', 'Dakar Regional HQ', 'Dakar', 'SN', 'GMT', 'XOF', 'fr', true, 3000, 600),
  ('ML_BAMAKO', 'Bamako Regional HQ', 'Bamako', 'ML', 'GMT', 'XOF', 'fr', true, 2500, 500)
ON CONFLICT DO NOTHING;

-- =============== PHASE 9: Verify Tables ===============

-- Verify all tables created successfully
SELECT 'Migration Complete!' as status,
       COUNT(*) as total_tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'sites', 'contracts', 'payments', 'tenants', 'notices', 'litigations', 'properties',
    'user_site_assignments', 'regional_rules',
    'tenant_profiles', 'retention_scores', 'retention_actions', 'retention_campaigns',
    'tasks', 'task_prioritizations', 'task_dependencies',
    'ai_alerts', 'ai_alert_context', 'similar_cases', 'alert_explanations',
    'kpi_snapshots', 'kpi_anomalies', 'surveys',
    'achievements', 'leaderboard_positions',
    'training_modules', 'user_training_progress'
  );
