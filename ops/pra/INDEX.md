# 📋 INDEX - Plan de Récupération d'Activité (PRA) AKIG

## 📁 Structure des Fichiers

```
ops/pra/
├── README.md              # 🎯 Vue d'ensemble du PRA (START HERE)
├── RUNBOOK.md             # 🚨 Procédures d'urgence détaillées
├── METRICS.md             # 📊 Suivi SLA et metrics
├── INDEX.md               # 📋 Ce fichier (table des matières)
├── quickstart.sh          # ⚡ Assistant de setup interactif
├── loadtest.sh            # 🧪 Validation des temps de restauration
├── backup.sh              # 💾 Script de sauvegarde automatisée
├── restore_run.sh         # 🔄 Script de restauration
├── status.sh              # 🟢 Script de monitoring
├── .env.example           # ⚙️  Template de configuration
└── .env                   # 🔐 Configuration (créé par setup)
```

---

## 📖 Guide de Lecture par Rôle

### 👨‍💼 Pour le Management / Directeurs

**Lire en cet ordre:**
1. **README.md** - Section "Vue d'ensemble" + "Objectifs de Récupération"
   - Comprendre les objectifs RPO/RTO
   - Connaître les SLA
   - 5 minutes

2. **METRICS.md** - "Tableau de Bord Métriques"
   - État actuel vs objectifs
   - Tendances mensuelles
   - 3 minutes

3. **RUNBOOK.md** - "Escalade d'urgence"
   - Comprendre les procédures P1-P3
   - Temps de réaction attendus
   - 5 minutes

**Résumé:** Le PRA assure max 1 heure de perte données + 30 min de downtime en cas de sinistre.

---

### 🏗️ Pour les Ingénieurs Infrastructure

**Setup Initial:**
1. **README.md** - COMPLÈTEMENT
   - Architecture
   - Fichiers et scripts
   - Procédures d'exploitation
   - 15 minutes

2. **quickstart.sh** - Lancer le setup
   ```bash
   chmod +x quickstart.sh
   ./quickstart.sh install
   ```
   - 20 minutes

3. **RUNBOOK.md** - Tous les scénarios
   - Base de données indisponible
   - Données corrompues
   - Attaque/Intrusion
   - Perte de données
   - 30 minutes

**Opérations Quotidiennes:**
- Lancer: `./status.sh` (5 min, chaque jour)
- Lancer: `./quickstart.sh monitor` (monitoring continu)

**Tests Hebdomadaires:**
- Lancer: `./quickstart.sh test-restore` (15 min)

---

### 🧪 Pour l'Équipe QA / Tests

**Validation du PRA:**

1. **loadtest.sh** - Valider les temps de restauration
   ```bash
   chmod +x loadtest.sh
   ./loadtest.sh
   ```
   - Teste backup speed
   - Teste restore speed
   - Vérifie intégrité
   - Teste API
   - Génère rapport
   - 45 minutes

2. **RUNBOOK.md** - Scénarios critiques
   - Reproduire les scénarios
   - Valider les procédures

---

### 🔒 Pour l'Équipe Sécurité

**Audit du PRA:**

1. **README.md** - Architecture
   - Localisation des backups
   - Réseau de restauration
   - Accès et permissions
   - 10 minutes

2. **RUNBOOK.md** - Section "Scénario 3: Attaque/Intrusion"
   - Actions immédiates
   - Isolation réseau
   - Préservation logs
   - Investigation post-incident
   - 15 minutes

3. **Vérification de sécurité:**
   - [ ] Backups chiffrés en transit
   - [ ] Permissions fichiers 600
   - [ ] .env protégé (ne pas en git)
   - [ ] Alertes configurées
   - [ ] Logs d'accès archivés

---

### 📱 Pour le Support / On-Call

**En cas d'incident P1:**

1. **RUNBOOK.md** - En tête (2 minutes)
   - Table des matières
   - Escalade d'urgence
   - Contacts d'urgence

2. **Chercher le scénario correspondant:**
   - "Database indisponible"?
   - "Données corrompues"?
   - "Attaque"?
   - "Perte de données"?

3. **Suivre les étapes du scénario (15-30 min)**

4. **Envoyer le rapport final (5 min)**

---

## 🎯 Cas d'Usage Courants

### "Comment faire une sauvegarde maintenant?"
```bash
./quickstart.sh daily
```
**Fichier:** `README.md` → "Sauvegarde Quotidienne"  
**Temps:** 10 minutes  
**Lire:** [backup.sh](./backup.sh)

### "Comment tester la restauration?"
```bash
./quickstart.sh test-restore
```
**Fichier:** `README.md` → "Test de Restauration"  
**Temps:** 15 minutes  
**Lire:** [restore_run.sh](./restore_run.sh)

### "Comment activer le plan d'urgence?"
**Fichier:** `RUNBOOK.md` → "Procédure de Basculement"  
**Temps:** 25 minutes  
**Lire:** [restore_run.sh](./restore_run.sh) + [status.sh](./status.sh)

