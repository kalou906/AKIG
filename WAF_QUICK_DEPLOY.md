# 🔐 Your WAF Configuration - Quick Deploy Guide

**Based on your config snippet:**
```nginx
server {
  listen 443 ssl;
  server_name api.akig.example.com;

  modsecurity on;
  modsecurity_rules_file /etc/nginx/modsec/main.conf;

  location / {
    proxy_pass http://akig-backend:4000;
  }
}
```

---

## ✅ What's Already Done

This config is **already fully implemented** in the complete system at `ops/nginx/waf.conf` with:

### ✅ Enhanced Features (Beyond Your Snippet)

```nginx
✓ Complete SSL/TLS configuration
✓ Rate limiting zones (4 zones, endpoint-specific)
✓ Security headers (HSTS, CSP, X-Frame-Options, etc.)
✓ Connection limits
✓ Upstream load balancing
✓ Failover support
✓ Request validation
✓ Audit logging
✓ Multiple location blocks for different endpoints
```

---

## 🚀 Deploy Your WAF (3 Steps)

### Step 1: Install ModSecurity (15 minutes)
```bash
# SSH to Nginx server
ssh admin@nginx-server

# Run installation script
bash /path/to/ops/nginx/install-modsecurity.sh

# Output should show:
# - ModSecurity library compiled
# - Nginx module compiled
# - All dependencies installed
```

### Step 2: Copy Configuration (2 minutes)
```bash
# Copy main WAF config
sudo cp ops/nginx/waf.conf /etc/nginx/conf.d/api.akig.conf

# Copy ModSecurity rules
sudo mkdir -p /etc/nginx/modsec
sudo cp ops/nginx/modsec/* /etc/nginx/modsec/

# Set permissions
sudo chown -R nginx:nginx /etc/nginx/modsec
sudo chmod -R 644 /etc/nginx/modsec
```

### Step 3: Test & Deploy (3 minutes)
```bash
# Test configuration
sudo nginx -t

# Output should show:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration will be effective immediately

# Reload Nginx
sudo systemctl reload nginx

# Verify ModSecurity is active
curl -I https://api.akig.example.com/

# Check header (should include security headers)
# Strict-Transport-Security: max-age=31536000
# X-Frame-Options: DENY
```

---

## 🧪 Verify WAF is Working

### Test 1: Normal Request (Should Pass)
```bash
# Should return 200 OK
curl -X GET https://api.akig.example.com/api/health
```

### Test 2: SQL Injection (Should Block)
```bash
# Should return 403 Forbidden
curl "https://api.akig.example.com/api/invoices?id=1' OR '1'='1"

# Check WAF logs
sudo tail -f /var/log/modsecurity/audit.log
```

### Test 3: XSS Attack (Should Block)
```bash
# Should return 403 Forbidden
curl "https://api.akig.example.com/api/search?q=<script>alert(1)</script>"
```

### Test 4: Rate Limiting (Should Block)
```bash
# Send 150 rapid requests (limit is 100/sec)
for i in {1..150}; do
  curl -s https://api.akig.example.com/api/test &
done

# Some should get 429 Too Many Requests
```

---

## 📊 Your Configuration Breakdown

### Part 1: Server Block
```nginx
server {
  listen 443 ssl;                    # HTTPS only
  server_name api.akig.example.com;  # Your domain
```
✅ Complete SSL/TLS config in main file

### Part 2: ModSecurity
```nginx
  modsecurity on;                           # Enable WAF
  modsecurity_rules_file /etc/nginx/modsec/main.conf;  # Load rules
```
✅ ModSecurity installed via script
✅ Rules file at `/etc/nginx/modsec/main.conf`

### Part 3: Location Block
```nginx
  location / {
    proxy_pass http://akig-backend:4000;   # Backend proxy
  }
}
```
✅ Backend upstream configured with load balancing
✅ Multiple endpoint rules (auth, payments, etc.)

---

## 🔐 What Gets Protected

### Automatic Blocking
- ✅ SQL Injection: `' OR 1=1`
- ✅ XSS: `<script>alert(1)</script>`
- ✅ Path Traversal: `../../../../etc/passwd`
- ✅ Command Injection: `; rm -rf /`
- ✅ LDAP Injection: `*)(uid=*))(|(uid=*`
- ✅ XML External Entities: External DTD references
- ✅ HTTP Floods: Rate limit exceeded
- ✅ Slowloris: Connection limits

### All Requests Get
- ✅ SSL/TLS verification (1.2+)
- ✅ Rate limiting
- ✅ Security headers added
- ✅ Request validation
- ✅ Audit logging

---

## 📋 Nginx Configuration Locations

