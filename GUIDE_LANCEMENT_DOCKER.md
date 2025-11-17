**Guide de Démarrage - AKIG 100% Fiable**

## Prérequis

✅ **Docker Desktop** installé et actif
- Télécharger : https://www.docker.com/products/docker-desktop
- Windows: Installer WSL2 (instalé auto avec Docker Desktop récent)
- Linux/Mac: Installer directement

## Lancement en 3 étapes

### Étape 1️⃣ : Bootstrap (5 min)
```bash
npm run bootstrap
```
- Installe les dépendances backend + frontend avec versions **verrouillées**
- Utilise `npm ci` (pas `npm install`) pour exactitude

### Étape 2️⃣ : Démarrage Docker (60-90 sec, première fois)

**Windows PowerShell:**
```powershell
powershell -ExecutionPolicy Bypass -File LAUNCH.ps1
```

**Linux/Mac/Git Bash:**
```bash
bash LAUNCH.sh
```

**Ou manuellement:**
```bash
docker compose up --build
```

### Étape 3️⃣ : Vérifier que tout est ✅

Ouvrir dans le navigateur:
- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:4000/api/health
- **Diagnostics**: http://localhost:4000/api/diagnostics/modules

**Attendre jusqu'à ce que BootGate disparaisse** (API est prête)

---

## Architecture

```
docker-compose.yml orchestre:

  postgres (Postgres 15)
       ↓ (healthcheck)
  api (Backend Node/Express)
       ↓ (healthcheck /api/health/ready)
  web (Frontend React/Tailwind)
```

**Points clés:**
- Postgres crée auto la base `akig_db` au 1er démarrage
- Backend exécute les migrations SQL au démarrage
- Frontend affiche **BootGate** jusqu'à ce que `/api/health` réponde (200 OK)
- Aucune page blanche possible

---

## Fichiers de Configuration

| Fichier | Rôle |
|---------|------|
| `.env.docker` | Variables d'environnement (Postgres, JWT, features) |
| `.nvmrc` | Lock Node.js 18.20.3 (Volta) |
| `package-lock.json` | Lock NPM exact (root, backend, frontend) |
| `docker-compose.yml` | Orchestre Postgres → API → web |
| `backend/.env` | Surcharge `.env.docker` en local |

---

## Commandes Utiles

```bash
# Bootstrap (une seule fois)
npm run bootstrap

# Lancer la stack Docker
npm run start:docker
# ou
docker compose up --build

# Arrêter proprement
docker compose down

# Voir les logs en temps réel
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres

# Tester la santé
npm run smoke

# Redémarrer un service
docker compose restart api
```

---

## Dépannage

### ❌ "Docker n'est pas installé"
→ Télécharger Docker Desktop et redémarrer

### ❌ "Port 3000/4000 déjà utilisé"
→ Arrêter toutes les stacks: `docker compose down`
→ Ou changer les ports dans `docker-compose.yml`

### ❌ "Page blanche au lieu de BootGate"
→ Les migrations SQL n'ont pas fini
→ Vérifier: `docker compose logs postgres`
→ Attendre que `docker compose ps` montre `healthy`

### ❌ "Login échoue / 401 Unauthorized"
→ Vérifier `JWT_SECRET` dans `.env.docker`
→ Redémarrer: `docker compose restart api`

### ❌ "Module X ne se charge pas"
→ Vérifier `FEATURE_FLAGS` dans `.env.docker`
→ Ouvrir http://localhost:4000/api/diagnostics/modules
→ Les modules actifs doivent être listés

---

## Points de Contrôle ✅

**1. Infrastructure prête:**
```bash
curl http://localhost:4000/api/health/ready
# → { "ready": true }
```

**2. Santé générale:**
```bash
curl http://localhost:4000/api/health
# → { "status": "ok", "modules": [...], "featureFlags": {...} }
```

**3. Diagnostics:**
```bash
curl http://localhost:4000/api/diagnostics/modules
# → { "modules": [...], "enabledModuleIds": [...] }
```

**4. Frontend chargé:**
- BootGate doit **disparaître** dans 5-10 sec
- Ou afficher: "Mode dégradé: L'API ne répond pas" si API lente

---

## Optimisation (Après validation)

Une fois que c'est stable, tu peux:

1. **Réduire les timers:**
   - `frontend/src/hooks/useSystemDiagnostics.ts`: passer `intervalMs` de 60000 à 10000

2. **Activer plus de features:**
   - Éditer `.env.docker`: `FEATURE_FLAGS=payments,sms,dashboard,audit_logging,csv_import,pdf_export`
   - Relancer: `docker compose down && docker compose up`

3. **Déployer en production:**
   - Changer `NODE_ENV=production` dans `.env.docker`
   - Définir `JWT_SECRET` fort (min 32 chars)
   - Changer `DB_PASSWORD` à quelque chose de sécurisé
   - Redémarrer: `docker compose up --build`

---

## Support

- **Docs API**: http://localhost:4000/api/docs
- **Swagger**: http://localhost:4000/api-docs (si activé)
- **Logs détaillés**: `docker compose logs --tail=100 -f api`
- **État des services**: `docker compose ps`

---

**Tu es prêt! 🚀**

Lance maintenant:
```bash
npm run bootstrap
npm run start:docker
```

Puis ouvre http://localhost:3000 dans 2-3 minutes.
