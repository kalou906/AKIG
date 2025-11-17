# ✅ CHECKLIST D'IMPLÉMENTATION - PRA Production

## Phase 1: Préparation (Jour 1-2)

### Approbations
- [ ] PRA approuvé par CTO
- [ ] PRA approuvé par VP Operations
- [ ] PRA approuvé par Audit/Compliance
- [ ] Budget alloué pour infrastructure DR
- [ ] Équipe on-call identifiée
- [ ] Points de contact définis

### Documentation
- [ ] README.md lu et approuvé
- [ ] RUNBOOK.md distribué à l'équipe
- [ ] METRICS.md accessible à management
- [ ] INDEX.md compris par tous les rôles
- [ ] Contacts d'urgence listés et vérifiés
- [ ] Documentation locale adaptée

### Infrastructure Préparation
- [ ] Serveur de production accessible (SSH, SQL)
- [ ] Serveur DR préparé (si applicable)
- [ ] Espace disque >= 100 GB pour backups
- [ ] Réseau: Production ↔ Backup isolé
- [ ] Réseau: Production ↔ DR ouvert
- [ ] DNS/LB configuré pour failover

---

## Phase 2: Configuration (Jour 2-3)

### Configuration de Base
- [ ] `.env.example` copié en `.env`
- [ ] `PG_HOST` configuré
- [ ] `PG_USER` configuré (user with BACKUP privileges)
- [ ] `PG_PASSWORD` configuré (secure)
- [ ] `BACKUP_DIR` créé et permissions 700
- [ ] `RETENTION_DAYS` configuré (default: 30)

### Configuration Production
- [ ] `APP_HOST` configuré
- [ ] `APP_PORT` configuré
- [ ] `DATABASE_URL` testé avec psql
- [ ] Sauvegarde `.env` en lieu sûr
- [ ] `.env` ajouté à `.gitignore`
- [ ] `.env` synced entre serveurs

### Configuration Alertes
- [ ] `ALERT_EMAIL` configuré
- [ ] `SLACK_WEBHOOK` configuré et testé
- [ ] `ALERT_SMS` configuré (optionnel)
- [ ] Test: `curl -X POST $SLACK_WEBHOOK`
- [ ] Email test envelope reçu
- [ ] SMS test reçu (si applicable)

### Configuration Restauration
- [ ] `RESTORE_HOST` configuré (ou même que PG_HOST)
- [ ] `RESTORE_DB` nommé (ex: akig_restore)
- [ ] `APP_HEALTH_URL` configuré
- [ ] `HEALTH_CHECK_RETRIES` configuré (5)
- [ ] `HEALTH_CHECK_INTERVAL` configuré (10s)

---

## Phase 3: Permissions & Sécurité (Jour 3)

### Permissions Fichiers
- [ ] `backup.sh` → 755 (exécutable)
- [ ] `restore_run.sh` → 755
- [ ] `status.sh` → 755
- [ ] `quickstart.sh` → 755
- [ ] `loadtest.sh` → 755
- [ ] `.env` → 600 (propriétaire seulement)
- [ ] `BACKUP_DIR` → 700

### Permissions PostgreSQL
- [ ] User `akig_backup` créé (BACKUP role)
  ```sql
  CREATE ROLE akig_backup WITH LOGIN PASSWORD 'password';
  GRANT BACKUP TO akig_backup;
  ```
- [ ] User a accès à toutes les tables
  ```sql
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO akig_backup;
  ```
- [ ] User peut créer databases (restore)
  ```sql
  ALTER ROLE akig_backup CREATEDB;
  ```

### Sécurité
- [ ] `.env` sécurisé (ne pas committer)
- [ ] SSH keys pour accès serveurs
- [ ] 2FA activée pour comptes critiques
- [ ] Audit des accès backup
- [ ] Chiffrement backups (optionnel)
  ```bash
  # Dans backup.sh:
  gzip -c | openssl enc -aes-256-cbc -salt > backup.sql.gz.enc
  ```

