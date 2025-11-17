# 🧪 Chaos Engineering Framework - AKIG

Comprehensive chaos engineering toolkit for testing system resilience, identifying failure modes, and validating disaster recovery procedures.

## 📋 Overview

This framework provides automated tools to inject controlled failures and measure how systems respond:

- **Redis Outage**: Complete cache layer failure
- **Database Pool Exhaustion**: Connection starvation scenarios
- **Network Partition**: High latency and packet loss
- **Resource Starvation**: CPU and memory constraints

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure kubectl is installed and configured
kubectl version --client

# Verify cluster access
kubectl cluster-info
```

### Run First Chaos Test

```bash
# Test Redis outage (60 seconds)
bash ops/chaos/redis_outage.sh 60 10 akig

# Or use orchestrator
bash ops/chaos/chaos_orchestrator.sh redis
```

## 🧬 Available Chaos Tests

### 1. Redis Outage Test

**What it tests**: Cache layer failure and fallback behavior

```bash
# Syntax: ./redis_outage.sh [duration] [recovery_time] [namespace]
bash ops/chaos/redis_outage.sh 60 10 akig

# Parameters:
# - duration: How long Redis stays down (seconds)
# - recovery_time: Time to wait for Redis to recover (seconds)
# - namespace: Kubernetes namespace (default: akig)
```

**Expected behavior**:
- Application continues to work (reads from DB if configured)
- Cache hits immediately after recovery
- No data loss
- Graceful degradation

**Monitoring**:
```bash
# Watch application logs
kubectl logs -f deployment/api -n akig

# Check Redis status
kubectl get pods -l app=redis -n akig
```

### 2. Database Pool Exhaustion Test

**What it tests**: Connection pool starvation and timeout handling

```bash
# Syntax: ./db_pool_exhaustion.sh [pool_size] [duration]
bash ops/chaos/db_pool_exhaustion.sh 50 30 akig

# Parameters:
# - pool_size: Number of connections to hold (default: 50)
# - duration: Test duration in seconds (default: 30)
```

**Expected behavior**:
- New requests timeout or queue
- Connection errors logged
- Graceful error responses (no crashes)
- Recovery after timeout

**Metrics to check**:
```bash
# Active connections
kubectl exec -i $(kubectl get pods -l app=postgresql -o name | head -1) \
  -- psql -U akig_user -d akig -c "SELECT count(*) FROM pg_stat_activity;"

# Connection waiting time
kubectl exec -i $(kubectl get pods -l app=postgresql -o name | head -1) \
  -- psql -U akig_user -d akig -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"
```

### 3. Network Partition Test

**What it tests**: High latency and packet loss resilience

```bash
# Syntax: ./network_partition.sh [latency_ms] [loss_percent] [duration]
bash ops/chaos/network_partition.sh 1000 5 60

# Parameters:
# - latency_ms: Latency to inject in milliseconds (default: 500)
# - loss_percent: Packet loss percentage 0-100 (default: 2)
# - duration: Test duration in seconds (default: 60)
```

**Severity levels**:
| Latency | Loss | Severity | Use Case |
|---------|------|----------|----------|
| 100ms | 0% | Low | Degraded WAN |
| 500ms | 2% | Medium | Unstable network |
| 1000ms | 5% | High | Poor connectivity |
| 2000ms | 10% | Critical | Near-failure |

**Expected behavior**:
- Timeout handling works
- Retries succeed
- Circuit breakers activate if configured
- Graceful error responses

### 4. Resource Starvation Test

**What it tests**: Behavior under CPU and memory constraints

```bash
# Syntax: ./resource_starvation.sh [cpu_limit] [memory_limit] [duration]
bash ops/chaos/resource_starvation.sh 100m 512Mi 60

# Parameters:
# - cpu_limit: CPU constraint (default: 100m = 0.1 cores)
# - memory_limit: Memory constraint (default: 256Mi)
# - duration: Test duration in seconds (default: 60)
```

**Severity levels**:
| CPU | Memory | Severity | Effect |
|-----|--------|----------|--------|
| 200m | 512Mi | Low | Slight slowdown |
| 100m | 256Mi | Medium | Noticeable latency |
| 50m | 128Mi | High | Severe throttling |

**Expected behavior**:
- No OOM kills (pods should not crash)
- Graceful performance degradation
- Recovery when limits removed
- Meaningful error messages if queuing

## 🎮 Using the Orchestrator

Run multiple tests and generate reports:

```bash
# Run single test
bash ops/chaos/chaos_orchestrator.sh redis

# Run full test suite
bash ops/chaos/chaos_orchestrator.sh full

# Generate report from last run
bash ops/chaos/chaos_orchestrator.sh report
```

### Orchestrator Features

✅ Automatic system monitoring during tests  
✅ Results CSV generation  
✅ Test duration tracking  
✅ Log aggregation  
✅ Failure handling and cleanup  

### Report Structure

```
results/
├── results_20251025_120000.csv
├── logs/
│   ├── redis_outage_20251025_120000.log
│   ├── db_pool_exhaustion_20251025_120000.log
│   ├── network_partition_20251025_120000.log
│   └── resource_starvation_20251025_120000.log
```

## 📊 Monitoring & Metrics

### Real-time Monitoring

```bash
# Watch application logs during chaos
kubectl logs -f deployment/api -n akig --since=10m

