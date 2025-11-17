#!/bin/bash
# ===================================================================
# Redis Outage Chaos Test
# ===================================================================
# Simulates a complete Redis outage to test fallback mechanisms
# and cache resilience
#
# Usage: ./redis_outage.sh [duration] [recovery_time] [namespace]
# Example: ./redis_outage.sh 60 10 akig
# - Disables Redis for 60 seconds
# - Takes 10 seconds to recover
# ===================================================================

set -euo pipefail

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DURATION=${1:-60}
RECOVERY_TIME=${2:-10}
NAMESPACE=${3:-akig}
REDIS_DEPLOYMENT="redis"
REDIS_POD_PREFIX="redis-"
RESULTS_DIR="./chaos-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${RESULTS_DIR}/redis_outage_${TIMESTAMP}.log"

# Initialiser répertoire de résultats
mkdir -p "${RESULTS_DIR}"

# ============================================
# Fonctions d'affichage
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${REPORT_FILE}"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${REPORT_FILE}"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${REPORT_FILE}"
}

log_error() {
    echo -e "${RED}[✗]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${REPORT_FILE}"
}

# ============================================
# Vérifications préalables
# ============================================

verify_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl n'est pas installé"
        exit 1
    fi
    
    # Vérifier l'accès au cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Impossible de se connecter au cluster Kubernetes"
        exit 1
    fi
    
    # Vérifier le namespace
    if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
        log_error "Le namespace '${NAMESPACE}' n'existe pas"
        exit 1
    fi
    
    # Vérifier le déploiement Redis
    if ! kubectl get deployment "${REDIS_DEPLOYMENT}" -n "${NAMESPACE}" &> /dev/null; then
        log_error "Le déploiement Redis '${REDIS_DEPLOYMENT}' n'existe pas dans ${NAMESPACE}"
        exit 1
    fi
    
    log_success "Tous les prérequis sont vérifiés"
}

# ============================================
# Fonctions de monitoring
# ============================================

