#!/bin/bash
# Secrets Management Checklist & Quick Reference
# AKIG Production Security

set -e

echo "==============================================="
echo "AKIG Secrets Management Checklist"
echo "==============================================="
echo ""

# =============================================================================
# PRE-DEPLOYMENT CHECKLIST
# =============================================================================
echo "📋 PRE-DEPLOYMENT CHECKLIST"
echo "---"
echo "□ All GitHub secrets configured"
echo "  - VAULT_ADDR"
echo "  - KUBE_CONFIG_BASE64"
echo "  - DB_HOST, DB_PORT, DB_PASSWORD_CURRENT"
echo "  - SLACK_WEBHOOK_SECURITY"
echo ""

echo "□ Vault configuration complete"
echo "  - JWT auth method enabled"
echo "  - GitHub OIDC audience configured"
echo "  - Secret path policies set"
echo ""

echo "□ Kubernetes RBAC configured"
echo "  - Service account created"
echo "  - Cluster role bound"
echo "  - Secret permissions granted"
echo ""

echo "□ Database configuration verified"
echo "  - PostgreSQL running and accessible"
echo "  - akig_admin user has ALTER USER permission"
echo "  - akig_app user exists"
echo ""

# =============================================================================
# MANUAL SECRET GENERATION (Emergency Use)
# =============================================================================
echo ""
echo "🔐 MANUAL SECRET GENERATION"
echo "---"
echo ""

# Uncomment to generate secrets
# CHOICE=$1
# 
# if [ "$CHOICE" = "generate" ]; then
#   echo "Generating new secrets..."
#   
#   JWT_SECRET=$(openssl rand -hex 32)
#   API_TOKEN=$(openssl rand -hex 24)
#   DB_PASSWORD=$(openssl rand -base64 24 | tr '+/' '-_' | tr -d '=' | head -c 16)
#   ENC_KEY=$(openssl rand -hex 32)
#   
#   echo "✅ JWT_SECRET: ${JWT_SECRET:0:8}..."
#   echo "✅ API_TOKEN: ${API_TOKEN:0:8}..."
#   echo "✅ DB_PASSWORD: ${DB_PASSWORD:0:8}..."
#   echo "✅ ENC_KEY: ${ENC_KEY:0:8}..."
#   
#   echo ""
#   echo "Export these commands to apply secrets:"
#   echo ""
#   echo "export JWT_SECRET='$JWT_SECRET'"
#   echo "export API_TOKEN='$API_TOKEN'"
#   echo "export DB_PASSWORD='$DB_PASSWORD'"
#   echo "export ENCRYPTION_KEY='$ENC_KEY'"
# fi

# =============================================================================
# VAULT COMMANDS
# =============================================================================
echo ""
echo "🔒 VAULT QUICK COMMANDS"
echo "---"
echo ""

echo "Authenticate to Vault:"
echo "  vault login -method=oidc -path=jwt"
echo ""

echo "View current secrets:"
echo "  vault kv get secret/akig/production/secrets"
echo ""

echo "View secret version history:"
echo "  vault kv metadata get secret/akig/production/secrets"
echo ""

echo "Restore specific version:"
echo "  vault kv get -version=3 secret/akig/production/secrets"
echo ""

echo "Update secrets manually:"
echo "  vault kv put secret/akig/production/secrets \\"
echo "    jwt_secret=<value> \\"
echo "    api_token=<value> \\"
echo "    db_password=<value> \\"
echo "    encryption_key=<value>"
echo ""

# =============================================================================
# KUBERNETES COMMANDS
# =============================================================================
echo ""
echo "☸️  KUBERNETES QUICK COMMANDS"
echo "---"
echo ""

echo "Check secrets:"
echo "  kubectl get secret akig-secrets -n akig"
echo ""

echo "View secret (base64):"
echo "  kubectl get secret akig-secrets -n akig -o yaml"
echo ""

echo "Decode specific secret:"
echo "  kubectl get secret akig-secrets -n akig -o jsonpath='{.data.JWT_SECRET}' | base64 -d"
echo ""

echo "Update secret manually:"
echo "  kubectl create secret generic akig-secrets -n akig \\"
echo "    --from-literal=JWT_SECRET=<value> \\"
echo "    --from-literal=API_TOKEN=<value> \\"
echo "    --from-literal=DB_PASSWORD=<value> \\"
echo "    --dry-run=client -o yaml | kubectl apply -f -"
echo ""

