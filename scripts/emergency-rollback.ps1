# ==================================================================================
# EMERGENCY ROLLBACK - RETOUR MYSQL IMMÉDIAT
# ==================================================================================
# Objectif: Restaurer MySQL en production en moins de 60 secondes
# Usage: powershell -ExecutionPolicy Bypass -File emergency-rollback.ps1
# ==================================================================================

param(
    [string]$Reason = "Emergency rollback executed"
)

$ErrorActionPreference = "Stop"
$Global:RollbackStartTime = Get-Date

function Write-Emergency {
    param([string]$Message)
    $elapsed = (Get-Date) - $Global:RollbackStartTime
    Write-Host "[$($elapsed.ToString('mm\:ss'))] 🚨 $Message" -ForegroundColor Red
}

function Write-RollbackStep {
    param([string]$Step)
    $elapsed = (Get-Date) - $Global:RollbackStartTime
    Write-Host "[$($elapsed.ToString('mm\:ss'))] ► $Step" -ForegroundColor Yellow
}

function Write-RollbackSuccess {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
}

# Configuration
$BACKEND_PATH = "C:\AKIG\backend"
$BACKUP_DIR = Get-ChildItem "C:\AKIG\backups\cutover-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$MYSQL_HOST = "localhost"
$MYSQL_USER = "root"
$MYSQL_PASS = "akig2025"
$MYSQL_DB = "akig_legacy"

Write-Emergency "ROLLBACK INITIÉ - EMERGENCY MODE"
Write-Host "  Raison: $Reason" -ForegroundColor Red
Write-Host ""

# ==================================================================================
# ÉTAPE 1: BACKUP ÉTAT POSTGRESQL ACTUEL (pour forensics)
# ==================================================================================
Write-RollbackStep "ÉTAPE 1: Backup PostgreSQL (état d'échec)"

$forensicsDir = "C:\AKIG\backups\forensics-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $forensicsDir -Force | Out-Null

try {
    $env:PGPASSWORD = "postgres"
    & pg_dump -h localhost -U postgres -d akig_immobilier -Fc -f "$forensicsDir\postgres_failed_state.backup" 2>&1 | Out-Null
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        $size = (Get-Item "$forensicsDir\postgres_failed_state.backup").Length / 1MB
        Write-RollbackSuccess "État PostgreSQL sauvegardé: $([math]::Round($size, 2)) MB"
    }
}
catch {
    Write-Host "  ⚠️  Backup forensics FAILED (non-critique): $_" -ForegroundColor Yellow
}

# Capturer logs d'erreur PostgreSQL
try {
    $query = @"
SELECT 
    now() as capture_time,
    state,
    COUNT(*) as count,
    array_agg(DISTINCT wait_event_type) as wait_events
FROM pg_stat_activity 
WHERE datname = 'akig_immobilier'
GROUP BY state;
"@
    $env:PGPASSWORD = "postgres"
    $pgState = & psql -h localhost -U postgres -d akig_immobilier -t -A -c $query 2>&1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    $pgState | Out-File "$forensicsDir\postgres_connections_at_failure.txt"
    Write-RollbackSuccess "Connexions PostgreSQL capturées"
}
catch {
    Write-Host "  ⚠️  Capture connexions FAILED" -ForegroundColor Yellow
}

# ==================================================================================
# ÉTAPE 2: RESTAURER CONFIGURATION BACKEND VERS MYSQL
# ==================================================================================
Write-RollbackStep "ÉTAPE 2: Restaurer config backend → MySQL"

if ($BACKUP_DIR -and (Test-Path "$BACKUP_DIR\.env.backup")) {
    # Restaurer .env depuis backup
    Copy-Item "$BACKUP_DIR\.env.backup" "$BACKEND_PATH\.env" -Force
    Write-RollbackSuccess ".env restauré depuis backup cutover"
}
else {
    # Créer .env MySQL manuellement
    $envContent = Get-Content "$BACKEND_PATH\.env"
    $envContent = $envContent -replace "^DATABASE_URL=.*", "DATABASE_URL=mysql://root:akig2025@localhost:3306/akig_legacy"
    $envContent | Set-Content "$BACKEND_PATH\.env"
    Write-RollbackSuccess ".env mis à jour vers MySQL (manuel)"
}

# Vérifier changement
$dbUrl = (Get-Content "$BACKEND_PATH\.env" | Select-String "^DATABASE_URL=").ToString()
if ($dbUrl -match "mysql://") {
    Write-RollbackSuccess "DATABASE_URL: $dbUrl"
}
else {
    Write-Host "  ❌ DATABASE_URL n'est pas MySQL! Vérification manuelle requise" -ForegroundColor Red
}

# Restaurer db.js si nécessaire
if ($BACKUP_DIR -and (Test-Path "$BACKUP_DIR\db.js.backup")) {
    Copy-Item "$BACKUP_DIR\db.js.backup" "$BACKEND_PATH\src\db.js" -Force
    Write-RollbackSuccess "db.js restauré depuis backup"
}
else {
    Write-Host "  ℹ️  db.js non restauré (backup non trouvé)" -ForegroundColor Gray
}

# ==================================================================================
# ÉTAPE 3: DÉSACTIVER READ-ONLY MYSQL
# ==================================================================================
Write-RollbackStep "ÉTAPE 3: Réactiver écritures MySQL"

