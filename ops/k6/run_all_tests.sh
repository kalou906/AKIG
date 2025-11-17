#!/bin/bash
# ops/k6/run_all_tests.sh

set -e

echo "🚀 K6 Performance Test Suite"
echo "============================"

BASE_URL="${1:-http://localhost:4002}"
TOKEN="${2:-test-token}"

export BASE_URL
export TOKEN

echo "📊 Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Token: $TOKEN"
echo ""

# Test 1: Load test des paiements
echo "1️⃣  Running Payment Load Test (6 minutes)..."
k6 run \
  --vus 0 \
  --duration 0 \
  --out json=results/payments_load.json \
  ops/k6/payments_load.js

echo ""

# Test 2: Stress test des contrats
echo "2️⃣  Running Contract Stress Test (6 minutes)..."
k6 run \
  --vus 0 \
  --duration 0 \
  --out json=results/contracts_stress.json \
  ops/k6/contracts_stress.js

echo ""

# Test 3: Spike test
echo "3️⃣  Running Spike Test (4 minutes)..."
k6 run \
  --vus 0 \
  --duration 0 \
  --out json=results/spike_test.json \
  ops/k6/spike_test.js

echo ""

# Test 4: Soak test
echo "4️⃣  Running Soak Test (40 minutes)..."
echo "    (Ceci peut prendre du temps, Ctrl+C pour arrêter)"
k6 run \
  --vus 0 \
  --duration 0 \
  --out json=results/api_soak.json \
  ops/k6/api_soak.js || true

echo ""
echo "✅ All tests completed!"
echo "📊 Results saved to results/ directory"
