# ✅ AKIG - VÉRIFICATIONS RAPIDES

**Status**: Prêt à lancer  
**Plateforme**: Windows + Docker + Make

---

## 🔍 AVANT DE LANCER

### ✅ Docker
```powershell
docker --version
# Expected: Docker version 20.10 or higher

docker ps
# Expected: No error (Docker is running)
```

### ✅ Make
```powershell
make --version
# Expected: GNU Make 3.81+

# If not found: choco install make
```

### ✅ Répertoire
```powershell
cd C:\AKIG
dir Makefile
# Expected: Makefile exists

dir docker-compose.yml
# Expected: docker-compose.yml exists
```

---

## 🚀 LANCER

```powershell
cd C:\AKIG
make up

# Wait for: ✅ Services démarrés
```

---

## ✅ APRÈS LANCEMENT

### Check Services
```powershell
make status

# Expected: All containers "Up"
```

### Check Health
```powershell
make health

# Expected: All services "Available"
```

### Check URLs
```
http://localhost:3000    ← Frontend
http://localhost:4000    ← API
http://localhost:4000/api/health    ← API Health
```

---

## 🔐 LOGIN

```
Email:    admin@akig.com
Password: admin123
```

---

## 📋 VÉRIFICATIONS DÉTAILLÉES

### 1. PostgreSQL
```powershell
docker exec akig_postgres pg_isready -U akig_user
# Expected: accepting connections
```

### 2. API
```powershell
curl http://localhost:4000/api/health
# Expected: JSON response with status: ok
```

### 3. Frontend
```powershell
curl http://localhost:3000
# Expected: HTML response (no error)
```

### 4. Database Tables
```powershell
docker exec akig_postgres psql -U akig_user -d akig_db -c "\dt"
# Expected: List of tables (50+)
```

---

## 🧪 TESTS

### All Tests
```powershell
make test
# Expected: Tests pass on Chrome, Firefox, Safari
```

### Quick Tests
```powershell
make test-fast
# Expected: Tests pass on Chrome only
```

### UI Tests
```powershell
make test-ui
# Expected: UI tests pass
```

---

## ⚠️ SI ERREUR

### Port en utilisation
```powershell
netstat -ano | findstr :3000
taskkill /PID <number> /F
```

### Docker pas en marche
```powershell
# Lancez Docker Desktop
docker ps
```

### Base de données erreur
```powershell
make reset
```

### Tout cassé?
```powershell
make clean
make up
```

---

## 🎯 FEATURES À TESTER

✅ Connectez-vous avec admin@akig.com  
✅ Voir le Dashboard  
✅ Voir les Modules (Locataires, Contrats, etc.)  
✅ Voir Genius Features dans la barre latérale  
✅ Cliquer sur "Portail Locataire"  
✅ Voir le nouveau tableau de bord tenant  

---

## 📞 AIDE

```powershell
make help          # Toutes les commandes
make logs          # Logs en direct
make status        # État des services
make health        # Santé des services
make down          # Arrêter
```

---

**Vous êtes prêt! 🚀**

`cd C:\AKIG && make up`
