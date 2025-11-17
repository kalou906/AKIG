# 🚨 RUNBOOK - Procédures d'Urgence AKIG

## Table des matières

1. [Escalade d'urgence](#escalade)
2. [Scénarios critiques](#scenarios)
3. [Procédure de basculement](#basculement)
4. [Communication d'urgence](#communication)
5. [Checklists](#checklists)

---

## Escalade d'urgence {#escalade}

### P1 - Critique (RTO: 15 min)

```
Utilisateurs: 100% du service inaccessible
Revenus affectés: $50k/heure

Escalade:
1. Alert automatique Slack/Email
   ↓ (5 sec)
2. On-Call DBA + DevOps alertés
   ↓ (2 min)
3. Démarrage du runbook de récupération
   ↓ (3 min)
4. Communication Status Page
   ↓ (5 min)
5. Notification directrice/clients
   ↓ (10 min)
```

### P2 - Haute Priorité (RTO: 1 heure)

```
Utilisateurs: Certaines fonctionnalités indisponibles
Revenus affectés: $10k/heure

Escalade:
1. Alert Slack
2. Equipe de support notifiée
3. Investigation sans urgence
4. Status Page mise à jour
```

### P3 - Normal

```
Dégradation mineure du service
Pas d'impact utilisateur direct

Investigation standard
```

---

## Scénarios Critiques {#scenarios}

### Scénario 1: Base de données indisponible

**Symptômes:**
```
- /api/health retourne erreur DB
- status.sh: [✗] Database connectivity failed
- Logs: "ECONNREFUSED 5432"
```

**Diagnostic (1 min):**
```bash
# SSH au serveur de production
ssh ops@production.akig.com

# Vérifier PostgreSQL
sudo systemctl status postgresql

# Vérifier connectivité
psql -h $PG_HOST -U $PG_USER -d postgres -c "SELECT 1;"

# Vérifier logs
sudo tail -f /var/log/postgresql/postgresql.log
```

**Actions correctives:**

**A. Redémarrage simple**
```bash
sudo systemctl restart postgresql
sleep 10
./status.sh  # Vérifier
```

**B. Si redémarrage ne fonctionne pas: Basculement**
```bash
# Voir section "Procédure de basculement"
```

**Escalade:**
- Si ≤ 5 min pour redémarrage → Continue
- Si > 5 min → Lancer basculement vers restore DB
- Si > 10 min → Activez le PRA complet

---

### Scénario 2: Données corrompues

**Symptômes:**
```
- Erreurs intégrité contraintes étrangères
- Logs: "ERROR: update or delete violates foreign key"
- Valeurs NULL inattendues
```

**Diagnostic (2 min):**
```bash
# Vérifier intégrité
psql -d akig -c "
  SELECT constraint_name, table_name 
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY' 
  LIMIT 10;
"

# Vérifier records orphelins
SELECT * FROM contracts WHERE user_id NOT IN (SELECT id FROM users);
```

**Actions correctives:**

**Option 1: Corriger les données (< 100 records)**
```sql
-- Créer backup avant modification
CREATE TABLE contracts_backup AS SELECT * FROM contracts;

-- Corriger les données orphelines
DELETE FROM contracts WHERE user_id NOT IN (SELECT id FROM users);

-- Vérifier
SELECT COUNT(*) FROM contracts;
```

**Option 2: Restaurer point-in-time (> 100 records)**
```bash
# Identifier le moment avant corruption
# Restaurer la base à ce point
export BACKUP_FILE=/backups/akig/akig_backup_full_20251024_100000.sql.gz
./restore_run.sh

# Rejouer transactions manuelles si nécessaire
```

**Escalade:**
- ≤ 1% de données affectées → Correction rapide
- > 1% de données affectées → Basculement immédiat
- Impossible d'identifier source → Restaurer backup

---

### Scénario 3: Attaque/Intrusion

**Symptômes:**
```
- Trafic anormal détecté
- Tentatives login massives
- Modification inattendue de données sensibles
```

**Actions immédiates (1 min):**
```bash
# 1. Isoler le serveur du réseau
sudo ip link set eth0 down

# 2. Préserver les logs
sudo tar czf /tmp/logs_backup.tar.gz /var/log/
scp ops@production.akig.com:/tmp/logs_backup.tar.gz /offline/

# 3. Basculer vers serveur DR
# (Basculement décrit ci-dessous)

# 4. Alerter l'équipe sécurité
# (Voir Communication d'urgence)
```

**Investigation (post-incident):**
```bash
# Analyser les logs
grep "Failed password" /var/log/auth.log | sort | uniq -c

# Vérifier les processus
ps auxww | grep -E "curl|wget|nc"

# Vérifier intégrité fichiers système
sudo aide --check

# Vérifier crontabs suspects
sudo cat /var/spool/cron/crontabs/*
```

**Escalade:**
- Isoler immédiatement
- Basculer vers serveur de secours
- Notifier équipe sécurité/management
- Lancer investigation post-incident

---

### Scénario 4: Perte de données (accidentelle)

**Symptômes:**
```
- Suppression accidentelle de données importantes
- Migration mal configurée a effacé des tables
- Logs de crash d'application
```

**Actions immédiates:**

**Phase 1: Arrêter l'application (30 sec)**
```bash
# Empêcher toute modification additionnelle
sudo systemctl stop akig-api

# Mettre en maintenance
cat > /var/www/html/503.html << 'EOF'
<h1>Service en maintenance</h1>
<p>Nous travaillons sur la restauration des données.</p>
EOF
```

**Phase 2: Identifier le point de restauration (2 min)**
```bash
# Lister les backups disponibles
ls -lht /backups/akig/*.sql.gz

# Identifier celui avant l'incident
# ex: 2h avant si incident détecté après 2h
```

**Phase 3: Restaurer (15 min)**
```bash
export BACKUP_FILE=/backups/akig/akig_backup_full_20251024_080000.sql.gz
./restore_run.sh

# Vérifier les données restaurées
psql -d akig -c "SELECT COUNT(*) FROM contracts;"
```

**Phase 4: Rejouer les transactions valides (5 min)**
```bash
# Si nécessaire, recorder les actions après restauration
# à partir des logs d'application

# Redémarrer
sudo systemctl start akig-api
```

**Escalade:**
- Arrêter immédiatement (< 30 sec)
- Restaurer backup (< 20 min)
- Communiquer l'incident (< 5 min)
- RTO cible: 30 minutes ✅

---

## Procédure de Basculement {#basculement}

### Basculement vers Serveur DR (RTO: 25 min)

```
Production DB                   Standby DR
(Down)                         (Active)
   ↓                              ↑
   │                              │
   └──→ Basculement (5 min)      │
                                 │
                            Rediriger trafic
                            (5 min)
                                 │
                            ← Vérifier
```

**Étape 1: Vérifier l'état de la DR (2 min)**

```bash
ssh ops@dr.akig.com

# Vérifier la base de données
./status.sh

# Doit afficher: ✓ All checks passed
```

**Étape 2: Restaurer la backup la plus récente (10 min)**

```bash
# Sur le serveur DR
export BACKUP_FILE=/backups/akig/$(ls -t /backups/akig/*.sql.gz | head -1 | xargs basename)

./restore_run.sh

# Attendre la fin (affiche le rapport)
```

**Étape 3: Tester les APIs (3 min)**

```bash
# Tester les endpoints critiques
curl -s https://dr.akig.com/api/health | jq .
curl -s https://dr.akig.com/api/auth/test | jq .
curl -s https://dr.akig.com/api/contracts?limit=1 | jq .

# Tous les endpoints doivent retourner 200 OK
```

**Étape 4: Rediriger le trafic (5 min)**

```bash
# Option A: Mise à jour du DNS
# - Accéder au provider DNS (CloudFlare, Route53, etc)
# - Changer l'IP pour akig.com → IP de DR
# - TTL = 60 sec (rapide)
# - Propager en 2-3 minutes

# Option B: Mise à jour du Load Balancer
# - Accéder au load balancer (HAProxy, AWS ELB, etc)
# - Rediriger vers IP du serveur DR
# - Immédiat (< 10 sec)

# Option C: Mise à jour du reverse proxy
# - Éditer nginx.conf
# - upstream backend { server dr.akig.com; }
# - sudo systemctl reload nginx
```

**Étape 5: Vérifier le trafic (5 min)**

```bash
# Sur votre machine locale
for i in {1..10}; do
  curl -s https://akig.com/api/health | jq -r '.status'
done

# Tous les appels doivent réussir
```

**Étape 6: Communiquer le statut**

```bash
# Envoyer notification
cat > /tmp/incident_status.txt << 'EOF'
🚨 INCIDENT: Database Failure
📍 STATUS: RESOLVED via DR Failover
⏱️ Duration: 22 minutes
✅ All services: RESTORED
📊 Data loss: None (RPO: 1 hour)
EOF

# Notifier
curl -X POST $SLACK_WEBHOOK -d '{"text":"'$(cat /tmp/incident_status.txt)'"}' 
```

---

## Communication d'Urgence {#communication}

### Notification Automatique

```bash
# Les alertes critiques déclenchent automatiquement:

1. Email aux ops-team
2. SMS aux on-call
3. Slack channel #incidents
4. PagerDuty escalade
5. Status page update
```

### Message de Communication Standard

```
🚨 INCIDENT ALERT

Service: AKIG Platform
Severity: P1 (Critical)
Time: 2025-10-25 15:34 UTC

Affected:
- User Dashboard: UNAVAILABLE
- API Endpoints: UNAVAILABLE
- Mobile App: UNAVAILABLE

Impact:
- ~15,000 users affected
- Revenue impact: ~$50k/hour

Status:
- Investigation: IN PROGRESS
- ETA recovery: 15 minutes
- Updates: Every 5 minutes

Engineering team is actively investigating.

Follow: https://status.akig.com/
```

### Escalade de Communication

```
0-5 min:   Notification initiale
5-10 min:  Update intermédiaire
10-15 min: Update avec ETA
15+ min:   Update toutes les 5 min
```

---

## Checklists {#checklists}

### Checklist P1 - Incident Critique (15 min)

- [ ] **Min 0-1**: Alert reçue, on-call mobilisé
- [ ] **Min 1-2**: Diagnostic initial lancé (status.sh)
- [ ] **Min 2-5**: Cause identifiée
- [ ] **Min 5-10**: Corrective action lancée (restart/failover)
- [ ] **Min 10-15**: Vérification et test
- [ ] **Min 15**: Service restauré, communication
- [ ] **Post**: Post-mortem dans 24h

### Checklist Basculement DR

- [ ] Production confirmée DOWN
- [ ] DR status.sh = OK
- [ ] Backup existe et valide
- [ ] restore_run.sh lancé
- [ ] Tests API tous réussis
- [ ] DNS/LB reconfiguré
- [ ] Trafic vérifié
- [ ] Communication envoyée
- [ ] On-call notifié

### Checklist Restauration de Données

- [ ] Application arrêtée
- [ ] Backup point-in-time identifié
- [ ] Backup vérifié (intégrité)
- [ ] Restauration lancée
- [ ] Données vérifiées
- [ ] Application relancée
- [ ] Tests de régression
- [ ] Incident log créé

### Checklist Post-Incident

- [ ] Timeline complète documentée
- [ ] Root cause identifiée
- [ ] Impact business calculé
- [ ] Actions correctives définies
- [ ] Tickets créés pour follow-up
- [ ] Post-mortem réunion programmée
- [ ] Documentation mise à jour
- [ ] Audit interne complété

---

## Contacts d'Urgence

```
TIER 1 - Premiers Répondants
├─ DBA On-Call: +33 6 XX XX XX XX
├─ DevOps Lead: +33 6 YY YY YY YY
└─ Tech Lead: +33 6 ZZ ZZ ZZ ZZ

TIER 2 - Escalade
├─ Engineering Manager: +33 6 AA AA AA AA
├─ VP Operations: +33 1 BB BB BB BB
└─ CTO: +33 1 CC CC CC CC

TIER 3 - Executive
├─ CEO: +33 6 DD DD DD DD
└─ COO: +33 6 EE EE EE EE

EXTERNAL
├─ Hosting Provider Support: https://support.provider.com/
├─ DNS Provider: https://dns.provider.com/support
└─ Security Team: security@company.com
```

---

**Version**: 1.0  
**Dernière révision**: Oct 25, 2025  
**Validé par**: CTO, VP Operations  
**Prochaine révision**: Jan 25, 2026
