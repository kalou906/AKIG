#!/usr/bin/env pwsh
# ============================================================
# AKIG Environment Configuration Helper
# Facilite la transition entre développement et production
# ============================================================

param(
    [string]$Mode = "development",  # development ou production
    [string]$DbHost = "localhost",
    [string]$DbPassword = "akig_password",
    [string]$DbName = "akig_production",
    [string]$JwtSecret = "",
    [string]$CorsDomain = "http://localhost:3000"
)

$backendDir = "c:\AKIG\backend"
$envFile = "$backendDir\.env.development"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   AKIG Environment Configuration Helper                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Générer un JWT_SECRET sécurisé si non fourni
# ============================================================

if (-not $JwtSecret) {
    Write-Host "📝 Génération d'un JWT_SECRET sécurisé..." -ForegroundColor Yellow
    $bytes = [System.Text.Encoding]::UTF8.GetBytes((1..64 | ForEach-Object { 
        $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_+-="
        $chars[(Get-Random -Maximum $chars.Length)]
    }) -join '')
    $JwtSecret = [Convert]::ToBase64String($bytes).Substring(0, 64)
    Write-Host "✓ JWT_SECRET généré: $($JwtSecret.Substring(0, 20))..." -ForegroundColor Green
}

# ============================================================
# Mode Développement
# ============================================================

if ($Mode -eq "development") {
    Write-Host "`n🔧 Configuration en mode DÉVELOPPEMENT" -ForegroundColor Blue
    
    $envContent = @"
# ================================================
# AKIG BACKEND - ENVIRONMENT CONFIGURATION (DEV)
# ================================================

# ============ APPLICATION ============
NODE_ENV=development
PORT=4000
API_VERSION=1.0.0

# ============ DATABASE ============
DATABASE_URL=postgresql://akig:$DbPassword@$DbHost`:5432/$DbName
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000

# ============ AUTHENTICATION ============
JWT_SECRET=$JwtSecret
JWT_EXPIRY=24h

# ============ LOGGING ============
LOG_LEVEL=debug
LOG_FILE_ENABLED=true

# ============ CORS & SECURITY ============
CORS_ORIGIN=$CorsDomain

# ============ FEATURES ============
FEATURE_CSV_IMPORT=true
FEATURE_PDF_EXPORT=true
FEATURE_AUDIT_LOGGING=true

# ============ TIMEZONE ============
TZ=UTC

# ============ OPTIONAL ============
REDIS_ENABLED=false
SMTP_ENABLED=false
"@

    Write-Host "   • Port: 4000" -ForegroundColor Gray
    Write-Host "   • Database: PostgreSQL (localhost:5432)" -ForegroundColor Gray
    Write-Host "   • CORS: $CorsDomain" -ForegroundColor Gray
    Write-Host "   • Log Level: DEBUG" -ForegroundColor Gray
}

# ============================================================
# Mode Production
# ============================================================

elseif ($Mode -eq "production") {
    Write-Host "`n🚀 Configuration en mode PRODUCTION" -ForegroundColor Green
    
    Write-Host "`n   ⚠️  ATTENTION - CONFIGURATION REQUISE:" -ForegroundColor Yellow
    Write-Host "   • DB_HOST: $DbHost" -ForegroundColor Cyan
    Write-Host "   • CORS_DOMAIN: $CorsDomain" -ForegroundColor Cyan
    Write-Host "   • DB_PASSWORD: ${DbPassword:0:3}***" -ForegroundColor Cyan
    
    $envContent = @"
# ================================================
# AKIG BACKEND - ENVIRONMENT CONFIGURATION (PROD)
# ================================================

# ============ APPLICATION ============
NODE_ENV=production
PORT=4000
API_VERSION=1.0.0

# ============ DATABASE ============
DATABASE_URL=postgresql://akig:$DbPassword@$DbHost`:5432/$DbName
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_TIMEOUT=30000

# ============ AUTHENTICATION ============
JWT_SECRET=$JwtSecret
JWT_EXPIRY=7d

# ============ LOGGING ============
LOG_LEVEL=info
LOG_FILE_ENABLED=true

# ============ CORS & SECURITY ============
CORS_ORIGIN=$CorsDomain

# ============ FEATURES ============
FEATURE_CSV_IMPORT=true
FEATURE_PDF_EXPORT=true
FEATURE_AUDIT_LOGGING=true

# ============ TIMEZONE ============
TZ=UTC

# ============ OPTIONAL ============
REDIS_ENABLED=false
REDIS_HOST=redis
REDIS_PORT=6379

SMTP_ENABLED=false
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
"@

    Write-Host "   • Port: 4000" -ForegroundColor Gray
    Write-Host "   • Database: PostgreSQL (${DbHost}:5432)" -ForegroundColor Gray
    Write-Host "   • CORS: $CorsDomain" -ForegroundColor Gray
    Write-Host "   • Log Level: INFO" -ForegroundColor Gray
    Write-Host "   • JWT Expiry: 7 jours" -ForegroundColor Gray
}

else {
    Write-Host "❌ Mode invalide: $Mode" -ForegroundColor Red
    Write-Host "   Utilisez: -Mode development ou -Mode production" -ForegroundColor Red
    exit 1
}

# ============================================================
# Écrire le fichier .env
# ============================================================

Write-Host "`n📝 Écriture du fichier .env.development..." -ForegroundColor Blue

try {
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Host "✅ Fichier créé avec succès!" -ForegroundColor Green
    Write-Host "   Chemin: $envFile" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Erreur lors de l'écriture: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================================
# Afficher le résumé
# ============================================================

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   CONFIGURATION APPLIQUÉE ✅                                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📊 Résumé:" -ForegroundColor Blue
Write-Host "   Mode: $Mode" -ForegroundColor Gray
Write-Host "   Database: postgresql://akig:***@$DbHost`:5432/$DbName" -ForegroundColor Gray
Write-Host "   JWT Secret: ${JwtSecret.Substring(0, 20)}... (${($JwtSecret.Length)} chars)" -ForegroundColor Gray
Write-Host "   CORS Origin: $CorsDomain" -ForegroundColor Gray
Write-Host "   Fichier: $envFile" -ForegroundColor Gray

# ============================================================
# Vérification
# ============================================================

Write-Host "`n🔍 Pour vérifier la configuration:" -ForegroundColor Blue
Write-Host "   cd c:\AKIG\backend" -ForegroundColor Gray
Write-Host "   node verify-environment.js" -ForegroundColor Gray

# ============================================================
# Prochaines étapes
# ============================================================

Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Yellow

if ($Mode -eq "development") {
    Write-Host "   1. Assurez-vous que PostgreSQL est installé" -ForegroundColor Gray
    Write-Host "   2. Exécutez: node verify-environment.js" -ForegroundColor Gray
    Write-Host "   3. Testez: npm start" -ForegroundColor Gray
}
else {
    Write-Host "   1. ⚠️  Vérifiez votre PostgreSQL distant (credentials)" -ForegroundColor Red
    Write-Host "   2. Exécutez: node verify-environment.js" -ForegroundColor Gray
    Write-Host "   3. Testez la connexion en production" -ForegroundColor Gray
    Write-Host "   4. Déployez le frontend: npm run build" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Configuration terminée!" -ForegroundColor Green
Write-Host ""
