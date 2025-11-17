#!/bin/bash
# ===================================================================
# High Latency Network Partition Chaos Test
# ===================================================================
# Simulates high latency and packet loss between services
# Tests timeout handling and retry logic
#
# Usage: ./network_partition.sh [latency_ms] [loss_percent] [duration]
# Example: ./network_partition.sh 1000 5 60
# - Add 1000ms latency
# - 5% packet loss
# - For 60 seconds
# ===================================================================

set -euo pipefail

# Configuration
LATENCY_MS=${1:-500}
LOSS_PERCENT=${2:-2}
DURATION=${3:-60}
NAMESPACE=${NAMESPACE:-akig}
TARGET_POD_SELECTOR=${TARGET_POD_SELECTOR:-app=api}

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
  log_info "Starting Network Partition Chaos Test"
  log_info "Latency: ${LATENCY_MS}ms | Loss: ${LOSS_PERCENT}% | Duration: ${DURATION}s"
  
  # Get target pod
  TARGET_POD=$(kubectl get pods -n "$NAMESPACE" \
    -l "$TARGET_POD_SELECTOR" \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  
  if [ -z "$TARGET_POD" ]; then
    log_error "No pods found matching selector: $TARGET_POD_SELECTOR"
    exit 1
  fi
  
  log_info "Target pod: $TARGET_POD"
  
  # Install tc (traffic control) in pod if needed
  log_info "Configuring network chaos..."
  
  kubectl exec -n "$NAMESPACE" "$TARGET_POD" -- \
    sh -c "
      # Add latency and packet loss to eth0
      tc qdisc replace dev eth0 root netem \
        delay ${LATENCY_MS}ms \
        loss ${LOSS_PERCENT}%
      
      echo 'Network chaos applied: ${LATENCY_MS}ms latency, ${LOSS_PERCENT}% loss'
    " || log_warning "tc command may not be available in pod"
  
  log_success "Network chaos configured"
  log_warning "CHAOS: Running network partition test..."
  
  # Monitor
  for ((i = 1; i <= DURATION; i++)); do
    REMAINING=$((DURATION - i))
    if ((REMAINING % 10 == 0 || REMAINING <= 5)); then
      log_info "Network chaos active: ${REMAINING}s remaining..."
    fi
    sleep 1
  done
  
  # Cleanup
  log_warning "Removing network chaos..."
  kubectl exec -n "$NAMESPACE" "$TARGET_POD" -- \
    sh -c "tc qdisc del dev eth0 root" || true
  
  log_success "Network Partition Chaos Test completed"
  log_info "Check application logs for retry and timeout behavior"
}

trap 'log_error "Script interrupted"; exit 1' INT TERM

main
