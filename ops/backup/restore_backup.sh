#!/bin/bash

###############################################################################
# Database Backup & Restore Operations
# Comprehensive backup/restore strategy with validation and recovery
###############################################################################

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"
readonly LOG_DIR="${LOG_DIR:-${SCRIPT_DIR}/logs}"
readonly ARCHIVE_DIR="${ARCHIVE_DIR:-${SCRIPT_DIR}/archive}"
readonly RETENTION_DAYS="${RETENTION_DAYS:-30}"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly DATE_ONLY=$(date +%Y-%m-%d)
readonly LOG_FILE="${LOG_DIR}/backup_restore_${TIMESTAMP}.log"

# Database configuration from environment
readonly PG_HOST="${PG_HOST:-localhost}"
readonly PG_PORT="${PG_PORT:-5432}"
readonly PG_USER="${PG_USER:-postgres}"
readonly PG_DATABASE="${PG_DATABASE:-akig}"
readonly BACKUP_FILENAME="${DATE_ONLY}.dump"
readonly BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

###############################################################################
# Logging Functions
###############################################################################

log() {
  local level="$1"
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
  echo -e "${BLUE}[INFO]${NC} $@" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $@" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $@" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $@" | tee -a "$LOG_FILE"
}

###############################################################################
# Utility Functions
###############################################################################

init_directories() {
  mkdir -p "$BACKUP_DIR" "$LOG_DIR" "$ARCHIVE_DIR"
  chmod 700 "$BACKUP_DIR" "$LOG_DIR" "$ARCHIVE_DIR"
  log_info "Initialized directories"
}

verify_environment() {
  log_info "Verifying environment..."
  
  # Check required tools
  for cmd in pg_dump pg_restore psql; do
    if ! command -v "$cmd" &> /dev/null; then
      log_error "Required command '$cmd' not found. Install PostgreSQL client tools."
      return 1
    fi
  done
  
  # Check database connection
  if ! PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$PG_DATABASE" \
    -c "SELECT 1;" &> /dev/null; then
    log_error "Cannot connect to database at ${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
    return 1
  fi
  
  log_success "Environment verified successfully"
  return 0
}

get_db_size() {
  PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$PG_DATABASE" \
    -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
}

get_table_count() {
  PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$PG_DATABASE" \
    -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
}

###############################################################################
# Backup Functions
###############################################################################

create_backup() {
  log_info "Starting database backup..."
  log_info "Database: ${PG_DATABASE} at ${PG_HOST}:${PG_PORT}"
  
  local db_size
  db_size=$(get_db_size)
  log_info "Database size: ${db_size}"
  
  local table_count
  table_count=$(get_table_count)
  log_info "Table count: ${table_count}"
  
  if [ -f "$BACKUP_PATH" ]; then
    log_warn "Backup file already exists: $BACKUP_PATH"
    local backup_age=$(($(date +%s) - $(stat -c %Y "$BACKUP_PATH" 2>/dev/null || echo 0)))
    if [ $backup_age -lt 3600 ]; then
      log_warn "Backup is less than 1 hour old. Skipping backup."
      return 0
    fi
  fi
  
  # Create backup with progress
  log_info "Creating backup file: $BACKUP_PATH"
  
  if PGPASSWORD="${PG_PASSWORD:-}" pg_dump \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$PG_DATABASE" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_PATH" 2>&1 | tee -a "$LOG_FILE"; then
    
    log_success "Backup completed successfully"
    
    # Verify backup
    if [ ! -f "$BACKUP_PATH" ] || [ ! -s "$BACKUP_PATH" ]; then
      log_error "Backup file is empty or missing"
      return 1
    fi
    
    local backup_size
    backup_size=$(du -h "$BACKUP_PATH" | cut -f1)
    log_info "Backup size: ${backup_size}"
    
    # Generate backup metadata
    generate_backup_metadata "$BACKUP_PATH"
    return 0
  else
    log_error "Backup creation failed"
    return 1
  fi
}

generate_backup_metadata() {
  local backup_file="$1"
  local metadata_file="${backup_file}.meta"
  
  cat > "$metadata_file" << EOF
{
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "${PG_DATABASE}",
  "host": "${PG_HOST}",
  "port": "${PG_PORT}",
  "file_size": $(stat -c%s "$backup_file" 2>/dev/null || echo 0),
  "file_size_human": "$(du -h "$backup_file" | cut -f1)",
  "checksum": "$(md5sum "$backup_file" | cut -d' ' -f1)",
  "table_count": "$(get_table_count)",
  "database_size": "$(get_db_size)"
}
EOF
  
  log_info "Backup metadata saved to: $metadata_file"
}

