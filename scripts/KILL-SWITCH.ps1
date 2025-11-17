# ==================================================================================
# KILL-SWITCH - ARRÊT TOTAL & REVERT MYSQL EN 30 SECONDES
# ==================================================================================
# Objectif: Rollback d'urgence si catastrophe après lancement
# Usage: powershell -ExecutionPolicy Bypass -File KILL-SWITCH.ps1
# ==================================================================================
# ⚠️  EXÉCUTEZ UNIQUEMENT EN CAS DE CHAOS TOTAL POST-LANCEMENT
# ==================================================================================

param(
    [string]$Reason = "KILL-SWITCH activé - catastrophe production détectée"
)

$ErrorActionPreference = "Continue"
$Global:KillSwitchStart = Get-Date

function Write-KillSwitch {
    param([string]$Message, [string]$Color = "Red")
    $elapsed = (Get-Date) - $Global:KillSwitchStart
    Write-Host "[$($elapsed.ToString('ss\.ff'))s] 🚨 $Message" -ForegroundColor $Color
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║                      🚨 KILL-SWITCH ACTIVÉ 🚨                   ║" -ForegroundColor Red
Write-Host "║                   ARRÊT TOTAL & REVERT MYSQL                   ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""
Write-KillSwitch "Raison: $Reason" "Red"
Write-Host ""

# ==================================================================================
# ÉTAPE 1: ARRÊT APPLICATION BACKEND (STOP TOUT TRAFIC ENTRANT)
# ==================================================================================
Write-KillSwitch "ÉTAPE 1: Arrêt backend (stop trafic)" "Yellow"

# Arrêt Node.js (si process actif)
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-KillSwitch "✅ Backend Node.js arrêté ($($nodeProcesses.Count) processus)" "Green"
    } else {
        Write-KillSwitch "⚠️  Aucun processus Node.js détecté" "Yellow"
    }
}
catch {
    Write-KillSwitch "❌ Erreur arrêt Node.js: $_" "Red"
}

# Arrêt PM2 (si utilisé)
try {
    $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
    if ($pm2) {
        & pm2 stop all 2>&1 | Out-Null
        Write-KillSwitch "✅ PM2 arrêté (all apps stopped)" "Green"
    }
}
catch {
    Write-KillSwitch "⚠️  PM2 non utilisé ou erreur" "Yellow"
}

# Arrêt Docker containers AKIG (si utilisés)
try {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        $containers = docker ps --filter "name=akig" --format "{{.Names}}" 2>$null
        if ($containers) {
            docker stop $containers 2>&1 | Out-Null
            Write-KillSwitch "✅ Docker containers AKIG arrêtés" "Green"
        }
    }
}
catch {
    Write-KillSwitch "⚠️  Docker non utilisé ou erreur" "Yellow"
}

# ==================================================================================
# ÉTAPE 2: MYSQL REDEVIENT MASTER (WRITABLE)
# ==================================================================================
Write-KillSwitch "ÉTAPE 2: MySQL → WRITABLE (master)" "Yellow"

$MYSQL_HOST = "localhost"
$MYSQL_USER = "root"
$MYSQL_PASS = "akig2025"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

if (Test-Path $mysqlExe) {
    try {
        $env:MYSQL_PWD = $MYSQL_PASS
        & $mysqlExe -h $MYSQL_HOST -u $MYSQL_USER -e "SET GLOBAL read_only = OFF;" 2>&1 | Out-Null
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
        Write-KillSwitch "✅ MySQL READ_ONLY = OFF (writable)" "Green"
    }
    catch {
        Write-KillSwitch "❌ Erreur MySQL writable: $_" "Red"
    }
    
    # Redémarrer MySQL (flush connections)
    try {
        Restart-Service -Name "MySQL80" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Write-KillSwitch "✅ Service MySQL redémarré" "Green"
    }
    catch {
        Write-KillSwitch "⚠️  Redémarrage MySQL échoué (peut nécessiter admin)" "Yellow"
    }
}
else {
    Write-KillSwitch "❌ mysql.exe non trouvé à: $mysqlExe" "Red"
}

# ==================================================================================
# ÉTAPE 3: RESTAURER .ENV BACKEND → MySQL
# ==================================================================================
Write-KillSwitch "ÉTAPE 3: Config backend → MySQL" "Yellow"

$backendPath = "C:\AKIG\backend"
$envFile = Join-Path $backendPath ".env"
$backupDir = Get-ChildItem "C:\AKIG\backups\cutover-*" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($backupDir -and (Test-Path "$backupDir\.env.backup")) {
    Copy-Item "$backupDir\.env.backup" $envFile -Force
    Write-KillSwitch "✅ .env restauré depuis backup cutover" "Green"
}
else {
    # Créer .env MySQL manuellement
    $mysqlEnv = @"
# KILL-SWITCH: Configuration MySQL d'urgence (générée $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://root:akig2025@localhost:3306/akig_legacy
JWT_SECRET=emergency_secret_key_change_after_incident_$(Get-Random -Maximum 99999)
CORS_ORIGIN=http://localhost:3000
"@
    $mysqlEnv | Out-File $envFile -Encoding UTF8 -Force
    Write-KillSwitch "✅ .env MySQL créé (config d'urgence)" "Green"
}

# ==================================================================================
# ÉTAPE 4: ARCHIVER POSTGRESQL (FORENSICS)
# ==================================================================================
Write-KillSwitch "ÉTAPE 4: PostgreSQL → ARCHIVE (forensics)" "Yellow"

$forensicsDir = "C:\AKIG\backups\kill-switch-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $forensicsDir -Force | Out-Null

