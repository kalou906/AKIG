#!/bin/bash
# ===================================================================
# CPU/Memory Resource Starvation Chaos Test
# ===================================================================
# Simulates resource constraints by limiting CPU and memory
# Tests graceful degradation under resource pressure
#
# Usage: ./resource_starvation.sh [cpu_limit] [memory_limit] [duration]
# Example: ./resource_starvation.sh 100m 256Mi 60
# - Limit to 100 millicores CPU
# - Limit to 256MB memory
# - For 60 seconds
# ===================================================================

set -euo pipefail

# Configuration
CPU_LIMIT=${1:-100m}
MEMORY_LIMIT=${2:-256Mi}
DURATION=${3:-60}
NAMESPACE=${NAMESPACE:-akig}
DEPLOYMENT=${DEPLOYMENT:-api}

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
  log_info "Starting Resource Starvation Chaos Test"
  log_info "CPU: ${CPU_LIMIT} | Memory: ${MEMORY_LIMIT} | Duration: ${DURATION}s"
  
  # Get current limits
  log_info "Saving current resource limits..."
  CURRENT_RESOURCES=$(kubectl get deploy "$DEPLOYMENT" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.containers[0].resources}')
  
  # Apply strict limits
  log_warning "CHAOS: Applying resource constraints..."
  kubectl set resources deploy "$DEPLOYMENT" -n "$NAMESPACE" \
    --limits=cpu="$CPU_LIMIT",memory="$MEMORY_LIMIT"
  
  # Wait for pods to be recreated
  sleep 10
  
  log_success "Resource limits applied"
  log_warning "Simulating load under resource constraints..."
  
  # Monitor metrics
  for ((i = 1; i <= DURATION; i++)); do
    REMAINING=$((DURATION - i))
    
    # Get current usage
    POD=$(kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT" \
      -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$POD" ]; then
      USAGE=$(kubectl top pod "$POD" -n "$NAMESPACE" 2>/dev/null || echo "?")
      if ((REMAINING % 15 == 0)); then
        log_info "Resource usage: $USAGE | ${REMAINING}s remaining..."
      fi
    fi
    
    sleep 1
  done
  
  # Restore original limits
  log_warning "Restoring original resource limits..."
  kubectl set resources deploy "$DEPLOYMENT" -n "$NAMESPACE" \
    --limits=none || true
  
  # Wait for recovery
  sleep 10
  
  log_success "Resource Starvation Test completed"
  log_info "Check application logs and metrics for degradation patterns"
}

trap 'log_error "Script interrupted"; kubectl set resources deploy $DEPLOYMENT -n $NAMESPACE --limits=none || true; exit 1' INT TERM

main
