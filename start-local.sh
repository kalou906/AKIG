#!/bin/bash
# ============================================================
# start-local.sh - Script de démarrage AKIG en local
# Usage: bash start-local.sh
# ============================================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          🚀 AKIG - Local Setup & Launch                   ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# 1. Vérifier les prérequis
# ============================================================

echo "📋 Étape 1: Vérification des prérequis..."
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé!"
    echo "   Téléchargez: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Vérifier Docker en marche
if ! docker ps &> /dev/null; then
    echo "❌ Docker n'est pas en marche!"
    echo "   Démarrez Docker Desktop (ou sudo systemctl start docker)"
    exit 1
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé!"
    echo "   Installation: docker-compose version"
    exit 1
fi

echo "✅ Docker is running"
echo "✅ Docker Compose is available"
echo ""

# ============================================================
# 2. Vérifier Makefile
# ============================================================

echo "📋 Étape 2: Vérification du Makefile..."
if [ ! -f "Makefile" ]; then
    echo "❌ Makefile non trouvé!"
    exit 1
fi
echo "✅ Makefile found"
echo ""

# ============================================================
# 3. Créer .env s'il n'existe pas
# ============================================================

echo "📋 Étape 3: Configuration d'environnement..."
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "⚠️  .env n'existe pas, création depuis .env.example..."
    cp .env.example .env
    echo "✅ .env créé"
else
    echo "✅ .env exists"
fi
echo ""

# ============================================================
# 4. Lancer les services
# ============================================================

echo "📋 Étape 4: Démarrage des services..."
echo ""

if command -v make &> /dev/null; then
    echo "🚀 Exécution: make up"
    echo ""
    make up
else
    echo "⚠️  Make n'est pas disponible, utilisation de docker-compose directement..."
    docker-compose up -d postgres
    sleep 3
    docker-compose up -d api
    sleep 2
    docker-compose up -d web nginx
    echo "✅ Services démarrés"
fi

echo ""

# ============================================================
# 5. Attendre la disponibilité
# ============================================================

echo "📋 Étape 5: Attente de la disponibilité des services..."
echo ""

# Attendre PostgreSQL
echo "⏳ Attente de PostgreSQL..."
RETRY=0
while [ $RETRY -lt 30 ]; do
    if docker exec akig_postgres pg_isready -U akig_user 2>/dev/null; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    RETRY=$((RETRY + 1))
    sleep 2
done

# Attendre API
echo "⏳ Attente de l'API..."
RETRY=0
while [ $RETRY -lt 30 ]; do
    if curl -s http://localhost:4000/api/health > /dev/null; then
        echo "✅ API is ready"
        break
    fi
    RETRY=$((RETRY + 1))
    sleep 2
done

# Attendre Frontend
echo "⏳ Attente du Frontend..."
RETRY=0
while [ $RETRY -lt 30 ]; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend is ready"
        break
    fi
    RETRY=$((RETRY + 1))
    sleep 2
done

echo ""

# ============================================================
# 6. Afficher le statut
# ============================================================

echo "📋 Étape 6: Vérification de l'état..."
echo ""

if command -v make &> /dev/null; then
    make status
else
    docker ps | grep akig
fi

echo ""

# ============================================================
# 7. Afficher les accès
# ============================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          ✅ AKIG est prêt! Accédez à:                      ║"
echo "║                                                            ║"
echo "║  🌐 Frontend:  http://localhost:3000                       ║"
echo "║  🔌 API:       http://localhost:4000                       ║"
echo "║  📊 Health:    http://localhost:4000/api/health            ║"
echo "║                                                            ║"
echo "║  👤 Admin:     admin@akig.com / admin123                   ║"
echo "║  👥 Tenant:    tenant@example.com / tenant123              ║"
echo "║                                                            ║"
echo "║  📋 Portail Locataire:  (Nouveau!)                         ║"
echo "║     Sidebar → Genius Features → Portail Locataire          ║"
echo "║                                                            ║"
echo "║  💡 Commandes utiles:                                      ║"
echo "║     make logs       → Voir les logs                        ║"
echo "║     make status     → Voir le statut                       ║"
echo "║     make health     → Vérifier la santé                    ║"
echo "║     make test       → Lancer les tests                     ║"
echo "║     make down       → Arrêter les services                 ║"
echo "║     make help       → Voir toutes les commandes            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Ouvrir le navigateur (optionnel)
if command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    # Mac
    open http://localhost:3000
elif command -v start &> /dev/null; then
    # Windows (en MINGW/Git Bash)
    start http://localhost:3000
fi

echo "🎉 Bonne utilisation!"
