#!/usr/bin/env bash
# AKIG v3.0 - Script d'Installation Production-Grade
# Usage: ./install.sh --env=production --region=eu-west-1

set -euo pipefail

# --- CONFIGURATION HARDCODÉE ---
REQUIRED_NODE="22.11.0"
REQUIRED_PNPM="9.14.2"
DOCKER_COMPOSE_VERSION="2.30.3"
POSTGRESQL_VERSION="16"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# --- FONCTIONS UTILITAIRES ---
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

error() {
  echo -e "${RED}❌ [ERROR] $1${NC}" >&2
  exit 1
}

warn() {
  echo -e "${YELLOW}⚠️  [WARN] $1${NC}"
}

info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

banner() {
  echo -e "${PURPLE}"
  cat << "EOF"
    _    _  _____ _____ 
   / \  | |/ /_ _/ ___|  v3.0
  / _ \ | ' / | | |  _   
 / ___ \| . \ | | |_| |  
/_/   \_\_|\_\___\____|  
                         
🏠 Système Immobilier Hyper-Moderne & IA-Driven
🚀 Production-Grade | SOC2-Ready | Scale-to-Millions
EOF
  echo -e "${NC}"
}

# --- VÉRIFICATION PRÉREQUIS ---
check_prerequisites() {
  log "🔍 Vérification des prérequis..."
  
  # Git
  if ! command -v git &> /dev/null; then
    error "Git n'est pas installé. Installation requise."
  fi
  success "Git $(git --version | awk '{print $3}')"
  
  # Node.js
  if ! command -v node &> /dev/null; then
    warn "Node.js non trouvé. Installation automatique..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      curl -fsSL https://deb.nodesource.com/setup_${REQUIRED_NODE%%.*}.x | sudo -E bash -
      sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      brew install node@22
    else
      error "OS non supporté. Installez Node.js ${REQUIRED_NODE} manuellement."
    fi
  fi
  
  NODE_VERSION=$(node -v | sed 's/v//')
  if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
    error "Node.js ${REQUIRED_NODE} requis. Version actuelle: ${NODE_VERSION}"
  fi
  success "Node.js ${NODE_VERSION}"
  
  # pnpm
  if ! command -v pnpm &> /dev/null; then
    log "Installation de pnpm..."
    npm install -g pnpm@${REQUIRED_PNPM}
  fi
  success "pnpm $(pnpm --version)"
  
  # Docker
  if ! command -v docker &> /dev/null; then
    warn "Docker non trouvé. Installation automatique..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    warn "⚠️  Déconnectez-vous et reconnectez-vous pour activer Docker"
  fi
  success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
  
  # Docker Compose
  if ! docker compose version &> /dev/null; then
    warn "Docker Compose V2 non trouvé. Installation..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  fi
  success "Docker Compose $(docker compose version | awk '{print $4}')"
  
  # Python (pour ML API)
  if ! command -v python3 &> /dev/null; then
    error "Python 3 requis pour ML API. Installez Python 3.13+"
  fi
  success "Python $(python3 --version | awk '{print $2}')"
}

# --- INSTALLATION DÉPENDANCES ---
install_dependencies() {
  log "📦 Installation des dépendances..."
  
  # Vérifier si pnpm-lock.yaml existe
  if [ ! -f "pnpm-lock.yaml" ]; then
    warn "pnpm-lock.yaml manquant. Première installation..."
  fi
  
  # Installation racine
  pnpm install --frozen-lockfile || {
    warn "Installation avec lock file échouée, retry sans freeze..."
    pnpm install
  }
  
  success "Dépendances installées"
}

# --- CONFIGURATION ENVIRONNEMENT ---
setup_environment() {
  log "⚙️  Configuration des variables d'environnement..."
  
  if [ -f ".env" ]; then
    warn ".env existe déjà. Voulez-vous le regénérer? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
      info "Conservation du .env existant"
      return
    fi
  fi
  
  cp .env.example .env
  
  # Génération secrets sécurisés
  log "🔐 Génération des secrets..."
  
  # JWT_SECRET (256 bits)
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
  
  # ML_API_KEY
  ML_API_KEY=$(openssl rand -hex 32)
  sed -i "s|ML_API_KEY=.*|ML_API_KEY=${ML_API_KEY}|" .env
  
  # DB_PASSWORD
  DB_PASSWORD=$(openssl rand -hex 24)
  sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://akig:${DB_PASSWORD}@postgres:5432/akig_v3?schema=public|" .env
  
  # REDIS_PASSWORD
  REDIS_PASSWORD=$(openssl rand -hex 24)
  sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|" .env
  
  # MINIO_ACCESS_KEY
  MINIO_ACCESS_KEY=$(openssl rand -hex 16)
  MINIO_SECRET_KEY=$(openssl rand -hex 32)
  sed -i "s|MINIO_ACCESS_KEY=.*|MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}|" .env
  sed -i "s|MINIO_SECRET_KEY=.*|MINIO_SECRET_KEY=${MINIO_SECRET_KEY}|" .env
  
  success "Secrets générés et sauvegardés dans .env"
  warn "⚠️  IMPORTANT: Sauvegardez .env dans un gestionnaire de secrets (Vault, AWS Secrets Manager)"
}

