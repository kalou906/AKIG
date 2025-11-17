# 📊 AKIG Data Schema Reference

## Tables Core

### agencies
```sql
id SERIAL PRIMARY KEY
name TEXT (ex: "AKIG Conakry")
city TEXT (ex: "Conakry")
phone TEXT
email TEXT
created_at TIMESTAMP
```

### users
```sql
id SERIAL PRIMARY KEY
email TEXT UNIQUE
name TEXT
role TEXT CHECK (IN 'AGENT','MANAGER','ADMIN','COMPTABLE')
agency_id INT FK agencies
password_hash TEXT (bcrypt)
mfa_enabled BOOLEAN
mfa_secret TEXT (TOTP secret)
last_login TIMESTAMP
locked_until TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP

INDEXES:
- idx_users_agency
- idx_users_email
```

### agents
```sql
id SERIAL PRIMARY KEY
user_id INT UNIQUE FK users
zone TEXT (ex: "Lambagni", "Kipé")
goals JSONB
  {
    "monthly_target": 50000000,
    "zones": ["Lambagni", "Kipé"]
  }
score NUMERIC DEFAULT 0 (gamification)
active BOOLEAN DEFAULT true
created_at TIMESTAMP

INDEXES:
- idx_agents_user
```

### properties
```sql
id SERIAL PRIMARY KEY
agency_id INT FK agencies
type TEXT CHECK (IN 'MAISON','APPART','TERRAIN','IMMEUBLE')
quartier TEXT (ex: "Lambagni", "Kipé", "Carrière")
address TEXT
status TEXT CHECK (IN 'LIBRE','LOUE','LITIGE','MAINTENANCE')
rental_price NUMERIC (loyer mensuel)
docs JSONB (liens documents)
  {
    "title_deed": "https://...",
    "photos": ["url1", "url2"],
    "certificate": "..."
  }
created_at TIMESTAMP
updated_at TIMESTAMP

INDEXES:
- idx_properties_agency
- idx_properties_status
```

### tenants
```sql
id SERIAL PRIMARY KEY
agency_id INT FK agencies
name TEXT
phone TEXT
email TEXT
guarantor TEXT (nom du garant)
guarantor_phone TEXT
id_number TEXT (ID carte)
risk_score NUMERIC DEFAULT 0 (0..1)
payment_history JSONB
  [
    {"date": "2024-12-01", "amount": 250000, "status": "PAID"},
    {"date": "2024-11-01", "amount": 250000, "status": "LATE", "days": 3}
  ]
created_at TIMESTAMP
updated_at TIMESTAMP

INDEXES:
- idx_tenants_agency
```

### landlords
```sql
id SERIAL PRIMARY KEY
agency_id INT FK agencies
name TEXT
phone TEXT
email TEXT
iban TEXT (pour virements)
management_fee_percent NUMERIC (ex: 10.0)
created_at TIMESTAMP

NOTE: Propriétaires qui reçoivent versements
```

### contracts
```sql
id SERIAL PRIMARY KEY
property_id INT FK properties
tenant_id INT FK tenants
landlord_id INT FK landlords
start_date DATE
end_date DATE (nullable = indefinite)
notice_days INT DEFAULT 30 (préavis avant résiliation)
deposit NUMERIC (dépôt garantie)
monthly_rent NUMERIC
status TEXT CHECK (IN 'ACTIF','RESILIE','SUSPENDU')
auto_renew BOOLEAN DEFAULT false
versions JSONB (historique avenants)
  [
    {
      "version": 1,
      "date": "2024-01-01",
      "changes": {"monthly_rent": 250000},
      "hash": "sha256..."
    }
  ]
created_at TIMESTAMP
updated_at TIMESTAMP

INDEXES:
- idx_contracts_property
- idx_contracts_tenant
- idx_contracts_status
```

### payments
```sql
id SERIAL PRIMARY KEY
contract_id INT FK contracts
due_date DATE
paid_date DATE (nullable si pas encore payé)
amount NUMERIC
method TEXT CHECK (IN 'CASH','ORANGE','MTN','VIREMENT','CHEQUE')
status TEXT CHECK (IN 'DUE','PAID','LATE','PARTIAL','CANCELLED')
ref TEXT UNIQUE (idempotence key)
notes TEXT
created_at TIMESTAMP
updated_at TIMESTAMP

CONSTRAINTS:
- ref UNIQUE (éviter doublons)

INDEXES:
- idx_payments_contract
- idx_payments_status
- idx_payments_due_date
```

### agency_costs
```sql
id SERIAL PRIMARY KEY
agency_id INT FK agencies
month DATE (premier jour du mois, ex: 2025-01-01)
management_fee NUMERIC
salaries NUMERIC
maintenance_cost NUMERIC
utilities NUMERIC
other_costs NUMERIC
created_at TIMESTAMP
updated_at TIMESTAMP

CONSTRAINTS:
- UNIQUE (agency_id, month)

INDEXES:
- idx_agency_costs_agency_month
```

