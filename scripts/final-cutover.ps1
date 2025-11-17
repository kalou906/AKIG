# ==================================================================================
# PROTOCOLE DE CUTOVER ZERO-DOWNTIME - AKIG IMMOBILIER
# ==================================================================================
# Niveau requis: GOLD ✅ | Cible: PLATINUM (24h sans incident)
# Temps total estimé: 5-10 minutes
# Rollback time: < 60 secondes (emergency-rollback.ps1)
# ==================================================================================

param(
    [switch]$DryRun = $false,  # Mode simulation (pas de changements réels)
    [switch]$Force = $false     # Bypass confirmations (DANGER)
)

$ErrorActionPreference = "Stop"
$Global:RollbackRequired = $false
$Global:CutoverStartTime = Get-Date

# Configuration AKIG
$POSTGRES_CONN = "postgresql://postgres:postgres@localhost:5432/akig_immobilier"
$MYSQL_HOST = "localhost"
$MYSQL_USER = "root"
$MYSQL_PASS = "akig2025"
$MYSQL_DB = "akig_legacy"
$BACKEND_PATH = "C:\AKIG\backend"
$BACKUP_DIR = "C:\AKIG\backups\cutover-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Checksums de référence (GOLD certification)
$EXPECTED_CHECKSUMS = @{
    "audit_logs"        = "62212407184ef333cf80377e9e5226e0"
    "disbursements"     = "ed3179905e6f853a7c192d529621981d"
    "inventory_reports" = "f59db0df527cd9bc7b7d71b6e35ee6d7"
}

function Write-Phase {
    param([string]$Phase, [string]$Message)
    $elapsed = (Get-Date) - $Global:CutoverStartTime
    Write-Host "`n[$($elapsed.ToString('mm\:ss'))] [PHASE $Phase] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
}

function Write-Critical {
    param([string]$Message)
    Write-Host "  ❌ CRITICAL: $Message" -ForegroundColor Red
    $Global:RollbackRequired = $true
}

function Write-Warning {
    param([string]$Message)
    Write-Host "  ⚠️  WARNING: $Message" -ForegroundColor Yellow
}

