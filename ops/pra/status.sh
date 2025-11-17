#!/bin/bash
###############################################################################
# Plan de Récupération d'Activité (PRA) - Status Check
# ops/pra/status.sh
#
# Vérification périodique de la santé du système et la disponibilité des données
###############################################################################

set -euo pipefail

# Configuration
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-postgres}"
PG_PASSWORD="${PG_PASSWORD:-}"
PG_DATABASE="${PG_DATABASE:-akig}"
APP_URL="${APP_URL:-http://localhost:4002}"
BACKUP_DIR="${BACKUP_DIR:-/backups/akig}"
CHECK_INTERVAL="${CHECK_INTERVAL:-300}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# État
ISSUES=()
WARNINGS=()
LAST_CHECK_FILE="/tmp/pra_last_check.txt"

# Vérifier la base de données
check_database() {
    echo -ne "  Base de données... "
    
    if PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
        -d "$PG_DATABASE" -tc "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        ISSUES+=("Base de données inaccessible")
        return 1
    fi
}

# Vérifier les tables critiques
check_critical_tables() {
    echo -ne "  Tables critiques... "
    
    local tables=("users" "properties" "contracts" "payments" "invoices")
    local missing=0
    
    for table in "${tables[@]}"; do
        if ! PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
            -d "$PG_DATABASE" -tc "SELECT to_regclass('public.$table')" | grep -q "$table"; then
            missing=$((missing + 1))
        fi
    done
    
    if [[ $missing -eq 0 ]]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} ($missing table(s) manquante(s))"
        ISSUES+=("$missing table(s) manquante(s)")
        return 1
    fi
}

# Vérifier la taille de la base
check_database_size() {
    echo -ne "  Taille base de données... "
    
    local size=$(PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
        -d "$PG_DATABASE" -tc \
        "SELECT pg_size_pretty(pg_database_size('$PG_DATABASE'));")
    
    echo -e "${GREEN}✓${NC} ($size)"
    return 0
}

# Vérifier la dernière sauvegarde
check_last_backup() {
    echo -ne "  Dernière sauvegarde... "
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        echo -e "${YELLOW}⚠${NC} Répertoire non trouvé"
        WARNINGS+=("Répertoire de sauvegarde non trouvé: $BACKUP_DIR")
        return 1
    fi
    
    local latest_backup=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "*.sql.gz" | sort | tail -1)
    
    if [[ -z "$latest_backup" ]]; then
        echo -e "${YELLOW}⚠${NC} Aucune sauvegarde"
        WARNINGS+=("Aucune sauvegarde trouvée")
        return 1
    fi
    
    local backup_age=$(($(date +%s) - $(stat -c %Y "$latest_backup")))
    local backup_age_hours=$((backup_age / 3600))
    
    if [[ $backup_age_hours -lt 24 ]]; then
        echo -e "${GREEN}✓${NC} ($(date -d @$(stat -c %Y "$latest_backup") '+%Y-%m-%d %H:%M:%S'))"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Sauvegarde ancienne ($backup_age_hours heures)"
        WARNINGS+=("Sauvegarde ancienne: $backup_age_hours heures")
        return 1
    fi
}

# Vérifier l'application
check_application() {
    echo -ne "  Application... "
    
    local http_code=$(curl -fsS -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null || echo "000")
    
    if [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $http_code)"
        ISSUES+=("Application inaccessible (HTTP $http_code)")
        return 1
    fi
}

# Vérifier les endpoints API
check_api_endpoints() {
    echo -ne "  API endpoints... "
    
    local endpoints=("/api/contracts" "/api/payments" "/api/invoices")
    local failed=0
    
    for endpoint in "${endpoints[@]}"; do
        local http_code=$(curl -fsS -o /dev/null -w "%{http_code}" "$APP_URL$endpoint" 2>/dev/null || echo "000")
        
        if [[ "$http_code" != "401" ]] && [[ "$http_code" != "200" ]]; then
            failed=$((failed + 1))
        fi
    done
    
    if [[ $failed -eq 0 ]]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} ($failed endpoint(s) en erreur)"
        WARNINGS+=("$failed endpoint(s) en erreur")
        return 1
    fi
}

