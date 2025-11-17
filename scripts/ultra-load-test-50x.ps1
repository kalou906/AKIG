# Ultra Load Test 50 Workers - Faille #5
# Usage: powershell -ExecutionPolicy Bypass -File ultra-load-test-50x.ps1
# Inserts temporary audit_logs rows tagged 'load_test_' then cleans them.

param([int]$Workers = 50,[int]$IterationsPerWorker = 100)
$ErrorActionPreference = "Continue"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (!(Test-Path $psql)) { Write-Host "❌ psql introuvable" -ForegroundColor Red; exit 2 }
$env:PGPASSWORD = "postgres"

Write-Host "=== FAILLE #5: CHARGE CONCURRENTE ($Workers workers x $IterationsPerWorker) ===" -ForegroundColor Cyan
$totalExpected = $Workers * $IterationsPerWorker
Write-Host "Charge prévue: $totalExpected opérations (lecture+écriture)" -ForegroundColor Yellow

$scriptBlock = {
    param($Iterations,$psql)
    $ErrorActionPreference = "SilentlyContinue"
    $env:PGPASSWORD = "postgres"
    for ($i=0; $i -lt $Iterations; $i++) {
        & $psql -h localhost -U postgres -d akig_immobilier -c "SELECT COUNT(*) FROM audit_logs WHERE date > NOW() - interval '7 days';" -t -A > $null
        & $psql -h localhost -U postgres -d akig_immobilier -c "INSERT INTO audit_logs (locataire_id, local_id, date, objet) VALUES (1,1,NOW(),'load_test_$([guid]::NewGuid().ToString().Substring(0,8))');" > $null
        Start-Sleep -Milliseconds 80
    }
}

$start = Get-Date
$jobs = 1..$Workers | ForEach-Object { Start-Job -ScriptBlock $scriptBlock -ArgumentList $IterationsPerWorker,$psql }

while (($running=(Get-Job -State Running)).Count -gt 0) {
    $elapsed = (Get-Date) - $start
    $deadlocks = & $psql -h localhost -U postgres -d akig_immobilier -t -A -c "SELECT deadlocks FROM pg_stat_database WHERE datname='akig_immobilier';" 2>&1
    Write-Host "[$($elapsed.ToString('mm\:ss'))] Workers actifs: $($running.Count) | Deadlocks: $deadlocks" -ForegroundColor $(if ($deadlocks.Trim() -eq '0') { 'Green' } else { 'Red' })
    Start-Sleep -Seconds 5
}

# Collect job outputs (ignore normal)
Get-Job | Receive-Job | Select-String -Pattern "ERROR|FATAL|PANIC" | ForEach-Object { Write-Host "LOG: $_" -ForegroundColor Red }
Remove-Job -Force *
$elapsedTotal = (Get-Date) - $start

# Deadlock final
$deadlockFinal = & $psql -h localhost -U postgres -d akig_immobilier -t -A -c "SELECT deadlocks FROM pg_stat_database WHERE datname='akig_immobilier';" 2>&1

# Rows inserted tag
$inserted = & $psql -h localhost -U postgres -d akig_immobilier -t -A -c "SELECT COUNT(*) FROM audit_logs WHERE objet LIKE 'load_test_%';" 2>&1
Write-Host "Temps total: $($elapsedTotal.TotalSeconds.ToString('0.0'))s" -ForegroundColor Cyan
Write-Host "Deadlocks finaux: $deadlockFinal" -ForegroundColor $(if ($deadlockFinal.Trim() -eq '0') { 'Green' } else { 'Red' })
Write-Host "Lignes load_test insérées: $inserted" -ForegroundColor Yellow

# Cleanup
& $psql -h localhost -U postgres -d akig_immobilier -c "DELETE FROM audit_logs WHERE objet LIKE 'load_test_%';" > $null
Write-Host "Nettoyage des lignes temporaires effectué" -ForegroundColor Green
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

if ($deadlockFinal.Trim() -ne '0') { Write-Host "❌ Deadlocks détectés" -ForegroundColor Red; exit 2 }
Write-Host "✅ Charge concurrente OK sans deadlock" -ForegroundColor Green
exit 0
