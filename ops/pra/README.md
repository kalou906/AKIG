# 🚨 Plan de Récupération d'Activité (PRA) - AKIG

## Vue d'ensemble

Le PRA (ou DRP - Disaster Recovery Plan) garantit la continuité de service en cas de sinistre en fournissant les procédures et outils pour restaurer rapidement le système.

## Objectifs de Récupération

### RPO (Recovery Point Objective)
- **Valeur cible**: 1 heure
- **Fréquence de sauvegarde**: Toutes les heures
- **Perte de données maximale**: 1 heure

### RTO (Recovery Time Objective)  
- **Valeur cible**: 30 minutes
- **Temps avant restauration complète**: ≤ 30 minutes
- **SLA**: 99.9% disponibilité

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION (Primary)                      │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  App Server  │  Storage  │  Monitoring       │
└────────────┬─────────────────────────────────┬──────────────┘
             │ Hourly Backup                   │ Health Check
             │                                  │
             ▼                                  ▼
        ┌────────────┐                   ┌──────────────┐
        │   Backup   │◄─────Replicate────┤  Monitoring  │
        │  Storage   │                   │   System     │
        └─────┬──────┘                   └──────────────┘
              │
              │ Test Monthly
              ▼
        ┌──────────────────────────────────────┐
        │  RECOVERY (Standby) Environment      │
        ├──────────────────────────────────────┤
        │  PostgreSQL  │  App Server  │ Status │
        └──────────────────────────────────────┘
```

## Fichiers et Scripts

### 1. `backup.sh`
Sauvegarde complète/incrémentale de la base de données

**Usage:**
```bash
# Sauvegarde complète (quotidienne)
./backup.sh --full

# Sauvegarde incrémentale
./backup.sh --incremental

# Cron configuré:
0 * * * * /opt/akig/ops/pra/backup.sh --full
```

**Fonctionnalités:**
- ✅ Compression automatique
- ✅ Rotation des anciennes sauvegardes
- ✅ Vérification d'intégrité
- ✅ Upload serveur distant
- ✅ Notifications Slack/Email

### 2. `restore_run.sh`
Test de restauration automatisé

**Usage:**
```bash
export BACKUP_FILE=/backups/akig/akig_backup_full_20251025_100000.sql.gz
./restore_run.sh
```

**Procédure:**
1. Crée base `akig_restore`
2. Restaure la sauvegarde
3. Vérifie l'intégrité DB
4. Teste les endpoints API
5. Génère un rapport

**Résultats attendus:**
```
✓ Database tables: 45
✓ Data integrity: OK
✓ Application health: 200 OK
✓ API endpoints: accessible
✓ Report: /tmp/pra_restore_report_*.txt
```

### 3. `status.sh`
Monitoring continu de la santé du système

**Usage:**
```bash
./status.sh        # Vérification unique
./status.sh &      # Mode monitoring continu

# Cron configuré:
*/5 * * * * /opt/akig/ops/pra/status.sh
```

**Vérifications:**
- ✅ Connexion base de données
- ✅ Tables critiques présentes
- ✅ Taille base de données
- ✅ Dernière sauvegarde
- ✅ Santé application
- ✅ Espace disque

**Codes de sortie:**
- `0` = OK
- `1` = PROBLÈMES CRITIQUES
- `2` = AVERTISSEMENTS

### 4. `.env.example`
Configuration centralisée des variables d'environnement

**À configurer:**
```bash
cp .env.example .env
# Éditer .env avec les valeurs de production
source .env
```

## Procédures d'Exploitation

### Sauvegarde Quotidienne

```bash
# 1. Lancer une sauvegarde manuelle
cd /opt/akig/ops/pra
source .env
./backup.sh --full

# 2. Vérifier la sauvegarde
ls -lh /backups/akig/akig_backup_*.sql.gz

