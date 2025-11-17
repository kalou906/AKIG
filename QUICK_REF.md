# ⚡ AKIG - Quick Reference

> **Pense-bête pour démarrer et utiliser AKIG**

## 🚀 Start (5 min)

```powershell
# Terminal 1
cd c:\AKIG\backend
npm install              # Première fois seulement
npm run dev              # Démarre backend

# Terminal 2
cd c:\AKIG\frontend
npm install              # Première fois seulement
npm start                # Démarre frontend

# Terminal 3
cd c:\AKIG
.\test-api.ps1          # Teste les endpoints
```

**Accès:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health: http://localhost:4000/api/health

---

## 📦 Commands

```powershell
# Voir les scripts
.\COMMANDS.ps1
.\test-api.ps1

# npm
npm install              # Installer dépendances
npm run dev              # Développement (backend)
npm start                # Développement (frontend)
npm run build            # Build production
npm test                 # Tests
```

---

## 🔌 API Endpoints

```
POST   /api/auth/login
GET    /api/contracts
GET    /api/payments
GET    /api/tenants
GET    /api/health
```

Test: `.\test-api.ps1`

---

## ⚙️ Configuration

**backend/.env:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=votre-clé-secrète
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

---

## 📊 Logs

```powershell
# Voir les logs
Get-Content backend/logs/info-*.log -Tail 50
Get-Content backend/logs/error-*.log -Tail 50

# Suivre en temps réel
Get-Content backend/logs/error-*.log -Tail 50 -Wait
```

---

## 🆘 Troubleshooting

| Problème | Solution |
|----------|----------|
| Port 4000 utilisé | Changer PORT dans .env |
| DB connection error | Vérifier DATABASE_URL |
| Module not found | npm install |
| Frontend page blanche | Remove build, restart |
| API 401 | Token expiré, re-login |

---

## 📚 Documentation

- **GUIDE_COMPLET.md** ← Vous êtes ici
- **README.md** - Vue générale
- **README_INSTALLATION.md** - Installation
- **API_DOCUMENTATION.md** - Endpoints
- **IMPROVEMENTS_SUMMARY.md** - Améliorations
- **AKIG_FINALE.md** - Aperçu technique

---

## 🔐 Sécurité

- JWT: 24h expiration
- Passwords: Bcrypt
- CORS: Configuré
- Rate Limit: 100/15min

---

## ✅ Status

- Frontend: ✅ 69.07 kB (compiled)
- Backend: ✅ Valid syntax
- Types: ✅ Installed
- Errors: ✅ 0 critical

---

## 💡 Tips

```powershell
# Démarrer front + back rapidement
. .\COMMANDS.ps1
Start-AKIG

# Tester rapidement
.\test-api.ps1

# Voir les commandes
.\COMMANDS.ps1
```

---

**Version:** 2.1 | **Status:** ✅ Ready | **Errors:** 0