---

## Phase 4: Scripts de Sauvegarde (Jour 4)

### Test Manuel
- [ ] Exécuter: `./backup.sh --full`
- [ ] Vérifier: Fichier créé dans `BACKUP_DIR`
- [ ] Vérifier: Taille > 1MB
- [ ] Vérifier: Pas d'erreurs dans les logs
- [ ] Vérifier: Temps < 60 minutes

### Test Incrémental (optionnel)
- [ ] Exécuter: `./backup.sh --incremental`
- [ ] Vérifier: Fichier créé
- [ ] Vérifier: Taille < sauvegarde précédente

### Cron Configuration
- [ ] Créer `crontab` entry pour sauvegarde horaire:
  ```bash
  0 * * * * cd /opt/akig/ops/pra && source .env && ./backup.sh --full >> /var/log/akig_backup.log 2>&1
  ```
- [ ] Vérifier: `crontab -l | grep backup`
- [ ] Vérifier: Logs de cron
- [ ] Attendre première exécution (1h max)

### Log Rotation
- [ ] Créer `/etc/logrotate.d/akig-pra`:
  ```
  /var/log/akig_backup.log
  /var/log/akig_monitoring.log
  {
    daily
    rotate 30
    compress
    missingok
    notifempty
  }
  ```
- [ ] Tester: `logrotate -f /etc/logrotate.d/akig-pra`

---

## Phase 5: Scripts de Restauration (Jour 4)

### Test Manuel
- [ ] Identifier backup récent
- [ ] Exécuter: `export BACKUP_FILE=...`
- [ ] Exécuter: `./restore_run.sh`
- [ ] Vérifier: Database restaurée
- [ ] Vérifier: Données cohérentes
- [ ] Vérifier: APIs accessibles
- [ ] Vérifier: Rapport généré
- [ ] Nettoyage: Supprimer database de test

### Restore Database
- [ ] Database `akig_restore` créée (vide)
- [ ] Permissions du user de restore OK
- [ ] Restore peut effacer/recréer la DB

---

## Phase 6: Monitoring (Jour 5)

### Test Manual
- [ ] Exécuter: `./status.sh`
- [ ] Vérifier: Tous les checks passent ✓
- [ ] Vérifier: Pas d'erreurs
- [ ] Vérifier: Output lisible

### Cron Configuration
- [ ] Créer `crontab` entry pour monitoring 5min:
  ```bash
  */5 * * * * cd /opt/akig/ops/pra && source .env && ./status.sh >> /var/log/akig_monitoring.log 2>&1
  ```
- [ ] Vérifier: `crontab -l | grep status`
- [ ] Attendre 5 premières exécutions (25 min)

### Alertes
- [ ] Vérifier: Aucune alerte critique actuellement
- [ ] Simuler alerte: `kill -9 $(pgrep postgres)`
  - Attendre status.sh (5 min max)
  - Vérifier: Alerte reçue (email/Slack)
- [ ] Restaurer service
- [ ] Vérifier: Alerte "résolution" reçue

---

## Phase 7: Validation SLA (Jour 5-6)

### Test RPO
- [ ] Dernière sauvegarde créée
- [ ] Heure = maintenant (< 1 minute)
- [ ] Âge sauvegarde < 1 heure ✓

### Test RTO
- [ ] Restauration en < 30 min ✓
- [ ] Données accessibles après
- [ ] APIs répondent

### Load Test Complet
- [ ] Exécuter: `./loadtest.sh`
- [ ] Attendre rapport (45 min)
- [ ] Vérifier: Tous les tests PASS
- [ ] Vérifier: RPO MET ✓
- [ ] Vérifier: RTO MET ✓
- [ ] Archiver rapport

---

## Phase 8: Documentation & Formation (Jour 6-7)

### Documentation
- [ ] Runbook distribué à l'équipe
- [ ] Contacts d'urgence affichés
- [ ] Procédures documentées localement
- [ ] Procédures traduites si nécessaire
- [ ] Plannings published:
  - [ ] Quand: Sauvegarde (toutes les heures)
  - [ ] Quand: Test restauration (chaque semaine)
  - [ ] Quand: Validation SLA (chaque mois)