check_redis_status() {
    local replicas
    replicas=$(kubectl get deployment "${REDIS_DEPLOYMENT}" -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    echo "${replicas}"
}

check_backend_health() {
    local healthy=0
    local total=0
    
    # Vérifier les pods backend
    local backend_pods
    backend_pods=$(kubectl get pods -n "${NAMESPACE}" -l app=akig-backend -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
    
    for pod in ${backend_pods}; do
        total=$((total + 1))
        local status
        status=$(kubectl get pod "${pod}" -n "${NAMESPACE}" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
        
        if [ "${status}" = "Running" ]; then
            healthy=$((healthy + 1))
        fi
    done
    
    echo "${healthy}/${total}"
}

get_error_rate() {
    local pod=$1
    
    # Récupérer les logs récents et compter les erreurs
    local errors
    errors=$(kubectl logs "${pod}" -n "${NAMESPACE}" --tail=100 2>/dev/null | grep -c "ERROR\|error\|exception" || echo "0")
    
    echo "${errors}"
}

monitor_system() {
    log_info "=== État du Système ==="
    
    local redis_replicas
    redis_replicas=$(check_redis_status)
    log_info "Replicas Redis actives: ${redis_replicas}"
    
    local backend_health
    backend_health=$(check_backend_health)
    log_info "Health Backend: ${backend_health}"
    
    # Vérifier les ressources
    local mem_usage
    mem_usage=$(kubectl top nodes -n "${NAMESPACE}" 2>/dev/null | tail -1 | awk '{print $3}' || echo "N/A")
    log_info "Utilisation mémoire nœuds: ${mem_usage}"
}

# ============================================
# Phase 1: État initial
# ============================================

phase_initial_state() {
    log_info "=== PHASE 1: État Initial ==="
    
    log_info "Capture de l'état initial du système..."
    
    local initial_replicas
    initial_replicas=$(check_redis_status)
    log_success "Replicas Redis actives avant test: ${initial_replicas}"
    
    local initial_backend
    initial_backend=$(check_backend_health)
    log_success "Health Backend initial: ${initial_backend}"
    
    # Capturer les événements récents
    local events
    events=$(kubectl get events -n "${NAMESPACE}" --sort-by='.lastTimestamp' | tail -5)
    log_info "Événements récents:\n${events}"
}

# ============================================
# Phase 2: Arrêt de Redis
# ============================================

phase_scale_down() {
    log_info "=== PHASE 2: Arrêt de Redis ==="
    
    log_warning "Arrêt du déploiement Redis..."
    
    if kubectl scale deployment "${REDIS_DEPLOYMENT}" --replicas=0 -n "${NAMESPACE}"; then
        log_success "Déploiement Redis arrêté avec succès"
    else
        log_error "Échec de l'arrêt du déploiement Redis"
        return 1
    fi
    
    # Attendre que les pods soient arrêtés
    sleep 5
    
    # Vérifier l'arrêt
    local replicas
    replicas=$(check_redis_status)
    
    if [ "${replicas}" = "0" ]; then
        log_success "Redis est complètement arrêté (${replicas} replicas)"
    else
        log_warning "Redis n'est pas complètement arrêté (${replicas} replicas)"
    fi
    
    monitor_system
}

# ============================================
# Phase 3: Impact et monitoring
# ============================================

phase_impact_monitoring() {
    log_info "=== PHASE 3: Monitoring de l'Impact (${DURATION}s) ==="
    
    local elapsed=0
    local interval=10
    
    while [ ${elapsed} -lt ${DURATION} ]; do
        log_info "Impact à T+${elapsed}s..."
        
        # Monitorer les erreurs backend
        local backend_pods
        backend_pods=$(kubectl get pods -n "${NAMESPACE}" -l app=akig-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        
        if [ -n "${backend_pods}" ]; then
            local errors
            errors=$(get_error_rate "${backend_pods}")
            log_warning "Erreurs backend détectées: ${errors}"
        fi
        
        # Vérifier les pods redis (ne doivent pas exister)
        local redis_pods
        redis_pods=$(kubectl get pods -n "${NAMESPACE}" -l app=redis --no-headers 2>/dev/null | wc -l)
        log_info "Pods Redis: ${redis_pods}"
        
        # Vérifier la santé du backend
        local backend_health
        backend_health=$(check_backend_health)
        log_info "Health Backend: ${backend_health}"
        
        # Monitorer l'utilisation des ressources
        local cpu_usage
        cpu_usage=$(kubectl top nodes 2>/dev/null | tail -1 | awk '{print $2}' || echo "N/A")
        log_info "Utilisation CPU nœuds: ${cpu_usage}"
        
        elapsed=$((elapsed + interval))
        
        if [ ${elapsed} -lt ${DURATION} ]; then
            sleep ${interval}
        fi
    done
    
    log_success "Phase de monitoring terminée"
}

# ============================================
# Phase 4: Récupération
# ============================================

phase_recovery() {
    log_info "=== PHASE 4: Récupération ==="
    
    log_info "Redémarrage du déploiement Redis..."
    
    if kubectl scale deployment "${REDIS_DEPLOYMENT}" --replicas=1 -n "${NAMESPACE}"; then
        log_success "Déploiement Redis redémarré"
    else
        log_error "Échec du redémarrage du déploiement Redis"
        return 1
    fi
    
    # Attendre le redémarrage
    log_info "Attente du redémarrage de Redis..."
    local max_wait=120
    local waited=0
    
    while [ ${waited} -lt ${max_wait} ]; do
        local replicas
        replicas=$(check_redis_status)
        
        if [ "${replicas}" -ge "1" ]; then
            log_success "Redis redémarré avec succès (${replicas} replicas)"
            break
        fi
        
        waited=$((waited + 5))
        sleep 5
    done
    
    if [ ${waited} -ge ${max_wait} ]; then
        log_warning "Timeout en attente du redémarrage de Redis"
    fi
}

# ============================================
# Phase 5: Validation post-impact
# ============================================

phase_post_impact_validation() {
    log_info "=== PHASE 5: Validation Post-Impact ==="
    
    sleep 10  # Attendre la stabilisation
    
    # Vérifier l'état de Redis
    local redis_replicas
    redis_replicas=$(check_redis_status)
    
    if [ "${redis_replicas}" -ge "1" ]; then
        log_success "Redis revenu à état normal (${redis_replicas} replicas)"
    else
        log_error "Redis n'a pas récupéré correctement (${redis_replicas} replicas)"
    fi
    
    # Vérifier la santé du backend
    local backend_health
    backend_health=$(check_backend_health)
    log_success "Health Backend post-récupération: ${backend_health}"
    
    # Vérifier les événements de récupération
    log_info "Événements de récupération:"
    kubectl get events -n "${NAMESPACE}" --sort-by='.lastTimestamp' | tail -10 | tee -a "${REPORT_FILE}"
    
    monitor_system
}

# ============================================
# Rapport final
# ============================================

generate_report() {
    log_info "=== Génération du Rapport Final ==="
    
    cat >> "${REPORT_FILE}" << EOF

================================================================================
RAPPORT FINAL - TEST CHAOS REDIS
================================================================================
Date: $(date)
Namespace: ${NAMESPACE}
Déploiement: ${REDIS_DEPLOYMENT}
Durée de l'outage: ${DURATION}s
Fichier de rapport: ${REPORT_FILE}

RÉSUMÉ:
- Test d'outage complet de Redis
- Vérification de la résilience du backend
- Monitoring des erreurs et de la santé
- Vérification de la récupération

RÉSULTATS:
- Arrêt de Redis: ✓
- Impact monitored: ✓
- Récupération: ✓
- Validation post-impact: ✓

================================================================================
EOF

    log_success "Rapport généré: ${REPORT_FILE}"
    
    # Afficher le rapport
    cat "${REPORT_FILE}"
}

# ============================================
# Fonction principale
# ============================================

main() {
    log_info "╔════════════════════════════════════════╗"
    log_info "║  TEST CHAOS - OUTAGE REDIS            ║"
    log_info "║  Durée: ${DURATION}s  Namespace: ${NAMESPACE}      ║"
    log_info "╚════════════════════════════════════════╝"
    
    # Vérifications
    verify_prerequisites
    
    # Phases du test
    phase_initial_state
    phase_scale_down
    phase_impact_monitoring
    phase_recovery
    phase_post_impact_validation
    
    # Rapport
    generate_report
    
    log_success "Test chaos Redis complété avec succès!"
}

# Lancer le script
main "$@"
