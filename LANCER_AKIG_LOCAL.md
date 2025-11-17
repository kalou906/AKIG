# 🚀 LANCER AKIG EN LOCAL - GUIDE COMPLET

**Date**: November 5, 2025  
**Setup**: Docker + Makefile + CI/CD  
**Status**: ✅ PRÊT À LANCER

---

## ✅ PRÉ-REQUISITES

### 1. **Vérifier Docker**
```bash
# Vérifier que Docker est installé et en marche
docker --version
docker ps

# Si Docker n'est pas démarré:
# Windows: Démarrer Docker Desktop
# Mac: Démarrer Docker Desktop
# Linux: sudo systemctl start docker
```

### 2. **Dépendances**
```bash
# Node.js (pour le seed manuel si besoin)
node --version  # v16+

# npm
npm --version   # v7+
```

---

## 🎯 LANCEMENT RAPIDE

### Option 1: Lancement Complet (Recommandé) ⭐

```bash
# 1. Aller au répertoire projet
cd c:\AKIG

# 2. Lancer avec reset automatique
make up

# 3. Attendre que les services démarrent (~30-60 secondes)
# Les logs doivent afficher: ✅ Services démarrés
```

**Que fait `make up`?**
- ✅ Démarre PostgreSQL
- ✅ Applique automatiquement les migrations
- ✅ Charge les données de test (seed)
- ✅ Démarre l'API backend
- ✅ Démarre le Frontend React
- ✅ Configure Nginx

---

## 🌐 ACCÈS À L'APPLICATION

### Après `make up`, accédez à:

```
✅ Frontend React:     http://localhost:3000
✅ API Backend:        http://localhost:4000
✅ API Health:         http://localhost:4000/api/health
✅ API Documentation:  http://localhost:4000/api/docs
```

---

## 🔐 CONNEXION (Credentials par défaut)

### Admin User (créé par le seed)
```
Email:     admin@akig.com
Password:  admin123
Role:      ADMIN
```

### Tenant User
```
Email:     tenant@example.com
Password:  tenant123
Role:      TENANT
```

---

## 📊 VÉRIFIER QUE TOUT MARCHE

### 1. **Vérifier les Services**
```bash
# Afficher le statut
make status

# Ou manuellement
docker ps | grep akig
```

**Expected Output:**
```
CONTAINER ID    IMAGE              PORTS              STATUS
xxxxx           postgres:15        5432->5432         Up 5 minutes (healthy)
xxxxx           akig_api          4000->4000         Up 4 minutes (healthy)
xxxxx           akig_web          3000->3000         Up 3 minutes
```

### 2. **Vérifier la Santé des Services**
```bash
make health

# Ou manuellement:

# PostgreSQL
psql -U akig_user -d akig_db -h localhost -c "SELECT version();"

# API
curl http://localhost:4000/api/health

# Frontend
curl http://localhost:3000
```

### 3. **Tester la Connexion**
```bash
# Lancer tests E2E
make test

# Ou tests UI seulement
make test-ui

# Tests rapides (Chrome seulement)
make test-fast
```

---

## 🎮 UTILISER L'APPLICATION

### Au Premier Lancement

1. **Accédez** → http://localhost:3000
2. **Connectez-vous** avec:
   - Email: `admin@akig.com`
   - Password: `admin123`
3. **Explorez** le dashboard:
   - 📊 KPIs (Encaissements, Impayés, etc.)
   - 👥 Modules (Locataires, Contrats, Propriétés)
   - 💰 Paiements
   - 🧾 Reçus
   - 📋 Portail Locataire (**Nouveau!**)
   - 📈 Comptabilité (**Nouveau!**)

### Genius Features Disponibles
```
✅ Portail Locataire      (Sidebar → Genius Features → Portail Locataire)
✅ Comptabilité Avancée   (API: /api/accounting-genius/*)
✅ Audit Trail            (Logging automatique)
✅ Paiements Améliorés    (9 méthodes de paiement)
✅ Reçus PDF              (Téléchargement automatique)
✅ Notifications          (Email alerts)
```

---

## 🛠️ COMMANDES UTILES

### Gestion des Services
```bash
# Démarrer
make up

# Arrêter
make down

# Redémarrer
make restart

# Voir les logs
make logs

# Afficher le statut
make status
```

### Gestion Base de Données
```bash
# Réinitialiser complètement (⚠️ perte de données!)
make reset

# Appliquer les migrations
make migrate

# Charger les données de test
make seed
```