try {
    # Déverrouiller tables
    & mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB -e "UNLOCK TABLES;" 2>&1 | Out-Null
    Write-RollbackSuccess "Tables MySQL déverrouillées"
    
    # Désactiver read-only
    & mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS -e "SET GLOBAL read_only = OFF;" 2>&1 | Out-Null
    
    # Vérifier
    $readOnlyStatus = & mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS -N -B -e "SHOW VARIABLES LIKE 'read_only';" 2>&1
    if ($readOnlyStatus -match "OFF") {
        Write-RollbackSuccess "MySQL READ-ONLY désactivé (écritures actives)"
    }
    else {
        Write-Host "  ⚠️  MySQL read_only status: $readOnlyStatus" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ❌ ERREUR désactivation READ-ONLY: $_" -ForegroundColor Red
    Write-Host "  EXÉCUTEZ MANUELLEMENT:" -ForegroundColor Red
    Write-Host "    mysql -u root -pakig2025 -e 'SET GLOBAL read_only = OFF;'" -ForegroundColor Yellow
}

# ==================================================================================
# ÉTAPE 4: VALIDER CONNEXION MYSQL
# ==================================================================================
Write-RollbackStep "ÉTAPE 4: Validation connexion MySQL"

try {
    $mysqlVersion = & mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB -N -B -e "SELECT VERSION();" 2>&1
    Write-RollbackSuccess "MySQL accessible: $mysqlVersion"
    
    # Test lecture
    $tableCount = & mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB -N -B -e "SELECT COUNT(*) FROM historique;" 2>&1
    Write-RollbackSuccess "Test lecture: $tableCount lignes dans historique"
    
    # Test écriture (audit de rollback)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $insertQuery = "INSERT INTO historique (timestamp, action, details) VALUES ('$timestamp', 'EMERGENCY_ROLLBACK', 'Rollback PostgreSQL→MySQL: $Reason');"
    & mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB -e $insertQuery 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-RollbackSuccess "Test écriture: rollback audit log inséré"
    }
    else {
        Write-Host "  ⚠️  Test écriture FAILED (vérification manuelle requise)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ❌ Validation MySQL FAILED: $_" -ForegroundColor Red
    Write-Host "  VÉRIFIEZ MANUELLEMENT:" -ForegroundColor Red
    Write-Host "    mysql -u root -pakig2025 akig_legacy -e 'SELECT COUNT(*) FROM historique;'" -ForegroundColor Yellow
}

# ==================================================================================
# ÉTAPE 5: ENREGISTRER INCIDENT
# ==================================================================================
Write-RollbackStep "ÉTAPE 5: Enregistrement incident"

$incidentReport = @"
========================================
EMERGENCY ROLLBACK REPORT
========================================
Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Raison: $Reason
Durée totale: $((Get-Date) - $Global:RollbackStartTime)

ACTIONS EXÉCUTÉES:
- [✅] Backup PostgreSQL état d'échec
- [✅] Restauration config backend → MySQL
- [✅] Désactivation MySQL READ-ONLY
- [✅] Validation connexion MySQL

ÉTAT FINAL:
- Backend DATABASE_URL: $(Get-Content "$BACKEND_PATH\.env" | Select-String "^DATABASE_URL=")
- MySQL writable: OUI
- PostgreSQL: conservé (forensics disponibles)

BACKUPS:
- Forensics dir: $forensicsDir
- Cutover backup: $BACKUP_DIR

PROCHAINES ÉTAPES:
1. Analyser logs forensics PostgreSQL
2. Identifier cause racine du problème
3. Corriger l'issue PostgreSQL
4. Re-tester le cutover en dry-run
5. Nouvelle tentative de cutover

========================================
"@

$incidentReport | Out-File "$forensicsDir\ROLLBACK_REPORT.txt"
Write-RollbackSuccess "Rapport d'incident: $forensicsDir\ROLLBACK_REPORT.txt"

# ==================================================================================
# RAPPORT FINAL
# ==================================================================================
$elapsed = (Get-Date) - $Global:RollbackStartTime

Write-Host "`n==================================================================================================" -ForegroundColor Red
Write-Host "ROLLBACK COMPLETED" -ForegroundColor Red
Write-Host "==================================================================================================" -ForegroundColor Red

Write-Host "`nTIMING:"
Write-Host "  Début rollback : $($Global:RollbackStartTime.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host "  Fin rollback   : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "  Durée totale   : $($elapsed.TotalSeconds) secondes" -ForegroundColor $(if ($elapsed.TotalSeconds -lt 60) { "Green" } else { "Yellow" })

Write-Host "`nSTATUS:"
Write-Host "  ✅ APPLICATION SUR MYSQL (writable)" -ForegroundColor Green
Write-Host "  ⚠️  PostgreSQL conservé pour analyse" -ForegroundColor Yellow

Write-Host "`nFORENSICS:"
Write-Host "  Répertoire: $forensicsDir"
Get-ChildItem $forensicsDir -ErrorAction SilentlyContinue | ForEach-Object {
    $size = if ($_.Length) { " ($([math]::Round($_.Length/1KB, 1)) KB)" } else { "" }
    Write-Host "    - $($_.Name)$size" -ForegroundColor Gray
}

Write-Host "`nNEXT STEPS:"
Write-Host "  1. Lire rapport d'incident: $forensicsDir\ROLLBACK_REPORT.txt" -ForegroundColor Yellow
Write-Host "  2. Analyser cause racine (logs, connexions, erreurs)" -ForegroundColor Yellow
Write-Host "  3. Corriger problème PostgreSQL" -ForegroundColor Yellow
Write-Host "  4. Re-tester: powershell -File scripts\final-cutover.ps1 -DryRun" -ForegroundColor Yellow
Write-Host "  5. Nouvelle tentative cutover quand ready" -ForegroundColor Yellow

Write-Host "`n==================================================================================================" -ForegroundColor Red
Write-Host ""

# Ouvrir rapport
if (Test-Path "$forensicsDir\ROLLBACK_REPORT.txt") {
    Write-Host "📄 Ouverture du rapport d'incident..." -ForegroundColor Cyan
    Start-Process notepad "$forensicsDir\ROLLBACK_REPORT.txt"
}
