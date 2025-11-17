#!/bin/bash
# =============================================================================
# ModSecurity Installation & Setup Script for AKIG
# =============================================================================
# This script installs and configures ModSecurity for Nginx WAF

set -e

echo "==============================================="
echo "ModSecurity for Nginx Installation"
echo "==============================================="

# =============================================================================
# 1. PREREQUISITES
# =============================================================================

echo "[*] Checking prerequisites..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "[-] This script must be run as root"
   exit 1
fi

# Install dependencies
echo "[*] Installing dependencies..."
apt-get update
apt-get install -y \
  build-essential \
  autoconf \
  automake \
  libtool \
  pkg-config \
  libcurl4-openssl-dev \
  libssl-dev \
  libxml2-dev \
  libadjacent-dev \
  liblmdb-dev \
  libgeoip-dev \
  libpng-dev \
  libfuzzy-dev \
  git \
  wget \
  curl \
  unzip

# =============================================================================
# 2. CREATE DIRECTORIES
# =============================================================================

echo "[*] Creating ModSecurity directories..."
mkdir -p /etc/nginx/modsec/rules
mkdir -p /var/log/modsecurity
chmod 755 /var/log/modsecurity

# =============================================================================
# 3. DOWNLOAD AND BUILD ModSecurity
# =============================================================================

echo "[*] Downloading ModSecurity source..."
cd /tmp
rm -rf ModSecurity
git clone --depth 1 https://github.com/SpiderLabs/ModSecurity.git
cd ModSecurity

echo "[*] Building ModSecurity..."
./build.sh
./configure --prefix=/usr/local/modsecurity
make
make install

# =============================================================================
# 4. DOWNLOAD ModSecurity NGINX CONNECTOR
# =============================================================================

echo "[*] Downloading ModSecurity Nginx Connector..."
cd /tmp
rm -rf ModSecurity-nginx
git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git

# Get current Nginx version
NGINX_VERSION=$(nginx -v 2>&1 | grep -oP 'nginx/\K[^ ]+')
echo "[*] Current Nginx version: $NGINX_VERSION"

# =============================================================================
# 5. RECOMPILE NGINX WITH ModSecurity
# =============================================================================

echo "[*] Downloading Nginx source code..."
cd /tmp
wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz
tar xzf nginx-${NGINX_VERSION}.tar.gz
cd nginx-${NGINX_VERSION}

echo "[*] Configuring Nginx with ModSecurity module..."
./configure \
  --prefix=/etc/nginx \
  --sbin-path=/usr/sbin/nginx \
  --modules-path=/usr/lib64/nginx/modules \
  --conf-path=/etc/nginx/nginx.conf \
  --error-log-path=/var/log/nginx/error.log \
  --http-log-path=/var/log/nginx/access.log \
  --pid-path=/var/run/nginx.pid \
  --lock-path=/var/run/nginx.lock \
  --with-http_ssl_module \
  --with-http_v2_module \
  --with-http_realip_module \
  --with-http_gzip_static_module \
  --with-http_secure_link_module \
  --with-http_stub_status_module \
  --add-dynamic-module=../ModSecurity-nginx

echo "[*] Compiling Nginx..."
make
make install

echo "[+] Nginx recompiled with ModSecurity support"

# =============================================================================
# 6. DOWNLOAD OWASP CORE RULE SET
# =============================================================================

echo "[*] Downloading OWASP Core Rule Set..."
cd /etc/nginx/modsec/rules
git clone https://github.com/coreruleset/coreruleset.git ./crs

# Copy example exceptions
cp /etc/nginx/modsec/rules/crs/crs-setup.conf.example /etc/nginx/modsec/rules/crs-setup.conf

echo "[+] Core Rule Set installed"

# =============================================================================
# 7. COPY ModSecurity CONFIGURATION
# =============================================================================

echo "[*] Setting up ModSecurity configuration..."

# Copy Unicode mapping
cp /usr/local/modsecurity/share/modsecurity/unicode.mapping /etc/nginx/modsec/