###############################################################################
# Restore Functions
###############################################################################

restore_backup() {
  local backup_file="${1:-$BACKUP_PATH}"
  local restore_db="${2:-${PG_DATABASE}_restore}"
  
  if [ ! -f "$backup_file" ]; then
    log_error "Backup file not found: $backup_file"
    return 1
  fi
  
  log_info "Starting restore from: $backup_file"
  log_info "Target database: $restore_db"
  
  # Check if restore database exists
  if PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -lqt | cut -d'|' -f1 | grep -qw "$restore_db"; then
    
    log_warn "Restore database '$restore_db' already exists"
    read -p "Drop existing database? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      log_info "Dropping database: $restore_db"
      PGPASSWORD="${PG_PASSWORD:-}" dropdb \
        -h "$PG_HOST" \
        -p "$PG_PORT" \
        -U "$PG_USER" \
        --if-exists "$restore_db"
    else
      log_error "Cannot proceed with existing database"
      return 1
    fi
  fi
  
  # Create restore database
  log_info "Creating restore database: $restore_db"
  PGPASSWORD="${PG_PASSWORD:-}" createdb \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    "$restore_db"
  
  # Perform restore
  log_info "Restoring database..."
  if PGPASSWORD="${PG_PASSWORD:-}" pg_restore \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$restore_db" \
    --verbose \
    "$backup_file" 2>&1 | tee -a "$LOG_FILE"; then
    
    log_success "Restore completed successfully"
    validate_restore "$restore_db"
    return 0
  else
    log_error "Restore failed"
    return 1
  fi
}

validate_restore() {
  local restored_db="$1"
  
  log_info "Validating restored database..."
  
  # Get table count
  local table_count
  table_count=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$restored_db" \
    -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
  
  log_info "Restored table count: ${table_count}"
  
  # Check critical tables
  local critical_tables=("users" "contracts" "payments")
  for table in "${critical_tables[@]}"; do
    if PGPASSWORD="${PG_PASSWORD:-}" psql \
      -h "$PG_HOST" \
      -p "$PG_PORT" \
      -U "$PG_USER" \
      -d "$restored_db" \
      -c "SELECT 1 FROM $table LIMIT 1;" &> /dev/null; then
      
      local row_count
      row_count=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
        -h "$PG_HOST" \
        -p "$PG_PORT" \
        -U "$PG_USER" \
        -d "$restored_db" \
        -t -c "SELECT count(*) FROM $table;")
      
      log_success "Table '$table' validated (${row_count} rows)"
    else
      log_warn "Table '$table' not found in restore"
    fi
  done
  
  log_success "Restore validation completed"
}

###############################################################################
# Cleanup & Archival Functions
###############################################################################

archive_old_backups() {
  log_info "Archiving backups older than ${RETENTION_DAYS} days..."
  
  local count=0
  while IFS= read -r -d '' backup_file; do
    local file_age_days=$(( ($(date +%s) - $(stat -c %Y "$backup_file")) / 86400 ))
    
    if [ $file_age_days -gt $RETENTION_DAYS ]; then
      local archive_name=$(basename "$backup_file" .dump)_archived_${TIMESTAMP}.tar.gz
      
      log_info "Archiving: $backup_file (${file_age_days} days old)"
      tar -czf "${ARCHIVE_DIR}/${archive_name}" \
        -C "$(dirname "$backup_file")" \
        "$(basename "$backup_file")" \
        "$(basename "$backup_file").meta" 2>/dev/null || true
      
      rm -f "$backup_file" "${backup_file}.meta"
      count=$((count + 1))
    fi
  done < <(find "$BACKUP_DIR" -maxdepth 1 -name "*.dump" -print0)
  
  log_info "Archived $count old backup(s)"
}

cleanup_restore_databases() {
  log_info "Cleaning up restore databases..."
  
  local restore_dbs
  restore_dbs=$(PGPASSWORD="${PG_PASSWORD:-}" psql \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -lqt | cut -d'|' -f1 | grep '_restore$' || true)
  
  if [ -z "$restore_dbs" ]; then
    log_info "No restore databases found"
    return 0
  fi
  
  while IFS= read -r db_name; do
    if [ -n "$db_name" ]; then
      log_warn "Dropping restore database: $db_name"
      PGPASSWORD="${PG_PASSWORD:-}" dropdb \
        -h "$PG_HOST" \
        -p "$PG_PORT" \
        -U "$PG_USER" \
        --if-exists "$db_name"
    fi
  done <<< "$restore_dbs"
}

