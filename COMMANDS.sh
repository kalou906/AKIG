#!/bin/bash
# Commandes Utiles AKIG - Script de démarrage

echo "🚀 AKIG v2.1 - Commandes Utiles"
echo "================================"
echo ""

# Démarrage rapide
echo "📋 DÉMARRAGE RAPIDE:"
echo "1. Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Frontend:"
echo "   cd frontend && npm start"
echo ""
echo "3. Tests:"
echo "   cd frontend && npm test"
echo ""

# Installation
echo "📦 INSTALLATION:"
echo "Backend:"
echo "  cd backend && npm install"
echo ""
echo "Frontend:"
echo "  cd frontend && npm install"
echo ""

# Build
echo "🔨 BUILD:"
echo "Frontend Production:"
echo "  cd frontend && npm run build"
echo ""
echo "Backend check:"
echo "  cd backend && node -c src/index.js"
echo ""

# Nettoyage
echo "🧹 NETTOYAGE:"
echo "Frontend cache:"
echo "  cd frontend && rm -rf node_modules build .eslintcache"
echo ""
echo "Backend cache:"
echo "  cd backend && rm -rf node_modules"
echo ""
echo "Réinstaller après nettoyage:"
echo "  npm install"
echo ""

# Logging
echo "📊 LOGGING:"
echo "Voir les logs:"
echo "  tail -f backend/logs/info-*.log"
echo ""
echo "Voir les erreurs:"
echo "  tail -f backend/logs/error-*.log"
echo ""

# Testing
echo "🧪 TESTING:"
echo "Frontend test:"
echo "  cd frontend && npm test"
echo ""
echo "Backend test (si configuré):"
echo "  cd backend && npm test"
echo ""

# API
echo "🔌 API:"
echo "Health check:"
echo "  curl http://localhost:4000/api/health"
echo ""
echo "Endpoints disponibles:"
echo "  /api/auth/login"
echo "  /api/contracts"
echo "  /api/payments"
echo "  /api/tenants"
echo ""

# Environnement
echo "⚙️  CONFIGURATION:"
echo "Copier template env:"
echo "  cd backend && cp .env.example .env"
echo ""
echo "Variables importantes:"
echo "  DATABASE_URL"
echo "  JWT_SECRET"
echo "  CORS_ORIGIN"
echo ""

# Liens utiles
echo "🔗 LIENS UTILES:"
echo "Frontend:        http://localhost:3000"
echo "Backend:         http://localhost:4000"
echo "API Health:      http://localhost:4000/api/health"
echo ""

# Documentation
echo "📚 DOCUMENTATION:"
echo "  - AKIG_FINALE.md - Vue d'ensemble"
echo "  - README_INSTALLATION.md - Installation"
echo "  - API_DOCUMENTATION.md - API reference"
echo "  - IMPROVEMENTS_SUMMARY.md - Améliorations"
echo "  - BUILD_STATUS.md - État du build"
echo ""

echo "✅ Prêt à commencer!"
