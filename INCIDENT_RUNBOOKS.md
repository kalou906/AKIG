# 🚨 AKIG - Runbooks Incidents Production

## Vue d'ensemble
Ce document définit les procédures d'escalade pour les incidents critiques affectant AKIG. Chaque runbook suit le modèle: **Détecter → Analyser → Mitiger → Résoudre → Communiquer**.

---

## 📋 Table des Matières
1. [Incidents Critiques (P1)](#p1-incidents-critiques)
2. [Incidents Majeurs (P2)](#p2-incidents-majeurs)
3. [Incidents Mineurs (P3)](#p3-incidents-mineurs)
4. [Checklist Post-Incident](#post-incident)

---

## P1: INCIDENTS CRITIQUES
**SLA: Réponse <5 min | Résolution <30 min**

### 🔴 RB-P1-001: Bug Critique (Blocker Utilisateur)

#### Symptômes
- Utilisateurs signalent impossibilité accéder page clé (Dashboard, Contrats, Paiements)
- "Page blanche" ou erreur 500 partout
- Taux erreur > 10% en 5 min

#### Escalade (Immédiate)
1. **0 min**: Notifier Slack #akig-incidents + SMS escalade manager
2. **2 min**: Vérifier backend santé (health check `GET /api/health`)
3. **3 min**: Vérifier logs serveur (dernière heure)

#### Mitigation (Rapide)
```bash
# Étape 1: Diagnostiquer rapidement
curl http://localhost:4000/api/health

# Étape 2: Si backend KO - restart
pm2 restart akig-backend
# OU via systemctl
systemctl restart akig-backend

# Étape 3: Si frontend KO - rebuild
cd frontend
npm run build
pm2 restart akig-frontend

# Étape 4: Si base de données - failover (voir RB-P1-003)
```

#### Résolution
- **Si compilation error**: Revert dernier commit → rebuild → redeploy
- **Si API timeout**: Augmenter timeout + redémarrer
- **Si Database**: Basculer vers replica (RTO <5 min)

#### Communication
```
[INCIDENT ALERT - 10:23 UTC]
🚨 AKIG Dashboard inaccessible (14:23-14:29 UTC)
Impact: 143 utilisateurs affectés (5% du trafic)
Cause: Memory leak bug en chargeant paiements
Status: RÉSOLU - Services restaurés
Root cause analysis: Demain 14h
```

---

### 🔴 RB-P1-002: Authentification Cassée

#### Symptômes
- Tous utilisateurs rejetés à /login (401 partout)
- "Invalid token" même avec credentials correctes
- Impossible créer compte

#### Escalade
1. Notifier escalade P1 immédiate
2. Vérifier secret JWT (`.env` -> `JWT_SECRET` pas changé?)
3. Vérifier tokens expirés (redis cleared? database?)

#### Mitigation
```bash
# Étape 1: Vérifier secret JWT
echo $JWT_SECRET

# Étape 2: Vérifier tokens en DB
psql -U postgres -d akig_db -c "SELECT COUNT(*) FROM users WHERE token IS NULL"

# Étape 3: Si secret changé accidentellement - revert
# Voir env.production backup

# Étape 4: Si DB corrompue - restore dump
pg_restore -d akig_db latest_backup.dump

# Étape 5: Nettoyer cache/redis
redis-cli FLUSHDB
```

#### Résolution
- Vérifier JWT_SECRET en production vs staging
- Examiner logs d'auth (dernier 1h)
- Redéployer si nécessaire avec bon secret

---

### 🔴 RB-P1-003: Base de Données Indisponible

#### Symptômes
- API retourne 503 "Database connection failed"
- Logs: `ECONNREFUSED :5432` ou `pool timeout`
- Tous endpoints API affectés sauf health

#### Escalade
1. **0 min**: Notifier DBA
2. **1 min**: Vérifier connectivité: `psql -U postgres -d akig_db`
3. **2 min**: Initier basculement vers replica

#### Mitigation
```bash
# Étape 1: Vérifier DB status
psql -U postgres -d akig_db -c "SELECT version();"

# Étape 2: Si DB down - redémarrer
systemctl restart postgresql

# Étape 3: Si problème persiste - basculement
# Mettre à jour CONNECTION_STRING vers replica
export DATABASE_URL="postgresql://user:pass@replica-db:5432/akig_db"
pm2 restart akig-backend

# Étape 4: Mettre en mode read-only temporaire
# Afficher aux utilisateurs: "Maintenance en cours - pas d'écritures"
```

#### Résolution
- Examiner logs PostgreSQL
- Checker espace disque / RAM / connexions
- Restore depuis backup si corruption détectée
- **RTO Target: <30 min | RPO Target: ≤5 min**

---

## P2: INCIDENTS MAJEURS
**SLA: Réponse <15 min | Résolution <4h**

### 🟠 RB-P2-001: Performance Dégradée (API Lent)

#### Symptômes
- API response time > 5s (vs normal <300ms)
- Taux d'erreur timeout > 5%
- Utilisateurs signalent "application gelée"

#### Diagnostic
```bash
# Check CPU/Memory
top -n 1 | grep node

# Check database queries (slow log)
tail -100 /var/log/postgresql/postgresql.log | grep duration

# Check network
netstat -an | grep ESTABLISHED | wc -l

# Profile API endpoint
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4000/api/contracts
```

#### Mitigation
1. **Immediate**: Redémarrer backend workers
   ```bash
   pm2 restart akig-backend --force
   ```

2. **Short-term**: Escalade requêtes lentes
   ```sql
   -- Identifier requêtes lentes en DB
   SELECT * FROM pg_stat_statements 
   WHERE mean_exec_time > 1000 
   ORDER BY mean_exec_time DESC LIMIT 10;
   ```

3. **Cache**: Activer/augmenter Redis cache
   ```bash
   redis-cli CONFIG GET maxmemory
   ```

#### Résolution
- Analyser slow queries, ajouter indexes si nécessaire
- Vérifier N+1 queries en API
- Augmenter poolsize database

---

### 🟠 RB-P2-002: Fuite Mémoire (Memory Leak)

#### Symptômes
- Node process consomme 100%+ RAM
- Redémarrages fréquents nécessaires
- "OutOfMemory" errors en logs

#### Diagnostic
```bash
# Monitor mémoire en temps réel
watch -n 1 'ps aux | grep node | grep -v grep'

# Dump heap
node --inspect backend/src/index.js
# Puis dans Chrome DevTools: localhost:9229

# Check pour boucles infinies
grep -r "while.*true" src/ --include="*.js"
```

#### Mitigation
1. Redémarrer backend (gains 5-6h temps avant next leak)
2. Identifier page/feature déclenchant leak
3. Vérifier addEventListener sans cleanup
4. Checker boucles promises non-fermées

#### Résolution
- Ajouter heap monitoring (avec Alert si > 600MB)
- Fix source code du leak
- Redeploy avec fix

---

### 🟠 RB-P2-003: SMS/Email Outage

#### Symptômes
- Utilisateurs ne reçoivent pas rappels SMS/Email
- Préavis pas envoyés (P1!)
- Queue en attente: 1000+ messages non-envoyés

#### Escalade
1. Vérifier provider status (Twilio/SendGrid)
2. Vérifier credentials/API keys valides
3. Notifier utilisateurs (maintenance message)

#### Mitigation
```bash
# Étape 1: Vérifier queue
psql -U postgres -d akig_db -c "SELECT COUNT(*) FROM notification_queue WHERE status='pending'"

# Étape 2: Vérifier credentials
echo "SMS Provider: $TWILIO_ACCOUNT_SID"
echo "Email Provider: $SENDGRID_API_KEY"

# Étape 3: Test manuel
curl -X POST http://localhost:4000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"type":"sms","phone":"+33612345678"}'

# Étape 4: Si provider down - fallback
# Alterner vers Email pour notifications critiques (préavis)
```

#### Résolution
- Si provider down: attendre restore + rejouer queue
- Si credentials expiré: mettre à jour .env + redeploy
- Si quota atteint: adapter rate limiting

#### Fallback Strategy
| Primary | Fallback 1 | Fallback 2 |
|---------|-----------|-----------|
| SMS (Twilio) | Email (SendGrid) | Push notification |
| Email (SendGrid) | SMS (Twilio) | Dashboard message |
| Préavis critical | Appel téléphonique | Recommandé postal |

---

## P3: INCIDENTS MINEURS
**SLA: Réponse <1h | Résolution <1 jour**

### 🟡 RB-P3-001: Bugs Mineurs (UI/UX)

#### Exemples
- Bouton mal aligné
- Erreur typo dans message
- Icône manquante
- Sort colonne bugué

#### Process
1. Créer ticket avec repro steps
2. Fix en branche feature
3. Test localement + staging
4. Merger vers main
5. Redeploy via CI/CD normal

#### Résolution Timeline
- Simple fix: <4h
- Plus complexe: <1 jour (incluant tests)

---

### 🟡 RB-P3-002: Feature Dégradée (Partial)

#### Exemples
- Export PDF bugué pour certains bails
- Filtre rapport pas fonctionnel
- Pagination page 2+ cassée

#### Process
1. Reproduire le bug précisément
2. Identifier si affecte _tous_ utilisateurs ou subset
3. Si subset: créer workaround pour autres
4. Fix en priority normal
5. Test avant merge

---

## 📋 POST-INCIDENT CHECKLIST

### Immédiat (< 30 min après résolution)
- [ ] Notification résolue → Slack + Email users
- [ ] Logs archivés pour analyse
- [ ] Incident créé dans tracking system
- [ ] RCA (Root Cause Analysis) commencée

### Court-terme (< 24h)
- [ ] RCA complétée et documentée
- [ ] Fix codé + tested
- [ ] Fix mergé vers main
- [ ] Fix déployé en production
- [ ] Alerte monitoring mise en place (pour récurrence)

### Moyen-terme (< 1 semaine)
- [ ] Post-mortem interne (si P1)
- [ ] Runbook mis à jour si applicable
- [ ] Tests ajoutés pour prévenir récurrence
- [ ] Documentation client publiée (lessons learned)
- [ ] Training team si nécessaire

### Suivi
```markdown
## Incident Report: [ID]

**When**: 2025-11-05 14:23-14:29 UTC (6 min total)
**Severity**: P1 - Dashboard inaccessible
**Impact**: 143 utilisateurs, $X revenue impact

**Root Cause**: Memory leak en chargeant paiements (N+1 queries)
**Fix**: Ajouter eager loading relation + indexing

**Prevention**: 
- [ ] Monitoring mémoire en temps réel
- [ ] Load tests reguliers (simulate 1000+ users)
- [ ] Query profiling CI/CD gate

**Cost**: 
- Dev time: 4h (debug + fix)
- Infrastructure: $50 emergency scaling
- Lost productivity: ~2h

**Next steps**: 
- Performance audit week of 2025-11-12
- Increase monitoring granularity
```

---

## 🚀 ESCALADE CONTACTS

### Tier 1 (Response <5 min)
- **Slack**: #akig-incidents
- **SMS Alert**: +33 6 XX XX XX XX (On-call engineer)

### Tier 2 (Response <15 min)
- **Manager**: manager@akig.com
- **CTO**: cto@akig.com

### Tier 3 (Response <1h)
- **CEO**: ceo@akig.com
- **Legal**: legal@akig.com (si data breach)

---

## 📊 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| P1 Resolution Time | <30 min | - |
| P2 Resolution Time | <4h | - |
| P3 Resolution Time | <24h | - |
| Uptime Target | 99.9% | - |
| MTTR (Mean Time To Recover) | <15 min | - |
| MTTF (Mean Time To Failure) | >720h | - |

---

## Version
- **v1.0**: 2025-11-05
- Updated: [AUTO by AI]
- Owner: Engineering Team