echo "Restart deployment with new secrets:"
echo "  kubectl rollout restart deployment/akig-backend -n akig"
echo ""

echo "Check rollout status:"
echo "  kubectl rollout status deployment/akig-backend -n akig"
echo ""

# =============================================================================
# POSTGRES COMMANDS
# =============================================================================
echo ""
echo "🐘 POSTGRESQL QUICK COMMANDS"
echo "---"
echo ""

echo "Connect to database:"
echo "  psql -h <host> -p 5432 -U akig_admin -d akig"
echo ""

echo "Change password for akig_app user:"
echo "  psql -c \"ALTER USER akig_app WITH PASSWORD '<new_password>';\" \\"
echo "    -h <host> -U akig_admin -d akig"
echo ""

echo "Verify password changed (in psql):"
echo "  \password akig_app"
echo ""

# =============================================================================
# MONITORING & VERIFICATION
# =============================================================================
echo ""
echo "📊 MONITORING & VERIFICATION"
echo "---"
echo ""

echo "Check backend health:"
echo "  kubectl port-forward -n akig svc/akig-backend 4000:4000"
echo "  curl http://localhost:4000/api/health"
echo ""

echo "View recent pod logs:"
echo "  kubectl logs -l app=akig-backend -n akig --tail=50 --timestamps"
echo ""

echo "Check for errors in logs:"
echo "  kubectl logs -l app=akig-backend -n akig | grep -i error"
echo ""

echo "Monitor real-time events:"
echo "  kubectl get events -n akig --sort-by='.lastTimestamp' --watch"
echo ""

echo "Check deployment status:"
echo "  kubectl get deployment akig-backend -n akig -o wide"
echo ""

# =============================================================================
# EMERGENCY PROCEDURES
# =============================================================================
echo ""
echo "🚨 EMERGENCY PROCEDURES"
echo "---"
echo ""

echo "Scale down deployment (stop pods):"
echo "  kubectl scale deployment akig-backend --replicas=0 -n akig"
echo ""

echo "Scale up deployment (start pods):"
echo "  kubectl scale deployment akig-backend --replicas=3 -n akig"
echo ""

echo "Force update with new secret:"
echo "  kubectl set env deployment/akig-backend \\"
echo "    JWT_SECRET=<value> \\"
echo "    --containers=akig-backend -n akig"
echo ""

echo "Revert to previous secret version:"
echo "  vault kv get -version=1 secret/akig/production/secrets > /tmp/prev.json"
echo "  vault kv put secret/akig/production/secrets @/tmp/prev.json"
echo ""

echo "Remove and recreate secret:"
echo "  kubectl delete secret akig-secrets -n akig"
echo "  kubectl create secret generic akig-secrets -n akig \\"
echo "    --from-literal=JWT_SECRET=<value>"
echo ""

# =============================================================================
# VERIFICATION CHECKLIST
# =============================================================================
echo ""
echo "✅ POST-ROTATION VERIFICATION CHECKLIST"
echo "---"
echo "□ Workflow completed successfully in GitHub Actions"
echo "□ Slack notification received"
echo "□ All pods are running (kubectl get pods)"
echo "□ Health check passes (curl /api/health)"
echo "□ API is responsive (test auth endpoint)"
echo "□ Database password works (psql connect)"
echo "□ No error logs (check pod logs)"
echo "□ Audit trail recorded (vault audit list)"
echo ""

# =============================================================================
# SECURITY REMINDERS
# =============================================================================
echo ""
echo "🔒 SECURITY REMINDERS"
echo "---"
echo "⚠️  NEVER commit secrets to Git"
echo "⚠️  NEVER expose secrets in logs or outputs"
echo "⚠️  NEVER share secrets via email or chat"
echo "⚠️  ALWAYS use ::add-mask:: in GitHub Actions"
echo "⚠️  ALWAYS verify rotation before marking complete"
echo "⚠️  ALWAYS maintain backup secrets"
echo "⚠️  ALWAYS log who changed what when"
echo ""

# =============================================================================
# USEFUL LINKS
# =============================================================================
echo ""
echo "📚 USEFUL LINKS"
echo "---"
echo "GitHub Actions:    https://github.com/$GITHUB_REPOSITORY/actions"
echo "Vault UI:          https://vault.example.com"
echo "Kubernetes Dash:   https://k8s.example.com"
echo "PostgreSQL Docs:   https://www.postgresql.org/docs"
echo ""

echo "==============================================="
echo "For more information, see:"
echo "  ops/secrets-rotation/README.md"
echo "==============================================="
