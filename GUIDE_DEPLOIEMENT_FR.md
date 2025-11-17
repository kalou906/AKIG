# 🚀 GUIDE DE DÉPLOIEMENT - AKIG (VERSION FRANÇAISE)

## ✅ PRÉ-REQUIS VÉRIFIÉS

- ✅ Node.js 18+ installé
- ✅ PostgreSQL 15+ configuré
- ✅ Redis (optionnel mais recommandé)
- ✅ Tous les fichiers source présents
- ✅ Zéro erreur TypeScript
- ✅ Dépendances npm résolues

---

## 📋 PHASES DE DÉPLOIEMENT

### PHASE 1: Configuration de Base (5 minutes)

#### 1.1 Créer le fichier `.env`
```bash
# Copier depuis template
cp .env.example .env

# ÉDITER .env avec vos valeurs:
DATABASE_URL=postgresql://user:password@localhost:5432/akig
JWT_SECRET=votre_secret_tres_long_ici
PORT=4000
NODE_ENV=production
```

#### 1.2 Vérifier la base de données PostgreSQL
```bash
# Connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE akig;

# Quitter
\q
```

---

### PHASE 2: Installation Backend (10 minutes)

#### 2.1 Installer dépendances backend
```bash
cd backend
npm install
```

#### 2.2 Exécuter les migrations
```bash
# Vérifier la migration
psql $DATABASE_URL -c "\dt"

# Si première fois, les tables devraient être créées par les migrations
npm run dev  # Cela créera les tables via index.js
```

#### 2.3 Démarrer le backend
```bash
# Mode développement (avec auto-reload)
npm run dev

# Mode production
npm start

# Vérifier la santé
curl http://localhost:4000/api/health
```

**Résultat attendu:**
```json
{
  "ok": true,
  "timestamp": "2025-10-25T10:00:00Z",
  "uptime": 5.234
}
```

---

### PHASE 3: Installation Frontend (10 minutes)

#### 3.1 Installer dépendances frontend
```bash
cd frontend
npm install
```

#### 3.2 Configurer les variables d'environnement
```bash
# Créer .env.local
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SENTRY_DSN=votre_sentry_dsn_ici
EOF
```

#### 3.3 Démarrer le frontend (développement)
```bash
npm start

# Le navigateur s'ouvrira sur http://localhost:3000
```

#### 3.4 Construire pour production
```bash
npm run build

# Les fichiers seront dans `build/`
# À servir avec un serveur web (nginx, Apache, etc.)
```

---

### PHASE 4: Configuration de Sécurité (15 minutes)

#### 4.1 Activer HTTPS
```bash
# Générer certificat auto-signé (dev)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# En production: utiliser Let's Encrypt
# Via certbot: certbot certonly --standalone -d votre-domaine.com
```

#### 4.2 Configurer Nginx + WAF
```bash
# Copier configuration
cp ops/nginx/waf.conf /etc/nginx/sites-available/akig

# Vérifier syntaxe
nginx -t

# Redémarrer
sudo systemctl restart nginx
```

#### 4.3 Configurer secrets
```bash
# Créer fichier secrets sécurisé
touch .env.local
chmod 600 .env.local

# Ajouter secrets
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env.local
echo "DB_PASSWORD=$(openssl rand -hex 16)" >> .env.local
```

---

### PHASE 5: Mise en Place du Monitoring (20 minutes)

#### 5.1 Configuration Prometheus
```bash
# Copier configuration
cp ops/prometheus/prometheus.yml /etc/prometheus/

# Redémarrer Prometheus
sudo systemctl restart prometheus

# Vérifier sur http://localhost:9090
```

#### 5.2 Configuration Grafana
```bash
# Lancer Grafana
docker run -d -p 3001:3000 grafana/grafana:latest

# Accès: http://localhost:3001 (admin/admin)

# Importer dashboards depuis `ops/grafana/dashboards/`
```

#### 5.3 Configuration Sentry (optionnel)
```bash
# Créer compte sur sentry.io
# Copier DSN dans .env:
SENTRY_DSN=https://key@sentry.io/project

# Tester
curl -X POST http://localhost:4000/api/test-error
```

---

### PHASE 6: Tests & Validation (15 minutes)

#### 6.1 Tests unitaires
```bash
# Backend
cd backend
npm test

# Frontend
cd ../frontend
npm test
```

#### 6.2 Tests E2E (Playwright)
```bash
# Installation (une fois)
npm install -D @playwright/test

# Exécuter tests
npx playwright test

# Mode debug
npx playwright test --debug
```

#### 6.3 Tests de charge
```bash
# Installer k6
brew install k6  # ou: choco install k6

# Exécuter tests de load
k6 run ops/loadtest.yml
```

