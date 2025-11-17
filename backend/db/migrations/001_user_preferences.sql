-- Migration: Créer la table user_preferences
-- Date: 2025-10-24
-- Description: Table pour stocker les préférences utilisateur (langue, thème, notifications, widgets)

BEGIN;

-- Créer la table user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Préférences de langue et affichage
  locale TEXT DEFAULT 'fr' NOT NULL,
  theme TEXT DEFAULT 'light' NOT NULL,
  
  -- Préférences de notifications
  notif_channel TEXT DEFAULT 'email' NOT NULL,
  notif_email BOOLEAN DEFAULT true,
  notif_sms BOOLEAN DEFAULT false,
  notif_push BOOLEAN DEFAULT false,
  notif_frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly
  
  -- Widgets du dashboard (JSONB pour flexibilité)
  widgets JSONB DEFAULT '[]'::jsonb,
  
  -- Filtres sauvegardés
  saved_filters JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Créer un index sur user_id (clé étrangère)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
  ON user_preferences(user_id);

-- Créer un index sur locale (pour filtrer par langue)
CREATE INDEX IF NOT EXISTS idx_user_preferences_locale 
  ON user_preferences(locale);

-- Créer un index sur theme (pour requêtes groupe par thème)
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme 
  ON user_preferences(theme);

-- Créer un index sur notif_channel (pour notifications)
CREATE INDEX IF NOT EXISTS idx_user_preferences_notif_channel 
  ON user_preferences(notif_channel);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_update_timestamp ON user_preferences;

CREATE TRIGGER user_preferences_update_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();

-- Ajouter des commentaires
COMMENT ON TABLE user_preferences IS 'Préférences utilisateur (langue, thème, notifications, widgets)';
COMMENT ON COLUMN user_preferences.user_id IS 'Référence à l''utilisateur';
COMMENT ON COLUMN user_preferences.locale IS 'Langue préférée (fr, en, etc.)';
COMMENT ON COLUMN user_preferences.theme IS 'Thème d''affichage (light, dark)';
COMMENT ON COLUMN user_preferences.notif_channel IS 'Canal de notification principal (email, sms, push)';
COMMENT ON COLUMN user_preferences.widgets IS 'Configuration des widgets du dashboard (JSON)';
COMMENT ON COLUMN user_preferences.saved_filters IS 'Filtres sauvegardés par l''utilisateur (JSON)';

-- Valider la transaction
COMMIT;