### Formation d'Équipe
- [ ] Réunion avec DBA
  - [ ] Expliquer backup process
  - [ ] Montrer comment: `./quickstart.sh daily`
  - [ ] Montrer comment: `./quickstart.sh test-restore`
  
- [ ] Réunion avec Ops/On-Call
  - [ ] Expliquer escalade d'urgence
  - [ ] Montrer RUNBOOK.md
  - [ ] Simuler P1 incident (test)
  - [ ] Montrer: Basculement vers DR
  
- [ ] Réunion avec Management
  - [ ] Expliquer SLA (RPO/RTO)
  - [ ] Montrer METRICS dashboard
  - [ ] Planifier revue mensuelle

### Tests Pratiques
- [ ] Drill P1: Team mobilisée en < 5 min
- [ ] Drill P1: Database restaurée en < 30 min
- [ ] Drill P1: Trafic redirigé en < 5 min
- [ ] Drill P1: Communication envoyée en < 5 min
- [ ] Tous les drills documentés

---

## Phase 9: Monitoring & Métriques (Semaine 2)

### Dashboard Métriques
- [ ] METRICS.md accessible
- [ ] Métriques actualisées quotidiennement
- [ ] Rapport hebdo généré
- [ ] Conformité SLA vérifiée

### Escalade des Problèmes
- [ ] RPO < 1h: ✓ Conforme
- [ ] RTO < 30min: ✓ Conforme
- [ ] Backup success rate: ✓ 100%
- [ ] Restore test success: ✓ 100%

### Maintenance Régulière
- [ ] Jour 1-7: Daily check: `./status.sh`
- [ ] Jour 7: Weekly test: `./quickstart.sh test-restore`
- [ ] Jour 14: Bi-weekly review: Logs & metrics
- [ ] Jour 30: Monthly: Full `./loadtest.sh`

---

## Phase 10: Production Go-Live (Semaine 2)

### Final Validations
- [ ] CTO: Approuve déploiement
- [ ] VP Ops: Approuve déploiement
- [ ] Audit: Approuve (compliance check)
- [ ] Équipe: Formée et prête
- [ ] Runbooks: Actualisés et distribués

### Communication
- [ ] Annoncer: "PRA activé en production"
- [ ] Envoyer: Tous les contacts d'urgence
- [ ] Poster: Alertes configurées
- [ ] Afficher: Status page "PRA Active"

### Monitor Étroitement (Premiers 7 jours)
- [ ] Vérifier cron backups quotidiennement
- [ ] Vérifier cron monitoring (5 min)
- [ ] Audit logs (alertes, erreurs)
- [ ] Métriques (RPO/RTO)
- [ ] Aucun incident surpris

---

## Post Go-Live Routine

### Quotidien
```bash
# Chaque matin (08:00)
./status.sh
# Vérifier: "All checks passed ✓"
```

### Hebdomadaire
```bash
# Chaque lundi (09:00)
./quickstart.sh test-restore
# Générer et archiver rapport
```

### Mensuel
```bash
# Dernier jeudi du mois
./loadtest.sh
# Générer rapport de conformité
# Revoir avec team
```

### Trimestriel
```bash
# Disaster Recovery Drill
# Simuler basculement complet
# Chronométrer vs RTO
# Documenter améliorations
```

---

## Signoff

**Préparation:** _______________  
**Configuration:** _______________  
**Testing:** _______________  
**Management Approval:** _______________  
**Go-Live Date:** _______________  
**Review 30-Days:** _______________  

---

**Version**: 1.0  
**Date**: Oct 25, 2025  
**Prochaine mise à jour**: À compléter après deploy  
**Status**: 🟡 PRE-PRODUCTION  

---

*Une fois toutes les cases cochées, changer status à: 🟢 PRODUCTION*
