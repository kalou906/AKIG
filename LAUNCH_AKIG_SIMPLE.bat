@echo off
REM AKIG - Lancement Simple Sans Dépendances
REM Le script le plus simple pour lancer AKIG rapidement

color 0A
cls

echo.
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                                                                    ║
echo ║         🚀 AKIG - Lancement Rapide en 1 Clic                      ║
echo ║                                                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo.

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ ERREUR : Node.js n'est pas installé ou introuvable !
    echo.
    echo Téléchargez Node.js depuis : https://nodejs.org/
    echo Puis relancez ce script.
    echo.
    pause
    exit /b 1
)

REM Obtenir version de Node
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js trouvé : %NODE_VERSION%
echo.

REM Vérifier les répertoires
if not exist "backend" (
    color 0C
    echo ❌ ERREUR : Répertoire 'backend' introuvable !
    pause
    exit /b 1
)

if not exist "akig-ultimate" (
    color 0C
    echo ❌ ERREUR : Répertoire 'akig-ultimate' introuvable !
    pause
    exit /b 1
)

echo ✓ Répertoires trouvés
echo.

REM Titre
title AKIG Backend & Frontend
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  📦 INSTALLATION DES DÉPENDANCES (première fois seulement)        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Backend dependencies
if not exist "backend\node_modules" (
    echo [1/2] Installation dépendances Backend...
    cd backend
    call npm install --silent >nul 2>nul
    cd ..
    echo ✓ Backend dépendances OK
) else (
    echo ✓ Backend dépendances déjà installées
)

echo.

REM Frontend dependencies
if not exist "akig-ultimate\node_modules" (
    echo [2/2] Installation dépendances Frontend...
    cd akig-ultimate
    call npm install --silent >nul 2>nul
    cd ..
    echo ✓ Frontend dépendances OK
) else (
    echo ✓ Frontend dépendances déjà installées
)

echo.
echo.

REM Démarrage
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  🚀 DÉMARRAGE SERVICES                                            ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo [1/2] Lancement Backend (Port 4000)...
cd backend
start "AKIG Backend" cmd /k npm run dev
cd ..
echo ✓ Backend lancé
echo.
timeout /t 3 /nobreak

echo [2/2] Lancement Frontend (Port 5173)...
cd akig-ultimate
start "AKIG Frontend" cmd /k npm run dev
cd ..
echo ✓ Frontend lancé
echo.
timeout /t 3 /nobreak

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  ✅ AKIG EST DÉMARRÉ !                                            ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo   🌐 Accédez à AKIG ici :
echo      👉 http://localhost:5173
echo.
echo   📡 API Backend :
echo      👉 http://localhost:4000/api
echo.
echo   ⚙️  Infos Système :
echo      👉 http://localhost:4000/api/info
echo.
echo   💚 Health Check :
echo      👉 http://localhost:4000/api/health
echo.
echo.
echo ℹ️  Les deux fenêtres de commande ci-dessous restent ouvertes.
echo    Fermez-les pour arrêter AKIG.
echo.
echo.

REM Rester ouvert
pause
