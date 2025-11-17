#!/bin/bash

# 🚀 AKIG - Lancement 100% Fiable (Mode Local)
# Lance PostgreSQL + Backend API + Frontend React
# Aucune dépendance Docker requise

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
    
    ╔══════════════════════════════════════════════════════════════╗
    ║     🚀 AKIG - Lancement Complet (PostgreSQL Local)          ║
    ║                                                              ║
    ║  Configuration requise:                                      ║
    ║  • PostgreSQL 15+ installé et en cours d'exécution           ║
    ║  • Node.js 18.20.3 (npm 10.7+)                              ║
    ║  • Port 5432 (Postgres), 4000 (API), 3000 (Frontend)        ║
    ║                                                              ║
    ║  Accès:                                                      ║
    ║  • Frontend:  http://localhost:3000                         ║
    ║  • Backend:   http://localhost:4000/api                     ║
    ║  • Health:    http://localhost:4000/api/health              ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    
EOF
    echo -e "${NC}"
}

banner

# Étape 1 : Vérifier PostgreSQL
echo -e "${CYAN}📋 Étape 1 : Vérification de PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL n'est pas installé${NC}"
    echo -e "${YELLOW}   Installez PostgreSQL 15:${NC}"
    echo -e "${YELLOW}   macOS: brew install postgresql${NC}"
    echo -e "${YELLOW}   Linux: sudo apt-get install postgresql-15${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL trouvé: $(psql --version)${NC}"
echo ""

# Étape 2 : Créer la base
echo -e "${CYAN}📋 Étape 2 : Configuration de la base de données...${NC}"

# Créer la base si elle n'existe pas
psql -U postgres -c "CREATE DATABASE akig_db;" 2>/dev/null || true
psql -U postgres -d akig_db -c "CREATE USER akig WITH PASSWORD 'akig_password';" 2>/dev/null || true
psql -U postgres -d akig_db -c "ALTER USER akig WITH PASSWORD 'akig_password';" 2>/dev/null || true
psql -U postgres -d akig_db -c "GRANT ALL PRIVILEGES ON DATABASE akig_db TO akig;" 2>/dev/null || true

echo -e "${GREEN}✅ Base de données configurée${NC}"
echo -e "   Base: akig_db"
echo -e "   Utilisateur: akig / akig_password"
echo ""

# Étape 3 : Configurer le backend
echo -e "${CYAN}📋 Étape 3 : Configuration du backend...${NC}"

if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'ENVFILE'
PORT=4000
DATABASE_URL=postgresql://akig:akig_password@localhost:5432/akig_db
JWT_SECRET=akig_jwt_secret_key_development_min_32_chars_long_change_in_prod
FEATURE_FLAGS=payments,sms,dashboard
DISABLE_REDIS=true
ENVFILE
    echo -e "${GREEN}✅ Fichier backend/.env créé${NC}"
else
    echo -e "${YELLOW}ℹ️  Fichier backend/.env déjà existant${NC}"
fi
echo ""

# Étape 4 : Bootstrap
echo -e "${CYAN}📋 Étape 4 : Installation des dépendances (npm ci)...${NC}"
npm run bootstrap
echo -e "${GREEN}✅ Bootstrap réussi${NC}"
echo ""

# Étape 5 : Lancer les services
echo -e "${CYAN}📋 Étape 5 : Lancement des services...${NC}"
echo ""
echo -e "   ${YELLOW}🔄 Backend API (http://localhost:4000)${NC}"
echo -e "   ${YELLOW}🔄 Frontend (http://localhost:3000)${NC}"
echo ""
echo -e "   ${YELLOW}Appuyez sur Ctrl+C pour arrêter tout${NC}"
echo ""

# Lancer en mode concurrently (depuis root)
npm run start:local
