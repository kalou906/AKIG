# 🚀 Quick Start - Spécificités Guinéennes AKIG (PowerShell)
# Exécution: .\QUICK_START_GUINEA.ps1

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🇬🇳 AKIG - QUICK START GUINÉE" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 ÉTAPES:" -ForegroundColor Cyan
Write-Host "1. Démarrer Backend"
Write-Host "2. Tester API"
Write-Host "3. Démarrer Frontend"
Write-Host ""

# STEP 1: Info Backend
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "1️⃣ BACKEND" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  À FAIRE DANS UN NOUVEAU TERMINAL:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrir PowerShell (Shift+Click droit → Open PowerShell)"
Write-Host "2. Exécuter:" -ForegroundColor Cyan
Write-Host "   cd C:\AKIG\backend" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "3. Attendre le message:" -ForegroundColor Cyan
Write-Host "   'Server running on port 4000'" -ForegroundColor Green
Write-Host ""

$null = Read-Host "Cliquez ENTRÉE quand le backend est démarré"

# STEP 2: Tests
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "2️⃣ TESTS API (Dans le terminal backend)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  À FAIRE DANS UN DEUXIÈME TERMINAL:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrir PowerShell"
Write-Host "2. Exécuter:" -ForegroundColor Cyan
Write-Host "   cd C:\AKIG\backend" -ForegroundColor Green
Write-Host "   node test-guinea-api.js" -ForegroundColor Green
Write-Host ""
Write-Host "3. Résultat attendu:" -ForegroundColor Cyan
Write-Host "   ✅ Tests réussis: 17/17" -ForegroundColor Green
Write-Host ""

$null = Read-Host "Cliquez ENTRÉE quand les tests sont terminés"

# STEP 3: Frontend
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "3️⃣ FRONTEND" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  À FAIRE DANS UN TROISIÈME TERMINAL:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrir PowerShell"
Write-Host "2. Exécuter:" -ForegroundColor Cyan
Write-Host "   cd C:\AKIG\frontend" -ForegroundColor Green
Write-Host "   npm start" -ForegroundColor Green
Write-Host ""
Write-Host "3. Attendre le message:" -ForegroundColor Cyan
Write-Host "   'Compiled successfully'" -ForegroundColor Green
Write-Host ""

# STEP 4: Tests manuels
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "4️⃣ TESTS MANUELS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Une fois les 2 serveurs démarrés:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Ouvrir navigateur: " -ForegroundColor Cyan -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "2. Vérifier:" -ForegroundColor Cyan
Write-Host "   ✓ Logo personnel visible (haut gauche)"
Write-Host "   ✓ Pas d'erreurs console (F12)"
Write-Host ""
Write-Host "3. Tester endpoint API:" -ForegroundColor Cyan
Write-Host "   Dans console du browser (F12 → Console):" -ForegroundColor Gray
Write-Host ""
Write-Host "   fetch('/api/guinea/currency/info')" -ForegroundColor Green
Write-Host "     .then(r => r.json())" -ForegroundColor Green
Write-Host "     .then(d => console.log(d))" -ForegroundColor Green
Write-Host ""
Write-Host "   Résultat: { success: true, data: { code: 'GNF', ... } }" -ForegroundColor Green
Write-Host ""

# STEP 5: Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ GUIDE DÉMARRAGE COMPLET" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Ressources créées:" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend (1200+ lignes):" -ForegroundColor Cyan
Write-Host "    • GuineaCurrency.service.js" -ForegroundColor Gray
Write-Host "    • GuineaSectors.service.js" -ForegroundColor Gray
Write-Host "    • GuineanPayment.service.js" -ForegroundColor Gray
Write-Host "    • guinea.routes.js (29 endpoints)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Frontend (850+ lignes):" -ForegroundColor Cyan
Write-Host "    • useGuinea.js (3 hooks)" -ForegroundColor Gray
Write-Host "    • SectorsComponent.jsx" -ForegroundColor Gray
Write-Host "    • PaymentMethodsComponent.jsx" -ForegroundColor Gray
Write-Host "    • GuineaProperties.jsx" -ForegroundColor Gray
Write-Host ""
Write-Host "  Documentation (1000+ lignes):" -ForegroundColor Cyan
Write-Host "    • GUINEE_SPECIFICATIONS_COMPLETE.md" -ForegroundColor Gray
Write-Host "    • DEPLOYMENT_GUINEA.md" -ForegroundColor Gray
Write-Host "    • RESUME_FINAL.md" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "📌 POINTS IMPORTANTS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Logo visible SEULEMENT après:" -ForegroundColor Cyan
Write-Host "   • Backend restart (npm run dev)" -ForegroundColor Gray
Write-Host "   • Browser cache clear (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. API endpoints disponibles:" -ForegroundColor Cyan
Write-Host "   • http://localhost:4000/api/guinea/currency/info" -ForegroundColor Gray
Write-Host "   • http://localhost:4000/api/guinea/sectors" -ForegroundColor Gray
Write-Host "   • http://localhost:4000/api/guinea/payments/methods" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Pour ajouter page Guinée au menu:" -ForegroundColor Cyan
Write-Host "   • Éditer: frontend/src/App.jsx" -ForegroundColor Gray
Write-Host "   • Ajouter route: /properties-guinea" -ForegroundColor Gray
Write-Host "   • Voir DEPLOYMENT_GUINEA.md pour détails" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ PRÊT À UTILISER! 🚀" -ForegroundColor Green -BackgroundColor Black
Write-Host ""

# Fichiers supplémentaires
Write-Host "📚 DOCUMENTATION SUPPLÉMENTAIRE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Lire ces fichiers pour plus de détails:" -ForegroundColor Gray
Write-Host ""
Write-Host "   1. RESUME_FINAL.md" -ForegroundColor Yellow
Write-Host "      → Résumé complet de tout ce qui a été créé" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. GUINEE_SPECIFICATIONS_COMPLETE.md" -ForegroundColor Yellow
Write-Host "      → Documentation technique détaillée" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. DEPLOYMENT_GUINEA.md" -ForegroundColor Yellow
Write-Host "      → Guide de déploiement en production" -ForegroundColor Gray
Write-Host ""
