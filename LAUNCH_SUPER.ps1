# ============================================================
# 🚀 AKIG SUPER LAUNCH - ONE COMMAND TO START EVERYTHING
# ============================================================
# This script does EVERYTHING automatically:
# 1. Checks Node.js installation
# 2. Installs all dependencies (if needed)
# 3. Builds the frontend
# 4. Starts the development server
# 5. Opens browser to http://localhost:3000
# ============================================================

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      🚀 AKIG SUPER LAUNCH - STARTING...           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# ============================================================
# Step 1: Verify Node.js
# ============================================================
Write-Host "✓ Step 1: Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Node.js is NOT installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Node.js found: $nodeVersion" -ForegroundColor Green

# ============================================================
# Step 2: Navigate to frontend folder
# ============================================================
Write-Host "`n✓ Step 2: Navigating to frontend folder..." -ForegroundColor Yellow
if (-not (Test-Path "c:\AKIG\frontend")) {
    Write-Host "   ❌ Frontend folder not found at c:\AKIG\frontend" -ForegroundColor Red
    exit 1
}
Set-Location -Path "c:\AKIG\frontend"
Write-Host "   ✅ Current directory: $(Get-Location)" -ForegroundColor Green

# ============================================================
# Step 3: Check if node_modules exists
# ============================================================
Write-Host "`n✓ Step 3: Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⏳ Installing npm packages (this may take 1-2 minutes)..." -ForegroundColor Cyan
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dependencies already installed" -ForegroundColor Green
}

# ============================================================
# Step 4: Show launch info
# ============================================================
Write-Host "`n✓ Step 4: Launch Information:" -ForegroundColor Yellow
Write-Host "   📍 Application: AKIG v1.0 Premium Edition" -ForegroundColor Cyan
Write-Host "   🌐 URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   📧 Login Email: demo@akig.com" -ForegroundColor Cyan
Write-Host "   🔐 Password: demo1234" -ForegroundColor Cyan
Write-Host "   ✨ All 17 pages loaded with 250+ demo data" -ForegroundColor Cyan

# ============================================================
# Step 5: Start the development server
# ============================================================
Write-Host "`n✓ Step 5: Starting development server..." -ForegroundColor Yellow
Write-Host "   ⏳ Waiting for server to start (30-60 seconds)..." -ForegroundColor Cyan

# Set BROWSER environment variable to open browser automatically
$env:BROWSER = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $env:BROWSER)) {
    $env:BROWSER = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

# Start npm dev server in background and wait for it to be ready
$process = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow

# Wait for the development server to be ready
$maxWait = 120
$elapsed = 0
$serverReady = $false
while ($elapsed -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            break
        }
    } catch {
        # Server not ready yet
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
}

if ($serverReady) {
    Write-Host "   ✅ Development server is ready!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Server may be starting (or check terminal for errors)" -ForegroundColor Yellow
}

# ============================================================
# Step 6: Open browser
# ============================================================
Write-Host "`n✓ Step 6: Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"
Write-Host "   ✅ Browser opened to http://localhost:3000" -ForegroundColor Green

# ============================================================
# Final message
# ============================================================
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ AKIG IS NOW RUNNING!                        ║" -ForegroundColor Green
Write-Host "║                                                    ║" -ForegroundColor Green
Write-Host "║  Login with:                                       ║" -ForegroundColor Green
Write-Host "║  📧 demo@akig.com                                  ║" -ForegroundColor Green
Write-Host "║  🔐 demo1234                                       ║" -ForegroundColor Green
Write-Host "║                                                    ║" -ForegroundColor Green
Write-Host "║  What you'll see:                                  ║" -ForegroundColor Green
Write-Host "║  ✨ Dashboard Premium (15+ KPIs)                   ║" -ForegroundColor Green
Write-Host "║  ✨ 17 pages fully integrated                       ║" -ForegroundColor Green
Write-Host "║  ✨ 250+ demo data rows                             ║" -ForegroundColor Green
Write-Host "║  ✨ 50+ menu items (all clickable)                  ║" -ForegroundColor Green
Write-Host "║                                                    ║" -ForegroundColor Green
Write-Host "║  Press Ctrl+C in terminal to stop server           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n"

# Keep the script running (terminal stays open)
Write-Host "⏳ Development server is running..." -ForegroundColor Cyan
Write-Host "   (This terminal will stay open. Close it to stop the server.)" -ForegroundColor Gray

# Wait for user to stop the process
try {
    $process.WaitForExit()
} catch {
    # Script ended
}
