# 🚀 AKIG - Lancement Complet (Mode Docker)
# Orchestre Postgres 15 → Backend API → Frontend React

param([switch]$Down, [switch]$Help)

$Green = @{ ForegroundColor = "Green" }
$Yellow = @{ ForegroundColor = "Yellow" }
$Red = @{ ForegroundColor = "Red" }
$Cyan = @{ ForegroundColor = "Cyan" }

function Show-Banner {
    Clear-Host
    Write-Host @Cyan @"
    
    ╔══════════════════════════════════════════════════════════╗
    ║          🚀 AKIG - Lancement Complet (Docker)            ║
    ║                                                          ║
    ║  Infrastructure:                                         ║
    ║  🐳 Postgres 15 • 🔌 Backend API • ⚛️  Frontend React      ║
    ║                                                          ║
    ║  Configuration: .env.docker                              ║
    ║  Accès: http://localhost:3000                            ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    
"@
}

function Test-Docker {
    try {
        $version = docker --version
        Write-Host "✅ Docker trouvé: $version" @Green
        return $true
    } catch {
        Write-Host "❌ Docker n'est pas accessible" @Red
        Write-Host "   Installez Docker Desktop: https://www.docker.com/products/docker-desktop" @Yellow
        return $false
    }
}

function Test-EnvFile {
    if (Test-Path ".env.docker") {
        Write-Host "✅ Configuration .env.docker présente" @Green
        return $true
    } else {
        Write-Host "❌ Fichier .env.docker manquant" @Red
        return $false
    }
}

Show-Banner

if ($Help) {
    Write-Host "Usage: powershell LAUNCH.ps1 [-Down]" @Yellow
    Write-Host ""
    Write-Host "  -Down  : Arrête et nettoie la stack Docker" @Yellow
    exit 0
}

if ($Down) {
    Write-Host "🛑 Arrêt de la stack..." @Yellow
    docker compose down --remove-orphans
    Write-Host "✅ Stack arrêtée" @Green
    exit 0
}

Write-Host "`n📋 Vérifications..." @Cyan
if (-not (Test-Docker)) { exit 1 }
if (-not (Test-EnvFile)) { exit 1 }

Write-Host "`n� Lancement Docker Compose..." @Cyan
Write-Host "   Cette première fois peut prendre 2-3 minutes..." @Yellow
Write-Host ""

docker compose up --build
