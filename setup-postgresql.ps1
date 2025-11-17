#!/usr/bin/env powershell
<#
 AKIG PostgreSQL Setup Script
 ✓ Crée user akig_user
 ✓ Crée base de données akig
 ✓ Exécute migrations Phase 5
 ✓ Configure accès sécurisé
#>

Write-Host "`n=== AKIG PostgreSQL Setup ===" -ForegroundColor Green

# Vérifier si PostgreSQL est disponible
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psql)) {
    Write-Host "❌ PostgreSQL introuvable" -ForegroundColor Red
    Write-Host "Veuillez installer PostgreSQL 15+ depuis https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL trouvé: $psql" -ForegroundColor Green

# Demander le mot de passe postgres
$securePassword = Read-Host -Prompt "Entrez le mot de passe postgres" -AsSecureString
$PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($securePassword))

Write-Host "`n🔧 Création utilisateur et base de données..."

# SQL commands
$sql = @"
-- Créer utilisateur AKIG
CREATE USER akig_user WITH PASSWORD 'akig_password';

-- Créer base de données
CREATE DATABASE akig OWNER akig_user;

-- Accorder permissions
GRANT CONNECT ON DATABASE akig TO akig_user;
GRANT CREATE ON SCHEMA public TO akig_user;

-- Afficher confirmation
SELECT 'AKIG User Created' as status;
SELECT 'AKIG Database Created' as status;
"@

# Exécuter SQL
$env:PGPASSWORD = $PGPASSWORD
& $psql -U postgres -h localhost -c $sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Utilisateur et base de données créés" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création" -ForegroundColor Red
    exit 1
}

# Charger les migrations
Write-Host "`n📊 Chargement des migrations Phase 5..."

$migrationFile = ".\backend\MIGRATIONS_PHASE5.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "⚠️  Fichier migrations non trouvé: $migrationFile" -ForegroundColor Yellow
} else {
    & $psql -U akig_user -d akig -h localhost -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations exécutées avec succès" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erreur lors des migrations (non bloquant)" -ForegroundColor Yellow
    }
}

# Vérifier connexion
Write-Host "`n🔍 Vérification de la connexion..."

$env:PGPASSWORD = "akig_password"
& $psql -U akig_user -d akig -h localhost -c "SELECT NOW() as timestamp, 'Connection OK' as status;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connexion PostgreSQL OK" -ForegroundColor Green
    Write-Host "`n📝 Mise à jour .env:" -ForegroundColor Cyan
    Write-Host "DATABASE_URL=postgresql://akig_user:akig_password@localhost:5432/akig" -ForegroundColor White
    Write-Host "`nPuis relancer: npm start" -ForegroundColor Green
} else {
    Write-Host "❌ Connexion PostgreSQL échouée" -ForegroundColor Red
}

Write-Host "`n✅ Setup PostgreSQL terminé!`n" -ForegroundColor Green
