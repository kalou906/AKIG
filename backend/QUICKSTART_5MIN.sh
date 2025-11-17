#!/bin/bash
# PHASE 5 - QUICKSTART 5 MINUTES
# Démarrer Phase 5 en 5 minutes ou moins

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║     🚀 PHASE 5 - QUICKSTART 5 MINUTES (CONAKRY, GUINÉE)             ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# MINUTE 1: Prérequis
echo "⏱️  MINUTE 1: Vérification prérequis..."
echo ""
node --version || (echo "❌ Node.js requis. Installez Node 16+"; exit 1)
npm --version || (echo "❌ npm requis"; exit 1)
psql --version 2>/dev/null || (echo "⚠️  PostgreSQL non trouvé (optionnel pour test local)")
echo "✅ Prérequis OK"
echo ""

# MINUTE 2: Installation
echo "⏱️  MINUTE 2: Installation dépendances..."
cd backend
npm install --silent
echo "✅ Dépendances installées"
echo ""

# MINUTE 3: Configuration
echo "⏱️  MINUTE 3: Configuration .env..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || echo "DATABASE_URL=postgresql://localhost/akig" > .env
  echo "JWT_SECRET=dev_secret_key_for_testing_only_$(date +%s)" >> .env
  echo "PORT=4000" >> .env
  echo "NODE_ENV=development" >> .env
fi
echo "✅ Fichier .env créé (à configurer avant production)"
echo ""

# MINUTE 4: Vérification
echo "⏱️  MINUTE 4: Vérification Phase 5..."
npm run verify 2>/dev/null || node verify-phase5-simple.js
echo "✅ Vérification complète"
echo ""

# MINUTE 5: Démarrage
echo "⏱️  MINUTE 5: Démarrage serveur..."
echo ""
echo "🚀 Démarrage en cours..."
npm run dev &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 3

# Vérifier si le serveur est actif
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
  echo ""
  echo "✅ SERVEUR DÉMARRÉ AVEC SUCCÈS!"
  echo ""
  echo "═════════════════════════════════════════════════════════════════════════"
  echo "🎉 Phase 5 est maintenant ACTIVE!"
  echo "═════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "📊 Endpoints disponibles:"
  echo "  ✓ Health:          http://localhost:4000/api/health"
  echo "  ✓ Phase 5:         http://localhost:4000/api/phase5/santé"
  echo "  ✓ Place marché:    http://localhost:4000/api/place-marche"
  echo "  ✓ Paiements:       http://localhost:4000/api/paiements"
  echo "  ✓ Recherche:       http://localhost:4000/api/recherche"
  echo "  ✓ Cartographie:    http://localhost:4000/api/cartographie"
  echo ""
  echo "📚 Documentation:"
  echo "  1. Lire: README_PHASE5.md"
  echo "  2. Lire: GUIDE_DÉPLOIEMENT_PHASE5.md"
  echo "  3. Tester: curl http://localhost:4000/api/phase5/santé"
  echo ""
  echo "🧪 Tests rapides:"
  echo "  $ curl http://localhost:4000/api/phase5/santé"
  echo "  $ curl -X GET 'http://localhost:4000/api/recherche/avancée'"
  echo ""
  echo "📞 Contrôle:"
  echo "  - Arrêter: Ctrl+C"
  echo "  - Logs:    tail -f logs/akig.log"
  echo ""
  echo "═════════════════════════════════════════════════════════════════════════"
  echo ""
else
  echo "❌ Erreur démarrage serveur"
  exit 1
fi

# Garder le processus actif
wait $SERVER_PID
