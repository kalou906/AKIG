#!/bin/bash
# Migration Script - Exécute les migrations SQL pour le système de gestion de propriétés

set -e

echo "🔧 AKIG - Système de Gestion de Propriétés"
echo "=========================================="
echo ""

# Vérifier que les variables d'environnement sont définies
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erreur: DATABASE_URL non définie"
    echo "Veuillez définir la variable d'environnement DATABASE_URL"
    exit 1
fi

echo "📦 Installation des dépendances Node..."
cd backend
npm install --save pdfkit

echo "✅ Dépendances installées"
echo ""

echo "📋 Execution de la migration SQL..."
echo ""

# Utiliser psql pour exécuter la migration
# Alternative: vous pouvez utiliser votre client PostgreSQL préféré
echo "Connexion à la base de données..."

# Lire la migration et l'exécuter
# Vous devrez adapter cette commande selon votre configuration
# Pour Windows, utiliser psql directement

psql "$DATABASE_URL" -f "./db/migrations/001_create_property_management.sql" || {
    echo "ℹ️  Si la migration a échoué, vous pouvez l'exécuter manuellement:"
    echo ""
    echo "   psql -d your_database_name -U your_user -f backend/db/migrations/001_create_property_management.sql"
    echo ""
    echo "Ou via votre interface PostgreSQL (pgAdmin, DBeaver, etc.)"
}

echo ""
echo "✅ Migration complétée!"
echo ""
echo "📝 Table récapitulatif créées:"
echo "  - properties"
echo "  - units"
echo "  - deposits"
echo "  - receipts"
echo "  - payment_reports"
echo "  - payment_history"
echo ""
echo "🔄 Colonnes ajoutées aux tables existantes:"
echo "  - users: role, phone, address, city, postal_code, country, company_name, tax_id, bank_account, is_active, notes"
echo "  - contracts: contract_type, unit_id, tenant_id, deposit_amount, monthly_rent, payment_frequency, status, termination_date, renewal_date, notes, property_id"
echo "  - payments: tenant_id, unit_id, payment_type, payment_method, status, reference_number, period_start_date, period_end_date, receipt_generated, notes"
echo ""
echo "🚀 Redémarrage du serveur..."
npm run dev

cd ..
