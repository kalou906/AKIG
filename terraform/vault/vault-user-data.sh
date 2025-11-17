#!/bin/bash
# Vault Installation & Configuration Script
# Runs on EC2 instance boot

set -e

VAULT_VERSION="${vault_version}"
KMS_KEY_ID="${kms_key_id}"
AWS_REGION="${aws_region}"
NODE_ID="${node_id}"
ENVIRONMENT="${environment}"

echo "========================================="
echo "Installing Vault ${vault_version}"
echo "Node ID: ${node_id}"
echo "Environment: ${environment}"
echo "========================================="

# Update system
yum update -y

# Install dependencies
yum install -y wget unzip jq

# Download and install Vault
cd /tmp
wget https://releases.hashicorp.com/vault/${vault_version}/vault_${vault_version}_linux_amd64.zip
unzip vault_${vault_version}_linux_amd64.zip
mv vault /usr/local/bin/
chmod +x /usr/local/bin/

# Verify installation
vault version

# Create Vault user
useradd --system --home /etc/vault.d --shell /bin/false vault

# Create directories
mkdir -p /opt/vault/data
mkdir -p /opt/vault/tls
mkdir -p /etc/vault.d
chown -R vault:vault /opt/vault
chown -R vault:vault /etc/vault.d

# Generate self-signed certificate (for dev/testing)
# In production, use proper CA-signed certificates
cd /opt/vault/tls
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -keyout vault.key -out vault.crt \
  -subj "/CN=vault-${node_id}.internal" \
  -addext "subjectAltName=DNS:vault-${node_id}.internal,IP:$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)"

chown vault:vault /opt/vault/tls/*
chmod 0600 /opt/vault/tls/vault.key

# Get instance metadata
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

# Create Vault configuration
cat > /etc/vault.d/vault.hcl <<EOF
# Vault Configuration - Node ${node_id}
ui = true

# Storage backend - Raft (HA)
storage "raft" {
  path    = "/opt/vault/data"
  node_id = "vault-${node_id}"
}

# Listener for API
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault/tls/vault.crt"
  tls_key_file  = "/opt/vault/tls/vault.key"
  
  # TLS settings
  tls_min_version = "tls12"
  tls_cipher_suites = [
    "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
    "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"
  ]
}

# Auto-unseal with AWS KMS
seal "awskms" {
  region     = "${aws_region}"
  kms_key_id = "${kms_key_id}"
}

# API address
api_addr = "https://${instance_ip}:8200"

# Cluster address
cluster_addr = "https://${instance_ip}:8201"

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}

# Log level
log_level = "info"

# Disable mlock (for containers/certain environments)
# disable_mlock = true
EOF

chown vault:vault /etc/vault.d/vault.hcl
chmod 0640 /etc/vault.d/vault.hcl

# Create systemd service
cat > /etc/systemd/system/vault.service <<EOF
[Unit]
Description=HashiCorp Vault
Documentation=https://www.vaultproject.io/docs/
Requires=network-online.target
After=network-online.target
ConditionFileNotEmpty=/etc/vault.d/vault.hcl

[Service]
Type=notify
User=vault
Group=vault
ProtectSystem=full
ProtectHome=read-only
PrivateTmp=yes
PrivateDevices=yes
SecureBits=keep-caps
AmbientCapabilities=CAP_IPC_LOCK
CapabilityBoundingSet=CAP_SYSLOG CAP_IPC_LOCK
NoNewPrivileges=yes
ExecStart=/usr/local/bin/vault server -config=/etc/vault.d/vault.hcl
ExecReload=/bin/kill --signal HUP \$MAINPID
KillMode=process
KillSignal=SIGINT
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
LimitNOFILE=65536
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
EOF

# Enable and start Vault
systemctl daemon-reload
systemctl enable vault
systemctl start vault

# Wait for Vault to start
sleep 10

# Export Vault address for initialization
export VAULT_ADDR="https://127.0.0.1:8200"
export VAULT_SKIP_VERIFY=1  # Self-signed cert

# Initialize Vault (only on node 0)
if [ "${node_id}" -eq 0 ]; then
  echo "Initializing Vault cluster..."
  
  # Initialize with auto-unseal (only 1 recovery key needed)
  vault operator init \
    -recovery-shares=1 \
    -recovery-threshold=1 \
    -format=json > /root/vault-init.json
  
  # Save root token to SSM Parameter Store
  ROOT_TOKEN=$(jq -r '.root_token' /root/vault-init.json)
  RECOVERY_KEY=$(jq -r '.recovery_keys_b64[0]' /root/vault-init.json)
  
  aws ssm put-parameter \
    --name "/vault/${environment}/root-token" \
    --value "$ROOT_TOKEN" \
    --type "SecureString" \
    --region "${aws_region}" \
    --overwrite || true
  
  aws ssm put-parameter \
    --name "/vault/${environment}/recovery-key" \
    --value "$RECOVERY_KEY" \
    --type "SecureString" \
    --region "${aws_region}" \
    --overwrite || true
  
  echo "✅ Vault initialized successfully"
  echo "Root token and recovery key saved to SSM Parameter Store"
fi

echo "========================================="
echo "Vault installation completed!"
echo "Node: vault-${node_id}"
echo "Address: https://${instance_ip}:8200"
echo "========================================="
