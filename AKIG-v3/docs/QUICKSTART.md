# 🚀 AKIG v3.0 - DÉMARRAGE RAPIDE

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   █████╗ ██╗  ██╗██╗ ██████╗     ██╗   ██╗██████╗     ██████╗            ║
║  ██╔══██╗██║ ██╔╝██║██╔════╝     ██║   ██║╚════██╗   ██╔═████╗           ║
║  ███████║█████╔╝ ██║██║  ███╗    ██║   ██║ █████╔╝   ██║██╔██║           ║
║  ██╔══██║██╔═██╗ ██║██║   ██║    ╚██╗ ██╔╝ ╚═══██╗   ████╔╝██║           ║
║  ██║  ██║██║  ██╗██║╚██████╔╝     ╚████╔╝ ██████╔╝██╗╚██████╔╝           ║
║  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝       ╚═══╝  ╚═════╝ ╚═╝ ╚═════╝            ║
║                                                                           ║
║              Système Immobilier Hyper-Moderne & IA-Driven                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## 📋 ÉTAPES D'INSTALLATION (5 minutes)

### ✅ Étape 1: Vérifier Prérequis

```powershell
# Node.js 22.11.0
node --version
# Doit afficher: v22.11.0 ou supérieur

# pnpm 9.14.2
pnpm --version
# Doit afficher: 9.14.2 ou supérieur

# Docker 27.3
docker --version
# Doit afficher: Docker version 27.3 ou supérieur

# Python 3.13
python --version
# Doit afficher: Python 3.13.0 ou supérieur
```

**Si manquant**:
```powershell
# Node.js via nvm-windows
nvm install 22.11.0
nvm use 22.11.0

# pnpm
npm install -g pnpm@9.14.2

# Docker Desktop
# Télécharger depuis https://www.docker.com/products/docker-desktop

# Python 3.13
# Télécharger depuis https://www.python.org/downloads/
```

---

### ✅ Étape 2: Installation One-Command

```powershell
cd c:\AKIG\AKIG-v3

# Unix/Linux/Mac
./scripts/install.sh

# Windows (Git Bash ou WSL)
bash scripts/install.sh

# Windows PowerShell (si bash non disponible)
# Exécuter manuellement les commandes ci-dessous
```

**Installation manuelle Windows**:
```powershell
# 1. Installer dépendances
pnpm install --frozen-lockfile

# 2. Copier environnement
Copy-Item .env.example .env

# 3. Build applications
pnpm build

# 4. Lancer Docker
docker compose build
docker compose up -d postgres redis

# Attendre 30 secondes pour PostgreSQL
Start-Sleep -Seconds 30

# 5. Migrations DB
cd apps\api
pnpm prisma migrate deploy
cd ..\..

# 6. Lancer tous services
docker compose up -d

# 7. Vérifier santé
Start-Sleep -Seconds 60
curl http://localhost:4000/health
curl http://localhost:3000
```

---

### ✅ Étape 3: Vérifier Services

```powershell
# Statut containers
docker compose ps

# Devrait afficher 11 services "Up":
# ✅ postgres (healthy)
# ✅ redis (healthy)
# ✅ api-1, api-2, api-3 (healthy)
# ✅ web (healthy)
# ✅ ml-api (healthy)
# ✅ prometheus (healthy)
# ✅ grafana (healthy)
# ✅ loki (healthy)
# ✅ minio (healthy)

# Logs temps réel
docker compose logs -f api web ml-api
```

---

### ✅ Étape 4: Accéder Applications

```
┌─────────────────────────────────────────────────────────────────────┐
│                       🌐 URLS SERVICES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Frontend (Next.js)                                                 │
│  → http://localhost:3000                                            │
│                                                                     │
│  Backend API (NestJS)                                               │
│  → http://localhost:4000                                            │
│                                                                     │
│  API Documentation (Swagger)                                        │
│  → http://localhost:4000/api/docs                                   │
│                                                                     │
│  ML/IA Service (FastAPI)                                            │
│  → http://localhost:8000/docs                                       │
│                                                                     │
│  Grafana (Monitoring)                                               │
│  → http://localhost:3001                                            │
│  📧 admin / 🔑 admin                                                │
│                                                                     │
│  Prometheus (Metrics)                                               │
│  → http://localhost:9090                                            │
│                                                                     │
│  MinIO Console (S3 Storage)                                         │
│  → http://localhost:9001                                            │
│  📧 minioadmin / 🔑 minioadmin                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### ✅ Étape 5: Tester API

**Swagger UI** (recommandé):
1. Ouvrir http://localhost:4000/api/docs
2. Cliquer "Authorize"
3. Tester endpoints `/auth/register`, `/auth/login`

**cURL**:
```powershell
# Health check
curl http://localhost:4000/health

