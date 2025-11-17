#!/bin/bash

# 🚀 QUICK START AKIG v3.0
# Lance la plateforme complète en 5 minutes

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🚀 AKIG v3.0 - PLATEFORME RECOUVREMENT SMART          ║"
echo "║                                                                ║"
echo "║              Lancement automatique (5 minutes)                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Vérifier Docker
echo "1️⃣  Vérification Docker..."
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker non installé!"
    echo "   → Installer depuis: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "   ❌ Docker Compose non installé!"
    exit 1
fi

echo "   ✅ Docker OK"
echo ""

# 2. Créer .env s'il n'existe pas
echo "2️⃣  Configuration environnement..."
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || {
        echo "   ⚠️  .env.example non trouvé - création basique..."
        cat > .env <<EOF
NODE_ENV=development
DATABASE_URL=postgresql://akig_user:changeme@postgres:5432/akig
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeme
JWT_SECRET=your-secret-key-change-in-production
GRAFANA_PASSWORD=admin
PORT=4000
EOF
    }
    echo "   ℹ️  .env créé (remplace les secrets!)"
fi
echo "   ✅ Configuration OK"
echo ""

# 3. Lancer Docker Compose
echo "3️⃣  Démarrage des services (cela peut prendre 1-2 min)..."
docker-compose up -d

echo "   ⏳ Attente du démarrage des services..."
sleep 10

# 4. Vérifier la santé
echo ""
echo "4️⃣  Vérification de la santé..."

# Vérifier Backend
if curl -s http://localhost:4000/api/health | grep -q "ok"; then
    echo "   ✅ Backend:   http://localhost:4000"
else
    echo "   ⏳ Backend:   Démarrage en cours..."
fi

# Vérifier Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend:  http://localhost:3000"
else
    echo "   ⏳ Frontend:  Démarrage en cours..."
fi

# Vérifier Prometheus
if curl -s http://localhost:9090 > /dev/null 2>&1; then
    echo "   ✅ Prometheus: http://localhost:9090"
else
    echo "   ⏳ Prometheus: Démarrage en cours..."
fi

# Vérifier Grafana
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ Grafana:  http://localhost:3001 (admin/admin)"
else
    echo "   ⏳ Grafana:  Démarrage en cours..."
fi

echo ""

# 5. Afficher les URLs utiles
echo "5️⃣  🎉 AKIG est en train de démarrer!"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      🌐 ACCÈS SERVICES                         ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  Frontend:      http://localhost:3000                          ║"
echo "║  Backend API:   http://localhost:4000/api                      ║"
echo "║  Prometheus:    http://localhost:9090                          ║"
echo "║  Grafana:       http://localhost:3001 (admin/admin)            ║"
echo "║  Database:      localhost:5432 (akig_user/changeme)            ║"
echo "║  Redis Cache:   localhost:6379 (password: changeme)            ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                    📚 DOCUMENTATION                            ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  ADRs:          /docs/adr/README.md                            ║"
echo "║  Runbooks:      /ops/runbooks/INCIDENTS.md                     ║"
echo "║  Dev Guide:     /docs/onboarding/DEVELOPER_SETUP.md            ║"
echo "║  Summary:       /AKIG_v3_COMPLETE.md                           ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                    🛠️  COMMANDES UTILES                        ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  Vérifier les services:                                        ║"
echo "║  $ docker ps                                                   ║"
echo "║                                                                ║"
echo "║  Logs du backend:                                              ║"
echo "║  $ docker logs -f akig-backend                                 ║"
echo "║                                                                ║"
echo "║  Accès base de données:                                        ║"
echo "║  $ docker exec -it akig-db psql -U akig_user -d akig           ║"
echo "║                                                                ║"
echo "║  Arrêter les services:                                         ║"
echo "║  $ docker-compose down                                         ║"
echo "║                                                                ║"
echo "║  Redémarrer tout:                                              ║"
echo "║  $ docker-compose restart                                      ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                  📞 SUPPORT & TROUBLESHOOTING                  ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  Slack:         #dev-akig (questions)                          ║"
echo "║  Incidents:     /ops/runbooks/INCIDENTS.md                     ║"
echo "║                                                                ║"
echo "║  Problème backend?                                             ║"
echo "║  $ docker logs akig-backend | grep ERROR                       ║"
echo "║                                                                ║"
echo "║  Problème BD?                                                  ║"
echo "║  $ docker exec akig-db psql -U akig_user -d akig -c \\          ║"
echo "║    \"SELECT COUNT(*) FROM impayes\"                             ║"
echo "║                                                                ║"
echo "║  Problème Redis?                                               ║"
echo "║  $ docker exec akig-cache redis-cli PING                       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 6. Vérifier si tout est prêt
echo "⏳ Attente du démarrage complet (cela peut prendre 20-30 sec)..."
sleep 20

# Test final
if curl -s http://localhost:4000/api/health | grep -q "ok"; then
    echo ""
    echo "✅ ✅ ✅ AKIG EST PRÊT! ✅ ✅ ✅"
    echo ""
    echo "Ouvre ton navigateur:"
    echo "👉 http://localhost:3000"
    echo ""
    echo "👨‍💻 Première contribution?"
    echo "👉 Lire: /docs/onboarding/DEVELOPER_SETUP.md"
    echo ""
else
    echo ""
    echo "⏳ Services en démarrage..."
    echo "Essaye: docker logs -f akig-backend"
    echo "Ou attends 30 secondes et réessaye."
    echo ""
fi

echo "Bon developpement! 🚀"
