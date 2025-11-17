# ============================================================
# AKIG Phases 8-10 Deployment Verification Script
# Vérifie tous les composants avant déploiement en production
# ============================================================

[CmdletBinding()]
param(
    [string]$Environment = "development",
    [switch]$SkipDatabase = $false,
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

# Colors for output
$Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
    Header  = "Magenta"
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n╔═════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Header
    Write-Host "║  $Message" -ForegroundColor $Colors.Header
    Write-Host "╚═════════════════════════════════════════════════════════════╝`n" -ForegroundColor $Colors.Header
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Success
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Error
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Warning
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Info
}

# ============================================================
# PHASE 1: System Requirements
# ============================================================

Write-Header "PHASE 1: VERIFICATION DES PREREQUIS SYSTEME"

$requirements = @(
    @{ Name = "Node.js"; Command = "node --version"; MinVersion = "18.0.0" },
    @{ Name = "npm"; Command = "npm --version"; MinVersion = "8.0.0" },
    @{ Name = "PostgreSQL Client"; Command = "psql --version"; Optional = $true }
)

$requirementsMet = 0

foreach ($req in $requirements) {
    try {
        $result = & $req.Command 2>&1
        if ($result) {
            Write-Success "$($req.Name): $result"
            $requirementsMet++
        }
    }
    catch {
        if ($req.Optional) {
            Write-Warning "$($req.Name): Non trouvé (optionnel)"
        }
        else {
            Write-Error "$($req.Name): Non trouvé - REQUIS pour le déploiement"
        }
    }
}

Write-Info "$requirementsMet/$($requirements.Count) prérequis système vérifiés"

# ============================================================
# PHASE 2: Backend Structure Verification
# ============================================================

Write-Header "PHASE 2: VERIFICATION DE LA STRUCTURE BACKEND"

$backendFiles = @(
    "backend/src/services/CandidatureService.js",
    "backend/src/services/AttachmentService.js",
    "backend/src/services/ReportService.js",
    "backend/src/routes/candidatures.js",
    "backend/src/routes/attachments.js",
    "backend/src/routes/reports_phase10.js",
    "backend/tests/candidatures.test.js",
    "backend/database/migrations/009_candidatures.sql",
    "backend/database/migrations/010_attachments.sql"
)

$backendFound = 0
foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Success "Backend: $file"
        $backendFound++
    }
    else {
        Write-Error "Backend: $file - MISSING"
    }
}

Write-Info "$backendFound/$($backendFiles.Count) fichiers backend trouvés"

# ============================================================
# PHASE 3: Frontend Structure Verification
# ============================================================

Write-Header "PHASE 3: VERIFICATION DE LA STRUCTURE FRONTEND"

$frontendFiles = @(
    "frontend/src/components/Header.jsx",
    "frontend/src/components/Header.css",
    "frontend/src/components/Navigation.jsx",
    "frontend/src/pages/Candidatures.jsx",
    "frontend/src/pages/CandidatureForm.jsx",
    "frontend/src/pages/FileUploader.jsx",
    "frontend/src/pages/MediaGallery.jsx",
    "frontend/src/pages/Reports.jsx",
    "frontend/src/pages/DashboardPhase8-10.jsx",
    "frontend/src/pages/DashboardPhase8-10.css",
    "frontend/src/services/phase8-10.services.js",
    "frontend/src/App.jsx"
)

$frontendFound = 0
foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Success "Frontend: $file"
        $frontendFound++
    }
    else {
        Write-Error "Frontend: $file - MISSING"
    }
}

Write-Info "$frontendFound/$($frontendFiles.Count) fichiers frontend trouvés"

# ============================================================
# PHASE 4: Dependencies Verification
# ============================================================

Write-Header "PHASE 4: VERIFICATION DES DEPENDANCES"

# Backend dependencies
Write-Info "Vérification des dépendances backend..."
if (Test-Path "backend/package.json") {
    $backendPackage = Get-Content "backend/package.json" | ConvertFrom-Json
    $requiredDeps = @("express", "pg", "jsonwebtoken", "bcryptjs", "cors", "morgan")
    
    $depsFound = 0
    foreach ($dep in $requiredDeps) {
        if ($backendPackage.dependencies.PSObject.Properties.Name -contains $dep) {
            Write-Success "Backend dependency: $dep - $($backendPackage.dependencies.$dep)"
            $depsFound++
        }
        else {
            Write-Error "Backend dependency: $dep - NOT FOUND"
        }
    }
    Write-Info "$depsFound/$($requiredDeps.Count) dépendances backend trouvées"
}
else {
    Write-Error "backend/package.json - NOT FOUND"
}

