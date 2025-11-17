<#
    Helper script: Attempt to ensure a running MySQL instance for historique migration.
    Strategy:
      1. Detect admin privileges. If admin, try to register/start MySQL80 service.
      2. If not admin or service registration fails, offer Docker fallback.
      3. Once running, export historique (optional) or just rely on direct migrator.

    Usage (standard PowerShell terminal):
        powershell -ExecutionPolicy Bypass -File scripts\setup-mysql-service-or-container.ps1 -Password "MySecret123!"

    Parameters:
        -Password : Root password (used for test + docker fallback). If omitted, script will prompt.

    Notes:
        - Requires Docker Desktop installed for container fallback.
        - The direct Python migrator expects historique table populated.
        - Adjust DATA_DIR if you want a custom location.
#>

param(
    [System.Security.SecureString]$PasswordSecure,
    [switch]$ForceDocker,
    [string]$Password # optional legacy plain text (will be converted)
)

function Test-AdminPrivilege {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not $Password -and -not $PasswordSecure) {
    $PasswordSecure = Read-Host -Prompt 'Enter MySQL root password (for service test / docker)' -AsSecureString
}

# Convert SecureString to plain for internal use (kept in local scope only)
if (-not $Password -and $PasswordSecure) {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($PasswordSecure)
    try { $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$base = 'C:\Program Files\MySQL\MySQL Server 8.4'
$bin = Join-Path $base 'bin'
$mysqld = Join-Path $bin 'mysqld.exe'
$mysqlCli = Join-Path $bin 'mysql.exe'
$dataDir = Join-Path $base 'data'

Write-Host "=== MySQL Setup Helper ===" -ForegroundColor Cyan
Write-Host "Password length: $($Password.Length)" -ForegroundColor DarkGray

if (-not (Test-Path $mysqld)) {
    Write-Host "mysqld.exe not found at expected path ($mysqld). Aborting." -ForegroundColor Red
    exit 1
}

function Test-MySQL {
    try {
        $env:MYSQL_PWD = $Password
        & $mysqlCli -u root -e 'SELECT 1' 2>$null | Out-Null
        Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        return $true
    }
    catch { return $false }
}

if (-not $ForceDocker) {
    $svc = Get-Service -Name 'MySQL80' -ErrorAction SilentlyContinue
    if ($svc) {
        if ($svc.Status -ne 'Running') {
            Write-Host 'Starting existing MySQL80 service...' -ForegroundColor Yellow
            try { Start-Service MySQL80 } catch {}
            Start-Sleep -Seconds 3
        }
        $svc = Get-Service -Name 'MySQL80' -ErrorAction SilentlyContinue
        if ($svc -and $svc.Status -eq 'Running' -and (Test-MySQL)) {
            Write-Host 'MySQL service running and accessible.' -ForegroundColor Green
        }
        else {
            Write-Host 'Service present but not accessible or failed test.' -ForegroundColor Red
        }
    }
    else {
        if (Test-AdminPrivilege) {
            Write-Host 'Attempting service registration (admin detected)...' -ForegroundColor Yellow
            # Try initialize data dir if missing
            if (-not (Test-Path $dataDir)) {
                Write-Host "Initializing insecure data directory: $dataDir" -ForegroundColor Yellow
                & $mysqld --initialize-insecure --basedir="$base" --datadir="$dataDir" 2>&1 | Select-Object -First 5
            }
            & $mysqld --install MySQL80 2>&1 | Select-Object -First 5 | Write-Host
            try { Start-Service MySQL80 } catch { Write-Host "Start-Service failed: $($_.Exception.Message)" -ForegroundColor Red }
            Start-Sleep -Seconds 3
            $svc = Get-Service -Name 'MySQL80' -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -eq 'Running') {
                Write-Host 'MySQL80 service registered and running.' -ForegroundColor Green
            }
            else {
                Write-Host 'Service registration failed; will fallback to Docker.' -ForegroundColor Red
                $ForceDocker = $true
            }
        }
        else {
            Write-Host 'Not admin: cannot register service. Will fallback to Docker.' -ForegroundColor Yellow
            $ForceDocker = $true
        }
    }
}

if ($ForceDocker) {
    Write-Host '--- Docker fallback path ---' -ForegroundColor Cyan
    & docker info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Docker not available. Install Docker Desktop or rerun as admin for service.' -ForegroundColor Red
        exit 2
    }
    $containerName = 'mysql_hist'
    $running = & docker ps --filter "name=$containerName" --format '{{.Names}}'
    if ($running -ne $containerName) {
        Write-Host 'Starting MySQL container...' -ForegroundColor Yellow
        & docker run --name $containerName -e MYSQL_ROOT_PASSWORD=$Password -e MYSQL_DATABASE=immobilier -p 3306:3306 -d mysql:8.4 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
        Start-Sleep -Seconds 8
    }
    else {
        Write-Host 'Container already running.' -ForegroundColor Green
    }
    # Test connection via client if available
    Write-Host 'Testing container connectivity...' -ForegroundColor Yellow
    $ok = Test-MySQL
    if ($ok) {
        Write-Host 'Container MySQL accessible.' -ForegroundColor Green
    }
    else {
        Write-Host 'Container test failed; inspect logs: docker logs mysql_hist' -ForegroundColor Red
        exit 3
    }
}

Write-Host 'Environment prepared. Set MYSQL_PASSWORD and run migrate_historique_direct.py.' -ForegroundColor Cyan
Write-Host 'Example:'
Write-Host '$env:MYSQL_PASSWORD="' + $Password + '"; python C:\\AKIG\\scripts\\migrate_historique_direct.py' -ForegroundColor Gray

exit 0