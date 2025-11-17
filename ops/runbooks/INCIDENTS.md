# 🚨 RUNBOOK: Base de Données Down

**Severité**: 🔴 CRITICAL
**Impact**: Tous les services indisponibles
**RTO**: < 15 minutes
**RPO**: < 5 minutes

## Symptômes
- ❌ Erreur "ECONNREFUSED" ou timeout
- ❌ Requêtes vers `/api/` retournent 500
- ❌ Prometheus: `up{job="postgres"} == 0`
- ❌ Dashboard: "Unable to connect to database"

## Diagnostique Immédiat (0-5 min)

### 1. Vérifier l'état du conteneur
```bash
docker ps | grep postgres
docker logs akig-db | tail -50
```

Si container down → Go to Recovery (Étape 3)

### 2. Vérifier la connectivité
```bash
# Depuis conteneur backend
docker exec akig-backend psql -h postgres -U akig_user -d akig -c "SELECT 1"

# Vérifier les logs PostgreSQL
docker logs akig-db | grep ERROR | tail -10
```

### 3. Vérifier l'espace disque
```bash
df -h /var/lib/postgresql/data
# Si > 95% utilisé → Go to Disk Full (Étape 5)
```

## Récupération Standard (5-10 min)

### Étape 1: Redémarrer PostgreSQL
```bash
docker restart akig-db

# Attendre que ça redémarre
docker logs -f akig-db | grep "ready to accept connections"
```

### Étape 2: Vérifier la santé
```bash
curl -s http://localhost:4000/api/health | jq .database

# Doit retourner: "database": "connected"
```

### Étape 3: Valider les données
```bash
# Depuis container backend
docker exec akig-backend psql -h postgres -U akig_user -d akig <<EOF
SELECT COUNT(*) as locataires FROM locataires;
SELECT COUNT(*) as impayes FROM impayes;
SELECT COUNT(*) as missions FROM missions;
EOF
```

## Récupération D'Urgence - Corruption BD (10-15 min)

Si restart ne suffit pas:

### 1. Vérifier intégrité
```bash
docker exec akig-db pg_dump -d akig -U akig_user --data-only --table=impayes > /tmp/impayes.sql

# Si pg_dump échoue → Corruption probable
```

### 2. Démarrer en single-user mode
```bash
# Arrêter container
docker stop akig-db

# Démarrer en maintenance
docker run --rm -it -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine \
  postgres -D /var/lib/postgresql/data --single

# Commande de réparation
VACUUM ANALYZE;
REINDEX DATABASE akig;
```

### 3. Redémarrer normalement
```bash
docker start akig-db
```

## Recovery avec Backup

Si données corrompues et irrécupérables:

### 1. Localiser le backup
```bash
ls -lh /backups/postgres/
# Format: postgres-backup-2025-10-26.sql.gz (quotidien)
```

### 2. Restaurer depuis backup
```bash
# Créer DB temporaire
docker exec akig-db createdb -U akig_user akig_restore

# Restaurer données
gunzip -c /backups/postgres/postgres-backup-2025-10-26.sql.gz | \
  docker exec -i akig-db psql -U akig_user -d akig_restore

# Valider restauration
docker exec akig-db psql -U akig_user -d akig_restore -c "SELECT COUNT(*) FROM impayes"

# Renommer databases
docker exec akig-db psql -U akig_user -c "ALTER DATABASE akig RENAME TO akig_corrupted"
docker exec akig-db psql -U akig_user -c "ALTER DATABASE akig_restore RENAME TO akig"
```

### 3. Redémarrer backend
```bash
docker restart akig-backend
```

## Prévention

### Backups Quotidiens
```bash
# Cronjob (tous les jours 2h du matin)
0 2 * * * docker exec akig-db pg_dump akig -U akig_user | \
  gzip > /backups/postgres/postgres-backup-$(date +%Y-%m-%d).sql.gz

# Garder 30 jours
find /backups/postgres -name "*.sql.gz" -mtime +30 -delete
```

### Monitoring
- Alert si: `up{job="postgres"} == 0`
- Alert si: `pg_database_size > 50GB`
- Alert si: `pg_stat_database_numbackends > 95`

---

# 🚨 RUNBOOK: Cache Redis Down

**Severité**: 🟡 HIGH
**Impact**: Performances dégradées (3-5x plus lent)
**RTO**: < 5 minutes
**RPO**: < 1 minute (cache peut être perdu)

## Symptômes
- ⚠️ Requêtes très lentes
- ⚠️ Logs: "ECONNREFUSED" sur Redis
- ⚠️ `up{job="redis"} == 0`
- ⚠️ Header `X-Cache: MISS` sur toutes les requêtes

## Récupération (1-3 min)

### 1. Redémarrer Redis
```bash
docker restart akig-cache

# Vérifier
docker exec akig-cache redis-cli ping
# Doit retourner: PONG
```

### 2. Vérifier les connections
```bash
docker exec akig-cache redis-cli INFO clients
# Connected clients: devrait être ~10-20
```

### 3. Valider que cache fonctionne
```bash
curl -s http://localhost:4000/api/dashboard/resume | head -1

# Premier appel: "X-Cache: MISS"
# Deuxième appel: "X-Cache: HIT"
```

## Si Redis Memory Pleine

### 1. Vérifier utilisation
```bash
docker exec akig-cache redis-cli INFO memory

# Used memory: XXX / Max memory: YYY
```

### 2. Vider cache (dernière option)
```bash
docker exec akig-cache redis-cli FLUSHDB

# ⚠️ ATTENTION: Toutes les données en cache perdues!
# Premières requêtes seront lentes (reconstruction cache)
```

