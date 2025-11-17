#!/bin/bash

###############################################################################
# Backup Scheduler Setup
# Configures automated database backups using cron or systemd timers
###############################################################################

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BACKUP_SCRIPT="${SCRIPT_DIR}/restore_backup.sh"
readonly CRON_FILE="/etc/cron.d/akig-backup"
readonly SYSTEMD_SERVICE="/etc/systemd/system/akig-backup.service"
readonly SYSTEMD_TIMER="/etc/systemd/system/akig-backup.timer"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

###############################################################################
# Utility Functions
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $@"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $@"
}

log_error() {
  echo -e "${RED}[✗]${NC} $@"
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $@"
}

check_root() {
  if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root"
    exit 1
  fi
}

###############################################################################
# Cron Setup (Legacy)
###############################################################################

setup_cron() {
  log_info "Setting up cron job..."
  
  # Create cron file
  cat > "$CRON_FILE" << 'EOF'
# AKIG Database Backup Cron Jobs
# Backup runs daily at 2:00 AM, restore test runs weekly on Sundays at 3:00 AM

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Environment variables
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_DATABASE=akig
BACKUP_DIR=/var/backups/akig

# Daily backup at 2:00 AM
0 2 * * * postgres /opt/akig/ops/backup/restore_backup.sh backup >> /var/log/akig/backup.log 2>&1

# Weekly restore test on Sunday at 3:00 AM
0 3 * * 0 postgres /opt/akig/ops/backup/restore_test.sh >> /var/log/akig/restore_test.log 2>&1

# Cleanup old backups every Monday at 1:00 AM
0 1 * * 1 postgres /opt/akig/ops/backup/restore_backup.sh cleanup >> /var/log/akig/backup.log 2>&1

# Send summary email on Monday at 4:00 AM
0 4 * * 1 postgres /opt/akig/ops/backup/send_backup_summary.sh

EOF

  chmod 644 "$CRON_FILE"
  log_success "Cron file created: $CRON_FILE"
}

###############################################################################
# Systemd Timer Setup (Recommended)
###############################################################################

setup_systemd_service() {
  log_info "Setting up systemd service..."
  
  cat > "$SYSTEMD_SERVICE" << 'EOF'
[Unit]
Description=AKIG Database Backup Service
Documentation=file:///opt/akig/docs/backup.md
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=oneshot
User=postgres
Group=postgres
WorkingDirectory=/var/backups/akig

# Environment
Environment="PG_HOST=localhost"
Environment="PG_PORT=5432"
Environment="PG_USER=postgres"
Environment="PG_DATABASE=akig"
Environment="BACKUP_DIR=/var/backups/akig"

# Backup execution
ExecStart=/opt/akig/ops/backup/restore_backup.sh backup

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=akig-backup

# Restart policy
Restart=on-failure
RestartSec=300

# Resource limits
MemoryLimit=2G
CPUQuota=50%

# Security hardening
PrivateTmp=yes
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/backups/akig /var/log/akig

EOF

  chmod 644 "$SYSTEMD_SERVICE"
  log_success "Systemd service created: $SYSTEMD_SERVICE"
}

setup_systemd_timer() {
  log_info "Setting up systemd timer..."
  
  cat > "$SYSTEMD_TIMER" << 'EOF'
[Unit]
Description=AKIG Database Backup Timer
Documentation=file:///opt/akig/docs/backup.md
Requires=akig-backup.service

[Timer]
# Run daily at 2:00 AM
OnCalendar=daily
OnCalendar=*-*-* 02:00:00

# Run on boot if missed
Persistent=true

# Randomize start time (add 0-5 minutes)
RandomizedDelaySec=300

# Run immediately if system was powered down at scheduled time
AccuracySec=1min

[Install]
WantedBy=timers.target

EOF

  chmod 644 "$SYSTEMD_TIMER"
  log_success "Systemd timer created: $SYSTEMD_TIMER"
}

setup_restore_test_timer() {
  log_info "Setting up restore test timer..."
  
  cat > "/etc/systemd/system/akig-backup-test.timer" << 'EOF'
[Unit]
Description=AKIG Backup Restore Test Timer
Documentation=file:///opt/akig/docs/backup.md
Requires=akig-backup-test.service

[Timer]
# Run weekly on Sunday at 3:00 AM
OnCalendar=Sun *-*-* 03:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target

EOF

  chmod 644 "/etc/systemd/system/akig-backup-test.timer"
  
  cat > "/etc/systemd/system/akig-backup-test.service" << 'EOF'
[Unit]
Description=AKIG Database Backup Restore Test
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=oneshot
User=postgres
Group=postgres
Environment="PG_HOST=localhost"
Environment="PG_PORT=5432"
Environment="PG_USER=postgres"
Environment="PG_DATABASE=akig"
Environment="BACKUP_DIR=/var/backups/akig"
ExecStart=/opt/akig/ops/backup/restore_test.sh
StandardOutput=journal
StandardError=journal
SyslogIdentifier=akig-backup-test
Restart=on-failure
RestartSec=300
MemoryLimit=2G
CPUQuota=50%

[Install]
WantedBy=multi-user.target

EOF

  chmod 644 "/etc/systemd/system/akig-backup-test.service"
  log_success "Restore test timer and service created"
}

