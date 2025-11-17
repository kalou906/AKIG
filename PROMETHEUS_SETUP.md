# 📊 PROMETHEUS DASHBOARD - AKIG

## Configuration Prometheus

Créer fichier `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'akig-backend'
    static_configs:
      - targets: ['localhost:4002']
    metrics_path: '/metrics'
```

## Commandes

```bash
# Lancer Prometheus
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Lancer Grafana
docker run -d \
  -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana
```

## Métriques Disponibles

Accessible à: `http://localhost:4002/metrics`

### HTTP
- `http_request_duration_ms` - Latence requêtes HTTP
- `http_requests_total` - Total requêtes

### Cache
- `cache_hits_total` - Cache hits
- `cache_misses_total` - Cache misses
- `cache_invalidations_total` - Invalidations

### Database
- `db_query_duration_ms` - Latence requêtes SQL
- `db_errors_total` - Erreurs DB

### Erreurs
- `api_errors_total` - Erreurs API
- `validation_errors_total` - Erreurs validation

### Business
- `impayes_created_total` - Impayes créés
- `payments_processed_total` - Paiements traités
- `impayes_montant_gnf` - Montant impayes total

## Alertes Suggerées

```yaml
# Slow response time
alert: SlowHttpResponse
expr: histogram_quantile(0.95, http_request_duration_ms) > 2000

# High error rate
alert: HighErrorRate
expr: rate(api_errors_total[5m]) > 0.05

# Database errors
alert: DbErrors
expr: rate(db_errors_total[5m]) > 0

# Cache hit ratio low
alert: LowCacheHitRatio
expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.7
```

## Dashboards Grafana

### Dashboard 1: Santé Globale
- Taux erreur HTTP
- Latence moyenne (p50, p95, p99)
- Cache hit ratio
- Requêtes/sec

### Dashboard 2: Erreurs
- Erreurs par route
- Erreurs DB par table
- Validation errors par champ
- Stack traces

### Dashboard 3: Business
- Impayes créés aujourd'hui
- Paiements par méthode
- Montant total impayes
- Tendances

### Dashboard 4: Performance
- Latence DB par table
- Latence HTTP par endpoint
- Slow queries
- Memory usage
