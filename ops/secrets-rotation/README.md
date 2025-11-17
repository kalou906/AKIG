# Secrets Rotation Workflow

## Overview

The AKIG secrets rotation workflow automatically rotates sensitive credentials on a scheduled basis (weekly) with full audit trailing, verification, and notifications.

## Architecture

```
GitHub Actions Workflow
├── Pre-Rotation Checks
│   ├── Validate environment
│   ├── Check system health
│   └── Generate rotation ID
│
├── Generate New Secrets (Parallel)
│   ├── JWT Secret (32 bytes)
│   ├── API Token (24 bytes)
│   ├── Database Password (16 chars)
│   └── Encryption Key (32 bytes)
│
├── Store Secrets
│   ├── HashiCorp Vault (primary)
│   ├── Kubernetes Secrets
│   └── Database Password
│
├── Restart Services
│   ├── Trigger rolling restart
│   ├── Wait for rollout
│   └── Verify health
│
└── Verification & Audit
    ├── Check backend health
    ├── Test API connectivity
    ├── Send notifications
    └── Log audit trail
```

## Features

### 1. Automated Schedule
- **Default:** Every Monday at 2 AM UTC
- **Manual Trigger:** Via `workflow_dispatch`
- **Selective Rotation:** Choose which secrets to rotate

### 2. Secret Types

| Secret | Size | Purpose | Rotation |
|--------|------|---------|----------|
| JWT Secret | 32 bytes | Authentication tokens | Weekly |
| API Token | 24 bytes | API authentication | Weekly |
| DB Password | 16 chars | PostgreSQL user | Weekly |
| Encryption Key | 32 bytes | Data encryption | Weekly |

### 3. Storage Strategy

**Primary:** HashiCorp Vault (KV2 backend)
```
secret/data/akig/production/secrets
├── jwt_secret
├── api_token
├── db_password
├── encryption_key
├── rotated_at
├── rotation_id
└── rotated_by
```

**Secondary:** Kubernetes Secrets
```
akig-secrets (Secret)
├── JWT_SECRET
├── API_TOKEN
├── DB_PASSWORD
├── ENCRYPTION_KEY
├── ROTATED_AT
└── ROTATION_ID
```

### 4. Verification Steps

1. **Pre-Rotation**
   - Validate Vault connectivity
   - Check Kubernetes cluster health
   - Verify backend deployment exists
   - Ensure at least 1 pod is ready

2. **Generation**
   - Cryptographic random generation
   - Secret masking in logs (`:add-mask:`)
   - Hash verification (SHA-256)

3. **Deployment**
   - Store in Vault
   - Update K8s secrets
   - Update database password
   - Trigger rolling restart

4. **Post-Rotation**
   - Wait 30 seconds for stabilization
   - Health check on backend
   - API connectivity test
   - Log verification

### 5. Security Features

✅ **No Secrets in Logs**
- All secrets masked with `::add-mask::`
- Only hashes shown in output
- Sensitive files deleted after use

✅ **Audit Trail**
- Rotation ID for tracking
- Timestamp recording
- Actor identification
- Environment logging

✅ **Safe Deployment**
- Zero-downtime rolling restart
- Health checks at each step
- Rollback capability
- Failure notifications

✅ **Data Protection**
- Vault JWT authentication (no long-lived tokens)
- Base64 encoding for K8s secrets
- PostgreSQL password update via secure connection

## Configuration

### GitHub Secrets Required

```
VAULT_ADDR                    # HashiCorp Vault URL
KUBE_CONFIG_BASE64            # Kubernetes config (base64)
DB_HOST                       # PostgreSQL host
DB_PORT                       # PostgreSQL port
DB_PASSWORD_CURRENT           # Current database password
SLACK_WEBHOOK_SECURITY       # Slack notification webhook
AUDIT_LOG_TOKEN              # Audit log API token
AUDIT_LOG_ENDPOINT           # Audit log API endpoint
```

### Vault Configuration

```hcl
# Vault JWT auth method
path "secret/data/akig/production/secrets" {
  capabilities = ["create", "read", "update", "delete"]
}

path "secret/data/akig/production/vault-token" {
  capabilities = ["read"]
}
```

