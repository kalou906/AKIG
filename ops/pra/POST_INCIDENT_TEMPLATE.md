# 📝 POST-INCIDENT REPORT - Template

## Informations Générales

```
Titre: [Brief incident description]
Date/Heure Début: [YYYY-MM-DD HH:MM UTC]
Date/Heure Fin: [YYYY-MM-DD HH:MM UTC]
Durée Totale: [X minutes]
Sévérité: P1 / P2 / P3
Impact: [Description du business impact]
Auteur du Rapport: [Name]
Date du Rapport: [YYYY-MM-DD]
```

---

## Chronologie

### Détection

```
Heure: [HH:MM UTC]
Détecté par: [Automated alert / Manual report / Customer complaint]
Symptôme initial: [What happened?]
Impact immédiat: [How many users affected?]
Revenue impact: [$X/min or % of service]

Example:
- 14:32 UTC: Slack alert "Database connectivity failed"
- 14:33 UTC: On-call DBA notified
- 14:34 UTC: User reports: "Dashboard not loading"
```

### Escalade

```
14:35 UTC: Severity assessed as P1 (100% service down)
14:36 UTC: DevOps lead paged
14:37 UTC: VP Operations informed
14:38 UTC: Status page updated
```

### Réponse

```
14:40 UTC: Database restart initiated
14:45 UTC: [Intermediate findings]
14:50 UTC: [Corrective action 1]
15:00 UTC: [Corrective action 2]
15:10 UTC: Service partially restored
15:15 UTC: Full service restored
15:20 UTC: All checks passed ✓
```

---

## Root Cause Analysis (5 Whys)

### Question 1: Why did the database stop responding?
**Answer:** PostgreSQL process crashed due to OOM (Out of Memory)

### Question 2: Why did it run out of memory?
**Answer:** Query cache wasn't cleared, old connections consuming memory

### Question 3: Why weren't old connections cleaned up?
**Answer:** Connection pool max_age not configured

### Question 4: Why wasn't this caught in testing?
**Answer:** Load testing didn't simulate sustained high-load scenario

### Question 5: Why wasn't there monitoring on memory usage?
**Answer:** Memory alerting threshold set too high (95%)

**Root Cause:** 
Memory monitoring threshold insufficient + connection pooling not optimized

---

## Timeline Précise

| Time | Event | Owner | Notes |
|------|-------|-------|-------|
| 14:32 | Alert: DB down | Monitoring | CRITICAL alert fired |
| 14:33 | Notification sent | PagerDuty | On-call DBA paged |
| 14:34 | Incident start | On-call | Investigation began |
| 14:35 | P1 severity | Team | All hands on deck |
| 14:40 | Diagnosis | DBA | Found PostgreSQL crashed |
| 14:45 | Restart DB | DBA | `systemctl restart postgresql` |
| 14:52 | Service up | Ops | APIs responding |
| 15:00 | Full verification | QA | All endpoints tested |
| 15:10 | Status updated | Comms | Incident closed |
| 15:20 | Report started | Lead | Post-mortem initiated |

---

## Impacts Calculés

### Business Impact

```
Users affected: 12,500 (100% of active users)
Duration: 38 minutes
Revenue loss: $190,000 (@ $50k/min)
SLA impact: 0.05% downtime (monthly budget: 4h, used: 38min)
Customer complaints: 847
Retention impact: TBD (30-day follow-up)
```

### Technical Impact

```
Data loss: NONE (restored from 30-min-old backup)
Queries affected: All SELECT/INSERT/UPDATE
APIs down: 47/47 endpoints
Mobile app: Unusable
Dashboard: Blank
Websocket connections: 9,234 dropped
```

### Team Impact

```
On-call hours: 2
Engineering hours: 8 (8 people × 1 hour)
Sleep disrupted: Yes (night shift)
Stress level: HIGH
```

---

## Mise en Œuvre vs PRA

### RPO (Recovery Point Objective)
- **Cible:** 1 hour
- **Réel:** 30 minutes old backup
- **Status:** ✅ MET

### RTO (Recovery Time Objective)
- **Cible:** 30 minutes
- **Réel:** 38 minutes (5 min alert delay + 33 min restore)
- **Status:** ⚠️ MISSED by 8 minutes

### Uptime SLA
- **Cible:** 99.9% (max 4h39 downtime/month)
- **Impact:** 38 minutes (new total: X hours Y minutes)
- **Status:** TBD (depends on rest of month)

---

## Leçons Apprises

### Ce qui a marché bien ✅

1. **Alertes rapides**
   - Alert envoyée < 1 minute
   - On-call mobilisé < 2 minutes
   - Recommandation: Maintenir sensibilité alertes

2. **Clear escalade**
   - Hiérarchie d'escalade fonctionnée
   - Management informé rapidement
   - Recommandation: Drill escalade mensuel

3. **Backup intact**
   - Backup récent disponible
   - Données restaurées complètement
   - Recommandation: Tester backups hebdo

4. **Communication**
   - Status page mis à jour
   - Clients informés proactivement
   - Recommandation: Continue bonnes pratiques

### Ce qui n'a pas fonctionné ❌

1. **Monitoring insuffisant**
   - Memory threshold trop haut (95%)
   - Pas d'early warning
   - Impact: 8 minute delay avant alerte
   - Fixe: Réduire à 80% threshold + add swap monitoring

2. **Connection pooling**
   - Connections pas nettoyées
   - Accumulation mémoire
   - Impact: OOM crash
   - Fixe: Set max_age on connections + add pool monitoring

