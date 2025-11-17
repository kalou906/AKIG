# 🚀 AKIG - Production Deployment Guide

**Status**: Ready for production deployment
**Version**: 1.0
**Last Updated**: 2024

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests pass locally: `make test`
- [ ] Build completes without errors: `make build`
- [ ] No console warnings: Check browser console
- [ ] Database reset works: `make reset`
- [ ] Makefile commands functional: `make help`
- [ ] Environment variables configured
- [ ] SSH key to VPS working
- [ ] Domain/DNS configured
- [ ] SSL certificate ready
- [ ] Backup existing database

---

## 🔧 Configuration Setup

### 1. Environment Variables

Create `.env` file in root:

```bash
# Database
DATABASE_URL=postgres://akig_user:SECURE_PASSWORD@db.example.com:5432/akig_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# API
API_PORT=4000
NODE_ENV=production
LOG_LEVEL=info

# Frontend
REACT_APP_API_URL=https://api.akig.example.com

# Deployment
DEPLOY_PATH=/home/deploy/akig
SERVER_HOST=production.example.com
SERVER_USER=deploy
```

### 2. GitHub Secrets Configuration

Set these secrets in GitHub Actions:

```
Settings → Secrets and variables → Actions
```

**Required Secrets**:

```
SSH_PRIVATE_KEY
├─ Content: $(cat ~/.ssh/id_rsa)
└─ Permissions: 600

SERVER_HOST
├─ Content: production.example.com
└─ Type: deployment hostname

SERVER_USER
├─ Content: deploy
└─ Type: SSH username

DEPLOY_PATH
├─ Content: /home/deploy/akig
└─ Type: absolute path on server

PRODUCTION_URL
├─ Content: https://akig.example.com
└─ Type: public URL

API_URL_PROD
├─ Content: https://api.akig.example.com
└─ Type: API endpoint
```

### 3. Server Setup (VPS)

SSH to your server and prepare:

```bash
# Create deploy user
sudo useradd -m deploy
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/.ssh
sudo chown -R deploy:deploy /home/deploy/.ssh

# Add GitHub Actions public key
echo "ssh-rsa AAAA... github-actions" | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys

# Create deployment directory
sudo mkdir -p /home/deploy/akig
sudo chown -R deploy:deploy /home/deploy/akig

# Install Docker & Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Create .env file
cat > /home/deploy/akig/.env << 'EOF'
DATABASE_URL=postgres://akig_user:PASSWORD@localhost:5432/akig_db
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=4000
REACT_APP_API_URL=https://api.akig.example.com
EOF

# Create postgres volume
sudo docker volume create akig_postgres_data
```

### 4. Domain & SSL Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --standalone \
  -d api.akig.example.com \
  -d akig.example.com

# Auto-renewal (runs daily)
sudo systemctl enable certbot.timer
```

---

## 🚀 Deployment Process

### Step 1: Local Validation

```bash
# Clone latest code
git clone https://github.com/your-org/akig.git
cd akig

# Install dependencies
make install

# Run tests locally
make test

# Build
make build

# Expected output:
# ✅ All tests passed
# ✅ Build successful
```

### Step 2: Push to GitHub

```bash
# Commit changes
git add .
git commit -m "🚀 Ready for production deployment"

# Push to main (triggers CI/CD)
git push origin main
```

### Step 3: Monitor GitHub Actions

1. Go to: **GitHub → Actions**
2. Monitor **CI Pipeline**:
   - Should complete in ~10 minutes
   - Tests run on Chrome, Firefox, Safari
   - Reports available after completion

3. Monitor **CD Pipeline** (if CI passes):
   - Should complete in ~15 minutes
   - Deployment to VPS
   - Smoke tests post-deploy

### Step 4: Verify Production Deployment

```bash
# SSH to server
ssh deploy@production.example.com

# Check services
docker-compose ps
# Expected: postgres, api, frontend, nginx all UP

# Check API health
curl https://api.akig.example.com/api/health
# Expected: {"status": "ok"}

# Check frontend
curl https://akig.example.com
# Expected: HTML with React app

# Check logs
docker-compose logs api -f
docker-compose logs frontend -f
```

---

## 📊 Monitoring Post-Deployment

### 1. Application Monitoring

```bash
# Sentry (Error tracking)
# Dashboard: https://sentry.io/your-org/akig

# LogRocket (Session replay)
# Dashboard: https://app.logrocket.com/your-org/akig

# GitHub Actions
# Workflow runs: https://github.com/your-org/akig/actions
```

### 2. Infrastructure Monitoring

```bash
# SSH to server
ssh deploy@production.example.com

# CPU & Memory
top -bn1 | grep "Cpu\|Mem"

# Disk usage
df -h

# Docker health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Database connections
docker-compose exec postgres \
  psql -U akig_user -d akig_db -c "SELECT count(*) FROM pg_stat_activity;"
```

### 3. Performance Monitoring

```bash
# Test API response time
curl -w "\n%{time_total}\n" \
  https://api.akig.example.com/api/contracts

# Test frontend load
curl -o /dev/null -s -w "%{time_total}\n" \
  https://akig.example.com
