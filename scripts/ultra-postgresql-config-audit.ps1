# Ultra PostgreSQL Configuration Audit - Faille #3
# Usage: powershell -ExecutionPolicy Bypass -File ultra-postgresql-config-audit.ps1

$ErrorActionPreference = "Continue"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (!(Test-Path $psql)) { Write-Host "❌ psql introuvable: $psql" -ForegroundColor Red; exit 2 }
$env:PGPASSWORD = "postgres"

Write-Host "=== FAILLE #3: CONFIG POSTGRESQL CRITIQUE ===" -ForegroundColor Cyan
$query = @"
SELECT name, setting, unit, context,
  CASE 
    WHEN name = 'max_connections' AND setting::int < 100 THEN '❌ TROP BAS'
    WHEN name = 'shared_buffers' AND setting::int < 262144 THEN '❌ TROP BAS (<2GB)'
    WHEN name = 'work_mem' AND setting::int < 16384 THEN '⚠️ BAS (<16MB)'
    WHEN name = 'effective_cache_size' AND setting::int < 786432 THEN '⚠️ BAS (<6GB)'
    WHEN name = 'checkpoint_timeout' AND setting::int < 300 THEN '⚠️ BAS (<5min)'
    ELSE '✅ OK'
  END AS statut
FROM pg_settings
WHERE name IN ('max_connections','shared_buffers','work_mem','maintenance_work_mem','effective_cache_size','checkpoint_timeout')
ORDER BY name;
"@
& $psql -h localhost -U postgres -d akig_immobilier -c $query 2>&1
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# Disk space
Write-Host "\n=== ESPACE DISQUE (C:) ===" -ForegroundColor Cyan
Get-PSDrive C | Select-Object Name,@{Name='FreeGB';Expression={[math]::Round($_.Free/1GB,2)}},@{Name='UsedGB';Expression={[math]::Round($_.Used/1GB,2)}},@{Name='TotalGB';Expression={[math]::Round(($_.Used+$_.Free)/1GB,2)}} | Format-Table -AutoSize

# Recent PostgreSQL errors
Write-Host "\n=== LOGS ERREURS POSTGRESQL (50 dernières lignes) ===" -ForegroundColor Cyan
$logPath = "C:\Program Files\PostgreSQL\18\data\log"
if (Test-Path $logPath) {
    Get-ChildItem $logPath -Filter *.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
        Get-Content $_.FullName -Tail 50 | Select-String -Pattern 'ERROR|FATAL|PANIC' -Context 0,1
    }
} else { Write-Host "⚠️ Dossier logs introuvable: $logPath" -ForegroundColor Yellow }

Write-Host "\n✔ Faille #3 audit terminé" -ForegroundColor Green
