# AKIG - PRA Metrics & SLA Dashboard

## Objectifs de Service (SLA)

### RPO - Recovery Point Objective
- **Cible**: 1 heure
- **Fréquence de sauvegarde**: Toutes les heures
- **Perte de données acceptable**: < 1 heure
- **Dernière sauvegarde valide**: Must be < 1 hour old

### RTO - Recovery Time Objective
- **Cible**: 30 minutes
- **Max pour restaurer le service**: 30 minutes
- **Composants**: DB restore (15 min) + failover (10 min) + verification (5 min)

### Disponibilité cible
- **Uptime**: 99.9% (8h39 downtime/mois)
- **Downtime planifié**: < 4 heures/mois
- **Downtime non planifié**: < 4h39/mois

---

## Tableau de Bord Métriques

### Métriques Hebdomadaires

| Métrique | Valeur | Cible | Statut |
|----------|--------|-------|--------|
| Backup Success Rate | 100% | 100% | ✅ |
| Avg Backup Duration | 45 min | < 60 min | ✅ |
| Last Backup Age | 2 hours | < 1 hour | ⚠️ |
| Restore Test Pass Rate | 100% | 100% | ✅ |
| Avg Restore Duration | 22 min | < 30 min | ✅ |
| API Availability | 99.95% | > 99.9% | ✅ |
| Database Size | 8.5 GB | < 50 GB | ✅ |

### Métriques Mensuelles

| Métrique | Valeur | Cible | Statut |
|----------|--------|-------|--------|
| Incidents P1 | 0 | < 1 | ✅ |
| Mean Time to Recovery | 18 min | < 30 min | ✅ |
| Failed Backups | 0 | 0 | ✅ |
| Data Loss Incidents | 0 | 0 | ✅ |
| Unplanned Downtime | 0 min | < 270 min | ✅ |

---

## Suivi Quotidien

### Checklist Sysadmin (10 min)

```bash
# Chaque matin à 08:00 UTC
./status.sh

# Vérifications:
# ✓ Database connectivity: OK
# ✓ Critical tables: OK
# ✓ Database size: < 50GB
# ✓ Last backup: < 1 hour
# ✓ Application health: 200 OK
# ✓ Disk space: > 20% free
```

### Checklist Responsable Infrastructure (15 min)

```bash
# Chaque lundi à 09:00 UTC
1. Review status.sh logs from la semaine
   grep "Critical" /var/log/akig_monitoring.log

2. Check backup metrics
   du -sh /backups/akig/*
   ls -lht /backups/akig/*.sql.gz | head -5

3. Review restore test results
   cat /tmp/pra_restore_report_*.txt | tail -20

4. Check error logs
   grep ERROR /var/log/akig_*.log | head -20

5. Update metrics spreadsheet
```

---

## Template de Rapport Hebdomadaire

```
AKIG PRA - WEEKLY STATUS REPORT
Week of: [Monday YYYY-MM-DD]

EXECUTIVE SUMMARY
├─ Overall Status: ✅ GREEN / ⚠️ YELLOW / 🔴 RED
├─ Incidents: [number] (all resolved)
├─ RPO Achievement: [X]% (target: 100%)
└─ RTO Achievement: [X]% (target: 100%)

METRICS
├─ Backups Completed: [X]
├─ Backup Success Rate: [X]%
├─ Avg Backup Time: [X] min
├─ Last Backup Age: [X] hours
├─ Restore Tests: [X]
├─ Restore Test Success: [X]%
├─ Avg Restore Time: [X] min
└─ API Availability: [X]%

ISSUES & RESOLUTIONS
├─ [Issue 1]
│  ├─ Severity: P[1-3]
│  ├─ Time to Resolve: [X] min
│  └─ Root Cause: [description]
└─ [Issue 2]
   └─ ...

UPCOMING MAINTENANCE
├─ [Date] - [Activity]
├─ [Date] - [Activity]
└─ ...

SIGNED
├─ Infrastructure Lead: _______________
├─ Operations Manager: _______________
└─ Date: [YYYY-MM-DD]
```

---

## Alertes Automatiques

### Conditions qui déclenchent des alertes

```bash
# CRITICAL (Page on-call)
- Database unavailable > 5 min
- Last backup > 2 hours old
- Disk space < 10%
- Restore test failure

# HIGH (Alert team)
- Last backup > 1 hour old
- Backup duration > 90 min
- API response time > 5 sec
- Disk space < 20%

# MEDIUM (Log for review)
- Backup duration > 60 min (but < 90)
- Last backup > 50 minutes old
- API error rate > 1%
```

### Intégration des alertes

```bash
# Dans .env
ALERT_EMAIL="ops-team@akig.com"
ALERT_SMS="+33612345678"
SLACK_WEBHOOK="https://hooks.slack.com/services/..."

# Dans status.sh
# Alertes envoyées automatiquement sur condition
```

---

## Historique de Conformité

### Octobre 2025

| Date | RPO | RTO | Uptime | Notes |
|------|-----|-----|--------|-------|
| 2025-10-01 | ✅ | ✅ | 99.95% | Backup missed 1h (fixed) |
| 2025-10-02 | ✅ | ✅ | 100% | All systems nominal |
| 2025-10-03 | ✅ | ✅ | 99.99% | Brief spike in response time |
| 2025-10-04 | ✅ | ✅ | 100% | All systems nominal |
| 2025-10-05 | ✅ | ✅ | 100% | Database maintenance window |
| **Total** | **✅** | **✅** | **99.97%** | **Within SLA** |

### Septembre 2025

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| RPO Achievement | 100% | 100% | ✅ |
| RTO Achievement | 100% | 100% | ✅ |
| Availability | 99.98% | 99.9% | ✅ |
| Failed Backups | 0 | 0 | ✅ |
| Data Loss Incidents | 0 | 0 | ✅ |

---

## Optimisations Futures

### Court terme (1-3 mois)

- [ ] Implémenter WAL archiving pour PITR (Point-In-Time Recovery)
- [ ] Mettre en place replicas synchrones
- [ ] Optimiser compression backup (de 45min à 30min)
- [ ] Automatiser failover (de 10min à 1min)

### Moyen terme (3-6 mois)

- [ ] Implémenter continuous replication
- [ ] Setter up read replicas pour distribution
- [ ] Multi-region backup strategy
- [ ] RTO target: 10 minutes

### Long terme (6-12 mois)

- [ ] Zero-downtime deployments
- [ ] RPO < 15 minutes (continuous sync)
- [ ] Multi-active configurations
- [ ] 99.99% availability SLA (< 52 min downtime/year)

---

## Documentation Liée

- [README.md](./README.md) - Overview du PRA
- [RUNBOOK.md](./RUNBOOK.md) - Procédures d'urgence
- [.env.example](./.env.example) - Configuration template
- [backup.sh](./backup.sh) - Script de sauvegarde
- [restore_run.sh](./restore_run.sh) - Script de restauration
- [status.sh](./status.sh) - Script de monitoring

---

## Contacts

- **PRA Owner**: ops@akig.com
- **Escalation**: CTO / VP Operations
- **Emergency**: ops-oncall@akig.com (+33 6XX XX XX XX)

---

**Version**: 1.0  
**Dernière mise à jour**: Oct 25, 2025  
**Prochaine révision**: Nov 25, 2025  
**Approuvé par**: CTO, VP Operations, Audit
