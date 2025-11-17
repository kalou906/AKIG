# Ultra Backup Restore Test - Faille #4 (Restauration réelle)
# Usage: powershell -ExecutionPolicy Bypass -File ultra-backup-restore-test.ps1
# Cette opération est contrôlée (base temporaire akig_test_restore)

$ErrorActionPreference = "Continue"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$pgRestore = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"
if (!(Test-Path $psql) -or !(Test-Path $pgRestore)) { Write-Host "❌ psql/pg_restore introuvables" -ForegroundColor Red; exit 2 }

$backupFile = "C:\AKIG\backups\migration-20251116-181402\akig_immobilier_post_migration.backup"
if (!(Test-Path $backupFile)) { Write-Host "❌ Backup introuvable: $backupFile" -ForegroundColor Red; exit 2 }

$env:PGPASSWORD = "postgres"
Write-Host "=== FAILLE #4: TEST RESTAURATION RÉELLE ===" -ForegroundColor Cyan

# Counts originaux
$origAudit = & $psql -h localhost -U postgres -d akig_immobilier -t -A -c "SELECT COUNT(*) FROM audit_logs;" 2>&1
$origDisb = & $psql -h localhost -U postgres -d akig_immobilier -t -A -c "SELECT COUNT(*) FROM disbursements;" 2>&1
$origInv = & $psql -h localhost -U postgres -d akig_immobilier -t -A -c "SELECT COUNT(*) FROM inventory_reports;" 2>&1
Write-Host "Orig Audit: $origAudit | Disbursements: $origDisb | Inventory: $origInv" -ForegroundColor Gray

# Drop + create base test
& $psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS akig_test_restore;" | Out-Null
& $psql -h localhost -U postgres -c "CREATE DATABASE akig_test_restore;" | Out-Null

$start = Get-Date
Write-Host "Début restauration: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
& $pgRestore -h localhost -U postgres -d akig_test_restore $backupFile 2>&1 | Out-Null
$elapsed = (Get-Date) - $start
Write-Host "Restauration terminée: $($elapsed.TotalSeconds.ToString('0.00'))s" -ForegroundColor $(if ($elapsed.TotalSeconds -lt 120) { 'Green' } else { 'Red' })

# Vérifications
$restAudit = & $psql -h localhost -U postgres -d akig_test_restore -t -A -c "SELECT COUNT(*) FROM audit_logs;" 2>&1
$restDisb = & $psql -h localhost -U postgres -d akig_test_restore -t -A -c "SELECT COUNT(*) FROM disbursements;" 2>&1
$restInv = & $psql -h localhost -U postgres -d akig_test_restore -t -A -c "SELECT COUNT(*) FROM inventory_reports;" 2>&1
Write-Host "Rest Audit: $restAudit | Disbursements: $restDisb | Inventory: $restInv" -ForegroundColor Gray

$integrityOk = ($restAudit.Trim() -eq $origAudit.Trim()) -and ($restDisb.Trim() -eq $origDisb.Trim()) -and ($restInv.Trim() -eq $origInv.Trim())
if ($integrityOk) { Write-Host "✅ Intégrité restauration OK" -ForegroundColor Green } else { Write-Host "❌ CORRUPTION RESTAURATION" -ForegroundColor Red }

# Cleanup
& $psql -h localhost -U postgres -c "DROP DATABASE akig_test_restore;" | Out-Null
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "✔ Faille #4 restauration test terminée" -ForegroundColor Green
if (-not $integrityOk -or $elapsed.TotalSeconds -ge 120) { exit 2 } else { exit 0 }