# Monitor resource usage
kubectl top nodes
kubectl top pods -n akig

# Check service endpoints
kubectl get endpoints -n akig
```

### Key Metrics to Track

1. **Error Rate**: Percentage of failed requests
2. **Latency**: P50, P95, P99 response times
3. **Throughput**: Requests/second
4. **Resource Usage**: CPU, memory, connections
5. **Recovery Time**: How fast system bounces back

### Prometheus Queries (if available)

```promql
# Error rate
rate(akig_http_errors_total[5m])

# Latency percentiles
histogram_quantile(0.95, akig_http_duration_ms)

# Connection pool usage
akig_db_connections_active / akig_db_connections_max
```

## 🧬 Integration with Workflow

### Automated Chaos Tests

The chaos tests are integrated with GitHub Actions:

```yaml
# .github/workflows/chaos-test.yml
- name: Run Redis Outage Test
  run: bash ops/chaos/redis_outage.sh 60 10 akig

- name: Run Network Partition Test
  run: bash ops/chaos/network_partition.sh 500 2 60
```

### Scheduling Chaos Tests

```bash
# Run weekly chaos engineering session
# Add to crontab:
0 3 * * 1 cd /app && bash ops/chaos/chaos_orchestrator.sh full
```

## 🛡️ Safety Guidelines

### Before Running Tests

⚠️ **NEVER run in production without preparation**

Checklist:
- [ ] Running in staging/dev environment
- [ ] Backup database before testing
- [ ] Notify team members
- [ ] Monitor application during tests
- [ ] Have rollback procedures ready
- [ ] Alert on-call team

### During Tests

✅ Monitor continuously  
✅ Watch error rates  
✅ Check resource usage  
✅ Verify logging  
✅ Test alert systems  

### After Tests

✅ Review logs and metrics  
✅ Document failures found  
✅ Create improvement tickets  
✅ Update runbooks with findings  
✅ Share results with team  

## 📈 Test Scenarios

### Scenario 1: E-Commerce Checkout

Test payment processing resilience:

```bash
# 1. Start with baseline
./chaos_orchestrator.sh report

# 2. Inject database latency
CHAOS_LATENCY_MS=2000 npm start

# 3. Run payment tests
npm run test:payments

# 4. Verify transaction consistency
```

### Scenario 2: Real-time Alerts

Test alert delivery under chaos:

```bash
# 1. Enable alerts
FEATURE_ALERTS=true npm start

# 2. Simulate network issues
./network_partition.sh 1000 10 120

# 3. Monitor alert delivery
kubectl logs deployment/alert-service

# 4. Verify all alerts arrived (eventually)
```

### Scenario 3: Data Consistency

Test data consistency under failures:

```bash
# 1. Inject connection pool exhaustion
./db_pool_exhaustion.sh 100 60

# 2. Run heavy write load
npm run load-test

# 3. Check data integrity
SELECT COUNT(*) FROM contracts;
SELECT COUNT(*) FROM payments;

# 4. Verify no orphaned records
```

## 🔍 Troubleshooting

### Pod fails to start after chaos

```bash
# Check pod status
kubectl describe pod <pod-name> -n akig

# View logs
kubectl logs <pod-name> -n akig

# Reset pod limits
kubectl set resources deploy api -n akig --limits=none
```

### tc (traffic control) not available

Solution: Install in pod or use different approach

```bash
# Install on pod startup
RUN apt-get update && apt-get install -y iproute2
```

### Kubectl commands fail

```bash
# Verify cluster access
kubectl auth can-i get pods --as=system:serviceaccount:akig:default

# Check context
kubectl config current-context

# Verify namespace exists
kubectl get ns akig
```

## 📚 References

- [Chaos Engineering Principles](https://principlesofchaos.org/)
- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Linux tc (traffic control)](https://man7.org/linux/man-pages/man8/tc.8.html)
- [PostgreSQL Connection Pooling](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections)

## 🔗 Related Documentation

- See `../pra/README.md` for disaster recovery
- See `.github/workflows/pra.yml` for automated testing
- See `.github/workflows/quality.yml` for continuous testing

## 📝 Notes

- Tests are designed to be non-destructive (reversible)
- Always check application behavior during and after
- Use for learning and improvement, not punishment
- Document all findings
- Share results with team

## 🚀 Next Steps

1. **Learn**: Understand each chaos test
2. **Practice**: Run tests in dev environment
3. **Integrate**: Add to CI/CD pipeline
4. **Monitor**: Track metrics and alerts
5. **Improve**: Fix issues found
6. **Repeat**: Regular chaos engineering sessions

---

Last Updated: October 25, 2025  
Framework Version: 1.0.0  
Status: Production Ready ✅
