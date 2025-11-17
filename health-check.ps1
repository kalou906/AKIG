# AKIG - Health Check Script

Write-Host "AKIG Health Check" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

$pass = 0
$fail = 0

# Check 1: Node.js
try {
    $v = & node --version 2>$null
    Write-Host "OK Node.js: $v" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "FAIL Node.js not installed" -ForegroundColor Red
    $fail++
}

# Check 2: npm
try {
    $v = & npm --version 2>$null
    Write-Host "OK npm: $v" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "FAIL npm not installed" -ForegroundColor Red
    $fail++
}

# Check 3: Backend node_modules
if (Test-Path "backend/node_modules") {
    Write-Host "OK Backend dependencies" -ForegroundColor Green
    $pass++
} else {
    Write-Host "WARN Backend dependencies missing" -ForegroundColor Yellow
}

# Check 4: Frontend (Tailwind) node_modules
if (Test-Path "frontend-tailwind/node_modules") {
    Write-Host "OK Frontend Tailwind dependencies" -ForegroundColor Green
    $pass++
} else {
    Write-Host "WARN Frontend Tailwind dependencies missing" -ForegroundColor Yellow
}

# Check 5: Frontend (Ultimate) node_modules
if (Test-Path "akig-ultimate/node_modules") {
    Write-Host "OK Ultimate frontend dependencies" -ForegroundColor Green
    $pass++
} else {
    Write-Host "WARN Ultimate frontend dependencies missing" -ForegroundColor Yellow
}

# Check 6: Backend .env
if (Test-Path "backend/.env") {
    Write-Host "OK Backend configuration" -ForegroundColor Green
    $pass++
} else {
    Write-Host "WARN Backend .env missing" -ForegroundColor Yellow
}

# Check 7: Frontend Tailwind .env.local
if (Test-Path "frontend-tailwind/.env.local") {
    Write-Host "OK Frontend Tailwind configuration" -ForegroundColor Green
    $pass++
} else {
    Write-Host "WARN Frontend Tailwind .env.local missing" -ForegroundColor Yellow
}

# Check 8: Backend service health (if running)
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4002/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "OK Backend service (port 4002)" -ForegroundColor Green
        $pass++
    } else {
        Write-Host "WARN Backend not responding correctly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "INFO Backend service not running (expected if not started)" -ForegroundColor Cyan
}

# Check 9: Frontend service health (if running)
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "OK Frontend service (port 5173)" -ForegroundColor Green
        $pass++
    } else {
        Write-Host "WARN Frontend not responding correctly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "INFO Frontend service not running (expected if not started)" -ForegroundColor Cyan
}

# Check 10: Docker (optional)
try {
    $v = & docker --version 2>$null
    Write-Host "OK Docker: $v" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "INFO Docker not installed (optional for local dev)" -ForegroundColor Cyan
}

# Check 11: Docker Compose (optional)
try {
    $v = & docker-compose --version 2>$null
    Write-Host "OK Docker Compose: $v" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "INFO Docker Compose not installed (optional)" -ForegroundColor Cyan
}

# Check 12: Key files
$files = @(
    "README.md",
    "QUICK_START.md",
    "DEPLOYMENT_CHECKLIST.md",
    "docker-compose.yml",
    "verify-setup.sh"
)

$fileCount = 0
foreach ($f in $files) {
    if (Test-Path $f) { $fileCount++ }
}

Write-Host "OK Documentation: $fileCount/$($files.Count) files" -ForegroundColor Green
$pass++

Write-Host ""
Write-Host "Summary: $pass passed, $fail failed" -ForegroundColor Cyan
Write-Host ""

if ($fail -eq 0) {
    Write-Host "✅ AKIG System Ready for Development" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Terminal 1: cd backend && npm run dev" -ForegroundColor Cyan
    Write-Host "  2. Terminal 2: cd frontend-tailwind && npm run dev" -ForegroundColor Cyan
    Write-Host "  3. Access frontend at: http://localhost:5173" -ForegroundColor Green
    Write-Host "  4. Backend API at: http://localhost:4002/api" -ForegroundColor Green
    Write-Host "  5. Swagger docs at: http://localhost:4002/api-docs" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  Please fix the errors above" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. npm install in backend/ frontend-tailwind/ akig-ultimate/" -ForegroundColor White
    Write-Host "  2. Create .env files in backend/ and frontend-tailwind/" -ForegroundColor White
    Write-Host "  3. Ensure Node.js 18+ is installed" -ForegroundColor White
}
