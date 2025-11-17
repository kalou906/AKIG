# 🚀 LANCER AKIG EN LOCAL - GUIDE WINDOWS

**Date**: November 5, 2025  
**Plateforme**: Windows (PowerShell + Docker Desktop + WSL2)  
**Status**: ✅ PRÊT À LANCER

---

## ✅ PRÉ-REQUISITES WINDOWS

### 1. **Docker Desktop**
```powershell
# Vérifier installation
docker --version
# Expected: Docker version 20.10+

# Vérifier que Docker tourne
docker ps
# If error: Lancez Docker Desktop
```

**Installation (si absent):**
- Télécharger: https://www.docker.com/products/docker-desktop
- Installer avec options par défaut
- Redémarrer Windows
- Lancer Docker Desktop

### 2. **Make (GNU Make)**
```powershell
# Vérifier installation
make --version

# Si "command not found": installer
choco install make
# (Ou télécharger: https://gnuwin32.sourceforge.net/packages/make.htm)

# Redémarrer PowerShell après installation
```

### 3. **Git Bash (Optionnel mais recommandé)**
- Télécharger: https://git-scm.com/download/win
- Installer avec options par défaut
- Cela rend les commandes bash + make plus faciles

---

## 🎯 LANCEMENT RAPIDE (WINDOWS)

### **OPTION 1: PowerShell (Recommandé pour Windows)**

```powershell
# 1. Ouvrir PowerShell en tant qu'administrateur
# (Clic droit → Windows PowerShell → Run as administrator)

# 2. Aller au répertoire projet
cd C:\AKIG

# 3. Lancer les services
make up

# 4. Attendre: ✅ Services démarrés (30-60 secondes)
```

### **OPTION 2: Command Prompt (cmd.exe)**

```cmd
# 1. Ouvrir Command Prompt en tant qu'administrateur

# 2. Aller au répertoire projet
cd C:\AKIG

# 3. Lancer les services
make up

# 4. Attendre: ✅ Services démarrés
```

### **OPTION 3: Git Bash (Meilleur shell)**

```bash
# 1. Ouvrir Git Bash

# 2. Aller au répertoire projet
cd /c/AKIG

# 3. Lancer les services
make up

# 4. Attendre: ✅ Services démarrés
```

---

## 🌐 ACCÈS APRÈS LANCEMENT

```
✅ Frontend React:     http://localhost:3000
✅ API Backend:        http://localhost:4000
✅ API Health:         http://localhost:4000/api/health
```

Ouvrez dans votre navigateur préféré (Chrome, Edge, Firefox, Safari)

---

## 🔐 CONNEXION

### Credentials (Créés automatiquement par le seed)

**Admin User:**
```
Email:     admin@akig.com
Password:  admin123
```

**Tenant User:**
```
Email:     tenant@example.com
Password:  tenant123
```

---

## 📊 VÉRIFIER QUE TOUT MARCHE

### **Méthode 1: Vérifier les services**
```powershell
make status

# Vous devriez voir:
# akig_postgres    postgres:15  5432->5432   Up 5 min    (healthy)
# akig_api         akig_api    4000->4000   Up 4 min    (healthy)
# akig_web         akig_web    3000->3000   Up 3 min    (running)
```

### **Méthode 2: Vérifier la santé**
```powershell
make health

# Vous devriez voir:
# 🔵 PostgreSQL: ✅ Disponible
# 🔵 API: ✅ Disponible
# 🔵 Frontend: ✅ Disponible
```

### **Méthode 3: Accès via Navigateur**
```
1. Ouvrez: http://localhost:3000
2. Connectez-vous avec: admin@akig.com / admin123
3. Vérifiez que le dashboard s'affiche
```

### **Méthode 4: Tests Automatisés**
```powershell
# Lancer les tests Playwright (multi-navigateurs)
make test

# Ou tests UI seulement
make test-ui

# Ou tests rapides
make test-fast
```

---

## 🎮 UTILISER L'APPLICATION

### Premier Accès
```
1. Allez à http://localhost:3000
2. Connectez-vous: admin@akig.com / admin123
3. Explorez le dashboard
```

### Features Disponibles
```
✅ Dashboard avec KPIs
✅ Gestion des locataires
✅ Gestion des contrats
✅ Gestion des propriétés
✅ Paiements
✅ Reçus PDF
✅ Portail Locataire (NOUVEAU!)        ← En Sidebar
✅ Comptabilité Avancée (NOUVEAU!)     ← API
✅ Audit Trail (NOUVEAU!)              ← Logging
```

### Accéder au Portail Locataire
```
1. Connectez-vous (admin ou tenant)
2. Regardez la barre latérale gauche
3. Trouvez: "GENIUS FEATURES"
4. Cliquez: "Portail Locataire"
5. Explorez le dashboard des locataires
```

---

## 🛠️ COMMANDES UTILES (WINDOWS)

### Gestion des Services
```powershell
# Démarrer
make up

# Arrêter
make down

# Redémarrer
make restart

# Voir les logs en direct
make logs

# Afficher le statut
make status

# Vérifier la santé
make health
```

### Gestion Base de Données
```powershell
# Réinitialiser complètement (⚠️ perte de données!)
make reset

# Appliquer les migrations
make migrate

# Charger les données de test
make seed
```

### Tests
```powershell
# Tous les tests
make test

# Tests UI seulement
make test-ui

# Tests rapides (Chrome)
make test-fast

# Build complet
make build
```

### Mode Développement
```powershell
# Mode dev avec watch
make dev

# Mode production
make prod
```

### Aide
```powershell
# Voir toutes les commandes
make help

# Nettoyer complètement
make clean

# Installer dépendances
make install
```

---

## 🔍 DÉPANNAGE (WINDOWS)