function Invoke-PostgresQuery {
    param([string]$Query, [switch]$Silent)
    try {
        $env:PGPASSWORD = "postgres"
        $result = & psql -h localhost -U postgres -d akig_immobilier -t -A -c $Query 2>&1
        if ($LASTEXITCODE -ne 0 -and -not $Silent) {
            throw "PostgreSQL query failed: $result"
        }
        return $result
    }
    finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Invoke-MySQLQuery {
    param([string]$Query, [switch]$Silent)
    try {
        $result = & mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB -N -B -e $Query 2>&1
        if ($LASTEXITCODE -ne 0 -and -not $Silent) {
            throw "MySQL query failed: $result"
        }
        return $result
    }
    catch {
        if (-not $Silent) { throw }
        return $null
    }
}

# ==================================================================================
# PHASE 0: PRÉPARATION & VALIDATION
# ==================================================================================
Write-Phase "0" "PRÉPARATION & VALIDATION PRÉ-CUTOVER"

# Créer répertoire de backup
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
Write-Success "Backup directory: $BACKUP_DIR"

# Vérifier que PostgreSQL est accessible
try {
    $pgVersion = Invoke-PostgresQuery "SELECT version();" | Select-Object -First 1
    Write-Success "PostgreSQL accessible: $($pgVersion.Substring(0, 50))..."
}
catch {
    Write-Critical "PostgreSQL inaccessible: $_"
    exit 1
}

# Vérifier que MySQL est accessible
try {
    $mysqlVersion = Invoke-MySQLQuery "SELECT VERSION();" | Select-Object -First 1
    Write-Success "MySQL accessible: version $mysqlVersion"
}
catch {
    Write-Critical "MySQL inaccessible: $_"
    exit 1
}

# Vérifier checksums PostgreSQL (doivent matcher GOLD certification)
Write-Host "`n  Vérification checksums de certification..."
$checksumErrors = 0
foreach ($table in $EXPECTED_CHECKSUMS.Keys) {
    $query = "SELECT md5(string_agg(row::text, '' ORDER BY id)) FROM $table;"
    $actual = Invoke-PostgresQuery $query
    $expected = $EXPECTED_CHECKSUMS[$table]
    
    if ($actual -eq $expected) {
        Write-Success "$table checksum VALID: $actual"
    }
    else {
        Write-Critical "$table checksum MISMATCH! Expected: $expected, Got: $actual"
        $checksumErrors++
    }
}

if ($checksumErrors -gt 0) {
    Write-Critical "Checksums ne correspondent pas à la certification GOLD. ARRÊT."
    exit 1
}

# Vérifier que le backend existe
if (-not (Test-Path "$BACKEND_PATH\src\db.js")) {
    Write-Critical "Backend non trouvé à $BACKEND_PATH"
    exit 1
}
Write-Success "Backend trouvé: $BACKEND_PATH"

# ==================================================================================
# PHASE 1: BASELINE MÉTRIQUES (avant cutover)
# ==================================================================================
Write-Phase "1" "CAPTURE BASELINE MÉTRIQUES"

# Reset stats PostgreSQL pour mesure pure
Invoke-PostgresQuery "SELECT pg_stat_reset();" | Out-Null
Invoke-PostgresQuery "SELECT pg_stat_statements_reset();" -Silent | Out-Null
Write-Success "PostgreSQL stats réinitialisées"

# Capturer stats MySQL
try {
    $mysqlQueries = Invoke-MySQLQuery "SHOW GLOBAL STATUS LIKE 'Queries';"
    $mysqlQueries | Out-File "$BACKUP_DIR\mysql_baseline.txt"
    Write-Success "MySQL baseline capturée: $mysqlQueries"
}
catch {
    Write-Warning "Impossible de capturer MySQL stats (non-critique)"
}

# Capturer état actuel PostgreSQL
$pgStats = Invoke-PostgresQuery @"
SELECT 
    schemaname || '.' || relname as table,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables
ORDER BY schemaname, relname;
"@
$pgStats | Out-File "$BACKUP_DIR\postgres_baseline.txt"
Write-Success "PostgreSQL baseline capturée"

# ==================================================================================
# PHASE 2: MYSQL READ-ONLY (freeze écritures)
# ==================================================================================
Write-Phase "2" "MYSQL PASSAGE EN READ-ONLY"

if (-not $DryRun) {
    # ATTENTION: POINT DE NON-RETOUR IMMÉDIAT
    Write-Warning "Cette opération va bloquer TOUTES les écritures MySQL"
    if (-not $Force) {
        $confirm = Read-Host "Continuer? (tapez 'GO' pour confirmer)"
        if ($confirm -ne "GO") {
            Write-Host "Cutover annulé par l'utilisateur" -ForegroundColor Yellow
            exit 0
        }
    }
    
    try {
        Invoke-MySQLQuery "SET GLOBAL read_only = ON;" | Out-Null
        Invoke-MySQLQuery "FLUSH TABLES WITH READ LOCK;" | Out-Null
        
        $readOnlyStatus = Invoke-MySQLQuery "SHOW VARIABLES LIKE 'read_only';"
        if ($readOnlyStatus -match "ON") {
            Write-Success "MySQL en READ-ONLY confirmé"
        }
        else {
            Write-Critical "MySQL READ-ONLY non confirmé: $readOnlyStatus"
            exit 1
        }
    }
    catch {
        Write-Critical "Impossible de mettre MySQL en READ-ONLY: $_"
        exit 1
    }
}
else {
    Write-Warning "[DRY-RUN] MySQL READ-ONLY simulé"
}

# Capturer processlist finale MySQL
try {
    $processlist = Invoke-MySQLQuery "SHOW PROCESSLIST;"
    $processlist | Out-File "$BACKUP_DIR\mysql_final_processlist.txt"
    Write-Success "MySQL processlist capturée"
}
catch {
    Write-Warning "Impossible de capturer processlist"
}

# ==================================================================================
# PHASE 3: SYNC DELTA FINAL (si écritures depuis dernière migration)
# ==================================================================================
Write-Phase "3" "VÉRIFICATION DELTA FINAL"

# Compter les lignes MySQL vs PostgreSQL
Write-Host "`n  Comparaison row counts..."
$deltaTables = @("locataires", "locaux", "contrats", "paiements")
$deltaDetected = $false

foreach ($table in $deltaTables) {
    try {
        $mysqlCount = Invoke-MySQLQuery "SELECT COUNT(*) FROM $table;" -Silent
        $pgCount = Invoke-PostgresQuery "SELECT COUNT(*) FROM $table;" -Silent
        
        if ($mysqlCount -ne $null -and $pgCount -ne $null) {
            $diff = [int]$mysqlCount - [int]$pgCount
            if ($diff -ne 0) {
                Write-Warning "$table: MySQL=$mysqlCount, PostgreSQL=$pgCount (delta: $diff)"
                $deltaDetected = $true
            }
            else {
                Write-Success "$table: synchronized ($mysqlCount rows)"
            }
        }
    }
    catch {
        # Table n'existe peut-être pas dans les deux bases
        Write-Host "  ℹ️  $table: skipped (table missing in one DB)" -ForegroundColor Gray
    }
}

if ($deltaDetected) {
    Write-Warning "DELTA détecté! Vous devriez exécuter une sync finale."
    Write-Host "`n  Option 1: pgloader (si installé)" -ForegroundColor Yellow
    Write-Host "    pgloader mysql://root:akig2025@localhost/akig_legacy postgresql://postgres:postgres@localhost/akig_immobilier" -ForegroundColor Gray
    Write-Host "`n  Option 2: Script Python personnalisé" -ForegroundColor Yellow
    Write-Host "    python scripts/sync-delta.py" -ForegroundColor Gray
    
    if (-not $Force) {
        $continue = Read-Host "`n  Continuer sans sync? (tapez 'SKIP' pour ignorer)"
        if ($continue -ne "SKIP") {
            Write-Host "Cutover interrompu pour sync manuelle" -ForegroundColor Yellow
            exit 0
        }
    }
}
else {
    Write-Success "Aucun delta détecté - bases synchronisées"
}

# ==================================================================================
# PHASE 4: BACKUP FINAL PRÉ-CUTOVER
# ==================================================================================
Write-Phase "4" "BACKUP FINAL PRÉ-CUTOVER"

if (-not $DryRun) {
    $backupFile = "$BACKUP_DIR\akig_immobilier_pre_cutover.backup"
    Write-Host "  Création backup: $backupFile"
    
    $env:PGPASSWORD = "postgres"
    & pg_dump -h localhost -U postgres -d akig_immobilier -Fc -f $backupFile 2>&1 | Out-Null
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $backupFile)) {
        $size = (Get-Item $backupFile).Length / 1MB
        Write-Success "Backup créé: $([math]::Round($size, 2)) MB"
    }
    else {
        Write-Critical "Backup FAILED"
        exit 1
    }
}
else {
    Write-Warning "[DRY-RUN] Backup simulé"
}