### Kubernetes RBAC

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secrets-rotation
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["create", "update", "patch", "get"]
  - apiGroups: ["apps"]
    resources: ["deployments", "deployments/rollout"]
    verbs: ["get", "list", "watch", "patch", "update"]
  - apiGroups: ["apps"]
    resources: ["deployments/status"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
```

## Usage

### Automatic Rotation

Runs every Monday at 2 AM UTC automatically. No action required.

### Manual Rotation

**Trigger from UI:**
1. Go to GitHub Actions
2. Select "Rotate Secrets Weekly" workflow
3. Click "Run workflow"
4. Select secret type: `all`, `jwt`, `api_token`, `db_password`, `encryption_key`
5. Click "Run workflow"

**Trigger from CLI:**
```bash
gh workflow run rotate-secrets.yml \
  -f secret_type=all \
  -f environment=production
```

### Partial Rotation

Rotate only specific secrets:
```bash
# JWT secret only
gh workflow run rotate-secrets.yml -f secret_type=jwt

# Database password only
gh workflow run rotate-secrets.yml -f secret_type=db_password

# Multiple secrets (not yet implemented - use 'all' instead)
```

## Monitoring

### Real-time Status

1. **GitHub Actions Tab**
   - View workflow run progress
   - Check individual job status
   - Review logs for each step

2. **Slack Notifications**
   - Success notification with rotation ID
   - Failure alert with workflow link
   - Verification confirmation

3. **Kubernetes Events**
   ```bash
   kubectl get events -n akig --sort-by='.lastTimestamp'
   kubectl describe deployment akig-backend -n akig
   ```

4. **Vault Audit**
   ```bash
   # View Vault audit logs
   vault audit list
   vault read sys/audit
   ```

### Log Locations

**GitHub Actions:** `.github/workflows/rotate-secrets.yml` runs

**Kubernetes:**
```bash
# Deployment logs
kubectl logs -l app=akig-backend -n akig --tail=100

# Previous pod logs (if rotated)
kubectl logs -l app=akig-backend -n akig --previous
```

**Database:**
```bash
# Check password change in PostgreSQL logs
tail -f /var/log/postgresql/postgresql.log | grep -i "user\|password"
```

**Vault:**
```bash
# View stored secrets (values not logged)
vault read secret/data/akig/production/secrets

# View audit log
vault audit list
```

## Troubleshooting

### Issue: Workflow Fails at Pre-Rotation Check

**Cause:** Kubernetes cluster unreachable or deployment missing

**Solution:**
1. Verify KUBE_CONFIG_BASE64 is valid: `echo "$KUBE_CONFIG_BASE64" | base64 -d`
2. Check deployment exists: `kubectl get deployment akig-backend -n akig`
3. Verify pods are running: `kubectl get pods -l app=akig-backend -n akig`

### Issue: Vault Authentication Fails

**Cause:** JWT token invalid or role not configured

**Solution:**
1. Check VAULT_ADDR is correct
2. Verify GitHub Actions is configured for OIDC
3. Check Vault JWT role: `vault read auth/jwt/role/github-actions-secrets-rotation`
4. Enable JWT auth: `vault auth enable jwt`

### Issue: Database Password Update Fails

**Cause:** PostgreSQL connection refused or wrong current password

**Solution:**
1. Verify DB_HOST and DB_PORT
2. Check DB_PASSWORD_CURRENT is correct
3. Test connection: `psql -h $DB_HOST -U $DB_USER -d akig`
4. Check PostgreSQL is running and accessible

### Issue: Deployment Doesn't Roll Out

**Cause:** New pods failing to start with new secrets

**Solution:**
1. Check pod logs: `kubectl logs <pod-name> -n akig`
2. Verify secret created: `kubectl get secret akig-secrets -n akig`
3. Check environment variable mounting in deployment
4. Review resource limits - may be insufficient

### Issue: Rollback Needed

**Options:**
1. **Manual Revert in Vault:**
   ```bash
   # Get previous secret version
   vault kv get -version=<N> secret/akig/production/secrets
   
   # Store previous version as current
   vault kv put secret/akig/production/secrets @backup.json
   ```

2. **Manual Restart with Old Secrets:**
   ```bash
   kubectl rollout restart deployment/akig-backend -n akig
   ```

3. **Git Revert (if hardcoded):**
   ```bash
   git revert <commit>
   git push
   ```

## Best Practices

### 1. Monitoring
- Check Slack notifications daily
- Review GitHub Actions logs weekly
- Monitor Vault audit logs monthly

### 2. Testing
- Test rotation in staging first
- Verify health checks pass
- Confirm API connectivity restored

### 3. Documentation
- Update runbooks after any changes
- Document emergency procedures
- Track rotation history

### 4. Security
- Never commit secrets to Git
- Use short-lived credentials
- Enable MFA for Vault access
- Audit all secret access

### 5. Redundancy
- Maintain backup secrets
- Have manual rotation procedure
- Test disaster recovery monthly

## Performance Impact

| Phase | Duration | Impact |
|-------|----------|--------|
| Pre-checks | ~30 sec | No downtime |
| Generate secrets | ~10 sec | No downtime |
| Store in Vault | ~30 sec | No downtime |
| K8s secret update | ~20 sec | No downtime |
| DB password update | ~5 sec | No downtime |
| Rolling restart | ~5 min | Zero-downtime (pod by pod) |
| Verification | ~1 min | No additional downtime |
| **Total** | **~7 min** | **Zero-downtime** |

## Metrics

After each rotation, these metrics are collected:

- Rotation ID (unique)
- Timestamp (UTC)
- Duration (total time)
- Secrets rotated (count)
- Deployment restarts (count)
- Health checks (passed/failed)
- Notifications sent (success/failure)

## Disaster Recovery

### Complete Secrets Loss

If all secrets are lost or corrupted:

1. **Immediate Actions:**
   ```bash
   # Stop applications
   kubectl scale deployment akig-backend --replicas=0 -n akig
   ```

2. **Restore from Backup:**
   ```bash
   # Restore Vault backup
   vault auth login (use break-glass token)
   vault kv put secret/akig/production/secrets @backup.json
   ```

3. **Manual Secret Update:**
   ```bash
   # Generate new secrets
   NEW_SECRET=$(openssl rand -hex 32)
   
   # Update all systems
   kubectl set env deployment/akig-backend JWT_SECRET=$NEW_SECRET -n akig
   psql -c "ALTER USER akig_app WITH PASSWORD '$NEW_SECRET';"
   ```

4. **Resume Operations:**
   ```bash
   kubectl scale deployment akig-backend --replicas=3 -n akig
   ```

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-alteruser.html)

## Support

For issues:
1. Check workflow logs in GitHub Actions
2. Review Slack notifications
3. Check Vault audit logs
4. Consult troubleshooting guide above
5. Contact security team for emergency access
