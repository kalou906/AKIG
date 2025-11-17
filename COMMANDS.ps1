# Commandes Utiles AKIG - Script PowerShell
# Pour Windows PowerShell

Write-Host "🚀 AKIG v2.1 - Commandes Utiles" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Démarrage rapide
Write-Host "📋 DÉMARRAGE RAPIDE:" -ForegroundColor Yellow
Write-Host "1. Backend:"
Write-Host "   cd backend; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Frontend:"
Write-Host "   cd frontend; npm start" -ForegroundColor White
Write-Host ""
Write-Host "3. Tests:"
Write-Host "   cd frontend; npm test" -ForegroundColor White
Write-Host ""

# Installation
Write-Host "📦 INSTALLATION:" -ForegroundColor Yellow
Write-Host "Backend:"
Write-Host "  cd backend; npm install" -ForegroundColor White
Write-Host ""
Write-Host "Frontend:"
Write-Host "  cd frontend; npm install" -ForegroundColor White
Write-Host ""

# Build
Write-Host "🔨 BUILD:" -ForegroundColor Yellow
Write-Host "Frontend Production:"
Write-Host "  cd frontend; npm run build" -ForegroundColor White
Write-Host ""
Write-Host "Backend check:"
Write-Host "  cd backend; node -c src/index.js" -ForegroundColor White
Write-Host ""

# Nettoyage
Write-Host "🧹 NETTOYAGE:" -ForegroundColor Yellow
Write-Host "Frontend cache:"
Write-Host "  cd frontend; Remove-Item -Recurse -Force node_modules,build,.eslintcache" -ForegroundColor White
Write-Host ""
Write-Host "Backend cache:"
Write-Host "  cd backend; Remove-Item -Recurse -Force node_modules" -ForegroundColor White
Write-Host ""
Write-Host "Réinstaller après nettoyage:"
Write-Host "  npm install" -ForegroundColor White
Write-Host ""

# Logging
Write-Host "📊 LOGGING:" -ForegroundColor Yellow
Write-Host "Voir les logs info:"
Write-Host "  Get-Content backend/logs/info-*.log -Tail 50 -Wait" -ForegroundColor White
Write-Host ""
Write-Host "Voir les erreurs:"
Write-Host "  Get-Content backend/logs/error-*.log -Tail 50 -Wait" -ForegroundColor White
Write-Host ""

# Testing
Write-Host "🧪 TESTING:" -ForegroundColor Yellow
Write-Host "Frontend test:"
Write-Host "  cd frontend; npm test" -ForegroundColor White
Write-Host ""
Write-Host "Backend test (si configuré):"
Write-Host "  cd backend; npm test" -ForegroundColor White
Write-Host ""

# API
Write-Host "🔌 API:" -ForegroundColor Yellow
Write-Host "Health check:"
Write-Host "  curl http://localhost:4000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Endpoints disponibles:" -ForegroundColor White
Write-Host "  /api/auth/login" -ForegroundColor Gray
Write-Host "  /api/contracts" -ForegroundColor Gray
Write-Host "  /api/payments" -ForegroundColor Gray
Write-Host "  /api/tenants" -ForegroundColor Gray
Write-Host ""

# Environnement
Write-Host "⚙️  CONFIGURATION:" -ForegroundColor Yellow
Write-Host "Copier template env:"
Write-Host "  cd backend; Copy-Item .env.example .env" -ForegroundColor White
Write-Host ""
Write-Host "Variables importantes:" -ForegroundColor White
Write-Host "  DATABASE_URL" -ForegroundColor Gray
Write-Host "  JWT_SECRET" -ForegroundColor Gray
Write-Host "  CORS_ORIGIN" -ForegroundColor Gray
Write-Host ""

# Liens utiles
Write-Host "🔗 LIENS UTILES:" -ForegroundColor Yellow
Write-Host "Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "Backend:         http://localhost:4000" -ForegroundColor White
Write-Host "API Health:      http://localhost:4000/api/health" -ForegroundColor White
Write-Host ""

# Documentation
Write-Host "📚 DOCUMENTATION:" -ForegroundColor Yellow
Write-Host "  - AKIG_FINALE.md - Vue d'ensemble" -ForegroundColor White
Write-Host "  - README_INSTALLATION.md - Installation" -ForegroundColor White
Write-Host "  - API_DOCUMENTATION.md - API reference" -ForegroundColor White
Write-Host "  - IMPROVEMENTS_SUMMARY.md - Améliorations" -ForegroundColor White
Write-Host "  - BUILD_STATUS.md - État du build" -ForegroundColor White
Write-Host ""

# Fonctions utiles
Write-Host "⚡ FONCTIONS UTILES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "function Start-AKIG {" -ForegroundColor Cyan
Write-Host "    Write-Host 'Starting AKIG...' -ForegroundColor Green" -ForegroundColor Gray
Write-Host "    Start-Job { cd c:\AKIG\backend; npm run dev }" -ForegroundColor Gray
Write-Host "    Start-Job { cd c:\AKIG\frontend; npm start }" -ForegroundColor Gray
Write-Host "}" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ajouter cette fonction à votre profil PowerShell:" -ForegroundColor White
Write-Host "  $profile" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Prêt à commencer!" -ForegroundColor Green
