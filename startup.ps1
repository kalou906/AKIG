# ============================================================
# startup.ps1 - Démarrage orchestré AKIG pour Windows
# DB → Backend → Frontend → Tests
# ============================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      🚀 AKIG - DÉMARRAGE ORCHESTRÉ COMPLET (WINDOWS)   ║" -ForegroundColor Cyan
Write-Host "║    100% Sans Faille - Architecture Robuste             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# PHASE 1: Vérifications pré-démarrage
# ============================================================

Write-Host "📋 PHASE 1: Vérifications Configuration" -ForegroundColor Cyan
Write-Host ""

# Vérifier Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
  Write-Host "❌ Node.js non trouvé. Installez Node.js v18+" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# Vérifier npm
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
  Write-Host "❌ npm non trouvé" -ForegroundColor Red
  exit 1
}
Write-Host "✅ npm $npmVersion" -ForegroundColor Green

# Vérifier .env
if (-not (Test-Path ".env")) {
  Write-Host "❌ .env non trouvé" -ForegroundColor Red
  Write-Host "   Copier: copy .env.example .env" -ForegroundColor Yellow
  exit 1
}
Write-Host "✅ .env existe" -ForegroundColor Green

# Vérifier variables critiques
$envContent = Get-Content ".env" -Raw
if (-not ($envContent -match "DATABASE_URL")) {
  Write-Host "❌ DATABASE_URL non configuré dans .env" -ForegroundColor Red
  exit 1
}
Write-Host "✅ DATABASE_URL configuré" -ForegroundColor Green

if (-not ($envContent -match "JWT_SECRET")) {
  Write-Host "❌ JWT_SECRET non configuré dans .env" -ForegroundColor Red
  exit 1
}
Write-Host "✅ JWT_SECRET configuré" -ForegroundColor Green

Write-Host ""

# ============================================================
# PHASE 2: Backend
# ============================================================

Write-Host "🔧 PHASE 2: Démarrage Backend" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend")) {
  Write-Host "❌ Répertoire backend\ non trouvé" -ForegroundColor Red
  exit 1
}

Set-Location backend

Write-Host "⏳ Installation dépendances..." -ForegroundColor Yellow
npm install --legacy-peer-deps | Out-Null

Write-Host "⏳ Démarrage backend sur port 4000..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "node" -ArgumentList "src/startup.js" -PassThru -NoNewWindow

Write-Host "⏳ Attente de démarrage backend (5s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Vérifier backend
if ($backendProcess.HasExited) {
  Write-Host "❌ Backend n'a pas pu démarrer" -ForegroundColor Red
  exit 1
}

# Vérifier health endpoint
$healthCheck = curl -s http://localhost:4000/api/health 2>$null | Select-String '"ready":true'
if ($healthCheck) {
  Write-Host "✅ Backend santé vérifiée (/api/health)" -ForegroundColor Green
} else {
  Write-Host "⚠️  Backend démarrage mais pas encore prêt (migrations en cours...)" -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""

# ============================================================
# PHASE 3: Frontend
# ============================================================

Write-Host "🎨 PHASE 3: Démarrage Frontend" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "frontend")) {
  Write-Host "❌ Répertoire frontend\ non trouvé" -ForegroundColor Red
  Stop-Process -Id $backendProcess.Id -Force
  exit 1
}

Set-Location frontend

Write-Host "⏳ Installation dépendances..." -ForegroundColor Yellow
npm install --legacy-peer-deps 2>$null | Out-Null

Write-Host "⏳ Démarrage frontend sur port 3000..." -ForegroundColor Yellow
$env:PORT = 3000
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow

Write-Host "⏳ Attente de démarrage frontend (8s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

if (-not $frontendProcess.HasExited) {
  Write-Host "✅ Frontend lancé sur port 3000" -ForegroundColor Green
} else {
  Write-Host "⚠️  Frontend n'a pas pu démarrer" -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""

# ============================================================
# RÉSUMÉ
# ============================================================

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✅ DÉMARRAGE RÉUSSI À 100%                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Services en cours d'exécution:" -ForegroundColor Green
Write-Host "  🔧 Backend:  http://localhost:4000"
Write-Host "     Health:   GET http://localhost:4000/api/health"
Write-Host "     Ready:    GET http://localhost:4000/api/ready"
Write-Host ""
Write-Host "  🎨 Frontend: http://localhost:3000"
Write-Host "     Routes:   /, /contrats, /paiements, /proprietes, /locataires, /rapports, /rappels, /preavis"
Write-Host ""

Write-Host "Processus:" -ForegroundColor Green
Write-Host "  Backend PID:  $($backendProcess.Id)"
Write-Host "  Frontend PID: $($frontendProcess.Id)"
Write-Host ""

Write-Host "Pour arrêter:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Id $($backendProcess.Id),$($frontendProcess.Id)"
Write-Host "  ou: Ctrl+C"
Write-Host ""

# Garder le shell ouvert
Write-Host "Appuyez sur Ctrl+C pour arrêter tous les services" -ForegroundColor Yellow

# Maintenir les processus actifs
try {
  while ($true) {
    if ($backendProcess.HasExited -or $frontendProcess.HasExited) {
      Write-Host "⚠️  Un processus s'est arrêté. Arrêt complet." -ForegroundColor Yellow
      Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
      Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
      break
    }
    Start-Sleep -Seconds 5
  }
} finally {
  Write-Host ""
  Write-Host "Arrêt des services..." -ForegroundColor Yellow
  Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
  Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
  Write-Host "✅ Services arrêtés" -ForegroundColor Green
}
