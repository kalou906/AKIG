
# K6 Load Testing Guide

## Overview

K6 is an open-source load testing tool for performance and stress testing APIs. This guide covers setup, running tests, and interpreting results.

## Table of Contents

1. [Installation](#installation)
2. [Understanding Multi-Scenario Test](#understanding-multi-scenario-test)
3. [Running Tests](#running-tests)
4. [Scenarios Explained](#scenarios-explained)
5. [Interpreting Results](#interpreting-results)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites

- Docker (recommended)
- Node.js 14+ (optional, for local runs)
- Bash/PowerShell for scripting

### Install K6

**Docker (Recommended)**
```bash
docker pull grafana/k6:latest
```

**macOS (Homebrew)**
```bash
brew install k6
```

**Linux (Ubuntu/Debian)**
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.bintray.com/loadimpact/deb stable main" | sudo tee -a /etc/apt/sources.list
sudo apt-get update
sudo apt-get install k6
```

**Windows**
```bash
choco install k6
```

### Verify Installation

```bash
# Check version
k6 version

# Expected output: k6 v0.47.0 or similar
```

---

## Understanding Multi-Scenario Test

### File: `ops/k6/multi_scenarios.js`

This test simulates 4 different user behaviors concurrently:

1. **Payments** (High load, ramping)
2. **Dashboard** (Constant load)
3. **Exports** (Batch operations)
4. **Notifications** (Background tasks)
5. **Spike** (Sudden traffic surge)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Multi-Scenario Load Test                                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Scenario 1: Payments              ▁▂▃▄▅▆▇█  (ramping)   │
│  Scenario 2: Dashboard             █████████  (constant) │
│  Scenario 3: Exports               ▂▂▂▂▂▂▂▂▂  (shared)    │
│  Scenario 4: Notifications         ▂▂▂▂▂▂▂▂▂  (per-vu)    │
│  Scenario 5: Spike                         ▆ (sudden)    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Running Tests

### Basic Run

```bash
# Local test (point to local server)
k6 run ops/k6/multi_scenarios.js \
  --vus 10 \
  --duration 30s

# Or with environment variables
BASE_URL=http://localhost:4002 \
TOKEN=your-jwt-token \
k6 run ops/k6/multi_scenarios.js
```

### Docker Run

```bash
# Run in Docker
docker run -v $PWD:/scripts \
  -e BASE_URL=http://localhost:4002 \
  -e TOKEN=your-token \
  grafana/k6:latest run /scripts/ops/k6/multi_scenarios.js
```

### With Custom Options

```bash
# Verbose output
k6 run ops/k6/multi_scenarios.js \
  --vus 50 \
  --duration 5m \
  -v  # verbose
  --log-output=stdout

# Save results to file
k6 run ops/k6/multi_scenarios.js \
  --out json=results.json

# Generate HTML report
k6 run ops/k6/multi_scenarios.js \
  --out csv=results.csv
```

### Cloud Test (Load Impact)

```bash
# Run on Load Impact cloud infrastructure
k6 cloud ops/k6/multi_scenarios.js \
  -e BASE_URL=https://api.example.com \
  -e TOKEN=your-token
```

---

## Test Files

### 1. Multi-Scenario Load Test (`multi_scenarios.js`)
- **Duration**: ~7 minutes
- **Peak Load**: 500 concurrent users (spike test)
- **Purpose**: Comprehensive multi-scenario testing
- **Success Criteria**: 
  - Payment response time p(95) < 900ms
  - Dashboard response time p(95) < 700ms
  - Overall error rate < 3%
  - 100+ successful payments

```bash
k6 run \
  --env BASE_URL=http://localhost:4002 \
  --env TOKEN=your-jwt-token \
  ops/k6/contracts_stress.js
```

### 3. API Soak Test (`api_soak.js`)
- **Duration**: 40 minutes
- **Load**: 50 concurrent users
- **Purpose**: Test for memory leaks and stability over time
- **Success Criteria**:
  - 99% of requests < 2000ms
  - Error rate < 1%

```bash
k6 run \
  --env BASE_URL=http://localhost:4002 \
  --env TOKEN=your-jwt-token \
  ops/k6/api_soak.js
```

### 4. Spike Test (`spike_test.js`)
- **Duration**: 4 minutes
- **Spike**: 100 → 1000 → 100 concurrent users
- **Purpose**: Test how API handles sudden traffic spikes
- **Success Criteria**:
  - 99% of requests < 1500ms
  - No 5xx errors

```bash
k6 run \
  --env BASE_URL=http://localhost:4002 \
  --env TOKEN=your-jwt-token \
  ops/k6/spike_test.js
```

## Running Tests

### Single Test
```bash
k6 run \
  --env BASE_URL=http://localhost:4002 \
  --env TOKEN=eyJhbGc... \
  ops/k6/payments_load.js
```

### With Output Metrics
```bash
k6 run \
  --out json=results.json \
  --env BASE_URL=http://localhost:4002 \
  --env TOKEN=your-token \
  ops/k6/payments_load.js
```

### All Tests (Using Script)
```bash
chmod +x ops/k6/run_all_tests.sh
./ops/k6/run_all_tests.sh http://localhost:4002 your-jwt-token
```

### With Docker
```bash
docker run -i \
  -e BASE_URL=http://host.docker.internal:4002 \
  -e TOKEN=your-token \
  grafana/k6:latest run - < ops/k6/payments_load.js
```

## Understanding Results

### Key Metrics

**http_req_duration**
- Time for request to complete (including network latency)
- Lower is better (< 1000ms is good)
- p(95) = 95th percentile (95% of requests are faster)

**http_req_failed**
- Percentage of requests that returned errors
- Should be < 5% for normal load tests
- Should be < 1% for soak tests

**http_reqs**
- Total number of HTTP requests made
- Helps calculate throughput

**vus**
- Virtual Users active during test
- Indicates concurrency level

### Output Example
```
    ✓ Status 200 ou 201
    ✓ Réponse JSON valide
    ✓ Pas de timeout
    ✓ Durée < 1s

    checks..................: 100% ✓ 12000 ✗ 0
    data_received...........: 1.2 MB
    data_sent...............: 540 kB
    http_req_blocked........: avg=1.2ms   p(95)=5ms
    http_req_connecting.....: avg=0.5ms   p(95)=2ms
    http_req_duration.......: avg=385ms   p(95)=765ms
    http_req_failed.........: 2%
    http_req_receiving......: avg=12ms    p(95)=24ms
    http_req_sending........: avg=8ms     p(95)=15ms
    http_req_tls_handshaking: avg=0ms     p(95)=0ms
    http_req_waiting........: avg=365ms   p(95)=745ms
    http_reqs...............: 12000
    iteration_duration......: avg=1.4s    p(95)=1.8s
    iterations.............: 6000
    vus.....................: 0
    vus_max.................: 500
```

### Performance Targets

| Scenario | P50 | P95 | P99 | Error Rate |
|----------|-----|-----|-----|-----------|
| Payment Load | <300ms | <800ms | <1500ms | <5% |
| Contract Stress | <400ms | <1000ms | <2000ms | <10% |
| Soak Test | <500ms | <2000ms | <3000ms | <1% |
| Spike Test | <400ms | <1500ms | <2500ms | <5% |

## Interpreting Results

### Good Performance
- ✅ P95 < 1000ms
- ✅ Error rate < 5%
- ✅ No memory leaks (consistent metrics over time)
- ✅ Stable response times

### Warning Signs
- ⚠️ P95 > 1000ms
- ⚠️ Error rate > 5%
- ⚠️ Increasing response times over time (memory leak)
- ⚠️ High failure rate under spike

### Poor Performance
- ❌ P95 > 2000ms
- ❌ Error rate > 20%
- ❌ Timeouts (0 responses)
- ❌ Service crashes

## Optimization Tips

If tests show poor performance:

1. **Check Database**
   - Add indexes to frequently queried columns
   - Use connection pooling
   - Monitor slow queries

2. **Check API**
   - Add caching (Redis)
   - Use CDN for static content
   - Implement rate limiting

3. **Check Infrastructure**
   - Increase server resources (CPU, RAM)
   - Use load balancer
   - Scale horizontally

4. **Check Code**
   - Profile hot code paths
   - Optimize N+1 queries
   - Cache results

## Advanced: Custom Metrics

Add custom metrics to your test:

```javascript
import { Counter, Trend } from 'k6/metrics';

const paymentCounter = new Counter('payments_created');
const paymentDuration = new Trend('payment_duration');

export default function () {
  const res = http.post(...)
  
  paymentCounter.add(1);
  paymentDuration.add(res.timings.duration);
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Performance Tests
  run: |
    k6 run \
      --env BASE_URL=https://api.example.com \
      --env TOKEN=${{ secrets.API_TOKEN }} \
      --out json=results.json \
      ops/k6/payments_load.js
      
    # Fail if tests don't meet thresholds
```

### Fail on Threshold Violations
```bash
k6 run --thresholds 'http_req_duration{k6group::payments}<1000' \
  ops/k6/payments_load.js
```

## Troubleshooting

### Connection Refused
```
Error: connection refused
```
**Solution**: Ensure API server is running on correct host/port

### Timeout
```
Error: request timeout
```
**Solution**: Increase timeout or reduce VUS

### Out of Memory
```
Memory limit exceeded
```
**Solution**: Reduce VUS or split tests

## Resources

- **K6 Docs**: https://k6.io/docs/
- **K6 Examples**: https://github.com/grafana/k6/tree/master/samples
- **Performance Best Practices**: https://k6.io/docs/testing-guides/
- **Grafana Cloud**: https://grafana.com/products/cloud/ (managed K6)

## Next Steps

1. Set up API tokens/auth for testing
2. Run smoke test to verify setup
3. Run baseline tests to get metrics
4. Identify bottlenecks
5. Optimize and re-test
