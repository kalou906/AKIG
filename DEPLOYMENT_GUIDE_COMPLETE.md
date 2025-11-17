# 🚀 AKIG - Guide de Déploiement Complet

## ✅ Checklist Pré-Déploiement

- [ ] Base de données PostgreSQL configurée
- [ ] Variables d'environnement définies
- [ ] Migrations SQL exécutées
- [ ] Dépendances npm installées
- [ ] Tests unitaires réussis
- [ ] API testée localement
- [ ] Certificats SSL/TLS générés (production)
- [ ] Backups configurés

---

## 1️⃣ CONFIGURATION DE LA BASE DE DONNÉES

### Créer la base de données PostgreSQL

```bash
# Accéder à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE akig_immobilier ENCODING 'UTF8' LC_COLLATE 'fr_FR.UTF-8' LC_CTYPE 'fr_FR.UTF-8';

# Créer l'utilisateur et lui donner les permissions
CREATE USER akig_user WITH PASSWORD 'SecurePassword123!';
ALTER ROLE akig_user SET client_encoding TO 'utf8';
ALTER ROLE akig_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE akig_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE akig_immobilier TO akig_user;

# Quitter
\q
```

### Vérifier la connexion

```bash
psql -U akig_user -d akig_immobilier -h localhost
```

---

## 2️⃣ INSTALLATION DU BACKEND

### Étape 1: Cloner et configurer

```bash
cd /opt/akig
git clone <repository-url> .
cd backend
```

### Étape 2: Installer les dépendances

```bash
npm install

# Pour les distributions Debian/Ubuntu
sudo apt-get update
sudo apt-get install node-gyp python3 build-essential

# Réinstaller les dépendances natives
npm rebuild
```

### Étape 3: Installer les packages requis

```bash
npm install \
  express \
  pg \
  bcryptjs \
  jsonwebtoken \
  cors \
  morgan \
  dayjs \
  pdfkit \
  exceljs \
  dotenv \
  express-validator \
  compression \
  helmet \
  rate-limit \
  --save
```

### Étape 4: Créer le fichier `.env`

```bash
# .env
NODE_ENV=production
PORT=4002

# Database
DATABASE_URL=postgresql://akig_user:SecurePassword123!@localhost:5432/akig_immobilier

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-long!
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info

# PDF Configuration
PDF_OUTPUT_DIR=/var/akig/receipts
EXPORT_OUTPUT_DIR=/var/akig/exports

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Étape 5: Créer les répertoires requis

```bash
sudo mkdir -p /var/akig/receipts
sudo mkdir -p /var/akig/exports
sudo mkdir -p /var/akig/logs
sudo chown -R node:node /var/akig
sudo chmod -R 755 /var/akig
```

---

## 3️⃣ EXÉCUTER LES MIGRATIONS

### Méthode 1: Avec psql

```bash
# Exécuter les migrations dans l'ordre
psql -U akig_user -d akig_immobilier -f backend/db/migrations/001_create_property_management.sql
psql -U akig_user -d akig_immobilier -f backend/db/migrations/002_add_maintenance_and_advanced_features.sql

# Vérifier les tables créées
psql -U akig_user -d akig_immobilier -c "\dt"
```

### Méthode 2: Avec Node.js

```javascript
// scripts/migrate.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const migrations = [
      '001_create_property_management.sql',
      '002_add_maintenance_and_advanced_features.sql',
    ];

    for (const migration of migrations) {
      const sql = fs.readFileSync(
        path.join(__dirname, '../db/migrations/', migration),
        'utf-8'
      );
      console.log(`Running migration: ${migration}...`);
      await pool.query(sql);
      console.log(`✅ ${migration} completed`);
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

Exécuter:
```bash
node scripts/migrate.js
```

---

## 4️⃣ DÉMARRAGE DU SERVEUR

### Développement (avec hot-reload)

```bash
npm run dev
```

### Production (avec PM2)

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Créer un fichier ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'akig-backend',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4002
    },
    error_file: '/var/akig/logs/error.log',
    out_file: '/var/akig/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
