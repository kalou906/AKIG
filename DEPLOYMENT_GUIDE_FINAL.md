# 🚀 AKIG - Guide Complet de Lancement

## Vue d'ensemble

AKIG est une application Node.js/Express complète avec 10 systèmes intégrés et 84 endpoints. Ce guide vous permet de la lancer en production en quelques minutes.

---

## Prérequis

- **Node.js**: v14+ (recommandé: v18+)
- **PostgreSQL**: v12+ (optionnel - utilise Mock DB si indisponible)
- **npm**: v7+ (inclus avec Node.js)
- **Espace disque**: Au moins 500MB libres

---

## Installation Rapide (5 minutes)

### 1. Préparer l'environnement

```powershell
# Naviguer au répertoire backend
cd c:\AKIG\backend

# Installer les dépendances
npm install

# Vérifier que tout est en place
npm run launch
```

### 2. Configurer les variables d'environnement

Le fichier `.env` contient déjà les configurations de base:

```env
NODE_ENV=development
PORT=4000
DEBUG=akig:*

# Base de données
DATABASE_URL=postgresql://akig_user:akig_password@localhost:5432/akig
PG_HOST=localhost
PG_PORT=5432
PG_USER=akig_user
PG_PASSWORD=akig_password
PG_DATABASE=akig

# Authentification
JWT_SECRET=your_very_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# Cache (Redis optionnel)
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=false
```

⚠️ **IMPORTANT**: En production, changez `JWT_SECRET` et `NODE_ENV=production`

### 3. Démarrer le serveur

```powershell
# Démarrage rapide (recommandé - avec pré-vérifications)
npm run launch

# OU démarrage direct
npm start

# Mode développement avec auto-reload
npm run dev
```

---

## Modes de Fonctionnement

### Mode PostgreSQL (Production)

Si PostgreSQL est installé et configuré:

```powershell
# Créer la base et l'utilisateur
# (voir section PostgreSQL ci-dessous)

# Lancer migrations
psql -U akig_user -d akig -f backend/MIGRATIONS_PHASE5.sql

# Démarrer serveur
npm run launch
```

Le serveur affichera:
```
✓ Node.js v18.16.0 (required: >=14)
✓ JWT_SECRET is configured
✓ PostgreSQL connected
```

### Mode Mock DB (Développement/Test)

Si PostgreSQL n'est pas disponible, le système bascule automatiquement en Mock DB:

```powershell
# Démarrage automatique en Mock DB
npm run launch
```

Le serveur affichera:
```
✓ Node.js v18.16.0 (required: >=14)
✓ JWT_SECRET is configured
⚠ PostgreSQL unavailable - using Mock DB
✓ All checks passed! Starting server...
```

Les données sont stockées en mémoire avec persistance vers `.mockdb.json`.

---

## Configuration PostgreSQL (Production)

Si vous voulez utiliser PostgreSQL pour la production:

### Option 1: PostgreSQL Installé Localement

```powershell
# 1. Vérifier PostgreSQL
psql -U postgres -c "SELECT version();"

# 2. Créer utilisateur et base
psql -U postgres -c "
CREATE USER akig_user WITH PASSWORD 'akig_password';
CREATE DATABASE akig OWNER akig_user;
GRANT ALL PRIVILEGES ON DATABASE akig TO akig_user;
"

# 3. Exécuter migrations
psql -U akig_user -d akig -f backend/MIGRATIONS_PHASE5.sql

# 4. Vérifier connexion
psql -U akig_user -d akig -c "SELECT COUNT(*) FROM pg_tables;"
```

### Option 2: PostgreSQL via Docker

```powershell
# Si Docker est disponible:
docker run -d `
  --name akig-postgres `
  -e POSTGRES_PASSWORD=akig_password `
  -e POSTGRES_USER=akig_user `
  -e POSTGRES_DB=akig `
  -p 5432:5432 `
  postgres:15

# Attendre 10 secondes, puis exécuter migrations
docker exec akig-postgres psql -U akig_user -d akig -f /backup/MIGRATIONS_PHASE5.sql
```

---

## Health Check & Diagnostique

Une fois le serveur lancé, vérifiez sa santé:

### Santé Rapide
```bash
curl http://localhost:4000/api/health
# Réponse:
# {"status":"healthy","timestamp":"2025-01-15T10:30:45Z","uptime":123.45}
```

### Diagnostique Complet
```bash
curl http://localhost:4000/api/health/full
# Affiche tous les systèmes (Node.js, DB, dépendances, fichiers)
```

### Configuration (Dev only)
```bash
curl http://localhost:4000/api/health/config
```

---

## Architecture Complète

### Systèmes Déployés (10 total)

1. **Place-Marché** - Gestion annonces immobilières
2. **Paiements Avancés** - Traitement paiements multi-devises
3. **Rapports Email** - Génération/envoi rapports automatiques
4. **Recherche Avancée** - Moteur recherche intelligent
5. **Cartographie Géographique** - Mapping propriétés
6. **Application Mobile** - API mobile-first
7. **Dashboard Personnalisé** - Dashboards dynamiques
8. **Gestion Locataires** - Locataires + propriétés
9. **Gestion Propriétaires** - Propriétaires + portefeuille
10. **Analytics** - Reportings et statistiques

### Endpoints Disponibles (84 total)

