@echo off
REM ====================================================================
REM AKIG - Lanceur simple des deux services (Backend + Frontend)
REM ====================================================================

cls
color 0B
echo.
echo ========================================
echo    ^>^> AKIG - Demarrage des Services ^<^<
echo ========================================
echo.

REM Arrêter les anciens processus Node
echo [*] Arret des anciens processus...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Lancer le Backend dans une nouvelle fenetre
echo [+] Lancement du BACKEND (Port 4000)...
start "AKIG Backend" cmd /k cd /d C:\AKIG\backend ^& node simple-server.js

REM Attendre 2 secondes
timeout /t 2 /nobreak >nul

REM Lancer le Frontend dans une nouvelle fenetre
echo [+] Lancement du FRONTEND (Port 5173)...
start "AKIG Frontend" cmd /k cd /d C:\AKIG\akig-ultimate ^& npm run dev

REM Attendre 5 secondes
timeout /t 5 /nobreak >nul

cls
color 0A
echo.
echo ========================================
echo    ^>^> Demarrage Complete! ^<^<
echo ========================================
echo.
echo Interface WEB : http://localhost:5173/
echo API Backend   : http://localhost:4000/api/health
echo.
echo Les deux services devraient tourner dans des fenetres separees.
echo Attendez 3-5 secondes que Vite compile...
echo.
echo.
pause
