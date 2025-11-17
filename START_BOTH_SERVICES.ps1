# ====================================================================
# AKIG - Lanceur des deux services (Backend + Frontend)
# ====================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🚀 AKIG - Lancement des Services 🚀" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Arrêter les anciens processus
Write-Host "⏹️  Arrêt des anciens processus..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Start-Sleep -Seconds 2

# Lancer le Backend en arrière-plan dans un nouveau terminal
Write-Host "`n✅ Lancement du BACKEND (Port 4000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'C:\AKIG\backend'; Write-Host 'Backend démarrage...' -ForegroundColor Cyan; node simple-server.js`"" -WindowStyle Normal

# Attendre un peu
Start-Sleep -Seconds 2

# Lancer le Frontend en arrière-plan dans un nouveau terminal
Write-Host "✅ Lancement du FRONTEND (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'C:\AKIG\akig-ultimate'; Write-Host 'Frontend démarrage...' -ForegroundColor Green; npm run dev`"" -WindowStyle Normal

# Vérifier après 5 secondes
Start-Sleep -Seconds 5

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ Les services devraient tourner!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🌐 Frontend  : http://localhost:5173/" -ForegroundColor Yellow
Write-Host "📡 Backend   : http://localhost:4000/api/health" -ForegroundColor Yellow
Write-Host "`n(Attendez 3-5 secondes que Vite compile)" -ForegroundColor Cyan
