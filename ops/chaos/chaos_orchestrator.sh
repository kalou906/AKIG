#!/bin/bash
# ===================================================================
# Chaos Engineering Master Control Script
# ===================================================================
# Orchestrates various chaos tests and collects results
#
# Usage: ./chaos_orchestrator.sh [test_type] [options]
# 
# Test types:
#   redis          - Test Redis outage
#   db_pool        - Test database connection exhaustion
#   network        - Test network partition
#   resources      - Test resource starvation
#   full           - Run all tests in sequence
#   report         - Generate chaos test report
# ===================================================================

set -euo pipefail

# Configuration
NAMESPACE=${NAMESPACE:-akig}
CHAOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${CHAOS_DIR}/logs"
RESULTS_DIR="${CHAOS_DIR}/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Logging functions
log_header() {
  echo -e "\n${MAGENTA}╔════════════════════════════════════════╗${NC}"
  echo -e "${MAGENTA}║${NC} $1"
  echo -e "${MAGENTA}╚════════════════════════════════════════╝${NC}\n"
}

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# Create directories
mkdir -p "$LOG_DIR" "$RESULTS_DIR"

# Run test and collect metrics
run_test() {
  local test_name=$1
  local test_script=$2
  shift 2
  local test_args=("$@")
  
  log_header "Running: $test_name"
  
  local start_time=$(date +%s)
  local log_file="${LOG_DIR}/${test_name}_${TIMESTAMP}.log"
  
  # Start monitoring
  log_info "Starting system monitoring..."
  (
    while true; do
      {
        date "+%Y-%m-%d %H:%M:%S"
        echo "=== CPU Usage ==="
        kubectl top nodes -n "$NAMESPACE" 2>/dev/null || echo "N/A"
        echo "=== Memory Usage ==="
        kubectl top pods -n "$NAMESPACE" 2>/dev/null || echo "N/A"
      } >> "$log_file"
      sleep 5
    done
  ) &
  MONITOR_PID=$!
  
  # Run test
  if bash "$test_script" "${test_args[@]}" 2>&1 | tee -a "$log_file"; then
    local status="PASSED"
    log_success "$test_name completed"
  else
    local status="FAILED"
    log_error "$test_name failed"
  fi
  
  # Stop monitoring
  kill $MONITOR_PID 2>/dev/null || true
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # Store result
  echo "$test_name|$status|${duration}s|$log_file" >> "${RESULTS_DIR}/results_${TIMESTAMP}.csv"
  
  return 0
}

# Test suite functions
test_redis_outage() {
  log_info "Running Redis outage test (60s outage, 10s recovery)..."
  run_test "redis_outage" "${CHAOS_DIR}/redis_outage.sh" 60 10 "$NAMESPACE"
}

test_db_pool() {
  log_info "Running DB pool exhaustion test..."
  run_test "db_pool_exhaustion" "${CHAOS_DIR}/db_pool_exhaustion.sh" 50 30 "$NAMESPACE"
}

test_network() {
  log_info "Running network partition test (500ms latency, 2% loss)..."
  run_test "network_partition" "${CHAOS_DIR}/network_partition.sh" 500 2 60
}

test_resources() {
  log_info "Running resource starvation test..."
  run_test "resource_starvation" "${CHAOS_DIR}/resource_starvation.sh" 100m 256Mi 60
}

# Run all tests
test_full_suite() {
  log_header "CHAOS ENGINEERING - FULL TEST SUITE"
  
  test_redis_outage
  sleep 30
  
  test_db_pool
  sleep 30
  
  test_network
  sleep 30
  
  test_resources
  
  generate_report
}

# Generate test report
generate_report() {
  log_header "CHAOS TEST REPORT"
  
  local results_file="${RESULTS_DIR}/results_${TIMESTAMP}.csv"
  
  if [ ! -f "$results_file" ]; then
    log_error "No results file found"
    return 1
  fi
  
  echo "=== Test Results ===" | tee -a "$results_file"
  echo "" | tee -a "$results_file"
  echo "| Test Name | Status | Duration | Log File |" | tee -a "$results_file"
  echo "|-----------|--------|----------|----------|" | tee -a "$results_file"
  
  while IFS='|' read -r test_name status duration log_file; do
    echo "| $test_name | $status | $duration | $log_file |" | tee -a "$results_file"
  done < <(grep -v "^$" "$results_file")
  
  echo "" | tee -a "$results_file"
  log_success "Report generated: $results_file"
}

# Show help
show_help() {
  cat << EOF
${BLUE}AKIG Chaos Engineering Framework${NC}

${GREEN}Usage:${NC}
  $0 [test_type] [options]

${GREEN}Test Types:${NC}
  redis             Test Redis outage resilience
  db_pool           Test database connection pool exhaustion
  network           Test network partition (latency + loss)
  resources         Test resource starvation
  full              Run complete test suite
  report            Generate test report

${GREEN}Options:${NC}
  --namespace NS    Kubernetes namespace (default: akig)
  --duration SEC    Test duration in seconds
  --help            Show this help message

${GREEN}Examples:${NC}
  # Test Redis outage
  $0 redis

  # Test full suite
  $0 full

  # Generate report
  $0 report

${GREEN}Environment Variables:${NC}
  NAMESPACE         Kubernetes namespace (default: akig)
  CHAOS_DIR         Chaos scripts directory (auto-detected)

${BLUE}Chaos Tests Available:${NC}
  • Redis Outage (60s)
  • Database Pool Exhaustion (50 connections)
  • Network Partition (500ms latency, 2% loss)
  • Resource Starvation (100m CPU, 256Mi memory)

${YELLOW}Warning:${NC} These tests will impact production systems!
Use in development/staging environments first.

EOF
}

# Main function
main() {
  local test_type=${1:-help}
  
  case "$test_type" in
    redis)
      test_redis_outage
      ;;
    db_pool)
      test_db_pool
      ;;
    network)
      test_network
      ;;
    resources)
      test_resources
      ;;
    full)
      test_full_suite
      ;;
    report)
      generate_report
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      log_error "Unknown test type: $test_type"
      show_help
      exit 1
      ;;
  esac
}

trap 'log_error "Chaos test interrupted"; exit 1' INT TERM

main "$@"
