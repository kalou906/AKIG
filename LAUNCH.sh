#!/bin/bash

# 🚀 AKIG - Lancement Complet (Mode Docker)
# Orchestre Postgres 15 → Backend API → Frontend React

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

show_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
    
    ╔══════════════════════════════════════════════════════════╗
    ║          🚀 AKIG - Lancement Complet (Docker)            ║
    ║                                                          ║
    ║  Infrastructure:                                         ║
    ║  🐳 Postgres 15 • 🔌 Backend API • ⚛️  Frontend React     ║
    ║                                                          ║
    ║  Accès: http://localhost:3000                           ║
    ║  Logs: docker compose logs -f                           ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    
EOF
    echo -e "${NC}"
}

show_help() {
    echo -e "${YELLOW}Usage: bash LAUNCH.sh [-down]${NC}"
    echo -e "
  -down  : Arrête et nettoie la stack Docker
"
}

show_banner

if [ "$1" = "-down" ]; then
    echo -e "${YELLOW}🛑 Arrêt de la stack...${NC}"
    docker compose down --remove-orphans
    echo -e "${GREEN}✅ Stack arrêtée${NC}"
    exit 0
fi

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

echo -e "${CYAN}📋 Vérification de Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo -e "${YELLOW}   Installez Docker: https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker trouvé: $(docker --version)${NC}"

echo -e "${CYAN}📋 Vérification du fichier .env.docker...${NC}"
if [ ! -f ".env.docker" ]; then
    echo -e "${RED}❌ Fichier .env.docker manquant${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Configuration présente${NC}"

echo -e "${CYAN}\n🐳 Lancement Docker Compose...${NC}"
echo -e "${YELLOW}   Cette première fois peut prendre 2-3 minutes...${NC}"
echo -e "${YELLOW}   (Appuyez sur Ctrl+C pour arrêter)\n${NC}"

docker compose up --build    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}  ✅ Node.js: $NODE_VERSION${NC}"
    else
        echo -e "${RED}  ❌ Node.js non trouvé. Installer depuis https://nodejs.org${NC}"
        exit 1
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}  ✅ npm: $NPM_VERSION${NC}"
    else
        echo -e "${RED}  ❌ npm non trouvé${NC}"
        exit 1
    fi
    
    # PostgreSQL
    if command -v psql &> /dev/null; then
        PG_VERSION=$(psql --version)
        echo -e "${GREEN}  ✅ PostgreSQL: $PG_VERSION${NC}"
    else
        echo -e "${YELLOW}  ⚠️  PostgreSQL non trouvé${NC}"
    fi
    
    echo -e "${WHITE}${NC}"
}

# Vérifier la base de données
check_database() {
    echo -e "${CYAN}⏳ Vérification de la base de données...${NC}"
    
    if psql -U akig_user -d akig_immobilier -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}  ✅ Base de données accessible${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Base de données non accessible${NC}"
        echo -e "${YELLOW}  📝 Instructions:${NC}"
        echo -e "${WHITE}     1. Installer PostgreSQL: https://www.postgresql.org/download/${NC}"
        echo -e "${WHITE}     2. Créer la base de données:${NC}"
        echo -e "${WHITE}        psql -U postgres${NC}"
        echo -e "${WHITE}        CREATE DATABASE akig_immobilier;${NC}"
        echo -e "${WHITE}        CREATE USER akig_user WITH PASSWORD 'password';${NC}"
        echo -e "${WHITE}        GRANT ALL PRIVILEGES ON DATABASE akig_immobilier TO akig_user;${NC}"
    fi
    
    echo -e "${WHITE}${NC}"
}

# Configuration du backend
setup_backend() {
    echo -e "${CYAN}⏳ Configuration du Backend...${NC}"
    
    cd "$(dirname "$0")/backend"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}  📦 Installation des dépendances npm...${NC}"
        npm install > /dev/null 2>&1
        echo -e "${GREEN}  ✅ Dépendances installées${NC}"
    else
        echo -e "${GREEN}  ✅ Dépendances déjà installées${NC}"
    fi
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}  📝 Création du fichier .env...${NC}"
        cat > .env << EOF
