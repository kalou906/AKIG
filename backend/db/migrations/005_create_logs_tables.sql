-- Migration: Create logs table
-- Description: Comprehensive system logging for debugging and monitoring
-- Purpose: Store all application logs with request tracking and structured data
-- Created: 2025-10-25

BEGIN;

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMP DEFAULT NOW() NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  req_id TEXT,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  stack_trace TEXT,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  duration_ms INT,
  ip_address INET,
  user_agent TEXT
);

-- Create API logs table for performance tracking
CREATE TABLE IF NOT EXISTS api_logs (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMP DEFAULT NOW() NOT NULL,
  req_id TEXT,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')),
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  request_size INT,
  response_size INT,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create query log table for database performance tracking
CREATE TABLE IF NOT EXISTS query_log (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  duration_ms INT NOT NULL,
  rows_affected INT,
  error_message TEXT,
  stack_trace TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create alert table for system alerts
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP,
  resolved_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_req_id ON logs(req_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_level_ts ON logs(level, ts DESC);

-- Composite index for common log queries
CREATE INDEX IF NOT EXISTS idx_logs_search 
ON logs(ts DESC, level, req_id) 
WHERE ts > NOW() - INTERVAL '7 days';

-- API logs indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_ts ON api_logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint, ts DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_req_id ON api_logs(req_id);

-- Composite index for slow query detection
CREATE INDEX IF NOT EXISTS idx_api_logs_slow 
ON api_logs(ts DESC, duration_ms DESC) 
WHERE duration_ms > 1000;

-- Query log indexes
CREATE INDEX IF NOT EXISTS idx_query_log_ts ON query_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_log_duration ON query_log(duration_ms DESC);

-- Slow query index
CREATE INDEX IF NOT EXISTS idx_query_log_slow 
ON query_log(created_at DESC, duration_ms DESC) 
WHERE duration_ms > 1000;

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved_at) 
WHERE resolved_at IS NULL;

-- Create partitions for logs table (for better performance on large datasets)
-- Partition by month for better query performance and easier archival
CREATE TABLE IF NOT EXISTS logs_2025_10 PARTITION OF logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS logs_2025_11 PARTITION OF logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Create functions for log management
CREATE OR REPLACE FUNCTION log_message(
  p_level TEXT,
  p_message TEXT,
  p_req_id TEXT DEFAULT NULL,
  p_user_id INT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_endpoint VARCHAR DEFAULT NULL,
  p_method VARCHAR DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS logs AS $$
DECLARE
  v_log logs;
BEGIN
  INSERT INTO logs (level, message, req_id, user_id, metadata, endpoint, method, ip_address)
  VALUES (p_level, p_message, p_req_id, p_user_id, p_metadata, p_endpoint, p_method, p_ip_address)
  RETURNING * INTO v_log;
  
  RETURN v_log;
END;
$$ LANGUAGE plpgsql;

-- Function to record API call
CREATE OR REPLACE FUNCTION record_api_call(
  p_req_id TEXT,
  p_user_id INT,
  p_endpoint VARCHAR,
  p_method VARCHAR,
  p_status_code INT,
  p_duration_ms INT,
  p_request_size INT DEFAULT NULL,
  p_response_size INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS api_logs AS $$
DECLARE
  v_api_log api_logs;
BEGIN
  INSERT INTO api_logs (
    req_id, user_id, endpoint, method, status_code, 
    duration_ms, request_size, response_size, error_message, ip_address
  )
  VALUES (
    p_req_id, p_user_id, p_endpoint, p_method, p_status_code,
    p_duration_ms, p_request_size, p_response_size, p_error_message, p_ip_address
  )
  RETURNING * INTO v_api_log;
  
  RETURN v_api_log;
END;
$$ LANGUAGE plpgsql;

-- Function to record database query
CREATE OR REPLACE FUNCTION record_query(
  p_query TEXT,
  p_duration_ms INT,
  p_rows_affected INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS query_log AS $$
DECLARE
  v_query_log query_log;
BEGIN
  INSERT INTO query_log (query, duration_ms, rows_affected, error_message)
  VALUES (p_query, p_duration_ms, p_rows_affected, p_error_message)
  RETURNING * INTO v_query_log;
  
  -- Alert if query is slow (> 1000ms)
  IF p_duration_ms > 1000 THEN
    INSERT INTO alerts (severity, title, message, metadata)
    VALUES (
      'warning',
      'Slow Database Query',
      'Query execution exceeded 1000ms',
      jsonb_build_object(
        'duration_ms', p_duration_ms,
        'query', LEFT(p_query, 200)
      )
    );
  END IF;
  
  RETURN v_query_log;
END;
$$ LANGUAGE plpgsql;

-- Function to create alert
CREATE OR REPLACE FUNCTION create_alert(
  p_severity VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS alerts AS $$
DECLARE
  v_alert alerts;
BEGIN
  INSERT INTO alerts (severity, title, message, metadata)
  VALUES (p_severity, p_title, p_message, p_metadata)
  RETURNING * INTO v_alert;
  
  RETURN v_alert;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS TABLE(deleted_logs BIGINT, deleted_api_logs BIGINT, deleted_queries BIGINT) AS $$
DECLARE
  v_deleted_logs BIGINT;
  v_deleted_api_logs BIGINT;
  v_deleted_queries BIGINT;
BEGIN
  -- Delete old regular logs
  DELETE FROM logs WHERE ts < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted_logs = ROW_COUNT;
  
  -- Delete old API logs
  DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted_api_logs = ROW_COUNT;
  
  -- Delete old query logs
  DELETE FROM query_log WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted_queries = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_logs, v_deleted_api_logs, v_deleted_queries;
END;
$$ LANGUAGE plpgsql;

-- Function to get logs by request ID
CREATE OR REPLACE FUNCTION get_logs_by_request(
  p_req_id TEXT,
  p_limit INT DEFAULT 100
)
RETURNS TABLE(
  log_id BIGINT,
  ts TIMESTAMP,
  level TEXT,
  message TEXT,
  user_id INT,
  metadata JSONB,
  endpoint VARCHAR,
  method VARCHAR,
  status_code INT,
  duration_ms INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    logs.id,
    logs.ts,
    logs.level,
    logs.message,
    logs.user_id,
    logs.metadata,
    logs.endpoint,
    logs.method,
    logs.status_code,
    logs.duration_ms
  FROM logs
  WHERE req_id = p_req_id
  ORDER BY logs.ts DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance stats
CREATE OR REPLACE FUNCTION get_performance_stats(
  p_hours INT DEFAULT 24
)
RETURNS TABLE(
  endpoint VARCHAR,
  method VARCHAR,
  total_requests BIGINT,
  avg_duration NUMERIC,
  max_duration INT,
  min_duration INT,
  error_count BIGINT,
  p95_duration NUMERIC,
  p99_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    api_logs.endpoint,
    api_logs.method,
    COUNT(*) AS total_requests,
    ROUND(AVG(api_logs.duration_ms)::NUMERIC, 2) AS avg_duration,
    MAX(api_logs.duration_ms) AS max_duration,
    MIN(api_logs.duration_ms) AS min_duration,
    COUNT(*) FILTER (WHERE api_logs.status_code >= 500) AS error_count,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY api_logs.duration_ms)::NUMERIC, 2) AS p95_duration,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY api_logs.duration_ms)::NUMERIC, 2) AS p99_duration
  FROM api_logs
  WHERE api_logs.created_at > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY api_logs.endpoint, api_logs.method
  ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE logs IS 'Application logs for debugging and monitoring';
COMMENT ON TABLE api_logs IS 'API request logs for performance tracking';
COMMENT ON TABLE query_log IS 'Database query logs for performance analysis';
COMMENT ON TABLE alerts IS 'System alerts for operational issues';

COMMENT ON COLUMN logs.level IS 'Log level: debug, info, warn, error';
COMMENT ON COLUMN logs.req_id IS 'Request ID for request tracing';
COMMENT ON COLUMN logs.metadata IS 'JSON metadata for structured logging';
COMMENT ON COLUMN api_logs.duration_ms IS 'Request duration in milliseconds';
COMMENT ON COLUMN query_log.duration_ms IS 'Query execution time in milliseconds';

-- Ensure migration tracking
INSERT INTO schema_migrations (name, description, executed_at)
VALUES ('005_create_logs_tables', 'Create logs, api_logs, query_log, and alerts tables with functions', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;
