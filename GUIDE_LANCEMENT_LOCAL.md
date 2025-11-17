# 🚀 AKIG - Lancement 100% Fiable (Mode Local)

## Vue d'ensemble

**Situation:** Docker n'est pas disponible sur ta machine.

**Solution:** Lancer PostgreSQL en local + Backend API + Frontend React sur ta machine.

**Durée:** 10-15 minutes (setup) + 2-3 min (lancement)

---

## Étapes de Configuration

### 1️⃣ Installer PostgreSQL 15

#### Windows
1. Télécharger: https://www.postgresql.org/download/windows/
2. Installer avec les paramètres par défaut
   - Port: **5432** (défaut)
   - Password utilisateur `postgres`: garder un truc simple (ex: `postgres`)
3. ✅ Assurer que le service PostgreSQL est en cours d'exécution
   - Chercher "Services" → localiser "postgresql-x64" → vérifier qu'il est "Exécution"

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux (Debian/Ubuntu)
```bash
sudo apt-get update
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

### 2️⃣ Vérifier que PostgreSQL marche

```bash
psql --version
# → psql (PostgreSQL) 15.x
```

```bash
psql -U postgres -c "SELECT version();"
# → PostgreSQL 15...
```

Si ça échoue → PostgreSQL n'est pas accessible.  
**Solution:** Vérifier le port 5432, ou relancer le service.

---

## Lancement Rapide

### Windows PowerShell

```powershell
cd c:\AKIG
.\LAUNCH_LOCAL.bat
```

**Ce que ça fait:**
1. Crée la base `akig_db` et l'utilisateur `akig`
2. Exécute `npm run bootstrap`
3. Lance Backend + Frontend dans 2 fenêtres séparées
4. Ouvre http://localhost:3000 dans le navigateur

### Linux/macOS Bash

```bash
cd ~/AKIG
bash LAUNCH_LOCAL.sh
```

---

## Lancement Manuel (étape par étape)

Si les scripts ne marchent pas, faire manuellement:

### Étape 1 : Créer la base de données

```bash
psql -U postgres
```

Puis taper dans psql:

```sql
CREATE DATABASE akig_db;
CREATE USER akig WITH PASSWORD 'akig_password';
ALTER USER akig WITH PASSWORD 'akig_password';
GRANT ALL PRIVILEGES ON DATABASE akig_db TO akig;
\q
```

### Étape 2 : Configurer le backend

Créer `backend/.env`:

```bash
PORT=4000
DATABASE_URL=postgresql://akig:akig_password@localhost:5432/akig_db
JWT_SECRET=akig_jwt_secret_key_development_min_32_chars_long_change_in_prod
FEATURE_FLAGS=payments,sms,dashboard
DISABLE_REDIS=true
```

### Étape 3 : Bootstrap

```bash
npm run bootstrap
```

### Étape 4 : Lancer tout

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:guarded
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Navigateur:**
```
http://localhost:3000
```

---

## ✅ Vérification

Une fois lancé, vérifier ceci:

### 1. Backend santé
```bash
curl http://localhost:4000/api/health
```
Doit retourner:
```json
{
  "status": "ok",
  "uptime": 15,
  "services": {"database": "connected"},
  "modules": {"total": 5, "enabled": 5}
}
```

### 2. Frontend BootGate
- Ouvrir http://localhost:3000
- Voir le **BootGate** (écran "Initialisation...")
- Après 5-10 sec → BootGate disparaît
- La page affiche "AKIG Immobilier"

### 3. Diagnostics modules
```bash
curl http://localhost:4000/api/diagnostics/modules
```
Doit lister tous les modules actifs.

---

## Dépannage

### ❌ "psql: commande introuvable"
→ PostgreSQL n'est pas installé ou pas dans le PATH.  
**Solution:** Installer PostgreSQL 15, puis relancer.

### ❌ "FATAL: Ident authentication failed for user postgres"
→ Problème d'authentification PostgreSQL.  
**Solution:**
```bash
# Windows: éditer C:\Program Files\PostgreSQL\15\data\pg_hba.conf
# Changer "ident" en "md5" pour local
# Redémarrer le service PostgreSQL
```

### ❌ "Port 5432 déjà utilisé"
→ Un autre service Postgres tourne en arrière-plan.  
**Solution:**
```bash
# Windows
Get-Process | Where-Object {$_.ProcessName -like "*postgres*"} | Stop-Process
# Linux/Mac
sudo lsof -i :5432
sudo kill -9 <PID>
```

### ❌ "Port 4000 ou 3000 déjà utilisé"
→ Backend/Frontend déjà lancés.  
**Solution:** Arrêter la fenêtre précédente, ou changer les ports:
```bash
# backend/.env
PORT=5000  # au lieu de 4000