NODE_ENV=development
PORT=4002
DATABASE_URL=postgresql://akig_user:password@localhost:5432/akig_immobilier
JWT_SECRET=your-super-secret-key-min-32-chars-long-for-production!
LOG_LEVEL=info
PDF_OUTPUT_DIR=./receipts
EXPORT_OUTPUT_DIR=./exports
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
EOF
        echo -e "${GREEN}  ✅ Fichier .env créé${NC}"
    fi
    
    echo -e "${WHITE}${NC}"
}

# Configuration du frontend
setup_frontend() {
    echo -e "${CYAN}⏳ Configuration du Frontend...${NC}"
    
    cd "$(dirname "$0")/frontend"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}  📦 Installation des dépendances npm...${NC}"
        npm install > /dev/null 2>&1
        echo -e "${GREEN}  ✅ Dépendances installées${NC}"
    else
        echo -e "${GREEN}  ✅ Dépendances déjà installées${NC}"
    fi
    
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}  📝 Création du fichier .env.local...${NC}"
        cat > .env.local << EOF
VITE_API_URL=http://localhost:4002/api
VITE_APP_NAME=AKIG Immobilier
VITE_APP_VERSION=2.0.0
EOF
        echo -e "${GREEN}  ✅ Fichier .env.local créé${NC}"
    fi
    
    echo -e "${WHITE}${NC}"
}

# Démarrer le backend
start_backend() {
    echo -e "${GREEN}▶️  Démarrage du Backend...${NC}"
    echo -e "${WHITE}   Port: 4002${NC}"
    echo -e "${WHITE}   URL: http://localhost:4002/api${NC}"
    echo -e "${WHITE}${NC}"
    
    cd "$(dirname "$0")/backend"
    npm run dev
}

# Démarrer le frontend
start_frontend() {
    echo -e "${GREEN}▶️  Démarrage du Frontend...${NC}"
    echo -e "${WHITE}   Port: 5173${NC}"
    echo -e "${WHITE}   URL: http://localhost:5173${NC}"
    echo -e "${WHITE}${NC}"
    
    cd "$(dirname "$0")/frontend"
    npm run dev
}

# Démarrer backend et frontend
start_both() {
    echo -e "${GREEN}▶️  Démarrage du Backend et Frontend...${NC}"
    echo -e "${WHITE}${NC}"
    
    BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
    
    # Démarrer le backend en arrière-plan
    echo -e "${YELLOW}  📍 Lancement du Backend...${NC}"
    (cd "$BASE_DIR/backend" && npm run dev) &
    BACKEND_PID=$!
    
    sleep 3
    
    # Démarrer le frontend en arrière-plan
    echo -e "${YELLOW}  📍 Lancement du Frontend...${NC}"
    (cd "$BASE_DIR/frontend" && npm run dev) &
    FRONTEND_PID=$!
    
    sleep 3
    
    echo -e "${GREEN}✅ Backend et Frontend lancés${NC}"
    echo -e "${WHITE}${NC}"
    echo -e "${CYAN}URLs d'accès:${NC}"
    echo -e "${WHITE}  🔗 Backend API:  http://localhost:4002/api/health${NC}"
    echo -e "${WHITE}  🔗 Frontend:     http://localhost:5173${NC}"
    echo -e "${WHITE}  📊 Swagger Docs: http://localhost:4002/api-docs${NC}"
    echo -e "${WHITE}${NC}"
    
    # Ouvrir le navigateur (macOS et Linux)
    if command -v open &> /dev/null; then
        # macOS
        sleep 2
        echo -e "${CYAN}🌐 Ouverture du navigateur...${NC}"
        open "http://localhost:5173"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        sleep 2
        echo -e "${CYAN}🌐 Ouverture du navigateur...${NC}"
        xdg-open "http://localhost:5173" &
    fi
    
    echo -e "${YELLOW}⏳ Les services tournent en arrière-plan${NC}"
    echo -e "${WHITE}Appuyez sur Ctrl+C pour arrêter${NC}"
    echo -e "${WHITE}${NC}"
    
    # Attendre les processus
    wait $BACKEND_PID $FRONTEND_PID
}

# ════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════

show_banner

case "${1:-}" in
    --help)
        show_help
        exit 0
        ;;
    --backend-only)
        check_prerequisites
        setup_backend
        start_backend
        ;;
    --frontend-only)
        check_prerequisites
        setup_frontend
        start_frontend
        ;;
    --db-only)
        check_database
        ;;
    *)
        check_prerequisites
        check_database
        setup_backend
        setup_frontend
        start_both
        ;;
esac
