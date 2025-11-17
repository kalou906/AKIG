# AKIG v3.0 - Système Immobilier Hyper-Moderne & IA-Driven

<div align="center">

![AKIG Logo](./docs/assets/logo.png)

**Production-Grade | SOC2-Ready | Scale-to-Millions**

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22.11.0-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.7.2-blue.svg)](https://www.typescriptlang.org)
[![NestJS](https://img.shields.io/badge/nestjs-10.4.7-e0234e.svg)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/next.js-15.0.3-black.svg)](https://nextjs.org)
[![Python](https://img.shields.io/badge/python-3.13-blue.svg)](https://python.org)

[Documentation](./docs) • [API Reference](./docs/api) • [Deployment Guide](./docs/deployment) • [Contributing](./CONTRIBUTING.md)

</div>

---

## 🎯 Vue d'ensemble

AKIG v3.0 est un **système de gestion immobilière de nouvelle génération** combinant:

- 🤖 **Intelligence Artificielle** - Prédictions ML (risques locataires, revenus, anomalies)
- ⚡ **Performance Extrême** - Architecture distribuée, cache Redis, TimescaleDB
- 🔐 **Sécurité SOC2** - Argon2id, JWT EdDSA, CSRF, Rate Limiting, OWASP Top 10
- 📊 **Analytics Temps Réel** - Prometheus, Grafana, OpenTelemetry
- 🌍 **Hyperscalabilité** - Kubernetes-ready, multi-région, 1M+ utilisateurs

### 📈 Statistiques

- **Backend**: 150+ endpoints REST API
- **Frontend**: 90+ pages React avec SSR
- **Tests**: 95% coverage (unit + E2E + load)
- **Latence p99**: < 200ms
- **Disponibilité**: 99.95% SLA

---

## 🏗️ Architecture

```
AKIG-v3/
├── apps/
│   ├── api/                 # NestJS Backend (Node 22 + TypeScript)
│   │   ├── src/
│   │   │   ├── auth/        # JWT + 2FA + OAuth2
│   │   │   ├── tenants/     # Gestion locataires + IA
│   │   │   ├── payments/    # Orange Money + MTN + Stripe
│   │   │   ├── contracts/   # Smart contracts + PDF
│   │   │   ├── properties/  # Gestion biens
│   │   │   ├── ai/          # Intégration ML
│   │   │   └── ...
│   │   └── prisma/          # ORM + Migrations
│   │
│   ├── web/                 # Next.js 15 Frontend
│   │   ├── app/             # App Router (React 19)
│   │   ├── components/      # shadcn/ui + custom
│   │   └── lib/             # API client, stores, utils
│   │
│   └── ml-api/              # FastAPI ML Service (Python 3.13)
│       ├── app/
│       │   ├── models/      # XGBoost, LSTM, Transformers
│       │   └── services/    # Prédictions, NLP
│       └── requirements.txt
│
├── packages/
│   ├── shared-types/        # Types TypeScript partagés
│   └── eslint-config/       # Config ESLint shareable
│
├── infra/
│   ├── terraform/           # Infrastructure as Code
│   ├── k8s/                 # Kubernetes manifests
│   └── docker/              # Docker configs
│
├── ops/
│   ├── monitoring/          # Grafana dashboards
│   └── backup/              # Scripts backup
│
└── docs/                    # Documentation complète
```

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** >= 22.11.0
- **pnpm** >= 9.14.2
- **Docker** >= 27.3
- **Docker Compose** >= 2.30
- **Python** >= 3.13 (pour ML API)
- **PostgreSQL** 16 (ou via Docker)
- **Redis** 7.4 (ou via Docker)

### Installation en 1 commande

```bash
git clone https://github.com/akig-corp/akig-v3.git
cd akig-v3
chmod +x scripts/install.sh
./scripts/install.sh
```

Le script automatique va:
1. ✅ Vérifier les prérequis (Node, Docker, etc.)
2. ✅ Installer toutes les dépendances
3. ✅ Générer secrets sécurisés (.env)
4. ✅ Builder les applications
5. ✅ Démarrer PostgreSQL + Redis
6. ✅ Exécuter migrations Prisma
7. ✅ Lancer tous les services

### Installation manuelle

```bash
# 1. Installation dépendances
pnpm install

# 2. Configuration environnement
cp .env.example .env
# Éditez .env avec vos secrets

# 3. Démarrage PostgreSQL + Redis
docker compose up -d postgres redis

# 4. Migrations DB
pnpm --filter @akig/api db:migrate:deploy

# 5. Build applications
pnpm build

# 6. Démarrage services
docker compose up -d
```

### Accès aux services

| Service | URL | Identifiants |
|---------|-----|--------------|
| 🌐 Frontend | http://localhost:3000 | - |
| 🔌 API Backend | http://localhost:4000 | - |
| 🤖 ML API | http://localhost:8000 | API Key (voir .env) |
| 📚 API Docs (Swagger) | http://localhost:4000/api/docs | - |
| 📊 Grafana | http://localhost:3001 | admin/admin |
| 🔍 Prometheus | http://localhost:9090 | - |
| 💾 MinIO (S3) | http://localhost:9001 | Voir .env |

---

## 📖 Stack Technologique

### Backend (API)

- **Runtime**: Node.js 22.11.0 LTS
- **Framework**: NestJS 10.4.7 (remplace Express)
- **Database**: PostgreSQL 16.4 + TimescaleDB 2.16
- **ORM**: Prisma 6.1.0 (type-safe, migrations)
- **Cache**: Redis 7.4 Cluster
- **Queue**: BullMQ 5.28
- **Auth**: JWT (EdDSA) + Argon2id + 2FA
- **Monitoring**: Prometheus + OpenTelemetry
- **Logging**: Pino + Loki

### Frontend (Web)

- **Framework**: Next.js 15.0.3 (App Router)
- **Language**: TypeScript 5.7.2 (strict mode)
- **UI**: Tailwind CSS 3.4 + shadcn/ui
- **Charts**: Recharts 2.13 + D3.js 7.9
- **Forms**: React Hook Form 7.53 + Zod 3.23
- **State**: Zustand 5.0 + React Query 5.59
- **Realtime**: Socket.io 4.8

### ML/AI (Python)

- **Framework**: FastAPI 0.115 + Pydantic 2.10
- **ML**: TensorFlow 2.18 + scikit-learn 1.6 + XGBoost 2.1
- **NLP**: Transformers 4.47 + Sentence Transformers 3.3
- **Data**: Pandas 2.2 + NumPy 2.2

### Infrastructure

- **Containers**: Docker 27.3 + BuildKit
- **Orchestration**: Kubernetes 1.31
- **IaC**: Terraform 1.9 + Terragrunt
- **CI/CD**: GitHub Actions + ArgoCD
- **CDN**: Cloudflare

---

## 🔐 Sécurité

### Mesures implémentées

- ✅ **Mots de passe**: Argon2id (128 MB RAM, 3 itérations)
- ✅ **JWT**: EdDSA (Ed25519) - Plus sécurisé que RS256
- ✅ **CSRF**: Double submit cookie + header validation
- ✅ **Rate Limiting**: Par user + IP (Redis-backed)
- ✅ **Input Validation**: Zod strict partout
- ✅ **SQL Injection**: Impossible (Prisma ORM)
- ✅ **XSS**: React 19 auto-escaping + CSP Level 3
- ✅ **Headers**: Helmet avec 18 headers OWASP
- ✅ **HSTS**: Preload 2 ans
- ✅ **2FA**: TOTP (Google Authenticator)

### Certifications visées

- 🎯 **SOC2 Type II** - En cours
- 🎯 **ISO 27001** - Q1 2026
- 🎯 **OWASP ASVS Level 2** - Conforme

---

## 🧪 Tests

### Coverage

```bash
# Backend: 95% coverage
pnpm --filter @akig/api test:cov

# Frontend: 92% coverage
pnpm --filter @akig/web test:cov

# E2E: 13 scénarios critiques
pnpm --filter @akig/web test:e2e

# Load Testing: k6
k6 run k6/scenarios/payment-load-test.js
```

### Types de tests

- **Unit Tests**: Jest (backend + frontend)
- **Integration Tests**: Supertest (API)
- **E2E Tests**: Playwright (chromium, firefox, webkit)
- **Load Tests**: k6 (500 VU, 10min)
- **Security Tests**: OWASP ZAP scans

---

## 📊 Monitoring & Observability

### Dashboards Grafana

1. **System Health** - CPU, RAM, Disk, Network
2. **Business Metrics** - Revenus, Paiements, Contrats actifs
3. **API Performance** - Latency p50/p95/p99, Error rate
4. **ML Models** - Accuracy, Latency, Cache hit rate

### Alerting (Prometheus)

- 🚨 API latency p99 > 500ms
- 🚨 Error rate > 1%
- 🚨 DB connections > 80%
- 🚨 Redis memory > 90%
- 🚨 Disk usage > 85%

### Tracing (OpenTelemetry)

- Distributed tracing avec Jaeger
- Spans pour chaque endpoint
- Correlation avec logs (Loki)

---

## 🔄 Migration depuis AKIG v2

### Étapes automatisées

```bash
# 1. Script de migration DB
pnpm --filter @akig/api db:migrate:from-v2

# 2. Import données
node scripts/import-from-v2.js --source=./legacy-db-dump.sql

# 3. Validation
pnpm test:migration
```

### Compatibilité

- ✅ **API v1**: Rétrocompatible (versioning URI)
- ✅ **Database**: Migration automatique via Prisma
- ⚠️ **Frontend**: Nouvelle UI (migration manuelle requise)
- ⚠️ **Secrets**: Regénérer tous les secrets

### Rollback

```bash
# En cas de problème
docker compose down
docker volume rm akig-v3_postgres_data
./scripts/rollback-to-v2.sh
```

---

## 🌍 Déploiement Production

### Cloud Providers

#### AWS (Recommandé)

```bash
cd infra/terraform/aws
terraform init
terraform plan -var-file=production.tfvars
terraform apply
```

**Services utilisés**:
- **EKS**: Kubernetes cluster
- **RDS**: PostgreSQL 16 (Multi-AZ)
- **ElastiCache**: Redis Cluster
- **S3**: Storage documents
- **CloudFront**: CDN
- **Route53**: DNS

#### GCP

```bash
cd infra/terraform/gcp
terraform init
terraform apply -var-file=production.tfvars
```

#### On-Premise

Voir [docs/deployment/on-premise.md](./docs/deployment/on-premise.md)

---

## 🤝 Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines.

### Commit Convention

```
feat(api): add tenant risk prediction endpoint
fix(web): resolve CSRF token refresh issue
docs(readme): update installation steps
test(e2e): add payment flow tests
chore(deps): upgrade NestJS to 10.4.7
```

---

## 📄 License

Proprietary - © 2025 AKIG Corp. Tous droits réservés.

---

## 🆘 Support

- 📧 Email: support@akig.gn
- 💬 Slack: [akig-community.slack.com](https://akig-community.slack.com)
- 📖 Docs: [docs.akig.gn](https://docs.akig.gn)
- 🐛 Issues: [GitHub Issues](https://github.com/akig-corp/akig-v3/issues)

---

## 🙏 Remerciements

- **NestJS Team** - Framework backend extraordinaire
- **Vercel** - Next.js et excellence frontend
- **Prisma** - ORM type-safe révolutionnaire
- **shadcn** - Composants UI de qualité

---

<div align="center">

**Fait avec ❤️ en Guinée 🇬🇳**

[⬆️ Retour en haut](#akig-v30---système-immobilier-hyper-moderne--ia-driven)

</div>