```
[GET/POST] /api/auth/*              (7 endpoints)
[GET/POST] /api/contracts/*         (8 endpoints)
[GET/POST] /api/payments/*          (12 endpoints)
[GET/POST] /api/dashboard/*         (6 endpoints)
[GET/POST] /api/properties/*        (15 endpoints)
[GET/POST] /api/tenants/*           (10 endpoints)
[GET/POST] /api/owners/*            (8 endpoints)
[GET/POST] /api/analytics/*         (10 endpoints)
[GET/POST] /api/health/*            (3 endpoints)
... et plus
```

Voir `/api/docs` pour documentation interactive Swagger.

---

## Troubleshooting

### Problème: "Cannot find module 'xxx'"

**Solution**: Réinstaller dépendances
```powershell
rm -Recurse node_modules
npm install
npm run launch
```

### Problème: "Connection refused" (PostgreSQL)

**Solution**: Utiliser Mock DB automatiquement
- Le système bascule automatiquement en Mock DB
- Les données sont sauvegardées localement
- Pour PostgreSQL: installer et configurer selon section ci-dessus

### Problème: "Port 4000 already in use"

**Solution**: Changer le port
```powershell
# Via variable d'environnement
$env:PORT = 5000
npm run launch

# Ou modifier .env
NODE_ENV=development
PORT=5000
```

### Problème: "JWT_SECRET not configured"

**Solution**: Ajouter dans .env
```env
JWT_SECRET=your_secret_key_here_minimum_32_chars
```

### Problème: Serveur démarre mais endpoints retournent erreurs

**Solution**: Vérifier diagnostique complet
```powershell
curl http://localhost:4000/api/health/full
# Examine les résultats des checks
```

---

## Déploiement Production

### Préparation

```powershell
# 1. Mettre à jour .env
NODE_ENV=production
PORT=443
JWT_SECRET=<very-secure-random-key>
DATABASE_URL=<production-postgres-url>

# 2. Installer production dependencies only
npm install --production

# 3. Exécuter migrations
psql -U akig_user -d akig -f MIGRATIONS_PHASE5.sql

# 4. Vérifier santé
npm run launch
curl http://localhost:443/api/health/full
```

### Avec PM2 (Recommended)

```powershell
# Installer PM2 globalement
npm install -g pm2

# Créer configuration PM2
@"
module.exports = {
  apps: [{
    name: 'akig-backend',
    script: 'src/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
"@ | Set-Content ecosystem.config.js

# Lancer
pm2 start ecosystem.config.js

# Voir logs
pm2 logs

# Restart
pm2 restart akig-backend

# Arrêter
pm2 stop akig-backend
```

### Avec Systemd (Linux)

```bash
# Créer fichier service
sudo tee /etc/systemd/system/akig.service > /dev/null <<EOF
[Unit]
Description=AKIG Backend
After=network.target

[Service]
Type=simple
User=akig
WorkingDirectory=/home/akig/akig/backend
ExecStart=/usr/bin/node start-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable akig
sudo systemctl start akig
```

---

## Monitoring & Logs

### Logs en Temps Réel
```powershell
# Depuis npm
npm run launch 2>&1 | Tee-Object -FilePath ./akig.log

# Voir logs
Get-Content ./akig.log -Tail 50 -Wait
```

### Métriques Prometheus
```
curl http://localhost:4000/metrics
```

### Format des Logs

Tous les logs incluent:
- Timestamp ISO
- Request ID unique
- Niveau (INFO, WARN, ERROR)
- Message structuré

---

## Structure de Répertoire

```
backend/
├── src/
│   ├── index.js                 # Entry point
│   ├── db.js                    # Pool PostgreSQL
│   ├── db-mock.js              # Mock DB (fallback)
│   ├── routes/
│   │   ├── health.js           # Health check endpoints
│   │   ├── auth.js
│   │   ├── contracts.js
│   │   ├── payments.js
│   │   └── ... (20+ routes)
│   ├── services/
│   │   ├── logger.js
│   │   ├── cache.service.js
│   │   ├── alerts.js
│   │   └── ... (15+ services)
│   ├── middleware/
│   ├── utils/
│   └── docs/
├── MIGRATIONS_PHASE5.sql       # DDL - créer tables
├── package.json
├── .env                        # Configuration
├── start-server.js             # Production launcher
└── ecosystem.config.js         # PM2 config
```

---

## Support & Maintenance

### Vérification Santé Régulière

```powershell
# Quotidiennement
curl -s http://localhost:4000/api/health/full | ConvertFrom-Json | Select-Object status

# Heures creuses: maintenance
# Arrêter: CTRL+C
# Redémarrer: npm run launch
```

### Backup & Restore

```powershell
# Backup de données Mock DB
Copy-Item .mockdb.json .mockdb.json.backup

# Backup PostgreSQL
pg_dump -U akig_user -d akig > akig_backup.sql

# Restore
psql -U akig_user -d akig < akig_backup.sql
```

---

## Conclusion

✅ **Votre système AKIG est prêt!**

- **Démarrage rapide**: `npm run launch`
- **Santé système**: `curl http://localhost:4000/api/health`
- **Docs API**: `http://localhost:4000/api/docs`
- **Base de données**: PostgreSQL (+ fallback Mock DB)
- **Scalabilité**: Prêt pour PM2/cluster
- **Monitoring**: Logs + Métriques Prometheus

Pour questions ou bugs: Consultez les logs détaillés via `npm run launch`.

---

**Bonne chance! 🎉**
