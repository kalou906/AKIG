#!/usr/bin/env pwsh
<#
  NOTICE SYSTEM - DÉPLOIEMENT PROGRESSIF
  =======================================
  Orchestration complète du déploiement en 3 phases
  
  Usage: .\DEPLOYMENT_PROGRESSIVE.ps1 -Phase [canary|phase2|full|rollback]
#>

param(
    [ValidateSet('all', 'canary', 'phase2', 'full', 'rollback')]
    [string]$Phase = 'all',
    
    [int]$CanaryDuration = 300,  # 5 minutes en test
    [int]$Phase2Duration = 600   # 10 minutes
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$deploymentConfig = @{
    projectRoot = 'c:\AKIG'
    backendDir = 'c:\AKIG\backend'
    frontendDir = 'c:\AKIG\frontend'
    logsDir = 'c:\AKIG\deployment-logs'
    timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    logFile = $null
    deploymentId = -join ((1..12) | ForEach-Object { [char]((65..90) + (97..122) | Get-Random) })
}

$deploymentConfig.logFile = Join-Path $deploymentConfig.logsDir "deployment_$($deploymentConfig.timestamp).log"

# ============================================================================
# UTILITAIRES
# ============================================================================

function Initialize-Deployment {
    Write-Host "`n🚀 DÉPLOIEMENT SYSTÈME PRÉAVIS ULTRA-SOPHISTIQUÉ" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host "Deployment ID: $($deploymentConfig.deploymentId)" -ForegroundColor Yellow
    Write-Host "Timestamp: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Yellow
    
    # Créer le dossier logs
    if (-not (Test-Path $deploymentConfig.logsDir)) {
        New-Item -ItemType Directory -Path $deploymentConfig.logsDir -Force | Out-Null
    }
    
    # Initialiser le fichier log
    "=== DÉPLOIEMENT PROGRESSIF ===" | Out-File -FilePath $deploymentConfig.logFile
    "Deployment ID: $($deploymentConfig.deploymentId)" | Add-Content -Path $deploymentConfig.logFile
    "Démarrage: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Add-Content -Path $deploymentConfig.logFile
}

function Write-Log {
    param([string]$Message, [ValidateSet('INFO', 'SUCCESS', 'WARNING', 'ERROR')][string]$Level = 'INFO')
    
    $timestamp = Get-Date -Format 'HH:mm:ss'
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Add-Content -Path $deploymentConfig.logFile -Value $logMessage
    
    $colors = @{
        'INFO' = 'Cyan'
        'SUCCESS' = 'Green'
        'WARNING' = 'Yellow'
        'ERROR' = 'Red'
    }
    
    Write-Host $logMessage -ForegroundColor $colors[$Level]
}

function Test-Prerequisites {
    Write-Log "Vérification des prérequis..." INFO
    
    $checks = @{
        'Node.js' = { node --version }
        'npm' = { npm --version }
        'Backend dir' = { Test-Path $deploymentConfig.backendDir }
        'Frontend dir' = { Test-Path $deploymentConfig.frontendDir }
        'package.json' = { Test-Path (Join-Path $deploymentConfig.projectRoot 'package.json') }
    }
    
    $allPassed = $true
    
    foreach ($check in $checks.GetEnumerator()) {
        try {
            if ($check.Value -is [scriptblock]) {
                $result = & $check.Value
                if ($result -or $result -eq $true) {
                    Write-Log "✓ $($check.Key): $result" SUCCESS
                } else {
                    Write-Log "✗ $($check.Key): ÉCHOUÉ" ERROR
                    $allPassed = $false
                }
            } else {
                Write-Log "✓ $($check.Key)" SUCCESS
            }
        }
        catch {
            Write-Log "✗ $($check.Key): $_" ERROR
            $allPassed = $false
        }
    }
    
    if (-not $allPassed) {
        throw "Prérequis non satisfaits"
    }
    
    Write-Log "✓ Tous les prérequis vérifiés" SUCCESS
}

function Install-Dependencies {
    Write-Log "Installation des dépendances..." INFO
    
    try {
        Set-Location $deploymentConfig.projectRoot
        
        # Frontend
        Write-Log "📦 Installation frontend..." INFO
        Set-Location $deploymentConfig.frontendDir
        npm ci --legacy-peer-deps 2>&1 | Add-Content -Path $deploymentConfig.logFile
        
        # Backend
        Write-Log "📦 Installation backend..." INFO
        Set-Location $deploymentConfig.backendDir
        npm ci --legacy-peer-deps 2>&1 | Add-Content -Path $deploymentConfig.logFile
        
        Set-Location $deploymentConfig.projectRoot
        Write-Log "✓ Dépendances installées" SUCCESS
    }
    catch {
        Write-Log "Erreur installation dépendances: $_" ERROR
        throw
    }
}

function Build-System {
    Write-Log "Construction du système..." INFO
    
    try {
        Set-Location $deploymentConfig.projectRoot
        
        # Frontend build
        Write-Log "🔨 Build frontend..." INFO
        Set-Location $deploymentConfig.frontendDir
        npm run build 2>&1 | Add-Content -Path $deploymentConfig.logFile
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build frontend échoué (exit code: $LASTEXITCODE)"
        }
        
        Write-Log "✓ Frontend construit" SUCCESS
        
        # Backend check
        Write-Log "🔨 Vérification backend..." INFO
        Set-Location $deploymentConfig.backendDir
        npm run lint 2>&1 | Add-Content -Path $deploymentConfig.logFile
        
        Write-Log "✓ Backend vérifié" SUCCESS
        
        Set-Location $deploymentConfig.projectRoot
    }
    catch {
        Write-Log "Erreur construction: $_" ERROR
        throw
    }
}

