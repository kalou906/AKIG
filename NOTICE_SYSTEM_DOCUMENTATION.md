/**
 * Documentation exhaustive - Système de Préavis Sophistiqué
 * Couverture: Architecture, déploiement, exploitation, troubleshooting
 */

# SYSTÈME DE PRÉAVIS ULTRA-SOPHISTIQUÉ

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Fonctionnalités clés](#fonctionnalités-clés)
4. [Guide de déploiement](#guide-de-déploiement)
5. [Guide opérationnel](#guide-opérationnel)
6. [Alertes IA et SLA](#alertes-ia-et-sla)
7. [Troubleshooting](#troubleshooting)
8. [Checklist d'activation](#checklist-dactivation)

---

## Vue d'ensemble

Le système de préavis sophistiqué couvre le cycle de vie complet :
- **Création**: Assistant intelligent avec calcul dates légales
- **Communication**: SMS, WhatsApp, Email, PDF avec traductions FR/EN/locales
- **Suivi**: Alertes IA, SLA temps réel, traçabilité immuable
- **Contestation**: Médiation, arbitrage, documentation légale
- **Clôture**: Comptabilité de sortie, recouvrement, archivage

### Objectifs mesurables
- ✅ Zéro préavis oublié
- ✅ Délais légaux respectés à 100%
- ✅ Taux de réception >98% (SMS+Email)
- ✅ Délivrance comprise en <24h (mesurée par accusé)
- ✅ Réduction des litiges de 40% via rétention proactive
- ✅ Recouvrement >90% en <14 jours

---

## Architecture technique

### Stack technologique

```
Frontend:
├─ React 18 + TypeScript
├─ MUI (Material-UI) pour UI
├─ Recharts pour analytics
├─ Playwright pour tests E2E
├─ Tailwind CSS + Autoprefixer
└─ Accessibility (WCAG 2.1 AA)

Backend:
├─ Node.js + Express
├─ PostgreSQL (12+)
├─ Typeorm ORM
├─ Nodemailer (Email)
├─ Twilio/Meta (SMS/WhatsApp)
├─ PDFKit (Génération PDF)
└─ Jest + Supertest (tests)

Infrastructure:
├─ Docker Compose (dev)
├─ GitHub Actions (CI/CD)
├─ Sentry (error tracking)
├─ GA4 (analytics)
└─ CloudFlare (CDN, WAF)
```

### Architecture logique

```
┌─────────────────────────────────────────┐
│         CLIENT (React/Browser)           │
│  • ManagerDashboard.tsx                  │
│  • NoticeCreate.tsx                      │
│  • ContestationForm.tsx                  │
│  • AccountingCalculator.tsx              │
└────────────┬────────────────────────────┘
             │
        ┌────▼───────────────────────────┐
        │  REST API (Express)             │
        │  • /api/notices                 │
        │  • /api/notices/:id/send        │
        │  • /api/notices/:id/calculate   │
        │  • /api/alerts                  │
        │  • /api/ai/...                  │
        └────┬──────────────────┬─────────┘
             │                  │
      ┌──────▼─────┐    ┌──────▼─────────┐
      │  Services  │    │  Providers     │
      │  • AIServ. │    │  • Twilio SMS  │
      │  • CommServ│    │  • Meta WA     │
      │  • EmailServ   │  • Sendgrid    │
      └──────┬─────┘    └──────┬─────────┘
             │                  │
      ┌──────▼──────────────────▼──────────┐
      │  PostgreSQL Database               │
      │  • contracts                       │
      │  • notices                         │
      │  • notice_audit_log                │
      │  • communication_events            │
      │  • exit_accounting                 │
      │  • ai_alerts                       │
      │  • departure_risk_assessments      │
      └───────────────────────────────────┘
```

### Models clés

```typescript
// Contrat avec règles légales
Contract {
  id: UUID
  tenantId, propertyId, managerId
  startDate, endDate, tacitRenewalDays
  bailType: 'residential' | 'commercial'
  legalParameters: { noticeDurationDays, countBusinessDaysOnly, ... }
  allowable_notice_types: NoticeType[]
}

// Préavis avec audit immuable
Notice {
  id: UUID
  contractId
  type: 'termination' | 'rent_increase' | 'transfer' | 'works'
  status: 'draft' | 'sent' | 'received' | 'validated' | 'contested' | 'mediation' | 'closed'
  emission_date, effective_date
  auditLog: [] // Immuable
  litigationStatus?: LitigationStatus
  mediation?: {...}
}

// Comptabilité de sortie
ExitAccounting {
  remainingRent, penalties, deposit
  inspectionFees, worksCost
  totalDebit, totalCredit, balanceDue
  paymentPlan?: Installment[]
}

// Alertes IA
AIAlert {
  type: 'deadline' | 'departure_risk' | 'litigation' | 'payment' | 'anomaly'
  severity: 'P1' | 'P2' | 'P3'
  reasoning: { rule, factors, confidence }
}
```

---

## Fonctionnalités clés

### 1. Création et validation intelligente

**Endpoint**: `POST /api/notices`

```bash
curl -X POST http://localhost:4000/api/notices \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "CONTRACT_001",
    "type": "termination",
    "motif": "Non-respect conditions",
    "effectiveDate": "2024-02-15"
  }'

Response:
{
  "success": true,
  "notice": { "id": "...", "status": "draft" },
  "legalCalculation": {
    "emissionDate": "2024-01-16",
    "effectiveDate": "2024-02-15",
    "daysUntilEffective": 30,
    "businessDaysUntilEffective": 21,
    "warnings": []
  }
}
```

**Validations**:
- ✅ Type de préavis autorisé par contrat
- ✅ Délai légal respecté (paramétrable par site/juridiction)
- ✅ Dates cohérentes (pas de passé)
- ✅ Pas de chevauchement avec autres préavis actifs
- ✅ Pas d'impayés critiques non résolus

### 2. Communication multi-canaux résiliente

**Endpoint**: `POST /api/notices/:id/send`

```bash
curl -X POST http://localhost:4000/api/notices/NOTICE_001/send \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["sms", "email"],
    "language": "fr"
  }'
```

**Caractéristiques**:
- SMS: 160 caractères, retry exponentiel (2min, 4min, 8min, 16min, 32min, 64min)
- WhatsApp: Messages avec pictogrammes pour littératie faible
- Email: Pièce jointe PDF, tracking de lecture
- Lettre: PDF imprimable avec adresse

**Traductions supportées**:
- FR (français standard)
- EN (anglais)
- Soussou, Peulh, Malinké (langues locales Guinée)

### 3. Suivi et alertes en temps réel

**Jalons SLA**:
```
J-30: Alerte P3 - Préparer documentation
J-15: Alerte P2 - Vérifier documents
J-7:  Alerte P2 - Prêt à envoyer
J-3:  Alerte P1 - Envoyer
J-1:  Alerte P1 - Vérifier réception
J+1:  Alerte P1 - Pas d'accusé? Relancer
J+3:  Alerte P1 - Escalade manager
```

**Détection d'anomalies IA**:
- Délais légaux manqués → P1
- Pièces manquantes → P2
- Incohérences contrat/préavis → P1
- Contestations détectées → P1
- Impayés critiques → P1

### 4. Comptabilité de sortie

**Endpoint**: `POST /api/notices/:id/calculate-balance`

```bash
curl -X POST http://localhost:4000/api/notices/NOTICE_001/calculate-balance \
  -H "Content-Type: application/json" \
  -d '{
    "remainingRent": 1200,
    "penalties": 300,
    "inspectionFees": 100,
    "worksCost": 0,
    "remissions": [{"reason": "geste commercial", "amount": 200}]
  }'

Response:
{
  "accounting": { "id": "..." },
  "summary": {
    "totalDebit": 1600,
    "totalRemissions": 200,
    "totalCredit": 1400,
    "balanceDue": 200,
    "requiresPaymentPlan": true
  }
}
```

**Automatisation**:
- Calcul instantané (<100ms)
- Génération reçu PDF
- Justificatif restitution dépôt
- Propost d'échéancier si solde > 1500€
- Escalade juridique si non-paiement >14 jours

### 5. Alertes IA et prédictions

**Intention de départ** (score 0-100):

```
Signaux:
- Retards récurrents: +15-25pts
- Baisse communications: +10-20pts
- Marché loyers hausses: +20pts
- Incidents non résolus: +10-18pts
- Changements situation: +12pts

Actions de rétention:
- Score >70: Appel personnalisé + geste commercial
- Score >85: Escalade manager + médiation
```

---

## Guide de déploiement

### Préalables

```bash
# Versions minimum
- Node.js 18+
- PostgreSQL 12+
- Docker Compose 2.0+
```

### Installation

```bash
# 1. Cloner repo
git clone https://github.com/akig/notice-system.git
cd notice-system

# 2. Variables d'environnement
cp .env.example .env
# Éditer: DATABASE_URL, JWT_SECRET, SMS_API_KEY, WHATSAPP_API_KEY

# 3. Install dépendances
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Initialiser DB
cd backend
npm run migrate
npm run seed # Données de test
cd ..

# 5. Démarrer les services
docker-compose up -d

# 6. Lancer les tests
npm run test:all

# 7. Vérifier les migrations
psql -d akig -f src/db/schema-notice-system.sql
```

### Configuration services externes

**Twilio SMS**:
```bash
# .env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+33612345678
```

**Meta WhatsApp**:
```bash
WHATSAPP_PROVIDER=meta
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxx
WHATSAPP_API_VERSION=v18.0
WHATSAPP_ACCESS_TOKEN=xxxxx
```

**Sendgrid Email**:
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=xxxxx
SENDGRID_FROM_EMAIL=noreply@akig.com
```

### Migration depuis système legacy

```bash
# Export données legacy
npm run migrate:export-legacy

# Transformation et chargement
npm run migrate:transform-and-load

# Validation
npm run migrate:validate

# Rollback si problème
npm run migrate:rollback
```

---

## Guide opérationnel

### Workflow manager quotidien

```bash
# 1. Vérifier les alertes P1
curl http://localhost:4000/api/alerts?severity=P1&status=open

# 2. Prioriser les tâches
curl http://localhost:4000/api/tasks/prioritized?managerId=MANAGER_001

# 3. Envoyer les relances J-3
curl -X POST http://localhost:4000/api/ai/send-scheduled-communications

# 4. Vérifier les réceptions
curl http://localhost:4000/api/notices?status=sent | jq '.data[] | select(.acknowledged_at == null)'

# 5. Escalader les SLA en retard
curl -X POST http://localhost:4000/api/ai/escalate-breached-sla
```

### Workflow contestation

```
1. Réception contestation (API: POST /notices/:id/contest)
   ├─ Enregistrement motif + docs
   ├─ Création alerte P1
   └─ Notification manager

2. Initiation médiation (API: POST /notices/:id/mediation/start)
   ├─ Affectation médiateur
   ├─ Envoi formulaire proposition aux parties
   └─ Planning réunion

3. Accord ou escalade (API: POST /notices/:id/mediation/resolve)
   ├─ Documentation accord
   ├─ Signature numérique
   └─ Clôture préavis ou procédure juridique
```

### Extraction de rapports

```bash
# Rapport mensuel
curl "http://localhost:4000/api/reports/monthly?month=2024-01" \
  -o rapport_janvier_2024.pdf

# Export Excel données
curl "http://localhost:4000/api/notices/export/excel?status=closed&period=2024-01" \
  -o exports_janvier.xlsx

# Audit trail spécifique
curl "http://localhost:4000/api/notices/NOTICE_001/audit-log" \
  | jq '.' > audit_NOTICE_001.json
```

---

## Alertes IA et SLA

### Matrice de sévérité

```
┌─────────────────────────────────────┬──────────────────────────────────┐
│ Alerte                              │ Sévérité │ Délai action │ Escalade│
├─────────────────────────────────────┼──────────┼──────────────┼─────────┤
│ Délai légal manqué                  │ P1       │ < 2h         │ Manager │
│ Préavis expédié, pas d'accusé J+3   │ P1       │ < 4h         │ Manager │
│ Contestation formelle                │ P1       │ < 4h         │ Manager │
│ Solde impayé J+14                   │ P1       │ < 24h        │ Juridiq │
│ Incident non résolu J-3              │ P1       │ < 6h         │ Onsite  │
│                                     │          │              │         │
│ Pièce manquante J-7                 │ P2       │ < 24h        │ Agent   │
│ SLA à risque (J-5 d'un jalon)       │ P2       │ < 12h        │ Manager │
│ Relance de communication échouée     │ P2       │ < 12h        │ Agent   │
│ Médiation stagnante >7j              │ P2       │ < 24h        │ Manager │
│                                     │          │              │         │
│ Préparation documentation J-30       │ P3       │ < 48h        │ Agent   │
│ Relance courtesey                    │ P3       │ < 72h        │ Agent   │
└─────────────────────────────────────┴──────────┴──────────────┴─────────┘
```

### Dashboard SLA temps réel

```
Manager Dashboard:
├─ KPI: Total préavis | En temps | À risque | En retard
├─ Ruptures SLA: Nombre et tendance
├─ Alertes P1 ouvertes: Liste et compteur
├─ Solde à recouvrer: Montant total et % collecte
├─ Litiges ouverts: Nombre et durée moyenne
└─ Performance agents: Taux SLA, résolutions rapides
```

---

## Troubleshooting

### Problème: SMS non livré

**Symptôme**: `status: 'failed'` dans communication_events

**Diagnostic**:
```bash
# Vérifie la configuration Twilio
curl -u "TWILIO_SID:AUTH_TOKEN" \
  https://api.twilio.com/2010-04-01/Accounts/{SID}.json

# Consulte les logs
docker logs -f notice-backend 2>&1 | grep "SMS"

# Vérifie le numéro de destination
SELECT recipient_address FROM communication_events 
WHERE channel = 'sms' AND status = 'failed' LIMIT 5;
```

**Solutions**:
1. Vérifie format téléphone (+33 6XXXXXXXX)
2. Vérifie solde Twilio account
3. Vérifie limite débit SMS (100/sec)
4. Relance manuellement: `PATCH /communication-events/:id/retry`

### Problème: Email en spam

**Solution**:
```
1. Configurer SPF: v=spf1 include:sendgrid.net ~all
2. Configurer DKIM: Ajouter clé DNS SendGrid
3. Configurer DMARC: p=quarantine ou p=reject
4. Tester: https://www.mail-tester.com/
5. Monitorer: Dashboard SendGrid > Deliverability
```

### Problème: Calcul dates légales incorrect

**Diagnostic**:
```sql
-- Tester la fonction
SELECT calculate_notice_effective_date(
  CURRENT_TIMESTAMP,
  30,
  false,  -- business days only
  true    -- month end proration
);
```

**Solutions**:
1. Vérifie les paramètres légaux du contrat
2. Vérifie les jours fériés configurés
3. Tester avec valeurs simples d'abord

### Problème: Alerte IA ne se déclenche pas

**Vérifications**:
```bash
# Lance les tâches de maintenance IA
curl -X POST http://localhost:4000/api/ai/maintenance

# Vérifie les logs
docker logs notice-backend | grep "\[IA\]"

# Vérifie le cron job
SELECT * FROM pg_stat_statements WHERE query LIKE '%ai_alerts%';

# Force la création d'une alerte test
curl -X POST http://localhost:4000/api/ai/create-alert \
  -d '{"type":"deadline","severity":"P1"}'
```

### Problème: Performance lente sur dashboard

**Optimisations**:
```sql
-- Ajouter indexes manquants
CREATE INDEX idx_notices_status_effective_date 
  ON notices(status, effective_date DESC);

CREATE INDEX idx_ai_alerts_due_date_status 
  ON ai_alerts(due_date, status);

-- Cache les métriques
ALTER TABLE dashboard_snapshots ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Vérifie les query lentes
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
```

---

## Checklist d'activation "sans angle mort"

### Phase 1: Configuration préalable (2h)

- [ ] PostgreSQL DB créée et accessible
- [ ] Schéma appliqué (`npm run migrate`)
- [ ] Données de test chargées
- [ ] Variables d'environnement complètes (.env)
- [ ] Certificats SSL configurés
- [ ] Domaine DNS pointé

### Phase 2: Services externes (4h)

- [ ] Compte Twilio créé + API key
  - [ ] Numéro SMS configuré
  - [ ] Logs tracking activés
  - [ ] Webhook delivery setup
  
- [ ] Compte Meta WhatsApp configuré
  - [ ] Business App créée
  - [ ] Numéro WhatsApp configuré
  - [ ] Templates approuvés
  
- [ ] Compte SendGrid configuré
  - [ ] SPF/DKIM/DMARC validés
  - [ ] From address verified
  - [ ] Unsubscribe link configured

- [ ] Sentry intégré
  - [ ] DSN produit saisi
  - [ ] Alertes configurées (5% errors, >10 errors/5min)
  
- [ ] GA4 intégré
  - [ ] Property ID configuré
  - [ ] Events trackés

### Phase 3: Contrats & Règles (3h)

- [ ] Contrats de test créés (minimum 5)
- [ ] Paramètres légaux configurés par juridiction
  - [ ] Durée préavis confirmée
  - [ ] Jours ouvrables vs calendaires
  - [ ] Proration fin de mois
  
- [ ] Templates de messages complétés
  - [ ] FR + EN + locales
  - [ ] SMS, Email, WhatsApp, Letter
  - [ ] Variables dynamiques testées
  
- [ ] Règles SLA validées
  - [ ] Jalons J-30, J-15, J-7, J-3, J-1
  - [ ] Seuils d'alerte configurés

### Phase 4: Tests fonctionnels (8h)

- [ ] Création préavis (12 scénarios)
  - [ ] Type autorisé / type refusé
  - [ ] Dates correctes (calendaires vs ouvrables)
  - [ ] Proration appliquée
  
- [ ] Envoi communication (16 scénarios)
  - [ ] SMS (10 téléphones réels)
  - [ ] Email (5 emails réels)
  - [ ] WhatsApp (3 numéros réels)
  - [ ] Letter PDF généré
  - [ ] Traductions FR/EN/locales
  
- [ ] Suivi & alertes (8 scénarios)
  - [ ] Alertes J-30, J-15, J-7, J-3, J-1
  - [ ] Alertes manquement accusé J+1, J+3
  - [ ] SLA escalade testée
  
- [ ] Contestation & médiation (6 scénarios)
  - [ ] Enregistrement contestation
  - [ ] Documents jointa correctement
  - [ ] Workflow médiation fonctionne
  
- [ ] Comptabilité (4 scénarios)
  - [ ] Calcul solde correct
  - [ ] Reçu PDF généré
  - [ ] Échéancier proposé si solde > 1500€
  
- [ ] Clôture (3 scénarios)
  - [ ] Documents obligatoires vérifiés
  - [ ] Archivage fonctionnel
  - [ ] Historique audit complet

### Phase 5: Tests multi-navigateurs (4h)

**Chrome, Firefox, Safari, Edge, iOS Safari, Android Chrome**

- [ ] UI responsive (mobile 320px, tablet, desktop)
- [ ] Tous formulaires fonctionnels
- [ ] Charts affichés correctement
- [ ] Exports PDF/Excel fonctionnent
- [ ] Accessibilité (WCAG 2.1 AA)
  - [ ] Clavier complet
  - [ ] Lecteur écran testé
  - [ ] Contrastes minimum 4.5:1
  - [ ] Focus visible

### Phase 6: Performance (2h)

- [ ] Dashboard charge en <300ms
- [ ] Alertes mises à jour en <100ms
- [ ] Export 1000 préavis en <5s
- [ ] Aucune fuite mémoire (heap stable)
- [ ] Connexions DB poolées (max 20 connections)

### Phase 7: Sécurité & Conformité (3h)

- [ ] HTTPS activé (A+ SSL Rating)
- [ ] Rate limiting: 100 req/min par IP
- [ ] CORS configuré strictement
- [ ] Injection SQL impossible (prepared statements)
- [ ] XSS protection (CSP headers)
- [ ] RGPD:
  - [ ] Consentements enregistrés
  - [ ] Droit à l'oubli implémenté
  - [ ] Export données utilisateur possible
  - [ ] DPA en place avec services externes

### Phase 8: Documentation (1h)

- [ ] README complété
- [ ] Guides opérationnels actualisés
- [ ] Runbooks incident créés (5+)
- [ ] FAQ troubleshooting complétée
- [ ] Team formée (2 sessions)

### Phase 9: Monitoring en production (1h)

- [ ] Alertes Sentry configurées
- [ ] Dashboards Grafana crées (3+)
- [ ] Logs centralisés (ELK stack)
- [ ] Backups automatiques (quotidien)
- [ ] Récupération après sinistre testée

### Phase 10: Lancement progressif (3 jours)

```
Jour 1 (Canary): 10% utilisateurs
├─ Monitoring étroit
├─ Support en attente
└─ Rollback possible

Jour 2 (Phase 2): 50% utilisateurs
├─ Vérifications performance
├─ Collecte feedback
└─ Correction bugs mineurs

Jour 3 (Full): 100% utilisateurs
├─ Communication complète
├─ Support renforcé 24h
└─ Post-mortem planning
```

---

## Validation finale

```bash
# Suite complète de vérifications

# 1. Schema SQL validé
psql -d akig -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# 2. Services externes testés
curl -X POST https://api.twilio.com/test
curl -X POST https://graph.instagram.com/test
curl -X POST https://api.sendgrid.com/test

# 3. Tests Playwright tous passants
npm run test:notice-system

# 4. Performance baselines établis
npm run perf:baseline

# 5. Documentation synchronisée
grep -r "TODO\|FIXME" backend/src frontend/src | wc -l  # doit être 0

# 6. Logs propres
docker logs notice-backend | grep -i error | wc -l  # doit être < 5

# 7. Sauvegardes configurées
pg_dump -d akig -f akig_backup_$(date +%Y%m%d).sql

# 8. Équipe formée
# Vérifier que tous les agents ont accès et ont été formés
```

**Status final**: 🟢 **PRODUCTION READY**

---

## Support & Escalation

```
Urgence (P1):          Support immédiat    → Manager → Director
Haute (P2):           Support < 2h         → Manager
Normale (P3):         Support < 24h        → Agent
Demande de feature:   Backlog              → Product
```

**Contacts principaux**:
- Support ops: ops@akig.com
- Support tech: tech-support@akig.com
- On-call: Consulter PagerDuty