# --- BUILD APPLICATIONS ---
build_applications() {
  log "🔨 Build des applications..."
  
  # Build packages partagés
  pnpm --filter "@akig/shared-types" build || warn "Pas de shared-types à build"
  
  # Build backend API
  log "Building API (NestJS)..."
  pnpm --filter "@akig/api" build
  
  # Build frontend
  log "Building Frontend (Next.js)..."
  pnpm --filter "@akig/web" build
  
  success "Applications buildées"
}

# --- DOCKER SETUP ---
setup_docker() {
  log "🐳 Configuration Docker..."
  
  # Build images
  docker compose build --no-cache --parallel
  
  # Démarrage services infrastructure d'abord
  log "Démarrage PostgreSQL + Redis..."
  docker compose up -d postgres redis
  
  # Attente PostgreSQL
  log "Attente de PostgreSQL..."
  until docker exec akig-postgres pg_isready -U akig -d akig_v3 &> /dev/null; do
    echo -n "."
    sleep 2
  done
  echo ""
  success "PostgreSQL prêt"
  
  # Attente Redis
  log "Attente de Redis..."
  until docker exec akig-redis redis-cli ping &> /dev/null; do
    echo -n "."
    sleep 1
  done
  echo ""
  success "Redis prêt"
}

# --- DATABASE MIGRATIONS ---
run_migrations() {
  log "🗄️  Exécution des migrations Prisma..."
  
  # Generate Prisma Client
  pnpm --filter "@akig/api" db:generate
  
  # Deploy migrations
  pnpm --filter "@akig/api" db:migrate:deploy
  
  success "Migrations appliquées"
}

# --- DÉMARRAGE SERVICES ---
start_services() {
  log "🚀 Démarrage de tous les services..."
  
  docker compose up -d
  
  # Attente API
  log "Attente de l'API..."
  until curl -sf http://localhost:4000/health > /dev/null 2>&1; do
    echo -n "."
    sleep 2
  done
  echo ""
  success "API démarrée"
  
  # Attente Frontend
  log "Attente du Frontend..."
  until curl -sf http://localhost:3000 > /dev/null 2>&1; do
    echo -n "."
    sleep 2
  done
  echo ""
  success "Frontend démarré"
}

# --- POST-INSTALL CHECKS ---
post_install_checks() {
  log "🧪 Vérifications post-installation..."
  
  # Health checks
  API_HEALTH=$(curl -s http://localhost:4000/health | jq -r '.status' 2>/dev/null || echo "unknown")
  ML_HEALTH=$(curl -s http://localhost:8000/health | jq -r '.status' 2>/dev/null || echo "unknown")
  
  if [ "$API_HEALTH" == "healthy" ]; then
    success "API Health: OK"
  else
    warn "API Health: $API_HEALTH"
  fi
  
  if [ "$ML_HEALTH" == "healthy" ]; then
    success "ML API Health: OK"
  else
    warn "ML API Health: $ML_HEALTH"
  fi
  
  # Services count
  RUNNING_SERVICES=$(docker compose ps --services --filter "status=running" | wc -l)
  info "Services en cours: ${RUNNING_SERVICES}"
}

# --- AFFICHAGE FINAL ---
display_summary() {
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║          🎉 AKIG v3.0 INSTALLATION TERMINÉE 🎉           ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}📍 URLs d'accès:${NC}"
  echo -e "   🌐 Frontend:    ${BLUE}http://localhost:3000${NC}"
  echo -e "   🔌 API:         ${BLUE}http://localhost:4000${NC}"
  echo -e "   🤖 ML API:      ${BLUE}http://localhost:8000${NC}"
  echo -e "   📚 API Docs:    ${BLUE}http://localhost:4000/api/docs${NC}"
  echo -e "   📊 Grafana:     ${BLUE}http://localhost:3001${NC} (admin/admin)"
  echo -e "   🔍 Prometheus:  ${BLUE}http://localhost:9090${NC}"
  echo ""
  echo -e "${CYAN}🔐 Identifiants par défaut:${NC}"
  echo -e "   Database: akig / ${DB_PASSWORD:0:8}..."
  echo -e "   Redis: ${REDIS_PASSWORD:0:8}..."
  echo -e "   ML API Key: ${ML_API_KEY:0:16}..."
  echo ""
  echo -e "${YELLOW}⚠️  IMPORTANT - Prochaines étapes:${NC}"
  echo -e "   1. Changez les mots de passe dans .env"
  echo -e "   2. Configurez SSL/TLS pour production"
  echo -e "   3. Configurez backup automatique DB"
  echo -e "   4. Activez monitoring Sentry/LogRocket"
  echo -e "   5. Exécutez tests: ${BLUE}pnpm test:ci${NC}"
  echo ""
  echo -e "${GREEN}🚀 AKIG v3.0 est prêt pour la production!${NC}"
  echo ""
}

# --- MAIN EXECUTION ---
main() {
  banner
  check_prerequisites
  install_dependencies
  setup_environment
  build_applications
  setup_docker
  run_migrations
  start_services
  post_install_checks
  display_summary
}

main "$@"