# frontend/.env
REACT_APP_API_URL=http://localhost:5000  # pointer au nouveau port
```

### ❌ "BootGate ne disparaît pas"
→ Backend n'a pas fini de démarrer (migrations DB).  
**Solution:**
1. Vérifier `backend` terminal → chercher `[MIGRATION]` logs
2. Attendre ~30 sec
3. Si pas de changement → tuer et relancer:
```bash
# Ctrl+C dans backend terminal
npm run start:guarded
```

### ❌ "Page blanche au lieu du app"
→ Erreur React non capturée.  
**Solution:**
1. Ouvrir DevTools (F12)
2. Voir l'erreur dans Console
3. Vérifier `REACT_APP_API_URL` dans `frontend/.env`

---

## Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `backend/.env` | Connexion Postgres, JWT secret, features |
| `frontend/.env` | URL de l'API, variables React |
| `backend/src/scripts/start.js` | Démarre migrations + serveur |
| `frontend/src/hooks/useSystemDiagnostics.ts` | Vérifie `/api/health` |
| `frontend/src/components/BootGate.tsx` | Écran d'attente API |

---

## Commandes Utiles

```bash
# Bootstrap unique fois
npm run bootstrap

# Lancer tout (backend + frontend concurrently)
npm run start:local

# Juste backend
npm --prefix backend run start:guarded

# Juste frontend
npm --prefix frontend start

# Smoke tests
npm run smoke

# Voir les logs détaillés du backend
npm --prefix backend run dev
```

---

## Structure 100% Fiable

```
AKIG (local)
├── backend (Node.js 18 + Express)
│   ├── src/index.js (serveur API)
│   ├── src/scripts/start.js (migrations + boot)
│   ├── migrations/*.sql (schéma DB)
│   └── .env (variables secrètes)
├── frontend (React 18 + Tailwind)
│   ├── src/App.tsx (entry point)
│   ├── src/components/BootGate.tsx (écran attente)
│   └── .env (API_URL)
└── postgres (localhost:5432)
    └── akig_db (base)
```

**Points clés:**
- Migrations exécutées au démarrage backend (idempotentes)
- BootGate montre "Initialisation..." jusqu'à `/api/health` = 200
- Aucun appel réseau avant que l'API soit prête
- Feature flags synchronisés backend ↔ frontend
- Auto-retry sur login/paiements en cas de réseau instable

---

## Prochaines Étapes

Une fois que c'est stable:

### 1. Tester les fonctionnalités
- Login avec compte test
- Enregistrer un paiement
- Envoyer un SMS
- Générer un PDF

### 2. Créer des données de test
```bash
# Charger des données depuis SQL
psql -U akig -d akig_db -f backend/migrations/seed.sql
```

### 3. Activer plus de modules
- Éditer `.env.docker` ou `backend/.env`
- Ajouter `FEATURE_FLAGS=payments,sms,dashboard,audit_logging,csv_import`
- Relancer backend

### 4. Déployer en production
- Changer `NODE_ENV=production`
- Générer `JWT_SECRET` sécurisé (min 32 chars)
- Changer `DATABASE_URL` vers Postgres cloud (AWS RDS, Render, etc.)
- Déployer frontend sur Vercel/Netlify, backend sur Heroku/Railway

---

## Support

**Questions?**

- Vérifier les logs: `npm --prefix backend run dev`
- Voir l'état: `docker compose ps` (si Docker actif)
- Tester endpoints: `curl http://localhost:4000/api/health`
- Documentation API: http://localhost:4000/api/docs

---

**Tu es prêt! 🚀**

Lancer maintenant:
```bash
# Windows
.\LAUNCH_LOCAL.bat

# Linux/Mac
bash LAUNCH_LOCAL.sh
```

Puis ouvre http://localhost:3000 dans 3-5 minutes.