#### 6.4 Vérification de santé
```bash
# API health
curl http://localhost:4000/api/health

# Base de données
psql $DATABASE_URL -c "SELECT 1"

# Redis (si configuré)
redis-cli ping
```

---

### PHASE 7: Déploiement Production (Variable)

#### 7.1 Via Docker (Recommandé)
```bash
# Build images
docker build -t akig-backend:1.0.0 -f backend/Dockerfile .
docker build -t akig-frontend:1.0.0 -f frontend/Dockerfile .

# Lancer containers
docker-compose up -d

# Vérifier
docker-compose ps
```

#### 7.2 Via Kubernetes
```bash
# Créer namespace
kubectl create namespace akig

# Déployer secrets
kubectl create secret generic akig-secrets \
  --from-file=.env \
  -n akig

# Appliquer configurations
kubectl apply -f k8s/ -n akig

# Vérifier déploiement
kubectl get pods -n akig
```

#### 7.3 Via Heroku/PaaS
```bash
# Login
heroku login

# Créer app
heroku create akig-backend

# Déployer
git push heroku main

# Vérifier logs
heroku logs --tail
```

---

## ✅ CHECKLIST POST-DÉPLOIEMENT

### Vérifications Immédiates
- [ ] Backend répond sur `/api/health`
- [ ] Frontend accessible sur le navigateur
- [ ] Base de données connectée
- [ ] Authentification fonctionne
- [ ] HTTPS/SSL activé
- [ ] Rate limiting actif

### Vérifications de Sécurité
- [ ] JWT secrets générés
- [ ] WAF actif
- [ ] CORS configuré
- [ ] Headers de sécurité présents
- [ ] Audit trail enregistre les accès
- [ ] Secrets rotatés

### Vérifications de Performance
- [ ] P95 latence < 800ms
- [ ] Uptime 99.9% trend
- [ ] Pas de memory leaks
- [ ] Cache optimisé
- [ ] CDN configuré (si applicable)

### Vérifications de Monitoring
- [ ] Prometheus collecte les métriques
- [ ] Grafana affiche les dashboards
- [ ] Alertes Prometheus activées
- [ ] Logs centralisés (ELK/Splunk)
- [ ] Sentry capture les erreurs

---

## 🚨 DÉPANNAGE COURANT

### Issue: "Cannot find module 'express'"
```bash
# Solution: Installer les dépendances
npm install
```

### Issue: "ECONNREFUSED PostgreSQL"
```bash
# Vérifier que PostgreSQL est en cours d'exécution
sudo systemctl status postgresql

# Vérifier DATABASE_URL dans .env
echo $DATABASE_URL

# Tester la connexion
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: "Port 4000 already in use"
```bash
# Trouver le processus
lsof -i :4000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
PORT=5000 npm start
```

### Issue: "JWT verification failed"
```bash
# Vérifier que JWT_SECRET est défini
echo $JWT_SECRET

# Régénérer si vide
JWT_SECRET=$(openssl rand -hex 32)
```

### Issue: "CORS errors in browser"
```bash
# Vérifier CORS dans backend/src/index.js
# Ajouter si manquant:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

# Redémarrer le backend
npm restart
```

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Dashboards à Consulter
1. **Prometheus:** http://localhost:9090
   - Graphiques de métriques
   - Alertes actives
   - État des targets

2. **Grafana:** http://localhost:3001
   - Dashboards business
   - Alertes configurées
   - Historique performance

3. **Sentry:** https://sentry.io/projects/
   - Erreurs en temps réel
   - Release tracking
   - Tendances

### Commandes Utiles
```bash
# Voir logs en temps réel
tail -f logs/app.log

# Voir métriques Prometheus
curl http://localhost:9090/api/v1/query?query=up

# Voir status du cluster K8s
kubectl get all -n akig

# Voir health check
curl -v http://localhost:4000/api/health
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Déployer** (phases 1-7)
2. ✅ **Tester** (phase 6)
3. ✅ **Monitorer** (monitoring post-déploiement)
4. ✅ **Documenter** (incidents, apprenages)
5. ✅ **Optimiser** (basé sur metrics)
6. ✅ **Sécuriser** (audits réguliers)

---

## 📞 SUPPORT

### Ressources
- **Logs:** `backend/logs/app.log`, `frontend/build/logs/`
- **Configurations:** `.env`, `ops/`, `backend/src/`
- **Tests:** `tests/e2e/`, `backend/tests/`
- **Incidents:** `ops/pra/RUNBOOK.md`

### Escalade
1. Vérifier `VALIDATION_FINALE_FRANCAIS.md`
2. Lire `ops/pra/RUNBOOK.md`
3. Consulter `backend/SECURITY.md`
4. Contacter l'équipe DevOps

---

**Version:** 1.0.0  
**Date:** 25 octobre 2025  
**Statut:** ✅ Production-Ready
