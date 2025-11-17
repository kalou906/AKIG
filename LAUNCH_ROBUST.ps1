#!/usr/bin/env pwsh

<#
.SYNOPSIS
AKIG - Robust Startup Script
Launches AKIG system with comprehensive environment verification and error handling

.DESCRIPTION
This script verifies the environment, checks dependencies, and launches both
backend and frontend services with proper error reporting.

.EXAMPLE
.\LAUNCH_ROBUST.ps1

.EXAMPLE
.\LAUNCH_ROBUST.ps1 -Environment "production"

#>

param(
    [string]$Environment = "development",
    [switch]$SkipVerification = $false,
    [switch]$OpenBrowser = $true
)

# ============================================
# CONFIGURATION
# ============================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $SCRIPT_DIR "backend"
$FRONTEND_DIR = Join-Path $SCRIPT_DIR "frontend"

$BACKEND_PORT = 4000
$FRONTEND_PORT = 3000

$BACKEND_URL = "http://localhost:$BACKEND_PORT"
$FRONTEND_URL = "http://localhost:$FRONTEND_PORT"

# ============================================
# COLOR CODES
# ============================================

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Message)
    Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║ $Message $(' ' * (37 - $Message.Length))║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Blue
}

# ============================================
# UTILITY FUNCTIONS
# ============================================

function Test-DirectoryExists {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        return $false
    }
    
    if (-not (Test-Path $Path -PathType Container)) {
        return $false
    }
    
    return $true
}

function Test-FileExists {
    param([string]$Path)
    return (Test-Path $Path -PathType Leaf)
}

function Test-PortAvailable {
    param([int]$Port)
    
    try {
        $tcpConnection = Test-NetConnection -ComputerName "127.0.0.1" -Port $Port -WarningAction SilentlyContinue
        return -not $tcpConnection.TcpTestSucceeded
    }
    catch {
        return $true
    }
}

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$MaxWaitSeconds = 30
    )
    
    $startTime = Get-Date
    $endpoint = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Loopback, $Port)
    
    while ((Get-Date) - $startTime -lt [timespan]::FromSeconds($MaxWaitSeconds)) {
        try {
            $socket = New-Object System.Net.Sockets.TcpClient
            $socket.Connect($endpoint)
            $socket.Close()
            return $true
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }
    
    return $false
}

# ============================================
# VERIFICATION
# ============================================

function Verify-Environment {
    Write-Section "Environment Verification"
    
    # Check directories
    Write-Info "Checking directories..."
    
    if (-not (Test-DirectoryExists $BACKEND_DIR)) {
        Write-Error-Custom "Backend directory not found: $BACKEND_DIR"
        return $false
    }
    Write-Success "Backend directory found"
    
    if (-not (Test-DirectoryExists $FRONTEND_DIR)) {
        Write-Error-Custom "Frontend directory not found: $FRONTEND_DIR"
        return $false
    }
    Write-Success "Frontend directory found"
    
    # Check Node.js
    Write-Info "Checking Node.js..."
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js found: $nodeVersion"
    }
    else {
        Write-Error-Custom "Node.js not found. Please install Node.js 16+"
        return $false
    }
    
    # Check npm
    Write-Info "Checking npm..."
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm found: $npmVersion"
    }
    else {
        Write-Error-Custom "npm not found"
        return $false
    }
    
    # Check ports
    Write-Info "Checking port availability..."
    
    if (-not (Test-PortAvailable $BACKEND_PORT)) {
        Write-Error-Custom "Port $BACKEND_PORT is already in use"
        return $false
    }
    Write-Success "Port $BACKEND_PORT is available"
    
    if (-not (Test-PortAvailable $FRONTEND_PORT)) {
        Write-Error-Custom "Port $FRONTEND_PORT is already in use"
        return $false
    }
    Write-Success "Port $FRONTEND_PORT is available"
    
    # Check dependencies
    Write-Info "Checking dependencies..."
    
    $backendPackageJson = Join-Path $BACKEND_DIR "package.json"
    if (-not (Test-FileExists $backendPackageJson)) {
        Write-Error-Custom "Backend package.json not found"
        return $false
    }
    Write-Success "Backend package.json found"
    
    $frontendPackageJson = Join-Path $FRONTEND_DIR "package.json"
    if (-not (Test-FileExists $frontendPackageJson)) {
        Write-Error-Custom "Frontend package.json not found"
        return $false
    }
    Write-Success "Frontend package.json found"
    
    return $true
}

# ============================================
# INSTALLATION
# ============================================

