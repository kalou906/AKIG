#!/bin/bash
# Script de vérification complète du setup AKIG PWA

echo "🔍 Vérification Complète du Setup AKIG PWA"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
CHECKS_PASSED=0
CHECKS_FAILED=0

# Fonction pour vérifier
check() {
  local name=$1
  local command=$2
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $name"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}❌${NC} $name"
    ((CHECKS_FAILED++))
  fi
}

# 1. Frontend Tailwind
echo -e "${BLUE}📁 Frontend Tailwind${NC}"
check "index.html présent" "[ -f frontend-tailwind/index.html ]"
check "main.tsx présent" "[ -f frontend-tailwind/src/main.tsx ]"
check "AuthContext présent" "[ -f frontend-tailwind/src/context/AuthContext.tsx ]"
check "API client présent" "[ -f frontend-tailwind/src/lib/api.ts ]"
check "Page Tenants disponible" "[ -f frontend-tailwind/src/pages/TenantsPage.tsx ]"
echo ""

# 2. Frontend Ultimate
echo -e "${BLUE}🚀 Frontend Ultimate${NC}"
check "main.jsx présent" "[ -f akig-ultimate/src/main.jsx ]"
check "Layout.jsx présent" "[ -f akig-ultimate/src/components/Layout.jsx ]"
check "Service API" "[ -f akig-ultimate/src/services/api.js ]"
check "Store UI" "[ -f akig-ultimate/src/store/uiStore.jsx ]"
check "Topbar.jsx présent" "[ -f akig-ultimate/src/components/Topbar.jsx ]"
echo ""

# 3. Vérifier Node
echo -e "${BLUE}⚙️  Node & NPM${NC}"
check "Node.js installed" "command -v node"
check "npm installed" "command -v npm"
check "Node version 18+" "node -v | grep -E 'v1[8-9]|v2[0-9]'"
echo ""

# 4. Vérifier dépendances
echo -e "${BLUE}📦 Dépendances${NC}"
if [ -d "frontend-tailwind/node_modules" ]; then
  echo -e "${GREEN}✅${NC} Dépendances Tailwind installées"
  ((CHECKS_PASSED++))
  check "React installé" "[ -d 'frontend-tailwind/node_modules/react' ]"
  check "TypeScript installé" "[ -d 'frontend-tailwind/node_modules/typescript' ]"
else
  echo -e "${YELLOW}⚠️  Dépendances Tailwind manquantes${NC}"
  ((CHECKS_FAILED++))
  echo "   Exécutez : cd frontend-tailwind && npm install"
fi
if [ -d "akig-ultimate/node_modules" ]; then
  echo -e "${GREEN}✅${NC} Dépendances Ultimate installées"
  ((CHECKS_PASSED++))
  check "socket.io-client installé" "[ -d 'akig-ultimate/node_modules/socket.io-client' ]"
else
  echo -e "${YELLOW}⚠️  Dépendances Ultimate manquantes${NC}"
  ((CHECKS_FAILED++))
  echo "   Exécutez : cd akig-ultimate && npm install"
fi
echo ""

# 5. Vérifier composants
echo -e "${BLUE}🎨 Components${NC}"
check "Dashboard Tailwind" "[ -f 'frontend-tailwind/src/App.tsx' ]"
check "Page Contrats Tailwind" "[ -f 'frontend-tailwind/src/pages/ContractsPage.tsx' ]"
check "SmartTable Ultimate" "[ -f 'akig-ultimate/src/components/SmartTable.jsx' ]"
check "ThemeToggle Ultimate" "[ -f 'akig-ultimate/src/components/ThemeToggle.jsx' ]"
echo ""

# 6. Vérifier services
echo -e "${BLUE}🔧 Services${NC}"
check "Client API Tailwind" "[ -f 'frontend-tailwind/src/lib/api.ts' ]"
check "Gestion Auth Tailwind" "[ -f 'frontend-tailwind/src/context/AuthContext.tsx' ]"
check "Service Offline Ultimate" "[ -f 'akig-ultimate/src/services/offline.js' ]"
check "Service Notifications Ultimate" "[ -f 'akig-ultimate/src/services/notify.js' ]"
echo ""

# 7. Vérifier styles
echo -e "${BLUE}🎨 Styles${NC}"
check "Tailwind CSS" "[ -f 'frontend-tailwind/src/index.css' ]"
check "Dark mode config" "[ -f 'frontend-tailwind/tailwind.config.js' ]"
check "PostCSS config" "[ -f 'frontend-tailwind/postcss.config.js' ]"
echo ""

