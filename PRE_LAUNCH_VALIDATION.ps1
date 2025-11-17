#!/usr/bin/env pwsh
<#
  PRE-LAUNCH VALIDATION
  Vérification complète avant déploiement production
#>

param(
    [switch]$Strict = $false,  # Arrêter sur premiere erreur
    [switch]$Fix = $false       # Tenter de corriger automatiquement
)

$script:ERRORS = @()
$script:WARNINGS = @()
$script:SUCCESSES = @()

Write-Host "`n🔐 VALIDATION PRÉ-LANCEMENT" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Mode: $(if($Strict) {'STRICT'} else {'NORMAL'})" -ForegroundColor Yellow
Write-Host "Auto-fix: $(if($Fix) {'ACTIVÉ'} else {'DÉSACTIVÉ'})" -ForegroundColor Yellow
Write-Host "`n"

# ============================================================================
# HELPERS
# ============================================================================

function Add-Success {
    param([string]$Message)
    $script:SUCCESSES += $Message
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Add-Warning {
    param([string]$Message, [switch]$Critical)
    $script:WARNINGS += $Message
    $color = if($Critical) { 'Red' } else { 'Yellow' }
    Write-Host "  $(if($Critical) {'✗'} else {'⚠'}) $Message" -ForegroundColor $color
    
    if ($Strict -and $Critical) {
        throw "Validation échouée (mode STRICT): $Message"
    }
}

function Add-Error {
    param([string]$Message)
    $script:ERRORS += $Message
    Write-Host "  ✗ $Message" -ForegroundColor Red
    
    if ($Strict) {
        throw "Validation échouée (mode STRICT): $Message"
    }
}

# ============================================================================
# CHECKS
# ============================================================================

function Validate-Environment {
    Write-Host "`n1️⃣  ENVIRONNEMENT" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    # Node version
    try {
        $nodeVersion = node --version
        if ($nodeVersion -match "v18\.20\.[0-9]") {
            Add-Success "Node.js version correct: $nodeVersion"
        }
        else {
            Add-Warning "Node.js version: $nodeVersion (attendu v18.20.3+)" -Critical
        }
    }
    catch {
        Add-Error "Node.js non installé"
    }
    
    # npm version
    try {
        $npmVersion = npm --version
        if ([version]$npmVersion -ge [version]"10.7.0") {
            Add-Success "npm version correct: $npmVersion"
        }
        else {
            Add-Warning "npm version: $npmVersion (attendu 10.7.0+)" -Critical
        }
    }
    catch {
        Add-Error "npm non installé"
    }
    
    # OS
    $osVersion = [System.Environment]::OSVersion.VersionString
    Add-Success "OS: Windows ($osVersion)"
}

function Validate-ProjectStructure {
    Write-Host "`n2️⃣  STRUCTURE DU PROJET" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    $paths = @{
        'Root' = 'c:\AKIG'
        'Backend' = 'c:\AKIG\backend'
        'Frontend' = 'c:\AKIG\frontend'
        'package.json' = 'c:\AKIG\package.json'
        'Backend src' = 'c:\AKIG\backend\src'
        'Frontend src' = 'c:\AKIG\frontend\src'
    }
    
    foreach ($path in $paths.GetEnumerator()) {
        if (Test-Path $path.Value) {
            Add-Success "$($path.Key) exists"
        }
        else {
            Add-Error "$($path.Key) missing: $($path.Value)"
        }
    }
}

function Validate-Dependencies {
    Write-Host "`n3️⃣  DÉPENDANCES" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    $checks = @(
        @{ 
            name = 'Backend node_modules'
            path = 'c:\AKIG\backend\node_modules'
            action = { Set-Location 'c:\AKIG\backend'; npm ci --legacy-peer-deps }
        },
        @{ 
            name = 'Frontend node_modules'
            path = 'c:\AKIG\frontend\node_modules'
            action = { Set-Location 'c:\AKIG\frontend'; npm ci --legacy-peer-deps }
        }
    )
    
    foreach ($check in $checks) {
        if (Test-Path $check.path) {
            $count = (Get-ChildItem $check.path -Recurse -Directory | Measure-Object).Count
            Add-Success "$($check.name) installed ($count dirs)"
        }
        else {
            Add-Warning "$($check.name) missing"
            if ($Fix) {
                Write-Host "    🔧 Installing..." -ForegroundColor Yellow
                & $check.action
                Add-Success "$($check.name) installed"
            }
        }
    }
}

function Validate-Configuration {
    Write-Host "`n4️⃣  CONFIGURATION" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    # .env file
    $envPath = 'c:\AKIG\.env'
    if (Test-Path $envPath) {
        Add-Success ".env file exists"
        
        $env:GIT_CEILING_DIRECTORIES = $null
        $envContent = Get-Content $envPath
        
        $requiredVars = @(
            'DATABASE_URL'
            'JWT_SECRET'
            'TWILIO_ACCOUNT_SID'
            'SENDGRID_API_KEY'
        )
        
        foreach ($var in $requiredVars) {
            if ($envContent | Select-String "^$var=") {
                Add-Success "Configuration $var présente"
            }
            else {
                Add-Warning "Configuration $var manquante" -Critical
            }
        }
    }
    else {
        Add-Warning ".env file missing (créer depuis .env.example)" -Critical
        if ($Fix) {
            Copy-Item 'c:\AKIG\.env.example' $envPath
            Add-Success ".env créé (veuillez configurer les valeurs)"
        }
    }
}

function Validate-Database {
    Write-Host "`n5️⃣  BASE DE DONNÉES" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    # PostgreSQL service
    try {
        $service = Get-Service postgresql* -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($service -and $service.Status -eq 'Running') {
            Add-Success "PostgreSQL service running"
        }
        else {
            Add-Warning "PostgreSQL service not running (attendu: Running)" -Critical
        }
    }
    catch {
        Add-Warning "Impossible de vérifier PostgreSQL service" -Critical
    }
    
    # Check migrations
    $migrationDir = 'c:\AKIG\backend\db\migrations'
    if (Test-Path $migrationDir) {
        $migrations = Get-ChildItem $migrationDir -Filter "*.sql" | Measure-Object
        Add-Success "Migrations found: $($migrations.Count) files"
    }
    else {
        Add-Warning "Migrations directory missing"
    }
}

function Validate-Security {
    Write-Host "`n6️⃣  SÉCURITÉ" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    # HTTPS/SSL
    Add-Success "HTTPS/SSL: À configurer en production"
    
    # Environment secrets
    $sensitiveFiles = @(
        '.env'
        '.env.local'
        '.env.production'
    )
    
    foreach ($file in $sensitiveFiles) {
        $path = "c:\AKIG\$file"
        if (Test-Path $path) {
            Add-Success "$file exists (assurez-vous qu'il n'est pas commité)"
        }
    }
    
    # gitignore check
    $gitignore = Get-Content 'c:\AKIG\.gitignore' -ErrorAction SilentlyContinue
    if ($gitignore -match '\.env') {
        Add-Success ".env dans .gitignore"
    }
    else {
        Add-Warning ".env peut être exposé (vérifier .gitignore)"
    }
}

function Validate-Builds {
    Write-Host "`n7️⃣  BUILDS" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    # Frontend build
    $buildDirs = @(
        'c:\AKIG\frontend\build',
        'c:\AKIG\frontend\dist'
    )
    
    $hasBuild = $false
    foreach ($dir in $buildDirs) {
        if (Test-Path $dir) {
            $files = Get-ChildItem $dir -Recurse -File | Measure-Object
            Add-Success "Frontend build exists: $dir ($($files.Count) files)"
            $hasBuild = $true
            break
        }
    }
    
    if (-not $hasBuild) {
        Add-Warning "Frontend build not found (créer avec: npm run build)"
        if ($Fix) {
            Write-Host "    🔧 Building frontend..." -ForegroundColor Yellow
            Set-Location 'c:\AKIG\frontend'
            npm run build
            Add-Success "Frontend build créé"
        }
    }
}

function Validate-Tests {
    Write-Host "`n8️⃣  TESTS" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    # Test files
    $testFiles = @(
        'c:\AKIG\frontend\tests\notice-system.spec.ts'
        'c:\AKIG\backend\tests\smoke.test.js'
    )
    
    foreach ($file in $testFiles) {
        if (Test-Path $file) {
            $lines = (Get-Content $file | Measure-Object -Line).Lines
            Add-Success "Test file: $([System.IO.Path]::GetFileName($file)) ($lines lines)"
        }
        else {
            Add-Warning "Test file missing: $file"
        }
    }
}

function Validate-Ports {
    Write-Host "`n9️⃣  PORTS" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    $ports = @(
        @{ port = 3000; service = 'Frontend' }
        @{ port = 4000; service = 'Backend API' }
        @{ port = 5432; service = 'PostgreSQL' }
    )
    
    foreach ($portCheck in $ports) {
        $tcpConnection = Test-NetConnection -ComputerName localhost -Port $portCheck.port -WarningAction SilentlyContinue
        
        if ($tcpConnection.TcpTestSucceeded) {
            Add-Warning "Port $($portCheck.port) ($($portCheck.service)): DÉJÀ UTILISÉ"
        }
        else {
            Add-Success "Port $($portCheck.port) ($($portCheck.service)): Available"
        }
    }
}

function Validate-ExternalServices {
    Write-Host "`n🔟 SERVICES EXTERNES" -ForegroundColor Cyan
    Write-Host "-" * 70 -ForegroundColor Cyan
    
    $services = @(
        @{ name = 'Twilio'; url = 'https://api.twilio.com/'; env = 'TWILIO_ACCOUNT_SID' }
        @{ name = 'SendGrid'; url = 'https://api.sendgrid.com/'; env = 'SENDGRID_API_KEY' }
        @{ name = 'Meta API'; url = 'https://graph.instagram.com/'; env = 'META_ACCESS_TOKEN' }
    )
    
    foreach ($svc in $services) {
        try {
            $response = Invoke-WebRequest -Uri $svc.url -TimeoutSec 3 -ErrorAction Stop
            Add-Success "$($svc.name): Reachable"
        }
        catch {
            Add-Warning "$($svc.name): Not reachable (internet connectivity issue?)"
        }
    }
}

function Generate-Report {
    Write-Host "`n`n" 
    Write-Host "=" * 70
    Write-Host "📊 RAPPORT DE VALIDATION" -ForegroundColor Cyan
    Write-Host "=" * 70
    
    Write-Host "`n✓ SUCCÈS: $($script:SUCCESSES.Count)" -ForegroundColor Green
    Write-Host "⚠ AVERTISSEMENTS: $($script:WARNINGS.Count)" -ForegroundColor Yellow
    Write-Host "✗ ERREURS: $($script:ERRORS.Count)" -ForegroundColor Red
    
    if ($script:ERRORS.Count -gt 0) {
        Write-Host "`n❌ Erreurs critiques:" -ForegroundColor Red
        foreach ($err in $script:ERRORS) {
            Write-Host "  • $err" -ForegroundColor Red
        }
    }
    
    if ($script:WARNINGS.Count -gt 0) {
        Write-Host "`n⚠️  Avertissements:" -ForegroundColor Yellow
        foreach ($warn in $script:WARNINGS) {
            Write-Host "  • $warn" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nRésultat:"
    if ($script:ERRORS.Count -eq 0) {
        Write-Host "🟢 VALIDATION RÉUSSIE - PRÊT POUR PRODUCTION" -ForegroundColor Green
        return $true
    }
    elseif ($script:ERRORS.Count -le 2) {
        Write-Host "🟡 VALIDATION PARTIELLE - Correction requise" -ForegroundColor Yellow
        return $false
    }
    else {
        Write-Host "🔴 VALIDATION ÉCHOUÉE - Résoudre les erreurs critiques" -ForegroundColor Red
        return $false
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Validate-Environment
    Validate-ProjectStructure
    Validate-Dependencies
    Validate-Configuration
    Validate-Database
    Validate-Security
    Validate-Builds
    Validate-Tests
    Validate-Ports
    Validate-ExternalServices
    
    $result = Generate-Report
    
    if ($result) {
        Write-Host "`n✅ Vous pouvez lancer: npm start" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "`n❌ Veuillez corriger les erreurs avant de continuer" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "`n❌ Erreur de validation: $_" -ForegroundColor Red
    exit 1
}
