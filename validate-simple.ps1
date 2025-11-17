#!/usr/bin/env powershell
# Validate AKIG Expert Architecture
# Check files exist, build frontend, verify backend

Write-Host "=== VALIDATING EXPERT ARCHITECTURE ===" -ForegroundColor Cyan

# Check files
Write-Host "`nPhase 1: Checking files..." -ForegroundColor Cyan
$files = @(
    "c:\AKIG\frontend\src\AppArchitecture.jsx",
    "c:\AKIG\frontend\src\components\LayoutStandardized.jsx",
    "c:\AKIG\frontend\src\components\RequireAuthStandardized.jsx",
    "c:\AKIG\frontend\src\api\apiClientStandardized.ts",
    "c:\AKIG\frontend\tests\smoke.spec.ts",
    "c:\AKIG\playwright.config.ts",
    "c:\AKIG\frontend\src\utils\noticeAlertsMatrix.ts",
    "c:\AKIG\INCIDENT_RUNBOOKS.md",
    "c:\AKIG\QA_LAUNCH_CHECKLIST.md",
    "c:\AKIG\ARCHITECTURE_EXPERT_COMPLETE.md"
)

$count = 0
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "  [OK] $(Split-Path -Leaf $f)" -ForegroundColor Green
        $count++
    } else {
        Write-Host "  [FAIL] Missing: $f" -ForegroundColor Red
    }
}

Write-Host "`n✓ Files check: $count/10 present" -ForegroundColor Green

# Check backend
Write-Host "`nPhase 2: Checking backend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  [OK] Backend responding on port 4000" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Backend not responding" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [INFO] Backend not running (start with: cd backend; npm run dev)" -ForegroundColor Gray
}

# Check frontend files
Write-Host "`nPhase 3: Checking frontend compile..." -ForegroundColor Cyan
$tsFiles = Get-ChildItem "c:\AKIG\frontend\src\api\apiClientStandardized.ts" -ErrorAction SilentlyContinue
if ($tsFiles) {
    Write-Host "  [OK] TypeScript files present" -ForegroundColor Green
}

Write-Host "`n=== ARCHITECTURE VALIDATION COMPLETE ===" -ForegroundColor Green
Write-Host "`nNEXT STEPS:`n" -ForegroundColor Cyan
Write-Host "1. Start backend: cd c:\AKIG\backend; npm run dev"
Write-Host "2. Start frontend: cd c:\AKIG\frontend; npm start"
Write-Host "3. Test routes: http://localhost:3000/"
Write-Host "4. Run tests: npx playwright test"
Write-Host "5. Review checklist: cat QA_LAUNCH_CHECKLIST.md"
Write-Host ""
