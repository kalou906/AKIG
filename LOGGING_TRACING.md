# Logging et Tracing distribué

## Vue d'ensemble

Le système de logging AKIG combine :
- **Request IDs** : Tracking unique par requête
- **OpenTelemetry** : Traçage distribué avec traces
- **Structured Logging** : Logs JSON pour parsing
- **Correlation IDs** : Lier requêtes à travers services

## Architecture

```
┌─────────────────┐
│   Requête HTTP  │
│   (client)      │
└────────┬────────┘
         │
         │ X-Request-Id header
         ▼
    ┌──────────────────────────┐
    │ Request ID Middleware    │
    │ - Generate UUID          │
    │ - Add to response header │
    │ - Link to OTel span      │
    └────────┬─────────────────┘
             │
        ┌────▼──────────────────┐
        │ Service Logic         │
        │ (instrumentation OTel)│
        └────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Structured JSON Logs      │
    │ (stdout)                 │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Log Aggregation          │
    │ (ELK, Splunk, etc.)      │
    └──────────────────────────┘
```

## Request IDs

### Générer un Request ID

Automatique à chaque requête :

```javascript
// middleware/requestId.js
req.reqId = req.headers['x-request-id'] || crypto.randomUUID();
res.setHeader('X-Request-Id', req.reqId);
```

### Utiliser le Request ID

```javascript
// Dans un service
async function processPayment(payment) {
  const span = tracer.startSpan('processPayment');
  span.setAttributes({
    'http.request.id': req.reqId,  // Lié au middleware
    'payment.id': payment.id,
  });
  // ...
}
```

### Afficher le Request ID

```bash
# Dans la réponse
curl -i http://localhost:4002/api/payments
# Réponse:
# X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

## Structured Logging

### Format des logs

```json
{
  "timestamp": "2025-10-24T10:30:45.123Z",
  "level": "info",
  "type": "request_start",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "userId": 123,
  "method": "POST",
  "path": "/api/payments",
  "ip": "192.168.1.1",
  "userAgent": "curl/7.68.0"
}
```

```json
{
  "timestamp": "2025-10-24T10:30:46.234Z",
  "level": "info",
  "type": "request_complete",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "method": "POST",
  "path": "/api/payments",
  "statusCode": 201,
  "duration": 1111,
  "userId": 123
}
```

### Parser les logs

```bash
# Voir les logs formatés
npm run dev | jq '.'

# Filtrer par request ID
npm run dev | jq 'select(.requestId == "550e8400-e29b-41d4-a716-446655440000")'

# Filtrer par user ID
npm run dev | jq 'select(.userId == 123)'

# Voir seulement les erreurs
npm run dev | jq 'select(.level == "warn")'

# Voir les requêtes lentes (>1s)
npm run dev | jq 'select(.duration > 1000)'
```

## Correlation IDs

### Tracer une requête complète

```bash
# 1. Faire une requête
curl -i http://localhost:4002/api/payments \
  -H "X-Request-Id: my-request-123"

# Réponse:
# X-Request-Id: my-request-123

# 2. Voir les logs liés
npm run dev | jq 'select(.requestId == "my-request-123")'

# Résultat:
# {
#   "timestamp": "2025-10-24T10:30:45.123Z",
#   "requestId": "my-request-123",
#   "type": "request_start",
#   ...
# }
# {
#   "timestamp": "2025-10-24T10:30:46.234Z",
#   "requestId": "my-request-123",
#   "type": "request_complete",
#   "duration": 1111,
#   ...
# }

# 3. Voir dans Jaeger
# http://localhost:16686
# Chercher par: traceId (dans les logs)
```

## Logging dans les services

### Pattern standard

```javascript
const { trace } = require('@opentelemetry/api');

async function createPayment(req) {
  const span = tracer.startSpan('createPayment');
  try {
    span.setAttributes({
      'http.request.id': req.reqId,
      'payment.amount': req.body.amount,
    });

    // Validation
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'debug',
      requestId: req.reqId,
      type: 'payment_validation',
      amount: req.body.amount,
    }));

    // Traitement
    const result = await db.query('INSERT INTO payments ...', [req.body]);

    // Succès
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      requestId: req.reqId,
      type: 'payment_created',
      paymentId: result.id,
      duration: performance.now(),
    }));

    return result;
  } catch (error) {
    // Erreur
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      requestId: req.reqId,
      type: 'payment_error',
      error: error.message,
      code: error.code,
    }));

    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Niveaux de log

| Niveau | Usage | Exemple |
|--------|-------|---------|
| `debug` | Détails internes | Valeurs intermédiaires |
| `info` | Événements normaux | Création, succès |
| `warn` | Situations inhabituelles | Tentative échouée, fallback |
| `error` | Erreurs applicatives | Exception catchée |

## Intégration avec ELK Stack

### Docker Compose

```yaml
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
```

### Configuration Logstash

```logstash
input {
  stdin { }
}

filter {
  json { parse => { message => "@json" } }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "akig-logs-%{+YYYY.MM.dd}"
  }
}
```

### Accéder à Kibana

```
http://localhost:5601
- Index pattern: akig-logs-*
- Time field: timestamp
```

## Requêtes utiles

### Tous les paiements créés aujourd'hui

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "type": "payment_created" } },
        { "range": { "timestamp": { "gte": "now-1d" } } }
      ]
    }
  }
}
```

### Requêtes lentes (>1s)

```json
{
  "query": {
    "range": { "duration": { "gte": 1000 } }
  }
}
```

### Erreurs par utilisateur

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "term": { "userId": 123 } }
      ]
    }
  }
}
```

## Exportation des logs

### Vers fichier

```bash
# Logs en JSON
npm run dev > logs.json

# Chercher une requête
cat logs.json | jq 'select(.requestId == "my-id")'
```

### Vers Splunk

```bash
# Configuration du forwarder
# Ajouter dans inputs.conf
[http://akig-logs]
sourcetype = json
index = akig
```

### Vers CloudWatch (AWS)

```bash
# Utiliser winston ou pino
npm install --save winston aws-sdk
```

```javascript
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

const logger = winston.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: '/aws/lambda/akig-api',
      logStreamName: 'production',
    }),
  ],
});

logger.info(JSON.stringify(logEntry));
```

## Monitoring des logs

### Alertes

```javascript
// Si 5+ erreurs en 1 minute
if (errorCount > 5 && timeDelta < 60000) {
  alert('High error rate detected');
}

// Si requête > 5s
if (duration > 5000) {
  alert('Slow request: ' + path);
}
```

### Dashboard (ELK)

```
Panel 1: Requests par minute
Panel 2: Erreurs par service
Panel 3: Latency P95/P99
Panel 4: Top slow requests
Panel 5: Error distribution
```

## Bonnes pratiques

✅ **À faire**:
- Logger chaque opération importante
- Inclure request ID en tous les logs
- Utiliser timestamps ISO 8601
- Parser les logs en JSON
- Corréler avec OpenTelemetry

❌ **À éviter**:
- Logguer des mots de passe/tokens
- Logs texte non parsés
- Pas de levels de log
- Logs excessifs (réduire noise)
- Timestamps locales au lieu d'UTC

## Ressources

- [OpenTelemetry Logging](https://opentelemetry.io/docs/instrumentation/js/logs/)
- [ELK Stack Docs](https://www.elastic.co/guide/en/elastic-stack/current/index.html)
- `middleware/requestId.js` - Implémentation
- `OTEL_SETUP.md` - Configuration OTel

---

**Bien logger et tracer aide à diagnostiquer en production** ✅
