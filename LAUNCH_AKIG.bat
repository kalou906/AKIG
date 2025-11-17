@echo off
setlocal enabledelayedexpansion

REM ╔══════════════════════════════════════════════════════════════════╗
REM ║           AKIG - LAUNCHER COMPLET - UN CLICK SEULEMENT           ║
REM ║  Démarre AUTOMATIQUEMENT : Backend, Frontend, Toutes les Configs ║
REM ╚══════════════════════════════════════════════════════════════════╝

title AKIG - Plateforme Immobilière Intelligente
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                    🚀 AKIG EN DÉMARRAGE...                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Définir le répertoire racine
set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [1/5] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé ! Visitez https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js OK

echo.
echo [2/5] Vérification du Backend...
if not exist "backend\src\index.js" (
    echo ❌ Backend non trouvé !
    pause
    exit /b 1
)
echo ✓ Backend trouvé

echo.
echo [3/5] Vérification du Frontend...
if not exist "akig-ultimate\src\App.jsx" (
    echo ❌ Frontend non trouvé !
    pause
    exit /b 1
)
echo ✓ Frontend trouvé

echo.
echo [4/5] Démarrage du Backend (port 4000)...
start "AKIG Backend" cmd /k "cd /d "%ROOT_DIR%backend" && npm run dev"
timeout /t 3 /nobreak

echo.
echo [5/5] Démarrage du Frontend (port 5173)...
start "AKIG Frontend" cmd /k "cd /d "%ROOT_DIR%akig-ultimate" && npm run dev"
timeout /t 3 /nobreak

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                    ✅ AKIG EST PRÊT !                            ║
echo ╠════════════════════════════════════════════════════════════════════╣
echo ║                                                                    ║
echo ║  🌐 Frontend  : http://localhost:5173                            ║
echo ║  🔌 Backend   : http://localhost:4000/api                        ║
echo ║  🔐 Rôles     : Voir Paramètres                                 ║
echo ║                                                                    ║
echo ║  📊 Fonctionnalités :                                            ║
echo ║     • Gestion Immobilière (Locataires, Contrats, etc.)          ║
echo ║     • Recouvrement & Paiements Avancés                         ║
echo ║     • Opérations & Maintenance                                  ║
echo ║     • Reporting & Analytics                                     ║
echo ║     • Portails (Client, Propriétaire)                          ║
echo ║     • Administration & Gestion des Rôles                       ║
echo ║     • IA & Recherche Avancée                                   ║
echo ║     • Cartographie & Géolocalisation                           ║
echo ║     • Place Marché & Dashboards Personnalisés                 ║
echo ║     • Chatbot Intelligent & Machine Learning                  ║
echo ║                                                                    ║
echo ╠════════════════════════════════════════════════════════════════════╣
echo ║  Les 2 fenêtres de terminal ci-dessus exécutent les serveurs    ║
echo ║  Laissez-les ouvertes pour garder l'app active                 ║
echo ╚════════════════════════════════════════════════════════════════════╝

echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul
