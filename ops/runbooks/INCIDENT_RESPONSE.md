# Incident Runbooks

## 🚨 Database Connection Pool Exhausted

### Detection
- Alert: `DatabaseConnectionPoolExhausted`
- Symptoms: "too many connections" errors, slow requests

### Immediate Actions (0-5 min)
1. Check alert dashboard for affected service
2. SSH into database server
   ```bash
   psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
   ```
3. Identify idle connections
   ```bash
   SELECT pid, usename, state, query FROM pg_stat_activity WHERE state != 'active';
   ```

### Root Cause Analysis (5-15 min)
- Check if connection pool is misconfigured
- Look for application memory leaks
- Check for long-running transactions

### Remediation
```bash
# Option 1: Increase pool size (temporary)
# Edit backend config and restart

# Option 2: Kill idle connections (careful!)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '10 minutes';

# Option 3: Set idle timeout
ALTER SYSTEM SET idle_in_transaction_session_timeout = 300000;
SELECT pg_ctl_reload();
```

### Prevention
- [ ] Set `max_connections` higher in postgresql.conf
- [ ] Configure PgBouncer connection pooling
- [ ] Add monitoring alert at 70% threshold
- [ ] Document connection pool sizing formula

---

## 🚨 High Error Rate (>5% 5xx errors)

### Detection
- Alert: `HighErrorRate`
- Metrics: Prometheus showing >5% HTTP 5xx in /api endpoints

### Immediate Actions (0-5 min)
1. Check error logs on backend
   ```bash
   kubectl logs -f deployment/akig-backend --tail=100
   ```
2. Get error details
   ```bash
   curl http://backend:4000/api/health
   ```
3. Check service status
   ```bash
   kubectl get pods -l app=akig
   ```

### Investigation (5-15 min)
1. Check Sentry for error patterns
   - Go to Sentry dashboard
   - Filter by last 5 minutes
   - Look for repeated errors
2. Check database status
   ```bash
   SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;
   ```
3. Check Redis status
   ```bash
   redis-cli PING
   redis-cli INFO stats
   ```

### Remediation
**Scenario A: Database issue**
- Restart database pod
- Check disk space
- Verify backup/recovery

**Scenario B: Memory issue**
- Restart affected pods
- Increase resource limits
- Check for memory leaks

**Scenario C: Cache issue**
- Clear Redis cache (if safe)
- Restart Redis pod
- Check Redis logs

**Scenario D: Code issue**
- Rollback to previous version
- Monitor closely

```bash
# Rollback if needed
kubectl rollout undo deployment/akig-backend
```

### Post-Incident
- [ ] Root cause analysis meeting
- [ ] Add automatic remediation
- [ ] Update monitoring thresholds
- [ ] Documentation/training

---

## 🚨 High Response Time (P95 > 1 second)

### Checklist
- [ ] Check current load (requests/sec)
- [ ] Check database query times (slow queries)
- [ ] Check cache hit rate
- [ ] Check Redis memory
- [ ] Check network latency
- [ ] Check pod CPU/memory usage

### Quick Wins
1. Restart cache
2. Optimize N+1 queries
3. Add database indexes
4. Enable compression

---

## 🚨 Payment Processing Failure

### Critical - Revenue Impact!

### Immediate (0-2 min)
1. Check payment service status
   ```bash
   kubectl logs -f deployment/akig-backend --tail=50 | grep payment
   ```
2. Check payment gateway status
3. Notify on-call payment engineer

### Investigation (2-10 min)
1. Check payment logs
2. Verify third-party API connectivity
3. Check recent deployments
4. Review failed transaction queue

### Remediation
1. For recent transaction failures:
   ```bash
   # Manually retry failed payments
   curl -X POST http://backend:4000/api/payments/retry \
     -H "Authorization: Bearer ${TOKEN}" \
     -d '{"status": "failed"}'
   ```
2. Check queue depth
3. Verify reconciliation data

### Critical Data
- Business impact: Direct revenue loss
- Customer impact: Immediate escalation
- Recovery time objective (RTO): < 5 min
- Recovery point objective (RPO): 0 (no data loss)

---

## 🚨 SSL Certificate Expiring

### Early Warning (30 days before)
- Alert: `CertificateExpiringInDays`
- Action: Schedule renewal

### Emergency (< 24 hours)
1. Verify certificate details
   ```bash
   openssl x509 -in /etc/ssl/certs/akig.crt -text -noout
   ```
2. If missing, request emergency cert from Let's Encrypt
3. Update with new certificate
4. Restart Nginx/Ingress controller

### Prevention
- Use cert-manager auto-renewal
- Set alerts at 30, 14, 7, 3, 1 days
- Test certificate rotation monthly

---

## 🚨 Security: Potential Breach

### Incident Response Checklist
1. **ISOLATE** - Disconnect affected systems
2. **ASSESS** - What data was accessed?
3. **NOTIFY** - Legal, leadership, affected users
4. **SECURE** - Reset credentials, rotate keys
5. **INVESTIGATE** - Forensics, root cause
6. **COMMUNICATE** - Transparency with users
7. **IMPROVE** - Prevent future incidents

### Immediate Actions
- [ ] Rotate all secrets/API keys
- [ ] Force password reset for all users
- [ ] Review audit logs for compromised accounts
- [ ] Check for data exfiltration
- [ ] Update WAF rules

### Escalation
- [ ] CTO/Security lead
- [ ] Legal team
- [ ] PR/Communications
- [ ] Customer support

---

## 🚨 Complete System Outage

### Check Cascade
1. DNS resolution working?
2. Load balancer up?
3. Ingress controller responding?
4. Kubernetes cluster healthy?
5. Backend pods running?
6. Database responding?
7. External dependencies?

### Recovery Steps
```bash
# 1. Get cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# 2. Check events
kubectl get events --sort-by='.lastTimestamp'

# 3. Restart affected components
kubectl rollout restart deployment/akig-backend
kubectl rollout restart deployment/akig-frontend

# 4. Verify recovery
curl http://backend:4000/api/health
```

### Disaster Recovery
If entire cluster down:
```bash
# Restore from backup
# 1. Restore PostgreSQL from latest backup
# 2. Restore Redis from AOF
# 3. Redeploy application
# 4. Run health checks
# 5. Verify data integrity
```

---

## 📊 Performance Troubleshooting

### Is it slow overall?
```bash
# Check backend latency
curl -w "Time: %{time_total}s\n" http://backend:4000/api/health

# Check database
psql -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Is it slow for specific endpoints?
```bash
# Check logs for slow requests
kubectl logs deployment/akig-backend | grep "duration.*ms" | tail -20
```

### Is it slow for specific users?
```bash
# Check audit logs for patterns
SELECT user_id, COUNT(*) as request_count, AVG(response_time) as avg_time 
FROM audit_logs 
WHERE created_at > now() - interval '1 hour'
GROUP BY user_id
ORDER BY avg_time DESC;
```

---

## 📞 Escalation Path

| Severity | Time | Action |
|----------|------|--------|
| 🔴 Critical | < 15 min | Page on-call, exec notification |
| 🟠 High | < 1 hour | Notify team lead, incident post |
| 🟡 Medium | < 4 hours | Create ticket, plan fix |
| 🟢 Low | < 1 day | Backlog item |

---

## Key Contacts

- **On-Call Lead**: `@oncall` (PagerDuty)
- **Database Expert**: `@db-team` (Slack)
- **Security**: `@security-team` (Slack)
- **Management**: DM leadership channel

---

## Post-Incident Checklist

After ANY incident:
- [ ] Root cause analysis
- [ ] Implement prevention
- [ ] Update runbooks
- [ ] Team learning session
- [ ] Update monitoring alerts
- [ ] Customer communication
