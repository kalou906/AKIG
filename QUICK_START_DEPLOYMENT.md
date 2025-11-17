# 🚀 DÉPLOIEMENT RAPIDE - SYSTÈME PRÉAVIS ULTRA-SOPHISTIQUÉ

**Temps total estimé**: ~3 heures (installation + tests + lancement progressif)

---

## 📋 PRÉ-REQUIS (10 MIN)

```powershell
# 1. Vérifier Node.js 18.20.3
node --version  # Doit afficher v18.20.3

# 2. Vérifier npm 10.7.0+
npm --version   # Doit afficher 10.7.0 ou plus

# 3. PostgreSQL 12+
# Télécharger depuis: https://www.postgresql.org/download/windows/

# 4. Clés de services externes
# - Twilio SMS: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
# - SendGrid Email: SENDGRID_API_KEY
# - Meta WhatsApp: META_BUSINESS_ACCOUNT_ID + META_ACCESS_TOKEN
```

---

## 🏃 LANCEMENT RAPIDE (3 ÉTAPES)

### Option 1: Déploiement Complet Automatisé (Recommandé)

```powershell
# Terminal PowerShell (Admin)
cd c:\AKIG

# Lancer le déploiement complet (all phases)
.\DEPLOYMENT_PROGRESSIVE.ps1 -Phase all

# OU pour phases individuelles:
.\DEPLOYMENT_PROGRESSIVE.ps1 -Phase canary     # Phase 1 seulement
.\DEPLOYMENT_PROGRESSIVE.ps1 -Phase phase2     # Phase 2
.\DEPLOYMENT_PROGRESSIVE.ps1 -Phase full       # Phase 3 (100%)
```

### Option 2: Déploiement Manuel Étape par Étape

#### Étape 1: Installation (20 min)
```powershell
cd c:\AKIG

# Installation des dépendances
npm run bootstrap

# Vérification
npm --version  # Check: >= 10.7.0
node --version # Check: 18.20.3
```

#### Étape 2: Configuration (15 min)
```powershell
# 1. Copier le fichier .env
cp .env.example .env

# 2. Configurer les variables
# Éditer c:\AKIG\.env avec vos clés:
# DATABASE_URL=postgresql://user:password@localhost:5432/akig
# JWT_SECRET=your-secret-key
# TWILIO_ACCOUNT_SID=your-twilio-sid
# TWILIO_AUTH_TOKEN=your-twilio-token
# SENDGRID_API_KEY=your-sendgrid-key
# META_BUSINESS_ACCOUNT_ID=your-meta-id
# META_ACCESS_TOKEN=your-meta-token

# 3. Initialiser la base de données
cd backend
npm run migrate

# 4. Charger les données de test
npm run seed
```

#### Étape 3: Tests (30 min)
```powershell
cd c:\AKIG

# Smoke tests (rapide)
npm run smoke

# Tests complets (E2E multi-navigateurs)
cd frontend
npm run test:notice-system

# Tests de performance
npm run perf:baseline
```

#### Étape 4: Démarrage Services (5 min)
```powershell
cd c:\AKIG

# Option A: Démarrer les deux en parallèle (RECOMMANDÉ)
npm start  # Combine: npm run start:api + npm run start:web

# Option B: Démarrer séparément (2 terminaux)
# Terminal 1:
npm run start:api      # Backend sur http://localhost:4000

# Terminal 2:
npm run start:web      # Frontend sur http://localhost:3000
```

#### Étape 5: Vérification Santé (2 min)
```powershell
# Dans un nouveau terminal:
cd c:\AKIG
.\HEALTH_CHECK.ps1

# Vous devez voir:
# ✓ Backend API: OK
# ✓ Base de Données: OK
# ✓ Frontend Build: OK
# 🟢 STATUT GLOBAL: SAIN
```

---

## 🌐 ACCÈS AU SYSTÈME

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Dashboard** | http://localhost:3000 | test@akig.com / password123 |
| **API** | http://localhost:4000/api | Bearer token via /auth/login |
| **Health** | http://localhost:4000/api/health | Public |
| **PostgreSQL** | localhost:5432 | user/password (config .env) |
| **Logs** | c:\AKIG\deployment-logs | Tous les déploiements |

---

## 📊 PHASES DE DÉPLOIEMENT PROGRESSIF

### Phase 1: Canary (10% traffic) - 5 min
- Démarrage backend seul
- Smoke tests
- Monitoring hautement actif
- Seuil d'erreur: 0.5% max

**Actions si erreurs**:
```powershell
.\DEPLOYMENT_PROGRESSIVE.ps1 -Phase rollback
```

### Phase 2: 50% Traffic - 10 min
- Ouverture du frontend
- Tests E2E complets
- Monitoring standard
- Seuil d'erreur: 2% max

### Phase 3: 100% Production - 3 jours progressifs
- **Jour 1**: Déploiement complet
- **Jour 2**: Vérifications supplémentaires
- **Jour 3**: Support 24h actif

---

## 🔍 COMMANDES UTILES

### Monitoring et Logs
```powershell
# Voir les logs en temps réel
Get-Content c:\AKIG\deployment-logs\deployment_*.log -Tail 50 -Wait

# Vérifier les processus actifs
Get-Process | Where-Object {$_.Name -match "node|npm"}

# Voir les ports actifs
netstat -ano | findstr "4000 3000"

# Arrêter tous les processus node
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process
```

