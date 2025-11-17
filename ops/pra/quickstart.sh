#!/bin/bash

##############################################################################
#                        QUICK START GUIDE - PRA                            #
#                   Plan de Récupération d'Activité                         #
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    cat << EOF
${BLUE}╔════════════════════════════════════════════════════════════╗${NC}
${BLUE}║           AKIG - Quick Start PRA Assistant                 ║${NC}
${BLUE}╚════════════════════════════════════════════════════════════╝${NC}

${YELLOW}Usage:${NC}
    ./quickstart.sh [command]

${YELLOW}Commands:${NC}
    install         Setup initial PRA environment
    daily           Run daily backup
    test-restore    Test restore procedure
    monitor         Start continuous monitoring
    status          Check system health
    help            Show this message

${YELLOW}Examples:${NC}
    ./quickstart.sh install              # First time setup
    ./quickstart.sh daily                # Daily backup job
    ./quickstart.sh test-restore         # Weekly restore test
    ./quickstart.sh monitor              # Monitoring daemon
    ./quickstart.sh status               # Quick health check

EOF
}

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

##############################################################################
# COMMAND: install
##############################################################################
cmd_install() {
    print_header "Initial PRA Setup"
    
    echo ""
    echo -e "${YELLOW}This script will:${NC}"
    echo "  1. Create backup directories"
    echo "  2. Configure environment variables"
    echo "  3. Set up cron jobs"
    echo "  4. Run initial backup"
    echo "  5. Test restore procedure"
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warn "Setup cancelled"
        return 1
    fi
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_error ".env file not found"
        echo "Please copy .env.example to .env and configure it:"
        echo "  cp .env.example .env"
        echo "  vim .env"
        return 1
    fi
    
    print_step "Loading environment variables"
    source .env
    
    print_step "Creating backup directories"
    mkdir -p "${BACKUP_DIR}/akig"
    mkdir -p "${BACKUP_DIR}/akig/archive"
    chmod 700 "${BACKUP_DIR}"
    
    print_step "Making scripts executable"
    chmod +x backup.sh
    chmod +x restore_run.sh
    chmod +x status.sh
    
    print_step "Running initial full backup"
    ./backup.sh --full || {
        print_error "Backup failed"
        return 1
    }
    
    print_step "Verifying backup"
    ls -lh "${BACKUP_DIR}"/akig/*.sql.gz | tail -1
    
    print_step "Testing restore procedure (this may take a few minutes)"
    export BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/akig/*.sql.gz | head -1)
    ./restore_run.sh || {
        print_error "Restore test failed"
        return 1
    }
    
    print_step "Setting up daily backup cron job"
    # Add to crontab (safely)
    (crontab -l 2>/dev/null | grep -v "backup.sh" || true; echo "0 * * * * cd $(pwd) && source .env && ./backup.sh --full >> /var/log/akig_backup.log 2>&1") | crontab -
    
    print_step "Setting up monitoring cron job (every 5 minutes)"
    (crontab -l 2>/dev/null | grep -v "status.sh" || true; echo "*/5 * * * * cd $(pwd) && source .env && ./status.sh >> /var/log/akig_monitoring.log 2>&1") | crontab -
    
    echo ""
    print_header "Setup Complete!"
    echo ""
    echo -e "${GREEN}PRA is now configured and running.${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Review the configuration:"
    echo "     cat .env"
    echo "  2. Check backup status:"
    echo "     ls -lh ${BACKUP_DIR}/akig/"
    echo "  3. View monitoring logs:"
    echo "     tail -f /var/log/akig_monitoring.log"
    echo "  4. Monitor backup logs:"
    echo "     tail -f /var/log/akig_backup.log"
    echo ""
    echo -e "${YELLOW}Documentation:${NC}"
    echo "  cat README.md  # Full PRA documentation"
}

##############################################################################
# COMMAND: daily
##############################################################################
cmd_daily() {
    print_header "Running Daily Backup"
    
    if [ ! -f .env ]; then
        print_error ".env file not found"
        return 1
    fi
    
    source .env
    
    echo "Start time: $(date '+%Y-%m-%d %H:%M:%S')"
    
    ./backup.sh --full
    
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/akig/*.sql.gz | head -1)
    
    echo ""
    echo "Backup completed:"
    ls -lh "$BACKUP_FILE"
    
    echo ""
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo "End time: $(date '+%Y-%m-%d %H:%M:%S')"
}

##############################################################################
# COMMAND: test-restore
##############################################################################
cmd_test_restore() {
    print_header "Testing Restore Procedure"
    
    if [ ! -f .env ]; then
        print_error ".env file not found"
        return 1
    fi
    
    source .env
    
    # Find the most recent backup
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/akig/*.sql.gz | head -1)
    
    if [ -z "$BACKUP_FILE" ]; then
        print_error "No backup file found in ${BACKUP_DIR}/akig/"
        return 1
    fi
    
    echo "Using backup: $(basename $BACKUP_FILE)"
    echo "File size: $(du -h $BACKUP_FILE | cut -f1)"
    echo ""
    
    export BACKUP_FILE
    ./restore_run.sh
    
    REPORT=$(ls -t /tmp/pra_restore_report_*.txt 2>/dev/null | head -1)
    
    if [ -n "$REPORT" ]; then
        echo ""
        echo -e "${YELLOW}Restore Report:${NC}"
        cat "$REPORT"
    fi
}

##############################################################################
# COMMAND: monitor
##############################################################################
cmd_monitor() {
    print_header "Starting Continuous Monitoring"
    
    if [ ! -f .env ]; then
        print_error ".env file not found"
        return 1
    fi
    
    source .env
    
    echo -e "${YELLOW}Monitoring started. Press Ctrl+C to stop.${NC}"
    echo ""
    
    counter=0
    while true; do
        counter=$((counter + 1))
        
        echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Check #$counter${NC}"
        
        ./status.sh
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Issues detected!${NC}"
        fi
        
        echo ""
        echo "Next check in 5 minutes... (Ctrl+C to stop)"
        sleep 300
    done
}

##############################################################################
# COMMAND: status
##############################################################################
cmd_status() {
    print_header "System Health Status"
    
    if [ ! -f .env ]; then
        print_error ".env file not found"
        return 1
    fi
    
    source .env
    
    ./status.sh
}

##############################################################################
# COMMAND: help
##############################################################################
cmd_help() {
    show_usage
}

##############################################################################
# MAIN
##############################################################################
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    case "$1" in
        install)
            cmd_install
            ;;
        daily)
            cmd_daily
            ;;
        test-restore)
            cmd_test_restore
            ;;
        monitor)
            cmd_monitor
            ;;
        status)
            cmd_status
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