# 3. Consulter les logs
tail -f /var/log/akig_backup_*.log
```

### Test de Restauration (Hebdomadaire)

```bash
# 1. Sélectionner la sauvegarde à tester
export BACKUP_FILE=/backups/akig/akig_backup_full_20251025_100000.sql.gz

# 2. Lancer le test
./restore_run.sh

# 3. Vérifier le rapport
cat /tmp/pra_restore_report_*.txt

# 4. Vérifier la base restaurée
psql -h restore-db -U akig_restore -d akig_restore -c "SELECT count(*) FROM users;"
```

### Activation du Plan d'Urgence (RTO)

**Étapes (cible: ≤ 30 minutes):**

```bash
# Phase 1: Préparation (5 min)
1. Identifier la sauvegarde la plus récente
   ls -lht /backups/akig/*.sql.gz | head -1

2. Vérifier la disponibilité du serveur de restauration
   ./status.sh

# Phase 2: Restauration (15 min)
3. Restaurer la base de données
   export RESTORE_DB=akig_live
   ./restore_run.sh

4. Rediriger le trafic vers le serveur de restauration
   # Mettre à jour le DNS
   # Mettre à jour le load balancer

# Phase 3: Vérification (10 min)
5. Tester les endpoints critiques
   curl https://akig-restore.example.com/api/health

6. Vérifier les données
   psql -d akig_live -c "SELECT count(*) FROM contracts;"

7. Confirmer à l'équipe
   Notifier Slack/Email
```

## Monitoring et Alertes

### Checks Automatiques

```bash
# Toutes les 5 minutes
*/5 * * * * /opt/akig/ops/pra/status.sh

# Cron output
0 6 * * * /opt/akig/ops/pra/status.sh >> /var/log/pra_status.log
```

### Configuration Alertes

**Slack:**
```bash
export SLACK_WEBHOOK=https://hooks.slack.com/services/...
# Notifications envoyer automatiquement
```

**Email:**
```bash
export ALERT_EMAIL=ops@example.com
# Alertes sur problèmes critiques
```

## Checklist Déploiement

- [ ] Configuration `.env` définie
- [ ] Répertoires de sauvegarde créés (`/backups/akig`)
- [ ] Permissions fichiers correctes (600 pour `.env`)
- [ ] Scripts rendus exécutables (`chmod +x *.sh`)
- [ ] Cron configuré pour sauvegarde horaire
- [ ] Cron configuré pour monitoring 5min
- [ ] Test de sauvegarde réussi
- [ ] Test de restauration réussi
- [ ] Alertes Slack configurées
- [ ] Documentation mise à jour

## Dépannage

### Sauvegarde lente

```bash
# Vérifier les logs
tail -f /var/log/akig_backup_*.log

# Vérifier les I/O disque
iostat -x 1 5

# Vérifier la taille DB
SELECT pg_size_pretty(pg_database_size('akig'));
```

### Restauration échouée

```bash
# Vérifier les logs
tail -f /tmp/pra_restore_*.log

# Vérifier la base existe
psql -c "SELECT 1 FROM pg_database WHERE datname='akig_restore';"

# Vérifier les permissions
psql -l | grep restore
```

### Espace disque faible

```bash
# Vérifier l'utilisation
df -h /backups/

# Archiver les anciennes sauvegardes
mkdir -p /backups/akig/archive
mv /backups/akig/*.sql.gz.* /backups/akig/archive/

# Ou réduire la rétention
export BACKUP_RETENTION_DAYS=14
./backup.sh --full
```

## Contacts d'Urgence

- **Responsable Infrastructure**: ops@example.com
- **DBA**: dba@example.com  
- **Management IT**: cio@example.com
- **Hotline 24/7**: +33 1 23 45 67 89

## Documentation Supplémentaire

- [PostgreSQL Backup & Recovery](https://www.postgresql.org/docs/current/backup.html)
- [AKIG Architecture](../README.md)
- [Monitoring & Alerting](./MONITORING.md)

---

**Version**: 1.0  
**Dernière mise à jour**: Oct 25, 2025  
**État**: Production