3. **Test de charge**
   - Load test ne simula pas ce scénario
   - Pas découvert en pre-production
   - Impact: Découvert en prod
   - Fixe: Add sustained 8-hour load test

4. **Délai d'alerte**
   - ~5 minutes avant first responder sur serveur
   - PRA RTO dépasse par ~8 minutes
   - Impact: Manqué SLA RTO
   - Fixe: Réduire à 3-minute max response time

---

## Actions Correctives

### Immédiat (Fait le même jour)

- [x] Réduit memory threshold alert: 95% → 80%
- [x] Redémarré PostgreSQL
- [x] Vérifié toutes les données restaurées
- [x] Status page mis à jour
- [x] Client communications sent
- [x] Incident report créé

### Court terme (< 1 semaine)

- [ ] Optimize connection pooling
  - [ ] Set max_age = 300s
  - [ ] Set idle_timeout = 900s
  - [ ] Test with pgBouncer
  - Owner: DBA
  - ETA: Oct 29, 2025

- [ ] Upgrade memory alerting
  - [ ] Memory threshold: 80%
  - [ ] Swap usage: Alert at 30%
  - [ ] Trend analysis: Warn if growing > 5%/hour
  - Owner: DevOps
  - ETA: Oct 28, 2025

- [ ] Run load test
  - [ ] 8-hour sustained load
  - [ ] Monitor memory trends
  - [ ] Test connection pool behavior
  - Owner: QA
  - ETA: Oct 30, 2025

### Moyen terme (< 1 mois)

- [ ] Implement WAL archiving (PITR capability)
  - [ ] Enable archive_mode
  - [ ] Configure retention
  - [ ] Test point-in-time recovery
  - Owner: DBA
  - ETA: Nov 15, 2025

- [ ] Add read replicas
  - [ ] Setup streaming replication
  - [ ] Configure automatic failover
  - [ ] Test failover procedure
  - Owner: Infrastructure
  - ETA: Nov 20, 2025

- [ ] Improve monitoring
  - [ ] Add predictive alerting
  - [ ] Trend analysis on key metrics
  - [ ] Capacity planning dashboard
  - Owner: DevOps
  - ETA: Nov 25, 2025

### Long terme (> 1 mois)

- [ ] Reduce RTO from 30 to 10 minutes
  - [ ] Implement continuous replication
  - [ ] Auto-failover capabilities
  - [ ] Impact: 20 min improvement
  - Owner: Infrastructure
  - ETA: Dec 31, 2025

- [ ] Implement 99.99% SLA
  - [ ] Multi-region setup
  - [ ] Zero-downtime deployments
  - [ ] Impact: Downtime < 52 min/year
  - Owner: VP Ops
  - ETA: Q1 2026

---

## Suivi des Actions

| Action | Owner | Status | Due | Notes |
|--------|-------|--------|-----|-------|
| Memory threshold | DevOps | ✅ Done | 2025-10-26 | Changed 95% → 80% |
| Connection pooling | DBA | 🟡 In Progress | 2025-10-29 | Testing pgBouncer |
| Load test | QA | 🟡 Scheduled | 2025-10-30 | 8-hour test planned |
| WAL archiving | DBA | ⏳ Not started | 2025-11-15 | Design phase |
| Replication setup | Infrastructure | ⏳ Not started | 2025-11-20 | Budget approval pending |

---

## Communication & Notification

### Interne
- [x] All team members notified
- [x] Incident channel #incidents_20251025
- [x] Post-mortem meeting scheduled: Oct 27, 2025, 10:00 UTC
- [x] Management briefing completed

### Externe
- [x] Status page updated
- [x] Email sent to affected customers
- [x] Apology + credit offered ($X/customer)
- [x] Support tickets responded

### Communications Reçues
- 847 support tickets
- 23 customer emails
- 156 Twitter mentions
- 12 churn risks identified

---

## Prévention Futures

### Systèmes Mis en Place
1. ✅ Enhanced monitoring (memory + swap)
2. ✅ Improved alerting thresholds
3. ✅ Load testing protocols
4. ✅ Failover procedures (ready to test)

### Processus Améliorés
1. ✅ Escalade d'urgence
2. ✅ Communication plan
3. ✅ PRA validation hebdomadaire
4. ⏳ Disaster recovery drills (monthly)

### Training
- [ ] Team training on incident response (by Oct 31)
- [ ] On-call training on escalation (by Oct 30)
- [ ] Management training on SLA (by Nov 5)

---

## Signatures & Approbation

**Incident Report Prepared By:**
- Name: _______________
- Title: DBA / DevOps Lead
- Date: Oct 26, 2025

**Reviewed By:**
- Name: _______________
- Title: Engineering Manager
- Date: Oct 27, 2025

**Approved By:**
- Name: _______________
- Title: VP Operations
- Date: Oct 27, 2025

**Filed By:**
- Name: _______________
- Title: CTO / Compliance
- Date: Oct 27, 2025

---

## Archivage

**Report Location:** `/incidents/post_mortem_20251025_db_crash.md`  
**Related Files:**
- Logs: `/var/log/postgresql/postgresql.log.20251025`
- Backup: `/backups/akig/akig_backup_full_20251025_140000.sql.gz`
- Metrics: `/tmp/pra_restore_report_20251025_143500.txt`
- Status: `/incidents/status_page_20251025.html`

**Retention:** 5 years (compliance requirement)  
**Distribution:** CTO, VP Ops, Engineering, Audit  
**Review Date:** One month (follow-up on action items)

---

**Version**: 1.0  
**Template Version**: Oct 25, 2025  
**Next Review**: One month from incident close date  
**Lessons Learned Database**: Update [CompanyWiki] with findings
