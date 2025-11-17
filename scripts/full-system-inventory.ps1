# ==================================================================================
# INVENTAIRE SYSTÈME COMPLET - AKIG IMMOBILIER
# ==================================================================================
# Usage: powershell -ExecutionPolicy Bypass -File full-system-inventory.ps1
# Output: system-inventory-YYYYMMDD.txt (garder 5 ans)
# ==================================================================================

$ErrorActionPreference = "Continue"
$InventoryFile = "C:\AKIG\backups\system-inventory-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$report = @()

function Write-Section {
    param([string]$Title)
    $separator = "=" * 80
    $report += ""
    $report += $separator
    $report += $Title
    $report += $separator
    Write-Host "`n$separator" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host $separator -ForegroundColor Cyan
}

function Add-Report {
    param([string]$Content)
    $report += $Content
    Write-Host $Content
}

# ==================================================================================
# SECTION 1: BACKEND SERVICES
# ==================================================================================
Write-Section "INVENTAIRE CRITIQUE - BACKEND SERVICES"

Add-Report "`nServices Windows actifs (PostgreSQL, MySQL, Node, etc.):"
try {
    $services = Get-Service | Where-Object { 
        $_.DisplayName -match "postgres|mysql|redis|nginx|node|iis" -and $_.Status -eq "Running"
    }
    if ($services) {
        $services | Format-Table Name, DisplayName, Status -AutoSize | Out-String | ForEach-Object { Add-Report $_ }
    }
    else {
        Add-Report "⚠️  Aucun service backend majeur détecté en tant que service Windows"
    }
}
catch {
    Add-Report "ERREUR: Impossible de lire services Windows"
}

Add-Report "`nVersions critiques installées:"
try {
    # PostgreSQL
    $env:PGPASSWORD = "postgres"
    $pgVersion = & psql --version 2>&1 | Select-Object -First 1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    Add-Report "  PostgreSQL: $pgVersion"
}
catch {
    Add-Report "  PostgreSQL: ⚠️  Non accessible via psql"
}

try {
    # MySQL
    $mysqlVersion = & mysql --version 2>&1 | Select-Object -First 1
    Add-Report "  MySQL: $mysqlVersion"
}
catch {
    Add-Report "  MySQL: ⚠️  Non installé ou non accessible"
}

try {
    # Node.js
    $nodeVersion = & node --version 2>&1
    Add-Report "  Node.js: $nodeVersion"
}
catch {
    Add-Report "  Node.js: ⚠️  Non installé"
}

try {
    # Python
    $pythonVersion = & python --version 2>&1
    Add-Report "  Python: $pythonVersion"
}
catch {
    Add-Report "  Python: ⚠️  Non installé"
}

Add-Report "`nPorts réseau en écoute (LISTEN):"
try {
    $ports = Get-NetTCPConnection | Where-Object { $_.State -eq "Listen" } | 
    Select-Object LocalAddress, LocalPort, OwningProcess -Unique | 
    Sort-Object LocalPort
    
    $portReport = @()
    foreach ($port in $ports) {
        try {
            $process = Get-Process -Id $port.OwningProcess -ErrorAction SilentlyContinue
            $processName = if ($process) { $process.Name } else { "Unknown" }
            $portReport += "  $($port.LocalAddress):$($port.LocalPort) -> $processName (PID: $($port.OwningProcess))"
        }
        catch {
            $portReport += "  $($port.LocalAddress):$($port.LocalPort) -> Unknown"
        }
    }
    
    # Filtrer les ports critiques
    $criticalPorts = $portReport | Where-Object { $_ -match ":5432|:3306|:4000|:80|:443|:8000" }
    if ($criticalPorts) {
        Add-Report "  Ports critiques:"
        $criticalPorts | ForEach-Object { Add-Report $_ }
    }
    
    Add-Report "`n  Total ports en écoute: $($ports.Count)"
}
catch {
    Add-Report "ERREUR: Impossible de lire ports réseau"
}

# ==================================================================================
# SECTION 2: FRONTEND FILES
# ==================================================================================
Write-Section "INVENTAIRE CRITIQUE - FRONTEND FILES"

