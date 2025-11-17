@echo off
REM AKIG Quick Start Script — Windows
REM Usage: start-akig.bat

setlocal enabledelayedexpansion

title AKIG - Starting System

echo.
echo ╔════════════════════════════════════════╗
echo ║  🚀 AKIG - Quick Start Script         ║
echo ╚════════════════════════════════════════╝
echo.

REM Step 1: Verify environment
echo [1/4] Verifying environment...
call npm --prefix backend run verify >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Environment verification failed
  pause
  exit /b 1
)
echo [✓] Environment OK

REM Step 2: Bootstrap
echo [2/4] Installing dependencies...
call npm run bootstrap >nul 2>&1
echo [✓] Dependencies installed

REM Step 3: Migrations
echo [3/4] Applying migrations...
call npm --prefix backend run migrate >nul 2>&1
if errorlevel 1 (
  echo [WARNING] Migrations skipped (already applied)
) else (
  echo [✓] Migrations applied
)

REM Step 4: Start
echo [4/4] Starting AKIG system...
echo.
echo ════════════════════════════════════════════════════════════════
echo    Backend API    ^→ http://localhost:4000/api
echo    Frontend       ^→ http://localhost:3000
echo    Health Check   ^→ http://localhost:4000/api/health
echo ════════════════════════════════════════════════════════════════
echo.

cd /d c:\AKIG
call npm run start:local

pause
