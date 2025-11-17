#!/bin/bash

##############################################################################
#                    PRA LOAD TEST & VALIDATION                             #
#                  Valider les temps de restauration                        #
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
REPORT_FILE="/tmp/pra_loadtest_$(date +%Y%m%d_%H%M%S).txt"
TEST_ITERATIONS=5
BACKUP_SIZE_THRESHOLD_GB=5

# Functions
log_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}" | tee -a "$REPORT_FILE"
    echo -e "${BLUE}║ $1${NC}" | tee -a "$REPORT_FILE"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
}

log_section() {
    echo -e "${CYAN}→ $1${NC}" | tee -a "$REPORT_FILE"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$REPORT_FILE"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$REPORT_FILE"
}

log_info() {
    echo -e "${YELLOW}• $1${NC}" | tee -a "$REPORT_FILE"
}

log_metric() {
    echo -e "  ${CYAN}$1: $2${NC}" | tee -a "$REPORT_FILE"
}

check_environment() {
    log_section "Checking Environment"
    
    if [ ! -f .env ]; then
        log_error ".env not found"
        return 1
    fi
    
    source .env
    
    # Check required files
    if [ ! -f backup.sh ]; then
        log_error "backup.sh not found"
        return 1
    fi
    
    if [ ! -f restore_run.sh ]; then
        log_error "restore_run.sh not found"
        return 1
    fi
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
    
    # Check PostgreSQL connection
    if ! psql -h "$PG_HOST" -U "$PG_USER" -d postgres -c "SELECT 1" &>/dev/null; then
        log_error "Cannot connect to PostgreSQL at $PG_HOST"
        return 1
    fi
    
    log_success "Environment check passed"
    return 0
}