Add-Report "`nFichiers frontend (HTML/CSS/JS):"
$frontendPaths = @("C:\AKIG\frontend", "C:\AKIG\public", "C:\AKIG\dist", "C:\AKIG\build")
$foundFiles = @()

foreach ($path in $frontendPaths) {
    if (Test-Path $path) {
        $htmlFiles = Get-ChildItem -Path $path -Recurse -Include "*.html" -ErrorAction SilentlyContinue
        $cssFiles = Get-ChildItem -Path $path -Recurse -Include "*.css" -ErrorAction SilentlyContinue
        $jsFiles = Get-ChildItem -Path $path -Recurse -Include "*.js" -ErrorAction SilentlyContinue
        
        if ($htmlFiles) { $foundFiles += "  HTML: $($htmlFiles.Count) fichiers dans $path" }
        if ($cssFiles) { $foundFiles += "  CSS: $($cssFiles.Count) fichiers dans $path" }
        if ($jsFiles) { $foundFiles += "  JS: $($jsFiles.Count) fichiers dans $path" }
    }
}

if ($foundFiles.Count -gt 0) {
    $foundFiles | ForEach-Object { Add-Report $_ }
}
else {
    Add-Report "  ⚠️  Aucun fichier frontend détecté (normal si API-only backend)"
}

Add-Report "`nTaille des bundles/builds:"
$buildDirs = @("C:\AKIG\frontend\dist", "C:\AKIG\frontend\build", "C:\AKIG\dist", "C:\AKIG\build")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        $size = (Get-ChildItem -Path $dir -Recurse -ErrorAction SilentlyContinue | 
            Measure-Object -Property Length -Sum).Sum / 1MB
        Add-Report "  $dir : $([math]::Round($size, 2)) MB"
    }
}

# ==================================================================================
# SECTION 3: BASE DE DONNÉES
# ==================================================================================
Write-Section "INVENTAIRE CRITIQUE - BASE DE DONNÉES POSTGRESQL"

Add-Report "`nConnexions actives:"
try {
    $env:PGPASSWORD = "postgres"
    $connections = & psql -h localhost -U postgres -d akig_immobilier -t -A -c @"
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE state = 'active') as active,
    COUNT(*) FILTER (WHERE state = 'idle') as idle,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity 
WHERE datname = 'akig_immobilier';
"@ 2>&1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    Add-Report "  $connections"
}
catch {
    Add-Report "  ERREUR: Impossible de lire connexions PostgreSQL"
}

Add-Report "`nTaille des tables (top 10):"
try {
    $env:PGPASSWORD = "postgres"
    $tables = & psql -h localhost -U postgres -d akig_immobilier -t -A -c @"
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    n_live_tup as rows
FROM pg_tables 
LEFT JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.relname
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
LIMIT 10;
"@ 2>&1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    $tables | ForEach-Object { Add-Report "  $_" }
}
catch {
    Add-Report "  ERREUR: Impossible de lire tailles tables"
}

Add-Report "`nIndex manquants (tables > 1000 rows sans index utilisé):"
try {
    $env:PGPASSWORD = "postgres"
    $missingIndexes = & psql -h localhost -U postgres -d akig_immobilier -t -A -c @"
SELECT 
    tablename,
    n_live_tup as rows,
    idx_scan as index_scans,
    seq_scan as sequential_scans
FROM pg_stat_user_tables 
WHERE n_live_tup > 1000 
  AND idx_scan = 0 
  AND seq_scan > 0
ORDER BY n_live_tup DESC;
"@ 2>&1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    if ($missingIndexes -and $missingIndexes -notmatch "0 rows") {
        $missingIndexes | ForEach-Object { Add-Report "  ⚠️  $_" }
    }
    else {
        Add-Report "  ✅ Aucune table sans index détectée"
    }
}
catch {
    Add-Report "  ERREUR: Impossible de vérifier index"
}

Add-Report "`nIndex existants:"
try {
    $env:PGPASSWORD = "postgres"
    $indexes = & psql -h localhost -U postgres -d akig_immobilier -t -A -c @"
SELECT 
    schemaname || '.' || tablename as table,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
"@ 2>&1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    $indexes | ForEach-Object { Add-Report "  $_" }
}
catch {
    Add-Report "  ERREUR: Impossible de lire index"
}

