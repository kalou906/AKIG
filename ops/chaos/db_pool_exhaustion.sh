#!/bin/bash
# ===================================================================
# Database Connection Pool Exhaustion Chaos Test
# ===================================================================
# Simulates connection pool exhaustion by opening many connections
# Tests application behavior under connection starvation
#
# Usage: ./db_pool_exhaustion.sh [pool_size] [duration]
# Example: ./db_pool_exhaustion.sh 100 30
# - Opens 100 connections
# - Holds for 30 seconds
# ===================================================================

set -euo pipefail

# Configuration
POOL_SIZE=${1:-50}
DURATION=${2:-30}
NAMESPACE=${NAMESPACE:-akig}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

main() {
  log_info "Starting Database Connection Pool Exhaustion Test"
  log_info "Pool size: ${POOL_SIZE} | Duration: ${DURATION}s"
  
  # Create a pod that will hold connections
  log_info "Creating connection holder pod..."
  
  kubectl run chaos-db-pool-exhaustion \
    --image=postgres:15-alpine \
    --restart=Never \
    -n "$NAMESPACE" \
    -- sh -c "
      # Create multiple connections and hold them
      for i in \$(seq 1 $POOL_SIZE); do
        psql -h postgresql -U akig_user -d akig \
          -c 'SELECT pg_sleep(${DURATION})' &
      done
      wait
    " || log_warning "Pod may already exist"
  
  sleep 5
  
  log_success "Connection holder pod created"
  log_warning "CHAOS: Exhausting database connections..."
  
  # Monitor the chaos
  for ((i = 1; i <= DURATION; i++)); do
    REMAINING=$((DURATION - i))
    CONNECTED=$(kubectl exec -n "$NAMESPACE" -i \
      $(kubectl get pods -n "$NAMESPACE" -o name | head -1) \
      -- psql -h postgresql -U akig_user -d akig \
      -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "?")
    
    if ((REMAINING % 10 == 0 || REMAINING <= 5)); then
      log_info "Active connections: ${CONNECTED} | ${REMAINING}s remaining..."
    fi
    sleep 1
  done
  
  # Cleanup
  log_warning "Cleaning up..."
  kubectl delete pod chaos-db-pool-exhaustion -n "$NAMESPACE" \
    --ignore-not-found=true
  
  sleep 5
  
  log_success "Database Pool Exhaustion Test completed"
  log_info "Check application logs for connection timeout handling"
}

trap 'log_error "Script interrupted"; exit 1' INT TERM

main
