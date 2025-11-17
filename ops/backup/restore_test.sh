#!/bin/bash

###############################################################################
# Restore Test Script
# Validates backup/restore functionality with comprehensive testing
###############################################################################

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"
readonly LOG_FILE="${SCRIPT_DIR}/logs/restore_test_$(date +%Y%m%d_%H%M%S).log"

# Database configuration
readonly PG_HOST="${PG_HOST:-localhost}"
readonly PG_PORT="${PG_PORT:-5432}"
readonly PG_USER="${PG_USER:-postgres}"
readonly PG_DATABASE="${PG_DATABASE:-akig}"
readonly TEST_DB="${PG_DATABASE}_restore"

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

###############################################################################
# Utility Functions
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $@" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $@" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[✗]${NC} $@" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $@" | tee -a "$LOG_FILE"
}

###############################################################################
# Restore Test Functions
###############################################################################

get_latest_backup() {
  if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: $BACKUP_DIR"
    return 1
  fi
  
  local latest_backup
  latest_backup=$(find "$BACKUP_DIR" -maxdepth 1 -name "*.dump" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
  
  if [ -z "$latest_backup" ]; then
    log_error "No backup files found in $BACKUP_DIR"
    return 1
  fi
  
  echo "$latest_backup"
}

execute_restore() {
  local backup_file="$1"
  
  log_info "Starting restore from: $backup_file"
  
  # Check if test database exists
  if PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -lqt 2>/dev/null | cut -d'|' -f1 | grep -qw "$TEST_DB"; then
    
    log_warn "Test database already exists: $TEST_DB"
    log_info "Dropping existing test database..."
    PGPASSWORD="${PG_PASSWORD:-}" dropdb \
      -h "$PG_HOST" \
      -p "$PG_PORT" \
      -U "$PG_USER" \
      --if-exists "$TEST_DB" 2>&1 | tee -a "$LOG_FILE"
  fi
  
  # Create test database
  log_info "Creating test database: $TEST_DB"
  PGPASSWORD="${PG_PASSWORD:-}" createdb \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    "$TEST_DB" 2>&1 | tee -a "$LOG_FILE"
  
  # Restore from backup
  log_info "Executing pg_restore..."
  if PGPASSWORD="${PG_PASSWORD:-}" pg_restore \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$TEST_DB" \
    "$backup_file" 2>&1 | tee -a "$LOG_FILE"; then
    
    log_success "Restore completed successfully"
    return 0
  else
    log_error "Restore failed"
    return 1
  fi
}

validate_restore() {
  log_info "Validating restored database..."
  
  # Test 1: Count invoices
  log_info "Test 1: Counting invoice records..."
  local invoice_count
  invoice_count=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$TEST_DB" \
    -t -c "SELECT count(*) FROM invoices;" 2>&1)
  
  if [ -z "$invoice_count" ] || [ "$invoice_count" = "" ]; then
    log_error "Failed to count invoices"
    return 1
  fi
  
  log_success "Invoice count: $invoice_count"
  
  # Test 2: Count contracts
  log_info "Test 2: Counting contract records..."
  local contract_count
  contract_count=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$TEST_DB" \
    -t -c "SELECT count(*) FROM contracts;" 2>&1)
  
  log_success "Contract count: $contract_count"
  
  # Test 3: Count users
  log_info "Test 3: Counting user records..."
  local user_count
  user_count=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$TEST_DB" \
    -t -c "SELECT count(*) FROM users;" 2>&1)
  
  log_success "User count: $user_count"
  
  # Test 4: Verify schema integrity
  log_info "Test 4: Verifying schema integrity..."
  local table_count
  table_count=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$TEST_DB" \
    -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1)
  
  log_success "Table count: $table_count"
  
  # Test 5: Check for data integrity issues
  log_info "Test 5: Running data integrity checks..."
  
  # Check for orphaned records (example)
  local orphaned
  orphaned=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$TEST_DB" \
    -t -c "SELECT count(*) FROM contracts WHERE user_id NOT IN (SELECT id FROM users);" 2>&1)
  
  if [ "$orphaned" != "0" ] && [ -n "$orphaned" ]; then
    log_warn "Found $orphaned orphaned contracts"
  else
    log_success "No data integrity issues detected"
  fi
  
  # Test 6: Query performance check
  log_info "Test 6: Performance check (sample query)..."
  local start_time
  start_time=$(date +%s%N)
  
  PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$TEST_DB" \
    -t -c "SELECT count(*) FROM invoices WHERE created_at > NOW() - INTERVAL '30 days';" > /dev/null 2>&1
  
  local end_time
  end_time=$(date +%s%N)
  local duration=$(( (end_time - start_time) / 1000000 ))
  
  log_success "Query completed in ${duration}ms"
  
  return 0
}

cleanup_test_db() {
  log_info "Cleaning up test database: $TEST_DB"
  
  if PGPASSWORD="${PG_PASSWORD:-}" dropdb \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    --if-exists "$TEST_DB" 2>&1 | tee -a "$LOG_FILE"; then
    
    log_success "Test database cleaned up"
    return 0
  else
    log_error "Failed to clean up test database"
    return 1
  fi
}

###############################################################################
# Report Generation
###############################################################################

generate_report() {
  local backup_file="$1"
  local status="$2"
  local duration="$3"
  
  cat >> "$LOG_FILE" << EOF

================================================================================
                        RESTORE TEST REPORT
================================================================================
Timestamp:      $(date -u +%Y-%m-%dT%H:%M:%SZ)
Backup File:    $backup_file
Backup Size:    $(du -h "$backup_file" | cut -f1)
Source DB:      ${PG_DATABASE}
Test DB:        ${TEST_DB}
Host:           ${PG_HOST}:${PG_PORT}
Test Status:    $status
Duration:       ${duration}s
================================================================================

EOF
}

###############################################################################
# Main
###############################################################################

main() {
  mkdir -p "$(dirname "$LOG_FILE")"
  
  log_info "Starting restore test..."
  log_info "Log file: $LOG_FILE"
  
  # Get latest backup
  local backup_file
  if ! backup_file=$(get_latest_backup); then
    log_error "Cannot find backup file"
    return 1
  fi
  
  log_info "Using backup: $backup_file"
  
  local start_time
  start_time=$(date +%s)
  
  # Execute restore
  if ! execute_restore "$backup_file"; then
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    generate_report "$backup_file" "FAILED" "$duration"
    log_error "Restore test failed"
    return 1
  fi
  
  # Validate restore
  if ! validate_restore; then
    cleanup_test_db || true
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    generate_report "$backup_file" "VALIDATION_FAILED" "$duration"
    log_error "Restore validation failed"
    return 1
  fi
  
  # Cleanup
  if ! cleanup_test_db; then
    log_warn "Warning: Test database may not have been cleaned up properly"
  fi
  
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  generate_report "$backup_file" "SUCCESS" "$duration"
  log_success "Restore test completed successfully in ${duration}s"
  
  return 0
}

# Run main
main "$@"
