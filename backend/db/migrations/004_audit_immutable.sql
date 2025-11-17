-- Migration: Add immutable audit log with blockchain-like hash chain
-- Purpose: Tamper-proof audit trail with hash chain integrity verification
-- Date: 2025-10-25

BEGIN;

-- ============================================
-- 1. Immutable Audit Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log_immutable (
  id BIGSERIAL PRIMARY KEY,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  payload JSONB DEFAULT '{}'::jsonb,
  ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  prev_hash VARCHAR(64),
  curr_hash VARCHAR(64) NOT NULL,
  CONSTRAINT valid_action CHECK (action IN (
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    'LOGIN', 'LOGOUT', 'REGISTER',
    'EXPORT', 'IMPORT',
    'PAYMENT_PROCESS', 'PAYMENT_APPROVE', 'PAYMENT_REJECT',
    'POLICY_CREATE', 'POLICY_UPDATE', 'POLICY_DELETE',
    'SECURITY_EVENT', 'ANOMALY_DETECTED'
  ))
);

-- ============================================
-- 2. Hash Chain Verification
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log_verification (
  id BIGSERIAL PRIMARY KEY,
  audit_id BIGINT NOT NULL REFERENCES audit_log_immutable(id) ON DELETE CASCADE,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  verification_details JSONB,
  CONSTRAINT check_chain_valid CHECK (is_valid IS NOT NULL)
);

-- ============================================
-- 3. Audit Log Digest (pour performances)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log_digest (
  id BIGSERIAL PRIMARY KEY,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  entry_count INTEGER NOT NULL,
  first_hash VARCHAR(64) NOT NULL,
  last_hash VARCHAR(64) NOT NULL,
  digest_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_period CHECK (period_start < period_end)
);

-- ============================================
-- 4. Indexes
-- ============================================

CREATE INDEX idx_audit_log_immutable_actor_id ON audit_log_immutable(actor_id);
CREATE INDEX idx_audit_log_immutable_action ON audit_log_immutable(action);
CREATE INDEX idx_audit_log_immutable_entity ON audit_log_immutable(entity);
CREATE INDEX idx_audit_log_immutable_ts ON audit_log_immutable(ts DESC);
CREATE INDEX idx_audit_log_immutable_hash ON audit_log_immutable(curr_hash);
CREATE INDEX idx_audit_log_immutable_entity_lookup ON audit_log_immutable(entity, entity_id);

CREATE INDEX idx_audit_log_verification_audit_id ON audit_log_verification(audit_id);
CREATE INDEX idx_audit_log_verification_verified_at ON audit_log_verification(verified_at DESC);
CREATE INDEX idx_audit_log_verification_is_valid ON audit_log_verification(is_valid);

CREATE INDEX idx_audit_log_digest_period ON audit_log_digest(period_start, period_end);

-- ============================================
-- 5. Hash Chain Integrity Functions
-- ============================================

-- Calcul du hash d'une entrée
CREATE OR REPLACE FUNCTION calculate_audit_hash(
  p_prev_hash VARCHAR,
  p_actor_id INTEGER,
  p_action VARCHAR,
  p_entity VARCHAR,
  p_entity_id INTEGER,
  p_payload JSONB,
  p_ts TIMESTAMP WITH TIME ZONE
) RETURNS VARCHAR AS $$
DECLARE
  v_input TEXT;
  v_hash BYTEA;