### ❌ Problème: "make: command not found"

**Solution 1: Installer GNU Make**
```powershell
choco install make
# Puis redémarrer PowerShell
```

**Solution 2: Utiliser docker-compose directement**
```powershell
docker-compose up -d
```

**Solution 3: Utiliser Git Bash**
```bash
bash start-local.sh
```

---

### ❌ Problème: "Docker is not running"

**Solution:**
1. Démarrer Docker Desktop (cherchez dans Start Menu)
2. Attendre que l'icône Docker montre une coche verte
3. Réessayer: `docker ps`

---

### ❌ Problème: "Port 3000 already in use"

**Solution 1: Trouver le processus**
```powershell
# Trouver ce qui utilise le port 3000
netstat -ano | findstr :3000
# Copier le PID (numéro à gauche)

# Tuer le processus
taskkill /PID <le_numero> /F
```

**Solution 2: Utiliser des ports différents**
```powershell
# Modifier dans docker-compose.yml
ports:
  - "3001:3000"  # Changer 3000 → 3001
```

**Solution 3: Arrêter le conteneur qui l'occupe**
```powershell
make down
```

---

### ❌ Problème: "Database connection refused"

**Solution:**
```powershell
# Vérifier que PostgreSQL est en marche
docker ps | grep postgres

# Réinitialiser la base de données
make reset

# Ou redémarrer complètement
make down
make clean
make up
```

---

### ❌ Problème: "Frontend shows blank page"

**Solution:**
```powershell
# Vérifier les logs du frontend
docker logs akig_web

# Réinstaller les dépendances
make clean
make install
make up

# Vider cache navigateur: Ctrl+Shift+Del
```

---

### ❌ Problème: "Tests failing"

**Solution:**
```powershell
# Vérifier que les services tournent
make status

# Redémarrer les services
make restart

# Attendre 30 secondes
Start-Sleep -Seconds 30

# Relancer les tests
make test
```

---

## 📋 CHECKLIST DE DÉMARRAGE

```powershell
# Exécutez cette checklist avant de signaler un problème:

# 1. Docker tourne?
docker ps
# ✅ Devrait afficher des conteneurs

# 2. Make installé?
make --version
# ✅ Devrait afficher version

# 3. Services démarrés?
make status
# ✅ Tous les services en "Up"

# 4. Services healthy?
make health
# ✅ Tous marqués comme "Disponible"

# 5. Frontend accessible?
Invoke-WebRequest -Uri http://localhost:3000
# ✅ Devrait retourner StatusCode 200

# 6. API accessible?
Invoke-WebRequest -Uri http://localhost:4000/api/health
# ✅ Devrait retourner JSON

# 7. Connexion possible?
# ✅ Allez à http://localhost:3000 et connectez-vous
```

---

## 🎓 EXPLICATIONS

### Qu'est-ce que `make up` fait?

```
1. Démarre PostgreSQL (base de données)
   ↓
2. Applique les migrations (crée les tables)
   ↓
3. Charge les données de test (seed)
   ↓
4. Démarre l'API backend (Express.js)
   ↓
5. Démarre le Frontend (React)
   ↓
6. Configure Nginx (reverse proxy)
   ↓
✅ Tout est prêt!
```

### Temps de démarrage

```
- Docker pull images:        ~2-5 min (première fois)
- PostgreSQL startup:         ~10 sec
- Migrations + seed:          ~5-10 sec
- API startup:                ~5 sec
- Frontend build:             ~20-30 sec
- Nginx startup:              ~2 sec
────────────────────────────────────
TOTAL PREMIÈRE FOIS:          ~45-60 sec
AUTRES FOIS:                  ~30 sec
```

### Pourquoi Docker?

```
✅ Pas besoin d'installer PostgreSQL, Node.js sur Windows
✅ Environnement identique au serveur
✅ Facile à nettoyer (make clean)
✅ Pas de conflits de ports si bien configuré
✅ Tests reproduisibles
```

---

## 🚀 RACCOURCIS WINDOWS

### PowerShell: Alias utiles

Ajouter dans votre profil PowerShell ($PROFILE):

```powershell
# Lancer AKIG
New-Alias akig-up "make up"
New-Alias akig-down "make down"
New-Alias akig-logs "make logs"
New-Alias akig-status "make status"

# Utilisation:
akig-up
akig-logs
akig-status
```

### Créer un raccourci sur le Bureau

1. Clic droit sur Bureau → New → Shortcut
2. Target: `C:\Windows\System32\cmd.exe /k cd C:\AKIG && make up`
3. Start in: `C:\AKIG`
4. Name: `AKIG Launcher`
5. Cliquer pour lancer!

---

## ✅ CHECKLIST FINALE

```powershell
[✅] Docker Desktop installé et lancé
[✅] GNU Make installé
[✅] Vous êtes dans C:\AKIG
[✅] Vous avez exécuté: make up
[✅] Les services montrent "healthy"
[✅] http://localhost:3000 accessible
[✅] Connecté avec admin@akig.com / admin123
[✅] Dashboard visible avec KPIs
[✅] Données (Locataires, etc.) visibles
[✅] Portail Locataire dans Genius Features
```

---

## 🎉 VOUS ÊTES PRÊT!

```powershell
cd C:\AKIG
make up
# Puis ouvrez http://localhost:3000 dans votre navigateur
```

---

## 📞 AIDE RAPIDE

```powershell
# Voir toutes les commandes
make help

# Voir les logs
make logs

# Vérifier la santé
make health

# Arrêter
make down

# Nettoyer
make clean
```

---

**Bonne utilisation de AKIG! 🚀**

**Dernière mise à jour**: November 5, 2025  
**Status**: ✅ READY TO LAUNCH