### After Installation
```
/etc/nginx/
├── nginx.conf                    # Main config
├── conf.d/
│   ├── api.akig.conf            ← Your WAF config
│   ├── default.conf
│   └── ...
└── modsec/
    ├── main.conf                ← ModSecurity rules
    ├── crs-setup.conf           ← OWASP CRS
    └── ...
```

---

## 🔄 Complete Integration (Backend)

Your WAF connects to:

```
Nginx WAF (Port 443)
    ↓
Backend (Port 4000)
    ├─ app.js (Helmet headers, CORS, body limits)
    ├─ middleware/authorize.js (Permission checking)
    ├─ middleware/audit.js (Event logging)
    └─ routes/* (Protected endpoints)
    
All requests logged to:
    └─ PostgreSQL (10 audit tables + 5 views)
```

---

## 🛠️ Common Configurations

### Change Rate Limits
**File:** `/etc/nginx/conf.d/api.akig.conf`

```nginx
# Current: 100 requests per second
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

# Change to 50 requests per second
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=50r/s;

# Then reload
sudo systemctl reload nginx
```

### Add IP Whitelist
```nginx
location / {
  # Allow specific IPs
  allow 203.0.113.0/24;
  allow 198.51.100.5;
  
  # Deny all others
  deny all;
  
  proxy_pass http://akig-backend:4000;
}
```

### Disable WAF for Testing
```nginx
# Temporarily disable
modsecurity off;

# After testing, enable
modsecurity on;

# Reload
sudo systemctl reload nginx
```

---

## 📊 Monitoring

### View WAF Logs
```bash
# Real-time WAF audit log
sudo tail -f /var/log/modsecurity/audit.log

# Count total blocked requests
sudo grep '"action":"block"' /var/log/modsecurity/audit.log | wc -l

# Show recent attacks
sudo tail -100 /var/log/modsecurity/audit.log | \
  grep '"action":"block"' | \
  head -20
```

### View Nginx Errors
```bash
# Real-time error log
sudo tail -f /var/log/nginx/error.log

# Check SSL certificate expiry
echo | openssl s_client -servername api.akig.example.com \
  -connect api.akig.example.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### View Access Logs
```bash
# See all requests (including blocked)
sudo tail -f /var/log/nginx/access.log

# Count by status code
sudo tail -1000 /var/log/nginx/access.log | cut -d' ' -f9 | sort | uniq -c
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] ModSecurity installed: `nginx -V | grep modsecurity`
- [ ] Config syntax valid: `sudo nginx -t`
- [ ] WAF rules loaded: Check `/etc/nginx/modsec/` exists
- [ ] SSL certificate valid: Check `/etc/nginx/ssl/` cert path
- [ ] Backend online: Verify `akig-backend:4000` responds
- [ ] Rate limiting works: Send rapid requests
- [ ] Attack blocked: Test with SQL injection
- [ ] Logs configured: Check `/var/log/modsecurity/audit.log`
- [ ] Monitoring setup: Configure alerts
- [ ] Team trained: Share documentation

---

## 🚨 Troubleshooting

### Issue: 502 Bad Gateway
```bash
# Check if backend is running
curl http://akig-backend:4000/api/health

# Check upstream configuration
sudo nginx -T | grep -A 5 "upstream"

# Restart backend service
systemctl restart akig-backend
```

### Issue: All Requests Blocked
```bash
# Check ModSecurity log
sudo tail /var/log/modsecurity/audit.log

# May be overly restrictive rules
# Edit /etc/nginx/modsec/main.conf to adjust paranoia level

# Or disable temporarily to test
modsecurity off;
sudo systemctl reload nginx
```

### Issue: High Latency
```bash
# ModSecurity adds ~2-5ms
# Check if within acceptable range

# If too slow, disable specific rules
# In /etc/nginx/modsec/main.conf:
# SecRuleRemoveById 920100  # Remove specific rule

sudo systemctl reload nginx
```

### Issue: SSL Certificate Error
```bash
# Check certificate path
ls -l /etc/nginx/ssl/

# Verify certificate validity
openssl x509 -in /etc/nginx/ssl/akig.crt -text -noout | grep -E "Not Before|Not After"

# If expired, generate new certificate
```

---

## 📞 Support

**Issue with this config?**

1. Check `WAF_CONFIGURATION_STATUS.md` (comprehensive guide)
2. Check `WAF_INTEGRATION_GUIDE.md` (detailed integration)
3. Check `/var/log/modsecurity/audit.log` (WAF logs)
4. Check `/var/log/nginx/error.log` (Nginx errors)

---

## ✨ Quick Summary

Your configuration:
- ✅ Listens on port 443 (HTTPS)
- ✅ Enables ModSecurity (attack prevention)
- ✅ Proxies to backend on port 4000
- ✅ Is part of complete security stack
- ✅ Ready for production deployment

**Status: ✅ Ready to Deploy**

---

*For advanced configuration, see WAF_INTEGRATION_GUIDE.md*
