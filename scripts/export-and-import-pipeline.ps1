<#
.SYNOPSIS
Exports the MySQL table 'historique' and imports it into PostgreSQL using the existing importer.

Flow:
- Find mysqldump
- Export immobilier.historique to a temp folder (not Desktop to avoid external watchers)
- Normalize MySQL zero-dates
- Import into audit_logs via scripts/legacy-import/import-sql-direct.py
- Apply basic constraints and indexes

Notes:
- Set $MYSQL_HOST/$MYSQL_USER. Password can be read from env var MYSQL_PASS or prompted interactively.
- Uses one-row-per-INSERT for resilience.
#>

param(
    [string]$MYSQL_HOST = "localhost",
    [string]$MYSQL_USER = "root",
    [string]$MYSQL_DB = "immobilier",
    [string]$MYSQL_TABLE = "historique"
)

$ErrorActionPreference = 'Stop'

Write-Host "Pipeline MySQL -> PostgreSQL (historique)" -ForegroundColor Cyan
Write-Host "=============================================="

# Workspace paths
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$workDir = Join-Path $repoRoot 'temp'
if (!(Test-Path $workDir)) { New-Item -ItemType Directory -Path $workDir | Out-Null }

$sqlFile = Join-Path $workDir 'historique.sql'
$correctedFile = Join-Path $workDir 'historique_CORRIGE.sql'
$importerScript = Join-Path $PSScriptRoot 'legacy-import\import-sql-direct.py'

# Detect mysqldump
function Find-MySqlDump {
    $cmd = Get-Command mysqldump -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        'C:\Program Files\MySQL',
        'C:\Program Files (x86)\MySQL',
        'C:\Program Files\MariaDB',
        'C:\xampp\mysql\bin',
        'C:\wamp64\bin\mysql'
    ) | ForEach-Object { if (Test-Path $_) { Get-ChildItem -Path $_ -Recurse -Filter 'mysqldump.exe' -ErrorAction SilentlyContinue } }
    $first = $candidates | Select-Object -First 1
    if ($first) { return $first.FullName }
    return $null
}

$mysqldump = Find-MySqlDump
if (-not $mysqldump) {
    Write-Host "❌ mysqldump not found. Install client tools:" -ForegroundColor Red
    Write-Host "   winget install -e --id Oracle.MySQL" -ForegroundColor Yellow
    exit 1
}

# MySQL password: prefer env var, else prompt, else allow interactive mysqldump prompt
$mysqlPass = $env:MYSQL_PASS
if ([string]::IsNullOrWhiteSpace($mysqlPass)) {
    try {
        $sec = Read-Host "Enter MySQL password for user '$MYSQL_USER' (input hidden)" -AsSecureString
        if ($sec) { $mysqlPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)) }
    }
    catch { }
}

Write-Host "Export MySQL: $MYSQL_DB.$MYSQL_TABLE from $MYSQL_HOST" -ForegroundColor Cyan
if (Test-Path $sqlFile) { Remove-Item $sqlFile -Force }

$args = @(
    '-u', $MYSQL_USER,
    '-h', $MYSQL_HOST,
    '--single-transaction',
    '--default-character-set=utf8mb4',
    '--complete-insert',
    '--skip-extended-insert',
    $MYSQL_DB,
    $MYSQL_TABLE
)

if (-not [string]::IsNullOrWhiteSpace($mysqlPass)) {
    # Use non-interactive password argument
    $args = @('-p' + $mysqlPass) + $args
}
else {
    # Let mysqldump prompt for password interactively
    $args = @('-p') + $args
}

& $mysqldump @args | Out-File -FilePath $sqlFile -Encoding UTF8

if (!(Test-Path $sqlFile) -or (Get-Item $sqlFile).Length -eq 0) {
    Write-Host "❌ Export failed or produced empty file: $sqlFile" -ForegroundColor Red
    exit 1
}
Write-Host "Export complete: $sqlFile" -ForegroundColor Green

# Normalize zero-dates
Write-Host "Normalizing zero-dates -> NULL ..." -ForegroundColor Cyan
$pattern = "'0000-00-00( 00:00(:00)?)?'"  # matches date and datetime variants
Get-Content -LiteralPath $sqlFile -Encoding UTF8 |
ForEach-Object { $_ -replace $pattern, 'NULL' } |
Set-Content -LiteralPath $correctedFile -Encoding UTF8
Write-Host "Corrected file: $correctedFile" -ForegroundColor Green

# Import into PostgreSQL
if (!(Test-Path $importerScript)) {
    Write-Host "❌ Importer not found: $importerScript" -ForegroundColor Red
    exit 1
}
Write-Host "Importing into PostgreSQL (audit_logs) ..." -ForegroundColor Cyan
$env:PYTHONIOENCODING = 'utf-8'
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/akig_immobilier'

& python $importerScript $correctedFile $env:DATABASE_URL --only-tables historique

# Apply constraints and indexes
Write-Host "Applying constraints and indexes ..." -ForegroundColor Cyan
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
if (!(Test-Path $psql)) { $psql = 'psql' }

& $psql -U postgres -h localhost -d akig_immobilier -c "ALTER TABLE audit_logs ADD PRIMARY KEY (id);"
& $psql -U postgres -h localhost -d akig_immobilier -c "CREATE INDEX IF NOT EXISTS idx_audit_locataire ON audit_logs(locataire_id);"
& $psql -U postgres -h localhost -d akig_immobilier -c "CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(date);"
& $psql -U postgres -h localhost -d akig_immobilier -c "ALTER TABLE disbursements ADD PRIMARY KEY (id);"
& $psql -U postgres -h localhost -d akig_immobilier -c "ALTER TABLE inventory_reports ADD PRIMARY KEY (id);"

# Summary
Write-Host "Final counts:" -ForegroundColor Cyan
$summarySql = "SELECT COUNT(*) AS audit_logs_count FROM audit_logs;"
& $psql -U postgres -h localhost -d akig_immobilier -c $summarySql
Write-Host "Pipeline completed successfully." -ForegroundColor Green