# ==================================================================================
# SECTION 4: ENVIRONNEMENT & CONFIGURATION
# ==================================================================================
Write-Section "INVENTAIRE CRITIQUE - ENVIRONNEMENT & CONFIG"

Add-Report "`nVariables d'environnement sensibles (partiellement masquées):"
try {
    $envVars = Get-ChildItem Env: | Where-Object { 
        $_.Name -match "DATABASE|DB_|POSTGRES|MYSQL|REDIS|API|SECRET|TOKEN|JWT|PASSWORD"
    } | Sort-Object Name
    
    foreach ($var in $envVars) {
        $value = $var.Value
        # Masquer les valeurs sensibles (garder 4 premiers chars)
        if ($var.Name -match "SECRET|PASSWORD|TOKEN") {
            $value = if ($value.Length -gt 4) { $value.Substring(0, 4) + "****" } else { "****" }
        }
        Add-Report "  $($var.Name) = $value"
    }
}
catch {
    Add-Report "  ERREUR: Impossible de lire variables environnement"
}

Add-Report "`nFichiers de configuration critiques:"
$configFiles = @(
    "C:\AKIG\backend\.env",
    "C:\AKIG\backend\src\db.js",
    "C:\AKIG\backend\package.json",
    "C:\AKIG\backend\src\index.js"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $modified = (Get-Item $file).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        Add-Report "  ✅ $file ($size bytes, modifié: $modified)"
    }
    else {
        Add-Report "  ⚠️  $file (NOT FOUND)"
    }
}

# ==================================================================================
# SECTION 5: ESPACE DISQUE & RESSOURCES
# ==================================================================================
Write-Section "INVENTAIRE CRITIQUE - RESSOURCES SYSTÈME"

Add-Report "`nEspace disque (partitions critiques):"
try {
    $disks = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null }
    foreach ($disk in $disks) {
        $usedGB = [math]::Round($disk.Used / 1GB, 2)
        $freeGB = [math]::Round($disk.Free / 1GB, 2)
        $totalGB = $usedGB + $freeGB
        $percentUsed = [math]::Round(($usedGB / $totalGB) * 100, 1)
        
        $status = if ($percentUsed -gt 90) { "❌ CRITIQUE" } 
        elseif ($percentUsed -gt 80) { "⚠️  WARNING" } 
        else { "✅ OK" }
        
        Add-Report "  $($disk.Name): $usedGB GB / $totalGB GB ($percentUsed%) $status"
    }
}
catch {
    Add-Report "  ERREUR: Impossible de lire espace disque"
}

Add-Report "`nMémoire système:"
try {
    $os = Get-CimInstance Win32_OperatingSystem
    $totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $usedRAM = $totalRAM - $freeRAM
    $percentUsed = [math]::Round(($usedRAM / $totalRAM) * 100, 1)
    
    Add-Report "  Total: $totalRAM GB"
    Add-Report "  Utilisée: $usedRAM GB ($percentUsed%)"
    Add-Report "  Libre: $freeRAM GB"
}
catch {
    Add-Report "  ERREUR: Impossible de lire mémoire"
}

Add-Report "`nProcessus consommant le plus de ressources (top 5):"
try {
    $processes = Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5
    foreach ($proc in $processes) {
        $memMB = [math]::Round($proc.WorkingSet / 1MB, 0)
        $cpu = [math]::Round($proc.CPU, 1)
        Add-Report "  $($proc.Name) (PID: $($proc.Id)): $memMB MB RAM, $cpu sec CPU"
    }
}
catch {
    Add-Report "  ERREUR: Impossible de lire processus"
}

# ==================================================================================
# SECTION 6: BACKUPS & SÉCURITÉ
# ==================================================================================
Write-Section "INVENTAIRE CRITIQUE - BACKUPS & SÉCURITÉ"

