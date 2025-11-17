# 🔌 API Integration Guide - AKIG Expert

## Overview

La plateforme AKIG expose une API REST complète pour la gestion immobilière en Guinée. Tous les endpoints sont préfixés par `/api` et requièrent une authentification JWT.

---

## Authentication

### 1. Obtenir un Token

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@akig.gu",
    "password": "password123"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "agent@akig.gu",
    "name": "Agent Ali",
    "role": "AGENT",
    "agency_id": 1
  }
}
```

### 2. Utiliser le Token

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:4000/api/reporting/finance?agency_id=1&range=1m
```

### 3. MFA (Managers/Admins, Production Only)

```bash
curl -X GET http://localhost:4000/api/agents-expert/scoreboard?agency_id=1 \
  -H "Authorization: Bearer ..." \
  -H "X-MFA-Token: 123456"  # 6-digit TOTP
```

---

## Core Endpoints

### Payments API

#### POST /api/payments - Créer Paiement (Idempotent)

```bash
curl -X POST http://localhost:4000/api/payments \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": 42,
    "amount": 250000,
    "method": "MTN",
    "ref": "PAY_abc123_1699456234",
    "notes": "Orange Money GN"
  }'

# Success Response (201):
{
  "ok": true,
  "payment": {
    "id": 1001,
    "contract_id": 42,
    "amount": 250000,
    "method": "MTN",
    "status": "PAID",
    "ref": "PAY_abc123_1699456234",
    "due_date": "2025-01-01",
    "paid_date": "2025-01-01",
    "created_at": "2025-01-06T10:30:00Z"
  },
  "status_code": "PAID"
}

# Duplicate Response (200):
{
  "ok": true,
  "duplicate": true,
  "message": "Payment already recorded with this reference",
  "payment_id": 1001
}

# Error Responses:
{
  "error": "Missing required fields",
  "required": ["contract_id", "amount", "method"]
}

{
  "error": "Invalid payment method",
  "allowed": ["CASH", "ORANGE", "MTN", "VIREMENT", "CHEQUE"]
}
```

#### GET /api/payments - Lister Paiements

```bash
curl "http://localhost:4000/api/payments?contract_id=42&status=PAID&from_date=2025-01-01" \
  -H "Authorization: Bearer ..."

# Response:
{
  "count": 3,
  "payments": [
    {
      "id": 1001,
      "contract_id": 42,
      "due_date": "2025-01-01",
      "paid_date": "2025-01-01",
      "amount": 250000,
      "method": "MTN",
      "status": "PAID",
      "ref": "PAY_abc123_1699456234",
      "created_at": "2025-01-06T10:30:00Z"
    }
  ]
}
```

#### GET /api/payments/:id - Détail Paiement

```bash
curl http://localhost:4000/api/payments/1001 \
  -H "Authorization: Bearer ..."

# Response:
{
  "id": 1001,
  "contract_id": 42,
  "amount": 250000,
  ...
}
```

#### PUT /api/payments/:id - Mettre à Jour

```bash
curl -X PUT http://localhost:4000/api/payments/1001 \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "notes": "Reçu en espèces"
  }'
```

#### DELETE /api/payments/:id - Annuler

```bash
curl -X DELETE http://localhost:4000/api/payments/1001 \
  -H "Authorization: Bearer ..."

# Response:
{
  "ok": true,
  "payment": {
    "id": 1001,
    "status": "CANCELLED",
    "updated_at": "2025-01-06T11:00:00Z"
  }
}
```

---

### Reporting API

#### GET /api/reporting/finance - Financier Multi-Périodes

```bash
curl "http://localhost:4000/api/reporting/finance?agency_id=1&range=3m" \
  -H "Authorization: Bearer ..."

# Response:
{
  "period": {
    "range": "3m",
    "months": 3,
    "start_date": "2024-10-06",
    "end_date": "2025-01-06"
  },
  "income": {
    "total": 750000,
    "payment_count": 3,
    "late_count": 1,
    "partial_count": 0
  },
  "costs": {
    "management_fee": 75000,
    "salaries": 100000,
    "maintenance": 25000,
    "utilities": 15000,
    "other_costs": 10000,
    "total": 225000
  },
  "summary": {
    "total_income": 750000,
    "total_costs": 225000,
    "net_revenue": 525000,
    "margin_percent": 70
  }
}
```