###############################################################################
# List & Info Functions
###############################################################################

list_backups() {
  log_info "Available backups:"
  
  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR")" ]; then
    log_warn "No backups found"
    return 0
  fi
  
  echo ""
  printf "%-30s %-15s %-20s\n" "Filename" "Size" "Created"
  printf "%s\n" "$(printf '=%.0s' {1..65})"
  
  while IFS= read -r backup_file; do
    local size=$(du -h "$backup_file" | cut -f1)
    local created=$(stat -c %y "$backup_file" | cut -d' ' -f1-2)
    printf "%-30s %-15s %-20s\n" "$(basename "$backup_file")" "$size" "$created"
  done < <(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null || true)
}

show_backup_info() {
  local backup_file="${1:-./${DATE_ONLY}.dump}"
  
  if [ ! -f "$backup_file" ]; then
    log_error "Backup file not found: $backup_file"
    return 1
  fi
  
  local metadata_file="${backup_file}.meta"
  
  echo ""
  echo "=== Backup Information ==="
  echo "File: $backup_file"
  echo "Size: $(du -h "$backup_file" | cut -f1)"
  echo "Modified: $(stat -c %y "$backup_file")"
  
  if [ -f "$metadata_file" ]; then
    echo ""
    echo "=== Metadata ==="
    cat "$metadata_file"
  fi
}

###############################################################################
# Test Functions
###############################################################################

test_backup_restore() {
  log_info "Running backup/restore test cycle..."
  
  # Create backup
  if ! create_backup; then
    log_error "Backup test failed"
    return 1
  fi
  
  # Test restore
  local test_db="${PG_DATABASE}_test_$(date +%s)"
  if ! restore_backup "$BACKUP_PATH" "$test_db"; then
    log_error "Restore test failed"
    return 1
  fi
  
  # Cleanup test database
  log_info "Cleaning up test database: $test_db"
  PGPASSWORD="${PG_PASSWORD:-}" dropdb \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    --if-exists "$test_db"
  
  log_success "Backup/restore test completed successfully"
}

###############################################################################
# Main Help & Usage
###############################################################################

show_usage() {
  cat << EOF
${BLUE}Database Backup & Restore Tool${NC}

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  backup              Create database backup
  restore [FILE]      Restore from backup file
  list                List available backups
  info [FILE]         Show backup information
  test                Test backup/restore cycle
  cleanup             Clean up old backups and restore databases
  verify              Verify environment and connection

Environment Variables:
  PG_HOST             PostgreSQL host (default: localhost)
  PG_PORT             PostgreSQL port (default: 5432)
  PG_USER             PostgreSQL user (default: postgres)
  PG_DATABASE         Database name (default: akig)
  PG_PASSWORD         PostgreSQL password
  BACKUP_DIR          Backup directory (default: ./backups)
  LOG_DIR             Log directory (default: ./logs)
  RETENTION_DAYS      Backup retention days (default: 30)

Examples:
  $0 backup                          # Create backup
  $0 restore ./2024-01-15.dump       # Restore from file
  $0 list                            # List all backups
  $0 test                            # Test backup/restore
  PG_PASSWORD=secret $0 backup       # Backup with password

${YELLOW}Note:${NC} Backups are compressed and stored in: $BACKUP_DIR

EOF
}

###############################################################################
# Main Entry Point
###############################################################################

main() {
  # Initialize
  init_directories
  
  # Handle no arguments
  if [ $# -eq 0 ]; then
    show_usage
    return 0
  fi
  
  local command="$1"
  shift || true
  
  case "$command" in
    backup)
      verify_environment || return 1
      create_backup
      ;;
    restore)
      verify_environment || return 1
      restore_backup "$@"
      ;;
    list)
      list_backups
      ;;
    info)
      show_backup_info "$@"
      ;;
    test)
      verify_environment || return 1
      test_backup_restore
      ;;
    cleanup)
      verify_environment || return 1
      archive_old_backups
      cleanup_restore_databases
      ;;
    verify)
      verify_environment
      ;;
    help|-h|--help)
      show_usage
      ;;
    *)
      log_error "Unknown command: $command"
      show_usage
      return 1
      ;;
  esac
}

# Run main function
main "$@"
