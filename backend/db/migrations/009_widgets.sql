-- Migration: User Widgets Management System
-- Date: 2025-10-25
-- Description: Table pour la gestion des widgets personnalisables du tableau de bord

BEGIN;

-- Création de la table des widgets utilisateur
CREATE TABLE IF NOT EXISTS user_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  size VARCHAR(20) NOT NULL DEFAULT 'medium',
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_user_widgets_user_id ON user_widgets(user_id);
CREATE INDEX idx_user_widgets_type ON user_widgets(type);
CREATE INDEX idx_user_widgets_position ON user_widgets(user_id, position);
CREATE INDEX idx_user_widgets_visible ON user_widgets(user_id, is_visible) 
  WHERE is_visible = true AND deleted_at IS NULL;

-- Historique des modifications de widgets
CREATE TABLE IF NOT EXISTS widget_changes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES user_widgets(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL,
  old_config JSONB,
  new_config JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_widget_changes_user ON widget_changes_log(user_id);
CREATE INDEX idx_widget_changes_widget ON widget_changes_log(widget_id);
CREATE INDEX idx_widget_changes_action ON widget_changes_log(action);

-- Vues pour les statistiques
CREATE OR REPLACE VIEW vw_user_widget_stats AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(w.id) as widget_count,
  COUNT(CASE WHEN w.is_visible = true THEN 1 END) as visible_count,
  COUNT(DISTINCT w.type) as unique_types,
  MAX(w.updated_at) as last_update
FROM users u
LEFT JOIN user_widgets w ON u.id = w.user_id AND w.deleted_at IS NULL
GROUP BY u.id, u.email;

-- Vue pour les widgets visibles
CREATE OR REPLACE VIEW vw_user_widgets_visible AS
SELECT 
  id,
  user_id,
  type,
  title,
  position,
  size,
  config,
  is_visible,
  created_at,
  updated_at
FROM user_widgets
WHERE is_visible = true AND deleted_at IS NULL
ORDER BY user_id, position;

-- Fonction pour logger les changements de widgets
CREATE OR REPLACE FUNCTION log_widget_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO widget_changes_log (user_id, widget_id, action, old_config, new_config, changed_fields)
    VALUES (
      NEW.user_id,
      NEW.id,
      'UPDATE',
      OLD.config,
      NEW.config,
      ARRAY['title', 'position', 'size', 'config', 'is_visible']
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO widget_changes_log (user_id, widget_id, action, old_config, new_config)
    VALUES (OLD.user_id, OLD.id, 'DELETE', OLD.config, NULL);
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO widget_changes_log (user_id, widget_id, action, old_config, new_config)
    VALUES (NEW.user_id, NEW.id, 'CREATE', NULL, NEW.config);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour logger les changements
DROP TRIGGER IF EXISTS trigger_widget_changes ON user_widgets;
CREATE TRIGGER trigger_widget_changes
AFTER INSERT OR UPDATE OR DELETE ON user_widgets
FOR EACH ROW
EXECUTE FUNCTION log_widget_change();

-- Fonction pour réinitialiser les widgets par défaut
CREATE OR REPLACE FUNCTION reset_user_widgets_to_defaults(p_user_id UUID)
RETURNS TABLE(id UUID, user_id UUID, type VARCHAR, title VARCHAR, position INTEGER) AS $$
BEGIN
  -- Supprimer les widgets existants
  DELETE FROM user_widgets WHERE user_id = p_user_id;

  -- Créer les widgets par défaut
  INSERT INTO user_widgets (user_id, type, title, position, size, is_visible, config)
  VALUES
    (p_user_id, 'overview', 'Vue d''ensemble', 0, 'large', true, '{}'),
    (p_user_id, 'cashflow', 'Flux de trésorerie', 1, 'large', true, '{}'),
    (p_user_id, 'properties', 'Propriétés', 2, 'medium', true, '{}'),
    (p_user_id, 'payments', 'Paiements', 3, 'medium', true, '{}'),
    (p_user_id, 'alerts', 'Alertes', 4, 'small', true, '{}')
  RETURNING user_widgets.id, user_widgets.user_id, user_widgets.type, user_widgets.title, user_widgets.position;
END;
$$ LANGUAGE plpgsql;

-- Permissions
GRANT SELECT ON user_widgets TO web_user;
GRANT INSERT, UPDATE, DELETE ON user_widgets TO web_user;
GRANT SELECT ON widget_changes_log TO web_user;
GRANT SELECT ON vw_user_widget_stats TO web_user;
GRANT SELECT ON vw_user_widgets_visible TO web_user;

COMMIT;
