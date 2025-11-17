# ADR-001: Utiliser PostgreSQL comme Base de Données Primaire

**Date**: 26 Octobre 2025
**Status**: ✅ Accepté
**Context**: Besoin de choisir une BD pour AKIG (système de recouvrement avec données financières)

## Décision
Utiliser **PostgreSQL 14+** comme base de données primaire

## Justification
- ✅ **Conformité ACID**: Transactions sûres pour données financières
- ✅ **Features avancées**: JSONB, full-text search, array types
- ✅ **Performances**: Indexes avancés, partitioning
- ✅ **Audit trail**: Native avec triggers
- ✅ **Open source**: Pas de coûts de license

## Alternatives Rejetées
- ❌ **MongoDB**: Données financières nécessitent transactions ACID
- ❌ **MySQL**: Features moins avancées
- ❌ **SQLite**: Pas adapté à la scalabilité production

## Conséquences
- ✅ Migrations SQL strictes required
- ✅ Indexing strategy critique
- ✅ Backups automatisés requis
- ✅ Connection pooling nécessaire (pg-pool)

---

# ADR-002: Cache Distribué avec Redis

**Date**: 26 Octobre 2025
**Status**: ✅ Accepté
**Context**: Performance des données fréquemment lues (permissions, missions, scores)

## Décision
Utiliser **Redis 7+** pour caching distribué

## Implémentation
```
- Permissions utilisateur: TTL 5 min
- Missions agents: TTL 5 min
- Performances/scores: TTL 1h
- Sites/locataires: TTL 30 min
- Bons payeurs: TTL 1h
- Classements: TTL 1h
```

## Stratégies d'Invalidation
- **Write-through**: Invalider immédiatement après modification
- **Time-based**: Expiration TTL automatique
- **Pattern-based**: Invalidation par wildcard

## Conséquences
- ✅ 3-5x plus rapide pour requêtes répétées
- ✅ Réduction charge BD 60-70%
- ⚠️ Nécessite gestion invalidation cache
- ⚠️ Failover redis à gérer

---

# ADR-003: Stratégie RBAC (Role-Based Access Control)

**Date**: 26 Octobre 2025
**Status**: ✅ Accepté
**Context**: Sécurité et isolation des données par rôle utilisateur

## Rôles Définis
```
1. admin: Accès total, configuration système
2. pdg: Vue d'ensemble, rapports, alertes
3. chef_equipe: Assignation missions, suivi agents, validation
4. secretaire: Saisie appels/promesses, tracking recouvrement
5. agent: Exécution missions, saisie terrain, géolocalisation
6. proprietaire: Vue sites/impayés (leurs propriétés seulement)
```

## Permissions Associées
- `manage_missions`: Chef équipe seulement
- `view_performance`: Chef équipe + PDG
- `modify_impaye`: Admin + Chef équipe
- `assign_agents`: Chef équipe
- `export_data`: Secrétaire + PDG
- `manage_users`: Admin seulement

## Implémentation
```typescript
@authorize('chef_equipe', 'admin')
router.post('/missions/assigner', ...)
```

---

# ADR-004: Architecture Microservices vs Monolithe

**Date**: 26 Octobre 2025
**Status**: ✅ Monolithe (Phase 1)
**Context**: Structurer l'application pour scalabilité

## Décision - Phase 1: Monolithe modulaire
- Backend Express.js unique
- Routes organisées par domaine
- Services découplés (cache, audit, alerts)
- Prêt pour extraction microservices future

## Architecture
```
Backend Monolithique (scalable horizontalement)
├── Routes: recouvrement, agents, dashboard, carte
├── Services: cache, alerts, audit, email
├── Middleware: auth, rbac, caching, validation
└── Database: PostgreSQL partagée

Frontend: React SPA + PWA
├── Zustand state management
├── Lazy loading par route
└── Service Worker offline
```

## Phase 2 Potentielle: Microservices
Si scalabilité requise:
- Service Recouvrement (missions, actions)
- Service Agents (performance, classement)
- Service Notifications (email, SMS, webhooks)
- Service Analytics (rapports, ML)

---

# ADR-005: Monitoring et Observabilité

**Date**: 26 Octobre 2025
**Status**: ✅ Accepté
**Context**: Visibility en production, alertes proactives

