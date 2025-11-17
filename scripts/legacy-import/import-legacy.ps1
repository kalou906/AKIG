# AKIG - Script d'Import Automatisé des Données Legacy
# Automatise les 3 étapes : Analyse → Validation → Import

param(
    [Parameter(Mandatory = $true)]
    [string]$ArchivePath,
    
    [Parameter(Mandatory = $false)]
    [string]$DatabaseUrl = $env:DATABASE_URL,
    
    [Parameter(Mandatory = $false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipValidation = $false
)

# Configuration
$ScriptDir = "c:\AKIG\scripts\legacy-import"
$DataDir = "c:\AKIG\data"

# Couleurs
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Step { Write-Host "`n===================================" -ForegroundColor Magenta; Write-Host $args -ForegroundColor Magenta; Write-Host "===================================`n" -ForegroundColor Magenta }

# Banner
Clear-Host
Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║       🔄 AKIG - IMPORT AUTOMATISÉ DONNÉES LEGACY             ║
║                                                               ║
║   Analyse → Catégorisation → Validation → Import             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Vérifications préalables
Write-Step "🔍 VÉRIFICATIONS PRÉALABLES"

# Vérifier que l'archive existe
if (-not (Test-Path $ArchivePath)) {
    Write-Error "❌ Archive introuvable: $ArchivePath"
    exit 1
}
Write-Success "✓ Archive trouvée: $ArchivePath"

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "✓ Python détecté: $pythonVersion"
}
catch {
    Write-Error "❌ Python non installé ou non dans le PATH"
    exit 1
}

# Vérifier psycopg2
try {
    python -c "import psycopg2" 2>&1 | Out-Null
    Write-Success "✓ psycopg2 installé"
}
catch {
    Write-Warning "⚠️  psycopg2 non installé, installation..."
    pip install psycopg2-binary
}

# Vérifier DATABASE_URL si pas dry-run
if (-not $DryRun -and -not $DatabaseUrl) {
    Write-Error "❌ DATABASE_URL non défini. Définissez la variable d'environnement ou utilisez -DatabaseUrl"
    Write-Info "   Exemple: -DatabaseUrl 'postgresql://user:pass@localhost:5432/akig_db'"
    exit 1
}

if ($DatabaseUrl) {
    Write-Success "✓ Base de données configurée"
}

# Créer les répertoires nécessaires
if (-not (Test-Path $ScriptDir)) {
    New-Item -ItemType Directory -Path $ScriptDir -Force | Out-Null
}
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

# ========================================
# ÉTAPE 1 : ANALYSE DE L'ARCHIVE
# ========================================
Write-Step "📊 ÉTAPE 1/3 : ANALYSE DE L'ARCHIVE"

$analysisReport = "$ScriptDir\analysis-report.json"

Write-Info "🔍 Analyse en cours..."
python "$ScriptDir\analyze-archive.py" $ArchivePath

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erreur lors de l'analyse"
    exit 1
}

if (-not (Test-Path $analysisReport)) {
    Write-Error "❌ Rapport d'analyse non généré"
    exit 1
}

Write-Success "✅ Analyse terminée avec succès"
Write-Info "📄 Rapport: $analysisReport"

# Lire le rapport pour afficher un résumé
$analysis = Get-Content $analysisReport -Raw | ConvertFrom-Json

Write-Host "`n📊 RÉSUMÉ DE L'ANALYSE:" -ForegroundColor Yellow
Write-Host "  • Format détecté: $($analysis.format)" -ForegroundColor White
Write-Host "  • Catégories trouvées: $($analysis.categories.PSObject.Properties.Count)" -ForegroundColor White

foreach ($category in $analysis.categories.PSObject.Properties) {
    $name = $category.Name
    $info = $category.Value
    
    if ($info.count) {
        Write-Host "    - $name : $($info.count) enregistrements" -ForegroundColor Gray
    }
    else {
        Write-Host "    - $name" -ForegroundColor Gray
    }
}

# Pause pour vérification
Write-Host "`n"
Read-Host "Appuyez sur Entrée pour continuer vers la validation..."

# ========================================
# ÉTAPE 2 : CATÉGORISATION ET VALIDATION
# ========================================
Write-Step "🏷️  ÉTAPE 2/3 : CATÉGORISATION ET VALIDATION"

