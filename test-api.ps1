# Test rapide des endpoints AKIG
# Pour Windows PowerShell
# Utilisation: .\test-api.ps1

$BASE_URL = "http://localhost:4000"
$API_URL = "$BASE_URL/api"

Write-Host "🧪 TEST API AKIG" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -Method Get -UseBasicParsing
    Write-Host "✅ Health Check réussi" -ForegroundColor Green
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ API non disponible" -ForegroundColor Red
}
Write-Host ""

# Test 2: Login (exemple)
Write-Host "Test 2: Login" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow
try {
    $loginData = @{
        email = "test@example.com"
        password = "password123"
    }
    $response = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body ($loginData | ConvertTo-Json) `
        -UseBasicParsing
    
    Write-Host "✅ Login réussi" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host ($json | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Erreur: Vérifiez email/password" -ForegroundColor Red
    Write-Host "Détail: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Récupérer les contrats
Write-Host "Test 3: Contrats" -ForegroundColor Yellow
Write-Host "----------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/contracts" -Method Get -UseBasicParsing
    Write-Host "✅ Contrats récupérés" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Nombre de contrats: $($json.data.Length)"
} catch {
    Write-Host "⚠️  Erreur: Vérifiez le token" -ForegroundColor Yellow
    Write-Host "Détail: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# Test 4: Récupérer les paiements
Write-Host "Test 4: Paiements" -ForegroundColor Yellow
Write-Host "-----------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/payments" -Method Get -UseBasicParsing
    Write-Host "✅ Paiements récupérés" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Nombre de paiements: $($json.data.Length)"
} catch {
    Write-Host "⚠️  Erreur: Vérifiez le token" -ForegroundColor Yellow
    Write-Host "Détail: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# Test 5: Récupérer les locataires
Write-Host "Test 5: Locataires" -ForegroundColor Yellow
Write-Host "------------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/tenants" -Method Get -UseBasicParsing
    Write-Host "✅ Locataires récupérés" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Nombre de locataires: $($json.data.Length)"
} catch {
    Write-Host "⚠️  Erreur: Vérifiez le token" -ForegroundColor Yellow
    Write-Host "Détail: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "✅ Tests terminés" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Cyan
Write-Host "- Les endpoints protégés nécessitent un token JWT" -ForegroundColor White
Write-Host "- Login d'abord pour obtenir le token" -ForegroundColor White
Write-Host "- Ajouter le header: Authorization: Bearer <token>" -ForegroundColor White
Write-Host ""

# Fonction utile pour les tests futurs
Write-Host "⚡ Fonction utile:" -ForegroundColor Yellow
Write-Host ""
Write-Host "function Test-AKIG-Endpoint {" -ForegroundColor Cyan
Write-Host "    param(" -ForegroundColor Cyan
Write-Host "        [string]\$Endpoint," -ForegroundColor Cyan
Write-Host "        [string]\$Method = 'Get'," -ForegroundColor Cyan
Write-Host "        [object]\$Body" -ForegroundColor Cyan
Write-Host "    )" -ForegroundColor Cyan
Write-Host "    try {" -ForegroundColor Cyan
Write-Host "        \$uri = '$API_URL/' + \$Endpoint" -ForegroundColor Cyan
Write-Host "        if (\$Body) {" -ForegroundColor Cyan
Write-Host "            Invoke-WebRequest -Uri \$uri -Method \$Method -Body (\$Body | ConvertTo-Json) -ContentType 'application/json'" -ForegroundColor Cyan
Write-Host "        } else {" -ForegroundColor Cyan
Write-Host "            Invoke-WebRequest -Uri \$uri -Method \$Method" -ForegroundColor Cyan
Write-Host "        }" -ForegroundColor Cyan
Write-Host "    } catch { Write-Host \"❌ Erreur: \$(\$_.Exception.Message)\" -ForegroundColor Red }" -ForegroundColor Cyan
Write-Host "}" -ForegroundColor Cyan
Write-Host ""
Write-Host "Utilisation: Test-AKIG-Endpoint -Endpoint 'payments' -Method Get" -ForegroundColor White
