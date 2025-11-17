# Kill any existing Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend in Window 1
Write-Host "🚀 Démarrage du Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\AKIG\backend; npm run dev" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 5

# Start Frontend in Window 2
Write-Host "🚀 Démarrage du Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\AKIG\frontend; `$env:BROWSER='none'; npm start" -WindowStyle Normal

Write-Host "✅ Serveurs en cours de démarrage..." -ForegroundColor Green
Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
