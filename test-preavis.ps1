# Script de test du système Préavis

Write-Host "🚀 Démarrage du backend..." -ForegroundColor Cyan
cd c:\AKIG\backend
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden

Write-Host "⏳ Attente du démarrage du serveur (5s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "📝 Test 1: POST /api/preavis (Créer une notice)" -ForegroundColor Cyan
$headers = @{'Content-Type'='application/json'}
$body = @{
    contrat_id = 1
    locataire_id = 1
    date_emission = '2025-11-05'
    date_effet = '2025-12-05'
    motif = 'Test départ'
    type = 'DEPART'
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/preavis" -Method POST -Headers $headers -Body $body -ErrorAction SilentlyContinue
Write-Host "✅ Réponse:" -ForegroundColor Green
$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

Write-Host "`n📋 Test 2: GET /api/preavis (Lister les notices)" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/preavis" -Method GET -Headers $headers -ErrorAction SilentlyContinue
Write-Host "✅ Réponse:" -ForegroundColor Green
$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

Write-Host "`n🎯 Test 3: GET /api/preavis/status/dashboard (Alertes IA)" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/preavis/status/dashboard" -Method GET -Headers $headers -ErrorAction SilentlyContinue
Write-Host "✅ Réponse:" -ForegroundColor Green
$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

Write-Host "`n✅ Tests terminés!" -ForegroundColor Green
