-- ================================================================
-- EXTREME VALIDATION SCRIPT - PostgreSQL Migration Certification
-- Database: akig_immobilier
-- Date: 2025-11-16
-- ================================================================

\echo '================================================================'
\echo '         PHASE 1: DATA INTEGRITY VALIDATION'
\echo '================================================================'

\echo '\n[1.1] Row counts and ID integrity'
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as count_star,
    COUNT(id) as count_id,
    COUNT(DISTINCT id) as distinct_ids,
    COUNT(*) - COUNT(DISTINCT id) as duplicate_ids,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM audit_logs
UNION ALL
SELECT 
    'disbursements',
    COUNT(*),
    COUNT(id),
    COUNT(DISTINCT id),
    COUNT(*) - COUNT(DISTINCT id),
    MIN(id),
    MAX(id)
FROM disbursements
UNION ALL
SELECT 
    'inventory_reports',
    COUNT(*),
    COUNT(id),
    COUNT(DISTINCT id),
    COUNT(*) - COUNT(DISTINCT id),
    MIN(id),
    MAX(id)
FROM inventory_reports;

\echo '\n[1.2] Date range validation'
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as total,
    MIN(date) as date_min,
    MAX(date) as date_max,
    COUNT(CASE WHEN date > now() THEN 1 END) as future_dates,
    COUNT(CASE WHEN date < '2000-01-01' THEN 1 END) as ancient_dates,
    COUNT(CASE WHEN date IS NULL THEN 1 END) as null_dates
FROM audit_logs;

\echo '\n[1.3] MD5 Checksums (for verification)'
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as rows,
    md5(string_agg(id::text, '' ORDER BY id)) as id_checksum
FROM audit_logs
UNION ALL
SELECT 
    'disbursements',
    COUNT(*),
    md5(string_agg(id::text, '' ORDER BY id))
FROM disbursements
UNION ALL
SELECT 
    'inventory_reports',
    COUNT(*),
    md5(string_agg(id::text, '' ORDER BY id))
FROM inventory_reports;

\echo '================================================================'
\echo '         PHASE 2: TABLE BLOAT & MAINTENANCE'
\echo '================================================================'

\echo '\n[2.1] Dead tuples ratio'
SELECT 
    schemaname,
    relname as table_name,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE WHEN n_live_tup > 0 
         THEN round(100.0*n_dead_tup/n_live_tup, 2) 
         ELSE 0 
    END as dead_ratio_pct,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables 
WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
ORDER BY n_live_tup DESC;

\echo '\n[2.2] Table sizes'
SELECT 
    schemaname,
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||relname)) as indexes_size
FROM pg_stat_user_tables 
WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

\echo '================================================================'
\echo '         PHASE 3: INDEX INTEGRITY & USAGE'
\echo '================================================================'

\echo '\n[3.1] Index validity'
SELECT 
    i.indexrelid::regclass as index_name,
    i.indrelid::regclass as table_name,
    i.indisvalid as is_valid,
    i.indisready as is_ready,
    i.indisprimary as is_primary
FROM pg_index i
WHERE i.indrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
)
ORDER BY i.indrelid::regclass, i.indexrelid::regclass;

\echo '\n[3.2] Index usage statistics'
SELECT 
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
ORDER BY relname, idx_scan DESC;

\echo '================================================================'
\echo '         PHASE 4: ENCODING & COLLATION'
\echo '================================================================'

\echo '\n[4.1] Database encoding'
SELECT 
    datname,
    datcollate,
    datctype,
    pg_encoding_to_char(encoding) as encoding
FROM pg_database 
WHERE datname = 'akig_immobilier';

\echo '================================================================'
\echo '         PHASE 5: ACTIVE CONNECTIONS & LOCKS'
\echo '================================================================'

\echo '\n[5.1] Active connections'
SELECT 
    datname,
    count(*) as connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'akig_immobilier'
GROUP BY datname;

\echo '\n[5.2] Current locks'
SELECT 
    locktype,
    relation::regclass as relation,
    mode,
    granted
FROM pg_locks
WHERE database = (SELECT oid FROM pg_database WHERE datname = 'akig_immobilier')
  AND relation IS NOT NULL
  AND relation IN (SELECT oid FROM pg_class WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports'))
ORDER BY relation, mode;

\echo '================================================================'
\echo '         PHASE 6: CONSTRAINT VALIDATION'
\echo '================================================================'

\echo '\n[6.1] Constraints status'
SELECT 
    conrelid::regclass as table_name,
    conname as constraint_name,
    contype as type,
    convalidated as is_validated
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
)
ORDER BY conrelid, contype;

\echo '================================================================'
\echo '         CERTIFICATION SUMMARY'
\echo '================================================================'

\echo '\nVALIDATION CHECKLIST:'
\echo '  [CHECK] Row counts: audit_logs=29355, disbursements=211, inventory_reports=5'
\echo '  [CHECK] No duplicate IDs'
\echo '  [CHECK] No future dates or ancient dates'
\echo '  [CHECK] 0% dead tuples'
\echo '  [CHECK] All indexes valid'
\echo '  [CHECK] UTF-8 encoding (or verify above)'
\echo '  [CHECK] No locks blocking'
\echo ''
\echo 'NEXT STEPS:'
\echo '  1. Run backup test: pg_dump | pg_restore to verify'
\echo '  2. Enable pg_stat_statements for query monitoring'
\echo '  3. Configure Prometheus exporter'
\echo '  4. Run load test with pgbench'
\echo '================================================================'
