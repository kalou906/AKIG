/**
 * AKIG Validation Test Database Migrations
 * Creates tables for tracking all validation tests, metrics, and results
 */

const pool = require('../db');

const createValidationTables = async () => {
  try {
    console.log('[DB] Creating validation test tables...');

    // Main validation tests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS validation_tests (
        test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain VARCHAR(50) NOT NULL,
        scenario VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_domain_status (domain, status),
        INDEX idx_created_at (created_at)
      );
    `);

    // Load metrics snapshot
    await pool.query(`
      CREATE TABLE IF NOT EXISTS load_metrics (
        metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES validation_tests(test_id) ON DELETE CASCADE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        p95_latency DECIMAL(10, 2),
        p99_latency DECIMAL(10, 2),
        error_rate DECIMAL(5, 2),
        throughput DECIMAL(10, 2),
        cpu_percent DECIMAL(5, 2),
        memory_percent DECIMAL(5, 2),
        active_connections INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Data reconciliation results
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reconciliation_results (
        reconciliation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES validation_tests(test_id) ON DELETE CASCADE,
        source_1 VARCHAR(50),
        source_2 VARCHAR(50),
        total_records INTEGER,
        matching_records INTEGER,
        discrepancy_count INTEGER,
        concordance_percent DECIMAL(5, 2),
        discrepancies JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Audit lineage tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID,
        action_type VARCHAR(100),
        resource_type VARCHAR(50),
        resource_id UUID,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        is_sensitive BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_is_sensitive (is_sensitive),
        INDEX idx_timestamp (timestamp)
      );
    `);

    // User experience metrics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ux_metrics (
        ux_metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES validation_tests(test_id) ON DELETE CASCADE,
        session_id UUID,
        user_id UUID,
        page_name VARCHAR(100),
        time_to_interactive DECIMAL(10, 3),
        js_error_count INTEGER,
        page_weight_kb DECIMAL(10, 2),
        device_type VARCHAR(50),
        network_type VARCHAR(50),
        nps_score INTEGER,
        sus_score DECIMAL(5, 2),
        input_errors INTEGER,
        abandonment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Security findings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_findings (
        finding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES validation_tests(test_id) ON DELETE CASCADE,
        vulnerability_type VARCHAR(100),
        severity VARCHAR(20),
        affected_component VARCHAR(255),
        description TEXT,
        remediation_action TEXT,
        status VARCHAR(50) DEFAULT 'open',
        discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fixed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_severity_status (severity, status)
      );
    `);

    // AI anomaly detection results
    await pool.query(`
      CREATE TABLE IF NOT EXISTS anomaly_detections (
        detection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES validation_tests(test_id) ON DELETE CASCADE,
        payment_id UUID,
        anomaly_type VARCHAR(100),
        confidence_score DECIMAL(5, 2),
        is_true_anomaly BOOLEAN,
        explanation TEXT,
        recommended_action VARCHAR(255),
        accepted_by_manager BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_confidence (confidence_score)
      );
    `);

    // Multi-region latency observations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS multi_region_metrics (
        region_metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES validation_tests(test_id) ON DELETE CASCADE,
        source_region VARCHAR(50),
        target_region VARCHAR(50),
        latency_ms DECIMAL(10, 2),
        config_consistency DECIMAL(5, 2),
        failover_time_ms DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Jupiter experiment results
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jupiter_experiments (
        experiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES validation_tests(test_id) ON DELETE CASCADE,
        experiment_type VARCHAR(100),
        duration_hours DECIMAL(10, 2),
        uptime_percent DECIMAL(5, 2),
        auto_recoveries INTEGER,
        human_interventions INTEGER,
        data_loss_records INTEGER,
        new_team_members INTEGER,
        adoption_intact BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Test execution schedule
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_schedules (
        schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain VARCHAR(50) NOT NULL,
        test_name VARCHAR(255) NOT NULL,
        frequency VARCHAR(50),
        next_execution TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        last_executed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_domain_active (domain, is_active)
      );
    `);

    console.log('[DB] ✅ Validation test tables created successfully');
    return true;
  } catch (error) {
    console.error('[DB] ❌ Failed to create validation test tables:', error);
    throw error;
  }
};

module.exports = { createValidationTables };
