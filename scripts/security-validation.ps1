# ==================================================================================
# VALIDATION SÉCURITÉ - AKIG IMMOBILIER
# ==================================================================================
# Usage: powershell -ExecutionPolicy Bypass -File security-validation.ps1
# Tests: SQL Injection, ACL, Rate Limiting, Ports, SSL, Configuration
# ==================================================================================

param(
    [string]$BackendUrl = "http://localhost:4000",
    [switch]$SkipNetworkTests = $false
)

$ErrorActionPreference = "Continue"
$Global:FailedTests = 0
$Global:PassedTests = 0
$Global:WarningTests = 0

function Write-TestSection {
    param([string]$Title)
    Write-Host "`n$('=' * 80)" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "$('=' * 80)" -ForegroundColor Cyan
}

function Test-Pass {
    param([string]$Message)
    Write-Host "  ✅ PASS: $Message" -ForegroundColor Green
    $Global:PassedTests++
}

function Test-Fail {
    param([string]$Message)
    Write-Host "  ❌ FAIL: $Message" -ForegroundColor Red
    $Global:FailedTests++
}

function Test-Warning {
    param([string]$Message)
    Write-Host "  ⚠️  WARN: $Message" -ForegroundColor Yellow
    $Global:WarningTests++
}

# ==================================================================================
# TEST 1: CONFIGURATION SÉCURISÉE (.env)
# ==================================================================================
Write-TestSection "TEST 1: VALIDATION CONFIGURATION SÉCURISÉE"

Write-Host "`n Vérification fichier .env..."
$envFile = "C:\AKIG\backend\.env"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    # Test secrets non vides
    if ($envContent -match "JWT_SECRET=.{20,}") {
        Test-Pass "JWT_SECRET configuré (> 20 caractères)"
    } else {
        Test-Fail "JWT_SECRET faible ou vide (< 20 caractères)"
    }
    
    # Test DATABASE_URL sécurisée (pas de mot de passe en clair dans logs)
    if ($envContent -match "DATABASE_URL=postgresql://") {
        Test-Pass "DATABASE_URL PostgreSQL configurée"
    } else {
        Test-Warning "DATABASE_URL ne pointe pas vers PostgreSQL"
    }
    
    # Test environnement production
    if ($envContent -match "APP_ENV=production") {
        Test-Pass "APP_ENV=production configuré"
    } else {
        Test-Warning "APP_ENV n'est pas 'production' (OK si dev/staging)"
    }
    
    # Test CORS restreint
    if ($envContent -match "CORS_ORIGIN=http://localhost") {
        Test-Warning "CORS_ORIGIN=localhost (OK si dev, DANGEREUX si production)"
    } elseif ($envContent -match "CORS_ORIGIN=\*") {
        Test-Fail "CORS_ORIGIN=* (VULNÉRABILITÉ: accepte toutes origines)"
    } else {
        Test-Pass "CORS_ORIGIN configuré avec domaine spécifique"
    }
    
} else {
    Test-Fail "Fichier .env NOT FOUND à $envFile"
}

# ==================================================================================
# TEST 2: VALIDATION DATABASE (Pas d'accès externe)
# ==================================================================================
Write-TestSection "TEST 2: POSTGRESQL ACCÈS RÉSEAU"

Write-Host "`n Vérification port PostgreSQL (5432)..."
try {
    $pgConnections = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
    
    if ($pgConnections) {
        # Vérifier si écoute sur toutes interfaces (0.0.0.0 ou ::)
        $publicListen = $pgConnections | Where-Object { 
            $_.LocalAddress -eq "0.0.0.0" -or $_.LocalAddress -eq "::" 
        }
        
        if ($publicListen) {
            Test-Fail "PostgreSQL écoute sur toutes interfaces (0.0.0.0) - RISQUE SÉCURITÉ"
            Write-Host "    Recommandation: Configurer listen_addresses = 'localhost' dans postgresql.conf" -ForegroundColor Yellow
        } else {
            $localhostOnly = $pgConnections | Where-Object { 
                $_.LocalAddress -eq "127.0.0.1" -or $_.LocalAddress -eq "::1" 
            }
            if ($localhostOnly) {
                Test-Pass "PostgreSQL écoute uniquement sur localhost (sécurisé)"
            } else {
                Test-Warning "PostgreSQL configuration réseau à vérifier manuellement"
            }
        }
    } else {
        Test-Warning "Port 5432 non détecté (PostgreSQL arrêté ou port différent)"
    }
} catch {
    Test-Warning "Impossible de vérifier port PostgreSQL: $_"
}

