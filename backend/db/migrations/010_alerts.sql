-- Migration: Alert System
-- Date: 2025-10-25
-- Description: Tables et structures pour le système d'alertes

BEGIN;

-- Table des alertes (logs)
CREATE TABLE IF NOT EXISTS alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  code VARCHAR(100),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des alertes in-app
CREATE TABLE IF NOT EXISTS in_app_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Table des préférences d'alertes (alternative à colonnes users)
CREATE TABLE IF NOT EXISTS alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  channels TEXT[] DEFAULT ARRAY['in_app', 'email'],
  minimum_severity VARCHAR(20) DEFAULT 'low',
  enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  do_not_disturb BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des webhooks d'alertes
CREATE TABLE IF NOT EXISTS alert_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'historique des alertes envoyées
CREATE TABLE IF NOT EXISTS alert_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alert_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_alert_logs_user_id ON alert_logs(user_id);
CREATE INDEX idx_alert_logs_severity ON alert_logs(severity);
CREATE INDEX idx_alert_logs_type ON alert_logs(type);
CREATE INDEX idx_alert_logs_created_at ON alert_logs(created_at DESC);
CREATE INDEX idx_alert_logs_read ON alert_logs(user_id, read) WHERE read = false;
CREATE INDEX idx_in_app_alerts_user_id ON in_app_alerts(user_id);
CREATE INDEX idx_in_app_alerts_read ON in_app_alerts(user_id, read) WHERE read = false;
CREATE INDEX idx_alert_webhooks_user_id ON alert_webhooks(user_id);
CREATE INDEX idx_alert_delivery_log_alert_id ON alert_delivery_log(alert_id);
CREATE INDEX idx_alert_delivery_log_user_id ON alert_delivery_log(user_id);

-- Vues
CREATE OR REPLACE VIEW vw_alert_stats AS
SELECT 
  user_id,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN read = false THEN 1 END) as unread_count,
  COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
  COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
  COUNT(CASE WHEN type = 'error' THEN 1 END) as error_count,
  MAX(created_at) as last_alert
FROM alert_logs
GROUP BY user_id;

CREATE OR REPLACE VIEW vw_system_alerts AS
SELECT 
  type,
  severity,
  COUNT(*) as count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
  MAX(created_at) as last_alert
FROM alert_logs
WHERE severity IN ('critical', 'high')
GROUP BY type, severity
ORDER BY count DESC;

CREATE OR REPLACE VIEW vw_alert_delivery_stats AS
SELECT 
  channel,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as delivered,
  COUNT(CASE WHEN read_at IS NOT NULL THEN 1 END) as read
FROM alert_delivery_log
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY channel, status;

-- Fonction pour nettoyer les anciennes alertes
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS void AS $$
BEGIN
  -- Supprimer les alertes de plus de 90 jours
  DELETE FROM alert_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND read = true;

  -- Supprimer les alertes in-app de plus de 30 jours
  DELETE FROM in_app_alerts
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND read = true;

  -- Supprimer les logs de livraison de plus de 90 jours
  DELETE FROM alert_delivery_log
  WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Colonnes additionnelles pour users (alternative)
ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_channels TEXT[] DEFAULT ARRAY['in_app'];
ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_severity VARCHAR(20) DEFAULT 'low';
ALTER TABLE users ADD COLUMN IF NOT EXISTS alerts_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_alert_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_alert_logs_timestamp ON alert_logs;
CREATE TRIGGER trigger_update_alert_logs_timestamp
BEFORE UPDATE ON alert_logs
FOR EACH ROW
EXECUTE FUNCTION update_alert_logs_timestamp();

-- Permissions
GRANT SELECT ON alert_logs TO web_user;
GRANT INSERT, UPDATE, DELETE ON alert_logs TO web_user;
GRANT SELECT ON in_app_alerts TO web_user;
GRANT INSERT, UPDATE ON in_app_alerts TO web_user;
GRANT SELECT ON alert_preferences TO web_user;
GRANT INSERT, UPDATE, DELETE ON alert_preferences TO web_user;
GRANT SELECT ON alert_webhooks TO web_user;
GRANT INSERT, UPDATE, DELETE ON alert_webhooks TO web_user;
GRANT SELECT ON alert_delivery_log TO web_user;
GRANT SELECT ON vw_alert_stats TO web_user;
GRANT SELECT ON vw_system_alerts TO web_user;

COMMIT;
