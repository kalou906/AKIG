@echo off
chcp 65001 >nul

echo =============================================================
echo        AKIG - LANCEMENT COMPLET (Backend + Frontend)
echo =============================================================

echo.
echo [1/3] Nettoyage des processus existants...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM npm.exe /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| find ":4000"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| find ":3000"') do taskkill /PID %%p /F >nul 2>&1
echo      ✓ Processus nettoyés

echo.
echo [2/3] Démarrage du backend (port 4000)...
start "AKIG Backend" cmd /k "cd /d c:\AKIG\backend && npm run dev-simple"

REM laisser le temps au backend d'initialiser
timeout /t 5 >nul

echo [3/3] Démarrage du frontend (port 3000)...
start "AKIG Frontend" cmd /k "cd /d c:\AKIG\frontend && npm start"

echo.
echo =============================================================
echo   ✅ Backend : http://localhost:4000/api/health

echo   ✅ Frontend: http://localhost:3000

echo =============================================================
echo Les deux fenêtres "AKIG Backend" et "AKIG Frontend" doivent

echo rester ouvertes. Appuyez sur une touche pour fermer ce lanceur.
pause >nul
