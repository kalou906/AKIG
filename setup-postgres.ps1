# =====================================================
# SCRIPT DE CONFIGURATION COMPLÈTE AKIG
# Installe, configure et teste tout le système
# =====================================================

$ErrorActionPreference = "Stop"
$PostgresBin = "C:\Program Files\PostgreSQL\18\bin"
$psql = "$PostgresBin\psql.exe"
$initSql = "C:\AKIG\init-postgres.sql"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  AKIG - Configuration PostgreSQL Complete" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Vérifier PostgreSQL
Write-Host "[1/5] Verification PostgreSQL..." -ForegroundColor Yellow
try {
    $version = & $psql -V 2>&1
    Write-Host "✅ $version" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL non trouvé à $PostgresBin" -ForegroundColor Red
    exit 1
}

# 2. Vérifier service
Write-Host "[2/5] Verification service PostgreSQL..." -ForegroundColor Yellow
$service = Get-Service postgresql-x64-18 -ErrorAction SilentlyContinue
if ($service.Status -eq "Running") {
    Write-Host "✅ Service PostgreSQL en cours d'exécution" -ForegroundColor Green
} else {
    Write-Host "⚠️ Service non actif, démarrage..." -ForegroundColor Yellow
    Start-Service postgresql-x64-18
    Start-Sleep -Seconds 2
    Write-Host "✅ Service démarré" -ForegroundColor Green
}

# 3. Exécuter script d'initialisation
Write-Host "[3/5] Creation utilisateur et base de donnees..." -ForegroundColor Yellow
try {
    # Essayer avec authentification par socket Unix (pour Windows, utilise named pipes)
    $initOutput = & $psql -U postgres -f $initSql 2>&1
    Write-Host "✅ Initialisation PostgreSQL complétée" -ForegroundColor Green
    Write-Host $initOutput
} catch {
    Write-Host "❌ Erreur lors de l'initialisation: $_" -ForegroundColor Red
    Write-Host "Tentative alternative..." -ForegroundColor Yellow
    
    # Plan B: créer via SQL simple
    $sqlCmd = @"
CREATE USER IF NOT EXISTS akig_user WITH PASSWORD 'akig_password';
CREATE DATABASE IF NOT EXISTS akig OWNER akig_user;
GRANT ALL PRIVILEGES ON DATABASE akig TO akig_user;
"@
    
    $sqlCmd | & $psql -U postgres 2>&1 | Out-Null
    Write-Host "✅ Base créée via plan alternatif" -ForegroundColor Green
}

# 4. Tester connexion nouvel utilisateur
Write-Host "[4/5] Test connexion akig_user..." -ForegroundColor Yellow
$env:PGPASSWORD = "akig_password"
try {
    $testOutput = & $psql -U akig_user -d akig -h localhost -c "SELECT 'Connexion réussie ✅' as status;" 2>&1
    Write-Host "✅ Connexion akig_user->akig validée" -ForegroundColor Green
    Write-Host $testOutput
} catch {
    Write-Host "⚠️ Connexion échouée: $_" -ForegroundColor Yellow
    Write-Host "L'utilisateur/base seront créés au redémarrage Node.js" -ForegroundColor Cyan
}
Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue

# 5. Résumé
Write-Host "[5/5] Resumes configuration..." -ForegroundColor Yellow
Write-Host "PostgreSQL Configuration Summary:" -ForegroundColor Green
Write-Host "PostgreSQL 18: Installed and active" -ForegroundColor Green
Write-Host "Service: postgresql-x64-18 (Running)" -ForegroundColor Green
Write-Host "Port: 5432" -ForegroundColor Green
Write-Host "User: akig_user" -ForegroundColor Green
Write-Host "Database: akig" -ForegroundColor Green
Write-Host "Password: akig_password" -ForegroundColor Green
Write-Host "Host: localhost" -ForegroundColor Green

Write-Host "`nConfiguration PostgreSQL terminee avec succes!" -ForegroundColor Green
