@echo off
REM ============================================================
REM   AKIG - Lancement Complet du Système
REM   Backend + Frontend en mode production
REM ============================================================

setlocal enabledelayedexpansion

REM Couleurs (pour PowerShell après)
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           🚀 AKIG - LANCEMENT COMPLET                    ║
echo ║          Backend + Frontend + PostgreSQL                 ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Variables
set BACKEND_DIR=C:\AKIG\backend
set FRONTEND_DIR=C:\AKIG\frontend
set BACKEND_PORT=4000
set FRONTEND_PORT=3000

REM Étape 1: Arrêter les processus existants
echo [1/6] Arrêt des processus existants...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Étape 2: Vérifier les fichiers critiques
echo [2/6] Vérification des fichiers critiques...
if not exist "%BACKEND_DIR%\package.json" (
    echo ❌ Backend package.json not found
    exit /b 1
)
if not exist "%FRONTEND_DIR%\package.json" (
    echo ❌ Frontend package.json not found
    exit /b 1
)
echo ✓ Fichiers trouvés

REM Étape 3: Vérifier node_modules
echo [3/6] Vérification de node_modules...
if not exist "%BACKEND_DIR%\node_modules" (
    echo ⚠ Backend node_modules missing, installing...
    cd /d "%BACKEND_DIR%"
    call npm install --legacy-peer-deps
    if !errorlevel! neq 0 (
        echo ❌ Backend npm install failed
        exit /b 1
    )
)
echo ✓ Backend node_modules OK

if not exist "%FRONTEND_DIR%\node_modules" (
    echo ⚠ Frontend node_modules missing, installing...
    cd /d "%FRONTEND_DIR%"
    call npm install --legacy-peer-deps
    if !errorlevel! neq 0 (
        echo ❌ Frontend npm install failed
        exit /b 1
    )
)
echo ✓ Frontend node_modules OK

REM Étape 4: Test du backend
echo [4/6] Test du backend...
cd /d "%BACKEND_DIR%"
node test-complete.js >nul 2>&1
if !errorlevel! neq 0 (
    echo ⚠ Backend test failed, attempting to start anyway...
) else (
    echo ✓ Backend test réussi
)

REM Étape 5: Démarrer le backend
echo [5/6] Démarrage du backend (port %BACKEND_PORT%)...
cd /d "%BACKEND_DIR%"
start "AKIG Backend" cmd /k "node src/index.js"
timeout /t 3 /nobreak >nul

REM Étape 6: Démarrer le frontend
echo [6/6] Démarrage du frontend (port %FRONTEND_PORT%)...
cd /d "%FRONTEND_DIR%"
start "AKIG Frontend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           ✅ AKIG DÉMARRÉ AVEC SUCCÈS!                  ║
echo ║                                                            ║
echo ║  Frontend:    http://localhost:3000                       ║
echo ║  Backend API: http://localhost:4000/api                  ║
echo ║  Health:      http://localhost:4000/api/health          ║
echo ║                                                            ║
echo ║  Attente 20-30 secondes pour le démarrage complet...      ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Garder la fenêtre ouverte
pause
