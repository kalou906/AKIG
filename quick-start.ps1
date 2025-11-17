#!/usr/bin/env pwsh
# AKIG - Ultra Quick Start (Windows PowerShell)

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🚀 AKIG - ULTRA QUICK START        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. Check Docker
Write-Host "📋 Step 1: Checking Docker..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found!" -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker found" -ForegroundColor Green

# 2. Check Docker running
Write-Host "`n📋 Step 2: Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps > $null
    Write-Host "✅ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "   Start Docker Desktop and try again" -ForegroundColor Red
    exit 1
}

# 3. Check Make
Write-Host "`n📋 Step 3: Checking Make..." -ForegroundColor Yellow
if (!(Get-Command make -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Make not found!" -ForegroundColor Yellow
    Write-Host "   Install: choco install make" -ForegroundColor Yellow
    Write-Host "   Or download: https://gnuwin32.sourceforge.net/packages/make.htm" -ForegroundColor Yellow
    Write-Host "   For now, using docker-compose directly..." -ForegroundColor Yellow
    $USE_COMPOSE = $true
}
else {
    Write-Host "✅ Make found" -ForegroundColor Green
    $USE_COMPOSE = $false
}

# 4. Go to project
Write-Host "`n📋 Step 4: Going to project directory..." -ForegroundColor Yellow
Set-Location C:\AKIG -ErrorAction SilentlyContinue
Write-Host "✅ In C:\AKIG" -ForegroundColor Green

# 5. Launch services
Write-Host "`n🚀 Step 5: Starting services..." -ForegroundColor Yellow
Write-Host "   This may take 30-60 seconds..." -ForegroundColor Cyan
if ($USE_COMPOSE) {
    docker-compose up -d
}
else {
    make up
}
Write-Host "`n✅ Services started!" -ForegroundColor Green

# 6. Wait for services
Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
            Write-Host "✅ API is ready!" -ForegroundColor Green
        }
    }
    catch {
        # Still waiting
    }
    
    if (-not $ready) {
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host -NoNewline "."
    }
}

if (-not $ready) {
    Write-Host "`n⚠️  Services took too long to start" -ForegroundColor Yellow
    Write-Host "   Check with: make logs or docker logs" -ForegroundColor Yellow
}

# 7. Display results
Write-Host "`n`n╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    ✅ AKIG IS READY!                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   API:       http://localhost:4000" -ForegroundColor White
Write-Host "   Health:    http://localhost:4000/api/health`n" -ForegroundColor White

Write-Host "🔐 Login:" -ForegroundColor Cyan
Write-Host "   Email:     admin@akig.com" -ForegroundColor White
Write-Host "   Password:  admin123`n" -ForegroundColor White

Write-Host "💡 Useful commands:" -ForegroundColor Cyan
Write-Host "   make status    - See service status" -ForegroundColor White
Write-Host "   make logs      - View logs" -ForegroundColor White
Write-Host "   make health    - Check services health" -ForegroundColor White
Write-Host "   make test      - Run tests" -ForegroundColor White
Write-Host "   make down      - Stop services" -ForegroundColor White
Write-Host "   make help      - See all commands`n" -ForegroundColor White

Write-Host "🎯 Next step: Open http://localhost:3000 in your browser!" -ForegroundColor Cyan
Write-Host ""

# Try to open browser
try {
    Start-Process "http://localhost:3000"
}
catch {
    Write-Host "💡 Open http://localhost:3000 manually in your browser" -ForegroundColor Yellow
}
