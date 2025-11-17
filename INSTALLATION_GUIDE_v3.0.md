# 🚀 AKIG v3.0 - Quick Installation & Deployment

> Get AKIG v3.0 running in 5 steps (30 minutes)

## Prerequisites

✅ Docker & Docker Compose installed
✅ Node.js 18+ installed
✅ PostgreSQL 14+ (or use Docker)
✅ Redis 7.0+ (or use Docker)
✅ Git installed

## Option 1: Docker Compose (Recommended - 5 min)

### Step 1: Clone & Setup
```bash
git clone https://github.com/akig/backend
git clone https://github.com/akig/frontend
cd backend
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
# DATABASE_URL, JWT_SECRET, etc.
```

### Step 3: Start Services
```bash
docker-compose up -d
```

Services will start:
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Backend: localhost:4000
- Frontend: localhost:3000

### Step 4: Run Migrations
```bash
docker-compose exec backend npm run migrations:run
docker-compose exec backend npm run migrations:seed
```

### Step 5: Verify
```bash
curl http://localhost:4000/api/health
# Should return { "status": "ok", "timestamp": "..." }
```

✅ **Done!** Open http://localhost:3000

---

## Option 2: Manual Setup (Local Development - 15 min)

### Backend

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure database**
   ```bash
   # Create PostgreSQL database
   createdb akig
   
   # Set environment
   cp .env.example .env
   # Edit DATABASE_URL
   ```

3. **Run migrations**
   ```bash
   npm run migrations:run
   npm run migrations:seed
   ```

4. **Start server**
   ```bash
   npm run dev
   # Backend ready at http://localhost:4000
   ```

### Frontend

1. **Install dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   # Frontend ready at http://localhost:3000
   ```

### Redis (Optional - for caching)

```bash
# Start Redis with Docker
docker run -d \
  -p 6379:6379 \
  --name akig-redis \
  redis:7-alpine

# Or macOS with Homebrew
brew install redis
redis-server
```

---

## Option 3: Kubernetes Deployment (Production - 20 min)

### Prerequisites
- kubectl configured
- Docker images built: `akig/backend:latest`, `akig/frontend:latest`
- Kubernetes cluster running

### Deploy

1. **Create namespace**
   ```bash
   kubectl create namespace akig
   ```

2. **Create secrets**
   ```bash
   kubectl create secret generic akig-secrets \
     --from-literal=database-url="postgresql://user:pass@postgres:5432/akig" \
     --from-literal=redis-url="redis://redis:6379" \
     --from-literal=jwt-secret="your-secret-key" \
     --from-literal=sentry-dsn="https://..." \
     -n akig
   ```

3. **Deploy backend**
   ```bash
   kubectl apply -f ops/k8s/deployment.yaml -n akig
   ```

4. **Deploy monitoring**
   ```bash
   kubectl apply -f ops/prometheus/ -n akig
   ```

5. **Verify deployment**
   ```bash
   kubectl get pods -n akig
   kubectl get svc -n akig
   ```

---

## 🔍 Verify Installation

### Health Checks
```bash
# Backend
curl http://localhost:4000/api/health
# Response: { "status": "ok" }

# Frontend
curl http://localhost:3000
# Response: HTML page

# Database
psql akig -c "SELECT version();"

# Redis (if running)
redis-cli ping
# Response: PONG
```

### Test Login
1. Open http://localhost:3000
2. Login with default credentials:
   - Email: `admin@akig.app`
   - Password: `Akig@123456`

### Check Logs
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes
kubectl logs -f deployment/akig-backend -n akig
```

---

## 📊 Performance Optimization (Already Configured)

### Enabled by Default
✅ Redis caching (with TTL)
✅ Gzip compression (HTTP responses)
✅ Database indexing (20+ indexes)
✅ Pagination (max 100 per page)
✅ Full-text search (PostgreSQL FTS)
✅ ETag caching (conditional requests)

### Performance Metrics
After 5 minutes of traffic, check:
```bash
# Check cache stats
curl http://localhost:4000/api/cache/stats

# Check database performance
psql akig -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check Redis stats
redis-cli INFO stats
```

---

## 🔐 Security Setup

### First Time Setup
1. **Change default credentials**
   ```bash
   # Admin account password reset
   # Use "Forgot Password" feature
   ```

2. **Enable 2FA**
   - Go to Settings > Security
   - Scan QR code with authenticator app
   - Save backup codes

3. **Review RBAC settings**
   - Admin > Users > Edit roles
   - Assign permissions appropriately

4. **Configure WAF**
   - Nginx WAF rules in `ops/nginx-waf.conf`
   - Activate ModSecurity

5. **Setup Secrets Management**
   - Store `JWT_SECRET` in vault
   - Rotate credentials regularly

---

## 🛠️ Troubleshooting

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# If using Docker
docker logs akig-redis

# Restart Redis
docker restart akig-redis
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -l

# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Port Already in Use
```bash
# Find process using port
lsof -i :4000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432 # PostgreSQL
lsof -i :6379 # Redis

# Kill process
kill -9 <PID>
```

### Memory Issues
```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Desktop Docker: Preferences > Resources > Memory
```

---

## 📈 Next Steps

1. **Review Documentation**
   - [ ] Read `GUIDE_COMPLET.md`
   - [ ] Check `docs/adr/` for architecture decisions
   - [ ] Review `docs/onboarding/DEVELOPER_ONBOARDING.md`

2. **Run Tests**
   ```bash
   npm test                 # Unit tests
   npm run test:e2e        # E2E tests
   ```

3. **Monitor Performance**
   - Check Prometheus: http://localhost:9090
   - Check Grafana: http://localhost:3000 (admin/admin)
   - View traces: http://localhost:16686 (Jaeger)

4. **Setup CI/CD**
   - Configure GitHub Actions
   - Setup automatic deployments
   - Create staging environment

5. **Scale to Production**
   - Deploy to Kubernetes cluster
   - Configure auto-scaling
   - Setup backup strategy
   - Enable monitoring alerts

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `EXCEPTIONAL_IMPROVEMENTS_v3.md` | Complete implementation plan |
| `IMPLEMENTATION_COMPLETE_v3.0.md` | What was implemented |
| `GUIDE_COMPLET.md` | Full guide |
| `QUICK_REF.md` | Quick reference |
| `docs/adr/` | Architecture decisions |
| `ops/runbooks/` | Incident response |
| `docs/onboarding/` | Developer onboarding |

---

## 🆘 Getting Help

### Common Issues
- Port already in use: See troubleshooting above
- Database error: Run `npm run migrations:run` again
- Cache error: Check Redis is running
- Memory leak: Restart services

### Support
- 📧 Email: dev-team@akig.app
- 💬 Slack: #dev-team
- 📞 Call: +1-XXX-XXX-XXXX (US)

---

## ✅ Deployment Checklist

- [ ] Clone repositories
- [ ] Install dependencies
- [ ] Configure `.env` files
- [ ] Start Docker services
- [ ] Run migrations
- [ ] Verify health checks pass
- [ ] Test login
- [ ] Check logs for errors
- [ ] Review performance metrics
- [ ] Read documentation
- [ ] Setup monitoring

---

## 🎉 Success!

You now have a production-ready AKIG v3.0 installation!

**Next**: Deploy to staging, run tests, go live! 🚀

Questions? Check the docs or reach out on Slack!