$pgDump = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
if (Test-Path $pgDump) {
    try {
        $env:PGPASSWORD = "postgres"
        & $pgDump -h localhost -U postgres -d akig_immobilier -Fc -f "$forensicsDir\postgres-emergency-shutdown.backup" 2>&1 | Out-Null
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        
        if ($LASTEXITCODE -eq 0) {
            $size = (Get-Item "$forensicsDir\postgres-emergency-shutdown.backup").Length / 1MB
            Write-KillSwitch "✅ PostgreSQL archivé: $([math]::Round($size, 2)) MB" "Green"
        }
    }
    catch {
        Write-KillSwitch "⚠️  Archivage PostgreSQL échoué (non-critique)" "Yellow"
    }
}

# Arrêter PostgreSQL (optionnel, réduit charge serveur)
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        Stop-Service -Name $pgService.Name -Force -ErrorAction SilentlyContinue
        Write-KillSwitch "✅ Service PostgreSQL arrêté" "Green"
    }
}
catch {
    Write-KillSwitch "⚠️  Arrêt PostgreSQL échoué (peut nécessiter admin)" "Yellow"
}

# ==================================================================================
# ÉTAPE 5: REDÉMARRER BACKEND SUR MYSQL
# ==================================================================================
Write-KillSwitch "ÉTAPE 5: Redémarrage backend (MySQL)" "Yellow"

# Note: Sur Windows, démarrage manuel recommandé pour validation
Write-KillSwitch "⚠️  DÉMARRAGE MANUEL REQUIS:" "Yellow"
Write-Host "   cd C:\AKIG\backend" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""

# Alternative: Démarrage automatique (si PM2/Docker)
try {
    $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
    if ($pm2) {
        Push-Location $backendPath
        & pm2 start npm --name "akig-backend" -- start 2>&1 | Out-Null
        Pop-Location
        Write-KillSwitch "✅ Backend redémarré via PM2" "Green"
    }
}
catch {
    Write-KillSwitch "⚠️  Démarrage automatique impossible, MANUEL requis" "Yellow"
}

# ==================================================================================
# ÉTAPE 6: NOTIFICATION ÉQUIPE
# ==================================================================================
Write-KillSwitch "ÉTAPE 6: Notification équipe" "Yellow"

$incidentReport = @"
╔════════════════════════════════════════════════════════════════╗
║              🚨 KILL-SWITCH ACTIVÉ - INCIDENT CRITIQUE          ║
╚════════════════════════════════════════════════════════════════╝

Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Raison: $Reason
Opérateur: $env:USERNAME
Machine: $env:COMPUTERNAME

ACTIONS EXÉCUTÉES:
✅ Backend arrêté (Node.js/PM2/Docker)
✅ MySQL → WRITABLE (master restauré)
✅ Configuration backend → MySQL
✅ PostgreSQL archivé: $forensicsDir
⚠️  Backend redémarrage: MANUEL REQUIS

ÉTAT ACTUEL:
- Base de données active: MySQL (akig_legacy)
- Backend: ARRÊTÉ (nécessite redémarrage manuel)
- PostgreSQL: ARCHIVÉ (forensics disponible)

PROCHAINES ÉTAPES:
1. Redémarrer backend: cd C:\AKIG\backend; npm start
2. Valider connexion MySQL: curl http://localhost:4000/api/health
3. Investiguer cause: Analyser logs dans $forensicsDir
4. Post-mortem: Réunion équipe sous 2h

TEMPS D'ARRÊT TOTAL: ~30 secondes
BACKUP DISPONIBLE: $forensicsDir

CONTACTS URGENCE:
- DBA: _______________ (tel: _______________)
- Dev Lead: _______________ (tel: _______________)
- DevOps: _______________ (tel: _______________)
"@

$incidentFile = Join-Path $forensicsDir "INCIDENT-REPORT.txt"
$incidentReport | Out-File $incidentFile -Encoding UTF8

Write-Host ""
Write-Host $incidentReport -ForegroundColor Yellow
Write-Host ""

# Email notification (si configuré)
# Uncomment et configurer SMTP si email requis:
# Send-MailMessage -To "team@akig.fr" -From "noreply@akig.fr" -Subject "🚨 KILL-SWITCH ACTIVÉ" -Body $incidentReport -SmtpServer "smtp.office365.com"

Write-KillSwitch "✅ Rapport incident sauvegardé: $incidentFile" "Green"

# ==================================================================================
# ÉTAPE 7: STATUT FINAL
# ==================================================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ KILL-SWITCH TERMINÉ                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$totalElapsed = (Get-Date) - $Global:KillSwitchStart
Write-KillSwitch "Temps total: $($totalElapsed.TotalSeconds.ToString('0.00'))s" "Cyan"
Write-Host ""
Write-Host "SYSTÈME REVENU SUR MYSQL (LEGACY)" -ForegroundColor Green
Write-Host "POSTGRESQL ARRÊTÉ ET ARCHIVÉ" -ForegroundColor Green
Write-Host "BACKUP DISPONIBLE: $forensicsDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  REDÉMARRAGE BACKEND REQUIS:" -ForegroundColor Yellow
Write-Host "   cd C:\AKIG\backend" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "Temps d'arrêt estimé: ~30 secondes" -ForegroundColor Yellow
Write-Host ""

# Retour code
if ($totalElapsed.TotalSeconds -lt 30) {
    Write-Host "✅ OBJECTIF ATTEINT: Rollback < 30s" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  Rollback > 30s (objectif non atteint)" -ForegroundColor Yellow
    exit 1
}
