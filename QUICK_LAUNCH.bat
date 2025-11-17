@echo off
REM ╔═══════════════════════════════════════════════════════════════════════╗
REM ║                                                                       ║
REM ║                    🎯 AKIG - QUICK LAUNCHER v2                       ║
REM ║                     Le plus SIMPLE et le plus RAPIDE                  ║
REM ║                                                                       ║
REM ╚═══════════════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion
color 0F
cls

REM Configuration
set "BACKEND_PORT=4000"
set "FRONTEND_PORT=5173"
set "BACKEND_DIR=backend"
set "FRONTEND_DIR=akig-ultimate"

echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║  🚀 AKIG Lancement                                                    ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.

REM ============================================================================
REM Vérifications préalables
REM ============================================================================

REM Vérifier Node.js
where node >nul 2>nul
if !ERRORLEVEL! neq 0 (
    color 0C
    echo ❌ ERREUR : Node.js introuvable
    echo.
    echo Téléchargez-le : https://nodejs.org
    echo Puis relancez ce script
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo ✓ Node.js: %NODE_VER%

REM Vérifier répertoires
if not exist "%BACKEND_DIR%" (
    color 0C
    echo ❌ Répertoire '%BACKEND_DIR%' introuvable
    pause
    exit /b 1
)
echo ✓ Backend trouvé

if not exist "%FRONTEND_DIR%" (
    color 0C
    echo ❌ Répertoire '%FRONTEND_DIR%' introuvable
    pause
    exit /b 1
)
echo ✓ Frontend trouvé
echo.

REM ============================================================================
REM Installation des dépendances
REM ============================================================================

echo ╔───────────────────────────────────────────────────────────────────────╗
echo ║ 📦 Installation des dépendances (si nécessaire)                       ║
echo ╚───────────────────────────────────────────────────────────────────────╝
echo.

if not exist "%BACKEND_DIR%\node_modules" (
    echo [1/2] Backend...
    cd /d "%BACKEND_DIR%"
    call npm install --silent >nul 2>nul
    cd ..
    echo ✓ Backend OK
) else (
    echo [1/2] Backend (déjà installé)
    echo ✓ Backend OK
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [2/2] Frontend...
    cd /d "%FRONTEND_DIR%"
    call npm install --silent >nul 2>nul
    cd ..
    echo ✓ Frontend OK
) else (
    echo [2/2] Frontend (déjà installé)
    echo ✓ Frontend OK
)
echo.

REM ============================================================================
REM Lancement des services
REM ============================================================================

title AKIG Backend et Frontend
echo ╔───────────────────────────────────────────────────────────────────────╗
echo ║ 🚀 Démarrage des services                                             ║
echo ╚───────────────────────────────────────────────────────────────────────╝
echo.

echo [1/2] Backend Port %BACKEND_PORT%...
cd /d "%BACKEND_DIR%"
start "AKIG Backend" cmd /k npm run dev
cd ..
echo ✓ Lancé
timeout /t 2 /nobreak >nul

echo [2/2] Frontend Port %FRONTEND_PORT%...
cd /d "%FRONTEND_DIR%"
start "AKIG Frontend" cmd /k npm run dev
cd ..
echo ✓ Lancé
timeout /t 2 /nobreak >nul
echo.

REM ============================================================================
REM Success message
REM ============================================================================

color 0A
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║                                                                       ║
echo ║  ✅ AKIG EST DÉMARRÉ !                                               ║
echo ║                                                                       ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.
echo   📱 INTERFACES
echo   ─────────────────────────────────────────────────────────────────────
echo   🌐 Application  : http://localhost:%FRONTEND_PORT%
echo   📡 API          : http://localhost:%BACKEND_PORT%/api
echo   💚 Health Check : http://localhost:%BACKEND_PORT%/api/health
echo.
echo   📊 MODULES (8 disponibles)
echo   ─────────────────────────────────────────────────────────────────────
echo   1. Gestion Immobilière
echo   2. Recouvrement & Paiements
echo   3. Opérations & Maintenance
echo   4. Reporting & Analytics
echo   5. Portails Client
echo   6. Administration (+ Rôles)
echo   7. IA & Recherche
echo   8. Cartographie
echo.
echo   🔐 RÔLES (6 disponibles)
echo   ─────────────────────────────────────────────────────────────────────
echo   • Super Admin (Accès complet)
echo   • Admin (Gestion système)
echo   • Gestionnaire (Tous les modules)
echo   • Agent (Propriétés & Paiements)
echo   • Comptable (Finances)
echo   • Locataire (Accès limité)
echo.
echo   ℹ️  INFORMATIONS
echo   ─────────────────────────────────────────────────────────────────────
echo   Backend  : %BACKEND_DIR% (npm run dev)
echo   Frontend : %FRONTEND_DIR% (npm run dev)
echo   Logs     : Consultez les fenêtres de commande ouvertes
echo.
echo   🛑 ARRÊT
echo   ─────────────────────────────────────────────────────────────────────
echo   Fermez les fenêtres Backend et Frontend pour arrêter AKIG
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║  Appuyez sur une touche pour continuer...                            ║
echo ╚═══════════════════════════════════════════════════════════════════════╝

pause >nul
