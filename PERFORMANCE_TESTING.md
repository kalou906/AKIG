# Performance Testing Strategy

## Overview

Performance testing ensures the AKIG application can handle real-world traffic loads and identifies bottlenecks before they impact users.

## Testing Pyramid

```
                  ▲
                 ╱│╲
                ╱ │ ╲  Soak Tests (40 min)
               ╱  │  ╲ Long-running stability
              ╱───┼───╲
             ╱    │    ╲ Spike Tests (4 min)
            ╱     │     ╲ Sudden traffic spikes
           ╱──────┼──────╲
          ╱       │       ╲ Stress Tests (6 min)
         ╱        │        ╲ High concurrency
        ╱─────────┼─────────╲
       ╱          │          ╲ Load Tests (6 min)
      ╱ Smoke Tests (1 min)   ╲ Normal-ish load
     ╱────────────┼────────────╲
    ▼             │             ▼
  Quick         Medium         Intensive
  Validation    Duration      Duration
```

## Test Types

### 1. Smoke Tests (Baseline)
**Purpose**: Verify API is working at all
**Duration**: 1-2 minutes
**Load**: 5-10 VUs
**When**: Every deployment
**Success**: No errors, P95 < 1000ms

### 2. Load Tests
**Purpose**: Test normal to high load
**Duration**: 5-10 minutes
**Load**: Ramp to 200-500 VUs
**When**: Before releases
**Success**: P95 < 800ms, Error rate < 5%

### 3. Stress Tests
**Purpose**: Find breaking point
**Duration**: 10-15 minutes
**Load**: Continuous increase
**When**: Performance reviews
**Success**: Identify max capacity

### 4. Spike Tests
**Purpose**: Test sudden traffic surges
**Duration**: 3-5 minutes
**Load**: Instant 10x increase
**When**: Before major events
**Success**: No cascading failures

### 5. Soak Tests
**Purpose**: Find memory leaks
**Duration**: 30-60 minutes
**Load**: Steady moderate load
**When**: Weekly/monthly
**Success**: Stable metrics over time

## AKIG Performance Targets

### Payment API
```
Endpoint: POST /api/payments
P50:      < 300ms
P95:      < 800ms
P99:      < 1500ms
Error:    < 5%
Throughput: > 500 req/min
```

### Contract API
```
Endpoint: GET /api/contracts
P50:      < 250ms
P95:      < 600ms
P99:      < 1000ms
Error:    < 2%
Throughput: > 1000 req/min
```

### Dashboard API
```
Endpoint: GET /api/dashboard
P50:      < 500ms
P95:      < 1500ms
P99:      < 2000ms
Error:    < 1%
Throughput: > 300 req/min
```

## Key Performance Indicators (KPIs)

### Response Time (Latency)
- **P50**: 50th percentile (median)
- **P95**: 95th percentile (acceptable threshold)
- **P99**: 99th percentile (max acceptable)

### Throughput
- **RPS**: Requests per second
- **RPM**: Requests per minute
- **Max Capacity**: Peak traffic the system can handle

### Error Rate
- **4xx Errors**: Client errors (bad requests)
- **5xx Errors**: Server errors (failures)
- **Timeout Rate**: Requests that timeout

### Resource Usage
- **CPU**: Should not exceed 80-90%
- **Memory**: Should not grow indefinitely
- **Disk I/O**: Should not bottleneck

## Test Scenarios

### Scenario 1: Payment Processing
```
Ramp: 0 → 200 users (2 min)
Peak: 200 → 500 users (3 min)
Fall: 500 → 0 users (1 min)
Total: 6 minutes
```

**What it tests:**
- Payment API under increasing load
- Database connection pool
- Payment validation logic
- Receipt generation

**Expected result:**
- Response time stays consistent
- No error rate increase
- Database handles concurrent writes

### Scenario 2: Contract Management
```
Phase 1: Create contracts (2 min, 100 VU)
Phase 2: Read contracts (2 min, 200 VU)
Phase 3: Filter/Search (2 min, 300 VU)
Total: 6 minutes
```

**What it tests:**
- CRUD operations under load
- Database indexing efficiency
- Connection pool exhaustion
- Cache effectiveness (if any)