# ==================================================================================
# TEST 3: BACKEND API - TESTS BASIQUES
# ==================================================================================
Write-TestSection "TEST 3: BACKEND API ACCESSIBILITÉ"

Write-Host "`n Test connexion backend ($BackendUrl)..."
try {
    $healthCheck = Invoke-WebRequest -Uri "$BackendUrl/api/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    
    if ($healthCheck.StatusCode -eq 200) {
        Test-Pass "Backend accessible (200 OK) à $BackendUrl/api/health"
    } else {
        Test-Warning "Backend répond avec code: $($healthCheck.StatusCode)"
    }
} catch {
    if ($_.Exception.Message -match "Unable to connect") {
        Test-Fail "Backend INACCESSIBLE à $BackendUrl (service arrêté?)"
    } else {
        Test-Warning "Backend health check échoué: $($_.Exception.Message)"
    }
}

# Test endpoint sans authentification (doit être refusé)
Write-Host "`n Test protection endpoints sans auth..."
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/contracts" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403) {
        Test-Pass "Endpoint protégé: accès sans auth refusé ($($response.StatusCode))"
    } elseif ($response.StatusCode -eq 200) {
        Test-Fail "VULNÉRABILITÉ: Endpoint /api/contracts accessible SANS authentification"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
        Test-Pass "Endpoint protégé: accès sans auth refusé (401/403)"
    } else {
        Test-Warning "Impossible de tester protection auth: $_"
    }
}

# ==================================================================================
# TEST 4: SQL INJECTION (Basique - manuel)
# ==================================================================================
Write-TestSection "TEST 4: PROTECTION SQL INJECTION"

Write-Host "`n Test injection SQL basique..."
Write-Host "  ℹ️  Tests manuels requis pour validation complète" -ForegroundColor Gray

# Test chaînes dangereuses
$dangerousInputs = @(
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "1' UNION SELECT NULL--",
    "admin'--"
)

Write-Host "`n  Chaînes dangereuses à tester manuellement:"
foreach ($input in $dangerousInputs) {
    Write-Host "    - Test: $BackendUrl/api/audit-logs?user_id=$input" -ForegroundColor Gray
    Write-Host "      Attendu: Erreur 400 ou résultats vides (PAS d'exécution SQL)" -ForegroundColor Gray
}

# Vérifier si pg utilise des requêtes paramétrées
$dbFile = "C:\AKIG\backend\src\db.js"
if (Test-Path $dbFile) {
    $dbContent = Get-Content $dbFile -Raw
    
    if ($dbContent -match "pg\.Pool" -or $dbContent -match "require\('pg'\)") {
        Test-Pass "Backend utilise 'pg' (bibliothèque avec requêtes paramétrées)"
    } else {
        Test-Warning "Impossible de confirmer utilisation requêtes paramétrées"
    }
} else {
    Test-Warning "Fichier db.js non trouvé - vérification manuelle requise"
}

# Vérifier routes utilisent paramètres
$routesDir = "C:\AKIG\backend\src\routes"
if (Test-Path $routesDir) {
    $routeFiles = Get-ChildItem -Path $routesDir -Filter "*.js" -Recurse
    $unsafeQueries = 0
    
    foreach ($file in $routeFiles) {
        $content = Get-Content $file.FullName -Raw
        # Chercher concaténation SQL dangereuse
        if ($content -match "query\([`"'].*\$\{" -or $content -match "query\([`"'].*\+" ) {
            $unsafeQueries++
            Test-Warning "Possible concaténation SQL dans $($file.Name) (vérifier manuellement)"
        }
    }
    
    if ($unsafeQueries -eq 0) {
        Test-Pass "Aucune concaténation SQL évidente détectée dans routes"
    }
} else {
    Test-Warning "Répertoire routes non trouvé - vérification manuelle requise"
}