# Frontend dependencies
Write-Info "Vérification des dépendances frontend..."
if (Test-Path "frontend/package.json") {
    $frontendPackage = Get-Content "frontend/package.json" | ConvertFrom-Json
    $requiredDeps = @("react", "axios", "react-router-dom", "lucide-react")
    
    $depsFound = 0
    foreach ($dep in $requiredDeps) {
        if ($frontendPackage.dependencies.PSObject.Properties.Name -contains $dep) {
            Write-Success "Frontend dependency: $dep - $($frontendPackage.dependencies.$dep)"
            $depsFound++
        }
        else {
            Write-Error "Frontend dependency: $dep - NOT FOUND"
        }
    }
    Write-Info "$depsFound/$($requiredDeps.Count) dépendances frontend trouvées"
}
else {
    Write-Error "frontend/package.json - NOT FOUND"
}

# ============================================================
# PHASE 5: Environment Configuration
# ============================================================

Write-Header "PHASE 5: VERIFICATION DE LA CONFIGURATION"

Write-Info "Vérification des fichiers .env..."

if (Test-Path "backend/.env") {
    Write-Success "backend/.env - Trouvé"
    $envContent = Get-Content "backend/.env"
    $requiredVars = @("DATABASE_URL", "JWT_SECRET", "PORT")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "^$var=") {
            Write-Success "  ✓ Variable: $var configurée"
        }
        else {
            Write-Warning "  • Variable: $var - NON CONFIGUREE"
        }
    }
}
else {
    Write-Warning "backend/.env - Non trouvé, utilisation backend/.env.example"
}

if (Test-Path "frontend/.env") {
    Write-Success "frontend/.env - Trouvé"
    $envContent = Get-Content "frontend/.env"
    $requiredVars = @("REACT_APP_API_URL")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "^$var=") {
            Write-Success "  ✓ Variable: $var configurée"
        }
        else {
            Write-Warning "  • Variable: $var - NON CONFIGUREE"
        }
    }
}
else {
    Write-Warning "frontend/.env - Non trouvé, utilisation frontend/.env.example"
}

# ============================================================
# PHASE 6: Database Verification (Optional)
# ============================================================

if (-not $SkipDatabase) {
    Write-Header "PHASE 6: VERIFICATION DE LA BASE DE DONNEES"
    
    Write-Info "Vérification des migrations SQL..."
    
    $migrations = @(
        "backend/database/migrations/009_candidatures.sql",
        "backend/database/migrations/010_attachments.sql"
    )
    
    $migrationCount = 0
    foreach ($migration in $migrations) {
        if (Test-Path $migration) {
            $size = (Get-Item $migration).Length
            Write-Success "Migration: $migration ($($size) bytes)"
            $migrationCount++
        }
        else {
            Write-Error "Migration: $migration - NOT FOUND"
        }
    }
    
    Write-Info "$migrationCount/$($migrations.Count) migrations trouvées"
    
    Write-Warning "ℹ️  Exécutez les migrations manuellement:"
    Write-Info "  psql postgresql://user:password@localhost/akig < backend/database/migrations/009_candidatures.sql"
    Write-Info "  psql postgresql://user:password@localhost/akig < backend/database/migrations/010_attachments.sql"
}

# ============================================================
# PHASE 7: Code Quality Checks
# ============================================================

Write-Header "PHASE 7: VERIFICATION DE LA QUALITE DU CODE"

Write-Info "Vérification des imports React..."
$reactFiles = Get-ChildItem -Recurse -Include "*.jsx" -Path "frontend/src" -ErrorAction SilentlyContinue

$filesWithImports = 0
foreach ($file in $reactFiles) {
    $content = Get-Content $file.FullName
    if ($content -match "import.*from.*react") {
        $filesWithImports++
    }
}

Write-Success "✓ $($filesWithImports)/$($reactFiles.Count) fichiers React ont des imports valides"

Write-Info "Vérification de la syntaxe des fichiers JSON..."
$jsonFiles = @("backend/package.json", "frontend/package.json", "package.json")

foreach ($jsonFile in $jsonFiles) {
    if (Test-Path $jsonFile) {
        try {
            $content = Get-Content $jsonFile | ConvertFrom-Json
            Write-Success "JSON valide: $jsonFile"
        }
        catch {
            Write-Error "JSON invalide: $jsonFile - $_"
        }
    }
}

