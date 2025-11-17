# 🚀 CUTOVER PLAYBOOK - MIGRATION POSTGRESQL PRODUCTION

**Objectif:** Guide d'exécution étape par étape pour le cutover MySQL → PostgreSQL  
**Temps total:** 10-15 minutes  
**Rollback time:** < 60 secondes  
**Niveau requis:** GOLD ✅

---

## 📋 PRÉ-REQUIS (VÉRIFIER AVANT TOUTE CHOSE)

```powershell
# 1. Vérifier que vous êtes GOLD
Get-Content "C:\AKIG\scripts\final-certification.ps1" | Select-String "GOLD"

# 2. Vérifier PostgreSQL accessible
psql -h localhost -U postgres -d akig_immobilier -c "SELECT version();"

# 3. Vérifier MySQL accessible
mysql -h localhost -u root -pakig2025 akig_legacy -e "SELECT VERSION();"

# 4. Vérifier backend existe
Test-Path "C:\AKIG\backend\src\db.js"
```

**Tous les tests passent?** OUI ☐ → Continuer | NON ☐ → STOP, corriger d'abord

---

## ⚙️ PHASE 0: PRÉPARATION (T-30min)

### 0.1 - Ouvrir war room (si équipe distribuée)
```
- Ouvrir Zoom/Teams/Slack channel
- Confirmer présence: DBA, DevOps, App Owner
- Partager ce document en screen share
```

### 0.2 - Tester le plan de rollback (DRY-RUN)
```powershell
# Simuler rollback (0 changements réels)
powershell -ExecutionPolicy Bypass -File "C:\AKIG\scripts\emergency-rollback.ps1" -WhatIf
```

**Résultat attendu:** Script s'exécute sans erreur  
**Temps:** 30 secondes  
**Action si échec:** Corriger script rollback AVANT d'aller plus loin

### 0.3 - Tester le cutover (DRY-RUN)
```powershell
# Simuler cutover complet (0 changements réels)
powershell -ExecutionPolicy Bypass -File "C:\AKIG\scripts\final-cutover.ps1" -DryRun
```

**Résultat attendu:** Toutes les phases PASSED (simulations)  
**Temps:** 2-3 minutes  
**Action si échec:** NO-GO, analyser erreurs

### 0.4 - Capturer baseline métier
```powershell
# Dernières stats MySQL avant cutover
mysql -u root -pakig2025 akig_legacy -e "SELECT COUNT(*) FROM historique;" > C:\AKIG\backups\mysql_final_count.txt
mysql -u root -pakig2025 akig_legacy -e "SHOW TABLE STATUS;" > C:\AKIG\backups\mysql_final_status.txt
```

### 0.5 - Informer stakeholders (email/Slack)
```
Objet: [CUTOVER] Migration PostgreSQL - DÉMARRAGE

Bonjour,

Le cutover MySQL → PostgreSQL démarre maintenant.

Fenêtre: [HEURE DÉBUT] - [HEURE FIN ESTIMÉE]
Downtime attendu: 0 minutes (zero-downtime)
Impact users: Aucun (si succès)

Équipe mobilisée:
- Lead: [NOM] ([TÉL])
- DBA: [NOM] ([TÉL])
- DevOps: [NOM] ([TÉL])

War room: [LIEN ZOOM/TEAMS]

Updates toutes les 15 minutes.
```

---

## 🎬 PHASE 1: EXÉCUTION CUTOVER (T=0)

### 1.1 - Lancer script cutover RÉEL
```powershell
# ⚠️ POINT DE NON-RETOUR (après confirmation)
powershell -ExecutionPolicy Bypass -File "C:\AKIG\scripts\final-cutover.ps1"
```

**Le script va demander 2 confirmations:**
1. **MySQL READ-ONLY** → Tapez `GO` pour confirmer
2. **Switch backend** → Automatique (ou confirmation selon config)