### Tests
```powershell
cd c:\AKIG

# Tests unitaires backend
npm --prefix backend run test

# Tests E2E frontend
npm --prefix frontend run test:notice-system

# Tests de performance
npm --prefix frontend run perf:baseline

# Tests de sécurité
npm --prefix backend run audit
```

### Base de Données
```powershell
cd c:\AKIG\backend

# Exécuter migrations
npm run migrate

# Rollback dernière migration
npm run migrate:rollback

# Charger données test
npm run seed

# Vérifier schéma
npm run db:schema
```

### Nettoyage et Réinitialisation
```powershell
# Réinitialiser complètement
cd c:\AKIG
npm run bootstrap         # Réinstaller dépendances
npm run clean             # Nettoyer builds
npm run migrate:reset     # Réinitialiser BD

# Supprimer les logs
Remove-Item c:\AKIG\deployment-logs\* -Force
```

---

## ⚠️ TROUBLESHOOTING

### Port 4000 ou 3000 déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr "4000"

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F

# OU changer les ports
$env:PORT=5000          # Backend
$env:REACT_APP_API_PORT=5000
npm start
```

### Erreur PostgreSQL
```powershell
# Vérifier si le service fonctionne
Get-Service postgresql-x64-15 | Start-Service

# Test de connexion
psql -h localhost -U postgres -d akig

# Réinitialiser
npm run db:reset
```

### Dépendances corrompues
```powershell
# Nettoyer et réinstaller
npm run clean
npm run bootstrap

# OU pour un service spécifique
cd backend
rm -r node_modules
npm ci
```

### Tests échouent
```powershell
# Vérifier la BD est peuplée
npm --prefix backend run seed

# Vérifier les services externes
.\HEALTH_CHECK.ps1

# Relancer les tests
npm --prefix frontend run test:notice-system -- --reporter=verbose
```

---

## 📈 MONITORING EN PRODUCTION

### Vérification Santé Continue
```powershell
# Exécuter tous les 5 minutes
while($true) {
    .\HEALTH_CHECK.ps1
    Start-Sleep -Seconds 300
}
```

### Logs Centralisés
```powershell
# Consulter les erreurs
Get-Content c:\AKIG\backend\logs\error.log -Tail 50

# Analyser les alertes
Get-Content c:\AKIG\deployment-logs\* | Select-String "ERROR|ALERT|P1"
```

### Dashboards
- **Sentry**: https://sentry.io/organizations/akig/
- **GA4**: https://analytics.google.com/
- **Datadog** (optionnel): https://app.datadoghq.com/

---

## ✅ CHECKLIST PRÉ-PRODUCTION

```markdown
☐ Node.js 18.20.3 installé
☐ npm 10.7.0+ installé
☐ PostgreSQL 12+ installé
☐ Fichier .env configuré
☐ Twilio clés testées
☐ SendGrid clés testées
☐ Meta API clés testées
☐ Base de données créée et migrée
☐ Données de test chargées
☐ Backend démarré et réactif
☐ Frontend construit et accessible
☐ Tests smoke réussis
☐ Tests E2E réussis
☐ Performance acceptable (<300ms)
☐ Health check: 🟢 SAIN
☐ Logs monitoring actif
☐ Alertes Sentry configurées
```

---

## 🎓 APRÈS LE DÉPLOIEMENT

### Documentation à Consulter
1. **NOTICE_SYSTEM_DOCUMENTATION.md** - Guide complet du système
2. **API_DOCUMENTATION.md** - Référence des endpoints
3. **DEPLOYMENT_PROGRESSIVE.ps1** - Script automatisé
4. **HEALTH_CHECK.ps1** - Vérification santé

### Formations Recommandées
- **Managers** (2h): Dashboard, alertes, actions rapides
- **Agents** (2h): Création préavis, envoi communication, suivi
- **Tech Lead** (4h): Architecture, troubleshooting, scaling

### Support
- **Operational**: ops@akig.com
- **Technical**: tech-support@akig.com
- **On-Call**: PagerDuty rotation 24/7

---

## 🎯 OBJECTIFS DE SUCCÈS

| Métrique | Objectif | Validation |
|----------|----------|------------|
| Zéro préavis oublié | 100% | Audit trail complet |
| SMS délivrés | >98% | Twilio tracking |
| Dashboards charge | <300ms | Playwright test |
| Alertes refresh | <100ms | Real-time check |
| Disponibilité | 99.5% | Uptime monitoring |
| Accessibilité | WCAG 2.1 AA | axe DevTools |
| Multi-navigateurs | Chrome, Firefox, Safari, Edge | Test suite |

---

## 📞 BESOIN D'AIDE?

1. **Consulter les logs**: `c:\AKIG\deployment-logs\`
2. **Vérifier la santé**: `.\HEALTH_CHECK.ps1`
3. **Relancer le déploiement**: `.\DEPLOYMENT_PROGRESSIVE.ps1 -Phase all`
4. **Rollback**: `.\DEPLOYMENT_PROGRESSIVE.ps1 -Phase rollback`

**Durée estimée complète**: 
- Installation: 20 min
- Configuration: 15 min
- Tests: 30 min
- Démarrage: 5 min
- **Total: ~70 minutes pour production-ready** ✅

---

Generated: 2024
Version: 1.0.0 - Production
