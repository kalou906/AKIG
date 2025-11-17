# Ultra Backend Environment Check - Faille #1
# Usage: powershell -ExecutionPolicy Bypass -File ultra-backend-env-check.ps1

$ErrorActionPreference = "Continue"
Write-Host "=== FAILLE #1: ENVIRONNEMENT BACKEND RÉEL ===" -ForegroundColor Cyan

$backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $backendProcess) {
    Write-Host "❌ Backend (node) non démarré - Démarrez: cd C:\AKIG\backend; npm start" -ForegroundColor Red
    exit 2
}
Write-Host "✅ Processus Node.js détecté PID=$($backendProcess.Id)" -ForegroundColor Green

$cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($backendProcess.Id)").CommandLine
Write-Host "--- CommandLine ---" -ForegroundColor Yellow
Write-Host $cmdLine -ForegroundColor Gray

# Rechercher variables DB
$patterns = @('DATABASE_URL', 'postgresql://', 'mysql://', '3306', '5432')
$foundFlags = 0
foreach ($p in $patterns) {
    if ($cmdLine -match [regex]::Escape($p)) { Write-Host "MATCH: $p" -ForegroundColor Green; $foundFlags++ }
}

# Inspecter fichiers .env réels
Write-Host "\n=== FICHIERS .ENV ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\AKIG\backend" -Filter ".env*" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Fichier: $($_.FullName)" -ForegroundColor Yellow
    (Get-Content $_.FullName) | Select-String -Pattern "DATABASE_URL|POSTGRES|MYSQL" | ForEach-Object { Write-Host "  $_" }
}

# Connexions actives vers PostgreSQL
Write-Host "\n=== CONNEXIONS ACTIVES 5432 ===" -ForegroundColor Cyan
$pgConns = netstat -ano | findstr "ESTABLISHED" | findstr "5432"
if ($pgConns) { Write-Host $pgConns -ForegroundColor Gray; Write-Host "✅ Connexion(s) active(s) PostgreSQL détectées" -ForegroundColor Green } else { Write-Host "❌ Aucune connexion active sur 5432" -ForegroundColor Red }

# Connexions éventuelles MySQL
Write-Host "\n=== CONNEXIONS ACTIVES 3306 (DOIT ÊTRE VIDE) ===" -ForegroundColor Cyan
$myConns = netstat -ano | findstr "ESTABLISHED" | findstr "3306"
if ($myConns) { Write-Host $myConns -ForegroundColor Red; Write-Host "❌ Backend utilise encore MySQL" -ForegroundColor Red; exit 2 } else { Write-Host "✅ Pas de connexion MySQL active" -ForegroundColor Green }

if ($foundFlags -eq 0) { Write-Host "❌ DATABASE_URL non visible dans la ligne de commande - vérifier injection env" -ForegroundColor Red; exit 1 }
Write-Host "\n✔ Faille #1 vérification terminée" -ForegroundColor Green
exit 0
