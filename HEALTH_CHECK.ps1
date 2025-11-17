#!/usr/bin/env pwsh
<#
  HEALTH CHECK - SYSTÈME PRÉAVIS
  ===============================
  Vérification rapide du statut de tous les services
#>

param(
    [int]$Port = 4000,
    [string]$ApiUrl = "http://localhost:$Port/api/health"
)

$healthStatus = @{
    timestamp = Get-Date -Format 'o'
    services = @{}
    overall = 'INITIALIZING'
}

Write-Host "`n🏥 VÉRIFICATION SANTÉ SYSTÈME PRÉAVIS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# ============================================================================
# CHECK BACKEND API
# ============================================================================

function Check-BackendAPI {
    Write-Host "`n🔵 Vérification Backend API..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $ApiUrl -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "  ✓ Backend OK (Status: $($response.StatusCode))" -ForegroundColor Green
            Write-Host "  ✓ Version: $(if($content.version) {$content.version} else {'N/A'})" -ForegroundColor Green
            Write-Host "  ✓ Uptime: $(if($content.uptime) {$content.uptime} else {'N/A'})" -ForegroundColor Green
            
            return @{
                status = 'OK'
                statusCode = $response.StatusCode
                uptime = $content.uptime
                version = $content.version
            }
        }
        else {
            Write-Host "  ✗ Backend non-réactif (Status: $($response.StatusCode))" -ForegroundColor Red
            return @{ status = 'ERROR'; statusCode = $response.StatusCode }
        }
    }
    catch {
        Write-Host "  ✗ Backend indisponible: $($_.Exception.Message)" -ForegroundColor Red
        return @{ status = 'OFFLINE' }
    }
}

# ============================================================================
# CHECK DATABASE
# ============================================================================

function Check-Database {
    Write-Host "`n🔵 Vérification Base de Données..." -ForegroundColor Yellow
    
    try {
        $dbUrl = "http://localhost:4000/api/health/db"
        $response = Invoke-WebRequest -Uri $dbUrl -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "  ✓ PostgreSQL connecté" -ForegroundColor Green
            Write-Host "  ✓ Pool: $(if($content.pool_size) {$content.pool_size} else {'N/A'}) connexions" -ForegroundColor Green
            Write-Host "  ✓ Tables: $(if($content.table_count) {$content.table_count} else {'N/A'})" -ForegroundColor Green
            
            return @{
                status = 'OK'
                poolSize = $content.pool_size
                tableCount = $content.table_count
            }
        }
        else {
            return @{ status = 'ERROR' }
        }
    }
    catch {
        Write-Host "  ⚠ Base de données non accessible" -ForegroundColor Yellow
        return @{ status = 'OFFLINE' }
    }
}

# ============================================================================
# CHECK FRONTEND BUILD
# ============================================================================

function Check-FrontendBuild {
    Write-Host "`n🔵 Vérification Build Frontend..." -ForegroundColor Yellow
    
    $buildDirs = @(
        'c:\AKIG\frontend\build',
        'c:\AKIG\frontend\dist',
        'c:\AKIG\frontend\.next'
    )
    
    foreach ($dir in $buildDirs) {
        if (Test-Path $dir) {
            $files = Get-ChildItem -Path $dir -Recurse -File | Measure-Object
            Write-Host "  ✓ Build exists: $dir" -ForegroundColor Green
            Write-Host "  ✓ Fichiers: $($files.Count)" -ForegroundColor Green
            
            return @{
                status = 'OK'
                buildDir = $dir
                fileCount = $files.Count
            }
        }
    }
    
    Write-Host "  ✗ Aucun build frontend trouvé" -ForegroundColor Yellow
    return @{ status = 'NOT_BUILT' }
}

# ============================================================================
# CHECK DEPENDENCIES
# ============================================================================

function Check-Dependencies {
    Write-Host "`n🔵 Vérification Dépendances..." -ForegroundColor Yellow
    
    $checks = @(
        @{ name = 'Node.js'; cmd = { node --version } },
        @{ name = 'npm'; cmd = { npm --version } },
        @{ name = 'PostgreSQL'; cmd = { & 'C:\Program Files\PostgreSQL\15\bin\psql.exe' --version -ErrorAction SilentlyContinue } }
    )
    
    $results = @{}
    
    foreach ($check in $checks) {
        try {
            $version = & $check.cmd
            Write-Host "  ✓ $($check.name): $version" -ForegroundColor Green
            $results[$check.name] = 'OK'
        }
        catch {
            Write-Host "  ✗ $($check.name): non trouvé" -ForegroundColor Red
            $results[$check.name] = 'MISSING'
        }
    }
    
    return $results
}

# ============================================================================
# CHECK EXTERNAL SERVICES
# ============================================================================

