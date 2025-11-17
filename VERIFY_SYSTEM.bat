@echo off
REM ═════════════════════════════════════════════════════════════════════════
REM  AKIG - Vérification du Système
REM ═════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion
color 0F
cls

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║  🔍 AKIG - Vérification du Système                                      ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
echo.

set "CHECKS_PASSED=0"
set "CHECKS_TOTAL=7"

REM ─────────────────────────────────────────────────────────────────────────
REM 1. Node.js
REM ─────────────────────────────────────────────────────────────────────────

echo [1/7] Vérification Node.js...
where node >nul 2>nul
if !ERRORLEVEL! equ 0 (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
    echo ✓ Node.js: !NODE_VER!
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Node.js: NON TROUVÉ
)

REM ─────────────────────────────────────────────────────────────────────────
REM 2. npm
REM ─────────────────────────────────────────────────────────────────────────

echo [2/7] Vérification npm...
where npm >nul 2>nul
if !ERRORLEVEL! equ 0 (
    for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
    echo ✓ npm: !NPM_VER!
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ npm: NON TROUVÉ
)

REM ─────────────────────────────────────────────────────────────────────────
REM 3. Backend directory
REM ─────────────────────────────────────────────────────────────────────────

echo [3/7] Vérification répertoire Backend...
if exist "backend" (
    echo ✓ backend/ trouvé
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ backend/ introuvable
)

REM ─────────────────────────────────────────────────────────────────────────
REM 4. Frontend directory
REM ─────────────────────────────────────────────────────────────────────────

echo [4/7] Vérification répertoire Frontend...
if exist "akig-ultimate" (
    echo ✓ akig-ultimate/ trouvé
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ akig-ultimate/ introuvable
)

REM ─────────────────────────────────────────────────────────────────────────
REM 5. Backend package.json
REM ─────────────────────────────────────────────────────────────────────────

echo [5/7] Vérification package.json Backend...
if exist "backend\package.json" (
    echo ✓ backend/package.json trouvé
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ backend/package.json introuvable
)

REM ─────────────────────────────────────────────────────────────────────────
REM 6. Frontend package.json
REM ─────────────────────────────────────────────────────────────────────────

echo [6/7] Vérification package.json Frontend...
if exist "akig-ultimate\package.json" (
    echo ✓ akig-ultimate/package.json trouvé
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ akig-ultimate/package.json introuvable
)

REM ─────────────────────────────────────────────────────────────────────────
REM 7. Ports availability (simplified)
REM ─────────────────────────────────────────────────────────────────────────

echo [7/7] Vérification ports...
netstat -ano 2>nul | findstr ":4000 " >nul
if !ERRORLEVEL! equ 0 (
    echo ⚠️  Port 4000 en utilisation
) else (
    echo ✓ Port 4000 disponible
    set /a CHECKS_PASSED+=1
)

echo.

REM ─────────────────────────────────────────────────────────────────────────
REM Summary
REM ─────────────────────────────────────────────────────────────────────────

if !CHECKS_PASSED! geq 6 (
    color 0A
    echo ╔═════════════════════════════════════════════════════════════════════════╗
    echo ║  ✅ SYSTÈME OK - Prêt pour le lancement                                 ║
    echo ║                                                                         ║
    echo ║  Vérifications réussies: !CHECKS_PASSED!/!CHECKS_TOTAL!                          ║
    echo ║                                                                         ║
    echo ║  🚀 Lancez AKIG avec: QUICK_LAUNCH.bat                                ║
    echo ║                                                                         ║
    echo ╚═════════════════════════════════════════════════════════════════════════╝
) else if !CHECKS_PASSED! geq 5 (
    color 0E
    echo ╔═════════════════════════════════════════════════════════════════════════╗
    echo ║  ⚠️  SYSTÈME PARTIELLEMENT OK                                           ║
    echo ║                                                                         ║
    echo ║  Vérifications réussies: !CHECKS_PASSED!/!CHECKS_TOTAL!                          ║
    echo ║                                                                         ║
    echo ║  Essayez quand même: QUICK_LAUNCH.bat                                 ║
    echo ║                                                                         ║
    echo ╚═════════════════════════════════════════════════════════════════════════╝
) else (
    color 0C
    echo ╔═════════════════════════════════════════════════════════════════════════╗
    echo ║  ❌ SYSTÈME NON PRÊT                                                    ║
    echo ║                                                                         ║
    echo ║  Vérifications réussies: !CHECKS_PASSED!/!CHECKS_TOTAL!                          ║
    echo ║                                                                         ║
    echo ║  1. Installez Node.js: https://nodejs.org                             ║
    echo ║  2. Vérifiez les répertoires backend/ et akig-ultimate/              ║
    echo ║  3. Relancez cette vérification                                        ║
    echo ║                                                                         ║
    echo ╚═════════════════════════════════════════════════════════════════════════╝
)

echo.
pause