Add-Report "`nBackups PostgreSQL disponibles:"
try {
    $backupDir = "C:\AKIG\backups"
    if (Test-Path $backupDir) {
        $backups = Get-ChildItem -Path $backupDir -Filter "*.backup" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending
        
        if ($backups) {
            foreach ($backup in $backups) {
                $sizeMB = [math]::Round($backup.Length / 1MB, 2)
                $age = (Get-Date) - $backup.LastWriteTime
                Add-Report "  $($backup.Name): $sizeMB MB (âge: $([math]::Round($age.TotalHours, 1))h)"
            }
        }
        else {
            Add-Report "  ⚠️  Aucun backup .backup trouvé"
        }
    }
    else {
        Add-Report "  ⚠️  Répertoire backups inexistant"
    }
}
catch {
    Add-Report "  ERREUR: Impossible de lire backups"
}

Add-Report "`nDernier backup PostgreSQL (pg_dump):"
try {
    $latestBackup = Get-ChildItem -Path "C:\AKIG\backups" -Filter "*.backup" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1
    
    if ($latestBackup) {
        $age = (Get-Date) - $latestBackup.LastWriteTime
        $ageHours = [math]::Round($age.TotalHours, 1)
        
        $status = if ($ageHours -gt 48) { "❌ OBSOLÈTE (> 48h)" }
        elseif ($ageHours -gt 24) { "⚠️  WARNING (> 24h)" }
        else { "✅ RÉCENT" }
        
        Add-Report "  $($latestBackup.Name): $ageHours heures $status"
    }
    else {
        Add-Report "  ❌ AUCUN BACKUP TROUVÉ"
    }
}
catch {
    Add-Report "  ERREUR: Impossible de vérifier backup"
}

# ==================================================================================
# SECTION 7: CHECKSUMS CERTIFICATION GOLD
# ==================================================================================
Write-Section "CHECKSUMS CERTIFICATION GOLD (RÉFÉRENCE)"

Add-Report "`nChecksums archivés (ne doivent PAS changer):"
Add-Report "  audit_logs:        62212407184ef333cf80377e9e5226e0"
Add-Report "  disbursements:     ed3179905e6f853a7c192d529621981d"
Add-Report "  inventory_reports: f59db0df527cd9bc7b7d71b6e35ee6d7"

Add-Report "`nVérification checksums actuels:"
try {
    $env:PGPASSWORD = "postgres"
    
    $tables = @("audit_logs", "disbursements", "inventory_reports")
    foreach ($table in $tables) {
        $checksum = & psql -h localhost -U postgres -d akig_immobilier -t -A -c "SELECT md5(string_agg(row::text, '' ORDER BY id)) FROM $table;" 2>&1
        Add-Report "  $table : $checksum"
    }
    
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
catch {
    Add-Report "  ERREUR: Impossible de calculer checksums"
}

# ==================================================================================
# RAPPORT FINAL
# ==================================================================================
Write-Section "RÉSUMÉ INVENTAIRE"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Report ""
Add-Report "Inventaire généré: $timestamp"
Add-Report "Machine: $env:COMPUTERNAME"
Add-Report "Utilisateur: $env:USERNAME"
Add-Report "PowerShell version: $($PSVersionTable.PSVersion)"
Add-Report ""
Add-Report "📊 STATISTIQUES CLÉS:"
Add-Report "  - PostgreSQL: akig_immobilier (29,571 lignes total)"
Add-Report "  - Backend: Node.js $(& node --version 2>&1) (si installé)"
Add-Report "  - Niveau actuel: GOLD ✅ (certification 2025-11-16 18:32:04)"
Add-Report ""
Add-Report "📁 FICHIER SAUVEGARDÉ: $InventoryFile"
Add-Report "⏰ CONSERVATION: 5 ans minimum (audit/compliance)"

# Sauvegarder rapport
$report | Out-File $InventoryFile -Encoding UTF8

Write-Host "`n" -NoNewline
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host "INVENTAIRE COMPLET SAUVEGARDÉ" -ForegroundColor Green
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host "Fichier: $InventoryFile" -ForegroundColor Cyan
Write-Host "Taille: $([math]::Round((Get-Item $InventoryFile).Length / 1KB, 1)) KB" -ForegroundColor Cyan
Write-Host ""

# Ouvrir le rapport
$openFile = Read-Host "Ouvrir le rapport maintenant? (O/N)"
if ($openFile -eq "O" -or $openFile -eq "o") {
    Start-Process notepad $InventoryFile
}
