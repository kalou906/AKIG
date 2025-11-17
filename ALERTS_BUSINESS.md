# Système d'Alertes Métier

## Vue d'ensemble

Le système d'alertes AKIG monitore en temps réel les métriques critiques et déclenche des notifications aux administrateurs en cas de seuil dépassé.

## Architecture

```
┌──────────────────┐
│   Application    │
│   (Services)     │
└────────┬─────────┘
         │
    ┌────▼──────────────────┐
    │ Alert Service         │
    │ (Real-time metrics)   │
    └────┬──────────────────┘
         │
    ┌────▼───────────────────────┐
    │ Threshold Comparison       │
    │ (vs ALERT_THRESHOLDS)      │
    └────┬───────────────────────┘
         │
    ┌────▼──────────────────┐
    │ Alert Trigger        │
    ├──────────────────────┤
    │ ├─ Slack             │
    │ ├─ Email             │
    │ ├─ SMS               │
    │ └─ Webhooks          │
    └──────────────────────┘
```

## Seuils d'alerte

### 1. Paiements

```javascript
PAYMENT_FAIL_RATE: {
  threshold: 50,          // 50 échecs
  window: 3600000,        // En 1 heure
  description: 'Taux d\'échecs paiements dépasse le seuil'
}
```

**Exemple** :
- Seuil : 50 échecs/heure
- Alerte si : 50+ paiements échouent dans la même heure

### 2. Revenu quotidien

```javascript
LOW_DAILY_REVENUE: {
  threshold: 100000,      // 100k XOF
  window: 86400000,       // 24 heures
  description: 'Revenu quotidien inférieur au seuil'
}
```

### 3. Taux d'erreur API

```javascript
API_ERROR_RATE: {
  threshold: 0.05,        // 5%
  window: 600000,         // 10 minutes
  description: 'Taux d\'erreur API dépasse 5%'
}
```

### 4. Latence API (P95)

```javascript
API_LATENCY_P95: {
  threshold: 1000,        // 1000ms = 1s
  window: 600000,         // 10 minutes
  description: 'Latence P95 dépasse 1s'
}
```

### 5. Contrats expirés

```javascript
EXPIRED_CONTRACTS: {
  threshold: 10,          // 10 contrats
  description: 'Plus de 10 contrats expirés non traités'
}
```

### 6. Paiements en retard

```javascript
OVERDUE_PAYMENTS: {
  threshold: 20,          // 20 paiements
  description: 'Plus de 20 paiements en retard'
}
```

## Configuration

### Variables d'environnement

```bash
# .env
PAYMENT_FAIL_THRESHOLD=50
LOW_REVENUE_THRESHOLD=100000
ALERT_COOLDOWN=300000        # 5 minutes entre alertes du même type
```

### Personnaliser les seuils

```javascript
// backend/src/services/alerts.business.js
const ALERT_THRESHOLDS = {
  PAYMENT_FAIL_RATE: {
    threshold: Number(process.env.PAYMENT_FAIL_THRESHOLD || 50),
    // ...
  }
};
```

## Utilisation

### Tracker des paiements

```javascript
const { trackPayment } = require('./services/alerts.business');

async function processPayment(payment) {
  try {
    // Traiter le paiement
    await db.query('INSERT INTO payments ...');
    
    // Track succès
    await trackPayment('success', alertAdminsFunction);
  } catch (error) {
    // Track échec
    await trackPayment('failed', alertAdminsFunction);
    throw error;
  }
}
```

### Tracker les requêtes API

```javascript
const { trackApiRequest } = require('./services/alerts.business');

// Dans le middleware ou route
app.use((req, res, next) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(data) {
    const latency = Date.now() - startTime;
    
    trackApiRequest(res.statusCode, latency);
    
    return originalSend.call(this, data);
  };
  
  next();
});
```

### Tracker les contrats expirés

```javascript
const { trackExpiredContracts } = require('./services/alerts.business');

// Dans un job/scheduler
async function checkExpiredContracts() {
  const result = await db.query(
    `SELECT COUNT(*) FROM contracts 
     WHERE end_date < NOW() AND status != 'closed'`
  );
  
  const expiredCount = result.rows[0].count;
  await trackExpiredContracts(expiredCount);
}
```

### Tracker les paiements en retard

```javascript
const { trackOverduePayments } = require('./services/alerts.business');

// Dans un job/scheduler
async function checkOverduePayments() {
  const result = await db.query(
    `SELECT COUNT(*) FROM invoices 
     WHERE due_date < NOW() AND status != 'paid'`
  );
  
  const overdueCount = result.rows[0].count;
  await trackOverduePayments(overdueCount);
}
```

## Fonction d'alerte admins

### Signature

```javascript
async function alertAdmins(alertData) {
  // alertData = {
  //   type: 'PAYMENT_FAIL_RATE',
  //   message: 'Taux d\'échecs paiements critique: ...',
  //   severity: 'critical',
  //   timestamp: '2025-10-24T10:30:45Z',
  //   metadata: { failCount: 50, threshold: 50 }
  // }
  
  // Implémenter le transport (Slack, Email, SMS, etc.)
}
```

