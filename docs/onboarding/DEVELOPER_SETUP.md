# 🚀 Guide Complet d'Onboarding AKIG

Bienvenue à bord! Ce guide te permettra d'être productif en **2 jours maximum** 💪

## ⏱️ Checklist Onboarding (2 jours)

- [ ] **Jour 1 Matin** (2h): Setup local
- [ ] **Jour 1 Après-midi** (3h): Codebase overview
- [ ] **Jour 2 Matin** (2h): Première PR
- [ ] **Jour 2 Après-midi** (2h): Review et merge

---

## 🎯 Jour 1: Setup et Compréhension

### Matin: Setup Local (2h)

#### 1. Cloner le repository
```bash
git clone https://github.com/ton-org/akig.git
cd akig
```

#### 2. Vérifier les prérequis
```bash
# Docker doit être installé et running
docker --version       # >= 20.10
docker-compose --version  # >= 2.0

# Node.js (optionnel, si tu veux dev sans Docker)
node --version         # >= 18.0
npm --version          # >= 8.0
```

#### 3. Lancer l'infrastructure complète
```bash
# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec tes config (secrets, etc)

# Démarrer tous les services
docker-compose up -d

# Attendre que tout soit stable (~2 min)
docker ps | grep akig
```

#### 4. Vérifier que c'est bon
```bash
# Health check backend
curl http://localhost:4000/api/health

# Health check frontend
curl http://localhost:3000

# Health check Prometheus
curl http://localhost:9090

# Health check Grafana
curl http://localhost:3001
```

✅ **Si tu vois des 200**, c'est bon! Sinon, voir section Troubleshooting

#### 5. Accéder à l'app
- 🖥️ **Frontend**: http://localhost:3000
- 📡 **API**: http://localhost:4000/api
- 📊 **Prometheus**: http://localhost:9090
- 📈 **Grafana**: http://localhost:3001 (admin/admin)

### Après-midi: Codebase Overview (3h)

#### Structure des fichiers
```bash
# Comprendre l'architecture
tree -L 2 backend/src/

# Expected output:
backend/src/
├── app.js                 # Express app config
├── index.js               # Entry point
├── routes/                # 🔴 API endpoints (recouvrement, agents, etc)
├── services/              # 🔵 Business logic (cache, alerts, audit)
├── middleware/            # 🟡 Authentication, authorization, caching
├── utils/                 # 🟢 Helpers et utilities
├── db.js                  # Database config
└── otel.js                # Observability config
```

#### Lire les fichiers clés
```bash
# 1. Comprendre l'architecture générale
cat backend/src/index.js | head -50

# 2. Comprendre le routing
grep -r "router\." backend/src/routes/ | head -20

# 3. Comprendre le caching
cat backend/src/services/cache.service.ts | head -100

# 4. Comprendre l'authentification
cat backend/src/middleware/auth.ts | head -50
```

#### Documentation essentielle à lire (30 min)
1. **ADRs**: `/docs/adr/README.md` (architecture decisions)
2. **Runbooks**: `/ops/runbooks/INCIDENTS.md` (how to handle issues)
3. **API Docs**: `/docs/API.md` (endpoints disponibles)

#### Comprendre les données
```bash
# Lire le schéma BD
grep "CREATE TABLE" backend/db/migrations/*.js | head -20

# Lire les routes recouvrement (ton domaine)
cat backend/src/routes/recouvrement.ts

# Lire les routes agents
cat backend/src/routes/agents.ts
```

---

## 🎯 Jour 2: Contribuer

### Matin: Première PR (2h)

#### Étape 1: Créer une branche feature
```bash
git checkout -b feature/ma-premiere-feature

# Pattern: feature/xxx, fix/xxx, docs/xxx, perf/xxx
```

#### Étape 2: Faire une petite amélioration

**Option 1: Ajouter une API simple** (recommandé pour débuter)
```typescript
// backend/src/routes/agents.ts

/**
 * GET /api/agents/:id/bonus
 * Calculer montant bonus d'un agent
 */
router.get('/:id/bonus', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        score_total,
        CASE 
          WHEN score_total > 1000 THEN score_total * 0.05
          WHEN score_total > 500 THEN score_total * 0.03
          ELSE 0
        END as bonus_montant
      FROM agent_performances
      WHERE agent_id = $1
      GROUP BY agent_id
    `;

    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      bonus: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur bonus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

**Option 2: Ajouter une validation/middleware**
```typescript
// backend/src/middleware/validation.ts

export const validateImpaye = (req, res, next) => {
  const { locataire_id, montant, date_echeance } = req.body;

  if (!locataire_id || !montant || !date_echeance) {
    return res.status(400).json({
      error: 'Champs requis: locataire_id, montant, date_echeance',
    });
  }

  if (montant <= 0) {
    return res.status(400).json({ error: 'Montant doit être positif' });
  }

  next();
};
```

#### Étape 3: Tester localement
```bash
# Test ta route
curl -X GET http://localhost:4000/api/agents/123/bonus

# Vérifier les logs
docker logs akig-backend --tail=20

# Vérifier pas de TypeScript errors
npm run lint --workspace=backend
```

#### Étape 4: Committer et pousser
```bash
git add backend/src/routes/agents.ts
git commit -m "feat: ajouter endpoint bonus agent"
git push origin feature/ma-premiere-feature
```

