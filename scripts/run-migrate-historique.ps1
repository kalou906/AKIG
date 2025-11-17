<#!
Run the direct historique -> audit_logs migration with a secure password prompt.

Steps performed:
 1. Prompt for MySQL root password (SecureString, converted locally).
 2. Set required environment variables (in current process only).
 3. Execute Python migrator `migrate_historique_direct.py`.
 4. Show final row count from `audit_logs`.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts\run-migrate-historique.ps1

Requires:
  - MySQL server running and accessible on $env:MYSQL_HOST (default localhost:3306)
  - Postgres database reachable via DATABASE_URL.
!>

param(
    [string]$MySQLHost = 'localhost',
    [int]$MySQLPort = 3306,
    [string]$MySQLUser = 'root',
    [string]$MySQLDb = 'immobilier',
    [string]$PostgresUrl = 'postgresql://postgres:postgres@localhost:5432/akig_immobilier',
    [switch]$RelaxConstraints
)

function Convert-SecureStringToPlain([Security.SecureString]$sec) {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

Write-Host "=== AKIG Historique Migration Runner ===" -ForegroundColor Cyan
Write-Host "MySQL: $MySQLUser@$MySQLHost:$MySQLPort DB=$MySQLDb" -ForegroundColor DarkGray
Write-Host "Postgres: $PostgresUrl" -ForegroundColor DarkGray

$pwdSecure = Read-Host -Prompt 'Enter MySQL root password' -AsSecureString
$pwdPlain = Convert-SecureStringToPlain $pwdSecure
if (-not $pwdPlain) { Write-Host 'Password cannot be empty.' -ForegroundColor Red; exit 2 }

Write-Host 'Setting environment variables...' -ForegroundColor Yellow
$env:MYSQL_HOST = $MySQLHost
$env:MYSQL_USER = $MySQLUser
$env:MYSQL_PASSWORD = $pwdPlain
$env:MYSQL_DB = $MySQLDb
$env:DATABASE_URL = $PostgresUrl
if ($RelaxConstraints) { $env:RELAX_CONSTRAINTS = '1'; Write-Host 'RELAX_CONSTRAINTS=1 activé.' -ForegroundColor Cyan } else { Remove-Item Env:RELAX_CONSTRAINTS -ErrorAction SilentlyContinue }

Write-Host 'Launching Python migrator...' -ForegroundColor Yellow
try {
    $env:PYTHONIOENCODING='utf-8'
    python "C:\AKIG\scripts\migrate_historique_direct.py"
} catch {
    Write-Host "Migration script error: $($_.Exception.Message)" -ForegroundColor Red
    exit 3
}

Write-Host 'Querying audit_logs count...' -ForegroundColor Yellow
try {
    $env:PGPASSWORD='postgres'
    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d ($PostgresUrl.Split('/')[-1]) -c "SELECT COUNT(*) FROM audit_logs;"
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
} catch {
    Write-Host "psql count query failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 4
}

Write-Host 'Done.' -ForegroundColor Green
exit 0