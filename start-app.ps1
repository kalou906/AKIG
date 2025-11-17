# ============================================================
# 🚀 SCRIPT LANCEMENT AKIG - Windows PowerShell
# Démarrage API, Frontend, DB en un seul clic
# ============================================================

param(
    [string]$Action = "start",
    [bool]$Clean = $false,
    [bool]$Build = $true
)

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 AKIG - Logiciel Immobilier Premium (Guinée)            ║" -ForegroundColor Cyan
Write-Host "║              v1.0.0 - Démarrage Système                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📋 Configuration Système:" -ForegroundColor Yellow

# Vérifier Docker
Write-Host "✓ Vérification Docker..." -ForegroundColor Gray
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker non trouvé! Installez Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "  $dockerVersion" -ForegroundColor Green

# Vérifier Docker Compose
Write-Host "✓ Vérification Docker Compose..." -ForegroundColor Gray
$composeVersion = docker compose version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Compose non trouvé!" -ForegroundColor Red
    exit 1
}
Write-Host "  $composeVersion" -ForegroundColor Green

# Vérifier Node.js (optionnel - pour dev local)
Write-Host "✓ Vérification Node.js..." -ForegroundColor Gray
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Node $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  (non installé - utilisation docker)" -ForegroundColor Yellow
}

# Charger .env
Write-Host "`n🔧 Chargement configuration..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "  ⚠️  Fichier .env non trouvé, création par défaut..." -ForegroundColor Yellow
    @"
# ============================================================
# AKIG Environment Configuration
# ============================================================

# Base de données
DB_USER=akig_user
DB_PASSWORD=secure_password_change_me_in_production
DB_NAME=akig_db
DB_PORT=5432

# Backend API
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_change_me_in_production
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:3000

# SMTP (pour emails/relances)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=noreply@akig.gn
SMTP_PASS=password

# Frontend
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_ENV=production

# Redis
REDIS_PASSWORD=redis_password_secure

# Logs
LOG_LEVEL=info

"@ | Out-File -Encoding UTF8 ".env"
    Write-Host "  ✓ .env créé (veuillez configurer les secrets)" -ForegroundColor Green
}

# Action de démarrage
switch ($Action.ToLower()) {
    "start" {
        Write-Host "`n🚀 Démarrage AKIG..." -ForegroundColor Green
        
        if ($Clean) {
            Write-Host "  🧹 Nettoyage des conteneurs..." -ForegroundColor Yellow
            docker compose down -v
        }
        
        if ($Build) {
            Write-Host "  🔨 Construction des images..." -ForegroundColor Yellow
            docker compose build --no-cache
        }
        
        Write-Host "  📦 Démarrage services..." -ForegroundColor Yellow
        docker compose up -d
        
        # Attendre que l'API soit prête
        $attempts = 0
        $maxAttempts = 60
        
        Write-Host "  ⏳ Attente API..." -ForegroundColor Yellow
        while ($attempts -lt $maxAttempts) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method Get -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Host "  ✓ API prête!" -ForegroundColor Green
                    break
                }
            } catch {
                $attempts++
                Start-Sleep -Seconds 1
            }
        }
        
        if ($attempts -eq $maxAttempts) {
            Write-Host "  ⚠️  API non répondante après ${maxAttempts}s" -ForegroundColor Yellow
        }
        
        # Afficher URLs
        Write-Host "`n" -ForegroundColor Gray
        Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║          ✅ AKIG Démarré avec Succès!                         ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        
        Write-Host "`n🌐 URLs Disponibles:" -ForegroundColor Cyan
        Write-Host "  🖥️  Frontend:   " -ForegroundColor White -NoNewline
        Write-Host "http://localhost:3000" -ForegroundColor Yellow
        
        Write-Host "  🔌 API:        " -ForegroundColor White -NoNewline
        Write-Host "http://localhost:4000/api" -ForegroundColor Yellow
        
        Write-Host "  📚 Documentation: " -ForegroundColor White -NoNewline
        Write-Host "http://localhost:4000/api/docs" -ForegroundColor Yellow
        
        Write-Host "  🗄️  Base de données:" -ForegroundColor White -NoNewline
        Write-Host " localhost:5432" -ForegroundColor Yellow
        
        Write-Host "`n💡 Commandes Utiles:" -ForegroundColor Cyan
        Write-Host "  Voir logs:           docker compose logs -f api"
        Write-Host "  Arrêter:             docker compose down"
        Write-Host "  Shell backend:       docker compose exec api /bin/sh"
        Write-Host "  Réinitialiser BD:    docker compose down -v && docker compose up -d"
        
        Write-Host "`n🎯 Prochaines étapes:" -ForegroundColor Cyan
        Write-Host "  1. Créer compte administrateur"
        Write-Host "  2. Configurer les paramètres de l'agence"
        Write-Host "  3. Importer les données existantes"
        Write-Host "  4. Configurer les relances automatiques"
        
        Write-Host "`n"
    }
    
    "stop" {
        Write-Host "⛔ Arrêt AKIG..." -ForegroundColor Yellow
        docker compose down
        Write-Host "✓ Services arrêtés" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 Redémarrage AKIG..." -ForegroundColor Yellow
        docker compose restart
        Write-Host "✓ Services redémarrés" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "📋 Logs API:" -ForegroundColor Cyan
        docker compose logs -f api
    }
    
    "clean" {
        Write-Host "🧹 Nettoyage complet..." -ForegroundColor Yellow
        docker compose down -v
        Remove-Item -Path "backend/exports/*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Nettoyage terminé" -ForegroundColor Green
    }
    
    "status" {
        Write-Host "📊 État des services:" -ForegroundColor Cyan
        docker compose ps
    }
    
    "db-backup" {
        Write-Host "💾 Sauvegarde base de données..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        docker compose exec -T postgres pg_dump -U akig_user akig_db | Out-File "backup_akig_$timestamp.sql"
        Write-Host "✓ Sauvegarde créée: backup_akig_$timestamp.sql" -ForegroundColor Green
    }
    
    "db-restore" {
        if ($args.Count -lt 1) {
            Write-Host "❌ Usage: .\start-app.ps1 -Action db-restore <fichier.sql>" -ForegroundColor Red
            exit 1
        }
        Write-Host "📂 Restauration base de données..." -ForegroundColor Yellow
        Get-Content $args[0] | docker compose exec -T postgres psql -U akig_user akig_db
        Write-Host "✓ Restauration terminée" -ForegroundColor Green
    }
    
    "shell" {
        Write-Host "🐚 Accès shell backend..." -ForegroundColor Yellow
        docker compose exec api /bin/sh
    }
    
    "test" {
        Write-Host "🧪 Exécution tests..." -ForegroundColor Yellow
        docker compose exec api npm test
    }
    
    default {
        Write-Host "❌ Action inconnue: $Action" -ForegroundColor Red
        Write-Host "`nActions disponibles:" -ForegroundColor Yellow
        Write-Host "  start     - Démarrer AKIG"
        Write-Host "  stop      - Arrêter AKIG"
        Write-Host "  restart   - Redémarrer AKIG"
        Write-Host "  logs      - Voir logs API"
        Write-Host "  status    - État des services"
        Write-Host "  clean     - Nettoyage complet"
        Write-Host "  db-backup - Sauvegarder BD"
        Write-Host "  db-restore <file> - Restaurer BD"
        Write-Host "  shell     - Accès shell backend"
        Write-Host "  test      - Exécuter tests"
        exit 1
    }
}