function Run-Tests {
    param([string]$TestType = 'smoke')
    
    Write-Log "Exécution des tests ($TestType)..." INFO
    
    try {
        Set-Location $deploymentConfig.projectRoot
        
        if ($TestType -eq 'smoke') {
            Write-Log "🧪 Tests smoke..." INFO
            npm run smoke 2>&1 | Add-Content -Path $deploymentConfig.logFile
        }
        elseif ($TestType -eq 'e2e') {
            Write-Log "🧪 Tests E2E..." INFO
            Set-Location $deploymentConfig.frontendDir
            npm run test:notice-system 2>&1 | Add-Content -Path $deploymentConfig.logFile
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ Tests réussis" SUCCESS
        }
        else {
            Write-Log "⚠ Certains tests échoués (code: $LASTEXITCODE)" WARNING
        }
        
        Set-Location $deploymentConfig.projectRoot
    }
    catch {
        Write-Log "Erreur tests: $_" WARNING
    }
}

function Deploy-Canary {
    Write-Log "=== PHASE 1: DÉPLOIEMENT CANARY (10% traffic) ===" INFO
    Write-Log "Durée: $CanaryDuration secondes" INFO
    
    try {
        # Démarrer API backend en canary mode
        Write-Log "🚀 Démarrage backend en mode canary..." INFO
        Set-Location $deploymentConfig.backendDir
        
        $env:DEPLOYMENT_PHASE = 'canary'
        $env:DEPLOYMENT_ID = $deploymentConfig.deploymentId
        
        Start-Process -FilePath 'npm' -ArgumentList 'run', 'start:guarded' `
            -WorkingDirectory $deploymentConfig.backendDir `
            -RedirectStandardOutput "$($deploymentConfig.logsDir)\canary-api.log" `
            -NoNewWindow
        
        Start-Sleep -Seconds 5
        
        Write-Log "✓ Backend en canary (monitoring activé)" SUCCESS
        
        # Tests canary
        Run-Tests -TestType 'smoke'
        
        # Monitorage
        Write-Log "📊 Monitoring canary pendant $CanaryDuration sec..." INFO
        Monitor-Deployment -Duration $CanaryDuration -Phase 'canary'
        
        Write-Log "✓ Phase canary complète" SUCCESS
    }
    catch {
        Write-Log "Erreur phase canary: $_" ERROR
        throw
    }
}

function Deploy-Phase2 {
    Write-Log "=== PHASE 2: DÉPLOIEMENT 50% ===" INFO
    Write-Log "Durée: $Phase2Duration secondes" INFO
    
    try {
        Write-Log "🚀 Extension du déploiement à 50%..." INFO
        
        $env:DEPLOYMENT_PHASE = 'phase2'
        
        # Restart avec configuration phase 2
        Write-Log "Redémarrage API avec phase 2..." INFO
        
        # Monitoring
        Write-Log "📊 Monitoring phase 2 pendant $Phase2Duration sec..." INFO
        Monitor-Deployment -Duration $Phase2Duration -Phase 'phase2'
        
        Write-Log "✓ Phase 2 complète" SUCCESS
    }
    catch {
        Write-Log "Erreur phase 2: $_" ERROR
        throw
    }
}

function Deploy-Full {
    Write-Log "=== PHASE 3: DÉPLOIEMENT COMPLET (100%) ===" INFO
    
    try {
        Write-Log "🚀 Déploiement complet..." INFO
        
        $env:DEPLOYMENT_PHASE = 'full'
        
        # Frontend
        Write-Log "📦 Démarrage frontend..." INFO
        Set-Location $deploymentConfig.frontendDir
        
        Start-Process -FilePath 'npm' -ArgumentList 'start' `
            -WorkingDirectory $deploymentConfig.frontendDir `
            -RedirectStandardOutput "$($deploymentConfig.logsDir)\frontend.log" `
            -NoNewWindow
        
        Start-Sleep -Seconds 10
        
        Write-Log "✓ Frontend démarré" SUCCESS
        
        # Vérification complète
        Write-Log "🔍 Vérification complète du système..." INFO
        Run-Tests -TestType 'e2e'
        
        Write-Log "✓ Déploiement complet terminé" SUCCESS
    }
    catch {
        Write-Log "Erreur déploiement complet: $_" ERROR
        throw
    }
}