### 1.2 - Surveiller output en temps réel
```
Attendu:
  [00:00] [PHASE 0] PRÉPARATION & VALIDATION
    ✅ PostgreSQL accessible
    ✅ MySQL accessible
    ✅ Checksums VALID
  
  [00:15] [PHASE 1] CAPTURE BASELINE MÉTRIQUES
    ✅ PostgreSQL stats reset
    ✅ MySQL baseline captured
  
  [00:30] [PHASE 2] MYSQL PASSAGE EN READ-ONLY
    ⚠️  Confirmation requise → TAPEZ "GO"
    ✅ MySQL READ-ONLY confirmé
  
  [01:00] [PHASE 3] VÉRIFICATION DELTA FINAL
    ✅ Aucun delta détecté
  
  [02:00] [PHASE 4] BACKUP FINAL PRÉ-CUTOVER
    ✅ Backup créé: 3.xx MB
  
  [02:30] [PHASE 5] SWITCH APPLICATION VERS POSTGRESQL
    ✅ DATABASE_URL updated
  
  [03:00] [PHASE 6] VALIDATION CONNEXION APPLICATIVE
    ✅ Connexion PostgreSQL OK
  
  [03:30] [PHASE 7] TESTS END-TO-END CRITIQUES
    ✅ Lecture OK
    ✅ Écriture OK
    ✅ Requête métier OK
  
  [04:00] [PHASE 8] MONITORING ACTIVATION
    ✅ pg_stat_statements actif
  
  [04:30] [PHASE 9] MYSQL DÉCOMMISSION
    ✅ MySQL READ-ONLY (conservé)
  
  [05:00] [FINAL] RAPPORT DE CUTOVER
    ✅ CUTOVER SUCCESSFUL
```

### 1.3 - Si erreur → Rollback automatique
```
Le script détecte automatiquement:
  - Erreur critique → $Global:RollbackRequired = $true
  - À la fin: affiche "❌ CUTOVER FAILED - ROLLBACK REQUIS"

Action: Exécuter immédiatement emergency-rollback.ps1
```

---

## ✅ PHASE 2: VALIDATION IMMÉDIATE (T+5min)

### 2.1 - Vérifier backend se connecte à PostgreSQL
```powershell
# Vérifier .env
Get-Content "C:\AKIG\backend\.env" | Select-String "DATABASE_URL"

# Résultat attendu:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/akig_immobilier
```

### 2.2 - Tester connexion backend (si Node.js)
```powershell
cd C:\AKIG\backend

# Option 1: Test rapide
node -e "const pool = require('./src/db'); pool.query('SELECT now()').then(r => console.log('✅ Backend → PostgreSQL OK:', r.rows[0]));"

# Option 2: Démarrer backend complet
npm start
# Attendre: "Server running on port 4000"
# Test: http://localhost:4000/api/health
```

**Résultat attendu:** Backend démarre sans erreur  
**Action si échec:** ROLLBACK immédiat

### 2.3 - Tests end-to-end métier CRITIQUES
```sql
-- Test 1: Dashboard principal (< 100ms)
\timing on
SELECT DATE(date) as day, COUNT(*) as actions 
FROM audit_logs 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY 1 
ORDER BY 1 DESC;

-- Résultat attendu: ~7 lignes, temps < 100ms

-- Test 2: Recherche utilisateur (doit utiliser index)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM audit_logs 
WHERE locataire_id = 1 
ORDER BY date DESC LIMIT 10;

-- Résultat attendu: "Index Scan using idx_audit_logs_locataire"

-- Test 3: Rapport disbursements (exact)
SELECT 
    COUNT(*) as total,
    SUM(montant) as total_amount,
    MAX(date_paiement) as dernier
FROM disbursements;

-- Résultat attendu: 211 lignes, somme exacte, date récente
```

### 2.4 - Vérifier monitoring actif
```sql
-- Connexions actives
SELECT state, COUNT(*) 
FROM pg_stat_activity 
WHERE datname = 'akig_immobilier'
GROUP BY state;

-- Top queries (depuis cutover)
SELECT 
    calls,
    ROUND(mean_exec_time::numeric, 2) as avg_ms,
    LEFT(query, 50) as query
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 5;
```

---

## 🔍 PHASE 3: SURVEILLANCE ACTIVE (T+5min → T+60min)

