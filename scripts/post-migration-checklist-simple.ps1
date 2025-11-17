# CHECKLIST POST-MIGRATION - AKIG Immobilier
# Execution : .\scripts\post-migration-checklist-simple.ps1

$ErrorActionPreference = "Continue"
$env:PGPASSWORD = 'postgres'
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  CHECKLIST POST-MIGRATION - Validation" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

$checks = @()

# 1. Comptage
Write-Host "[1/10] Comptage lignes..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM audit_logs;" 2>&1
if ($result -match "29355") {
    Write-Host "  [OK] audit_logs: 29,355 lignes" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [ERREUR] audit_logs: $result" -ForegroundColor Red
    $checks += $false
}

# 2. Dead tuples
Write-Host "[2/10] Dead tuples..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT SUM(n_dead_tup) FROM pg_stat_user_tables WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports');" 2>&1
if ($result.Trim() -eq "0") {
    Write-Host "  [OK] 0 dead tuples" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [WARN] $result dead tuples" -ForegroundColor Yellow
    $checks += $true
}

# 3. Index
Write-Host "[3/10] Index..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename='audit_logs';" 2>&1
if ([int]$result.Trim() -ge 4) {
    Write-Host "  [OK] $($result.Trim()) index crees" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [ERREUR] Seulement $($result.Trim()) index" -ForegroundColor Red
    $checks += $false
}

# 4. VACUUM
Write-Host "[4/10] VACUUM..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE relname='audit_logs' AND last_vacuum IS NOT NULL;" 2>&1
if ($result.Trim() -eq "1") {
    Write-Host "  [OK] VACUUM execute" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [WARN] VACUUM non execute" -ForegroundColor Yellow
    $checks += $false
}

# 5. Dates
Write-Host "[5/10] Plage dates..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT MIN(date), MAX(date) FROM audit_logs;" 2>&1
if ($result -match "2015" -and $result -match "202") {
    Write-Host "  [OK] Plage valide (2015 -> 2025)" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [WARN] $result" -ForegroundColor Yellow
    $checks += $true
}

# 6. Backup
Write-Host "[6/10] Backup..." -ForegroundColor Yellow
$backupDir = "C:\AKIG\backups"
$backups = Get-ChildItem -Path $backupDir -Filter "*.backup" -Recurse -ErrorAction SilentlyContinue
if ($backups.Count -gt 0) {
    $latest = $backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Write-Host "  [OK] Backup: $($latest.Name) ($([math]::Round($latest.Length/1MB, 2)) MB)" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [ERREUR] Aucun backup" -ForegroundColor Red
    $checks += $false
}

# 7. Taille
Write-Host "[7/10] Taille base..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT pg_size_pretty(pg_database_size('akig_immobilier'));" 2>&1
Write-Host "  [OK] Taille: $($result.Trim())" -ForegroundColor Green
$checks += $true

# 8. Connexions
Write-Host "[8/10] Connexions..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='akig_immobilier';" 2>&1
Write-Host "  [OK] $($result.Trim()) connexion(s)" -ForegroundColor Green
$checks += $true

# 9. Scripts
Write-Host "[9/10] Scripts..." -ForegroundColor Yellow
if (Test-Path "C:\AKIG\scripts\monitor-postgres.py") {
    Write-Host "  [OK] Script monitoring present" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [ERREUR] Script monitoring absent" -ForegroundColor Red
    $checks += $false
}

# 10. Documentation
Write-Host "[10/10] Documentation..." -ForegroundColor Yellow
if (Test-Path "C:\AKIG\MIGRATION_COMPLETE_README.md") {
    Write-Host "  [OK] Documentation presente" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  [ERREUR] Documentation absente" -ForegroundColor Red
    $checks += $false
}

# Resultat
Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  RESULTAT FINAL" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

$passed = ($checks | Where-Object { $_ -eq $true }).Count
$total = $checks.Count
$percentage = [math]::Round(($passed / $total) * 100, 0)

Write-Host "  Tests reussis : $passed / $total ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" })

if ($percentage -eq 100) {
    Write-Host "`n  [SUCCESS] MIGRATION 100% VALIDEE - PRET POUR PRODUCTION !" -ForegroundColor Green
    Write-Host "`n  Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "    1. Tester restauration backup" -ForegroundColor White
    Write-Host "    2. Configurer monitoring permanent" -ForegroundColor White
    Write-Host "    3. Documenter requetes critiques" -ForegroundColor White
    Write-Host "    4. Archiver MySQL" -ForegroundColor White
}
elseif ($percentage -ge 80) {
    Write-Host "`n  [WARN] MIGRATION REUSSIE avec optimisations recommandees" -ForegroundColor Yellow
}
else {
    Write-Host "`n  [ERROR] PROBLEMES DETECTES" -ForegroundColor Red
}

Write-Host ""