### tenant_payment_predictions
```sql
id SERIAL PRIMARY KEY
tenant_id INT FK tenants
period_start DATE
period_end DATE
probability NUMERIC CHECK (>= 0 AND <= 1)
risk_factors JSONB
  {
    "pay_ratio": 0.92,
    "late_ratio": 0.08,
    "partial_ratio": 0
  }
model_version TEXT (ex: "baseline_v1")
created_at TIMESTAMP

INDEXES:
- idx_predictions_tenant
```

### maintenance_tickets
```sql
id SERIAL PRIMARY KEY
property_id INT FK properties
tenant_id INT FK tenants (nullable = maintenance gestion)
category TEXT CHECK (IN 'PLOMBERIE','ELECTRICITE','SECURITE','AUTRE')
description TEXT
status TEXT CHECK (IN 'OUVERT','EN_COURS','RESOLU','REFUSE')
cost NUMERIC
created_at TIMESTAMP
resolved_at TIMESTAMP
```

### disputes
```sql
id SERIAL PRIMARY KEY
contract_id INT FK contracts
tenant_id INT FK tenants
description TEXT
status TEXT CHECK (IN 'OUVERT','MEDIATION','ARBITRAGE','RESOLU','REJETE')
evidence JSONB (messages, PV, photos)
  [
    {"type": "message", "content": "...", "date": "2025-01-01"},
    {"type": "photo", "url": "...", "date": "2025-01-02"}
  ]
created_at TIMESTAMP
resolved_at TIMESTAMP
```

### audit_logs
```sql
id SERIAL PRIMARY KEY
user_id INT FK users
action TEXT (ex: "CREATE", "UPDATE", "DELETE", "POST /payments")
resource_type TEXT (ex: "payments", "contracts")
resource_id INT
details JSONB
ip_address TEXT
created_at TIMESTAMP

INDEXES:
- idx_audit_user
- idx_audit_created

NOTE: Immuable - audit trail pour compliance
```

---

## Views (Reporting)

### agency_monthly_revenue
```sql
SELECT 
  agency_id,
  name,
  month,
  payment_count,
  total_revenue,
  net_revenue
FROM agencies
JOIN properties ON ...
JOIN contracts ON ...
JOIN payments ON ...
GROUP BY month
```

### tenant_risk_profile
```sql
SELECT 
  tenant_id,
  name,
  total_payments,
  pay_ratio,
  late_count,
  reliability_percent
FROM tenants
JOIN contracts ON ...
JOIN payments ON ...
GROUP BY tenant_id
```

### agent_performance
```sql
SELECT 
  agent_id,
  agent_name,
  total_collected,
  payments_ok,
  late_count,
  success_rate_percent
FROM agents
JOIN users ON ...
JOIN properties ON ...
JOIN contracts ON ...
JOIN payments ON ...
GROUP BY agent_id
```

---

## Data Types Reference

| Type | Usage | Example |
|------|-------|---------|
| SERIAL | Auto-increment ID | `id SERIAL PRIMARY KEY` |
| TEXT | Strings illimitées | `name TEXT` |
| NUMERIC | Argent précis | `NUMERIC(15,2)` |
| DATE | Dates sans heure | `2025-01-06` |
| TIMESTAMP | Date + heure | `2025-01-06T10:30:00Z` |
| BOOLEAN | Vrai/Faux | `true` / `false` |
| JSONB | JSON structuré | `{"key": "value"}` |
| INT | Entier | `123` |

---

## Relationships

```
agencies (1) ──→ (N) users
agencies (1) ──→ (N) properties
agencies (1) ──→ (N) agents
agencies (1) ──→ (N) tenants
agencies (1) ──→ (N) agency_costs

users (1) ──→ (1) agents (user_id UNIQUE)

properties (1) ──→ (N) contracts
tenants (1) ──→ (N) contracts
landlords (1) ──→ (N) contracts

contracts (1) ──→ (N) payments
tenants (1) ──→ (N) tenant_payment_predictions

properties (1) ──→ (N) maintenance_tickets
contracts (1) ──→ (N) disputes

users (1) ──→ (N) audit_logs
```

---

## Sample Data

### Agency
```json
{
  "id": 1,
  "name": "AKIG Démo",
  "city": "Conakry",
  "phone": "+224 6XX XXXXX",
  "email": "demo@akig.gu"
}
```

### User (Agent)
```json
{
  "id": 101,
  "email": "ali@akig.gu",
  "name": "Ali Ahmed",
  "role": "AGENT",
  "agency_id": 1,
  "password_hash": "$2b$10$...",
  "mfa_enabled": false,
  "created_at": "2024-12-01T00:00:00Z"
}
```