**Paramètres:**
- `agency_id` (requis): Agence
- `range` (optional): `1m` | `3m` | `6m` | `12m` (défaut: 1m)

#### GET /api/reporting/agent-performance - Performance Agents

```bash
curl "http://localhost:4000/api/reporting/agent-performance?agency_id=1" \
  -H "Authorization: Bearer ..."

# Response:
{
  "count": 3,
  "agents": [
    {
      "id": 5,
      "agent_name": "Ali",
      "email": "ali@akig.gu",
      "total_collected": 600000,
      "payments_ok": 6,
      "late_count": 1,
      "partial_count": 0,
      "success_rate_percent": 86,
      "goals": { "monthly_target": 500000 }
    }
  ]
}
```

#### GET /api/reporting/tenant-payments - Détail Locataire

```bash
curl "http://localhost:4000/api/reporting/tenant-payments?tenant_id=5&agency_id=1" \
  -H "Authorization: Bearer ..."

# Response:
{
  "tenant_id": 5,
  "statistics": {
    "total_payments": 24,
    "paid_count": 22,
    "late_count": 2,
    "partial_count": 0,
    "reliability_percent": 92,
    "total_amount": 6000000
  },
  "payments": [
    {
      "id": 1001,
      "due_date": "2025-01-01",
      "paid_date": "2025-01-02",
      "amount": 250000,
      "method": "MTN",
      "status": "LATE",
      "days_late": 1,
      "ref": "PAY_abc123_..."
    }
  ]
}
```

#### GET /api/reporting/agency-monthly - Historique Mensuel

```bash
curl "http://localhost:4000/api/reporting/agency-monthly?agency_id=1" \
  -H "Authorization: Bearer ..."

# Response:
{
  "agency_id": 1,
  "months": [
    {
      "month": "2025-01-01",
      "payment_count": 3,
      "revenue": 750000,
      "costs": 225000,
      "net": 525000
    },
    {
      "month": "2024-12-01",
      "payment_count": 2,
      "revenue": 500000,
      "costs": 200000,
      "net": 300000
    }
  ]
}
```

---

### AI Predictions API

#### GET /api/ai/predictions/tenants - Tous Locataires

```bash
curl "http://localhost:4000/api/ai/predictions/tenants?agency_id=1" \
  -H "Authorization: Bearer ..."

# Response:
{
  "agency_id": 1,
  "count": 25,
  "at_risk": 5,
  "predictions": [
    {
      "tenant_id": 5,
      "tenant_name": "Ali",
      "phone": "+224 61234567",
      "email": "ali@example.gu",
      "probability": 0.72,
      "probability_percent": 72,
      "risk_level": "MEDIUM",
      "risk_factors": {
        "pay_ratio": 0.92,
        "late_ratio": 0.08,
        "partial_ratio": 0,
        "total_payments": 12
      },
      "risk_score": 0.5,
      "recommended_actions": [
        {
          "type": "Préventif",
          "priority": "MEDIUM",
          "action": "Rappel 5 jours avant échéance",
          "contact_method": "SMS_WHATSAPP",
          "timing": "J-5"
        }
      ],
      "model_version": "baseline_v1",
      "created_at": "2025-01-06T10:30:00Z"
    }
  ]
}
```

#### GET /api/ai/predictions/tenant/:id - Détail Locataire

```bash
curl "http://localhost:4000/api/ai/predictions/tenant/5" \
  -H "Authorization: Bearer ..."

# Response:
{
  "tenant_id": 5,
  "tenant_name": "Ali",
  "phone": "+224 61234567",
  "email": "ali@example.gu",
  "probability": 0.72,
  "probability_percent": 72,
  "risk_level": "MEDIUM",
  "statistics": {
    "total_payments": 24,
    "paid_count": 22,
    "late_count": 2,
    "partial_count": 0,
    "avg_days_late": 3
  },
  "risk_factors": {
    "pay_ratio": 0.92,
    "late_ratio": 0.08,
    "partial_ratio": 0,
    "risk_score": 0.5
  },
  "recommended_actions": [
    {
      "type": "Préventif",
      "priority": "MEDIUM",
      "action": "Rappel 5 jours avant échéance",
      "contact_method": "SMS_WHATSAPP",
      "timing": "J-5"
    },
    {
      "type": "Alerte",
      "priority": "HIGH",
      "action": "⚠️ Pattern de retards confirmé",
      "description": "2 retards enregistrés. Comportement systématique."
    }
  ],
  "model_version": "baseline_v1"
}
```