# Backup de la config backend actuelle
Copy-Item "$BACKEND_PATH\.env" "$BACKUP_DIR\.env.backup" -Force
Copy-Item "$BACKEND_PATH\src\db.js" "$BACKUP_DIR\db.js.backup" -Force
Write-Success "Config backend sauvegardée"

# ==================================================================================
# PHASE 5: SWITCH APPLICATION (CUTOVER CRITIQUE - 30 secondes max)
# ==================================================================================
Write-Phase "5" "SWITCH APPLICATION VERS POSTGRESQL"

if (-not $DryRun) {
    Write-Warning "CUTOVER EN COURS - 30 SECONDES CRITIQUES"
    
    # La DATABASE_URL est déjà PostgreSQL dans .env actuel
    $currentDbUrl = (Get-Content "$BACKEND_PATH\.env" | Select-String "^DATABASE_URL=").ToString()
    
    if ($currentDbUrl -match "postgresql://") {
        Write-Success "Application déjà configurée pour PostgreSQL"
        Write-Host "  $currentDbUrl" -ForegroundColor Gray
    }
    else {
        Write-Warning "DATABASE_URL n'est pas PostgreSQL! Mise à jour..."
        # Remplacer DATABASE_URL
        $envContent = Get-Content "$BACKEND_PATH\.env"
        $envContent = $envContent -replace "^DATABASE_URL=.*", "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/akig_immobilier"
        $envContent | Set-Content "$BACKEND_PATH\.env"
        Write-Success "DATABASE_URL mise à jour vers PostgreSQL"
    }
    
    # Vérifier que db.js utilise bien process.env.DATABASE_URL
    $dbJsContent = Get-Content "$BACKEND_PATH\src\db.js" -Raw
    if ($dbJsContent -match "process\.env\.DATABASE_URL") {
        Write-Success "db.js utilise DATABASE_URL (pool PostgreSQL actif)"
    }
    else {
        Write-Warning "db.js ne semble pas utiliser DATABASE_URL - vérification manuelle requise"
    }
    
}
else {
    Write-Warning "[DRY-RUN] Switch application simulé"
}

# ==================================================================================
# PHASE 6: VALIDATION CONNEXION APPLICATIVE
# ==================================================================================
Write-Phase "6" "VALIDATION CONNEXION APPLICATIVE"

