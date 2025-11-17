# AKIG - Stack Complète Ultra-Production
# 🚀 Guide de Lancement

## 📋 Services Disponibles

### Core Services
- **Frontend Dashboard**: https://dashboard.akig.local
- **API Backend (Node.js)**: https://api.akig.local
- **ML Service (Python)**: https://ml.akig.local

### Admin Tools
- **Traefik Dashboard**: http://localhost:8080
- **Portainer**: https://portainer.akig.local
- **pgAdmin**: https://pgadmin.akig.local
- **RedisInsight**: https://redis.akig.local
- **Adminer**: https://adminer.akig.local

### Monitoring
- **Prometheus**: https://prometheus.akig.local
- **Grafana**: https://grafana.akig.local

## 🎯 Lancement Rapide

### 1. Configuration Initiale

```powershell
# Créer fichier .env
Copy-Item .env.example .env

# Éditer les variables:
# - DATABASE_URL
# - JWT_SECRET
# - POSTGRES_PASSWORD
# - GRAFANA_PASSWORD
# - PGADMIN_PASSWORD
```

### 2. Lancer TOUTE la Stack

```powershell
# Créer le réseau Docker
docker network create akig-network

# Lancer tous les services
docker-compose `
  -f docker-compose.traefik.yml `
  -f docker-compose.admin.yml `
  up -d --build

# Vérifier l'état
docker-compose -f docker-compose.traefik.yml ps
```

### 3. Configuration Hosts (Développement Local)

Ajouter à `C:\Windows\System32\drivers\etc\hosts`:

```
127.0.0.1 akig.local
127.0.0.1 dashboard.akig.local
127.0.0.1 api.akig.local
127.0.0.1 ml.akig.local
127.0.0.1 traefik.akig.local
127.0.0.1 portainer.akig.local
127.0.0.1 pgadmin.akig.local
127.0.0.1 redis.akig.local
127.0.0.1 prometheus.akig.local
127.0.0.1 grafana.akig.local
127.0.0.1 adminer.akig.local
```

## 🔧 Commandes Utiles

### Logs en temps réel
```powershell
# Tous les services
docker-compose -f docker-compose.traefik.yml logs -f

# Service spécifique
docker-compose -f docker-compose.traefik.yml logs -f api
docker-compose -f docker-compose.traefik.yml logs -f ml-api
```

### Redémarrer un service
```powershell
docker-compose -f docker-compose.traefik.yml restart api
```

### Exécuter une commande dans un container
```powershell
# Backend Node.js
docker exec -it akig-api sh

# ML Service Python
docker exec -it akig-ml-api bash

# PostgreSQL
docker exec -it akig-postgres psql -U user -d solvency_dev
```

### Nettoyer tout
```powershell
docker-compose -f docker-compose.traefik.yml -f docker-compose.admin.yml down -v
docker network rm akig-network
```

## 📦 Composants Backend Python

### CLI Admin
```powershell
# Depuis le container
docker exec -it akig-ml-api python cli/admin.py tenant demo-tenant-1 --detailed

# Batch scoring
docker exec -it akig-ml-api python cli/admin.py batch-score tenants.csv --output results.csv
```

### Workers Celery
```powershell
# Lancer le worker
docker exec -d akig-ml-api celery -A workers.celery_app worker --loglevel=info --pool=threads --concurrency=4

# Lancer le scheduler (jobs cron)
docker exec -d akig-ml-api celery -A workers.celery_app beat --loglevel=info
```

### Export PDF/CSV
```bash
# Via API
curl https://api.akig.local/export/tenants/demo-tenant-1/csv -o report.csv
curl https://api.akig.local/export/tenants/demo-tenant-1/pdf -o report.pdf
```

## ⚛️ Frontend React

### Fonctionnalités Disponibles
- ✅ Dark Mode (toggle)
- ✅ Comparateur Multi-Tenants (jusqu'à 6 simultanés)
- ✅ Notifications Push PWA
- ✅ Export Charts PNG/JPEG
- ✅ Responsive (mobile, tablet, desktop)

### Development Local
```powershell
cd frontend-react
npm install
npm run dev  # http://localhost:5173
```

## 🔐 Sécurité

### SSL/TLS (Let's Encrypt)
- Automatique via Traefik
- Certificats stockés dans `./traefik/letsencrypt/acme.json`
- Renouvellement automatique

### Rate Limiting
- FREE: 100 req/h
- PRO: 1000 req/h
- ENTERPRISE: 10000 req/h
- Burst support

### Headers
- CORS configuré
- Security headers (HSTS, CSP)
- Compression gzip/brotli

## 📊 Monitoring

### Prometheus Targets
- API Node.js: http://api:8000/metrics
- ML Service: http://ml-api:8001/metrics
- PostgreSQL Exporter
- Redis Exporter

### Grafana Dashboards
1. Connexion: https://grafana.akig.local (admin / password depuis .env)
2. Ajouter Prometheus datasource: http://prometheus:9090
3. Importer dashboards prédéfinis

## 🐛 Troubleshooting

### API ne répond pas
```powershell
docker logs akig-api --tail 100
docker exec -it akig-api npm run test:ts
```

### ML Service erreur
```powershell
docker logs akig-ml-api --tail 100
docker exec -it akig-ml-api python -c "import xgboost; print(xgboost.__version__)"
```

### PostgreSQL connection refused
```powershell
docker exec -it akig-postgres pg_isready -U user
docker exec -it akig-postgres psql -U user -c "SELECT version();"
```

### Redis connection
```powershell
docker exec -it akig-redis redis-cli ping
```

## 🚀 Production Deployment

### AWS/Cloud
1. Remplacer Let's Encrypt staging par production
2. Configurer DNS A records vers IP publique
3. Utiliser Docker Swarm ou Kubernetes
4. Sauvegardes automatiques des volumes

### Backups
```powershell
# PostgreSQL
docker exec akig-postgres pg_dump -U user solvency_dev > backup.sql

# Restaurer
docker exec -i akig-postgres psql -U user solvency_dev < backup.sql
```

## 📝 Variables d'Environnement (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/solvency_dev
POSTGRES_USER=user
POSTGRES_PASSWORD=changeme

# Security
JWT_SECRET=your-secret-key-min-32-chars

# Admin Tools
PGADMIN_EMAIL=admin@akig.com
PGADMIN_PASSWORD=admin123
GRAFANA_PASSWORD=admin

# Optional
NODE_ENV=production
LOG_LEVEL=info
REDIS_URL=redis://redis:6379
```

## ✅ Checklist Déploiement

- [ ] .env configuré avec secrets forts
- [ ] Hosts configurés (dev) ou DNS (prod)
- [ ] Network Docker créé
- [ ] Services lancés (traefik + admin)
- [ ] SSL actif (cadenas vert)
- [ ] pgAdmin connecté à PostgreSQL
- [ ] RedisInsight connecté à Redis
- [ ] Prometheus scraping targets
- [ ] Grafana dashboards importés
- [ ] API health check: https://api.akig.local/api/health
- [ ] Frontend accessible: https://dashboard.akig.local

## 🎉 Prêt !

Tous les services sont maintenant accessibles via HTTPS avec certificats auto-signés (dev) ou Let's Encrypt (prod).

**Dashboard principal**: https://dashboard.akig.local

**Documentation API**: https://api.akig.local/docs (si FastAPI Swagger activé)