## Stack Monitoring
```
OpenTelemetry (instrumentation)
    ↓
Prometheus (metrics collection)
    ↓
Grafana (visualization)
    ↓
AlertManager (alerting)
    ↓
Email/Slack/SMS
```

## Métriques Critiques à Tracker
**Business Metrics**:
- Impayés par site/agent
- Taux de recouvrement
- Montant recouvre par jour
- Promesses honorées vs non-honorées
- Performance agents (score)
- Taux de ponctualité paiements

**Technical Metrics**:
- Response time (p50, p95, p99)
- Database query time
- Cache hit rate
- Error rate
- Throughput (req/sec)
- Memory usage
- CPU usage
- Disk space

## Alertes Critiques
```
🔴 CRITICAL:
- Backend Down
- Database Down
- Impayés > 60j (>50)
- Cash flow negative

⚠️ WARNING:
- Response time > 1s (p95)
- Error rate > 5%
- Memory > 85%
- Promesses non-honorées > 10
```

---

# ADR-006: Tests et QA

**Date**: 26 Octobre 2025
**Status**: 📋 En cours
**Context**: Zéro bugs, confiance déploiement

## Stratégie Multi-niveaux
```
Unit Tests (Jest)
├── Services: auditService, cacheService, etc
├── Utilities: pagination, validation
└── Coverage target: 80%

Integration Tests (Supertest)
├── API endpoints
├── Database interactions
├── Cache invalidation
└── Coverage target: 70%

E2E Tests (Playwright)
├── User workflows complets
├── Recouvrement flow
├── Performance scenarios
└── Load testing

Performance Tests
├── Response time < 200ms (p95)
├── Database queries < 100ms (p95)
├── Cache hit rate > 80%

Security Tests
├── OWASP Top 10
├── SQL injection prevention
├── XSS protection
├── CSRF tokens
```

## CI/CD Pipeline
```
Git Push
  ↓
Lint (ESLint, Prettier)
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Security Scan (Snyk)
  ↓
E2E Tests (Playwright)
  ↓
Build Docker
  ↓
Push Registry
  ↓
Deploy Staging
  ↓
Smoke Tests
  ↓
Performance Tests
  ↓
Deploy Production (Blue-Green)
```

---

# ADR-007: Sécurité des Données Sensibles

**Date**: 26 Octobre 2025
**Status**: ✅ Accepté
**Context**: Protection données financières et personnelles

## Stratégie Sécurité Multicouches

### 1. Transport
- HTTPS/TLS 1.3 obligatoire
- HSTS headers
- CSP headers
- Certificate pinning

### 2. Application
- JWT 24h expiration
- Refresh tokens (7j)
- 2FA avec TOTP
- Rate limiting par endpoint

### 3. Database
- Encryption at rest (pgcrypto)
- Sensitive fields encrypted
- Row-level security (RLS)
- Audit trail complet

### 4. Secrets
- HashiCorp Vault pour staging/prod
- GitHub Secrets pour CI/CD
- Rotation automatique (90j)
- Never log secrets

## Compliance
- ✅ GDPR (droit oubli, export données)
- ✅ SOC2 (audit trail, access control)
- ✅ PCI DSS patterns (paiements)
- ✅ OWASP Top 10 protection

---

# ADR-008: Déploiement et Infrastructure

**Date**: 26 Octobre 2025
**Status**: 📋 Kubernetes Ready
**Context**: Zero-downtime deployments, scalability

## Phases Déploiement

### Phase 1: Docker + Docker Compose (Dev)
✅ Local development
✅ Full stack avec PostgreSQL, Redis, Nginx

### Phase 2: Kubernetes (Staging)
📋 High availability
📋 Auto-scaling
📋 Blue-green deployments

### Phase 3: Managed K8s (Production)
📋 AWS EKS / GCP GKE / Azure AKS
📋 Multi-region replication
📋 Disaster recovery

## Stratégie Déploiement Production
```
Blue-Green Deployment:
- V1 (Blue) en production
- V2 (Green) déployée parallèlement
- Tests complets sur Green
- Switch traffic instantané
- Rollback en <30s si problème

Canary Deployment (optionnel):
- V2 reçoit 10% traffic
- Monitor metrics pendant 5min
- Si OK → 100%, sinon rollback
```

---

**Prochaines ADRs à définir:**
- ADR-009: Mobile app strategy (React Native)
- ADR-010: API versioning et deprecation
- ADR-011: Machine learning pour predictions
- ADR-012: Global data replication strategy