### Implémentation Slack

```javascript
const axios = require('axios');

async function alertViaSlack(alertData) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  const color = {
    critical: '#FF0000',
    warning: '#FFA500',
    info: '#0000FF'
  }[alertData.severity];

  await axios.post(webhookUrl, {
    attachments: [{
      color,
      title: alertData.type,
      text: alertData.message,
      fields: [
        {
          title: 'Timestamp',
          value: alertData.timestamp,
          short: true
        },
        {
          title: 'Severity',
          value: alertData.severity,
          short: true
        }
      ]
    }]
  });
}
```

### Implémentation Email

```javascript
const nodemailer = require('nodemailer');

async function alertViaEmail(alertData) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: 'alerts@akig.com',
    to: process.env.ADMIN_EMAIL,
    subject: `[${alertData.severity.toUpperCase()}] ${alertData.type}`,
    html: `
      <h2>${alertData.type}</h2>
      <p>${alertData.message}</p>
      <p><small>${alertData.timestamp}</small></p>
    `
  });
}
```

## Visualiser les métriques

### Via endpoint API

```javascript
router.get('/api/admin/metrics', requireAuth, (req, res) => {
  const { getMetrics } = require('./services/alerts.business');
  const metrics = getMetrics();
  res.json(metrics);
});
```

### Exemple de réponse

```json
{
  "timestamp": "2025-10-24T10:30:45Z",
  "payments": {
    "total": 450,
    "succeeded": 440,
    "failed": 10,
    "failRate": "2.22"
  },
  "contracts": {
    "total": 120,
    "active": 115,
    "expired": 5
  },
  "api": {
    "requests": 5000,
    "errors": 45,
    "errorRate": "0.90",
    "avgLatency": "125.45",
    "p95Latency": "450.32"
  },
  "alertState": {
    "lastAlertTime": 1634982645000,
    "failCount": 3
  }
}
```

## Cooldown des alertes

### Mécanisme

- Première alerte : Envoyée immédiatement
- Alertes suivantes du même type : Supprimées pendant 5 minutes
- Après cooldown : Peut être renvoyée

### Exemple

```
10:00:00 - 50 paiements échouent → Alerte PAYMENT_FAIL_RATE ✅
10:00:30 - 2 autres échouent → Pas d'alerte (cooldown actif) ❌
10:05:01 - 50 autres échouent → Nouvelle alerte ✅
```

### Raison

- Éviter la bombardement d'alertes
- Permettre au support de traiter la première alerte
- Economiser les ressources (emails, SMS, etc.)

## Tests

### Exécuter les tests

```bash
npm test -- alerts.business.test.js
```

### Couverture

```
✓ Track successful/failed payments
✓ Trigger alerts on threshold
✓ Reset windows
✓ Calculate fail rates
✓ Track API requests and errors
✓ Calculate P95 latency
✓ Alert on high latencies/errors
✓ Track expired contracts
✓ Track overdue payments
✓ Generic alert triggering
✓ Alert cooldown mechanism
✓ Metrics snapshots
✓ Edge cases (zero latency, large values, etc.)
```

## Intégration avec monitoring

### Prometheus

```javascript
// Exporter les métriques en format Prometheus
app.get('/metrics', (req, res) => {
  const { getMetrics } = require('./services/alerts.business');
  const metrics = getMetrics();
  
  const output = `
# HELP payment_fail_total Payment failures total
# TYPE payment_fail_total counter
payment_fail_total{} ${metrics.payments.failed}

# HELP api_error_total API errors total
# TYPE api_error_total counter
api_error_total{} ${metrics.api.errors}

# HELP api_latency_p95 API latency P95
# TYPE api_latency_p95 gauge
api_latency_p95{} ${metrics.api.p95Latency}
  `;
  
  res.type('text/plain');
  res.send(output);
});
```

### Grafana Dashboard

```json
{
  "panels": [
    {
      "title": "Payment Fail Rate",
      "targets": [
        {
          "expr": "payment_fail_total / payment_total * 100"
        }
      ]
    },
    {
      "title": "API Error Rate",
      "targets": [
        {
          "expr": "api_error_total / api_requests_total * 100"
        }
      ]
    },
    {
      "title": "API Latency P95",
      "targets": [
        {
          "expr": "api_latency_p95"
        }
      ]
    }
  ]
}
```

## Bonnes pratiques

✅ **À faire** :
- Configurer les seuils selon les SLA
- Implémenter plusieurs canaux d'alerte
- Logguer toutes les alertes
- Intégrer avec OpenTelemetry
- Tester les alertes régulièrement

❌ **À éviter** :
- Seuils trop sensibles (fausses alertes)
- Alertes sans contexte
- Pas de cooldown (bombardement)
- Ignorer les alertes
- Pas de métriques historiques

## Ressources

- `backend/src/services/alerts.business.js` - Implémentation
- `backend/tests/alerts.business.test.js` - Tests (25+ cas)
- `LOGGING_TRACING.md` - Logging structuré
- `OTEL_SETUP.md` - Traçage distribué

---

**Les alertes en temps réel préviennent les problèmes avant qu'ils n'impactent les utilisateurs** ✅