# ==================================================================================
# TEST 5: PORTS OUVERTS (Minimal surface attack)
# ==================================================================================
Write-TestSection "TEST 5: SURFACE D'ATTAQUE RÉSEAU"

Write-Host "`n Ports TCP en écoute..."
try {
    $listenPorts = Get-NetTCPConnection | Where-Object { $_.State -eq "Listen" } | 
                   Select-Object LocalAddress, LocalPort -Unique | 
                   Sort-Object LocalPort
    
    # Ports attendus (whitelist)
    $expectedPorts = @(4000, 5432, 3306, 80, 443, 135, 445)  # Ajoutez vos ports légitimes
    
    $unexpectedPorts = @()
    foreach ($port in $listenPorts) {
        $portNum = $port.LocalPort
        
        if ($portNum -in $expectedPorts) {
            Write-Host "  ✅ Port $portNum ($($port.LocalAddress)) - Attendu" -ForegroundColor Green
        } elseif ($portNum -gt 49152) {
            # Ports dynamiques Windows (ignorés)
            Write-Host "  ℹ️  Port $portNum ($($port.LocalAddress)) - Dynamique (ignoré)" -ForegroundColor Gray
        } else {
            $unexpectedPorts += $portNum
            Write-Host "  ⚠️  Port $portNum ($($port.LocalAddress)) - Inattendu (vérifier)" -ForegroundColor Yellow
        }
    }
    
    if ($unexpectedPorts.Count -eq 0) {
        Test-Pass "Tous les ports en écoute sont attendus"
    } else {
        Test-Warning "$($unexpectedPorts.Count) ports inattendus détectés (voir ci-dessus)"
    }
    
} catch {
    Test-Warning "Impossible de lire ports: $_"
}

# ==================================================================================
# TEST 6: BACKUPS (Récents et accessibles)
# ==================================================================================
Write-TestSection "TEST 6: BACKUPS & DISASTER RECOVERY"

Write-Host "`n Vérification backups PostgreSQL..."
$backupDir = "C:\AKIG\backups"

if (Test-Path $backupDir) {
    $recentBackups = Get-ChildItem -Path $backupDir -Filter "*.backup" | 
                     Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }
    
    if ($recentBackups) {
        $latestBackup = $recentBackups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $age = (Get-Date) - $latestBackup.LastWriteTime
        $ageHours = [math]::Round($age.TotalHours, 1)
        
        if ($ageHours -lt 24) {
            Test-Pass "Backup récent trouvé: $($latestBackup.Name) (âge: $ageHours h)"
        } elseif ($ageHours -lt 48) {
            Test-Warning "Backup disponible mais > 24h: $($latestBackup.Name) (âge: $ageHours h)"
        } else {
            Test-Fail "Backup obsolète (> 48h): $($latestBackup.Name) (âge: $ageHours h)"
        }
        
        # Vérifier taille backup
        $sizeMB = [math]::Round($latestBackup.Length / 1MB, 2)
        if ($sizeMB -gt 1) {
            Test-Pass "Backup de taille raisonnable: $sizeMB MB"
        } else {
            Test-Warning "Backup très petit: $sizeMB MB (vérifier intégrité)"
        }
    } else {
        Test-Fail "Aucun backup récent (< 7 jours) trouvé"
    }
} else {
    Test-Fail "Répertoire backups inexistant: $backupDir"
}

# ==================================================================================
# TEST 7: CONFIGURATION POSTGRESQL (pg_hba.conf)
# ==================================================================================
Write-TestSection "TEST 7: POSTGRESQL CONFIGURATION SÉCURITÉ"

