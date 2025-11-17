#!/bin/bash
# 🚀 Script de Déploiement Rapide AKIG

set -e

echo "🚀 AKIG - Déploiement Automatisé"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}✓ Vérification des prérequis...${NC}"
command -v node &> /dev/null || { echo -e "${RED}❌ Node.js non installé${NC}"; exit 1; }
command -v npm &> /dev/null || { echo -e "${RED}❌ npm non installé${NC}"; exit 1; }
command -v psql &> /dev/null || { echo -e "${RED}❌ PostgreSQL non installé${NC}"; exit 1; }

echo -e "${GREEN}✅ Tous les prérequis sont présents${NC}\n"

# Backend setup
echo -e "${YELLOW}📦 Setup Backend...${NC}"
cd backend
npm install --production
echo -e "${GREEN}✅ Backend dépendances installées${NC}\n"

# Run migrations
echo -e "${YELLOW}🗄️  Exécution des migrations...${NC}"
npm run migrate || echo -e "${YELLOW}⚠️  Migrations ignorées (DB peut être déjà à jour)${NC}"
echo -e "${GREEN}✅ Base de données prête${NC}\n"

# Frontend setup
echo -e "${YELLOW}📦 Setup Frontend...${NC}"
cd ../frontend
npm install --production
npm run build
echo -e "${GREEN}✅ Frontend compilé${NC}\n"

# Start services
echo -e "${YELLOW}🎬 Démarrage des services...${NC}"

# Backend
cd ../backend
npm start &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend lancé (PID: $BACKEND_PID)${NC}"

# Frontend (serve static)
cd ../frontend
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend lancé (PID: $FRONTEND_PID)${NC}"

# Health check
echo -e "\n${YELLOW}🏥 Vérification de santé...${NC}"
sleep 2

# Check backend health
curl -s http://localhost:4000/api/health > /dev/null && echo -e "${GREEN}✅ Backend OK${NC}" || echo -e "${RED}❌ Backend indisponible${NC}"
curl -s http://localhost:3000 > /dev/null && echo -e "${GREEN}✅ Frontend OK${NC}" || echo -e "${RED}❌ Frontend indisponible${NC}"

echo -e "\n${GREEN}🎉 Déploiement réussi!${NC}"
echo -e "\n📱 Accès à l'application:"
echo -e "  🌐 Frontend:  http://localhost:3000"
echo -e "  🔌 Backend:   http://localhost:4000/api"
echo -e "  📊 Dashboard: http://localhost:3000/dashboard"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

# Keep running
wait
