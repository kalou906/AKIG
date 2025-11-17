@echo off
REM Script de demarrage AKIG - Backend + Frontend

echo.
echo ========================================
echo   Demarrage du systeme AKIG
echo ========================================
echo.

REM Arreter les processus existants
echo Arret des processus existants...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.cmd 2>nul
timeout /t 2 /nobreak

REM Demarrer le backend
echo Demarrage du backend API (port 4000)...
start "AKIG Backend" cmd /k "cd C:\AKIG\backend && node src/index.js"
timeout /t 3 /nobreak

REM Demarrer le frontend
echo Demarrage du frontend React (port 3000)...
start "AKIG Frontend" cmd /k "cd C:\AKIG\frontend && npm start"
timeout /t 5 /nobreak

echo.
echo ========================================
echo   Services demarres avec succes!
echo ========================================
echo.
echo Frontend:  http://localhost:3000
echo API:       http://localhost:4000
echo Health:    http://localhost:4000/api/health
echo.
echo Attente de 15-30 secondes pour le demarrage complet...
timeout /t 10 /nobreak
