# 📘 AKIG Expert - Guide Opérationnel Complet

## Table des Matières
1. [Architecture Globale](#architecture-globale)
2. [Modules Métier](#modules-métier)
3. [API Endpoints](#api-endpoints)
4. [IA & Prédictions](#ia--prédictions)
5. [Scoreboard Agents](#scoreboard-agents)
6. [Reporting Financier](#reporting-financier)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Globale

### Stack Technique
```
Frontend (React 18)          Backend (Node/Express)         Database (PostgreSQL)
├── FinanceDashboard    ──→  GET /api/reporting/finance  ──→  View: agency_monthly_revenue
├── AgentsScoreboard    ──→  GET /api/agents/scoreboard  ──→  Tables: agents, payments
├── TenantPayments      ──→  GET /api/reporting/tenant-payments
└── AIAlerts            ──→  GET /api/ai/predictions     ──→  ML baseline_v1
```

### Flux de Données
```
User Login
    ↓
JWT Token (24h expiry)
    ↓
MFA Check (Managers/Admins)
    ↓
Role-based Route Access (AGENT/MANAGER/ADMIN/COMPTABLE)
    ↓
Data Request with Audit Log
    ↓
Database Query
    ↓
Response with Error Handling
```

---

## Modules Métier

### 1. Gestion des Biens (Properties)

**Tables:**
- `properties`: type, quartier, statut, rental_price
- `maintenance_tickets`: tickets par bien

**Statuts:**
- `LIBRE`: disponible à la location
- `LOUE`: actuellement loué
- `LITIGE`: en litige avec locataire
- `MAINTENANCE`: en maintenance

**Exemple Requête:**
```bash
GET /api/properties?agency_id=1&status=LIBRE
```

### 2. Contrats et Baux (Contracts)

**Tables:**
- `contracts`: liens property ↔ tenant ↔ landlord
- `payments`: tous les paiements associés

**Statuts:**
- `ACTIF`: en cours
- `RESILIE`: terminé
- `SUSPENDU`: suspendu temporairement

**Exemple Création:**
```json
POST /api/contracts
{
  "property_id": 5,
  "tenant_id": 12,
  "landlord_id": 3,
  "start_date": "2025-01-01",
  "end_date": "2026-12-31",
  "monthly_rent": 250000,
  "deposit": 500000,
  "notice_days": 30
}
```

### 3. Paiements (Payments) - CRITIQUES

**Caractéristiques:**
- ✅ **Idempotence**: Ref unique pour éviter doublons
- ✅ **Statuts multiples**: PAID, LATE, PARTIAL, DUE, CANCELLED
- ✅ **Méthodes**: CASH, ORANGE (MTN), MTN, VIREMENT, CHEQUE
- ✅ **Audit**: Chaque paiement enregistré + audit log

**Statuts Paiements:**
| Statut | Définition | Scoring Impact |
|--------|-----------|-----------------|
| PAID | Payé à temps | +0 (normal) |
| LATE | Payé en retard | +0.1 risk_score |
| PARTIAL | Paiement incomplet | +0.05 risk_score |
| DUE | Attendu | Neutre |
| CANCELLED | Annulé | Audit log requis |

**Exemple Création (Idempotent):**
```bash
POST /api/payments
{
  "contract_id": 42,
  "amount": 250000,
  "method": "MTN",
  "ref": "PAY_abc123_1699456234",  # Unique!
  "notes": "Paiement Orange Money"
}

# Résultat si duplicate:
{
  "ok": true,
  "duplicate": true,
  "message": "Payment already recorded with this reference",
  "payment_id": 1001
}
```

### 4. Locataires et Scoring (Tenants)

**Scoring Risque:**
```
risk_score = f(pay_ratio, late_ratio, partial_ratio)

probability = 0.7 * pay_ratio 
            + 0.2 * (1 - late_ratio) 
            + 0.1 * (1 - partial_ratio)

Clamped to [0.05, 0.95]
```

**Niveaux Risque:**
| Probabilité | Niveau | Couleur | Action |
|------------|--------|--------|--------|
| >= 0.8 | LOW | 🟢 Vert | Info mensuelle |
| 0.6-0.8 | MEDIUM | 🟡 Jaune | Rappel J-5 |
| 0.4-0.6 | HIGH | 🟠 Orange | Escalade multi-canaux |
| < 0.4 | CRITICAL | 🔴 Rouge | Intervention urgente |

### 5. Propriétaires (Landlords)

**Versements:**
- Versement = Revenu - Frais Gestion (%) - Coûts
- `management_fee_percent`: déduction automatique
- `iban`: pour virements bancaires

**Reporting Propriétaire:**
```bash
GET /api/reporting/landlord/:id?range=3m
{
  "period": "3m",
  "revenue_collected": 750000,
  "management_fees": 75000,
  "net_to_landlord": 675000,
  "breakdown": {
    "property_1": 400000,
    "property_2": 275000
  }
}
```

---

## API Endpoints

### Authentification

```bash
# Login
POST /api/auth/login
{
  "email": "agent@akig.gu",
  "password": "..."
}
→ { "token": "eyJhb...", "user": {...} }

# Refresh token (7j validity)
POST /api/auth/refresh
{ "refresh_token": "..." }
→ { "token": "new_jwt..." }
```

### Paiements

```bash
# Créer paiement (idempotent)
POST /api/payments
{
  "contract_id": 1,
  "amount": 250000,
  "method": "MTN",
  "ref": "unique_reference"
}

# Lister paiements
GET /api/payments?contract_id=1&status=PAID&from_date=2025-01-01

# Détail
GET /api/payments/:id

# Mettre à jour (Manager/Comptable)
PUT /api/payments/:id
{ "status": "PAID", "notes": "..." }

# Annuler (soft delete)
DELETE /api/payments/:id
```

### Reporting Financier

```bash
# Vue financière multi-périodes
GET /api/reporting/finance?agency_id=1&range=1m|3m|6m|12m
→ {
  "period": { "range": "3m", "start_date": "...", "end_date": "..." },
  "income": { "total": 750000, "payment_count": 3, "late_count": 1 },
  "costs": { "management_fee": 75000, "salaries": 100000, "maintenance": 25000, "total": 200000 },
  "summary": { "total_income": 750000, "total_costs": 200000, "net_revenue": 550000, "margin_percent": 73 }
}

# Performance agents
GET /api/agents-expert/scoreboard?agency_id=1
→ [{ "name": "Ali", "total_collected": 500000, "success_rate_percent": 95, "score": 1250 }, ...]

# Détail paiements locataire
GET /api/reporting/tenant-payments?tenant_id=5&agency_id=1
→ {
  "tenant_id": 5,
  "statistics": { "total_payments": 24, "paid_count": 22, "late_count": 2, "reliability_percent": 92 },
  "payments": [{ "due_date": "2025-01-01", "paid_date": "2025-01-02", "amount": 250000, "status": "LATE" }, ...]
}

# Historique mensuel
GET /api/reporting/agency-monthly?agency_id=1
→ { "months": [{ "month": "2025-01", "revenue": 750000, "costs": 200000, "net": 550000 }, ...] }
```

### IA & Prédictions

```bash
# Prédictions pour tous les locataires
GET /api/ai/predictions/tenants?agency_id=1
→ {
  "count": 25,
  "at_risk": 5,
  "predictions": [{
    "tenant_id": 5,
    "tenant_name": "Ali",
    "probability": 0.72,
    "probability_percent": 72,
    "risk_level": "MEDIUM",
    "risk_factors": { "pay_ratio": 0.85, "late_ratio": 0.08 },
    "recommended_actions": [
      {
        "type": "Préventif",
        "priority": "MEDIUM",
        "action": "Rappel 5 jours avant échéance",
        "contact_method": "SMS_WHATSAPP",
        "timing": "J-5"
      }
    ]
  }, ...]
}

# Prédiction pour un locataire
GET /api/ai/predictions/tenant/:id
→ { "tenant_id": 5, "probability": 0.72, "recommended_actions": [...] }

# Sauvegarder prédictions (tracking)
POST /api/ai/predictions/save
{ "tenant_id": 5, "probability": 0.72, "risk_factors": {...} }
```

### Agents

```bash
# Scoreboard agents
GET /api/agents-expert/scoreboard?agency_id=1
→ {
  "count": 8,
  "agents": [...],
  "summary": {
    "total_collected": 4000000,
    "avg_success_rate": 88,
    "on_target_count": 6,
    "top_agent": { "name": "Ali", "total_collected": 600000 }
  }
}

# Mettre à jour score (gamification)
POST /api/agents-expert/:id/score
{ "delta": 50, "reason": "Bonus January target achieved" }
→ { "ok": true, "agent_id": 1, "new_score": 1300 }
```

---

## IA & Prédictions

### Modèle Baseline V1

**Formule:**
```
probability = min(0.95, max(0.05, 
  0.7 * pay_ratio + 
  0.2 * (1 - late_ratio) + 
  0.1 * (1 - partial_ratio)
))
```

**Facteurs:**
- `pay_ratio`: % paiements reçus / total
- `late_ratio`: % paiements en retard / total
- `partial_ratio`: % paiements partiels / total

**Exemples:**
```
Locataire fiable (95% paiements à temps):
  probability = 0.7*0.95 + 0.2*0.05 + 0.1*0 = 0.675 + 0.01 = 0.685 → 69%

Locataire à risque (50% paiements, 30% retards):
  probability = 0.7*0.5 + 0.2*0.7 + 0.1*0 = 0.35 + 0.14 = 0.49 → 49%

Locataire critique (20% paiements, 60% retards):
  probability = 0.7*0.2 + 0.2*0.4 + 0.1*0.1 = 0.14 + 0.08 + 0.01 = 0.23 → 23%
```

### Actions Prescriptives

**Par Niveau de Risque:**

| Probability | Action | Timing | Méthode |
|------------|--------|--------|---------|
| >= 0.80 | Aucune | Mensuel | Info |
| 0.60-0.80 | Rappel | J-5 | SMS/WhatsApp |
| 0.40-0.60 | Escalade | J-7, J-5, J-3 | SMS→WhatsApp→Appel |
| < 0.40 | Urgent | J+0 | Appel + Visite |

**Si Pattern (>3 retards):**
- 🚩 Alerte automatique
- 👤 Escalader au Manager
- 📋 Envisager renegociation

---

## Scoreboard Agents

### Métriques

```
Chaque agent a:
- Total Encaissé (derniers 30j)
- Paiements OK (count)
- Retards (count)
- Taux Réussite = Paiements OK / Total Paiements
- Délai moyen = avg(paid_date - due_date)
- Objectif mensuel (configurable par zone)
- Score gamification (additionné par achievements)
```

### Statuts Objectif

```
% Achievement   Status
>= 100%        OBJECTIF_ATTEINT ✅
80-99%         BON 👍
50-79%         MOYEN ⚠️
< 50%          INSUFFISANT ❌
```

### Gamification

**Points Score:**
- +100: Objectif mensuel atteint
- +50: Taux réussite > 90%
- +25: Zéro retard mois
- -20: Retard détecté
- -100: Perte confiance client

---

## Reporting Financier

### Périodes Support

```
1m  = 1 mois (30j)
3m  = 3 mois (90j)
6m  = 6 mois (180j)
12m = 12 mois (365j)
```

### Breakdown Coûts

```
Management Fee     = % du loyer collecté
Salaries          = Masse salariale agence
Maintenance Cost  = Interventions, réparations
Utilities         = Eau, électricité, internet
Other Costs       = Misc
```

### KPI Clés

```
✅ Margin = (Revenue - Costs) / Revenue × 100
✅ Collection Rate = Payments Received / Due × 100
✅ Days Sales Outstanding (DSO) = avg(paid_date - due_date)
✅ Loss Rate = (Late + Partial + Cancelled) / Total × 100
```

---

## Troubleshooting

### ❌ "Config manquante"

```bash
# Vérifier .env
DATABASE_URL=postgresql://user:pass@localhost:5432/akig_db
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:3000
```

### ❌ "ECONNREFUSED" - PostgreSQL

```bash
# Vérifier PostgreSQL running
sudo service postgresql status

# Ou créer DB:
createdb akig_db
psql akig_db < migrations/002_akig_expert_schema.sql
```

### ❌ "API /payments returning 400"

```
Vérifier:
1. contract_id existe? SELECT id FROM contracts WHERE id = X
2. amount > 0?
3. method IN ('CASH','ORANGE','MTN','VIREMENT','CHEQUE')?
4. ref unique? SELECT COUNT(*) FROM payments WHERE ref = 'X'
```

### ❌ "Token expired"

```bash
# Nouvelle authentification
POST /api/auth/login
{
  "email": "...",
  "password": "..."
}

# Ou rafraîchir:
POST /api/auth/refresh
{ "refresh_token": "..." }
```

### ❌ "Prédiction non disponible"

```
Si /api/ai/predictions/tenant/:id retourne 404:
1. Vérifier tenant_id existe
2. Vérifier contracts pour ce tenant
3. Vérifier payments pour ces contracts
4. Models nécessitent >= 1 paiement historique
```

---

## Checklist Déploiement

- [ ] PostgreSQL running
- [ ] .env configured (DATABASE_URL, JWT_SECRET)
- [ ] Migrations applied: `002_akig_expert_schema.sql`
- [ ] Backend: `npm install && npm start`
- [ ] Frontend: `npm install && npm start`
- [ ] Tests: `npm run test smoke.spec.ts`
- [ ] Health check: `curl http://localhost:4000/api/health`
- [ ] FinanceDashboard loads
- [ ] AgentsScoreboard populated
- [ ] AI predictions available

---

**Dernier Update:** 2025-01-06  
**Version:** 1.0 Expert Complete  
**Support:** contact@akig.gu
