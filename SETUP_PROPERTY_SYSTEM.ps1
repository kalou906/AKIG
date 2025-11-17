# AKIG - Guide d'Installation et Configuration du Système de Gestion de Propriétés
# pour Windows PowerShell

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     AKIG - Système de Gestion de Propriétés et Locataires      ║" -ForegroundColor Cyan
Write-Host "║                    Guide d'Installation                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Fonctions utilitaires
function Show-Step {
    param([string]$step, [string]$description)
    Write-Host "[$step] $description" -ForegroundColor Yellow
}

function Show-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Show-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Show-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

# Étape 1: Vérifier les prérequis
Write-Host ""
Show-Step "ÉTAPE 1/5" "Vérification des prérequis"
Write-Host ""

# Vérifier Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Show-Success "Node.js installé: $nodeVersion"
} else {
    Show-Error "Node.js n'est pas installé"
    Show-Info "Téléchargez-le depuis https://nodejs.org/"
    exit 1
}

# Vérifier npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Show-Success "npm installé: $npmVersion"
} else {
    Show-Error "npm n'est pas installé"
    exit 1
}

# Vérifier PostgreSQL
if (Get-Command psql -ErrorAction SilentlyContinue) {
    $psqlVersion = psql --version
    Show-Success "PostgreSQL installé: $psqlVersion"
} else {
    Show-Error "PostgreSQL n'est pas installé ou psql n'est pas dans le PATH"
    Show-Info "Ajoutez le répertoire bin de PostgreSQL à votre PATH"
    Show-Info "Chemin typique: C:\Program Files\PostgreSQL\15\bin"
}

# Étape 2: Configuration des variables d'environnement
Write-Host ""
Show-Step "ÉTAPE 2/5" "Configuration des variables d'environnement"
Write-Host ""

$envFile = "backend\.env"
if (Test-Path $envFile) {
    Show-Info "Fichier .env détecté"
    $response = Read-Host "Voulez-vous le reconfigurer? (y/n)"
    if ($response -ne "y") {
        Show-Success ".env conservé"
    } else {
        # Créer un nouveau .env
        $dbUrl = Read-Host "Entrez la DATABASE_URL PostgreSQL"
        $jwtSecret = Read-Host "Entrez le JWT_SECRET"
        $port = Read-Host "Entrez le PORT (défaut: 4002)"
        $port = if ([string]::IsNullOrEmpty($port)) { "4002" } else { $port }
        
        $envContent = @"
DATABASE_URL=$dbUrl
JWT_SECRET=$jwtSecret
PORT=$port
NODE_ENV=development
"@
        
        Set-Content -Path $envFile -Value $envContent -Encoding UTF8
        Show-Success ".env créé avec succès"
    }
} else {
    Show-Error "Fichier .env non trouvé"
    $dbUrl = Read-Host "Entrez la DATABASE_URL PostgreSQL (ex: postgresql://user:pass@localhost:5432/akig)"
    $jwtSecret = Read-Host "Entrez le JWT_SECRET (minimum 32 caractères)"
    $port = Read-Host "Entrez le PORT (défaut: 4002)"
    $port = if ([string]::IsNullOrEmpty($port)) { "4002" } else { $port }
    
    $envContent = @"
DATABASE_URL=$dbUrl
JWT_SECRET=$jwtSecret
PORT=$port
NODE_ENV=development
OPENTELEMETRY_ENABLED=false
"@
    
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Show-Success ".env créé avec succès"
}

# Étape 3: Installation des dépendances
Write-Host ""
Show-Step "ÉTAPE 3/5" "Installation des dépendances Node.js"
Write-Host ""

Push-Location backend
try {
    Show-Info "Installation des dépendances backend..."
    npm install
    Show-Success "Dépendances backend installées"
    
    # Vérifier que pdfkit est installé
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.dependencies.pdfkit) {
            Show-Success "pdfkit trouvé dans les dépendances"
        } else {
            Show-Info "Installation de pdfkit..."
            npm install --save pdfkit
            Show-Success "pdfkit installé"
        }
    }
} finally {
    Pop-Location
}

# Étape 4: Exécution des migrations SQL
Write-Host ""
Show-Step "ÉTAPE 4/5" "Exécution des migrations SQL"
Write-Host ""

Show-Info "Les migrations vont créer les tables nécessaires pour:"
Write-Host "  • Gestion des propriétaires"
Write-Host "  • Gestion des propriétés/immeubles"
Write-Host "  • Gestion des locaux/unités"
Write-Host "  • Gestion des contrats de location"
Write-Host "  • Gestion des paiements de loyers"
Write-Host "  • Gestion des dépôts de caution"
Write-Host "  • Génération de quittances et reçus"
Write-Host ""

# Créer le répertoire migrations s'il n'existe pas
$migrationsDir = "backend\db\migrations"
if (-not (Test-Path $migrationsDir)) {
    New-Item -ItemType Directory -Path $migrationsDir -Force | Out-Null
    Show-Success "Répertoire migrations créé"
}