### "Comment configurer les alertes?"
**Fichier:** `.env.example` → Sections "Alerts"  
**Temps:** 5 minutes  
**Config:** Slack webhook, Email, SMS

### "Le PRA est-il compliant?"
**Fichier:** `METRICS.md` → "Tableau de Bord Métriques"  
**Temps:** 3 minutes  
**Vérifier:** RPO ✅ / RTO ✅ / Uptime ✅

### "Je dois faire un audit"
**Fichier:** `loadtest.sh`  
**Temps:** 45 minutes  
**Résultat:** Rapport complet + conformité SLA

---

## 📚 Dictionnaire

| Terme | Signification | Valeur Cible |
|-------|---------------|--------------|
| **RPO** | Recovery Point Objective | 1 heure |
| **RTO** | Recovery Time Objective | 30 minutes |
| **P1** | Incident Critique | 15 min résolution |
| **P2** | Haute Priorité | 1 heure résolution |
| **P3** | Normal | Jour suivant |
| **DR/DRP** | Disaster Recovery Plan | Plan d'urgence |
| **PITR** | Point-In-Time Recovery | Restauration précise |
| **WAL** | Write-Ahead Logging | Logs transactions |
| **HMAC** | Hash-based Message Auth Code | Signature backup |

---

## 🔄 Cycle de Maintenance

### Quotidien (2 min)
```bash
./status.sh
```
- Vérifier santé système
- Alertes automatiques si problème

### Hebdomadaire (30 min)
```bash
./quickstart.sh test-restore
```
- Tester la restauration
- Vérifier intégrité données
- Documenter résultats

### Mensuel (2h)
```bash
./loadtest.sh
```
- Test charge complet
- Mesurer performances
- Valider SLA
- Générer rapport

### Annuel (4h)
```bash
# Full PRA drill
# - Simuler sinistre complet
# - Tester failover
# - Documenter temps réels
# - Identifier améliorations
```

---

## 🚀 Quick Commands

```bash
# Setup initial
./quickstart.sh install

# Monitoring
./quickstart.sh monitor

# Backup quotidien
./quickstart.sh daily

# Test restauration
./quickstart.sh test-restore

# Health check
./quickstart.sh status

# Validation complète (45 min)
./loadtest.sh

# Consulter logs
tail -f /var/log/akig_backup.log
tail -f /var/log/akig_monitoring.log

# Voir backups disponibles
ls -lh /backups/akig/*.sql.gz

# Voir rapports restauration
ls -lh /tmp/pra_restore_report_*.txt
```

---

## 📞 Support

**Questions sur le PRA?**
- Infrastructure: ops@akig.com
- Escalation: CTO, VP Operations
- Emergency (24/7): ops-oncall@akig.com

**Fichier manquant?**
- Vérifier: `ops/pra/` existe
- Vérifier: Tous les fichiers listés ci-dessus

**Script ne fonctionne pas?**
- Vérifier: `.env` configuré
- Vérifier: Permissions exécution (`chmod +x *.sh`)
- Vérifier: PostgreSQL accessible
- Vérifier: Espace disque disponible

---

## 📊 Fichiers Générés Automatiquement

Ces fichiers sont créés par les scripts (ne pas éditer manuellement):

| Fichier | Généré par | Fréquence | Fonction |
|---------|-----------|-----------|----------|
| `/backups/akig/*.sql.gz` | `backup.sh` | Horaire | Sauvegardes |
| `/backups/akig/archive/*` | `backup.sh` | Hebdomadaire | Archive anciennes |
| `/tmp/pra_restore_report_*.txt` | `restore_run.sh` | À la demande | Rapports restauration |
| `/tmp/pra_loadtest_*.txt` | `loadtest.sh` | À la demande | Rapports validation |
| `/var/log/akig_backup.log` | `backup.sh` (cron) | Horaire | Logs sauvegardes |
| `/var/log/akig_monitoring.log` | `status.sh` (cron) | 5 minutes | Logs monitoring |

---

## ✅ Checklist Premier Jour

- [ ] Lire `README.md`
- [ ] Lancer `./quickstart.sh install`
- [ ] Vérifier `.env` bien configuré
- [ ] Vérifier sauvegarde créée
- [ ] Lancer `./quickstart.sh test-restore`
- [ ] Vérifier rapport restauration
- [ ] Configurer cron jobs
- [ ] Tester alertes
- [ ] Documenter procédures locales
- [ ] Former équipe sur-call

---

## 📞 Ressources Externes

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump & pg_restore](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL Recovery](https://www.postgresql.org/docs/current/runtime-config-wal.html)
- [Linux bash scripting](https://www.gnu.org/software/bash/manual/bash.html)

---

**Version**: 1.0  
**Date**: Oct 25, 2025  
**Statut**: 🟢 PRODUCTION  
**Approuvé**: CTO, VP Operations

---

*Dernière mise à jour: 2025-10-25*  
*Prochaine révision: 2025-11-25*