BEGIN
  -- Concaténer tous les champs (y compris le hash précédent)
  v_input := COALESCE(p_prev_hash, '0') || '|' ||
             COALESCE(p_actor_id::TEXT, '') || '|' ||
             p_action || '|' ||
             p_entity || '|' ||
             COALESCE(p_entity_id::TEXT, '') || '|' ||
             COALESCE(p_payload::TEXT, '{}') || '|' ||
             p_ts::TEXT;

  -- SHA256 hash
  v_hash := digest(v_input, 'sha256');
  
  RETURN encode(v_hash, 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour remplir le hash courant
CREATE OR REPLACE FUNCTION trigger_audit_hash_chain()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_hash VARCHAR;
BEGIN
  -- Récupérer le hash précédent
  SELECT curr_hash INTO v_prev_hash
  FROM audit_log_immutable
  WHERE id < NEW.id
  ORDER BY id DESC
  LIMIT 1;

  -- Calculer le nouveau hash
  NEW.prev_hash := v_prev_hash;
  NEW.curr_hash := calculate_audit_hash(
    v_prev_hash,
    NEW.actor_id,
    NEW.action,
    NEW.entity,
    NEW.entity_id,
    NEW.payload,
    NEW.ts
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_hash_chain_trigger
BEFORE INSERT ON audit_log_immutable
FOR EACH ROW
EXECUTE FUNCTION trigger_audit_hash_chain();

-- ============================================
-- 6. Audit Log Insertion Helper
-- ============================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_id INTEGER,
  p_action VARCHAR,
  p_entity VARCHAR,
  p_entity_id INTEGER DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS BIGINT AS $$
DECLARE
  v_audit_id BIGINT;
BEGIN
  INSERT INTO audit_log_immutable (actor_id, action, entity, entity_id, payload)
  VALUES (p_actor_id, p_action, p_entity, p_entity_id, p_payload)
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Chain Verification Functions
-- ============================================

-- Vérifier l'intégrité de la chaîne
CREATE OR REPLACE FUNCTION verify_audit_chain(
  p_start_id BIGINT DEFAULT 1,
  p_end_id BIGINT DEFAULT NULL
) RETURNS TABLE(
  audit_id BIGINT,
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_current_id BIGINT;
  v_expected_hash VARCHAR;
  v_actual_hash VARCHAR;
  v_prev_hash VARCHAR;
  v_actor_id INTEGER;
  v_action VARCHAR;
  v_entity VARCHAR;
  v_entity_id INTEGER;
  v_payload JSONB;
  v_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Utiliser le dernier ID si non spécifié
  IF p_end_id IS NULL THEN
    SELECT MAX(id) INTO p_end_id FROM audit_log_immutable;
  END IF;

  -- Boucler sur chaque entrée
  FOR v_current_id IN 
    SELECT id FROM audit_log_immutable 
    WHERE id BETWEEN p_start_id AND p_end_id
    ORDER BY id
  LOOP
    -- Récupérer l'entrée
    SELECT actor_id, action, entity, entity_id, payload, ts, prev_hash, curr_hash
    INTO v_actor_id, v_action, v_entity, v_entity_id, v_payload, v_ts, v_prev_hash, v_actual_hash
    FROM audit_log_immutable
    WHERE id = v_current_id;

    -- Recalculer le hash
    v_expected_hash := calculate_audit_hash(
      v_prev_hash,
      v_actor_id,
      v_action,
      v_entity,
      v_entity_id,
      v_payload,
      v_ts
    );

    -- Comparer et retourner le résultat
    IF v_expected_hash = v_actual_hash THEN
      audit_id := v_current_id;
      is_valid := TRUE;
      error_message := NULL;
    ELSE
      audit_id := v_current_id;
      is_valid := FALSE;
      error_message := 'Hash mismatch: expected ' || v_expected_hash || ', got ' || v_actual_hash;
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Audit Events Lookup Functions
-- ============================================

-- Récupérer les événements d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_audit_events(
  p_user_id INTEGER,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
  id BIGINT,
  action VARCHAR,
  entity VARCHAR,
  entity_id INTEGER,
  payload JSONB,
  ts TIMESTAMP WITH TIME ZONE,
  curr_hash VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.action, a.entity, a.entity_id, a.payload, a.ts, a.curr_hash
  FROM audit_log_immutable a
  WHERE a.actor_id = p_user_id
  ORDER BY a.ts DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Récupérer les événements pour une entité
CREATE OR REPLACE FUNCTION get_entity_audit_events(
  p_entity VARCHAR,
  p_entity_id INTEGER,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE(
  id BIGINT,
  actor_id INTEGER,
  action VARCHAR,
  payload JSONB,
  ts TIMESTAMP WITH TIME ZONE,
  curr_hash VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.actor_id, a.action, a.payload, a.ts, a.curr_hash
  FROM audit_log_immutable a
  WHERE a.entity = p_entity AND a.entity_id = p_entity_id
  ORDER BY a.ts DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Digest Creation for Performance
-- ============================================

CREATE OR REPLACE FUNCTION create_audit_digest(
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
) RETURNS BIGINT AS $$
DECLARE
  v_entry_count INTEGER;
  v_first_hash VARCHAR;
  v_last_hash VARCHAR;
  v_digest_hash VARCHAR;
  v_digest_id BIGINT;
BEGIN
  -- Compter les entrées dans la période
  SELECT COUNT(*) INTO v_entry_count
  FROM audit_log_immutable
  WHERE ts BETWEEN p_period_start AND p_period_end;

  -- Récupérer le premier et dernier hash
  SELECT curr_hash INTO v_first_hash
  FROM audit_log_immutable
  WHERE ts BETWEEN p_period_start AND p_period_end
  ORDER BY id ASC LIMIT 1;

  SELECT curr_hash INTO v_last_hash
  FROM audit_log_immutable
  WHERE ts BETWEEN p_period_start AND p_period_end
  ORDER BY id DESC LIMIT 1;

  -- Créer le digest hash
  v_digest_hash := encode(digest(
    COALESCE(v_first_hash, '') || '|' ||
    v_entry_count::TEXT || '|' ||
    COALESCE(v_last_hash, ''),
    'sha256'
  ), 'hex');

  -- Insérer le digest
  INSERT INTO audit_log_digest (period_start, period_end, entry_count, first_hash, last_hash, digest_hash)
  VALUES (p_period_start, p_period_end, v_entry_count, v_first_hash, v_last_hash, v_digest_hash)
  RETURNING id INTO v_digest_id;

  RETURN v_digest_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