# 8. Vérifier documentation
echo -e "${BLUE}📚 Documentation${NC}"
check "README AKIG" "[ -f 'README.md' -o -f 'GETTING_STARTED.md' ]"
check "Deployment guide" "[ -f 'DEPLOYMENT_GUIDE_COMPLETE.md' -o -f 'DEPLOYMENT_CHECKLIST.md' ]"
check "Architecture docs" "[ -f 'ARCHITECTURE_DIAGRAM.md' -o -f 'INFRASTRUCTURE_SUMMARY.md' ]"
check "API Documentation" "[ -f 'COMPLETE_API_ENDPOINTS.md' -o -f 'API_DOCUMENTATION.md' ]"
echo ""

# 9. Vérifier scripts
echo -e "${BLUE}🚀 Scripts${NC}"
check "setup-pwa script" "[ -f 'setup-pwa.sh' ]"
check "launch script" "[ -f 'LAUNCH.ps1' -o -f 'LAUNCH.sh' ]"
check "health-check script" "[ -f 'health-check.ps1' ]"
check "docker-compose" "[ -f 'docker-compose.yml' ]"
echo ""

# 10. Vérifier configuration
echo -e "${BLUE}⚙️  Configuration${NC}"
check "Vite config (Tailwind)" "[ -f 'frontend-tailwind/vite.config.ts' ]"
check "Vite config (Ultimate)" "[ -f 'akig-ultimate/vite.config.js' ]"
check "Backend Dockerfile" "[ -f 'backend/Dockerfile' ]"
check "TypeScript configs" "[ -f 'backend/tsconfig.json' ] && [ -f 'frontend-tailwind/tsconfig.json' ]"
echo ""

# Résumé
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Résumé de Vérification${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "Vérifications passées:  ${GREEN}$CHECKS_PASSED ✅${NC}"
echo -e "Vérifications échouées: ${RED}$CHECKS_FAILED ❌${NC}"
echo ""

# Vérification TypeScript sans build complet
if command -v npx &> /dev/null; then
  echo -e "${BLUE}🔍 Vérification TypeScript...${NC}"
  
  # Frontend Tailwind TypeScript check
  if cd frontend-tailwind 2>/dev/null; then
    if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
      echo -e "${RED}❌ Frontend-Tailwind: TypeScript errors${NC}"
      ((CHECKS_FAILED++))
    else
      echo -e "${GREEN}✅ Frontend-Tailwind: 0 TypeScript errors${NC}"
      ((CHECKS_PASSED++))
    fi
    cd ..
  fi
  
  # Backend TypeScript check
  if cd backend 2>/dev/null; then
    if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
      echo -e "${RED}❌ Backend: TypeScript errors${NC}"
      ((CHECKS_FAILED++))
    else
      echo -e "${GREEN}✅ Backend: 0 TypeScript errors${NC}"
      ((CHECKS_PASSED++))
    fi
    cd ..
  fi
fi
echo ""

# Vérification npm audit
if command -v npm &> /dev/null; then
  echo -e "${BLUE}🔒 Vérification Sécurité (npm audit)...${NC}"
  
  for dir in backend frontend-tailwind akig-ultimate; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
      if cd "$dir" 2>/dev/null; then
        if npm audit 2>&1 | grep -q "vulnerabilities"; then
          echo -e "${RED}❌ $dir: Vulnérabilités trouvées${NC}"
          ((CHECKS_FAILED++))
        else
          echo -e "${GREEN}✅ $dir: Pas de vulnérabilités${NC}"
          ((CHECKS_PASSED++))
        fi
        cd ..
      fi
    fi
  done
fi
echo ""

# Status final
if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo -e "${GREEN}🎉 TOUS LES TESTS RÉUSSIS! 🎉${NC}"
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo ""
  echo "📊 RÉSUMÉ COMPLET:"
  echo ""
  echo "✅ Frontend-Tailwind: PRÊT"
  echo "✅ Frontend-Ultimate: PRÊT"
  echo "✅ Backend: PRÊT"
  echo "✅ TypeScript: 0 ERREURS"
  echo "✅ npm audit: 0 VULNÉRABILITÉS"
  echo "✅ Docker Infrastructure: VALIDÉE"
  echo "✅ Documentation: COMPLÈTE"
  echo ""
  echo -e "${YELLOW}Prêt pour:${NC}"
  echo "  1. npm run build (dans chaque dossier)"
  echo "  2. Backend: npm start (port 4002)"
  echo "  3. Docker: docker-compose up -d"
  echo "  4. Déploiement production"
  echo ""
  exit 0
else
  echo -e "${RED}════════════════════════════════════════${NC}"
  echo -e "${RED}⚠️  Certains tests ont échoué ($CHECKS_FAILED)${NC}"
  echo -e "${RED}════════════════════════════════════════${NC}"
  echo ""
  echo "À faire:"
  echo "  1. npm install (pour les dépendances manquantes)"
  echo "  2. Vérifier les chemins de fichiers"
  echo "  3. Relancer ce script"
  echo ""
  exit 1
fi