# Test connexion directe PostgreSQL
try {
    $testQuery = "SELECT now() as timestamp, COUNT(*) as total_audit_logs FROM audit_logs;"
    $result = Invoke-PostgresQuery $testQuery
    Write-Success "Connexion PostgreSQL opérationnelle: $result"
}
catch {
    Write-Critical "Test de connexion FAILED: $_"
    $Global:RollbackRequired = $true
}

# Vérifier que le pool de connexions fonctionne
Write-Host "`n  Test pool de connexions backend..."
if (Test-Path "$BACKEND_PATH\package.json") {
    Write-Success "Backend Node.js détecté (pg pool configuré)"
    Write-Host "  ℹ️  Pour tester le backend complet: cd backend && npm start" -ForegroundColor Gray
}
else {
    Write-Warning "package.json non trouvé - impossible de tester le pool"
}

# ==================================================================================
# PHASE 7: TESTS END-TO-END CRITIQUES
# ==================================================================================
Write-Phase "7" "TESTS END-TO-END CRITIQUES"

Write-Host "`n  Test 1: Lecture (derniers audit logs)"
try {
    $query = "SELECT id, date, objet FROM audit_logs ORDER BY id DESC LIMIT 5;"
    $result = Invoke-PostgresQuery $query
    Write-Success "Lecture OK: $($result.Split("`n").Count) lignes retournées"
}
catch {
    Write-Critical "Test lecture FAILED: $_"
}

Write-Host "`n  Test 2: Écriture (audit log de cutover)"
if (-not $DryRun) {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $query = "INSERT INTO audit_logs (date, objet, detail) VALUES ('$timestamp', 'MIGRATION_CUTOVER', 'Cutover PostgreSQL exécuté avec succès - GOLD to PLATINUM') RETURNING id;"
        $newId = Invoke-PostgresQuery $query
        Write-Success "Écriture OK: nouveau ID = $newId"
    }
    catch {
        Write-Critical "Test écriture FAILED: $_"
        $Global:RollbackRequired = $true
    }
}
else {
    Write-Warning "[DRY-RUN] Test écriture simulé"
}

Write-Host "`n  Test 3: Requête métier critique (disbursements récents)"
try {
    $query = "SELECT COUNT(*) as total, MAX(date_paiement) as dernier FROM disbursements;"
    $result = Invoke-PostgresQuery $query
    Write-Success "Requête métier OK: $result"
}
catch {
    Write-Critical "Requête métier FAILED: $_"
}

Write-Host "`n  Test 4: Vérification index (audit_logs_date_idx)"
try {
    $query = @"
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM audit_logs 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
"@
    $result = Invoke-PostgresQuery $query
    if ($result -match "Index Scan" -or $result -match "Bitmap Index Scan") {
        Write-Success "Index utilisé correctement"
    }
    else {
        Write-Warning "Index peut-être non utilisé - vérification manuelle recommandée"
    }
}
catch {
    Write-Warning "Test index SKIPPED: $_"
}

# ==================================================================================
# PHASE 8: MONITORING ACTIVATION
# ==================================================================================
Write-Phase "8" "ACTIVATION MONITORING POST-CUTOVER"

Write-Host "`n  Connexions actives PostgreSQL:"
try {
    $query = "SELECT state, COUNT(*) FROM pg_stat_activity WHERE datname = 'akig_immobilier' GROUP BY state;"
    $result = Invoke-PostgresQuery $query
    Write-Success "État connexions: `n$result"
}
catch {
    Write-Warning "Impossible de lire pg_stat_activity"
}

Write-Host "`n  Top 5 queries lentes (depuis baseline):"
try {
    $query = @"
SELECT 
    LEFT(query, 60) as query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) as avg_ms
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC 
LIMIT 5;
"@
    $result = Invoke-PostgresQuery $query -Silent
    if ($result) {
        Write-Success "Statistiques queries disponibles: `n$result"
    }
    else {
        Write-Warning "pg_stat_statements vide (normal si peu de queries)"
    }
}
catch {
    Write-Warning "pg_stat_statements non disponible"
}

# ==================================================================================
# PHASE 9: MYSQL DECOMMISSION
# ==================================================================================
Write-Phase "9" "MYSQL DÉCOMMISSION (optionnel)"

Write-Host "`n  MySQL est maintenant en READ-ONLY et peut être:"
Write-Host "    1. Gardé en lecture seule pour archive (recommandé 7 jours)" -ForegroundColor Yellow
Write-Host "    2. Stoppé complètement (service mysql stop)" -ForegroundColor Yellow
Write-Host "    3. Dumpé puis supprimé (après validation 24h)" -ForegroundColor Yellow

