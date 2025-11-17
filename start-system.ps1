# Script de démarrage du système AKIG
# Démarre le backend API et le frontend en arrière-plan

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 AKIG Startup System           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Arrêter les processus existants
Write-Host "🛑 Arrêt des processus existants..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name npm -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Démarrer le backend
Write-Host "🔧 Démarrage du backend API (port 4000)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "C:\AKIG\backend\src\index.js" -WorkingDirectory "C:\AKIG\backend" -WindowStyle Minimized -ErrorAction SilentlyContinue

# Démarrer le frontend
Write-Host "⚛️  Démarrage du frontend (port 3000)..." -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "C:\AKIG\frontend" -WindowStyle Minimized -ErrorAction SilentlyContinue

Start-Sleep -Seconds 8

# Vérifier les services
Write-Host "`n✅ Services lancés!" -ForegroundColor Green
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🌐 Frontend:     http://localhost:3000" -ForegroundColor Green
Write-Host "🔌 Backend API:  http://localhost:4000" -ForegroundColor Green
Write-Host "💚 Health:       http://localhost:4000/api/health" -ForegroundColor Green
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n💡 Conseil: Les services mettent 15-30 secondes pour démarrer complètement" -ForegroundColor Yellow
Write-Host "   Veuillez rafraîchir le navigateur si nécessaire (F5)" -ForegroundColor Yellow
Write-Host "`n"