Write-Host "`n Vérification pg_hba.conf (accès réseau)..."
try {
    $env:PGPASSWORD = "postgres"
    $pgHbaFile = & psql -h localhost -U postgres -d akig_immobilier -t -A -c "SHOW hba_file;" 2>&1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    if ($pgHbaFile -and (Test-Path $pgHbaFile.Trim())) {
        $hbaContent = Get-Content $pgHbaFile.Trim() | Where-Object { $_ -notmatch "^#" -and $_ -match "\S" }
        
        # Chercher règles dangereuses (trust, 0.0.0.0/0)
        $dangerousRules = $hbaContent | Where-Object { 
            $_ -match "trust" -or $_ -match "0\.0\.0\.0/0" -or $_ -match "::/0"
        }
        
        if ($dangerousRules) {
            Test-Fail "pg_hba.conf contient règles DANGEREUSES:"
            $dangerousRules | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
        } else {
            Test-Pass "pg_hba.conf ne contient pas de règles dangereuses évidentes"
        }
    } else {
        Test-Warning "Impossible de lire pg_hba.conf - vérification manuelle requise"
    }
} catch {
    Test-Warning "Impossible de vérifier pg_hba.conf: $_"
}

# ==================================================================================
# TEST 8: PERMISSIONS FICHIERS
# ==================================================================================
Write-TestSection "TEST 8: PERMISSIONS FICHIERS SENSIBLES"

Write-Host "`n Vérification permissions .env..."
$envFile = "C:\AKIG\backend\.env"

if (Test-Path $envFile) {
    $acl = Get-Acl $envFile
    $everyone = $acl.Access | Where-Object { $_.IdentityReference -match "Everyone|Users" }
    
    if ($everyone) {
        Test-Warning ".env accessible par 'Everyone' ou 'Users' (risque fuite credentials)"
    } else {
        Test-Pass ".env restreint aux admins/owner"
    }
} else {
    Test-Warning "Fichier .env non trouvé"
}

# ==================================================================================
# RAPPORT FINAL
# ==================================================================================
Write-Host "`n$('=' * 80)" -ForegroundColor Cyan
Write-Host "RAPPORT SÉCURITÉ FINAL" -ForegroundColor Cyan
Write-Host "$('=' * 80)" -ForegroundColor Cyan

$totalTests = $Global:PassedTests + $Global:FailedTests + $Global:WarningTests

Write-Host "`nRÉSULTATS:" -ForegroundColor White
Write-Host "  ✅ PASSED:  $Global:PassedTests" -ForegroundColor Green
Write-Host "  ⚠️  WARNING: $Global:WarningTests" -ForegroundColor Yellow
Write-Host "  ❌ FAILED:  $Global:FailedTests" -ForegroundColor Red
Write-Host "  📊 TOTAL:   $totalTests tests"

Write-Host "`nVERDICT:" -ForegroundColor White
if ($Global:FailedTests -eq 0 -and $Global:WarningTests -eq 0) {
    Write-Host "  🏆 EXCELLENT - Aucun problème détecté" -ForegroundColor Green
    $exitCode = 0
} elseif ($Global:FailedTests -eq 0) {
    Write-Host "  ✅ BON - $Global:WarningTests warnings à vérifier" -ForegroundColor Yellow
    $exitCode = 0
} elseif ($Global:FailedTests -le 2) {
    Write-Host "  ⚠️  ACCEPTABLE - $Global:FailedTests échecs mineurs" -ForegroundColor Yellow
    Write-Host "     Corriger avant production" -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "  ❌ CRITIQUE - $Global:FailedTests échecs détectés" -ForegroundColor Red
    Write-Host "     🚨 NO-GO - Corriger IMMÉDIATEMENT" -ForegroundColor Red
    $exitCode = 2
}

Write-Host "`nRECOMMANDATIONS:" -ForegroundColor White
if ($Global:FailedTests -gt 0) {
    Write-Host "  1. Corriger tous les tests FAILED ci-dessus" -ForegroundColor Yellow
    Write-Host "  2. Re-exécuter: powershell -File security-validation.ps1" -ForegroundColor Yellow
    Write-Host "  3. Si tous PASS → Continuer vers GO/NO-GO" -ForegroundColor Yellow
}

if ($Global:WarningTests -gt 0) {
    Write-Host "  - Investiguer warnings (peuvent être OK selon environnement)" -ForegroundColor Gray
}

Write-Host ""
exit $exitCode
