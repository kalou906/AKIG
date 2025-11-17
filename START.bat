@echo off
REM ============================================================
REM AKIG System Launcher - Start Backend and Frontend
REM ============================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           🚀 AKIG SYSTEM LAUNCHER 🚀                          ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if backend is already running
echo Checking backend...
timeout /t 1 /nobreak > nul
start /b cmd /c "cd c:\AKIG\backend && node src\index-dev.js"
echo ✓ Backend starting on port 4000...

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo Starting frontend...
start /b cmd /c "cd c:\AKIG\frontend && npm start"
echo ✓ Frontend starting on port 3000...

echo.
echo ════════════════════════════════════════════════════════════════
echo ✅ SYSTÈME LANCÉ
echo ════════════════════════════════════════════════════════════════
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔌 Backend:  http://localhost:4000
echo.
echo Press any key to continue or close this window...
echo.
pause
