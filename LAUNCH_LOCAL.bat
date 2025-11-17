@echo off
REM 🚀 AKIG - Lancement 100% Fiable (Mode Local)
REM Lance PostgreSQL + Backend API + Frontend React
REM Aucune dépendance Docker requise

cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     🚀 AKIG - Lancement Complet (PostgreSQL Local)           ║
echo ║                                                              ║
echo ║  Configuration requise:                                      ║
echo ║  • PostgreSQL 15+ installé et en cours d'exécution           ║
echo ║  • Node.js 18.20.3 (npm 10.7+)                              ║
echo ║  • Port 5432 (Postgres), 4000 (API), 3000 (Frontend)        ║
echo ║                                                              ║
echo ║  Accès:                                                      ║
echo ║  • Frontend:  http://localhost:3000                         ║
echo ║  • Backend:   http://localhost:4000/api                     ║
echo ║  • Health:    http://localhost:4000/api/health              ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ===== Étape 1 : Vérifier PostgreSQL =====
echo 📋 Étape 1 : Vérification de PostgreSQL...
echo.

setlocal enabledelayedexpansion

REM Tenter de se connecter à PostgreSQL
psql -U postgres -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL n'est pas accessible
    echo.
    echo Instructions:
    echo   1. Installer PostgreSQL 15:
    echo      https://www.postgresql.org/download/windows/
    echo   2. Lancer le service PostgreSQL (s'assurer qu'il tourne)
    echo   3. Vérifier que l'utilisateur "postgres" existe
    echo   4. Relancer ce script
    echo.
    pause
    exit /b 1
)
echo ✅ PostgreSQL est accessible
echo.

REM ===== Étape 2 : Créer la base si elle n'existe pas =====
echo 📋 Étape 2 : Configuration de la base de données...
echo.

psql -U postgres -c "CREATE DATABASE akig_db;" 2>nul || echo ℹ️  Base akig_db existe déjà

psql -U postgres -d akig_db -c "CREATE USER akig WITH PASSWORD 'akig_password';" 2>nul || echo ℹ️  Utilisateur akig existe déjà

psql -U postgres -d akig_db -c "ALTER USER akig WITH PASSWORD 'akig_password';" >nul 2>&1

psql -U postgres -d akig_db -c "GRANT ALL PRIVILEGES ON DATABASE akig_db TO akig;" >nul 2>&1

echo ✅ Base de données configurée
echo   - Base: akig_db
echo   - Utilisateur: akig / akig_password
echo.

REM ===== Étape 3 : Mettre à jour le fichier .env du backend =====
echo 📋 Étape 3 : Configuration du backend...
echo.

if not exist "backend\.env" (
    (
        echo PORT=4000
        echo DATABASE_URL=postgresql://akig:akig_password@localhost:5432/akig_db
        echo JWT_SECRET=akig_jwt_secret_key_development_min_32_chars_long_change_in_prod
        echo FEATURE_FLAGS=payments,sms,dashboard
        echo DISABLE_REDIS=true
    ) > backend\.env
    echo ✅ Fichier backend\.env créé
) else (
    echo ℹ️  Fichier backend\.env déjà existant
)
echo.

REM ===== Étape 4 : Bootstrap =====
echo 📋 Étape 4 : Installation des dépendances (npm ci)...
echo.
call npm run bootstrap
if errorlevel 1 (
    echo ❌ Bootstrap échoué
    pause
    exit /b 1
)
echo ✅ Bootstrap réussi
echo.

REM ===== Étape 5 : Lancer les services =====
echo 📋 Étape 5 : Lancement des services...
echo.
echo   🔄 Backend API (http://localhost:4000)
echo   🔄 Frontend (http://localhost:3000)
echo.
echo   Appuyez sur Ctrl+C pour arrêter tout
echo.

REM Lancer le backend dans une nouvelle fenêtre
start "AKIG Backend API" cmd /k "cd backend && npm run start:guarded"

REM Attendre un peu
timeout /t 3 /nobreak

REM Lancer le frontend dans une nouvelle fenêtre
start "AKIG Frontend" cmd /k "cd frontend && npm start"

REM Ouvrir le navigateur après 5 secondes
timeout /t 5 /nobreak
start http://localhost:3000

echo ✅ Services lancés dans des fenêtres séparées
echo.
echo 📝 Prochaines étapes:
echo   1. Vérifier http://localhost:3000 dans le navigateur
echo   2. Attendre que BootGate disparaisse (API en cours de démarrage)
echo   3. Tester le login / paiements / SMS
echo.
pause
