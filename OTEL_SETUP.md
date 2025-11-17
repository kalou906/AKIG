# OpenTelemetry Configuration

## Vue d'ensemble

OpenTelemetry (OTel) fournit une traçabilité distribuée pour l'application AKIG, permettant de visualiser et d'analyser les performances.

## Architecture

```
┌─────────────────┐
│   AKIG Backend  │
│   (Node.js)     │
└────────┬────────┘
         │
         │ Traces OTLP
         ▼
    ┌─────────┐
    │ Jaeger  │ (Collecteur local)
    └────┬────┘
         │
    ┌────▼─────────────────┐
    │ Jaeger UI (port 16686)
    └───────────────────────┘
```

## Installation des dépendances

```bash
cd backend
npm install \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/sdk-trace-node
```

## Configuration

### Variables d'environnement

```bash
# .env
OTLP_URL=http://localhost:4318/v1/traces
NODE_ENV=development  # ou production
```

### Démarrage avec Jaeger local (Docker)

```bash
# Démarrer Jaeger all-in-one
docker run -d \
  --name jaeger \
  -p 6831:6831/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest

# Accéder à Jaeger UI
# http://localhost:16686
```

### Sans Docker (installation locale Jaeger)

```bash
# Sur macOS
brew install jaeger-query

# Sur Linux
# Télécharger: https://github.com/jaegertracing/jaeger/releases

# Lancer le collecteur OTLP
jaeger-query
```

## Utilisation

### Démarrage du serveur avec traces

```bash
npm run dev
# Logs:
# 🔍 OpenTelemetry initialisé
# 📡 Exportateur: Console (développement)
```

### Générer des traces

Faire des requêtes API :

```bash
# Les traces sont automatiquement capturées
curl http://localhost:4002/api/health
curl http://localhost:4002/api/contracts
```

### Visualiser les traces

1. **Console (développement)**
   ```
   Traces affichées dans la sortie terminal
   ```

2. **Jaeger UI (production)**
   ```
   Accès: http://localhost:16686
   Services: akig-api
   ```

## Instrumentations activées

| Module | Description | Statut |
|--------|-------------|--------|
| Express | Routage HTTP | ✅ Actif |
| PostgreSQL | Requêtes base de données | ✅ Actif |
| HTTP Client | Appels externes | ✅ Actif |
| File System | Accès fichiers | ❌ Désactivé |
| DNS | Requêtes DNS | ❌ Désactivé |

## Métriques capturées

### Spans HTTP

```json
{
  "name": "POST /api/payments",
  "duration": 145,
  "status": "ok",
  "attributes": {
    "http.method": "POST",
    "http.url": "http://localhost:4002/api/payments",
    "http.status_code": 201,
    "http.response_content_length": 256
  }
}
```

### Spans Base de données

```json
{
  "name": "SELECT * FROM contracts",
  "duration": 23,
  "status": "ok",
  "attributes": {
    "db.system": "postgresql",
    "db.statement": "SELECT * FROM contracts WHERE status = $1",
    "db.rows_affected": 5
  }
}
```

## Filtrage des traces

### Réduire le bruit en développement

```javascript
// src/otel.js - Désactiver les instrumentations bruyantes
instrumentations: [
  getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },
    '@opentelemetry/instrumentation-dns': { enabled: false },
  }),
],
```

### Filtrer par service

Dans Jaeger UI :
- Service: `akig-api`
- Operation: `POST /api/payments`
- Tags: `environment=production`

## Performance

### Impact sur les performances

| Mode | CPU | Mémoire | Latence |
|------|-----|---------|---------|
| Sans OTel | 100% | 100% | 0ms |
| Console | +2-3% | +15MB | +1-2ms |
| OTLP | +1-2% | +10MB | +0.5-1ms |

### Optimisations

1. **Batch Processing**: Les traces sont groupées par défaut
2. **Sampling**: Réduire le taux d'échantillonnage en prod
   ```javascript
   const sampler = new TraceIdRatioBasedSampler(0.1); // 10%
   ```

3. **Filtrage**: Désactiver les instrumentations inutiles

## Requêtes Jaeger courants

### Trouver les requêtes lentes

```
Service: akig-api
Min Duration: 500ms
```

### Erreurs dans le dernier jour

```
Service: akig-api
Tags: error=true
```

### Traces par endpoint

```
Service: akig-api
Operation: POST /api/payments
Limit: 20
```

## Débogage

### Vérifier que OTel fonctionne

```bash
# Voir les logs dans la console
npm run dev
# Devrait afficher: 🔍 OpenTelemetry initialisé
```

### Traces console

Mode développement : voir les traces directement dans le terminal

```
Span: GET /api/contracts
Duration: 45ms
Status: ok
```

### Jaeger ne reçoit pas de données

1. **Vérifier OTLP_URL**
   ```bash
   echo $OTLP_URL  # Doit être http://localhost:4318/v1/traces
   ```

2. **Vérifier que Jaeger écoute**
   ```bash
   curl http://localhost:16686/api/services  # Doit retourner des services
   ```

3. **Vérifier les logs**
   ```bash
   docker logs jaeger  # Si en Docker
   ```

## Production

### Configuration production

```bash
# .env.production
NODE_ENV=production
OTLP_URL=https://jaeger.production.example.com/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer%20token
```

### Sampling en production

```javascript
// Réduire le bruit: 5% de toutes les traces
const sampler = new TraceIdRatioBasedSampler(0.05);
```

### Alertes

Configurer des alertes dans Jaeger ou Prometheus :

```json
{
  "alert": "High Latency",
  "condition": "p95_latency > 1000ms",
  "service": "akig-api"
}
```

## Intégration avec autres outils

### Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'akig-api'
    static_configs:
      - targets: ['localhost:4002']
    metrics_path: '/metrics'
```

### Grafana

Dashboard source: `Jaeger`
- Service: `akig-api`
- Afficher: Latency, Error Rate, Throughput

### Elasticsearch

```javascript
// Alternative exporter pour Jaeger
const { ElasticsearchExporter } = require('@opentelemetry/exporter-elasticsearch');
```

## Ressources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Official](https://www.jaegertracing.io/)
- [Node.js OTel Guide](https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/)

---

**La traçabilité distribuée aide à diagnostiquer les problèmes en production** ✅
