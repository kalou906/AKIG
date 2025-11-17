@echo off
REM 🚀 AKIG - Script de Lancement Simple
REM Lance le backend et le frontend dans des terminaux séparés

setlocal enabledelayedexpansion

REM Couleurs (approximation en batch)
color 0B

cls
echo.
echo     ╔══════════════════════════════════════════════════════════╗
echo     ║          🏢 AKIG - Gestion Immobilière Guinée 🏢         ║
echo     ║                   Version 2.0.0                          ║
echo     ║                                                          ║
echo     ║  Système complet de gestion immobilière                  ║
echo     ║  🔑 Propriétaires • 🏠 Propriétés • 📋 Contrats          ║
echo     ║  💰 Paiements • 📊 Analytics • 🔧 Maintenance            ║
echo     ║                                                          ║
echo     ╚══════════════════════════════════════════════════════════╝
echo.

REM Vérifier les prérequis
echo [*] Vérification des prérequis...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js non trouvé. Installez depuis https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
echo [+] Node.js: %NODE_VERSION%

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] npm non trouvé
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
echo [+] npm: %NPM_VERSION%

where psql >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('psql --version 2^>nul') do set PG_VERSION=%%i
    echo [+] PostgreSQL: %PG_VERSION%
) else (
    echo [!] PostgreSQL non trouvé (non critique)
)

echo.
echo [*] Vérification terminée
echo.

REM Configuration du backend
echo [*] Configuration du Backend...
cd backend

if not exist node_modules (
    echo [*] Installation des dépendances npm...
    call npm install >nul 2>&1
    echo [+] Dépendances installées
) else (
    echo [+] Dépendances déjà installées
)

if not exist .env (
    echo [*] Création du fichier .env...
    (
        echo NODE_ENV=development
        echo PORT=4002
        echo DATABASE_URL=postgresql://akig_user:password@localhost:5432/akig_immobilier
        echo JWT_SECRET=your-super-secret-key-min-32-chars-long-for-production!
        echo LOG_LEVEL=info
        echo PDF_OUTPUT_DIR=./receipts
        echo EXPORT_OUTPUT_DIR=./exports
        echo CORS_ORIGIN=http://localhost:3000,http://localhost:5173
    ) > .env
    echo [+] Fichier .env créé
)

cd ..
echo.

REM Configuration du frontend
echo [*] Configuration du Frontend...
cd frontend

if not exist node_modules (
    echo [*] Installation des dépendances npm...
    call npm install >nul 2>&1
    echo [+] Dépendances installées
) else (
    echo [+] Dépendances déjà installées
)

if not exist .env.local (
    echo [*] Création du fichier .env.local...
    (
        echo VITE_API_URL=http://localhost:4002/api
        echo VITE_APP_NAME=AKIG Immobilier
        echo VITE_APP_VERSION=2.0.0
    ) > .env.local
    echo [+] Fichier .env.local créé
)

cd ..
echo.

REM Lancer les services
echo [*] Lancement des services...
echo.

echo [+] Ouverture du terminal Backend...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak

echo [+] Ouverture du terminal Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo [✓] Services lancés dans des terminaux séparés!
echo.
echo URLs d'accès:
echo   🔗 Backend API:  http://localhost:4002/api/health
echo   🔗 Frontend:     http://localhost:5173
echo   📊 Swagger Docs: http://localhost:4002/api-docs
echo.
echo Ouverture du navigateur dans 5 secondes...
timeout /t 5 /nobreak

REM Ouvrir le navigateur
start http://localhost:5173

echo.
echo [✓] Vous pouvez fermer cette fenêtre
echo.