### Scenario 3: Spike Handling
```
Normal: 100 users
Spike:  Instant 1000 users
Hold:   2 minutes at 1000
Fall:   Back to 100
```

**What it tests:**
- Connection pool limits
- Queue buildup
- Graceful degradation
- Error handling

### Scenario 4: Soak (Long-running)
```
Load: 50 users, continuous
Duration: 40 minutes
```

**What it tests:**
- Memory leaks
- Connection pool leaks
- Log file growth
- Database table fragmentation

## Running Tests

### Setup
```bash
# 1. Install k6
brew install k6  # or your OS

# 2. Start API server
cd backend && npm run dev

# 3. Generate auth token
# Use your auth mechanism to get a valid JWT

# 4. Export variables
export BASE_URL="http://localhost:4002"
export TOKEN="your-jwt-token-here"
```

### Run Single Test
```bash
k6 run ops/k6/payments_load.js
```

### Run with Output
```bash
k6 run \
  --out json=results/payments.json \
  --out csv=results/payments.csv \
  ops/k6/payments_load.js
```

### Run All Tests
```bash
chmod +x ops/k6/run_all_tests.sh
./ops/k6/run_all_tests.sh
```

## Analyzing Results

### HTML Reports
```bash
# Install reporter
npm install -g @grafana/k6-reporter

# Run and generate report
k6 run \
  --out json=results.json \
  ops/k6/payments_load.js

# Generate HTML
k6-reporter results.json
```

### Key Metrics to Watch

1. **http_req_duration**
   - Trend over time (should be stable)
   - Percentiles (p95, p99)
   - Distribution (should have few outliers)

2. **http_req_failed**
   - Should be < 5% for load tests
   - Should be < 1% for production-grade systems
   - Investigate spikes

3. **vus** (Virtual Users)
   - Should ramp smoothly
   - Should reach target
   - Should return to 0 at end

4. **iterations**
   - Calculate throughput
   - Compare with targets

## Performance Regression Detection

### Baseline Metrics
Store these after each major release:

```json
{
  "payment_api": {
    "p95_latency": 650,
    "error_rate": 0.02,
    "throughput_rps": 15
  },
  "contract_api": {
    "p95_latency": 500,
    "error_rate": 0.01,
    "throughput_rps": 30
  }
}
```

### Regression Thresholds
Alert if metrics degrade by more than:
- Latency: +30%
- Error Rate: +100%
- Throughput: -20%

## Optimization Recommendations

### If Payment API is Slow

1. **Check Database**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM payments WHERE invoice_id = $1;
   ```

2. **Check Application**
   - Add caching
   - Reduce N+1 queries
   - Optimize PDF generation

3. **Check Infrastructure**
   - Increase database connection pool
   - Add read replicas
   - Use Redis cache

### If Contract API is Slow

1. **Check Queries**
   - Index on `status` column
   - Index on `contract_id`
   - Batch operations

2. **Check Application**
   - Pagination (not loading all at once)
   - Lazy loading relationships
   - Database query optimization

### If Spike Handling is Poor

1. **Connection Pool**
   - Increase max connections
   - Reduce timeout
   - Enable connection pooling

2. **Application**
   - Implement rate limiting
   - Queue long-running tasks
   - Return 429 when overloaded

3. **Infrastructure**
   - Add load balancer
   - Scale horizontally
   - Use auto-scaling

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: sudo apt-get install k6
      
      - name: Start API
        run: npm run dev &
        
      - name: Wait for API
        run: sleep 5
      
      - name: Run Tests
        run: |
          k6 run \
            --env BASE_URL=http://localhost:4002 \
            --env TOKEN=${{ secrets.TEST_TOKEN }} \
            --out json=results.json \
            ops/k6/payments_load.js
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

## Monitoring in Production

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rate by endpoint
- Database query performance
- Cache hit ratio
- CPU/Memory usage

### Alerting Thresholds
- P95 latency > 1000ms
- Error rate > 1%
- CPU usage > 80%
- Memory usage > 85%

## Related Documentation

- `README.md` - How to run tests
- `TESTING_QUICK_START.md` - Quick start guide
- `ops/k6/payments_load.js` - Load test script
- `ops/k6/spike_test.js` - Spike test script

---

**Performance testing keeps AKIG fast and reliable** ✅