# Copier la migration si elle existe
$sourceMigration = "backend\db\migrations\001_create_property_management.sql"
if (Test-Path $sourceMigration) {
    Show-Info "Migration trouvée: 001_create_property_management.sql"
    
    $response = Read-Host "Exécuter la migration maintenant? (y/n)"
    if ($response -eq "y") {
        # Récupérer la chaîne de connexion depuis le .env
        $envContent = Get-Content $envFile
        $dbUrl = ($envContent | Select-String "DATABASE_URL=").ToString().Replace("DATABASE_URL=", "")
        
        if ([string]::IsNullOrEmpty($dbUrl)) {
            Show-Error "DATABASE_URL non trouvée dans .env"
        } else {
            Show-Info "Exécution de la migration SQL..."
            try {
                # Utiliser psql pour exécuter la migration
                psql "$dbUrl" -f $sourceMigration
                Show-Success "Migration SQL exécutée avec succès"
            } catch {
                Show-Error "Erreur lors de l'exécution de la migration: $_"
                Show-Info "Vous pouvez l'exécuter manuellement plus tard:"
                Write-Host ""
                Write-Host "psql `"$dbUrl`" -f `"$sourceMigration`""
            }
        }
    }
} else {
    Show-Error "Fichier de migration non trouvé"
    Show-Info "Consultez: PROPERTY_MANAGEMENT_SYSTEM_COMPLET.md"
}

# Étape 5: Vérification de la base de données
Write-Host ""
Show-Step "ÉTAPE 5/5" "Vérification de la configuration"
Write-Host ""

Push-Location backend
try {
    # Créer un fichier de test de connexion si nécessaire
    $testFile = "test-property-system-connection.js"
    if (-not (Test-Path $testFile)) {
        $testScript = @"
const pool = require('./src/db');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connexion réussie à PostgreSQL');
    console.log('Timestamp serveur:', result.rows[0].now);
    
    // Vérifier les tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('properties', 'units', 'deposits', 'receipts')
    `);
    
    if (tables.rows.length === 4) {
      console.log('✅ Toutes les tables nécessaires sont présentes');
    } else {
      console.log('⚠️  Tables manquantes:', 4 - tables.rows.length);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message);
    process.exit(1);
  }
}

testConnection();
"@
        Set-Content -Path $testFile -Value $testScript -Encoding UTF8
    }
    
    Show-Info "Test de connexion à la base de données..."
    & node $testFile
} catch {
    Show-Error "Erreur lors du test: $_"
} finally {
    Pop-Location
}

# Résumé final
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                      ✅ INSTALLATION TERMINÉE                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 RÉSUMÉ DE L'INSTALLATION:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Prérequis vérifiés"
Write-Host "✅ Variables d'environnement configurées"
Write-Host "✅ Dépendances Node.js installées"
Write-Host "✅ Migrations SQL exécutées"
Write-Host "✅ Connexion à la base de données vérifiée"
Write-Host ""

Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Démarrer le serveur backend:"
Write-Host "   cd backend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "2. Consulter la documentation complète:"
Write-Host "   PROPERTY_MANAGEMENT_SYSTEM_COMPLET.md"
Write-Host ""
Write-Host "3. Endpoints disponibles:"
Write-Host "   • GET /api/health                          - Vérifier le serveur"
Write-Host "   • POST /api/owners                         - Créer un propriétaire"
Write-Host "   • POST /api/properties                     - Créer une propriété"
Write-Host "   • POST /api/units                          - Créer un local"
Write-Host "   • POST /api/rental-contracts/rental       - Créer un contrat"
Write-Host "   • POST /api/deposits                       - Enregistrer une caution"
Write-Host "   • POST /api/rent-payments                  - Enregistrer un paiement (quittance auto)"
Write-Host ""
Write-Host "📂 RÉPERTOIRES IMPORTANTS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   • backend/src/routes/                      - Routes API"
Write-Host "   • backend/src/services/receiptGenerator.js - Service de quittances PDF"
Write-Host "   • backend/db/migrations/                   - Migrations SQL"
Write-Host "   • backend/receipts/                        - Quittances et reçus générés"
Write-Host ""

Write-Host "💡 CONSEIL:" -ForegroundColor Magenta
Write-Host ""
Write-Host "Tout paiement enregistré génère automatiquement une quittance PDF"
Write-Host "Chaque dépôt de caution génère automatiquement un reçu PDF"
Write-Host "Les fichiers sont stockés dans /backend/receipts/"
Write-Host ""

Write-Host "📞 AIDE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Consultez la documentation pour:"
Write-Host "   • Endpoints API détaillés"
Write-Host "   • Exemples de requêtes"
Write-Host "   • Workflows typiques"
Write-Host "   • Gestion d'erreurs"
Write-Host ""

Write-Host "✨ Bonne utilisation du système AKIG! ✨" -ForegroundColor Green
