# 🚀 Backend AKIG - PRÊT À LANCER

## ✅ État du Système

- ✓ Routes API corrigées et fonctionnelles
- ✓ Middleware de sécurité stabilisé
- ✓ Health checks opérationnels
- ✓ Tests unitaires validés
- ✓ Structure modulaire propre

## 📋 Pré-requis

- Node.js 18.20.3
- PostgreSQL 14+
- Redis (optionnel pour rate limiting avancé)

## ⚡ Démarrage Rapide

### 1. Configuration Environment

Créer `.env` à la racine du backend:

```env
# Database
DATABASE_URL=postgres://postgres:votre_mot_de_passe@localhost:5432/akig

# Security
JWT_SECRET=votre_secret_jwt_tres_securise_minimum_32_caracteres
NODE_ENV=development

# Server
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000

# Optional: Rate Limiting
REDIS_URL=redis://localhost:6379
```

### 2. Installation

```powershell
cd c:\AKIG\backend
npm install
```

### 3. Database Setup

```powershell
# Option A: Si PostgreSQL déjà configuré
npm run migrate

# Option B: Init complète
psql -U postgres -c "CREATE DATABASE akig;"
npm run migrate
```

### 4. Lancer le Serveur

```powershell
# Mode développement avec auto-reload
npm run dev

# Mode production
npm start
```

## 🧪 Vérification

### Health Check

```powershell
# Sans DB (rapide)
Invoke-WebRequest http://localhost:4000/api/health/status

# Avec DB (complet)
Invoke-WebRequest http://localhost:4000/api/health
```

### Tests

```powershell
# Tous les tests
npm test

# Test health uniquement
npm test -- --testPathPattern "health.test.js"
```

## 📡 Endpoints Disponibles

### Core
- `GET /api/health` - Health check complet
- `GET /api/health/status` - Status rapide
- `GET /metrics` - Prometheus metrics

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Business
- `/api/tenants` - Gestion locataires
- `/api/properties` - Gestion propriétés
- `/api/contracts` - Gestion contrats
- `/api/payments` - Gestion paiements

## 🛠️ Scripts Disponibles

```json
{
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "migrate": "node src/scripts/runMigrations.js",
  "test": "jest --forceExit --detectOpenHandles",
  "test:coverage": "jest --coverage --forceExit"
}
```

## 🔧 Dépannage

### Erreur: Missing JWT_SECRET
→ Ajouter `JWT_SECRET` dans `.env`

### Erreur: Database connection failed
→ Vérifier `DATABASE_URL` et que PostgreSQL est lancé

### Port 4000 déjà utilisé
→ Changer `PORT` dans `.env` ou tuer le processus:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
```

## 📊 Structure du Projet

```
backend/
├── src/
│   ├── routes/          # API endpoints
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── db-utils.js     # Database helpers
│   ├── app.js          # Express app config
│   └── index.js        # Server entry point
├── __tests__/          # Tests unitaires
├── .env                # Configuration
└── package.json
```

## 🎯 Prochaines Étapes

1. ✅ **Système fonctionnel** - Prêt à lancer
2. 🔄 Ajouter plus de tests (couverture actuelle: base)
3. 🔐 Configurer RBAC complet
4. 📊 Dashboard monitoring (Grafana/Prometheus)
5. 🚀 Déploiement production

## 📞 Support

- Documentation API: `/api/health/config` (dev mode)
- Logs: `backend.log` et `backend-error.log`
- Tests: Voir `__tests__/unit/`

---

**Status**: ✅ PRÊT À LANCER
**Version**: 1.0.0
**Dernière mise à jour**: 14 novembre 2025