EOF

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Configurer le démarrage automatique
pm2 startup
pm2 save

# Vérifier le statut
pm2 status
pm2 logs akig-backend
```

### Production (avec Systemd)

```bash
# Créer le service systemd
sudo tee /etc/systemd/system/akig-backend.service > /dev/null << 'EOF'
[Unit]
Description=AKIG Backend API Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=akig
WorkingDirectory=/opt/akig/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=4002"
StandardOutput=append:/var/akig/logs/out.log
StandardError=append:/var/akig/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# Créer l'utilisateur de service
sudo useradd -r akig || true

# Donner les permissions
sudo chown -R akig:akig /opt/akig
sudo chown -R akig:akig /var/akig

# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable akig-backend
sudo systemctl start akig-backend

# Vérifier le statut
sudo systemctl status akig-backend
```

---

## 5️⃣ CONFIGURATION NGINX (Proxy Inverse)

```bash
# Créer la configuration Nginx
sudo tee /etc/nginx/sites-available/akig.conf > /dev/null << 'EOF'
upstream akig_backend {
    server localhost:4002;
}

server {
    listen 80;
    server_name akig.yourdomain.com;
    
    # Redirection HTTP -> HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name akig.yourdomain.com;
    
    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/akig.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/akig.yourdomain.com/privkey.pem;
    
    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Logs
    access_log /var/log/nginx/akig_access.log;
    error_log /var/log/nginx/akig_error.log;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    location /api {
        proxy_pass http://akig_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
    
    location /health {
        proxy_pass http://akig_backend;
    }
    
    # Serve receipts and exports
    location /receipts {
        alias /var/akig/receipts;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /exports {
        alias /var/akig/exports;
        expires 7d;
    }
}
EOF

# Activer la configuration
sudo ln -s /etc/nginx/sites-available/akig.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Obtenir un certificat SSL avec Certbot

```bash
sudo certbot certonly --nginx -d akig.yourdomain.com
```

---

## 6️⃣ CONFIGURATION POSTGRESQL AVANCÉE

### Optimisation des performances

```sql
-- Augmenter le nombre de connexions
-- Dans /etc/postgresql/14/main/postgresql.conf:
-- max_connections = 200
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
-- random_page_cost = 1.1

-- Créer les index pour les performances
CREATE INDEX idx_contracts_property_id ON contracts(property_id);
CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payment_reports_contract_month ON payment_reports(contract_id, month, year);
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_created_at ON receipts(created_at);
CREATE INDEX idx_maintenance_property_id ON maintenance(property_id);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Activer les statistiques automatiques
ALTER TABLE contracts SET (autovacuum_vacuum_scale_factor = 0.02);
ALTER TABLE payments SET (autovacuum_vacuum_scale_factor = 0.02);
ALTER TABLE receipts SET (autovacuum_vacuum_scale_factor = 0.02);

-- Backup régulier
CLUSTER contracts USING idx_contracts_property_id;
```

### Script de sauvegarde automatique

```bash
#!/bin/bash
# /usr/local/bin/backup-akig.sh

BACKUP_DIR="/var/backups/akig"
DB_NAME="akig_immobilier"
DB_USER="akig_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/akig_backup_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Garder seulement les 30 derniers jours de backups
find $BACKUP_DIR -name "akig_backup_*.sql.gz" -mtime +30 -delete

echo "✅ Backup created: $BACKUP_FILE"

# Vérifier la taille
du -h $BACKUP_FILE
```

Ajouter au cron:
```bash
# Sauvegarder tous les jours à 2h du matin
0 2 * * * /usr/local/bin/backup-akig.sh

# Installer avec crontab
sudo crontab -e
```

---

## 7️⃣ MONITORING ET LOGS

### Configuration du logging

```javascript
// backend/src/middleware/logging.js
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logDir = process.env.LOG_DIR || '/var/akig/logs';

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logDir, 'error.log'),
  { flags: 'a' }
);

// Format personnalisé
morgan.token('user', (req) => req.user?.id || 'anonymous');

const customFormat = ':user - :remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

module.exports = {
  accessLogger: morgan(customFormat, { stream: accessLogStream }),
  errorLogger: morgan(customFormat, { stream: errorLogStream, skip: (req, res) => res.statusCode < 400 })
};
```

### Monitoring avec Prometheus

```javascript
// backend/src/middleware/metrics.js
const prometheus = require('prom-client');

// Métriques
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_request_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || 'unknown';
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });
  
  next();
};

module.exports = { metricsMiddleware, httpRequestDuration, httpRequestTotal };
```

### Vérifier la santé du système

```bash
# Endpoint de santé
curl http://localhost:4002/api/health

# Réponse attendue
# {
#   "status": "ok",
#   "timestamp": "2025-01-01T00:00:00Z",
#   "uptime": 3600,
#   "database": "connected",
#   "environment": "production"
# }
```

---

## 8️⃣ DÉPLOIEMENT AVEC DOCKER

### Dockerfile

```dockerfile
FROM node:18-alpine

# Installer les dépendances
RUN apk add --no-cache python3 build-base

WORKDIR /app

# Copier les fichiers
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Créer les répertoires
RUN mkdir -p /var/akig/receipts /var/akig/exports /var/akig/logs

# Exposer le port
EXPOSE 4002

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4002/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Démarrer l'application
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: akig_immobilier
      POSTGRES_USER: akig_user
      POSTGRES_PASSWORD: SecurePassword123!
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U akig_user -d akig_immobilier"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://akig_user:SecurePassword123!@postgres:5432/akig_immobilier
      JWT_SECRET: your-super-secret-key-min-32-chars-long!
      NODE_ENV: production
      PORT: 4002
    ports:
      - "4002:4002"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/receipts:/var/akig/receipts
      - ./backend/exports:/var/akig/exports
      - ./backend/logs:/var/akig/logs
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

Déployer:
```bash
docker-compose up -d
```

---

## 9️⃣ TESTS ET VALIDATION

### Tests de l'API

```bash
# 1. Tester le serveur
curl -s http://localhost:4002/api/health | jq .

# 2. Créer un propriétaire
curl -X POST http://localhost:4002/api/owners \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Owner","email":"owner@test.com","phone":"+224612345678","company_name":"Test SARL","tax_id":"FR123456"}'

# 3. Récupérer la liste
curl http://localhost:4002/api/owners

# 4. Tester l'authentification
curl -X POST http://localhost:4002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@akig.com","password":"admin123"}'
```

### Tests de performance

```bash
# Avec Apache Bench
ab -n 1000 -c 10 http://localhost:4002/api/health

# Avec Wrk
wrk -t4 -c100 -d30s http://localhost:4002/api/health
```

---

## 🔟 DÉPANNAGE

### Erreurs courantes

| Erreur | Solution |
|--------|----------|
| Connection refused | Vérifier si PostgreSQL est en cours d'exécution |
| ENOENT: no such file or directory | Créer les répertoires manquants |
| JWT verification failed | Vérifier JWT_SECRET dans .env |
| CORS errors | Vérifier CORS_ORIGIN dans .env |
| Memory leak | Vérifier les connections DB non fermées |

### Commandes de débogage

```bash
# Voir les logs en direct
sudo tail -f /var/akig/logs/error.log

# Vérifier les connexions DB
psql -U akig_user -d akig_immobilier -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Vérifier les processus Node
ps aux | grep node

# Vérifier l'utilisation des ports
lsof -i :4002
netstat -tulpn | grep 4002

# Tester la base de données
psql -U akig_user -d akig_immobilier -c "SELECT version();"
```

---

## ✨ CHECKLIST POST-DÉPLOIEMENT

- [ ] API accessible via HTTPS
- [ ] Healthcheck endpoint répond
- [ ] Base de données connectée
- [ ] PDF generation working
- [ ] Exports working
- [ ] Notifications sending
- [ ] Logs being written
- [ ] Backups scheduled
- [ ] Monitoring active
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Error handling working

---

**Version:** 2.0.0  
**Dernière mise à jour:** 2025-10-26  
**Support:** support@akig.com
