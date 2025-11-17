/**
 * Migration: Audit Log System with Digital Signatures
 * Date: 2025-10-25
 * Description: Create audit logging table with signature support for compliance
 */

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id INT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INT,
  payload JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signature TEXT,
  signature_algorithm TEXT DEFAULT 'HMAC-SHA256',
  signed_at TIMESTAMP,
  verified BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts ON audit_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_signature ON audit_log(signature);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_action ON audit_log(actor_id, action, ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_ts ON audit_log(entity, ts DESC);

-- Create audit_signature_keys table to store keys for signing
CREATE TABLE IF NOT EXISTS audit_signature_keys (
  id SERIAL PRIMARY KEY,
  key_name TEXT UNIQUE NOT NULL,
  public_key TEXT,
  private_key_hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'HMAC-SHA256',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  key_purpose TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_signature_keys_active ON audit_signature_keys(active);

-- Create audit_log_archive table for long-term storage
CREATE TABLE IF NOT EXISTS audit_log_archive (
  id BIGSERIAL PRIMARY KEY,
  actor_id INT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INT,
  payload JSONB,
  changes JSONB,
  status TEXT,
  ts TIMESTAMP,
  signature TEXT,
  verified BOOLEAN,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_archive_ts ON audit_log_archive(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_archive_actor_id ON audit_log_archive(actor_id);

-- Create function to sign audit log entry
CREATE OR REPLACE FUNCTION sign_audit_entry(
  p_id BIGINT,
  p_secret TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_signature TEXT;
  v_payload TEXT;
BEGIN
  -- Get the audit entry data
  SELECT audit_log.id::TEXT || '|' || audit_log.action || '|' || audit_log.entity || '|' || 
         audit_log.ts::TEXT || '|' || COALESCE(audit_log.payload::TEXT, '')
  INTO v_payload
  FROM audit_log
  WHERE id = p_id;

  -- Create HMAC-SHA256 signature
  v_signature := encode(
    hmac(v_payload, p_secret, 'sha256'),
    'hex'
  );

  -- Update audit_log with signature
  UPDATE audit_log
  SET signature = v_signature,
      signed_at = CURRENT_TIMESTAMP
  WHERE id = p_id;

  RETURN v_signature;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify audit log entry
CREATE OR REPLACE FUNCTION verify_audit_entry(
  p_id BIGINT,
  p_secret TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_expected_signature TEXT;
  v_actual_signature TEXT;
BEGIN
  -- Get the actual signature from database
  SELECT signature INTO v_actual_signature FROM audit_log WHERE id = p_id;

  -- Calculate expected signature
  SELECT sign_audit_entry(p_id, p_secret) INTO v_expected_signature;

  -- Compare signatures
  IF v_actual_signature = v_expected_signature THEN
    UPDATE audit_log SET verified = true WHERE id = p_id;
    RETURN true;
  ELSE
    UPDATE audit_log SET verified = false WHERE id = p_id;
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get audit trail for entity
CREATE OR REPLACE FUNCTION get_audit_trail(
  p_entity TEXT,
  p_entity_id INT,
  p_limit INT DEFAULT 100
)
RETURNS TABLE(
  id BIGINT,
  actor_name TEXT,
  action TEXT,
  payload JSONB,
  changes JSONB,
  ts TIMESTAMP,
  verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    COALESCE(u.first_name || ' ' || u.last_name, 'System') as actor_name,
    al.action,
    al.payload,
    al.changes,
    al.ts,
    al.verified
  FROM audit_log al
  LEFT JOIN users u ON al.actor_id = u.id
  WHERE al.entity = p_entity AND al.entity_id = p_entity_id
  ORDER BY al.ts DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to archive old audit logs
CREATE OR REPLACE FUNCTION archive_audit_logs(p_days INT DEFAULT 90)
RETURNS TABLE(
  archived_count BIGINT,
  remaining_count BIGINT
) AS $$
DECLARE
  v_archived_count BIGINT;
  v_remaining_count BIGINT;
BEGIN
  -- Archive logs older than p_days
  INSERT INTO audit_log_archive 
    (actor_id, action, entity, entity_id, payload, changes, status, ts, signature, verified)
  SELECT actor_id, action, entity, entity_id, payload, changes, status, ts, signature, verified
  FROM audit_log
  WHERE ts < CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days;

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  -- Delete archived logs from main table
  DELETE FROM audit_log
  WHERE ts < CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days;

  -- Count remaining logs
  SELECT COUNT(*) INTO v_remaining_count FROM audit_log;

  RETURN QUERY SELECT v_archived_count, v_remaining_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_entry(
  p_actor_id INT,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id INT,
  p_payload JSONB DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO audit_log (
    actor_id, action, entity, entity_id, payload, changes,
    ip_address, user_agent, status
  )
  VALUES (
    p_actor_id, p_action, p_entity, p_entity_id, p_payload, p_changes,
    p_ip_address, p_user_agent, 'success'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for recent audit activity
CREATE OR REPLACE VIEW vw_recent_audit_activity AS
SELECT 
  al.id,
  u.first_name || ' ' || u.last_name as actor_name,
  al.action,
  al.entity,
  al.entity_id,
  al.status,
  al.verified,
  al.ts,
  al.ip_address,
  COUNT(*) OVER (PARTITION BY al.actor_id ORDER BY al.ts DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as user_action_count
FROM audit_log al
LEFT JOIN users u ON al.actor_id = u.id
ORDER BY al.ts DESC;

-- Create view for audit compliance report
CREATE OR REPLACE VIEW vw_audit_compliance_report AS
SELECT 
  DATE_TRUNC('day', al.ts)::DATE as audit_date,
  al.action,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN al.status = 'success' THEN 1 END) as successful_actions,
  COUNT(CASE WHEN al.status = 'error' THEN 1 END) as failed_actions,
  COUNT(CASE WHEN al.verified = true THEN 1 END) as verified_signatures,
  COUNT(DISTINCT al.actor_id) as unique_actors
FROM audit_log al
GROUP BY DATE_TRUNC('day', al.ts)::DATE, al.action
ORDER BY audit_date DESC, total_actions DESC;

-- Grant permissions
GRANT SELECT ON audit_log TO authenticated;
GRANT SELECT ON audit_log_archive TO authenticated;
GRANT SELECT ON vw_recent_audit_activity TO authenticated;
GRANT SELECT ON vw_audit_compliance_report TO authenticated;

-- Add comments
COMMENT ON TABLE audit_log IS 'Main audit log table for tracking all system actions with digital signatures';
COMMENT ON COLUMN audit_log.signature IS 'HMAC-SHA256 digital signature of the audit entry for tamper detection';
COMMENT ON COLUMN audit_log.verified IS 'Flag indicating whether the signature has been verified';
COMMENT ON TABLE audit_signature_keys IS 'Management of signing keys for audit log signatures';
COMMENT ON TABLE audit_log_archive IS 'Long-term archive of audit logs for compliance retention';