function Check-ExternalServices {
    Write-Host "`n🔵 Vérification Services Externes..." -ForegroundColor Yellow
    
    $services = @{
        'Twilio' = 'https://api.twilio.com/Accounts'
        'SendGrid' = 'https://api.sendgrid.com/v3/mail/validate'
        'Meta WhatsApp' = 'https://graph.instagram.com/me'
    }
    
    $results = @{}
    
    foreach ($service in $services.GetEnumerator()) {
        try {
            $response = Invoke-WebRequest -Uri $service.Value -TimeoutSec 3 -ErrorAction Stop
            # Just checking connectivity, not auth
            Write-Host "  ✓ $($service.Key): Accessible" -ForegroundColor Green
            $results[$service.Key] = 'REACHABLE'
        }
        catch {
            Write-Host "  ⚠ $($service.Key): Non accessible (configurer clés)" -ForegroundColor Yellow
            $results[$service.Key] = 'UNREACHABLE'
        }
    }
    
    return $results
}

# ============================================================================
# CHECK DEPLOYMENT STATUS
# ============================================================================

function Check-DeploymentStatus {
    Write-Host "`n🔵 Vérification Statut Déploiement..." -ForegroundColor Yellow
    
    $logDir = 'c:\AKIG\deployment-logs'
    
    if (Test-Path $logDir) {
        $latestLog = Get-ChildItem -Path $logDir -Filter 'deployment_*.log' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        if ($latestLog) {
            $content = Get-Content $latestLog -Tail 5
            Write-Host "  ✓ Dernier déploiement: $($latestLog.LastWriteTime)" -ForegroundColor Green
            
            if ($content -match 'COMPLET|SUCCESS') {
                Write-Host "  ✓ Statut: Dernière tentative réussie" -ForegroundColor Green
                return @{ status = 'SUCCESS' }
            }
            else {
                Write-Host "  ⚠ Statut: À vérifier" -ForegroundColor Yellow
                return @{ status = 'UNKNOWN' }
            }
        }
    }
    
    Write-Host "  ℹ Aucun déploiement antérieur trouvé" -ForegroundColor Cyan
    return @{ status = 'NEW' }
}

# ============================================================================
# GENERATE REPORT
# ============================================================================

function Generate-HealthReport {
    param($results)
    
    Write-Host "`n" 
    Write-Host "=" * 60
    Write-Host "📊 RÉSUMÉ SANTÉ DU SYSTÈME" -ForegroundColor Cyan
    Write-Host "=" * 60
    
    $statusCounts = @{
        'OK' = ($results.Values | Where-Object { $_ -eq 'OK' } | Measure-Object).Count
        'ERROR' = ($results.Values | Where-Object { $_ -eq 'ERROR' } | Measure-Object).Count
        'OFFLINE' = ($results.Values | Where-Object { $_ -eq 'OFFLINE' } | Measure-Object).Count
        'WARNING' = ($results.Values | Where-Object { $_ -eq 'WARNING' } | Measure-Object).Count
    }
    
    Write-Host "`n✓ Services OK: $($statusCounts['OK'])" -ForegroundColor Green
    Write-Host "✗ Erreurs: $($statusCounts['ERROR'])" -ForegroundColor Red
    Write-Host "⚠ Offline: $($statusCounts['OFFLINE'])" -ForegroundColor Yellow
    Write-Host "ℹ Avertissements: $($statusCounts['WARNING'])" -ForegroundColor Cyan
    
    # Déterminer le statut global
    if ($statusCounts['ERROR'] -gt 0) {
        Write-Host "`n🔴 STATUT GLOBAL: DÉGRADÉ" -ForegroundColor Red
    }
    elseif ($statusCounts['OFFLINE'] -gt 2) {
        Write-Host "`n🟡 STATUT GLOBAL: PARTIEL" -ForegroundColor Yellow
    }
    elseif ($statusCounts['OK'] -ge 3) {
        Write-Host "`n🟢 STATUT GLOBAL: SAIN" -ForegroundColor Green
    }
    else {
        Write-Host "`n⚪ STATUT GLOBAL: INITIALISATION" -ForegroundColor Cyan
    }
    
    Write-Host "`nTimestamp: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    $results = @{
        'Backend API' = Check-BackendAPI
        'Base de Données' = Check-Database
        'Frontend Build' = Check-FrontendBuild
        'Dépendances' = Check-Dependencies
        'Services Externes' = Check-ExternalServices
        'Déploiement' = Check-DeploymentStatus
    }
    
    Generate-HealthReport -results $results
    
    Write-Host "`n"
}
catch {
    Write-Host "`n❌ Erreur lors de la vérification: $_" -ForegroundColor Red
}