# Vérifier l'espace disque
check_disk_space() {
    echo -ne "  Espace disque... "
    
    local disk_usage=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    local disk_usage_num=${disk_usage%G}
    
    if [[ $disk_usage -lt 80 ]]; then
        echo -e "${GREEN}✓${NC} ($disk_usage%)"
        return 0
    elif [[ $disk_usage -lt 90 ]]; then
        echo -e "${YELLOW}⚠${NC} ($disk_usage%)"
        WARNINGS+=("Espace disque limité: $disk_usage%")
        return 1
    else
        echo -e "${RED}✗${NC} ($disk_usage%)"
        ISSUES+=("Espace disque critique: $disk_usage%")
        return 1
    fi
}

# Générer un rapport
generate_status_report() {
    local report_file="/tmp/pra_status_$(date +%Y%m%d_%H%M%S).txt"
    local overall_status="OK"
    
    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        overall_status="CRITICAL"
    elif [[ ${#WARNINGS[@]} -gt 0 ]]; then
        overall_status="WARNING"
    fi
    
    cat > "$report_file" << EOF
================================================================================
                    RAPPORT DE STATUT PRA
================================================================================

Date/Heure: $(date)
Statut général: $overall_status

BASE DE DONNÉES
  Host: $PG_HOST:$PG_PORT
  Database: $PG_DATABASE

APPLICATION
  URL: $APP_URL

SAUVEGARDE
  Répertoire: $BACKUP_DIR

================================================================================
DÉTAILS
================================================================================

EOF

    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        echo "PROBLÈMES CRITIQUES:" >> "$report_file"
        for issue in "${ISSUES[@]}"; do
            echo "  ✗ $issue" >> "$report_file"
        done
        echo "" >> "$report_file"
    fi
    
    if [[ ${#WARNINGS[@]} -gt 0 ]]; then
        echo "AVERTISSEMENTS:" >> "$report_file"
        for warning in "${WARNINGS[@]}"; do
            echo "  ⚠ $warning" >> "$report_file"
        done
        echo "" >> "$report_file"
    fi
    
    if [[ ${#ISSUES[@]} -eq 0 ]] && [[ ${#WARNINGS[@]} -eq 0 ]]; then
        echo "Tous les contrôles ont réussi ✓" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "=================================================================================" >> "$report_file"
    
    cat "$report_file"
    
    # Envoyer l'email d'alerte si configuré et problèmes
    if [[ -n "$ALERT_EMAIL" ]] && [[ "$overall_status" != "OK" ]]; then
        send_alert_email "$report_file" "$overall_status"
    fi
}

# Envoyer une alerte par email
send_alert_email() {
    local report_file=$1
    local status=$2
    
    if ! command -v mail &> /dev/null; then
        return
    fi
    
    mail -s "🚨 ALERTE PRA: $status" "$ALERT_EMAIL" < "$report_file"
}

# Main
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}        Vérification Santé PRA - $(date '+%H:%M:%S')        ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo "Vérifications en cours..."
    echo ""
    
    echo "Base de données:"
    check_database || true
    check_critical_tables || true
    check_database_size || true
    
    echo ""
    echo "Sauvegarde:"
    check_last_backup || true
    check_disk_space || true
    
    echo ""
    echo "Application:"
    check_application || true
    check_api_endpoints || true
    
    echo ""
    generate_status_report
    
    # Mettre à jour le timestamp du dernier contrôle
    echo "$(date)" > "$LAST_CHECK_FILE"
    
    # Code de sortie
    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        exit 1
    elif [[ ${#WARNINGS[@]} -gt 0 ]]; then
        exit 2
    else
        exit 0
    fi
}

main