if ($SkipValidation) {
    Write-Warning "⚠️  Validation ignorée (--SkipValidation)"
}
else {
    $validationReport = "$ScriptDir\validation-report.json"
    $categorizedDir = "$ScriptDir\categorized-data"

    Write-Info "🔍 Validation et catégorisation en cours..."
    python "$ScriptDir\categorize-data.py" $analysisReport

    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Erreur lors de la validation"
        exit 1
    }

    if (-not (Test-Path $validationReport)) {
        Write-Error "❌ Rapport de validation non généré"
        exit 1
    }

    Write-Success "✅ Validation terminée avec succès"
    Write-Info "📄 Rapport: $validationReport"

    # Lire le rapport de validation
    $validation = Get-Content $validationReport -Raw | ConvertFrom-Json

    Write-Host "`n📊 RÉSUMÉ DE LA VALIDATION:" -ForegroundColor Yellow
    Write-Host "  • Total enregistrements: $($validation.total_records)" -ForegroundColor White
    Write-Host "  • Valides: $($validation.valid_records) ($([math]::Round($validation.valid_records / $validation.total_records * 100, 1))%)" -ForegroundColor Green
    Write-Host "  • Invalides: $($validation.invalid_records)" -ForegroundColor Red
    Write-Host "  • Avertissements: $($validation.warnings_count)" -ForegroundColor Yellow

    Write-Host "`n📂 PAR CATÉGORIE:" -ForegroundColor Yellow
    foreach ($category in $validation.by_category.PSObject.Properties) {
        $name = $category.Name
        $stats = $category.Value
        $successRate = [math]::Round($stats.valid / $stats.total * 100, 1)
        
        $color = "Green"
        if ($successRate -lt 95) { $color = "Yellow" }
        if ($successRate -lt 80) { $color = "Red" }
        
        Write-Host "  • $name : $($stats.valid)/$($stats.total) ($successRate%)" -ForegroundColor $color
    }

    # Vérifier le taux de succès global
    $globalSuccessRate = $validation.valid_records / $validation.total_records * 100
    
    if ($globalSuccessRate -lt 80) {
        Write-Warning "`n⚠️  ATTENTION: Taux de succès faible ($([math]::Round($globalSuccessRate, 1))%)"
        Write-Warning "   Vérifiez le rapport de validation avant de continuer"
        
        $response = Read-Host "`nContinuer malgré tout ? (O/N)"
        if ($response -ne "O" -and $response -ne "o") {
            Write-Info "Import annulé"
            exit 0
        }
    }
}

# Pause avant import
Write-Host "`n"
if ($DryRun) {
    Write-Warning "MODE DRY-RUN: L'import sera simulé sans modification de la base"
}
Read-Host "Appuyez sur Entrée pour lancer l'import..."

# ========================================
# ÉTAPE 3 : IMPORT DANS POSTGRESQL
# ========================================
Write-Step "💾 ÉTAPE 3/3 : IMPORT DANS POSTGRESQL"

$categorizedDir = "$ScriptDir\categorized-data"

if (-not (Test-Path $categorizedDir)) {
    Write-Error "❌ Répertoire de données catégorisées introuvable: $categorizedDir"
    exit 1
}

$importArgs = @($DatabaseUrl, $categorizedDir)
if ($DryRun) {
    $importArgs += "--dry-run"
    Write-Warning "🔄 MODE DRY-RUN activé"
}

Write-Info "🔄 Import en cours..."
python "$ScriptDir\import-to-postgres.py" @importArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erreur lors de l'import"
    exit 1
}

$importReport = "$ScriptDir\import-report.json"

if (Test-Path $importReport) {
    $import = Get-Content $importReport -Raw | ConvertFrom-Json
    
    Write-Host "`n📊 RÉSUMÉ DE L'IMPORT:" -ForegroundColor Yellow
    
    $totalImported = 0
    $totalErrors = 0
    
    foreach ($category in $import.imported.PSObject.Properties) {
        $name = $category.Name
        $stats = $category.Value
        $totalImported += $stats.count
        $totalErrors += $stats.errors
        
        Write-Host "  • $name → $($stats.table): $($stats.count) enregistrements" -ForegroundColor Green
        if ($stats.errors -gt 0) {
            Write-Host "    ⚠️  $($stats.errors) erreurs" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n  TOTAL IMPORTÉ: $totalImported enregistrements" -ForegroundColor Green
    if ($totalErrors -gt 0) {
        Write-Host "  TOTAL ERREURS: $totalErrors" -ForegroundColor Yellow
    }
}

# ========================================
# RÉSUMÉ FINAL
# ========================================
Write-Host "`n"
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║                  ✨ IMPORT TERMINÉ AVEC SUCCÈS !              ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📁 FICHIERS GÉNÉRÉS:" -ForegroundColor Yellow
Write-Host "  • $analysisReport" -ForegroundColor Gray
Write-Host "  • $validationReport" -ForegroundColor Gray
Write-Host "  • $importReport" -ForegroundColor Gray
Write-Host "  • $categorizedDir\ (fichiers JSON)" -ForegroundColor Gray

Write-Host "`n🎯 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "  1. Vérifier les données dans PostgreSQL" -ForegroundColor White
Write-Host "  2. Exécuter les tests de cohérence" -ForegroundColor White
Write-Host "  3. Tester l'application avec les nouvelles données" -ForegroundColor White
Write-Host "  4. Former les utilisateurs" -ForegroundColor White

if ($DryRun) {
    Write-Host "`n⚠️  RAPPEL: Ceci était un DRY-RUN" -ForegroundColor Yellow
    Write-Host "   Relancez sans --DryRun pour importer réellement les données" -ForegroundColor Yellow
}

Write-Host ""