function Install-Dependencies {
    param([string]$ServiceName, [string]$Path)
    
    Write-Info "Installing $ServiceName dependencies..."
    
    Push-Location $Path
    try {
        & npm install 2>&1 | Select-Object -Last 5
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$ServiceName dependencies installed"
            return $true
        }
        else {
            Write-Error-Custom "Failed to install $ServiceName dependencies"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# ============================================
# SERVICE STARTUP
# ============================================

function Start-Backend {
    Write-Section "Starting Backend Service"
    
    Write-Info "Launching backend on port $BACKEND_PORT..."
    
    Push-Location $BACKEND_DIR
    try {
        # Run verification
        Write-Info "Running environment verification..."
        & node verify-environment.js
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Backend environment verification failed"
            return $false
        }
        
        # Start backend in new window
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; npm start" -PassThru | Out-Null
        
        Write-Info "Waiting for backend to be ready..."
        if (Wait-ForPort $BACKEND_PORT) {
            Write-Success "Backend is ready at $BACKEND_URL"
            return $true
        }
        else {
            Write-Error-Custom "Backend failed to start within timeout"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-Section "Starting Frontend Service"
    
    Write-Info "Launching frontend on port $FRONTEND_PORT..."
    
    Push-Location $FRONTEND_DIR
    try {
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND_DIR'; npm start" -PassThru | Out-Null
        
        Write-Info "Waiting for frontend to be ready..."
        if (Wait-ForPort $FRONTEND_PORT) {
            Write-Success "Frontend is ready at $FRONTEND_URL"
            return $true
        }
        else {
            Write-Error-Custom "Frontend failed to start within timeout"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# ============================================
# HEALTH CHECK
# ============================================

function Test-BackendHealth {
    try {
        $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/health" -TimeoutSec 5 -WarningAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# ============================================
# MAIN
# ============================================

function Main {
    Clear-Host
    
    Write-Host @"
╔════════════════════════════════════════════╗
║     🇬🇳 AKIG - Robust Startup System 🇬🇳     ║
║          Production-Ready Launcher         ║
╚════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
    
    Write-Info "Environment: $Environment"
    Write-Info "Script location: $SCRIPT_DIR"
    
    # Verification
    if (-not $SkipVerification) {
        if (-not (Verify-Environment)) {
            Write-Error-Custom "Environment verification failed. Exiting."
            exit 1
        }
    }
    else {
        Write-Warning-Custom "Skipping environment verification"
    }
    
    # Install dependencies if needed
    Write-Section "Dependency Check"
    
    $backendNodeModules = Join-Path $BACKEND_DIR "node_modules"
    if (-not (Test-DirectoryExists $backendNodeModules)) {
        if (-not (Install-Dependencies "Backend" $BACKEND_DIR)) {
            exit 1
        }
    }
    else {
        Write-Success "Backend dependencies already installed"
    }
    
    $frontendNodeModules = Join-Path $FRONTEND_DIR "node_modules"
    if (-not (Test-DirectoryExists $frontendNodeModules)) {
        if (-not (Install-Dependencies "Frontend" $FRONTEND_DIR)) {
            exit 1
        }
    }
    else {
        Write-Success "Frontend dependencies already installed"
    }
    
    # Start services
    if (-not (Start-Backend)) {
        exit 1
    }
    
    if (-not (Start-Frontend)) {
        exit 1
    }
    
    # Verify backend health
    Write-Section "Health Check"
    Write-Info "Checking backend health..."
    Start-Sleep -Seconds 2
    
    if (Test-BackendHealth) {
        Write-Success "Backend is healthy"
    }
    else {
        Write-Warning-Custom "Backend health check inconclusive (may still be initializing)"
    }
    
    # Final summary
    Write-Section "Startup Complete"
    Write-Success "AKIG system is running!"
    Write-Host ""
    Write-Host "📍 Frontend:  $FRONTEND_URL" -ForegroundColor Green
    Write-Host "📍 Backend:   $BACKEND_URL" -ForegroundColor Green
    Write-Host ""
    Write-Info "Open a new terminal to stop services or view logs"
    Write-Info "Press Ctrl+C in each window to stop the services"
    Write-Host ""
    
    # Open browser
    if ($OpenBrowser) {
        Write-Info "Opening browser..."
        Start-Process $FRONTEND_URL
    }
}

# ============================================
# EXECUTE
# ============================================

try {
    Main
}
catch {
    Write-Error-Custom "Unexpected error: $_"
    exit 1
}

# Keep window open
Read-Host "`nPress Enter to exit"
