#!/bin/bash

# AKIG - Lancement Simple sur Linux/Mac
# Le script le plus simple pour lancer AKIG rapidement

clear

echo ""
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║         🚀 AKIG - Lancement Rapide en 1 Clic (Linux/Mac)          ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ ERREUR : Node.js n'est pas installé !${NC}"
    echo ""
    echo "Installez Node.js depuis : https://nodejs.org/"
    echo "Puis relancez ce script."
    echo ""
    read -p "Appuyez sur Entrée pour quitter..."
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js trouvé : $NODE_VERSION${NC}"
echo ""

# Vérifier les répertoires
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ ERREUR : Répertoire 'backend' introuvable !${NC}"
    exit 1
fi

if [ ! -d "akig-ultimate" ]; then
    echo -e "${RED}❌ ERREUR : Répertoire 'akig-ultimate' introuvable !${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Répertoires trouvés${NC}"
echo ""

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  📦 INSTALLATION DES DÉPENDANCES (première fois seulement)        ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}[1/2] Installation dépendances Backend...${NC}"
    cd backend
    npm install > /dev/null 2>&1
    cd ..
    echo -e "${GREEN}✓ Backend dépendances OK${NC}"
else
    echo -e "${GREEN}✓ Backend dépendances déjà installées${NC}"
fi

echo ""

# Frontend dependencies
if [ ! -d "akig-ultimate/node_modules" ]; then
    echo -e "${YELLOW}[2/2] Installation dépendances Frontend...${NC}"
    cd akig-ultimate
    npm install > /dev/null 2>&1
    cd ..
    echo -e "${GREEN}✓ Frontend dépendances OK${NC}"
else
    echo -e "${GREEN}✓ Frontend dépendances déjà installées${NC}"
fi

echo ""
echo ""

# Démarrage
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🚀 DÉMARRAGE SERVICES                                            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}[1/2] Lancement Backend (Port 4000)...${NC}"
cd backend
npm run dev > /tmp/akig_backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend lancé (PID: $BACKEND_PID)${NC}"
echo ""
sleep 3

echo -e "${YELLOW}[2/2] Lancement Frontend (Port 5173)...${NC}"
cd akig-ultimate
npm run dev > /tmp/akig_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Frontend lancé (PID: $FRONTEND_PID)${NC}"
echo ""
sleep 3

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ AKIG EST DÉMARRÉ !                                            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}  🌐 Accédez à AKIG ici :${NC}"
echo -e "     👉 ${CYAN}http://localhost:5173${NC}"
echo ""
echo -e "${CYAN}  📡 API Backend :${NC}"
echo -e "     👉 ${CYAN}http://localhost:4000/api${NC}"
echo ""
echo -e "${CYAN}  ⚙️  Infos Système :${NC}"
echo -e "     👉 ${CYAN}http://localhost:4000/api/info${NC}"
echo ""
echo -e "${CYAN}  💚 Health Check :${NC}"
echo -e "     👉 ${CYAN}http://localhost:4000/api/health${NC}"
echo ""
echo ""
echo -e "${YELLOW}ℹ️  Logs:${NC}"
echo "    Backend:  tail -f /tmp/akig_backend.log"
echo "    Frontend: tail -f /tmp/akig_frontend.log"
echo ""
echo -e "${YELLOW}ℹ️  Pour arrêter AKIG:${NC}"
echo "    kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo ""

# Garder le script ouvert
wait