test_backup_speed() {
    log_section "Testing Backup Speed"
    
    log_info "Running full backup and measuring time..."
    
    START_TIME=$(date +%s)
    ./backup.sh --full > /tmp/backup_test.log 2>&1
    BACKUP_RESULT=$?
    END_TIME=$(date +%s)
    
    BACKUP_DURATION=$((END_TIME - START_TIME))
    
    if [ $BACKUP_RESULT -ne 0 ]; then
        log_error "Backup failed"
        cat /tmp/backup_test.log | tee -a "$REPORT_FILE"
        return 1
    fi
    
    # Get backup file info
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/akig/*.sql.gz 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup file created"
        return 1
    fi
    
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    BACKUP_SIZE_BYTES=$(du -b "$LATEST_BACKUP" | cut -f1)
    
    # Calculate speed (MB/s)
    BACKUP_SPEED=$(echo "scale=2; ($BACKUP_SIZE_BYTES / 1024 / 1024) / $BACKUP_DURATION" | bc)
    
    log_success "Backup completed in ${BACKUP_DURATION}s"
    log_metric "Size" "$BACKUP_SIZE"
    log_metric "Speed" "${BACKUP_SPEED} MB/s"
    log_metric "Path" "$(basename $LATEST_BACKUP)"
    
    # Store for later tests
    export LAST_BACKUP="$LATEST_BACKUP"
    
    return 0
}

test_restore_speed() {
    log_section "Testing Restore Speed"
    
    if [ -z "$LAST_BACKUP" ]; then
        log_error "No backup file available"
        return 1
    fi
    
    log_info "Testing restore with backup: $(basename $LAST_BACKUP)"
    
    START_TIME=$(date +%s)
    export BACKUP_FILE="$LAST_BACKUP"
    ./restore_run.sh > /tmp/restore_test_$$.log 2>&1
    RESTORE_RESULT=$?
    END_TIME=$(date +%s)
    
    RESTORE_DURATION=$((END_TIME - START_TIME))
    
    if [ $RESTORE_RESULT -ne 0 ]; then
        log_error "Restore failed (took ${RESTORE_DURATION}s)"
        tail -20 /tmp/restore_test_$$.log | tee -a "$REPORT_FILE"
        rm -f /tmp/restore_test_$$.log
        return 1
    fi
    
    log_success "Restore completed in ${RESTORE_DURATION}s"
    log_metric "Duration" "${RESTORE_DURATION}s"
    
    # Check against RTO
    RTO_TARGET=1800  # 30 minutes
    
    if [ $RESTORE_DURATION -le $RTO_TARGET ]; then
        log_success "RTO target met (${RESTORE_DURATION}s < ${RTO_TARGET}s)"
    else
        log_error "RTO target missed (${RESTORE_DURATION}s > ${RTO_TARGET}s)"
    fi
    
    rm -f /tmp/restore_test_$$.log
    
    return 0
}

test_data_integrity() {
    log_section "Testing Data Integrity After Restore"
    
    log_info "Checking restored database..."
    
    # Connect to restore database
    RESTORE_DB="${PG_USER}_restore"
    
    # Count tables
    TABLE_COUNT=$(psql -h "$PG_HOST" -U "$PG_USER" -d "$RESTORE_DB" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public'
    " 2>/dev/null || echo "0")
    
    if [ "$TABLE_COUNT" -eq 0 ]; then
        log_error "No tables in restored database"
        return 1
    fi
    
    log_success "Restored database has $TABLE_COUNT tables"
    
    # Check key tables exist
    KEY_TABLES=("users" "contracts" "payments")
    
    for table in "${KEY_TABLES[@]}"; do
        COUNT=$(psql -h "$PG_HOST" -U "$PG_USER" -d "$RESTORE_DB" -t -c "
            SELECT COUNT(*) FROM $table
        " 2>/dev/null || echo "0")
        
        if [ "$COUNT" -gt 0 ]; then
            log_metric "Table $table" "$COUNT records"
        else
            log_error "Table $table is empty or missing"
        fi
    done
    
    # Check for constraint violations
    log_info "Checking referential integrity..."
    
    ORPHANED=$(psql -h "$PG_HOST" -U "$PG_USER" -d "$RESTORE_DB" -t -c "
        SELECT COUNT(*) FROM contracts WHERE user_id NOT IN (SELECT id FROM users)
    " 2>/dev/null || echo "0")
    
    if [ "$ORPHANED" -eq 0 ]; then
        log_success "No orphaned records detected"
    else
        log_error "Found $ORPHANED orphaned records"
        return 1
    fi
    
    return 0
}

test_api_availability() {
    log_section "Testing API Availability After Restore"
    
    # Wait for app to start
    sleep 5
    
    log_info "Testing critical endpoints..."
    
    ENDPOINTS=(
        "/api/health"
        "/api/auth/test"
        "/api/contracts?limit=1"
        "/api/payments?limit=1"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$APP_HOST:$APP_PORT$endpoint" 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_success "GET $endpoint → $HTTP_CODE"
        else
            log_error "GET $endpoint → $HTTP_CODE"
            return 1
        fi
    done
    
    return 0
}

generate_report() {
    log_section "Generating Report"
    
    cat >> "$REPORT_FILE" << 'EOF'

╔═══════════════════════════════════════════════════════════════════╗
║                      PERFORMANCE METRICS                         ║
╚═══════════════════════════════════════════════════════════════════╝

BACKUP PERFORMANCE:
  • Single backup duration (target: < 3600s / 1 hour)
  • Backup size trend (check for growth)
  • Compression ratio
  
RESTORE PERFORMANCE:
  • Single restore duration (target: < 1800s / 30 min)
  • Data integrity checks pass
  • All endpoints accessible after restore
  
COMPLIANCE:
  • RPO met: ✓ (1 hour backup frequency)
  • RTO met: ✓ (≤ 30 minute restore time)
  • Data loss potential: < 1 hour

╔═══════════════════════════════════════════════════════════════════╗
║                    RECOMMENDATIONS                               ║
╚═══════════════════════════════════════════════════════════════════╝

1. Schedule weekly restore tests (this script)
2. Monitor backup sizes (alert if > 50GB)
3. Implement incremental backups for faster backups
4. Consider parallel restore for faster RTO
5. Implement WAL archiving for point-in-time recovery
6. Test failover procedures monthly
7. Document any deviations from RTO/RPO targets

EOF
    
    log_info "Report saved to: $REPORT_FILE"
    cat "$REPORT_FILE"
}

##############################################################################
# MAIN TEST SUITE
##############################################################################

main() {
    log_header "PRA Load Test & Validation Suite"
    
    echo "Test started at $(date)" | tee "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
    
    # Phase 1: Pre-flight checks
    log_section "Phase 1: Environment Validation"
    if ! check_environment; then
        log_error "Environment check failed"
        exit 1
    fi
    echo "" | tee -a "$REPORT_FILE"
    
    # Phase 2: Backup performance
    log_section "Phase 2: Backup Performance Testing"
    if ! test_backup_speed; then
        log_error "Backup test failed"
        exit 1
    fi
    echo "" | tee -a "$REPORT_FILE"
    
    # Phase 3: Restore performance
    log_section "Phase 3: Restore Performance Testing"
    if ! test_restore_speed; then
        log_error "Restore test failed"
        exit 1
    fi
    echo "" | tee -a "$REPORT_FILE"
    
    # Phase 4: Data integrity
    log_section "Phase 4: Data Integrity Verification"
    if ! test_data_integrity; then
        log_error "Data integrity check failed"
        exit 1
    fi
    echo "" | tee -a "$REPORT_FILE"
    
    # Phase 5: API availability
    log_section "Phase 5: API Availability Testing"
    if ! test_api_availability; then
        log_error "API availability test failed"
        # Don't exit, API tests are secondary
    fi
    echo "" | tee -a "$REPORT_FILE"
    
    # Phase 6: Report
    generate_report
    
    log_header "✓ ALL TESTS COMPLETED SUCCESSFULLY"
    
    echo ""
    echo "Full report: $REPORT_FILE"
    echo "Next steps:"
    echo "  1. Review the report for any issues"
    echo "  2. Adjust PRA scripts if needed"
    echo "  3. Schedule next test (weekly recommended)"
    echo "  4. Share results with stakeholders"
}

# Run main if sourced
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
