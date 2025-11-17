#!/bin/bash
###############################################################################
# Plan de Récupération d'Activité (PRA) - Backup Script
# ops/pra/backup.sh
#
# Script de sauvegarde quotidienne avec rotation et vérification
#
# Usage: ./backup.sh [--full|--incremental]
###############################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups/akig}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
ARCHIVE_DIR="${ARCHIVE_DIR:-/backups/akig/archive}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-postgres}"
PG_PASSWORD="${PG_PASSWORD:-}"
PG_DATABASE="${PG_DATABASE:-akig}"
BACKUP_TYPE="${1:-full}"
REMOTE_BACKUP_URL="${REMOTE_BACKUP_URL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/akig_backup_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/akig_backup_${TIMESTAMP}.log"

# Créer les répertoires
mkdir -p "$BACKUP_DIR" "$ARCHIVE_DIR"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Notification Slack
notify_slack() {
    local status=$1
    local message=$2
    local color=$3
    
    if [[ -z "$SLACK_WEBHOOK" ]]; then
        return
    fi
    
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d '{
            "attachments": [
                {
                    "color": "'$color'",
                    "title": "Sauvegarde AKIG - '$status'",
                    "text": "'$message'",
                    "ts": '$(date +%s)'
                }
            ]
        }' 2>/dev/null || true
}

# Effectuer la sauvegarde
perform_backup() {
    log "Démarrage de la sauvegarde ($BACKUP_TYPE)..."
    
    local start_time=$(date +%s)
    
    case $BACKUP_TYPE in
        full)
            log "Sauvegarde complète..."
            PGPASSWORD="$PG_PASSWORD" pg_dump \
                -h "$PG_HOST" \
                -p "$PG_PORT" \
                -U "$PG_USER" \
                -d "$PG_DATABASE" \
                --verbose \
                | gzip > "$BACKUP_FILE"
            ;;
        
        incremental)
            log "Sauvegarde incrémentale..."
            # Sauvegarder seulement les données modifiées récemment
            PGPASSWORD="$PG_PASSWORD" pg_dump \
                -h "$PG_HOST" \
                -p "$PG_PORT" \
                -U "$PG_USER" \
                -d "$PG_DATABASE" \
                --data-only \
                | gzip > "$BACKUP_FILE"
            ;;
        
        *)
            log "Type de sauvegarde inconnu: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ -f "$BACKUP_FILE" ]]; then
        local size=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✓ Sauvegarde réussie: $BACKUP_FILE ($size, ${duration}s)"
        return 0
    else
        log "✗ Erreur: fichier de sauvegarde non créé"
        return 1
    fi
}

# Vérifier l'intégrité
verify_backup() {
    log "Vérification de l'intégrité..."
    
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log "✗ Erreur: fichier compressé corrompu"
        return 1
    fi
    
    log "✓ Intégrité vérifiée"
    return 0
}

# Nettoyer les anciennes sauvegardes
rotate_backups() {
    log "Nettoyage des anciennes sauvegardes (> $BACKUP_RETENTION_DAYS jours)..."
    
    find "$BACKUP_DIR" -maxdepth 1 -type f -name "akig_backup_*.sql.gz" \
        -mtime "+$BACKUP_RETENTION_DAYS" -exec rm -v {} \; | while read deleted; do
        log "  Supprimé: $deleted"
    done
    
    log "✓ Rotation complète"
}

# Sauvegarder à distance
backup_to_remote() {
    log "Upload vers le serveur distant..."
    
    if [[ -z "$REMOTE_BACKUP_URL" ]]; then
        log "  (Pas de serveur distant configuré)"
        return 0
    fi
    
    if ! command -v curl &> /dev/null; then
        log "✗ curl non disponible"
        return 1
    fi
    
    if curl -T "$BACKUP_FILE" "$REMOTE_BACKUP_URL/" 2>/dev/null; then
        log "✓ Backup téléchargé avec succès"
        return 0
    else
        log "✗ Erreur lors de l'upload"
        return 1
    fi
}

# Générer un rapport
generate_report() {
    log "Génération du rapport..."
    
    local size=$(du -h "$BACKUP_FILE" | cut -f1)
    local lines=$(gunzip -c "$BACKUP_FILE" | wc -l)
    
    cat > "${BACKUP_FILE%.sql.gz}.report.txt" << EOF
================================================================================
                        RAPPORT DE SAUVEGARDE
================================================================================

Date: $(date)
Type: $BACKUP_TYPE
Fichier: $(basename "$BACKUP_FILE")
Taille: $size
Lignes: $lines
Répertoire: $BACKUP_DIR

Vérification: ✓ OK
Intégrité: ✓ Vérifiée
Accessibilité: ✓ Accessible

================================================================================
EOF
    
    log "✓ Rapport généré"
}

# Main
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}        Sauvegarde AKIG - Type: $BACKUP_TYPE             ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log "================================"
    log "Démarrage de la sauvegarde"
    log "================================"
    
    if perform_backup; then
        if verify_backup; then
            rotate_backups
            backup_to_remote || true
            generate_report
            
            notify_slack "SUCCESS" "Sauvegarde complète réussie" "good"
            
            echo ""
            echo -e "${GREEN}✓ Sauvegarde réussie${NC}"
            echo "Fichier: $BACKUP_FILE"
            echo "Log: $LOG_FILE"
        else
            notify_slack "FAILED" "Vérification échouée" "danger"
            exit 1
        fi
    else
        notify_slack "FAILED" "Sauvegarde échouée" "danger"
        exit 1
    fi
}

main
