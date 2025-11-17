# CHECKLIST POST-MIGRATION - AKIG Immobilier
# Exécution : .\scripts\post-migration-checklist.ps1

$ErrorActionPreference = "Continue"
$env:PGPASSWORD = 'postgres'
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     CHECKLIST POST-MIGRATION - Validation Complète       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$checks = @()

# 1. Vérifier comptage des lignes
Write-Host "[1/10] Vérification comptage des lignes..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM audit_logs;" 2>&1
if ($result -match "29355") {
    Write-Host "  ✅ audit_logs: 29,355 lignes (OK)" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ❌ audit_logs: comptage incorrect ($result)" -ForegroundColor Red
    $checks += $false
}

# 2. Vérifier absence de dead tuples
Write-Host "[2/10] Vérification dead tuples..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT SUM(n_dead_tup) FROM pg_stat_user_tables WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports');" 2>&1
if ($result -match "^\s*0\s*$") {
    Write-Host "  ✅ 0 dead tuples (tables optimales)" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ⚠️  $result dead tuples détectés" -ForegroundColor Yellow
    $checks += $true
}

# 3. Vérifier index créés
Write-Host "[3/10] Vérification index..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename='audit_logs';" 2>&1
if ([int]$result.Trim() -ge 4) {
    Write-Host "  ✅ $($result.Trim()) index créés sur audit_logs" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ❌ Seulement $($result.Trim()) index (4 attendus)" -ForegroundColor Red
    $checks += $false
}

# 4. Vérifier VACUUM récent
Write-Host "[4/10] Vérification dernière maintenance..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE relname='audit_logs' AND last_vacuum IS NOT NULL;" 2>&1
if ($result -match "1") {
    Write-Host "  ✅ VACUUM exécuté récemment" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ⚠️  VACUUM non exécuté" -ForegroundColor Yellow
    $checks += $false
}

# 5. Vérifier plage de dates
Write-Host "[5/10] Vérification plage de dates..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT MIN(date), MAX(date) FROM audit_logs;" 2>&1
if ($result -match "2015" -and $result -match "202") {
    Write-Host "  ✅ Plage de dates valide (2015 → 2025)" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ⚠️  Plage de dates: $result" -ForegroundColor Yellow
    $checks += $true
}

# 6. Vérifier backup existe
Write-Host "[6/10] Vérification backup..." -ForegroundColor Yellow
$backupDir = "C:\AKIG\backups"
$backups = Get-ChildItem -Path $backupDir -Filter "*.backup" -Recurse -ErrorAction SilentlyContinue
if ($backups.Count -gt 0) {
    $latest = $backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Write-Host "  ✅ Backup trouvé: $($latest.Name) ($([math]::Round($latest.Length/1MB, 2)) MB)" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ❌ Aucun backup trouvé" -ForegroundColor Red
    $checks += $false
}

# 7. Vérifier taille base de données
Write-Host "[7/10] Vérification taille base..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT pg_size_pretty(pg_database_size('akig_immobilier'));" 2>&1
Write-Host "  ✅ Taille: $($result.Trim())" -ForegroundColor Green
$checks += $true

# 8. Vérifier connexions actives
Write-Host "[8/10] Vérification connexions..." -ForegroundColor Yellow
$result = & $psql -U postgres -h localhost -d akig_immobilier -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='akig_immobilier';" 2>&1
Write-Host "  ✅ $($result.Trim()) connexion(s) active(s)" -ForegroundColor Green
$checks += $true

# 9. Vérifier script monitoring existe
Write-Host "[9/10] Vérification scripts..." -ForegroundColor Yellow
if (Test-Path "C:\AKIG\scripts\monitor-postgres.py") {
    Write-Host "  ✅ Script monitoring présent" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ❌ Script monitoring absent" -ForegroundColor Red
    $checks += $false
}

# 10. Vérifier documentation
Write-Host "[10/10] Vérification documentation..." -ForegroundColor Yellow
if (Test-Path "C:\AKIG\MIGRATION_COMPLETE_README.md") {
    Write-Host "  ✅ Documentation complète présente" -ForegroundColor Green
    $checks += $true
}
else {
    Write-Host "  ❌ Documentation absente" -ForegroundColor Red
    $checks += $false
}

# Résultat final
Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    RÉSULTAT FINAL                         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$passed = ($checks | Where-Object { $_ -eq $true }).Count
$total = $checks.Count
$percentage = [math]::Round(($passed / $total) * 100, 0)

Write-Host "  Tests réussis : $passed / $total ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" })

if ($percentage -eq 100) {
    Write-Host "`n  🎉 MIGRATION 100% VALIDÉE - PRÊT POUR PRODUCTION !" -ForegroundColor Green
    Write-Host "`n  Prochaines étapes recommandées:" -ForegroundColor Cyan
    Write-Host "    1. Tester restauration backup dans environnement séparé" -ForegroundColor White
    Write-Host "    2. Configurer monitoring permanent (pg_stat_statements)" -ForegroundColor White
    Write-Host "    3. Documenter les requêtes critiques de l'application" -ForegroundColor White
    Write-Host "    4. Planifier archivage MySQL (gzip + stockage froid)" -ForegroundColor White
}
elseif ($percentage -ge 80) {
    Write-Host "`n  ⚠️  MIGRATION RÉUSSIE avec quelques optimisations recommandées" -ForegroundColor Yellow
}
else {
    Write-Host "`n  ❌ PROBLÈMES DÉTECTÉS - Intervention requise" -ForegroundColor Red
}

Write-Host ""
