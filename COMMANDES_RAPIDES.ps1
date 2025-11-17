# ============================================================
# AKIG - Commandes Rapides pour Validation Multi-Navigateurs
# Script PowerShell pour Windows 10/11
# ============================================================

# Paramètres
$ErrorActionPreference = "Stop"
$ForegroundColor = "Green"

function Show-Banner {
    Clear-Host
    Write-Host @"
╔════════════════════════════════════════════════════════════╗
║  AKIG - COMMANDES RAPIDES VALIDATION MULTI-NAVIGATEURS    ║
║         Exécution sur Windows PowerShell                  ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
}

function Show-Menu {
    Write-Host @"
🎯 MENU PRINCIPAL
═════════════════════════════════════════════════════════════

1️⃣  INITIALISER LE PROJET
   npm install
   npx playwright install

2️⃣  VÉRIFIER LA CONFIGURATION
   node scripts/validate-web-standards.js
   node scripts/launch-checklist.js

3️⃣  EXÉCUTER LES TESTS
   3.1 - Tous les navigateurs
   3.2 - Chrome uniquement
   3.3 - Firefox uniquement
   3.4 - Safari/WebKit
   3.5 - Edge
   3.6 - Mobile
   3.7 - Legacy (IE11)
   3.8 - Mode Debug
   3.9 - Mode UI Interactive

4️⃣  DÉMARRER L'APPLICATION
   4.1 - Mode développement
   4.2 - Mode production

5️⃣  MONITORING & ANALYTICS
   5.1 - Ouvrir Sentry Dashboard
   5.2 - Ouvrir Google Analytics
   5.3 - Voir le rapport de test

6️⃣  NETTOYAGE & MAINTENANCE
   6.1 - Nettoyer les builds
   6.2 - Réinstaller Playwright
   6.3 - Mettre à jour les dépendances

7️⃣  DÉPANNAGE
   7.1 - Vérifier les logs
   7.2 - Vérifier les ports occupés
   7.3 - Réinitialiser l'environnement

0️⃣  QUITTER

═════════════════════════════════════════════════════════════
"@ -ForegroundColor Yellow

    $choice = Read-Host "Choisir une option (0-7)"
    Handle-MenuChoice $choice
}

function Handle-MenuChoice {
    param([string]$choice)
    
    switch ($choice) {
        # INITIALISER
        "1" {
            Initialize-Project
        }
        
        # VÉRIFIER
        "2" {
            Verify-Configuration
        }
        
        # TESTS
        "3" {
            Show-TestMenu
        }
        
        # DÉMARRER
        "4" {
            Show-StartMenu
        }
        
        # MONITORING
        "5" {
            Show-MonitoringMenu
        }
        
        # MAINTENANCE
        "6" {
            Show-MaintenanceMenu
        }
        
        # DÉPANNAGE
        "7" {
            Show-TroubleshootMenu
        }
        
        # QUITTER
        "0" {
            Write-Host "Au revoir! 👋" -ForegroundColor Green
            exit 0
        }
        
        default {
            Write-Host "Option invalide!" -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-Menu
        }
    }
}

# ============================================================
# FONCTIONS PRINCIPALES
# ============================================================

function Initialize-Project {
    Clear-Host
    Write-Host "📦 INITIALISATION DU PROJET" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    # Vérifier Node.js
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Node.js n'est pas installé!" -ForegroundColor Red
        Write-Host "Télécharger depuis: https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "Appuyer sur Entrée pour continuer"
        return
    }
    
    Write-Host "✅ Node.js trouvé: $(node --version)" -ForegroundColor Green
    
    Write-Host "`n📥 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    
    Write-Host "`n📥 Installation des navigateurs Playwright..." -ForegroundColor Yellow
    npx playwright install
    
    Write-Host "`n✅ Initialisation terminée!" -ForegroundColor Green
    Read-Host "Appuyer sur Entrée pour continuer"
    Show-Menu
}

function Verify-Configuration {
    Clear-Host
    Write-Host "🔍 VÉRIFICATION DE LA CONFIGURATION" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    Write-Host "`n1️⃣  Validation des standards web..." -ForegroundColor Yellow
    node scripts/validate-web-standards.js
    
    Write-Host "`n2️⃣  Vérification de la configuration système..." -ForegroundColor Yellow
    node scripts/launch-checklist.js
    
    Read-Host "`nAppuyer sur Entrée pour continuer"
    Show-Menu
}