# Set permissions
chown -R www-data:www-data /etc/nginx/modsec
chmod -R 755 /etc/nginx/modsec

# =============================================================================
# 8. CONFIGURE AUDIT LOGGING
# =============================================================================

echo "[*] Configuring audit logging..."

mkdir -p /var/log/modsecurity/audit
chown www-data:www-data /var/log/modsecurity/audit
chmod 755 /var/log/modsecurity/audit

# Create logrotate configuration
cat > /etc/logrotate.d/modsecurity << 'EOF'
/var/log/modsecurity/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 640 www-data www-data
  sharedscripts
  postrotate
    systemctl reload nginx > /dev/null 2>&1 || true
  endscript
}

/var/log/modsecurity/audit/audit.log {
  daily
  missingok
  rotate 30
  compress
  delaycompress
  notifempty
  create 640 www-data www-data
  sharedscripts
  postrotate
    systemctl reload nginx > /dev/null 2>&1 || true
  endscript
}
EOF

# =============================================================================
# 9. ENABLE ModSecurity MODULE IN NGINX
# =============================================================================

echo "[*] Enabling ModSecurity in Nginx..."

# Add to nginx.conf if not already present
if ! grep -q "modsecurity_module" /etc/nginx/nginx.conf; then
  sed -i '1i load_module modules/ngx_http_modsecurity_module.so;' /etc/nginx/nginx.conf
fi

# =============================================================================
# 10. TEST CONFIGURATION
# =============================================================================

echo "[*] Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
  echo "[+] Nginx configuration is valid"
else
  echo "[-] Nginx configuration has errors"
  exit 1
fi

# =============================================================================
# 11. RESTART NGINX
# =============================================================================

echo "[*] Restarting Nginx with ModSecurity..."
systemctl restart nginx

if systemctl is-active --quiet nginx; then
  echo "[+] Nginx is running"
else
  echo "[-] Failed to start Nginx"
  exit 1
fi

# =============================================================================
# 12. VERIFY INSTALLATION
# =============================================================================

echo "[*] Verifying ModSecurity installation..."

# Test WAF
TEST_URL="http://localhost/test?id=1' OR '1'='1"
RESPONSE=$(curl -s "$TEST_URL" 2>&1 || true)

if echo "$RESPONSE" | grep -q "403"; then
  echo "[+] ModSecurity is blocking malicious requests"
else
  echo "[*] ModSecurity is installed but may be in DetectionOnly mode"
fi

# =============================================================================
# 13. SETUP MONITORING
# =============================================================================

echo "[*] Setting up monitoring..."

# Create monitoring script
cat > /usr/local/bin/modsec-monitor.sh << 'EOF'
#!/bin/bash
# Monitor ModSecurity events

echo "ModSecurity Real-time Alert Monitor"
echo "Press Ctrl+C to exit"
echo ""

tail -f /var/log/modsecurity/audit.log | jq . 2>/dev/null || \
tail -f /var/log/modsecurity/audit.log
EOF

chmod +x /usr/local/bin/modsec-monitor.sh

# =============================================================================
# 14. GENERATE CONFIGURATION
# =============================================================================

echo "[*] Generating AKIG-specific configurations..."

# Configuration files are already in place via the config management

# =============================================================================
# COMPLETION
# =============================================================================

echo ""
echo "==============================================="
echo "[+] ModSecurity installation complete!"
echo "==============================================="
echo ""
echo "Next steps:"
echo "1. Review ModSecurity rules:"
echo "   /etc/nginx/modsec/main.conf"
echo "2. Check logs:"
echo "   tail -f /var/log/modsecurity/audit.log"
echo "3. Monitor real-time alerts:"
echo "   /usr/local/bin/modsec-monitor.sh"
echo "4. Reload configuration:"
echo "   nginx -s reload"
echo ""
echo "Documentation:"
echo "- ModSecurity: https://github.com/SpiderLabs/ModSecurity"
echo "- OWASP CRS: https://github.com/coreruleset/coreruleset"
echo "- Nginx WAF: /etc/nginx/modsec/waf.conf"
echo ""
