# 📋 GUIDE DE MIGRATION VERS LA PRODUCTION

## 🎯 Objectif
Transitionner le système AKIG du mode développement (en-mémoire) vers la production (PostgreSQL)

---

## 📊 COMPARAISON DES MODES

| Aspect | Développement | Production |
|--------|--------------|-----------|
| **Serveur** | `src/index-dev.js` | `src/index.js` |
| **Base de données** | En mémoire (RAM) | PostgreSQL |
| **Port Backend** | 4000 | 4000 (ou personnalisé) |
| **Port Frontend** | 3000 | 80/443 (ou CDN) |
| **Données** | Perdues au redémarrage | Persistantes |
| **Optimisation** | Non | Oui (npm run build) |
| **Logs** | Console | Fichiers + Console |

---

## 🚀 ÉTAPES DE MIGRATION

### **Étape 1: Installer PostgreSQL**

#### Windows
```powershell
# Option A: Via Chocolatey
choco install postgresql13

# Option B: Télécharger depuis https://www.postgresql.org/download/windows/
# Lors de l'installation, notez:
#   - Username: postgres
#   - Password: (votre mot de passe)
#   - Port: 5432 (par défaut)
```

#### macOS
```bash
brew install postgresql@13
brew services start postgresql@13
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

### **Étape 2: Initialiser la base de données PostgreSQL**

```powershell
# 1. Connecter à PostgreSQL
psql -U postgres

# 2. Dans psql, créer la base de données AKIG
CREATE DATABASE akig_production;
CREATE USER akig WITH PASSWORD 'akig_password';
GRANT ALL PRIVILEGES ON DATABASE akig_production TO akig;

# 3. Quitter
\q

# 4. Initialiser le schéma (si script SQL fourni)
psql -U akig -d akig_production -f init-postgres.sql
```

**Alternative: Depuis PowerShell**
```powershell
$psqlPath = "C:\Program Files\PostgreSQL\13\bin\psql.exe"
& $psqlPath -U postgres -c "CREATE DATABASE akig_production;"
& $psqlPath -U postgres -c "CREATE USER akig WITH PASSWORD 'akig_password';"
& $psqlPath -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE akig_production TO akig;"
```

---

### **Étape 3: Mettre à jour le fichier .env.development**

**Fichier:** `c:\AKIG\backend\.env.development`

**Avant (Développement):**
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://akig:akig_password@localhost:5432/akig_production
JWT_SECRET=akig_jwt_secret_key_development_change_in_production_min_32_chars
```

**Après (Production):**
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://akig:YOUR_SECURE_PASSWORD@your-db-host:5432/akig_production
JWT_SECRET=your_long_secure_random_string_at_least_32_characters_minimum
JWT_EXPIRY=24h
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
TZ=UTC
```

**Génération JWT_SECRET sécurisé:**
```powershell
# PowerShell
$bytes = [System.Text.Encoding]::UTF8.GetBytes((1..64 | ForEach-Object { [char](48..122 | Get-Random) }))
$secret = [Convert]::ToBase64String($bytes)
Write-Host $secret
```

---

### **Étape 4: Tester la connexion PostgreSQL**

```powershell
# Avant de lancer le serveur, testez:
$env:DATABASE_URL="postgresql://akig:akig_password@localhost:5432/akig_production"
cd c:\AKIG\backend
node verify-environment.js
```

**Résultat attendu:**
```
✓ DATABASE_URL = postgresql://akig:...
✓ Database connection: PASS
```

---

### **Étape 5: Basculer vers le serveur principal**

**Actuellement (Développement):**
```powershell
cd c:\AKIG\backend
node src\index-dev.js
```

**Pour la Production:**
```powershell
cd c:\AKIG\backend
# Option A: Avec vérification d'environnement
npm start

# Option B: Direct (si npm start déjà configuré)
node src\index.js
```

---

### **Étape 6: Build et déploiement du Frontend**

**Créer le build optimisé:**
```powershell
cd c:\AKIG\frontend
npm run build
```

**Résultat:**
- Fichiers générés dans `frontend/build/`
- Optimisé et minifié
- Prêt pour production

**Déploiement:**
```bash
# Option A: Servir statiquement
npm install -g serve
serve -s build -l 3000

# Option B: Déployer sur CDN (Vercel, Netlify, etc.)
# Télécharger le contenu de `build/` vers votre CDN

# Option C: Proxy via Nginx/Apache
# Pointer `/frontend/*` vers le dossier `build/`
```

---

### **Étape 7: Variables d'environnement de production**

**Fichier: `.env.production`**
```bash
NODE_ENV=production
PORT=4000

# Database (sécurisé)
DATABASE_URL=postgresql://akig:SECURE_PASSWORD@your-prod-db.com:5432/akig_production
DB_POOL_MIN=5
DB_POOL_MAX=20

# Security
JWT_SECRET=your_very_long_secure_random_string_minimum_32_chars
JWT_EXPIRY=7d

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true

# CORS (production domain)
CORS_ORIGIN=https://yourdomain.com

# Features
FEATURE_CSV_IMPORT=true
FEATURE_PDF_EXPORT=true
FEATURE_AUDIT_LOGGING=true

# External Services (si utilisés)
SMTP_ENABLED=false
REDIS_ENABLED=false
```

---

### **Étape 8: Configuration Nginx (optionnel)**

**Fichier: `/etc/nginx/sites-available/akig`**
```nginx
upstream backend {
  server localhost:4000;
}

upstream frontend {
  server localhost:3000;
}

