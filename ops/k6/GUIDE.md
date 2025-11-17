# K6 Load Testing - Complete Guide

## Quick Start

```bash
# Install
brew install k6  # or docker pull grafana/k6:latest

# Run multi-scenario test
BASE_URL=http://localhost:4002 TOKEN=your-token \
k6 run ops/k6/multi_scenarios.js

# Run in Docker
docker run -v $PWD:/scripts \
  -e BASE_URL=http://localhost:4002 \
  -e TOKEN=your-token \
  grafana/k6:latest run /scripts/ops/k6/multi_scenarios.js
```

## Test Scenarios Overview

| Scenario | Load Pattern | Duration | VUs | Purpose |
|----------|--------------|----------|-----|---------|
| Payments | Ramp (20→200) | 5m | 20-200 | Payment processing under increasing load |
| Dashboard | Constant | 3m | 50 | Read-heavy dashboard access |
| Exports | Shared iterations | Variable | 30 | Bulk export functionality |
| Notifications | Per-VU | Variable | 20 | Notification delivery |
| Spike | Constant | 30s | 500 | Sudden traffic surge (starts at 6m) |

## Metrics Explained

### Response Time Percentiles
- `p(50)` (median): 50% of requests faster than this
- `p(95)` (95th percentile): 95% of requests faster than this (most important)
- `p(99)` (99th percentile): 99% of requests faster than this

### Target Thresholds
```
Payment response p(95) < 900ms   ← 95% of payments respond in <900ms
Dashboard p(95) < 700ms          ← Dashboard is fast and responsive
Overall error rate < 3%          ← System handles errors gracefully
100+ successful payments          ← Sufficient throughput
```

## Custom Metrics Tracked

- `payment_failures` - Rate of payment failures
- `successful_payments` - Counter of successful transactions
- `failed_payments` - Counter of failed transactions
- `api_errors` - Total API errors
- `*_duration` - Response time trends

## Running Different Test Profiles

```bash
# Smoke test (quick validation)
k6 run ops/k6/multi_scenarios.js --vus 5 --duration 1m

# Load test (normal conditions)
k6 run ops/k6/multi_scenarios.js --vus 50 --duration 5m

# Stress test (push limits)
k6 run ops/k6/multi_scenarios.js --vus 200 --duration 10m

# Spike test (sudden traffic)
k6 run ops/k6/multi_scenarios.js --vus 500 --duration 1m
```

## Environment Variables

```bash
BASE_URL=http://localhost:4002    # API base URL (required)
TOKEN=your-jwt-token              # Authorization token (required)
```

## Output and Reports

```bash
# JSON output for analysis
k6 run ops/k6/multi_scenarios.js --out json=results.json

# CSV output
k6 run ops/k6/multi_scenarios.js --out csv=results.csv

# View results
cat results.json | jq '.metrics'

# Load in Load Impact cloud
k6 cloud ops/k6/multi_scenarios.js
```

## Interpreting Results

### Success Indicators
✅ `http_req_failed: 0%` or very low  
✅ `http_req_duration p(95) < target`  
✅ `iterations: high count`  
✅ No increasing error trends  

### Warning Signs
⚠️ `http_req_failed > 5%`  
⚠️ Response times trending upward  
⚠️ Memory usage increasing  
⚠️ Connection timeouts appearing  

### Example Results
```
     data_received..................: 1.2 MB   120 kB/s
     data_sent........................: 456 kB   4.5 kB/s
     http_req_duration................: avg=234ms   min=45ms   max=2342ms   p(95)=567ms
     http_req_failed..................: 2.5%
     http_requests....................: 2345
     iterations........................: 567
     successful_payments..............: 1234
     failed_payments..................: 58
     vus...............................: 47       min=20     max=200
```

---

**Last Updated:** October 25, 2025
