#╔══════════════════════════════════════════════════════════════════╗
#║           AKIG - LAUNCHER POWERSHELL - UN CLICK SEULEMENT           ║
#║  Démarre AUTOMATIQUEMENT : Backend, Frontend, Toutes les Configs    ║
#╚══════════════════════════════════════════════════════════════════╝

Clear-Host
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    🚀 AKIG EN DÉMARRAGE...                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

# [1] Vérifier Node.js
Write-Host "[1/5] Vérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé !" -ForegroundColor Red
    Write-Host "   Visitez : https://nodejs.org/" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour fermer"
    exit
}

# [2] Vérifier Backend
Write-Host ""
Write-Host "[2/5] Vérification du Backend..." -ForegroundColor Yellow
if (-not (Test-Path "backend\src\index.js")) {
    Write-Host "❌ Backend non trouvé !" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour fermer"
    exit
}
Write-Host "✓ Backend trouvé" -ForegroundColor Green

# [3] Vérifier Frontend
Write-Host ""
Write-Host "[3/5] Vérification du Frontend..." -ForegroundColor Yellow
if (-not (Test-Path "akig-ultimate\src\App.jsx")) {
    Write-Host "❌ Frontend non trouvé !" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour fermer"
    exit
}
Write-Host "✓ Frontend trouvé" -ForegroundColor Green

# [4] Démarrer Backend
Write-Host ""
Write-Host "[4/5] Démarrage du Backend (port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\backend'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "✓ Backend démarré" -ForegroundColor Green

# [5] Démarrer Frontend
Write-Host ""
Write-Host "[5/5] Démarrage du Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\akig-ultimate'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "✓ Frontend démarré" -ForegroundColor Green

# Affichage final
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    ✅ AKIG EST PRÊT !                            ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌐 Frontend  : " -ForegroundColor White -NoNewLine
Write-Host "http://localhost:5173" -ForegroundColor Yellow
Write-Host "  🔌 Backend   : " -ForegroundColor White -NoNewLine
Write-Host "http://localhost:4000/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🔐 Système de Rôles & Permissions (Gestion complète)" -ForegroundColor Green
Write-Host "     • SUPER_ADMIN - Accès complet" -ForegroundColor Green
Write-Host "     • OWNER - Propriétaire immobilier" -ForegroundColor Green
Write-Host "     • AGENCY - Agence immobilière" -ForegroundColor Green
Write-Host "     • ACCOUNTANT - Comptable" -ForegroundColor Green
Write-Host "     • TENANT - Locataire" -ForegroundColor Green
Write-Host "     • SUPPORT - Support client" -ForegroundColor Green
Write-Host ""
Write-Host "  📊 Modules Disponibles :" -ForegroundColor Cyan
Write-Host "     1️⃣  Gestion Immobilière (5 fonctions)" -ForegroundColor Cyan
Write-Host "     2️⃣  Recouvrement & Paiements (3 fonctions)" -ForegroundColor Cyan
Write-Host "     3️⃣  Opérations & Maintenance (2 fonctions)" -ForegroundColor Cyan
Write-Host "     4️⃣  Reporting & Analytics (3 fonctions)" -ForegroundColor Cyan
Write-Host "     5️⃣  Portails & Accès Client (2 fonctions)" -ForegroundColor Cyan
Write-Host "     6️⃣  Administration (3 fonctions)" -ForegroundColor Cyan
Write-Host "     7️⃣  IA & Recherche (3 fonctions)" -ForegroundColor Cyan
Write-Host "     8️⃣  Cartographie & Mobile (3 fonctions)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🎯 + 50+ API Endpoints" -ForegroundColor Magenta
Write-Host "  🤖 + Machine Learning & Prédictions" -ForegroundColor Magenta
Write-Host "  💬 + Chatbot Intelligent" -ForegroundColor Magenta
Write-Host "  🗺️ + Cartographie Avancée" -ForegroundColor Magenta
Write-Host "  📧 + Rapports Automatisés" -ForegroundColor Magenta
Write-Host "  🛒 + Place Marché" -ForegroundColor Magenta
Write-Host ""
Write-Host "╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  ✨ Les 2 fenêtres PowerShell ci-dessus exécutent les serveurs   ║" -ForegroundColor Cyan
Write-Host "║     Laissez-les ouvertes pour garder l'application active      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Read-Host "Appuyez sur Entrée pour fermer cette fenêtre"
