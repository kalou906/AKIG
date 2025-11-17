<#
.SYNOPSIS
Creates a secure MySQL configuration file and launches the secure export/import pipeline.

This script prompts interactively for MySQL credentials (password hidden), stores them in a JSON file
with restrictive ACL (read-only for current user), then invokes export-and-import-pipeline-secure.ps1.
#>

$ErrorActionPreference = 'Stop'
Write-Host "Secure MySQL credential setup" -ForegroundColor Cyan

$MYSQL_HOST = Read-Host "MySQL host (default: localhost)"
if (-not $MYSQL_HOST) { $MYSQL_HOST = 'localhost' }

$MYSQL_USER = Read-Host "MySQL user (default: root)"
if (-not $MYSQL_USER) { $MYSQL_USER = 'root' }

$securePass = Read-Host "MySQL password" -AsSecureString
$MYSQL_PASS = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
)

$MYSQL_DB = Read-Host "Database name (default: immobilier)"
if (-not $MYSQL_DB) { $MYSQL_DB = 'immobilier' }

$secureDir = "C:\AKIG\secure"
if (!(Test-Path $secureDir)) { New-Item -ItemType Directory -Path $secureDir | Out-Null }

$configFile = Join-Path $secureDir 'mysql_config.json'

@{
    host     = $MYSQL_HOST
    user     = $MYSQL_USER
    password = $MYSQL_PASS
    database = $MYSQL_DB
    table    = 'historique'
} | ConvertTo-Json | Out-File -FilePath $configFile -Encoding UTF8

# Restrict ACL: remove inheritance and grant read to current user only
icacls $configFile /inheritance:r /grant:r "$env:USERNAME:(R)" | Out-Null

Write-Host "Config written: $configFile (restricted access)" -ForegroundColor Green
Write-Host "Launching secure pipeline..." -ForegroundColor Yellow

$pipelineScript = Join-Path $PSScriptRoot 'export-and-import-pipeline-secure.ps1'
if (!(Test-Path $pipelineScript)) {
    Write-Host "Secure pipeline script not found: $pipelineScript" -ForegroundColor Red
    exit 1
}

& $pipelineScript
