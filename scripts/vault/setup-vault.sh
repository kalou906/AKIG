#!/bin/bash
# Vault Initial Setup Script
# Configures Vault for AKIG Solvency AI project

set -e

echo "========================================="
echo "🔐 AKIG Vault Setup Script"
echo "========================================="

# Configuration
VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
VAULT_TOKEN="${VAULT_TOKEN:-dev-token}"
ENVIRONMENT="${ENVIRONMENT:-development}"

export VAULT_ADDR
export VAULT_TOKEN
export VAULT_SKIP_VERIFY=1  # For dev with self-signed certs

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Vault Address: $VAULT_ADDR${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo ""

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be ready..."
until vault status > /dev/null 2>&1; do
  echo "Waiting for Vault..."
  sleep 2
done

echo -e "${GREEN}✅ Vault is ready${NC}"
echo ""

# ========================================
# 1. Enable Secrets Engines
# ========================================
echo "📦 Enabling secrets engines..."

# KV v2 for static secrets
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "KV already enabled"

# Database for dynamic credentials
vault secrets enable database 2>/dev/null || echo "Database engine already enabled"

# PKI for TLS certificates
vault secrets enable pki 2>/dev/null || echo "PKI already enabled"
vault secrets tune -max-lease-ttl=87600h pki 2>/dev/null || true

# Transit for encryption
vault secrets enable transit 2>/dev/null || echo "Transit already enabled"

echo -e "${GREEN}✅ Secrets engines enabled${NC}"
echo ""

# ========================================
# 2. Configure PKI (Certificates)
# ========================================
echo "🔑 Configuring PKI..."

# Generate root CA
vault write -field=certificate pki/root/generate/internal \
  common_name="AKIG Solvency AI CA" \
  ttl=87600h > /tmp/ca_cert.crt 2>/dev/null || true

# Configure CA URLs
vault write pki/config/urls \
  issuing_certificates="$VAULT_ADDR/v1/pki/ca" \
  crl_distribution_points="$VAULT_ADDR/v1/pki/crl" 2>/dev/null || true

# Create role for API certificates
vault write pki/roles/solvency-api \
  allowed_domains="solvency.local,akig.local" \
  allow_subdomains=true \
  max_ttl=720h 2>/dev/null || true

echo -e "${GREEN}✅ PKI configured${NC}"
echo ""

# ========================================
# 3. Configure Transit Encryption
# ========================================
echo "🔐 Configuring Transit encryption..."

vault write -f transit/keys/solvency-key 2>/dev/null || echo "Transit key already exists"

echo -e "${GREEN}✅ Transit encryption configured${NC}"
echo ""

# ========================================
# 4. Create Policies
# ========================================
echo "📋 Creating policies..."

# Policy for solvency-api
vault policy write solvency-api - <<EOF
# Read all secrets
path "secret/data/solvency/*" {
  capabilities = ["read"]
}

# List secrets
path "secret/metadata/solvency/*" {
  capabilities = ["list"]
}

# Generate dynamic DB credentials
path "database/creds/solvency-app" {
  capabilities = ["read"]
}

# Generate TLS certificates
path "pki/issue/solvency-api" {
  capabilities = ["create", "update"]
}

# Transit encryption
path "transit/encrypt/solvency-key" {
  capabilities = ["update"]
}

path "transit/decrypt/solvency-key" {
  capabilities = ["update"]
}

# Renew token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Lookup self
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
EOF

# Policy for read-only access
vault policy write solvency-readonly - <<EOF
path "secret/data/solvency/*" {
  capabilities = ["read"]
}

path "secret/metadata/solvency/*" {
  capabilities = ["list"]
}
EOF

echo -e "${GREEN}✅ Policies created${NC}"
echo ""

# ========================================
# 5. Configure Authentication
# ========================================
echo "🔓 Configuring authentication methods..."

# Enable AppRole for CI/CD
vault auth enable approle 2>/dev/null || echo "AppRole already enabled"

# Create AppRole for CI/CD
vault write auth/approle/role/ci-cd \
  token_policies="solvency-api" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=0

# Get role ID
ROLE_ID=$(vault read -field=role_id auth/approle/role/ci-cd/role-id)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/ci-cd/secret-id)

echo -e "${YELLOW}AppRole Credentials (save these securely):${NC}"
echo "VAULT_ROLE_ID=$ROLE_ID"
echo "VAULT_SECRET_ID=$SECRET_ID"
echo ""

# Enable Kubernetes auth (if in K8s)
if [ -f "/var/run/secrets/kubernetes.io/serviceaccount/token" ]; then
  echo "Configuring Kubernetes auth..."
  vault auth enable kubernetes 2>/dev/null || echo "Kubernetes auth already enabled"
  
  # Configure K8s auth
  vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc:443" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token
  
  # Create role
  vault write auth/kubernetes/role/solvency-api \
    bound_service_account_names=solvency-api-sa \
    bound_service_account_namespaces=solvency-ai \
    policies=solvency-api \
    ttl=24h
  
  echo -e "${GREEN}✅ Kubernetes auth configured${NC}"
fi

echo ""

# ========================================
# 6. Create Initial Secrets
# ========================================
echo "🔑 Creating initial secrets..."

# API Secrets
vault kv put secret/solvency/api \
  JWT_SECRET="$(openssl rand -base64 32)" \
  JWT_EXPIRES_IN="24h"

# Database Secrets
vault kv put secret/solvency/database \
  POSTGRES_PASSWORD="changeme-in-production" \
  REDIS_PASSWORD="changeme-in-production"

echo -e "${GREEN}✅ Initial secrets created${NC}"
echo ""

# ========================================
# 7. Enable Audit Logging
# ========================================
echo "📝 Enabling audit logging..."

mkdir -p /vault/logs
vault audit enable file file_path=/vault/logs/audit.log 2>/dev/null || echo "Audit already enabled"

echo -e "${GREEN}✅ Audit logging enabled${NC}"
echo ""

# ========================================
# 8. Summary
# ========================================
echo "========================================="
echo -e "${GREEN}✅ Vault Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Save AppRole credentials to CI/CD secrets"
echo "2. Run migration script: python scripts/vault/migrate_to_vault.py --env-file .env.prod"
echo "3. Update backend config to use Vault: export USE_VAULT=true"
echo "4. Test health check: curl http://localhost:8000/health/vault"
echo ""
echo "Vault UI: $VAULT_ADDR/ui"
echo "Token: $VAULT_TOKEN"
echo ""
