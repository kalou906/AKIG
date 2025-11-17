/**
 * Script de Vérification Finale - 8 Amélioration Complétées
 * Vérifie tous les fichiers, dépendances, configurations
 * backend/VERIFY_IMPROVEMENTS.sh
 */

#!/bin/bash

echo "=================================="
echo "✓ VÉRIFICATION 8 AMÉLIORATIONS"
echo "=================================="
echo ""

# Compter fichiers créés
echo "📊 FICHIERS CRÉÉS:"
echo "  - Services: $(ls -1 src/services/*.service.js 2>/dev/null | wc -l) fichiers"
echo "  - Middlewares: $(ls -1 src/middleware/*.middleware.js 2>/dev/null | wc -l) fichiers"
echo "  - Routes: $(ls -1 src/routes/*.routes.js 2>/dev/null | wc -l) fichiers"
echo "  - Schemas: $(ls -1 src/schemas/*.js 2>/dev/null | wc -l) fichiers"
echo "  - Utils: $(ls -1 src/utils/*.js 2>/dev/null | wc -l) fichiers"
echo "  - Jobs: $(ls -1 src/jobs/*.js 2>/dev/null | wc -l) fichiers"
echo "  - Tests: $(ls -1 __tests__/**/*.js 2>/dev/null | wc -l) fichiers"
echo ""

# Vérifier imports
echo "✅ IMPORTS VÉRIFIÉS:"

files_to_check=(
  "src/services/logger.service.js"
  "src/middleware/httpLogger.middleware.js"
  "src/services/metrics.service.js"
  "src/middleware/prometheus.middleware.js"
  "src/schemas/validation.schemas.js"
  "src/middleware/validate.middleware.js"
  "src/utils/cursor-pagination.js"
  "src/services/alert.service.js"
  "src/jobs/alert-cron.js"
  "src/services/pdf.service.js"
  "src/routes/pdf.routes.js"
)

for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING!)"
  fi
done
echo ""

# Vérifier npm packages
echo "📦 NPM PACKAGES:"
npm ls winston 2>/dev/null | grep -q winston && echo "  ✓ winston" || echo "  ✗ winston"
npm ls jest 2>/dev/null | grep -q jest && echo "  ✓ jest" || echo "  ✗ jest"
npm ls joi 2>/dev/null | grep -q joi && echo "  ✓ joi" || echo "  ✗ joi"
npm ls nodemailer 2>/dev/null | grep -q nodemailer && echo "  ✓ nodemailer" || echo "  ✗ nodemailer"
npm ls node-cron 2>/dev/null | grep -q node-cron && echo "  ✓ node-cron" || echo "  ✗ node-cron"
npm ls pdfkit 2>/dev/null | grep -q pdfkit && echo "  ✓ pdfkit" || echo "  ✗ pdfkit"
npm ls qrcode 2>/dev/null | grep -q qrcode && echo "  ✓ qrcode" || echo "  ✗ qrcode"
echo ""

# Vérifier syntax Node
echo "🔍 SYNTAX CHECK:"
node -c src/index.js 2>/dev/null && echo "  ✓ src/index.js" || echo "  ✗ src/index.js"
node -c src/services/logger.service.js 2>/dev/null && echo "  ✓ logger.service.js" || echo "  ✗ logger.service.js"
node -c src/services/metrics.service.js 2>/dev/null && echo "  ✓ metrics.service.js" || echo "  ✗ metrics.service.js"
node -c src/services/alert.service.js 2>/dev/null && echo "  ✓ alert.service.js" || echo "  ✗ alert.service.js"
node -c src/services/pdf.service.js 2>/dev/null && echo "  ✓ pdf.service.js" || echo "  ✗ pdf.service.js"
echo ""

# Compter tests
echo "🧪 TESTS:"
test_count=$(find __tests__ -name "*.test.js" -o -name "*.spec.js" 2>/dev/null | wc -l)
echo "  - Total test files: $test_count"
test_cases=$(grep -r "it(\|test(" __tests__ 2>/dev/null | wc -l)
echo "  - Total test cases: $test_cases"
echo ""

# Vérifier intégrations index.js
echo "🔗 INTÉGRATIONS INDEX.JS:"
grep -q "require('./services/logger')" src/index.js && echo "  ✓ Logger import" || echo "  ✗ Logger import"
grep -q "require('./services/metrics.service')" src/index.js && echo "  ✓ Metrics import" || echo "  ✗ Metrics import"
grep -q "require('./routes/pdf.routes')" src/index.js && echo "  ✓ PDF routes import" || echo "  ✗ PDF routes import"
grep -q "require('./jobs/alert-cron')" src/index.js && echo "  ✓ Cron import" || echo "  ✗ Cron import"
grep -q "app.use('/api/pdf'" src/index.js && echo "  ✓ PDF routes mounted" || echo "  ✗ PDF routes mounted"
grep -q "alertCron.initializeCronJobs" src/index.js && echo "  ✓ Cron initialized" || echo "  ✗ Cron initialized"
echo ""

# Vérifier npm audit
echo "🔒 SECURITY:"
vuln_count=$(npm audit 2>/dev/null | grep -c "vulnerabilities" || echo "0")
if [ "$vuln_count" -eq 0 ]; then
  echo "  ✓ No vulnerabilities (0 found)"
else
  echo "  ⚠ Check vulnerabilities: npm audit"
fi
echo ""

# Résumé
echo "=================================="
echo "✅ VÉRIFICATION TERMINÉE"
echo "=================================="
echo ""
echo "Prochaines étapes:"
echo "  1. npm run dev          # Démarrer en développement"
echo "  2. npm test             # Lancer tests unitaires"
echo "  3. npm run test:coverage # Rapport couverture"
echo "  4. curl http://localhost:4002/metrics  # Vérifier Prometheus"
echo ""