# Register user
curl -X POST http://localhost:4000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@akig.gn",
    "password": "SecurePass123!",
    "name": "Admin AKIG",
    "role": "ADMIN"
  }'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@akig.gn",
    "password": "SecurePass123!"
  }'

# Copier le "accessToken" reçu

# Test authenticated endpoint
$token = "votre_access_token_ici"
curl -H "Authorization: Bearer $token" http://localhost:4000/api/v1/users/me
```

---

## 🔧 Commandes Utiles

### Développement

```powershell
# Démarrer en mode dev (hot reload)
pnpm dev

# Build production
pnpm build

# Tests
pnpm test

# Linter
pnpm lint

# Format code
pnpm format
```

### Docker

```powershell
# Démarrer services
docker compose up -d

# Arrêter services
docker compose down

# Rebuild après changement code
docker compose build api web ml-api
docker compose up -d

# Logs d'un service
docker compose logs -f api

# Shell dans container
docker compose exec api sh
docker compose exec postgres psql -U akig -d akig_v3

# Nettoyer volumes (⚠️ perte données)
docker compose down -v
```

### Base de Données

```powershell
# Migrations Prisma
cd apps\api
pnpm prisma migrate dev --name migration_name
pnpm prisma migrate deploy  # Production

# Prisma Studio (GUI DB)
pnpm prisma studio
# Ouvre http://localhost:5555

# Seed data (si script existe)
pnpm prisma db seed

# Reset DB (⚠️ perte données)
pnpm prisma migrate reset
```

### Monitoring

```powershell
# Métriques Prometheus
curl http://localhost:4000/metrics

# Dashboard Grafana
# → http://localhost:3001
# Data Sources → Prometheus (http://prometheus:9090)
# Import dashboard ID: 11159 (Node.js)

# Logs Loki
curl http://localhost:3100/ready
```

---

## 🛠️ Dépannage

### Problème: Containers ne démarrent pas

```powershell
# Vérifier ports occupés
netstat -ano | findstr :3000
netstat -ano | findstr :4000
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Tuer process occupant port (remplacer PID)
taskkill /PID 12345 /F

# Rebuild complet
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Problème: Migrations Prisma échouent

```powershell
# Vérifier PostgreSQL accessible
docker compose ps postgres
# Doit être "Up (healthy)"

# Logs PostgreSQL
docker compose logs postgres

# Connexion manuelle
docker compose exec postgres psql -U akig -d akig_v3
# \dt pour lister tables
# \q pour quitter

# Reset migrations
cd apps\api
Remove-Item -Recurse -Force prisma\migrations
pnpm prisma migrate dev --name init
```

### Problème: Frontend ne charge pas

```powershell
# Vérifier build Next.js
cd apps\web
pnpm build

# Logs container
docker compose logs web

# Rebuild standalone
docker compose build web --no-cache
docker compose up -d web
```

### Problème: ML API erreurs 500

```powershell
# Vérifier modèle XGBoost chargé
docker compose logs ml-api | findstr "model"

# Créer dummy model si manquant
docker compose exec ml-api python -c "
import pickle
import xgboost as xgb
model = xgb.XGBClassifier()
with open('/app/models/tenant_risk_xgboost_v3.pkl', 'wb') as f:
    pickle.dump(model, f)
"

# Restart ML API
docker compose restart ml-api
```

---

## 📚 Ressources

### Documentation
- [README Principal](../README.md)
- [Guide Migration v2→v3](./MIGRATION_GUIDE.md)
- [Index Documentation](./INDEX.md)
- [Status Livraison](../00_LIVRAISON_COMPLETE_STATUS.md)

### Liens Externes
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)

### Support
- 📧 support@akig.gn
- 💬 [Slack Community](https://akig-community.slack.com)
- 🐛 [GitHub Issues](https://github.com/akig-corp/akig-v3/issues)

---

## 🎉 Félicitations!

Votre système AKIG v3.0 est maintenant opérationnel!

**Prochaines étapes**:
1. ✅ Explorer le dashboard → http://localhost:3000
2. ✅ Tester API Swagger → http://localhost:4000/api/docs
3. ✅ Configurer Grafana dashboards → http://localhost:3001
4. ✅ Lire [Guide Migration](./MIGRATION_GUIDE.md) si migration depuis v2
5. ✅ Développer nouvelles pages frontend (tenants, properties, contracts)

---

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                    🎊 SYSTÈME PRÊT POUR PRODUCTION 🎊                    ║
║                                                                           ║
║              Profitez de votre infrastructure hyper-moderne!              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```
