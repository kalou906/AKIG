#!/usr/bin/env bash

# K6 Load Testing Helper Script
# Usage: ./ops/k6/run-tests.sh [profile] [base-url] [token]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${2:-http://localhost:4002}"
TOKEN="${3:-}"
PROFILE="${1:-smoke}"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  K6 Load Testing Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

# Validate inputs
if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}Warning: No TOKEN provided. Some tests may fail.${NC}\n"
fi

# Function to run test
run_test() {
    local profile=$1
    local vus=$2
    local duration=$3
    
    echo -e "${BLUE}Running ${profile} test...${NC}"
    echo "  VUs: ${vus}"
    echo "  Duration: ${duration}"
    echo "  Base URL: ${BASE_URL}\n"
    
    export BASE_URL=$BASE_URL
    export TOKEN=$TOKEN
    
    k6 run \
        --vus $vus \
        --duration $duration \
        ops/k6/multi_scenarios.js
}

# Select test profile
case "$PROFILE" in
    smoke)
        echo -e "${YELLOW}Profile: SMOKE TEST${NC}"
        echo "Quick validation of API endpoints\n"
        run_test "smoke" 5 1m
        ;;
    load)
        echo -e "${YELLOW}Profile: LOAD TEST${NC}"
        echo "Normal production conditions\n"
        run_test "load" 50 5m
        ;;
    stress)
        echo -e "${YELLOW}Profile: STRESS TEST${NC}"
        echo "Push system to limits\n"
        run_test "stress" 200 10m
        ;;
    spike)
        echo -e "${YELLOW}Profile: SPIKE TEST${NC}"
        echo "Sudden traffic surge\n"
        run_test "spike" 500 1m
        ;;
    soak)
        echo -e "${YELLOW}Profile: SOAK TEST${NC}"
        echo "Long-running stability test\n"
        run_test "soak" 50 30m
        ;;
    *)
        echo -e "${RED}Unknown profile: $PROFILE${NC}\n"
        echo "Available profiles:"
        echo "  smoke   - Quick validation (5 VUs, 1m)"
        echo "  load    - Normal load (50 VUs, 5m)"
        echo "  stress  - High stress (200 VUs, 10m)"
        echo "  spike   - Traffic spike (500 VUs, 1m)"
        echo "  soak    - Long running (50 VUs, 30m)\n"
        echo "Usage: ./ops/k6/run-tests.sh [profile] [base-url] [token]"
        echo "Example: ./ops/k6/run-tests.sh load http://localhost:4002 eyJhbGc..."
        exit 1
        ;;
esac

echo -e "\n${GREEN}✓ Test completed${NC}"