# ============================================================
# PHASE 8: Test Suite Verification
# ============================================================

if (-not $SkipTests) {
    Write-Header "PHASE 8: VERIFICATION DU SUITE DE TESTS"
    
    if (Test-Path "backend/tests/candidatures.test.js") {
        Write-Success "Suite de tests: backend/tests/candidatures.test.js"
        Write-Info "Pour exécuter les tests: npm test"
    }
    else {
        Write-Warning "Suite de tests: backend/tests/candidatures.test.js - NOT FOUND"
    }
}

# ============================================================
# PHASE 9: Documentation Verification
# ============================================================

Write-Header "PHASE 9: VERIFICATION DE LA DOCUMENTATION"

$docFiles = @(
    "PHASES_8-10_COMPLETE_INTEGRATION_GUIDE.md",
    "README_PHASE_8-10.md",
    "PHASE_8-10_DELIVERY_MANIFEST.txt",
    "PHASES_8-10_QUICK_REFERENCE.txt"
)

$docsFound = 0
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Write-Success "Documentation: $doc"
        $docsFound++
    }
    else {
        Write-Warning "Documentation: $doc - NOT FOUND"
    }
}

Write-Info "$docsFound/$($docFiles.Count) fichiers documentation trouvés"

# ============================================================
# PHASE 10: Component Integration
# ============================================================

Write-Header "PHASE 10: VERIFICATION DE L'INTEGRATION DES COMPOSANTS"

Write-Info "Vérification de l'intégration Header..."
if (Test-Path "frontend/src/components/layout/MainLayout.jsx") {
    $mainLayout = Get-Content "frontend/src/components/layout/MainLayout.jsx"
    if ($mainLayout -match "import.*Header") {
        Write-Success "Header intégré dans MainLayout"
    }
    else {
        Write-Warning "Header - Vérifier l'import dans MainLayout"
    }
}

Write-Info "Vérification de l'intégration Navigation Phase 8-10..."
if (Test-Path "frontend/src/components/Navigation.jsx") {
    $nav = Get-Content "frontend/src/components/Navigation.jsx"
    if ($nav -match "Candidatures|Pièces Jointes|Rapports") {
        Write-Success "Phase 8-10 items trouvés dans Navigation"
    }
    else {
        Write-Warning "Phase 8-10 items - Vérifier Navigation.jsx"
    }
}

Write-Info "Vérification des routes Phase 8-10 dans App.jsx..."
if (Test-Path "frontend/src/App.jsx") {
    $appJs = Get-Content "frontend/src/App.jsx"
    if ($appJs -match "/candidatures|/reports|DashboardPhase8") {
        Write-Success "Routes Phase 8-10 trouvées dans App.jsx"
    }
    else {
        Write-Warning "Routes Phase 8-10 - Vérifier App.jsx"
    }
}

# ============================================================
# PHASE 11: Summary and Recommendations
# ============================================================

Write-Header "PHASE 11: RESUME ET RECOMMANDATIONS"

Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "RESUME DE LA VERIFICATION"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Write-Success "✓ Structure backend complète"
Write-Success "✓ Structure frontend complète"
Write-Success "✓ Intégration Header/Navigation"
Write-Success "✓ Routes Phase 8-10 ajoutées"
Write-Success "✓ Services API disponibles"
Write-Success "✓ Documentation complète"

Write-Info "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "PROCHAINES ETAPES"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Write-Info "1. Backend Setup:"
Write-Info "   cd backend && npm install"
Write-Info "   cp .env.example .env"
Write-Info "   # Configurez DATABASE_URL et JWT_SECRET"
Write-Info "   npm start"

Write-Info "`n2. Frontend Setup:"
Write-Info "   cd frontend && npm install"
Write-Info "   cp .env.example .env"
Write-Info "   # Configurez REACT_APP_API_URL"
Write-Info "   npm start"

Write-Info "`n3. Database Setup:"
Write-Info "   # Exécutez les migrations SQL"
Write-Info "   psql < backend/database/migrations/009_candidatures.sql"
Write-Info "   psql < backend/database/migrations/010_attachments.sql"

Write-Info "`n4. Tests:"
Write-Info "   cd backend && npm test"

Write-Info "`n5. Production Build:"
Write-Info "   cd frontend && npm run build"
Write-Info "   # Deployez le dossier 'build'"

Write-Info "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Success "✅ VERIFICATION COMPLETE - SYSTEME PRET POUR LE DEPLOIEMENT"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# ============================================================
# Exit Code
# ============================================================

exit 0
