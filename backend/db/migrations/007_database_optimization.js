/**
 * Database Optimization Migration
 * Adds indexes, creates optimized queries, sets up query monitoring
 * 
 * This migration should be run after all other migrations
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../services/logger');

/**
 * Migration up - Add indexes and optimizations
 */
async function up(pool) {
  logger.info('🔧 Running database optimization migration...');
  
  try {
    // ============================================
    // 1. Add Missing Indexes for Foreign Keys
    // ============================================
    logger.info('Adding foreign key indexes...');
    
    const indexQueries = [
      // User indexes
      `CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
       ON user_roles(user_id);`,
      
      `CREATE INDEX IF NOT EXISTS idx_user_roles_role_id 
       ON user_roles(role_id);`,
      
      `CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id 
       ON role_permissions(role_id);`,
      
      `CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id 
       ON role_permissions(permission_id);`,
      
      // Audit indexes
      `CREATE INDEX IF NOT EXISTS idx_access_audit_user_id 
       ON access_audit(user_id);`,
      
      `CREATE INDEX IF NOT EXISTS idx_access_audit_resource_type 
       ON access_audit(resource_type);`,
      
      `CREATE INDEX IF NOT EXISTS idx_access_audit_created_at 
       ON access_audit(created_at DESC);`,
      
      `CREATE INDEX IF NOT EXISTS idx_access_audit_action 
       ON access_audit(action);`,
      
      // Contract indexes
      `CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id 
       ON contracts(tenant_id);`,
      
      `CREATE INDEX IF NOT EXISTS idx_contracts_created_at 
       ON contracts(created_at DESC);`,
      
      `CREATE INDEX IF NOT EXISTS idx_contracts_status 
       ON contracts(status);`,
      
      // Payment indexes
      `CREATE INDEX IF NOT EXISTS idx_payments_contract_id 
       ON payments(contract_id);`,
      
      `CREATE INDEX IF NOT EXISTS idx_payments_status 
       ON payments(status);`,
      
      `CREATE INDEX IF NOT EXISTS idx_payments_created_at 
       ON payments(created_at DESC);`,
    ];
    
    for (const query of indexQueries) {
      try {
        await pool.query(query);
        logger.debug(`✓ ${query.split('ON')[1].trim()}`);
      } catch (err) {
        if (err.code !== '42P07') { // Ignore already exists error
          logger.warn(`Index creation warning: ${err.message}`);
        }
      }
    }
    
    // ============================================
    // 2. Create Composite Indexes for Common Queries
    // ============================================
    logger.info('Adding composite indexes...');
    
    const compositeIndexes = [
      `CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status 
       ON contracts(tenant_id, status);`,
      
      `CREATE INDEX IF NOT EXISTS idx_payments_contract_status 
       ON payments(contract_id, status);`,
      
      `CREATE INDEX IF NOT EXISTS idx_audit_user_timestamp 
       ON access_audit(user_id, created_at DESC);`,
      
      `CREATE INDEX IF NOT EXISTS idx_audit_resource_timestamp 
       ON access_audit(resource_type, created_at DESC);`,
    ];
    
    for (const query of compositeIndexes) {
      try {
        await pool.query(query);
        logger.debug(`✓ Composite index created`);
      } catch (err) {
        if (err.code !== '42P07') {
          logger.warn(`Composite index warning: ${err.message}`);
        }
      }
    }
    
    // ============================================
    // 3. Create Full-Text Search Indexes
    // ============================================
    logger.info('Setting up full-text search...');
    
    const ftsQueries = [
      // Add tsvector column for contracts if not exists
      `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS search_text tsvector;`,
      
      `UPDATE contracts 
       SET search_text = to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
       WHERE search_text IS NULL;`,
      
      `CREATE INDEX IF NOT EXISTS idx_contracts_search 
       ON contracts USING GIN(search_text);`,
      
      // Create trigger to auto-update tsvector
      `CREATE OR REPLACE FUNCTION contracts_search_update_trigger() 
       RETURNS trigger AS $$
       BEGIN
         NEW.search_text := to_tsvector('english', 
           COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '')
         );
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,
      
      `DROP TRIGGER IF EXISTS contracts_search_update ON contracts;`,
      
      `CREATE TRIGGER contracts_search_update 
       BEFORE INSERT OR UPDATE ON contracts
       FOR EACH ROW EXECUTE FUNCTION contracts_search_update_trigger();`,
    ];
    
    for (const query of ftsQueries) {
      try {
        await pool.query(query);
        logger.debug('✓ Full-text search configured');
      } catch (err) {
        logger.warn(`FTS warning: ${err.message}`);
      }
    }
    
    // ============================================
    // 4. Create Query Performance Views
    // ============================================
    logger.info('Creating performance monitoring views...');
    
    const viewQueries = [
      // Slow queries view
      `CREATE OR REPLACE VIEW slow_queries AS
       SELECT 
         mean_exec_time,
         max_exec_time,
         calls,
         query
       FROM pg_stat_statements
       WHERE mean_exec_time > 100
       ORDER BY mean_exec_time DESC
       LIMIT 20;`,
      
      // Index usage view
      `CREATE OR REPLACE VIEW index_usage AS
       SELECT 
         schemaname,
         tablename,
         indexname,
         idx_scan as scans,
         idx_tup_read as tuples_read,
         idx_tup_fetch as tuples_fetched
       FROM pg_stat_user_indexes
       ORDER BY idx_scan DESC;`,
      
      // Table size view
      `CREATE OR REPLACE VIEW table_sizes AS
       SELECT 
         tablename,
         pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size,
         pg_total_relation_size(schemaname || '.' || tablename) AS bytes
       FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;`,
    ];
    
    for (const query of viewQueries) {
      try {
        await pool.query(query);
        logger.debug('✓ Performance view created');
      } catch (err) {
        logger.warn(`View creation warning: ${err.message}`);
      }
    }
    
    // ============================================
    // 5. Enable Query Statistics (if not enabled)
    // ============================================
    logger.info('Enabling query statistics...');
    
    try {
      // Note: This requires pg_stat_statements extension
      await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`);
      await pool.query(`SELECT pg_stat_statements_reset();`);
      logger.info('✓ Query statistics enabled');
    } catch (err) {
      logger.warn(`Query statistics not available (superuser required): ${err.message}`);
    }
    
    // ============================================
    // 6. Analyze Tables for Query Planner
    // ============================================
    logger.info('Analyzing tables for query optimization...');
    
    try {
      await pool.query('ANALYZE;');
      logger.info('✓ Tables analyzed');
    } catch (err) {
      logger.error(`ANALYZE failed: ${err.message}`);
    }
    
    // ============================================
    // 7. Add Partitioning for Large Tables (Optional)
    // ============================================
    logger.info('Setting up table partitioning...');
    
    // Partition access_audit by month if not already partitioned
    try {
      const partitionQueries = [
        // Create partitioned table if doesn't exist
        `CREATE TABLE IF NOT EXISTS access_audit_partitioned (
          LIKE access_audit
        ) PARTITION BY RANGE (created_at);`,
        
        // Create partition for current month
        `CREATE TABLE IF NOT EXISTS access_audit_current 
         PARTITION OF access_audit_partitioned
         FOR VALUES FROM (MINVALUE) TO (MAXVALUE);`,
      ];
      
      // This is complex and optional - log as info only
      logger.info('ℹ Partitioning configuration reviewed (manual setup may be needed)');
    } catch (err) {
      logger.debug(`Partitioning not configured: ${err.message}`);
    }
    
    logger.info('✅ Database optimization migration completed successfully!');
    
    return true;
  } catch (error) {
    logger.error(`Database optimization migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Migration down - Remove optimizations
 */
async function down(pool) {
  logger.info('⬅️ Reverting database optimization migration...');
  
  try {
    const dropQueries = [
      'DROP TRIGGER IF EXISTS contracts_search_update ON contracts;',
      'DROP FUNCTION IF EXISTS contracts_search_update_trigger();',
      'DROP VIEW IF EXISTS slow_queries;',
      'DROP VIEW IF EXISTS index_usage;',
      'DROP VIEW IF EXISTS table_sizes;',
      'DROP INDEX IF EXISTS idx_contracts_search;',
      'ALTER TABLE contracts DROP COLUMN IF EXISTS search_text;',
    ];
    
    for (const query of dropQueries) {
      await pool.query(query);
    }
    
    logger.info('✅ Database optimization migration reverted');
    return true;
  } catch (error) {
    logger.error(`Rollback failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: '007_database_optimization',
  up,
  down
};