###############################################################################
# Installation
###############################################################################

install_scheduler() {
  local method="${1:-systemd}"
  
  check_root
  
  # Create necessary directories
  mkdir -p /var/backups/akig
  mkdir -p /var/log/akig
  chmod 750 /var/backups/akig
  chmod 755 /var/log/akig
  chown postgres:postgres /var/backups/akig
  chown postgres:postgres /var/log/akig
  
  log_info "Installing backup scheduler using: $method"
  
  case "$method" in
    cron)
      setup_cron
      log_success "Cron scheduler installed"
      log_warn "Note: Cron method is legacy. Consider using systemd timers."
      ;;
    systemd)
      setup_systemd_service
      setup_systemd_timer
      setup_restore_test_timer
      
      # Enable and start timers
      systemctl daemon-reload
      systemctl enable akig-backup.timer
      systemctl start akig-backup.timer
      systemctl enable akig-backup-test.timer
      systemctl start akig-backup-test.timer
      
      log_success "Systemd timers installed and started"
      ;;
    *)
      log_error "Unknown scheduler method: $method"
      exit 1
      ;;
  esac
}

###############################################################################
# Verification & Status
###############################################################################

verify_installation() {
  log_info "Verifying backup scheduler installation..."
  
  if [ -f "$SYSTEMD_SERVICE" ]; then
    log_info "Systemd service: $SYSTEMD_SERVICE"
    systemctl is-enabled akig-backup.timer 2>/dev/null && \
      log_success "Timer is enabled" || \
      log_warn "Timer is not enabled"
  fi
  
  if [ -f "$CRON_FILE" ]; then
    log_info "Cron file: $CRON_FILE"
  fi
}

show_status() {
  log_info "Backup scheduler status:"
  
  echo ""
  echo "Systemd Timers:"
  systemctl list-timers akig-backup.timer akig-backup-test.timer 2>/dev/null || \
    log_warn "No systemd timers found"
  
  echo ""
  echo "Recent Backups:"
  ls -lh /var/backups/akig/*.dump 2>/dev/null | tail -5 || \
    log_warn "No backups found"
  
  echo ""
  echo "Recent Logs:"
  tail -10 /var/log/akig/backup.log 2>/dev/null || \
    log_warn "No backup logs found"
}

###############################################################################
# Uninstall
###############################################################################

uninstall_scheduler() {
  check_root
  
  log_warn "Uninstalling backup scheduler..."
  
  # Disable and stop systemd timers
  systemctl disable akig-backup.timer 2>/dev/null || true
  systemctl stop akig-backup.timer 2>/dev/null || true
  systemctl disable akig-backup-test.timer 2>/dev/null || true
  systemctl stop akig-backup-test.timer 2>/dev/null || true
  
  # Remove files
  rm -f "$SYSTEMD_SERVICE" "$SYSTEMD_TIMER"
  rm -f "/etc/systemd/system/akig-backup-test.service"
  rm -f "/etc/systemd/system/akig-backup-test.timer"
  rm -f "$CRON_FILE"
  
  systemctl daemon-reload 2>/dev/null || true
  
  log_success "Backup scheduler uninstalled"
}

###############################################################################
# Main
###############################################################################

show_usage() {
  cat << EOF
${BLUE}AKIG Backup Scheduler Setup${NC}

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  install [METHOD]    Install backup scheduler (cron or systemd)
  verify              Verify installation
  status              Show scheduler status
  uninstall           Remove backup scheduler

Methods:
  cron                Use cron jobs (legacy)
  systemd             Use systemd timers (recommended)

Examples:
  sudo $0 install systemd        # Install systemd timers
  sudo $0 install cron           # Install cron jobs
  $0 status                       # Show current status
  sudo $0 uninstall              # Remove scheduler

EOF
}

main() {
  local command="${1:-help}"
  
  case "$command" in
    install)
      install_scheduler "${2:-systemd}"
      ;;
    verify)
      verify_installation
      ;;
    status)
      show_status
      ;;
    uninstall)
      uninstall_scheduler
      ;;
    help|-h|--help)
      show_usage
      ;;
    *)
      log_error "Unknown command: $command"
      show_usage
      exit 1
      ;;
  esac
}

main "$@"