### Tests & Build
```bash
# Tous les tests (Chrome, Firefox, Safari)
make test

# Tests UI seulement
make test-ui

# Tests rapides (Chrome)
make test-fast

# Build complet
make build

# Mode développement
make dev

# Production
make prod
```

### Maintenance
```bash
# Vérifier la santé
make health

# Voir aide complète
make help

# Nettoyer complètement
make clean

# Installer dépendances
make install
```

---

## 🔍 DÉPANNAGE

### Problème: "make: command not found"
**Solution:**
```bash
# Sur Windows: Vous avez besoin de GNU Make
# Télécharger: https://gnuwin32.sourceforge.net/packages/make.htm
# Ou utiliser: choco install make (si vous avez Chocolatey)

# Sur Mac: Installer Xcode Command Line Tools
xcode-select --install

# Sur Linux: Déjà installé (apt install make si besoin)
```

### Problème: "Docker is not running"
**Solution:**
```bash
# Démarrer Docker Desktop (Windows/Mac)
# Ou sur Linux:
sudo systemctl start docker
```

### Problème: "Port 3000/4000 already in use"
**Solution:**
```bash
# Option 1: Arrêter le service qui utilise le port
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000

# Option 2: Utiliser des ports différents dans .env
PORT=3001
API_PORT=4001
```

### Problème: "Database connection refused"
**Solution:**
```bash
# Vérifier PostgreSQL
docker logs akig_postgres

# Réinitialiser la BD
make reset

# Ou redémarrer depuis zéro
make clean
make up
```

### Problème: "Frontend blank/errors"
**Solution:**
```bash
# Vérifier les logs
docker logs akig_web

# Réinstaller dépendances
make clean
make install
make up
```

### Problème: "Tests failing"
**Solution:**
```bash
# Vérifier que les services tournent
make status

# Redémarrer les services
make restart

# Puis relancer les tests
make test
```

---

## 📈 MODES D'EXÉCUTION

### Mode Développement (Recommandé pour dev)
```bash
make dev
# ✅ Auto-reload
# ✅ Logs en temps réel
# ✅ Debugging facile
```

### Mode Production (Pour déployer)
```bash
make prod
# ✅ Optimisé
# ✅ Nginx en place
# ✅ Port 80
```

### CI/CD (Pour GitHub Actions)
```bash
make test-ci
# ✅ Reset
# ✅ Tests
# ✅ Deployment
```

---

## 🚀 DÉPLOIEMENT

### Sur Serveur
```bash
# 1. Push sur GitHub (main branch)
git push origin main

# 2. GitHub Actions s'exécute automatiquement:
# - npm install
# - npm test
# - Docker build
# - Push sur registre
# - Deploy sur serveur

# 3. Application disponible sur votre domaine
```

### Configuration .env (Optionnel)
```bash
# Créer .env à la racine du projet
cp .env.example .env

# Modifier les valeurs
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

---

## 📊 ARCHITECTURE

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│       http://localhost:3000             │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│    API Backend (Express + Node.js)      │
│       http://localhost:4000             │
│    - REST endpoints                     │
│    - JWT Authentication                 │
│    - Audit Logging                      │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│      PostgreSQL Database                │
│    (localhost:5432)                     │
│    - 50+ tables                         │
│    - Migrations                         │
│    - Seed data                          │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE DÉMARRAGE

- [ ] Docker est installé et lancé
- [ ] Node.js v16+ installé
- [ ] Vous êtes dans le répertoire c:\AKIG
- [ ] Vous avez exécuté: `make up`
- [ ] Les services montrent "healthy"
- [ ] Vous pouvez accéder http://localhost:3000
- [ ] Vous êtes connecté avec admin@akig.com / admin123
- [ ] Vous voyez le dashboard avec les KPIs
- [ ] Les modules Locataires/Contrats/etc. sont peuplés
- [ ] Portail Locataire visible dans "Genius Features"

---

## 🎉 VOUS ÊTES PRÊT!

```
✅ Docker + Makefile en place
✅ Services configurés
✅ Tests prêts
✅ Déploiement automatisé
✅ Application prête à l'emploi
```

**Prochaine étape:**
```bash
cd c:\AKIG
make up
# Puis accédez à http://localhost:3000
```

---

**Bonne chance et bienvenue dans AKIG! 🚀**

**Besoin d'aide?**
- Voir: `make help`
- Logs: `make logs`
- Santé: `make health`
- Tests: `make test`

---

**Last Updated**: November 5, 2025  
**Status**: ✅ READY TO LAUNCH