### Property
```json
{
  "id": 201,
  "agency_id": 1,
  "type": "APPART",
  "quartier": "Lambagni",
  "address": "123 Rue de Conakry",
  "status": "LOUE",
  "rental_price": 250000,
  "docs": {
    "title_deed": "https://s3.../deed.pdf",
    "photos": ["https://s3.../photo1.jpg"]
  }
}
```

### Tenant
```json
{
  "id": 301,
  "agency_id": 1,
  "name": "Fatoumata Diallo",
  "phone": "+224 61234567",
  "email": "fatoumata@example.gu",
  "guarantor": "Mamadou Diallo",
  "guarantor_phone": "+224 62345678",
  "id_number": "GN123456789",
  "risk_score": 0.15
}
```

### Contract
```json
{
  "id": 401,
  "property_id": 201,
  "tenant_id": 301,
  "landlord_id": 501,
  "start_date": "2024-12-01",
  "end_date": "2026-12-01",
  "monthly_rent": 250000,
  "deposit": 500000,
  "notice_days": 30,
  "status": "ACTIF",
  "auto_renew": true
}
```

### Payment
```json
{
  "id": 601,
  "contract_id": 401,
  "due_date": "2025-01-01",
  "paid_date": "2025-01-01",
  "amount": 250000,
  "method": "MTN",
  "status": "PAID",
  "ref": "PAY_abc123_1699456234",
  "notes": "Orange Money GN"
}
```

### Agency Costs
```json
{
  "id": 701,
  "agency_id": 1,
  "month": "2025-01-01",
  "management_fee": 75000,
  "salaries": 100000,
  "maintenance_cost": 25000,
  "utilities": 15000,
  "other_costs": 10000
}
```

### Prediction
```json
{
  "id": 801,
  "tenant_id": 301,
  "period_start": "2025-01-06",
  "period_end": "2025-02-05",
  "probability": 0.72,
  "risk_factors": {
    "pay_ratio": 0.92,
    "late_ratio": 0.08,
    "partial_ratio": 0
  },
  "model_version": "baseline_v1"
}
```

---

## Query Examples

### Revenue par Mois
```sql
SELECT 
  DATE_TRUNC('month', p.paid_date)::date as month,
  COUNT(*) as payment_count,
  SUM(p.amount) as revenue
FROM payments p
WHERE p.status = 'PAID'
GROUP BY month
ORDER BY month DESC;
```

### Locataires à Risque
```sql
SELECT 
  t.id, t.name, t.risk_score,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.status = 'LATE' THEN 1 ELSE 0 END) as late_count
FROM tenants t
LEFT JOIN contracts c ON c.tenant_id = t.id
LEFT JOIN payments p ON p.contract_id = c.id
WHERE t.risk_score > 0.5
GROUP BY t.id
ORDER BY t.risk_score DESC;
```

### Performance Agents
```sql
SELECT 
  a.id, u.name,
  SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END) as collected,
  COUNT(CASE WHEN p.status = 'PAID' THEN 1 END) as payments_ok,
  ROUND(COUNT(CASE WHEN p.status = 'PAID' THEN 1 END)::float / COUNT(p.id) * 100) as success_rate
FROM agents a
JOIN users u ON u.id = a.user_id
LEFT JOIN properties pr ON pr.agency_id = u.agency_id
LEFT JOIN contracts c ON c.property_id = pr.id
LEFT JOIN payments p ON p.contract_id = c.id
GROUP BY a.id, u.name
ORDER BY collected DESC;
```

---

## Constraints & Validations

| Table | Field | Constraint |
|-------|-------|-----------|
| users | email | UNIQUE NOT NULL |
| users | role | CHECK IN (...) |
| properties | type | CHECK IN (...) |
| properties | status | CHECK IN (...) |
| tenants | agency_id | FK NOT NULL |
| contracts | monthly_rent | > 0 |
| payments | ref | UNIQUE NOT NULL |
| payments | amount | > 0 |
| agency_costs | agency_id, month | UNIQUE |

---

## Migration Order

1. Create agencies
2. Create users (FK agencies)
3. Create agents (FK users)
4. Create properties (FK agencies)
5. Create tenants (FK agencies)
6. Create landlords (FK agencies)
7. Create contracts (FK properties, tenants, landlords)
8. Create payments (FK contracts)
9. Create agency_costs (FK agencies)
10. Create tenant_payment_predictions (FK tenants)
11. Create maintenance_tickets (FK properties, tenants)
12. Create disputes (FK contracts, tenants)
13. Create audit_logs (FK users)
14. Create VIEWs for reporting
15. Create INDEXes for performance

---

**Last Updated:** 2025-01-06  
**Version:** 1.0 Expert Schema