### 3. Augmenter limite mémoire
```bash
# Éditer docker-compose.yml
# redis:
#   command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru

docker-compose up -d redis
```

## Prévention

- Monitor: `redis_memory_used_bytes / redis_memory_max_bytes > 0.9`
- Alert: Si memory > 85% pendant 5 min

---

# 🚨 RUNBOOK: Haute Rate d'Erreurs API

**Severité**: 🔴 CRITICAL
**Impact**: Utilisateurs ne peuvent pas utiliser l'app
**RTO**: < 10 minutes

## Symptômes
- ❌ > 5% requêtes retournent 5xx
- ❌ Logs remplies d'erreurs
- ❌ Dashboard: Alerte "HighErrorRate"

## Diagnostique (0-5 min)

### 1. Vérifier les logs backend
```bash
docker logs akig-backend --tail=100 | grep ERROR

# Chercher les patterns d'erreurs communs
# - "ECONNREFUSED": Problème BD/Redis
# - "Out of memory": Fuite mémoire
# - "Timeout": Request trop lente
```

### 2. Vérifier ressources système
```bash
docker stats akig-backend

# CPU: < 80% (OK)
# Memory: < 500MB (OK)
```

### 3. Vérifier le nombre de connections
```bash
docker exec akig-db psql -U akig_user -c \
  "SELECT count(*), state FROM pg_stat_activity GROUP BY state"

# Chercher: trop de connections en "idle"?
```

## Récupération

### Si c'est une fuite mémoire
```bash
docker restart akig-backend

# Monitoring après restart
docker stats akig-backend
```

### Si c'est timeout base de données
```bash
# Tuer les queries longues
docker exec akig-db psql -U akig_user -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE duration > interval '5 minutes'"
```

### Si c'est un memory leak dans l'app
```bash
# Vérifier les logs pour la source
docker logs akig-backend | grep -i "memory\|leak"

# Redémarrer
docker restart akig-backend

# Si revient immédiatement:
# 1. Lire les ADRs pour compression/caching
# 2. Ajouter des limits
# 3. Redéployer fix
```

## Prévention

- Alerte: `error_rate > 5%` pendant 5 min
- Alerte: `memory_usage > 80%` pendant 10 min
- E2E tests avant deploy

---

# 🚨 RUNBOOK: Impayés Critiques (>60 jours)

**Severité**: 🔴 CRITICAL - BUSINESS
**Impact**: Perte de revenue, clients problématiques
**RTO**: N/A (Business action requise)

## Détection Automatique

```
Alert: "Impayes Critiques"
> 50 impayés avec retard > 60 jours
```

## Actions Requises

### 1. Escalade PDG/Directeur
```
📧 Email template (dans Slack AKIG):
Subject: URGENT - Impayés Critiques Détectés

{{ nb_impayes }} impayés dépasse 60 jours pour {{ affected_sites }}
Montant total: {{ total_montant }}€

Dashboard: http://akig.local:3000/dashboard
Lien urgent: /dashboard/impayes?filter=retard:60+
```

### 2. Analyser la cause
```sql
-- Quels sites/locataires problématiques?
SELECT site_id, COUNT(*), SUM(montant)
FROM impayes
WHERE EXTRACT(DAY FROM CURRENT_DATE - date_echeance) > 60
GROUP BY site_id
ORDER BY 3 DESC;

-- Quels agents assignés?
SELECT agent_id, COUNT(*)
FROM missions
WHERE site_id IN (/* sites ci-dessus */)
AND status = 'non_complete'
GROUP BY agent_id;
```

### 3. Actions correctives
- 🔴 Escalade juridique pour dettes > 10000€
- 🟡 Rappel PDG pour sites sensibles
- 👥 Réassigner agents moins performants
- 📞 Campagne appels/SMS massif

---

# 🚨 RUNBOOK: Performance Agents Très Basse

**Severité**: 🟡 WARNING
**Impact**: Agents non productifs, retard recouvrement

## Détection
```
Alert: Agent score < 5 pour 2h d'affilée
```

## Investigation (0-30 min)

```sql
-- Historique de performance de l'agent
SELECT date_stat, score, visites, promesses, paiements, refus
FROM performance_historique
WHERE agent_id = '{{ agent_id }}'
ORDER BY date_stat DESC
LIMIT 7;

-- Sessions géolocalisation
SELECT timestamp, latitude, longitude
FROM agent_geolocalisation
WHERE agent_id = '{{ agent_id }}'
AND timestamp > NOW() - INTERVAL '4 hours'
ORDER BY timestamp DESC;

-- Actions du jour
SELECT type_action, statut, resultat, montant_recouvre
FROM recouvrement_actions
WHERE agent_id = '{{ agent_id }}'
AND DATE(date_action) = CURRENT_DATE;
```

## Causes Possibles

- ❌ **Réseau/GPS**: Problème connectivité agent
- ❌ **Domaine**: Locataires inaccessibles/fermés
- ❌ **Motivation**: Agent démotivé/malade
- ❌ **Système**: Erreur saisie données

## Actions

1. **Contacter l'agent directement** (WhatsApp/appel)
2. **Vérifier localisation GPS**: Mission réelle vs planifiée?
3. **Valider qualité saisie**: Les données sont complètes?
4. **Coaching si nécessaire**: Point suivi chef équipe

---

Tous les runbooks à jour à: `/ops/runbooks/`

Pour ajouter: Lire template.md et soumettre PR
