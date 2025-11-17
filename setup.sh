#!/bin/bash

# ============================================================
# AKIG - Setup & Validation Script (macOS/Linux)
# Shell script automatisé pour configuration complète
# ============================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  AKIG - Multi-Browser Testing Framework Setup         ║${NC}"
    echo -e "${CYAN}║  macOS/Linux Configuration Script                    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_section "Vérification des pré-requis"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        echo "Installer depuis: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js trouvé: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    print_success "npm trouvé: $(npm --version)"
    
    # Check git (optional)
    if command -v git &> /dev/null; then
        print_success "Git trouvé: $(git --version)"
    else
        print_info "Git non trouvé (optionnel)"
    fi
}

# Initialize project
initialize_project() {
    print_section "Initialisation du projet"
    
    # Check if package.json exists
    if [ ! -f "frontend/package.json" ]; then
        print_error "package.json non trouvé dans frontend/"
        exit 1
    fi
    
    print_info "Installation des dépendances npm..."
    cd frontend
    npm install
    
    print_info "Installation des navigateurs Playwright..."
    npx playwright install
    
    cd ..
    print_success "Initialisation terminée"
}

# Verify configuration
verify_configuration() {
    print_section "Vérification de la configuration"
    
    cd frontend
    
    print_info "Validation des standards web..."
    node scripts/validate-web-standards.js
    
    print_info "Checklist pré-production..."
    node scripts/launch-checklist.js
    
    cd ..
    print_success "Vérification terminée"
}

# Setup environment
setup_environment() {
    print_section "Configuration des variables d'environnement"
    
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            print_success ".env créé depuis .env.example"
            echo ""
            print_info "Veuillez éditer frontend/.env et ajouter:"
            echo "  - DATABASE_URL (PostgreSQL)"
            echo "  - JWT_SECRET (clé secrète)"
            echo "  - REACT_APP_SENTRY_DSN (optionnel)"
            echo "  - REACT_APP_GA_ID (optionnel)"
        else
            print_error ".env.example non trouvé"
        fi
    else
        print_success ".env déjà configuré"
    fi
}

# Run tests
run_tests() {
    print_section "Exécution des tests"
    
    echo "1. Tous les navigateurs (25 minutes)"
    echo "2. Chrome seulement"
    echo "3. Firefox seulement"
    echo "4. Safari seulement"
    echo "5. Mobile (Android + iOS)"
    echo "6. Mode debug (pause avant actions)"
    echo "7. UI Interactive (dashboard)"
    echo "0. Passer"
    
    read -p "Choisir une option (0-7): " test_choice
    
    cd frontend
    
    case $test_choice in
        1) npm run test:all ;;
        2) npm run test:chrome ;;
        3) npm run test:firefox ;;
        4) npm run test:safari ;;
        5) npm run test:mobile ;;
        6) npm run test:debug ;;
        7) npm run test:ui ;;
        0) print_info "Tests skippés" ;;
        *) print_error "Option invalide" ;;
    esac
    
    cd ..
}

# Setup monitoring
setup_monitoring() {
    print_section "Configuration du monitoring (optionnel)"
    
    read -p "Voulez-vous configurer Sentry? (y/n): " sentry_choice
    
    if [ "$sentry_choice" = "y" ]; then
        print_info "1. Créer un compte sur https://sentry.io/"
        print_info "2. Copier le DSN"
        print_info "3. Ajouter à frontend/.env:"
        print_info "   REACT_APP_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
        read -p "Appuyer sur Entrée une fois complété..."
    fi
    
    read -p "Voulez-vous configurer Google Analytics 4? (y/n): " ga_choice
    
    if [ "$ga_choice" = "y" ]; then
        print_info "1. Créer une propriété GA4 sur https://analytics.google.com/"
        print_info "2. Copier le Measurement ID"
        print_info "3. Ajouter à frontend/.env:"
        print_info "   REACT_APP_GA_ID=G-XXXXXXXXXX"
        read -p "Appuyer sur Entrée une fois complété..."
    fi
}

# Start development
start_development() {
    print_section "Démarrage du serveur de développement"
    
    echo "1. Frontend uniquement (npm run dev)"
    echo "2. Backend uniquement (Node.js API)"
    echo "3. Frontend + Backend (parallèle)"
    echo "0. Passer"
    
    read -p "Choisir une option (0-3): " start_choice
    
    case $start_choice in
        1)
            print_info "Démarrage du frontend sur http://localhost:3000"
            cd frontend
            npm run dev
            ;;
        2)
            print_info "Démarrage du backend sur http://localhost:4000"
            cd backend
            npm run dev
            ;;
        3)
            print_info "Démarrage des deux services..."
            # Ouvrir dans des onglets ou screens
            echo "À faire manuellement ou utiliser tmux/screen"
            ;;
        0)
            print_info "Serveur non démarré"
            ;;
        *)
            print_error "Option invalide"
            ;;
    esac
}

# Main menu
show_menu() {
    echo ""
    echo -e "${YELLOW}📋 MENU PRINCIPAL${NC}"
    echo "═════════════════════════════════════════════════════════"
    echo "1. Vérifier les pré-requis"
    echo "2. Initialiser le projet"
    echo "3. Vérifier la configuration"
    echo "4. Configurer les variables d'environnement"
    echo "5. Exécuter les tests"
    echo "6. Configurer le monitoring"
    echo "7. Démarrer le serveur de développement"
    echo "8. Tous les étapes (setup complet)"
    echo "0. Quitter"
    echo ""
    read -p "Choisir une option (0-8): " choice
    
    case $choice in
        1) check_prerequisites; show_menu ;;
        2) initialize_project; show_menu ;;
        3) verify_configuration; show_menu ;;
        4) setup_environment; show_menu ;;
        5) run_tests; show_menu ;;
        6) setup_monitoring; show_menu ;;
        7) start_development; show_menu ;;
        8)
            check_prerequisites
            initialize_project
            setup_environment
            verify_configuration
            setup_monitoring
            echo ""
            print_success "Setup complet terminé!"
            echo "Prochaines étapes:"
            echo "1. Éditer frontend/.env avec vos valeurs"
            echo "2. Exécuter: npm run dev (frontend)"
            echo "3. Exécuter: npm run test:all (tests)"
            ;;
        0)
            print_info "Au revoir! 👋"
            exit 0
            ;;
        *)
            print_error "Option invalide"
            show_menu
            ;;
    esac
}

# Main execution
main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Veuillez exécuter ce script depuis la racine du projet AKIG"
        exit 1
    fi
    
    show_menu
}

# Run main
main
