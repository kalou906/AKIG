#!/bin/bash
# AKIG Quick Start Script — Linux/Mac
# Usage: ./start-akig.sh

set -e

echo "╔════════════════════════════════════════╗"
echo "║  🚀 AKIG - Quick Start Script         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}✓ Étape 1: Vérification de l'environnement${NC}"
npm --prefix backend run verify 2>/dev/null || {
  echo -e "${RED}✗ Erreur vérification environnement${NC}"
  exit 1
}

echo -e "${GREEN}✓ Étape 2: Installation des dépendances${NC}"
npm run bootstrap --silent 2>/dev/null

echo -e "${GREEN}✓ Étape 3: Application des migrations${NC}"
npm --prefix backend run migrate 2>/dev/null || {
  echo -e "${YELLOW}⚠ Les migrations existaient déjà${NC}"
}

echo ""
echo -e "${GREEN}✅ Démarrage du système${NC}"
echo "================================================================"
echo "   Backend API    → http://localhost:4000/api"
echo "   Frontend       → http://localhost:3000"
echo "   Health Check   → http://localhost:4000/api/health"
echo "================================================================"
echo ""

npm run start:local
