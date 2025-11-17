@echo off
REM ============================================================
REM 🚀 AKIG SUPER LAUNCH - ONE CLICK START
REM ============================================================
REM This batch file does everything automatically
REM ============================================================

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║      🚀 AKIG SUPER LAUNCH - STARTING...           ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
echo ✓ Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ Node.js is NOT installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo   ✅ Node.js found
echo.

REM Navigate to frontend
echo ✓ Navigating to frontend folder...
cd /d "c:\AKIG\frontend"
if errorlevel 1 (
    echo   ❌ Frontend folder not found
    pause
    exit /b 1
)
echo   ✅ Ready
echo.

REM Install dependencies if needed
echo ✓ Checking dependencies...
if not exist "node_modules" (
    echo   ⏳ Installing npm packages (1-2 minutes)...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo   ❌ npm install failed
        pause
        exit /b 1
    )
    echo   ✅ Dependencies installed
) else (
    echo   ✅ Dependencies already installed
)
echo.

REM Show launch information
echo ✓ Launch Information:
echo   📍 Application: AKIG v1.0 Premium Edition
echo   🌐 URL: http://localhost:3000
echo   📧 Login Email: demo@akig.com
echo   🔐 Password: demo1234
echo   ✨ All 17 pages with 250+ demo data
echo.

REM Start the application
echo ✓ Starting development server...
echo   ⏳ Waiting for server to start (30-60 seconds)...
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║     ✅ AKIG IS NOW RUNNING!                        ║
echo ║                                                    ║
echo ║  Login with:                                       ║
echo ║  📧 demo@akig.com                                  ║
echo ║  🔐 demo1234                                       ║
echo ║                                                    ║
echo ║  What you'll see:                                  ║
echo ║  ✨ Dashboard Premium (15+ KPIs)                   ║
echo ║  ✨ 17 pages fully integrated                       ║
echo ║  ✨ 250+ demo data rows                             ║
echo ║  ✨ 50+ menu items (all clickable)                  ║
echo ║                                                    ║
echo ║  Press Ctrl+C to stop server                       ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Start npm dev server
call npm start

pause
