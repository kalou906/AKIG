#!/bin/bash
# 🚀 Quick Start - Spécificités Guinéennes AKIG
# Exécution: bash quick-start.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🇬🇳 AKIG - QUICK START GUINÉE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function pour afficher status
status() {
    echo -e "${GREEN}✅${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ️ ${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
}

echo ""
echo "📋 ÉTAPES:"
echo "1. Démarrer Backend"
echo "2. Tester API"
echo "3. Démarrer Frontend"
echo ""

# STEP 1: Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣ BACKEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd C:/AKIG/backend 2>/dev/null || cd /c/AKIG/backend

info "Démarrage du serveur backend..."
info "Commande: npm run dev"
info ""
info "Attendez le message: 'Server running on port 4000'"
info ""

# Note: Ne pas lancer en background pour voir les logs
# npm run dev

warn "À FAIRE DANS UN TERMINAL DISTINCT:"
echo "1. Ouvrir un NOUVEAU terminal PowerShell"
echo "2. Exécuter: cd C:\\AKIG\\backend"
echo "3. Exécuter: npm run dev"
echo ""
echo "Cliquez ENTRÉE quand le backend est démarré..."
read

# STEP 2: Tests
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣ TESTS API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

info "Exécution des 17 tests..."
node test-guinea-api.js

if [ $? -eq 0 ]; then
    status "Tous les tests sont passés! ✅"
else
    warn "Certains tests ont échoué - vérifiez les logs"
fi

# STEP 3: Frontend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd C:/AKIG/frontend 2>/dev/null || cd /c/AKIG/frontend

info "Démarrage du serveur frontend..."
info "Commande: npm start"
info ""
info "Attendez le message: 'Compiled successfully'"
info ""

warn "À FAIRE DANS UN AUTRE TERMINAL:"
echo "1. Ouvrir un TROISIÈME terminal PowerShell"
echo "2. Exécuter: cd C:\\AKIG\\frontend"
echo "3. Exécuter: npm start"
echo ""

# STEP 4: Tests manuels
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣ TESTS MANUELS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
status "Une fois les 2 serveurs démarrés:"
echo ""
echo "1. Ouvrir: http://localhost:3000"
echo "2. Vérifier:"
echo "   ✓ Logo personnel visible (haut gauche)"
echo "   ✓ Pas d'erreurs console (F12)"
echo ""
echo "3. Tester endpoint API:"
echo "   Dans console du browser (F12 → Console):"
echo ""
echo "   fetch('/api/guinea/currency/info')"
echo "     .then(r => r.json())"
echo "     .then(d => console.log(d))"
echo ""
echo "   Doit afficher: { success: true, data: { code: 'GNF', ... } }"
echo ""

# STEP 5: Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GUIDE DÉMARRAGE COMPLET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
status "Toutes les ressources créées:"
echo ""
echo "  Backend:"
echo "    • GuineaCurrency.service.js"
echo "    • GuineaSectors.service.js"
echo "    • GuineanPayment.service.js"
echo "    • guinea.routes.js (29 endpoints)"
echo ""
echo "  Frontend:"
echo "    • useGuinea.js (3 hooks)"
echo "    • SectorsComponent.jsx"
echo "    • PaymentMethodsComponent.jsx"
echo "    • GuineaProperties.jsx"
echo ""
echo "  Documentation:"
echo "    • GUINEE_SPECIFICATIONS_COMPLETE.md"
echo "    • DEPLOYMENT_GUINEA.md"
echo "    • RESUME_FINAL.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 POINTS IMPORTANTS:"
echo ""
echo "1. Logo visible SEULEMENT après:"
echo "   • Backend restart (npm run dev)"
echo "   • Browser cache clear (Ctrl+Shift+R)"
echo ""
echo "2. API endpoints disponibles:"
echo "   • http://localhost:4000/api/guinea/currency/info"
echo "   • http://localhost:4000/api/guinea/sectors"
echo "   • http://localhost:4000/api/guinea/payments/methods"
echo ""
echo "3. Pour ajouter page Guinée au menu:"
echo "   • Éditer: frontend/src/App.jsx"
echo "   • Ajouter route: /properties-guinea"
echo "   • Voir DEPLOYMENT_GUINEA.md pour détails"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
status "PRÊT À UTILISER! 🚀"
echo ""