```

---

## 🔄 Common Deployment Tasks

### Restart Services

```bash
ssh deploy@production.example.com
cd /home/deploy/akig
docker-compose restart

# Or specific service
docker-compose restart api
docker-compose restart frontend
```

### View Logs

```bash
ssh deploy@production.example.com
cd /home/deploy/akig

# All logs
docker-compose logs -f

# Specific service
docker-compose logs api -f
docker-compose logs frontend -f

# Last 100 lines
docker-compose logs --tail=100
```

### Manual Database Reset

```bash
ssh deploy@production.example.com
cd /home/deploy/akig

# Reset database
docker-compose exec -T api npm run db:reset

# Expected output:
# 🗑️  Deletion complète de toutes les tables...
# 📋 Exécution des migrations...
# 🌱 Chargement des données de seed...
# ✅ Base de données réinitialisée
```

### Rollback Deployment

```bash
ssh deploy@production.example.com
cd /home/deploy/akig

# Go back to previous commit
git reset --hard HEAD~1

# Restart services
docker-compose down
docker-compose up -d

# Verify
docker ps
```

---

## 🆘 Troubleshooting

### Services won't start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker-compose logs

# Restart Docker
sudo systemctl restart docker

# Check disk space
df -h
# If <10% free: clean up old images
docker system prune -a
```

### Database connection error

```bash
# Check PostgreSQL health
docker-compose exec postgres \
  pg_isready -U akig_user

# Check environment variables
cat /home/deploy/akig/.env

# Restart PostgreSQL
docker-compose restart postgres
sleep 5
docker-compose logs postgres
```

### API returning 500 errors

```bash
# Check API logs
docker-compose logs api -f --tail=100

# Check database connection
docker-compose exec api \
  curl localhost:4000/api/health

# Restart API
docker-compose restart api
```

### Frontend showing 502 (Bad Gateway)

```bash
# Check Nginx
docker-compose logs nginx -f

# Check if API is reachable
curl http://localhost:4000/api/health

# Restart all services
docker-compose restart
```

### High memory usage

```bash
# Check which service
docker stats

# Restart heavy service
docker-compose restart api

# If persistent: scale down or increase server RAM
```

---

## 📈 Scaling & Performance

### Increase API Replicas

Edit `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      replicas: 3
    depends_on:
      postgres:
        condition: service_healthy
```

Then restart:

```bash
docker-compose up -d --scale api=3
```

### Database Optimization

```bash
# SSH to server
ssh deploy@production.example.com
cd /home/deploy/akig

# Run VACUUM (cleanup)
docker-compose exec postgres \
  psql -U akig_user -d akig_db -c "VACUUM ANALYZE;"

# Check index efficiency
docker-compose exec postgres \
  psql -U akig_user -d akig_db << 'EOF'
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
EOF
```

### Cache Configuration

Add to nginx configuration:

```nginx
# Static assets (1 year cache)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API responses (5 min cache)
location /api/ {
    proxy_cache DYNAMIC;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502;
}
```

---

## 🔐 Security Hardening

### Enable Firewall

```bash
# Allow SSH only from office IP
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Regular Backups

```bash
# Backup database daily (3 AM UTC)
0 3 * * * docker-compose exec -T postgres \
  pg_dump -U akig_user akig_db | gzip > \
  /home/deploy/backups/akig_$(date +\%Y\%m\%d).sql.gz
```

### Monitor Security

```bash
# Check for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image akig-api:latest

# Audit logs
docker-compose logs --all --timestamps
```

---

## 📞 Support & Alerts

### Setup Slack Alerts

```bash
# Add to CD workflow secrets:
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Add to .github/workflows/cd.yml:
- name: 📢 Slack notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
    text: "❌ Deployment failed"
    status: ${{ job.status }}
```

### Setup Sentry Alerts

```javascript
// In frontend/src/index.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## ✅ Post-Deployment Checklist

After deploying to production:

- [ ] All services running: `docker-compose ps`
- [ ] API health check: `curl /api/health`
- [ ] Frontend loads: Open https://akig.example.com
- [ ] No console errors: Check browser DevTools
- [ ] Tests pass on production: `make test`
- [ ] Database synchronized: Check audit logs
- [ ] Backups running: Check backup directory
- [ ] Monitoring active: Sentry + LogRocket
- [ ] Team notified: Slack + Email
- [ ] Documentation updated: Add deployment notes

---

## 🎯 Expected Production Metrics

| Metric | Target | Unit |
|--------|--------|------|
| Uptime | 99.9% | % |
| Response Time (API) | <100 | ms |
| Response Time (Frontend) | <500 | ms |
| Error Rate | <0.1% | % |
| Database Size | <10 | GB |
| CPU Usage | <50% | % |
| Memory Usage | <70% | % |

---

## 📚 Additional Resources

- **Docker Docs**: https://docs.docker.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Nginx Docs**: https://nginx.org/en/docs/
- **React Docs**: https://react.dev/
- **GitHub Actions**: https://docs.github.com/en/actions

---

**🎉 Deployment complete! AKIG is now live! 🚀**

**For support, contact the DevOps team or open an issue on GitHub.**