### Après-midi: Code Review (2h)

#### Créer une Pull Request
1. Va sur: https://github.com/ton-org/akig/pulls
2. Clique: "New Pull Request"
3. Sélectionne ta branche
4. Remplis le template PR:
```markdown
## Description
Ajoute un endpoint pour calculer bonus agents

## Type de changement
- [x] Bug fix
- [ ] Nouvelle feature
- [ ] Documentation
- [ ] Performance

## Testing
- [x] Tests unitaires ajoutés
- [x] Tests manuels effectués
- [ ] Tests E2E couverts

## Checklist
- [x] Code suit les conventions AKIG
- [x] Commentaires ajoutés pour logique complexe
- [x] Pas de console.log() dans le code
- [x] Pas de hardcoded secrets
```

#### Attendre feedback
- Chef de projet: Code review
- Tests: CI/CD validation
- QA: Tests manuels

#### Incorporer le feedback
```bash
# Faire les changes demandés
nano backend/src/routes/agents.ts

# Committer
git add .
git commit -m "fix: adresse feedback review #123"

# Pusher (auto-update PR)
git push origin feature/ma-premiere-feature
```

#### Merge et déploiement
```bash
# Une fois approuvé, merge automatique (GitHub Actions)
# Backend redéploie automatiquement

# Vérifier en production
curl https://akig.app/api/agents/123/bonus
```

---

## 📚 Ressources d'Apprentissage

### Architecture
- 📖 `/docs/adr/README.md` - Architecture decisions
- 📖 `/docs/ARCHITECTURE.md` - Vue globale
- 📖 `/backend/README.md` - Backend specifics

### Code Examples
```bash
# Voir comment les autres ont codé:
grep -r "router.get" backend/src/routes/ | head -5
grep -r "async.*req.*res" backend/src/routes/ | head -5

# Copier les patterns:
# 1. Authentification
# 2. Validation
# 3. Error handling
# 4. Cache invalidation
# 5. Logging
```

### Patterns Courants

#### 1. Route avec cache
```typescript
router.get('/data', async (req, res) => {
  const cacheKey = 'my-cache-key';
  
  // Vérifier cache
  let data = await CacheService.get(cacheKey);
  if (data) return res.json(data);

  // Requête BD
  const result = await pool.query('SELECT ...');
  data = result.rows;

  // Stocker cache
  await CacheService.set(cacheKey, data, 300); // 5 min

  res.json(data);
});
```

#### 2. Route avec validation
```typescript
router.post('/action', validateInput, async (req, res) => {
  const { id, montant } = req.body;

  if (montant <= 0) {
    return res.status(400).json({ error: 'Invalid' });
  }

  // Logic...
});
```

#### 3. Route avec audit
```typescript
router.post('/important-action', async (req, res) => {
  // Logic...

  // Log audit
  await AuditService.log({
    user_id: req.user.id,
    action: 'created_mission',
    resource: mission_id,
    details: { /* changes */ },
  });

  res.json({ success: true });
});
```

### Common Errors et Solutions

```bash
# ❌ Error: "ECONNREFUSED" (BD indisponible)
# ✅ Solution: docker restart akig-db

# ❌ Error: "Cannot find module" 
# ✅ Solution: npm install, rebuild Docker

# ❌ Error: "Timeout" sur requête
# ✅ Solution: Ajouter index BD, voir runbook perf

# ❌ Error: "Unauthorized" sur endpoint
# ✅ Solution: Vérifier token JWT, vérifier permissions RBAC

# ❌ Error: "Cache inconsistency"
# ✅ Solution: docker exec akig-cache redis-cli FLUSHDB
```

---

## 🆘 Besoin d'Aide?

### Contactez:
- **Questions Technique**: Slack #dev-akig
- **Problème Infrastructure**: Slack #ops-alerts
- **Clarification Business**: Slack #product

### Docs Utiles:
1. [Architecture Decision Records](/docs/adr/)
2. [API Documentation](/docs/API.md)
3. [Database Schema](/backend/db/schema.md)
4. [Incident Runbooks](/ops/runbooks/)

### Commit Message Template
```
<type>(<scope>): <subject>

<body>

<footer>

Examples:
feat(recouvrement): ajouter endpoint missions jour
fix(cache): invalider permissions après update
docs(onboarding): clarifier setup process
perf(db): ajouter index impayés par site
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore
**Scopes**: recouvrement, agents, dashboard, cache, db, etc

---

## ✅ Signaux que tu es prêt!

- ✅ Tu peux cloner et lancer AKIG localement
- ✅ Tu comprends la structure des routes
- ✅ Tu peux lire et écrire des requêtes SQL simples
- ✅ Tu as fait ta première PR approuvée
- ✅ Tu sais où trouver les docs quand tu es bloqué

🎉 **Félicitations! Tu es maintenant développeur AKIG!**

Prochaines étapes:
1. Prendre un ticket facile du backlog
2. L'assigner à toi-même
3. Créer une branche feature
4. Faire une PR avant la fin du jour
5. Fêter ton premier merge! 🚀

---

**Dernière mis à jour**: 26 Octobre 2025
**Questions?** Demande en Slack dans #dev-akig