#### POST /api/ai/predictions/save - Sauvegarder

```bash
curl -X POST http://localhost:4000/api/ai/predictions/save \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": 5,
    "probability": 0.72,
    "risk_factors": {
      "pay_ratio": 0.92,
      "late_ratio": 0.08
    }
  }'

# Response:
{
  "id": 1001,
  "tenant_id": 5,
  "period_start": "2025-01-06",
  "period_end": "2025-02-05",
  "probability": 0.72,
  "risk_factors": {...},
  "model_version": "baseline_v1",
  "created_at": "2025-01-06T10:30:00Z"
}
```

---

### Agents API

#### GET /api/agents-expert/scoreboard - Scoreboard

```bash
curl "http://localhost:4000/api/agents-expert/scoreboard?agency_id=1" \
  -H "Authorization: Bearer ..."

# Response:
{
  "agency_id": 1,
  "count": 5,
  "agents": [
    {
      "id": 1,
      "name": "Ali",
      "email": "ali@akig.gu",
      "role": "AGENT",
      "zone": "Lambagni",
      "active": true,
      "performance": {
        "total_collected": 600000,
        "payments_ok": 6,
        "late_count": 1,
        "partial_count": 0,
        "success_rate_percent": 86,
        "avg_days_delay": 2,
        "contracts_managed": 10
      },
      "targets": {
        "monthly_target": 500000,
        "current_achievement": 600000,
        "achievement_percent": 120,
        "status": "OBJECTIF_ATTEINT"
      },
      "score": 1250
    }
  ],
  "summary": {
    "total_collected": 3200000,
    "avg_success_rate": 84,
    "on_target_count": 3,
    "top_agent": { "id": 1, "name": "Ali", "total_collected": 600000 }
  }
}
```

#### POST /api/agents-expert/:id/score - Mettre à Jour Score

```bash
curl -X POST http://localhost:4000/api/agents-expert/1/score \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "delta": 50,
    "reason": "Bonus January target achieved"
  }'

# Response:
{
  "ok": true,
  "agent_id": 1,
  "new_score": 1300,
  "reason": "Bonus January target achieved"
}
```

---

## Error Handling

### Error Format

```json
{
  "error": "Error message",
  "details": "Additional context",
  "code": "ERROR_CODE"
}
```

### Common Errors

| Code | Status | Message |
|------|--------|---------|
| MISSING_AUTH | 401 | Missing authorization header |
| INVALID_TOKEN | 401 | Invalid or expired token |
| FORBIDDEN | 403 | Permission denied |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| RATE_LIMIT | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

```
Default: 100 requests per 60 seconds per user/IP

Response Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
```

---

## Best Practices

### 1. Idempotence

```bash
# TOUJOURS inclure ref unique pour POST /payments
{
  "contract_id": 42,
  "amount": 250000,
  "method": "MTN",
  "ref": "PAY_${uuid}_${timestamp}"  # Unique!
}

# Permet retry safe
```

### 2. Pagination

```bash
# Futur: support pagination
GET /api/payments?page=1&limit=50
```

### 3. Filters

```bash
# Utiliser query params pour filtrer
GET /api/payments?contract_id=42&status=PAID&from_date=2025-01-01
```

### 4. Error Handling

```javascript
async function makePayment(payment) {
  try {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payment)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }

    if (res.status === 200 && (await res.json()).duplicate) {
      console.warn('Payment already recorded');
      return;
    }

    return await res.json();
  } catch (err) {
    console.error('Payment failed:', err);
    throw err;
  }
}
```

---

## Testing

```bash
# Health check
curl http://localhost:4000/api/health

# Ready check
curl http://localhost:4000/api/ready

# Sample workflow
1. POST /auth/login → get token
2. POST /payments → create payment
3. GET /reporting/finance → check financials
4. GET /ai/predictions/tenants → check at-risk
5. GET /agents-expert/scoreboard → check performance
```

---

**Version:** 1.0  
**Last Updated:** 2025-01-06  
**Support:** api-support@akig.gu
