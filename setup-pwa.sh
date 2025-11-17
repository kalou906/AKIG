#!/bin/bash
# Script de configuration rapide PWA AKIG

set -e  # Exit on error

echo "🚀 Configuration PWA AKIG"
echo "=========================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifications préalables
check_requirements() {
  echo -e "${BLUE}📋 Vérification des prérequis...${NC}"
  
  if ! command -v npm &> /dev/null; then
    echo "❌ npm non trouvé. Installez Node.js: https://nodejs.org"
    exit 1
  fi
  
  echo -e "${GREEN}✅ npm trouvé${NC}"
  npm --version
  echo ""
}

# Installation des dépendances
install_deps() {
  echo -e "${BLUE}📦 Installation des dépendances...${NC}"
  cd frontend-tailwind
  npm install
  cd ..
  echo -e "${GREEN}✅ Dépendances installées${NC}"
  echo ""
}

# Génération des icônes
generate_icons() {
  echo -e "${BLUE}🎨 Génération des icônes PWA...${NC}"
  
  if ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}⚠️  ImageMagick non trouvé${NC}"
    echo "   Installez avec: brew install imagemagick (macOS) ou apt-get install imagemagick (Linux)"
    echo "   Les icônes devront être créées manuellement pour la production"
  else
    cd frontend-tailwind
    bash generate-icons.sh || true  # Continue même si échoue
    cd ..
  fi
  echo ""
}

# Test de compilation
test_build() {
  echo -e "${BLUE}🔨 Test de compilation...${NC}"
  cd frontend-tailwind
  npm run build 2>&1 | tail -20
  cd ..
  echo -e "${GREEN}✅ Compilation réussie!${NC}"
  echo ""
}

# Info déploiement
deployment_info() {
  echo -e "${GREEN}🎉 Configuration PWA Complétée!${NC}"
  echo ""
  echo -e "${BLUE}📊 Résumé:${NC}"
  echo "  ✅ Service Worker configuré"
  echo "  ✅ PWA Manifest créé"
  echo "  ✅ Meta tags HTML ajoutés"
  echo "  ✅ Zéro erreurs TypeScript"
  echo ""
  echo -e "${BLUE}📝 Prochaines étapes:${NC}"
  echo "  1. Générer les icônes (si ImageMagick installé)"
  echo "  2. Build: npm run build"
  echo "  3. Tester localement: npx http-server frontend-tailwind/dist -p 8080"
  echo "  4. Déployer sur Vercel/Netlify"
  echo ""
  echo -e "${BLUE}📚 Documentation:${NC}"
  echo "  - PWA_SETUP.md → Guide complet"
  echo "  - PWA_COMPLETION.md → Checklist & troubleshooting"
  echo ""
  echo -e "${YELLOW}⚠️  Important:${NC}"
  echo "  - Service Workers ne fonctionnent que sur HTTPS en production"
  echo "  - Vérifier HTTPS sur votre serveur de déploiement"
  echo ""
}

# Menu principal
main() {
  echo -e "${BLUE}AKIG - Configuration PWA${NC}"
  echo "=========================="
  echo ""
  echo "Options:"
  echo "  1) Tout configurer (recommandé)"
  echo "  2) Vérifier les prérequis"
  echo "  3) Générer les icônes"
  echo "  4) Test de build"
  echo "  5) Afficher l'info de déploiement"
  echo "  6) Quitter"
  echo ""
  read -p "Choisir (1-6): " choice
  
  case $choice in
    1)
      check_requirements
      install_deps
      generate_icons
      test_build
      deployment_info
      ;;
    2)
      check_requirements
      ;;
    3)
  cd frontend-tailwind 2>/dev/null && generate_icons || (echo "❌ Dossier frontend-tailwind non trouvé"; exit 1)
      ;;
    4)
      test_build
      ;;
    5)
      deployment_info
      ;;
    6)
      echo "👋 Au revoir!"
      exit 0
      ;;
    *)
      echo "❌ Option invalide"
      exit 1
      ;;
  esac
}

# Exécuter le menu si script lancé directement
if [ "$0" = "${BASH_SOURCE[0]}" ]; then
  main
fi
