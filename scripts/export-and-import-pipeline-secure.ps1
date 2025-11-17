<#
.SYNOPSIS
Secure pipeline: exports MySQL table 'historique' using stored JSON credentials, normalizes zero dates,
imports into PostgreSQL (audit_logs), applies constraints, cleans temp files, reports final count.

Behavior:
- Waits for mysqldump if not installed yet.
- Uses MYSQL_PWD env var (removed immediately after export) to avoid password appearing in command line.
- Creates temp working directory under project root.
- Avoids non-ASCII characters for better PowerShell 5.1 compatibility.
#>

$ErrorActionPreference = 'Stop'

$configFile = 'C:\AKIG\secure\mysql_config.json'
if (!(Test-Path $configFile)) {
    Write-Host 'Config file missing. Run setup-secure-config.ps1 first.' -ForegroundColor Red
    exit 1
}

$config = Get-Content $configFile | ConvertFrom-Json
$MYSQL_HOST  = $config.host
$MYSQL_USER  = $config.user
$MYSQL_PASS  = $config.password
$MYSQL_DB    = $config.database
$MYSQL_TABLE = $config.table

$repoRoot = 'C:\AKIG'
$tempDir  = Join-Path $repoRoot 'temp'
if (!(Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir | Out-Null }

$sqlFile       = Join-Path $tempDir 'historique.sql'
$correctedFile = Join-Path $tempDir 'historique_CORRIGE.sql'
$importerScript = Join-Path $repoRoot 'scripts\legacy-import\import-sql-direct.py'

Write-Host 'Secure MySQL -> PostgreSQL pipeline starting' -ForegroundColor Cyan

# Ensure mysqldump exists (poll until installed)
$mysqldump = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
$pollCount = 0
while (!(Test-Path $mysqldump)) {
    $pollCount++
    if ($pollCount -gt 60) {
        Write-Host 'Timeout waiting for mysqldump. Install MySQL client (winget install -e --id Oracle.MySQL).' -ForegroundColor Red
        exit 1
    }
    Write-Host 'Waiting for mysqldump...' -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host 'Exporting MySQL historique...' -ForegroundColor Cyan
if (Test-Path $sqlFile) { Remove-Item $sqlFile -Force }

$env:MYSQL_PWD = $MYSQL_PASS
& $mysqldump -u $MYSQL_USER -h $MYSQL_HOST --single-transaction --default-character-set=utf8mb4 --complete-insert --skip-extended-insert $MYSQL_DB $MYSQL_TABLE > $sqlFile 2>&1
Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue

if (!(Test-Path $sqlFile) -or (Get-Item $sqlFile).Length -eq 0) {
    Write-Host 'MySQL export failed or produced empty file.' -ForegroundColor Red
    exit 1
}
Write-Host 'Export complete.' -ForegroundColor Green

Write-Host 'Normalizing zero dates...' -ForegroundColor Cyan
$pattern = "'0000-00-00( 00:00(:00)?)?'"
Get-Content -LiteralPath $sqlFile -Encoding UTF8 | ForEach-Object { $_ -replace $pattern, 'NULL' } | Set-Content -LiteralPath $correctedFile -Encoding UTF8
Write-Host 'Normalization complete.' -ForegroundColor Green

if (!(Test-Path $importerScript)) {
    Write-Host 'Importer script not found: ' $importerScript -ForegroundColor Red
    exit 1
}

Write-Host 'Importing into PostgreSQL audit_logs...' -ForegroundColor Cyan
$env:PYTHONIOENCODING = 'utf-8'
$env:DATABASE_URL     = 'postgresql://postgres:postgres@localhost:5432/akig_immobilier'
& python $importerScript $correctedFile $env:DATABASE_URL --only-tables historique

Write-Host 'Applying constraints and indexes...' -ForegroundColor Cyan
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
if (!(Test-Path $psql)) { $psql = 'psql' }

& $psql -U postgres -h localhost -d akig_immobilier -c "ALTER TABLE audit_logs ADD PRIMARY KEY (id);"
& $psql -U postgres -h localhost -d akig_immobilier -c "CREATE INDEX IF NOT EXISTS idx_audit_locataire ON audit_logs(locataire_id);"
& $psql -U postgres -h localhost -d akig_immobilier -c "CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(date);"
& $psql -U postgres -h localhost -d akig_immobilier -c "ALTER TABLE disbursements ADD PRIMARY KEY (id);"
& $psql -U postgres -h localhost -d akig_immobilier -c "ALTER TABLE inventory_reports ADD PRIMARY KEY (id);"

Write-Host 'Cleaning temporary files...' -ForegroundColor Cyan
Remove-Item $sqlFile -Force -ErrorAction SilentlyContinue
Remove-Item $correctedFile -Force -ErrorAction SilentlyContinue

Write-Host 'Reporting final audit_logs count...' -ForegroundColor Cyan
$count = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM audit_logs;"
$count = $count.Trim()
Write-Host "Done. audit_logs row count: $count" -ForegroundColor Green
