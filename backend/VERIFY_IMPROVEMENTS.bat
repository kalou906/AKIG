@echo off
REM Vérification Final - 8 Améliorations Complétées
REM backend/VERIFY_IMPROVEMENTS.bat

cls
echo ==================================
echo. VERIFICATION 8 AMELIORATIONS
echo ==================================
echo.

REM Vérifier fichiers services
echo FICHIERS CREES:
echo   - logger.service.js: (test if exist)
if exist "src\services\logger.service.js" (
  echo     [OK]
) else (
  echo     [MISSING]
)

echo   - metrics.service.js:
if exist "src\services\metrics.service.js" (
  echo     [OK]
) else (
  echo     [MISSING]
)

echo   - alert.service.js:
if exist "src\services\alert.service.js" (
  echo     [OK]
) else (
  echo     [MISSING]
)

echo   - pdf.service.js:
if exist "src\services\pdf.service.js" (
  echo     [OK]
) else (
  echo     [MISSING]
)

echo   - cursor-pagination.js:
if exist "src\utils\cursor-pagination.js" (
  echo     [OK]
) else (
  echo     [MISSING]
)

echo   - alert-cron.js:
if exist "src\jobs\alert-cron.js" (
  echo     [OK]
) else (
  echo     [MISSING]
)

echo   - pdf.routes.js:
if exist "src\routes\pdf.routes.js" (
  echo     [OK]
) else (
  echo     [MISSING]
)

echo.
echo NPM PACKAGES:
call npm list winston 2>nul | find "winston" >nul && echo   [OK] winston || echo   [MISSING] winston
call npm list jest 2>nul | find "jest" >nul && echo   [OK] jest || echo   [MISSING] jest
call npm list joi 2>nul | find "joi" >nul && echo   [OK] joi || echo   [MISSING] joi
call npm list nodemailer 2>nul | find "nodemailer" >nul && echo   [OK] nodemailer || echo   [MISSING] nodemailer
call npm list node-cron 2>nul | find "node-cron" >nul && echo   [OK] node-cron || echo   [MISSING] node-cron
call npm list pdfkit 2>nul | find "pdfkit" >nul && echo   [OK] pdfkit || echo   [MISSING] pdfkit

echo.
echo SYNTAX CHECK:
node -c src\index.js >nul 2>&1 && echo   [OK] src/index.js || echo   [ERROR] src/index.js
node -c src\services\logger.service.js >nul 2>&1 && echo   [OK] logger.service.js || echo   [ERROR] logger.service.js
node -c src\services\metrics.service.js >nul 2>&1 && echo   [OK] metrics.service.js || echo   [ERROR] metrics.service.js

echo.
echo INTEGRATION CHECKS:
findstr /M "require.*logger" src\index.js >nul && echo   [OK] Logger import || echo   [MISSING] Logger import
findstr /M "require.*metrics" src\index.js >nul && echo   [OK] Metrics import || echo   [MISSING] Metrics import
findstr /M "require.*pdf.routes" src\index.js >nul && echo   [OK] PDF routes import || echo   [MISSING] PDF routes import
findstr /M "require.*alert-cron" src\index.js >nul && echo   [OK] Cron import || echo   [MISSING] Cron import

echo.
echo ==================================
echo. VERIFICATION COMPLETE
echo ==================================
echo.
echo Next steps:
echo   1. npm run dev              [Start development server]
echo   2. npm test                 [Run unit tests]
echo   3. npm run test:coverage    [Coverage report]
echo.
pause