### 3.1 - Monitoring continu (première heure)
```powershell
# Terminal 1: Watch PostgreSQL connections
while ($true) {
    Clear-Host
    Write-Host "=== PostgreSQL Live Monitor ===" -ForegroundColor Cyan
    Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')`n"
    
    $env:PGPASSWORD = "postgres"
    psql -h localhost -U postgres -d akig_immobilier -c "SELECT state, COUNT(*) FROM pg_stat_activity WHERE datname = 'akig_immobilier' GROUP BY state;"
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 5
}
```

```powershell
# Terminal 2: Watch backend logs (si logs disponibles)
Get-Content "C:\AKIG\backend\logs\app.log" -Wait -Tail 20
```

### 3.2 - Checklist surveillance (cocher toutes les 15min)

**T+15min:**
- [ ] Backend actif sans erreurs
- [ ] Aucune alerte PostgreSQL
- [ ] Connexions stables (< 80% max_connections)
- [ ] Aucun user complaint

**T+30min:**
- [ ] Backend actif sans erreurs
- [ ] Queries rapides (< 100ms avg)
- [ ] Dead tuples = 0%
- [ ] Aucun user complaint

**T+45min:**
- [ ] Backend actif sans erreurs
- [ ] Monitoring stable
- [ ] Index utilisés correctement
- [ ] Aucun user complaint

**T+60min:**
- [ ] Backend actif sans erreurs
- [ ] Pas de slow queries
- [ ] Pas de deadlocks
- [ ] **VALIDATION H+1 COMPLÈTE** ✅

### 3.3 - Informer stakeholders (updates toutes les 15min)
```
T+15min: ✅ Cutover réussi - Backend PostgreSQL actif
T+30min: ✅ Système stable - Aucun incident
T+45min: ✅ Monitoring nominal - Performance OK
T+60min: ✅ Validation H+1 complète - SUCCÈS CONFIRMÉ
```

---

## 🏆 PHASE 4: VALIDATION 24H (PLATINUM)

### 4.1 - À J+1 (24h après cutover)
```powershell
# Générer rapport PLATINUM automatique
powershell -ExecutionPolicy Bypass -File "C:\AKIG\scripts\24h-post-migration-report.ps1"