function Show-TestMenu {
    Clear-Host
    Write-Host "🧪 EXÉCUTION DES TESTS" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $testChoice = Read-Host @"
1 - Tous les navigateurs (109+ tests)
2 - Chrome uniquement
3 - Firefox uniquement
4 - Safari/WebKit
5 - Edge
6 - Mobile (Android + iOS)
7 - Legacy (IE11)
8 - Mode Debug (avec pause)
9 - Mode UI (dashboard interactif)
0 - Retour au menu

Choisir:
"@
    
    switch ($testChoice) {
        "1" {
            Write-Host "`n▶️ Exécution: npm run test:all" -ForegroundColor Yellow
            npm run test:all
        }
        "2" {
            Write-Host "`n▶️ Exécution: npm run test:chrome" -ForegroundColor Yellow
            npm run test:chrome
        }
        "3" {
            Write-Host "`n▶️ Exécution: npm run test:firefox" -ForegroundColor Yellow
            npm run test:firefox
        }
        "4" {
            Write-Host "`n▶️ Exécution: npm run test:safari" -ForegroundColor Yellow
            npm run test:safari
        }
        "5" {
            Write-Host "`n▶️ Exécution: npm run test:edge" -ForegroundColor Yellow
            npm run test:edge
        }
        "6" {
            Write-Host "`n▶️ Exécution: npm run test:mobile" -ForegroundColor Yellow
            npm run test:mobile
        }
        "7" {
            Write-Host "`n▶️ Exécution: npm run test:legacy" -ForegroundColor Yellow
            npm run test:legacy
        }
        "8" {
            Write-Host "`n▶️ Exécution: npm run test:debug" -ForegroundColor Yellow
            Write-Host "(Mode debug: vous pouvez mettre en pause et inspecter)" -ForegroundColor Cyan
            npm run test:debug
        }
        "9" {
            Write-Host "`n▶️ Exécution: npm run test:ui" -ForegroundColor Yellow
            Write-Host "(Dashboard interactif s'ouvrira dans le navigateur)" -ForegroundColor Cyan
            npm run test:ui
        }
        "0" {
            Show-Menu
            return
        }
        default {
            Write-Host "❌ Option invalide!" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✅ Tests terminés!" -ForegroundColor Green
    Read-Host "Appuyer sur Entrée pour continuer"
    Show-Menu
}

function Show-StartMenu {
    Clear-Host
    Write-Host "🚀 DÉMARRER L'APPLICATION" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $startChoice = Read-Host @"
1 - Mode développement (npm run dev)
   → Auto-reload, Console debug, Localhost:3000

2 - Mode production (npm run build && npm start)
   → Build optimisé, Minifié

3 - Backend seulement (cd backend && npm run dev)
   → API sur localhost:4000

0 - Retour

Choisir:
"@
    
    switch ($startChoice) {
        "1" {
            Write-Host "`n▶️ Lancement en mode développement..." -ForegroundColor Yellow
            Write-Host "Aller à: http://localhost:3000" -ForegroundColor Cyan
            npm run dev
        }
        "2" {
            Write-Host "`n▶️ Build et lancement production..." -ForegroundColor Yellow
            npm run build
            npm start
        }
        "3" {
            Write-Host "`n▶️ Lancement du backend..." -ForegroundColor Yellow
            Set-Location backend
            npm run dev
        }
        "0" {
            Show-Menu
            return
        }
    }
    
    Read-Host "Appuyer sur Entrée pour continuer"
    Show-Menu
}

function Show-MonitoringMenu {
    Clear-Host
    Write-Host "📊 MONITORING & ANALYTICS" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $monChoice = Read-Host @"
1 - Ouvrir Sentry Dashboard
   (Erreurs en temps réel par navigateur)

2 - Ouvrir Google Analytics 4
   (Usage, navigateurs, appareils)

3 - Voir le rapport Playwright
   (Résultats des derniers tests)

4 - Générer un nouveau rapport
   (npm run test:report)

0 - Retour

Choisir:
"@
    
    switch ($monChoice) {
        "1" {
            Write-Host "`n🔗 Ouverture Sentry..." -ForegroundColor Yellow
            Start-Process "https://sentry.io/"
        }
        "2" {
            Write-Host "`n🔗 Ouverture Google Analytics..." -ForegroundColor Yellow
            Start-Process "https://analytics.google.com/"
        }
        "3" {
            Write-Host "`n🔗 Ouverture rapport Playwright..." -ForegroundColor Yellow
            $reportPath = Join-Path (Get-Location) "playwright-report/index.html"
            if (Test-Path $reportPath) {
                Start-Process $reportPath
            } else {
                Write-Host "❌ Rapport non trouvé. Exécuter d'abord les tests." -ForegroundColor Red
            }
        }
        "4" {
            Write-Host "`n▶️ Génération du rapport..." -ForegroundColor Yellow
            npm run test:report
        }
        "0" {
            Show-Menu
            return
        }
    }
    
    Read-Host "Appuyer sur Entrée pour continuer"
    Show-Menu
}

function Show-MaintenanceMenu {
    Clear-Host
    Write-Host "🧹 MAINTENANCE & NETTOYAGE" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $maintChoice = Read-Host @"
1 - Nettoyer les builds
   (Supprimer build/, dist/, .next/)

2 - Réinstaller Playwright
   (npx playwright install --with-deps)

3 - Mettre à jour les dépendances
   (npm update)

4 - Nettoyer node_modules
   (rm -r node_modules && npm install)

5 - Vérifier les dépendances obsolètes
   (npm outdated)

0 - Retour

Choisir:
"@
    
    switch ($maintChoice) {
        "1" {
            Write-Host "`n🗑️  Nettoyage des builds..." -ForegroundColor Yellow
            if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
            if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
            if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
            Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
        }
        "2" {
            Write-Host "`n📥 Réinstallation de Playwright..." -ForegroundColor Yellow
            npx playwright install --with-deps
            Write-Host "✅ Playwright mis à jour!" -ForegroundColor Green
        }
        "3" {
            Write-Host "`n⬆️  Mise à jour des dépendances..." -ForegroundColor Yellow
            npm update
            Write-Host "✅ Dépendances mises à jour!" -ForegroundColor Green
        }
        "4" {
            Write-Host "`n🗑️  Suppression de node_modules..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force "node_modules"
            Write-Host "📥 Réinstallation..." -ForegroundColor Yellow
            npm install
            Write-Host "✅ Installation terminée!" -ForegroundColor Green
        }
        "5" {
            Write-Host "`n🔍 Vérification des dépendances obsolètes..." -ForegroundColor Yellow
            npm outdated
        }
        "0" {
            Show-Menu
            return
        }
    }
    
    Read-Host "Appuyer sur Entrée pour continuer"
    Show-Menu
}

function Show-TroubleshootMenu {
    Clear-Host
    Write-Host "🐛 DÉPANNAGE & TROUBLESHOOTING" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $troubleChoice = Read-Host @"
1 - Vérifier les erreurs d'application
   (Logs de développement)

2 - Vérifier les ports occupés
   (Chercher Node.js sur 3000 et 4000)

3 - Vérifier la base de données
   (Test de connexion)

4 - Afficher l'historique des commits
   (Récentes modifications)

5 - Voir les fichiers modifiés
   (Git status)

0 - Retour

Choisir:
"@
    
    switch ($troubleChoice) {
        "1" {
            Write-Host "`n📋 Lancement en mode debug..." -ForegroundColor Yellow
            npm run dev 2>&1 | Tee-Object -FilePath "debug.log"
            Write-Host "`n💾 Logs sauvegardés dans debug.log" -ForegroundColor Green
        }
        "2" {
            Write-Host "`n🔍 Vérification des ports..." -ForegroundColor Yellow
            Write-Host "Port 3000 (Frontend):" -ForegroundColor Cyan
            netstat -ano | findstr ":3000"
            Write-Host "`nPort 4000 (Backend):" -ForegroundColor Cyan
            netstat -ano | findstr ":4000"
        }
        "3" {
            Write-Host "`n🗄️  Test de connexion à la base de données..." -ForegroundColor Yellow
            Write-Host "Vérifier DATABASE_URL dans .env" -ForegroundColor Cyan
            Write-Host "Actuellement: $env:DATABASE_URL" -ForegroundColor Yellow
        }
        "4" {
            Write-Host "`n📖 Historique Git (10 derniers commits)..." -ForegroundColor Yellow
            git log --oneline -10
        }
        "5" {
            Write-Host "`n📝 Fichiers modifiés (Git status)..." -ForegroundColor Yellow
            git status
        }
        "0" {
            Show-Menu
            return
        }
    }
    
    Read-Host "Appuyer sur Entrée pour continuer"
    Show-Menu
}

# ============================================================
# LANCER LE MENU PRINCIPAL
# ============================================================

Show-Banner
Show-Menu