server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;
  
  # Frontend
  location / {
    proxy_pass http://frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }
  
  # Backend API
  location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## ✅ CHECKLIST DE MIGRATION

- [ ] PostgreSQL installé et en cours d'exécution
- [ ] Base de données `akig_production` créée
- [ ] Utilisateur `akig` créé avec permissions
- [ ] `.env.production` configuré
- [ ] JWT_SECRET changé et sécurisé
- [ ] CORS_ORIGIN mis à jour
- [ ] Connexion DB testée avec `verify-environment.js`
- [ ] `npm start` démarre le serveur sans erreurs
- [ ] Backend API répond sur `/api/health`
- [ ] Frontend compilé avec `npm run build`
- [ ] Frontend accessible et connecté au backend
- [ ] Logs vérifiés et sans erreurs
- [ ] Tests de charge effectués
- [ ] Backup de base de données configuré
- [ ] SSL/TLS certificat installé (HTTPS)

---

## 🔒 RECOMMANDATIONS DE SÉCURITÉ

### **1. Changez JWT_SECRET**
```powershell
# Générer une clé sécurisée
$random = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$bytes = [byte[]]::new(32)
$random.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Host $secret
```

### **2. Utilisez HTTPS (SSL/TLS)**
```powershell
# Certbot (Let's Encrypt)
choco install certbot
certbot certonly --standalone -d yourdomain.com
```

### **3. Configurez un firewall**
```powershell
# Windows Firewall - Autoriser seulement les ports nécessaires
netsh advfirewall firewall add rule name="Allow HTTP" dir=in action=allow protocol=tcp localport=80
netsh advfirewall firewall add rule name="Allow HTTPS" dir=in action=allow protocol=tcp localport=443
netsh advfirewall firewall add rule name="Deny Backend Direct" dir=in action=block protocol=tcp localport=4000
```

### **4. Utilisez des variables d'environnement sécurisées**
```powershell
# Ne pas committer .env en production
# Utiliser des secrets gérés (AWS Secrets Manager, Azure Key Vault, etc.)
```

### **5. Activez les logs d'audit**
```bash
# Dans .env.production
FEATURE_AUDIT_LOGGING=true
LOG_LEVEL=info
LOG_FILE_ENABLED=true
```

---

## 🧪 TESTS DE MIGRATION

### **Test 1: Vérifier la connexion DB**
```powershell
cd c:\AKIG\backend
$env:DATABASE_URL="postgresql://akig:password@localhost:5432/akig_production"
node verify-environment.js
```

### **Test 2: Tester les endpoints**
```powershell
# Health check
Invoke-WebRequest -Uri http://localhost:4000/api/health

# Créer un contrat
$body = @{ title = "Test Contract"; amount = 1000 } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:4000/api/contracts -Method POST -Body $body -ContentType "application/json"

# Récupérer les contrats
Invoke-WebRequest -Uri http://localhost:4000/api/contracts
```

### **Test 3: Tester le frontend**
```powershell
# Ouvrir dans le navigateur
Start-Process "http://localhost:3000"

# Vérifier:
# 1. Page charge correctement
# 2. Badge HealthStatus affiche "Connected"
# 3. Pas d'erreurs en F12 > Console
# 4. API calls visibles en F12 > Network
```

---

## 📈 MONITORING EN PRODUCTION

### **Health Endpoints**
```
GET http://yourdomain.com/api/health
GET http://yourdomain.com/api/health/full
GET http://yourdomain.com/api/health/ready
GET http://yourdomain.com/api/health/alive
```

### **Logs**
```
Fichiers: backend/logs/combined.log
          backend/logs/error.log
          backend/logs/http.log
```

### **Performance**
```powershell
# Monitorer les processus Node
Get-Process node | Select-Object ProcessName, WorkingSet, CPU

# Monitorer la base de données
# PostgreSQL: SELECT * FROM pg_stat_statements;
```

---

## 🔄 ROLLBACK (en cas de problème)

```powershell
# 1. Arrêter le serveur de production
taskkill /IM node.exe /F

# 2. Revenir au mode développement
cd c:\AKIG\backend
node src\index-dev.js

# 3. Vérifier les logs d'erreur
Get-Content backend/logs/error.log | Select-Object -Last 50

# 4. Restaurer la base de données depuis sauvegarde
pg_restore -U akig -d akig_production backup.dump
```

---

## 📞 TROUBLESHOOTING

| Problème | Solution |
|----------|----------|
| `ECONNREFUSED` sur port 5432 | PostgreSQL n'est pas en cours d'exécution. Démarrez-le. |
| `password authentication failed` | Vérifiez DATABASE_URL et le mot de passe PostgreSQL |
| `port 3000 already in use` | `netstat -ano \| findstr :3000` puis `taskkill /PID <PID>` |
| `CORS error` | Mettez à jour CORS_ORIGIN dans `.env.production` |
| `npm start fails` | Vérifiez les logs: `node verify-environment.js` |

---

## 📚 RESSOURCES

- PostgreSQL Docs: https://www.postgresql.org/docs/
- Express.js: https://expressjs.com/
- React Production Build: https://create-react-app.dev/docs/production-build/
- Nginx: https://nginx.org/en/docs/
- PM2 Process Manager: https://pm2.keymetrics.io/

---

## ✨ PROCHAINES ÉTAPES

1. **Maintenant:** Testez en développement (vous êtes ici ✓)
2. **Suivant:** Installez PostgreSQL
3. **Puis:** Mettez à jour `.env.production`
4. **Ensuite:** Testez avec `npm start`
5. **Enfin:** Déployez sur votre serveur

**Questions?** Consultez les logs ou la documentation ci-dessus.

---

Generated: October 30, 2025
AKIG System - Production Migration Guide