# Le script va:
#   1. Vérifier checksums (doivent matcher GOLD)
#   2. Analyser performance (queries, index, bloat)
#   3. Détecter incidents (deadlocks, rollbacks, erreurs)
#   4. Calculer score PLATINUM (0-100%)
#   5. Afficher verdict: PLATINUM accordé ou refusé
```

**Critères PLATINUM (6/6 requis):**
- [ ] Checksums GOLD valides (pas de corruption)
- [ ] Uptime > 23h (pas de crash)
- [ ] Aucune query lente critique (> 500ms)
- [ ] Index utilisés correctement (idx_scan > 0)
- [ ] Dead tuples < 5% (pas de bloat)
- [ ] Aucun incident majeur (0 deadlocks, 0 conflicts)

**Score attendu:** 100% → PLATINUM ✅

### 4.2 - Si PLATINUM accordé
```
Actions:
  ✅ Célébrer (sérieusement, vous l'avez mérité!)
  ✅ Archiver MySQL (dump final puis stop)
  ✅ Mettre à jour documentation (runbooks, onboarding)
  ✅ Planifier niveau DIAMOND (PITR + chaos engineering)
```

### 4.3 - Si PLATINUM refusé (< 100%)
```
Actions:
  1. Analyser rapport détaillé (24h-post-migration-report.txt)
  2. Identifier critères en échec
  3. Corriger problèmes (queries lentes, bloat, etc.)
  4. Attendre 24h supplémentaires
  5. Re-générer rapport PLATINUM
```

---

## 🔥 PLAN D'URGENCE (SI PROBLÈME)

### Scenario 1: Backend ne démarre pas
```powershell
# Symptôme: npm start → erreur connexion PostgreSQL

# Action 1: Vérifier .env
Get-Content "C:\AKIG\backend\.env" | Select-String "DATABASE_URL"

# Action 2: Tester connexion directe
psql -h localhost -U postgres -d akig_immobilier -c "SELECT 1;"

# Action 3: Si PostgreSQL OK mais backend KO → problème code
# → ROLLBACK immédiat
powershell -ExecutionPolicy Bypass -File "C:\AKIG\scripts\emergency-rollback.ps1"
```

### Scenario 2: Queries très lentes (> 1 seconde)
```sql
-- Diagnostique
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM audit_logs WHERE date > '2025-01-01';

-- Si "Seq Scan" au lieu de "Index Scan":
-- → Index manquant ou non utilisé

-- Action:
VACUUM ANALYZE audit_logs;

-- Vérifier index existe:
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'audit_logs';
```

### Scenario 3: Connexions épuisées
```sql
-- Symptôme: FATAL: sorry, too many clients already

-- Diagnostique:
SELECT COUNT(*) as current, 
       (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max
FROM pg_stat_activity;

-- Si current ≈ max:
-- Option 1: Killer connexions idle
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
  AND state_change < now() - interval '5 minutes';

-- Option 2: Augmenter max_connections (nécessite restart)
-- → Si critique: ROLLBACK recommandé
```

### Scenario 4: Users rapportent erreurs
```
Protocole:
  1. STOP - ne pas paniquer
  2. Capturer logs backend + PostgreSQL
  3. Identifier pattern (tous users? fonction spécifique?)
  4. Si impact > 50% users → ROLLBACK immédiat
  5. Si impact < 50% users → Analyser + fix ou ROLLBACK
```

### Scenario 5: Décision ROLLBACK
```powershell
# ONE COMMAND - AUCUNE HÉSITATION
powershell -ExecutionPolicy Bypass -File "C:\AKIG\scripts\emergency-rollback.ps1"

# Le script va:
#   1. Backup PostgreSQL (forensics)
#   2. Restaurer config backend → MySQL
#   3. Désactiver MySQL READ-ONLY
#   4. Valider connexion MySQL
#   5. Générer rapport incident
#   6. Temps total: < 60 secondes

# Après rollback:
#   - Analyser forensics
#   - Corriger problème
#   - Re-tester en dry-run
#   - Nouvelle tentative cutover (si corrigé)
```

---

## 📊 CHECKLIST FINALE (COPIER-COLLER DANS CHAT)

```
=== CUTOVER EXECUTION CHECKLIST ===

PRÉ-CUTOVER:
[ ] Équipe mobilisée (DBA, DevOps, App Owner)
[ ] War room ouverte (Zoom/Teams/Slack)
[ ] Plan rollback testé (dry-run OK)
[ ] Cutover testé (dry-run OK)
[ ] Stakeholders informés (email envoyé)

CUTOVER:
[ ] Script lancé: final-cutover.ps1
[ ] Confirmation MySQL READ-ONLY → "GO"
[ ] Toutes les phases PASSED
[ ] Rapport final: CUTOVER SUCCESSFUL
[ ] Temps total: ____ minutes

VALIDATION IMMÉDIATE:
[ ] Backend démarre sans erreur
[ ] Tests end-to-end métier OK (3/3)
[ ] Monitoring actif (pg_stat_statements)
[ ] Aucune alerte critique

SURVEILLANCE H+1:
[ ] T+15min: ✅ Système stable
[ ] T+30min: ✅ Performance OK
[ ] T+45min: ✅ Aucun incident
[ ] T+60min: ✅ Validation complète

POST-CUTOVER:
[ ] Email succès envoyé aux stakeholders
[ ] MySQL conservé en READ-ONLY (7 jours)
[ ] Documentation mise à jour
[ ] Planification rapport PLATINUM (J+1)

PLATINUM (J+1):
[ ] Rapport 24h généré
[ ] Score: ___% (100% requis)
[ ] Verdict: PLATINUM accordé ☐ / refusé ☐
[ ] MySQL archivé (si PLATINUM)
```

---

## 📞 CONTACTS URGENCE

**Lead technique:** `___________` (tél: `___________`)  
**DBA PostgreSQL:** `___________` (tél: `___________`)  
**DevOps:** `___________` (tél: `___________`)  
**App Owner:** `___________` (tél: `___________`)  
**Escalation:** `___________` (tél: `___________`)

**War room:** `___________________________________________`

---

## 📚 SCRIPTS DISPONIBLES

| Script | Usage | Temps |
|--------|-------|-------|
| `final-cutover.ps1` | Cutover complet | 5-10min |
| `final-cutover.ps1 -DryRun` | Simulation (0 changements) | 2-3min |
| `emergency-rollback.ps1` | Rollback MySQL | < 60s |
| `24h-post-migration-report.ps1` | Rapport PLATINUM | 1-2min |
| `monitor-postgres.py` | Monitoring live | Continu |

---

## 🎓 TIPS & BEST PRACTICES

### Avant cutover
- ✅ **Testez le rollback AVANT le cutover** (dry-run obligatoire)
- ✅ **Informez TOUS les stakeholders** (pas de surprise)
- ✅ **Préparez les communications** (email succès/échec)
- ✅ **Ayez 2 personnes minimum** (jamais seul)

### Pendant cutover
- ✅ **Lisez TOUS les outputs** (ne skip rien)
- ✅ **Ne paniquez pas si rollback** (c'est prévu pour ça)
- ✅ **Documentez tout** (screenshots, logs, timestamps)
- ✅ **Communiquez régulièrement** (updates 15min)

### Après cutover
- ✅ **Surveillez pendant 1h minimum** (monitoring actif)
- ✅ **Testez workflows critiques** (end-to-end métier)
- ✅ **Gardez MySQL 7 jours** (sécurité)
- ✅ **Générez rapport PLATINUM à J+1** (certification)

---

**Document généré le:** 2025-11-16  
**Version:** 1.0  
**Niveau requis:** GOLD ✅  
**Objectif:** PLATINUM (J+1)

---

**🚀 VOUS ÊTES PRÊT. EXÉCUTEZ QUAND VOUS ÊTES READY. GOOD LUCK!**