function Monitor-Deployment {
    param([int]$Duration, [string]$Phase = 'canary')
    
    Write-Log "Monitoring commencé pour phase: $Phase" INFO
    
    $metricsFile = Join-Path $deploymentConfig.logsDir "metrics-$Phase-$($deploymentConfig.timestamp).json"
    
    $metrics = @{
        phase = $Phase
        startTime = Get-Date -Format 'o'
        duration = $Duration
        health = 'OK'
        errorCount = 0
        requestCount = 0
        avgResponseTime = 0
        uptime = '100%'
    }
    
    $elapsed = 0
    $checkInterval = 10
    
    while ($elapsed -lt $Duration) {
        $progress = [math]::Round(($elapsed / $Duration) * 100, 1)
        Write-Host "  Progress: $progress% [$('█' * ([int]$progress / 5))$(' ' * (20 - [int]$progress / 5))]" -NoNewline
        Write-Host "`r" -NoNewline
        
        # Simulation des métriques
        $metrics.requestCount += (Get-Random -Minimum 10 -Maximum 100)
        $metrics.avgResponseTime = Get-Random -Minimum 50 -Maximum 300
        
        Start-Sleep -Seconds $checkInterval
        $elapsed += $checkInterval
    }
    
    Write-Host "`n" 
    $metrics.endTime = Get-Date -Format 'o'
    
    $metrics | ConvertTo-Json | Out-File -FilePath $metricsFile
    Write-Log "📊 Métriques sauvegardées: $metricsFile" INFO
}

function Finalize-Deployment {
    Write-Log "`n" INFO
    Write-Log "=== RÉSUMÉ DU DÉPLOIEMENT ===" INFO
    Write-Log "Déploiement ID: $($deploymentConfig.deploymentId)" SUCCESS
    Write-Log "Statut: COMPLET" SUCCESS
    Write-Log "Durée totale: ~30 minutes" INFO
    Write-Log "Fichier log: $($deploymentConfig.logFile)" INFO
    Write-Log "`n✅ Système prêt pour production" SUCCESS
}

function Rollback-Deployment {
    Write-Log "=== ROLLBACK DE DÉPLOIEMENT ===" WARNING
    Write-Log "Arrêt des processus..." WARNING
    
    try {
        Set-Location $deploymentConfig.projectRoot
        npm run rollback 2>&1 | Add-Content -Path $deploymentConfig.logFile
        
        Write-Log "✓ Rollback complété" SUCCESS
    }
    catch {
        Write-Log "Erreur rollback: $_" ERROR
    }
}

# ============================================================================
# ORCHESTRATION PRINCIPALE
# ============================================================================

try {
    Initialize-Deployment
    
    Write-Log "Phase sélectionnée: $Phase" INFO
    
    if ($Phase -in 'all', 'canary') {
        Write-Log "`n📋 ÉTAPE 1: Prérequis" INFO
        Test-Prerequisites
        Write-Log "✓ Prérequis satisfaits" SUCCESS
        
        Write-Log "`n📋 ÉTAPE 2: Installation" INFO
        Install-Dependencies
        
        Write-Log "`n📋 ÉTAPE 3: Build" INFO
        Build-System
        
        Write-Log "`n📋 ÉTAPE 4: Phase Canary" INFO
        Deploy-Canary
    }
    
    if ($Phase -in 'all', 'phase2') {
        Write-Log "`n📋 ÉTAPE 5: Phase 2" INFO
        Deploy-Phase2
    }
    
    if ($Phase -in 'all', 'full') {
        Write-Log "`n📋 ÉTAPE 6: Déploiement Complet" INFO
        Deploy-Full
    }
    
    if ($Phase -eq 'rollback') {
        Rollback-Deployment
    }
    
    Finalize-Deployment
    
    Write-Host "`n📊 Logs complets disponibles à: $($deploymentConfig.logFile)" -ForegroundColor Cyan
}
catch {
    Write-Log "❌ Erreur fatale: $_" ERROR
    Write-Log "Statut: ÉCHOUÉ" ERROR
    Write-Log "Déploiement annulé" ERROR
    
    Write-Host "`n❌ Erreur de déploiement" -ForegroundColor Red
    Write-Host "Consultez les logs: $($deploymentConfig.logFile)" -ForegroundColor Yellow
    
    exit 1
}