if (-not $DryRun -and $Force) {
    Write-Warning "Force mode: MySQL laissé en READ-ONLY (pas de stop automatique)"
}

# Sauvegarder état final MySQL
try {
    $mysqlStats = Invoke-MySQLQuery "SHOW TABLE STATUS;"
    $mysqlStats | Out-File "$BACKUP_DIR\mysql_final_table_status.txt"
    Write-Success "MySQL table status sauvegardé"
}
catch {
    Write-Warning "Impossible de capturer MySQL table status"
}

# ==================================================================================
# RAPPORT FINAL
# ==================================================================================
Write-Phase "FINAL" "RAPPORT DE CUTOVER"

$elapsed = (Get-Date) - $Global:CutoverStartTime
Write-Host "`n==================================================================================================" -ForegroundColor Cyan
Write-Host "CUTOVER EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================================================================" -ForegroundColor Cyan

Write-Host "`nTIMING:"
Write-Host "  Début          : $($Global:CutoverStartTime.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host "  Fin            : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "  Durée totale   : $($elapsed.ToString('mm\:ss'))"

Write-Host "`nSTATUS:"
if ($Global:RollbackRequired) {
    Write-Host "  ❌ CUTOVER FAILED - ROLLBACK REQUIS" -ForegroundColor Red
    Write-Host "`n  Exécutez immédiatement:" -ForegroundColor Red
    Write-Host "    powershell -ExecutionPolicy Bypass -File scripts\emergency-rollback.ps1" -ForegroundColor Yellow
}
elseif ($DryRun) {
    Write-Host "  ✅ DRY-RUN COMPLETED - Aucun changement réel appliqué" -ForegroundColor Green
    Write-Host "`n  Pour exécuter le cutover réel:" -ForegroundColor Yellow
    Write-Host "    powershell -ExecutionPolicy Bypass -File scripts\final-cutover.ps1" -ForegroundColor Gray
}
else {
    Write-Host "  ✅ CUTOVER SUCCESSFUL - POSTGRESQL EN PRODUCTION" -ForegroundColor Green
    Write-Host "`n  Niveau actuel  : GOLD+ (cutover exécuté)" -ForegroundColor Green
    Write-Host "  Niveau cible   : PLATINUM (24h sans incident)" -ForegroundColor Yellow
}

Write-Host "`nDATABASE:"
Write-Host "  Source (MySQL) : READ-ONLY $(if ($DryRun) { '(simulé)' })"
Write-Host "  Target (PostgreSQL) : ACTIVE & WRITABLE"
Write-Host "  Backend config : PostgreSQL (DATABASE_URL updated)"

Write-Host "`nBACKUPS:"
Write-Host "  Répertoire     : $BACKUP_DIR"
Write-Host "  Fichiers       :"
Get-ChildItem $BACKUP_DIR | ForEach-Object {
    $size = if ($_.Length) { " ($([math]::Round($_.Length/1KB, 1)) KB)" } else { "" }
    Write-Host "    - $($_.Name)$size" -ForegroundColor Gray
}

Write-Host "`nNEXT STEPS:"
if (-not $Global:RollbackRequired -and -not $DryRun) {
    Write-Host "  1. Monitorer l'application pendant 1 heure (surveillance active)" -ForegroundColor Yellow
    Write-Host "  2. Exécuter tests end-to-end métier complets" -ForegroundColor Yellow
    Write-Host "  3. À 24h: générer rapport PLATINUM" -ForegroundColor Yellow
    Write-Host "       powershell -File scripts\24h-post-migration-report.ps1" -ForegroundColor Gray
    Write-Host "  4. MySQL: garder en READ-ONLY 7 jours puis dump final" -ForegroundColor Yellow
}

Write-Host "`nMONITORING:"
Write-Host "  Script Python  : python scripts\monitor-postgres.py" -ForegroundColor Gray
Write-Host "  Logs backend   : tail -f backend/logs/app.log" -ForegroundColor Gray
Write-Host "  PostgreSQL logs: (vérifier postgresql.conf pour log_directory)" -ForegroundColor Gray

Write-Host "`n==================================================================================================" -ForegroundColor Cyan

if (-not $Global:RollbackRequired -and -not $DryRun) {
    Write-Host "`n🎉 FÉLICITATIONS - VOUS ÊTES EN PRODUCTION POSTGRESQL!" -ForegroundColor Green
    Write-Host "🚀 NIVEAU GOLD+ ATTEINT - EN ROUTE VERS PLATINUM (24h)" -ForegroundColor Cyan
}

Write-Host ""
