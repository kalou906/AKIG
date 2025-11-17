#!/usr/bin/env node

/**
 * AKIG - Configuration CI/CD Multi-Navigateurs
 * Setup guide pour GitHub Actions, GitLab CI, Azure DevOps
 * 
 * Usage: Copier les configurations dans votre repo
 */

const chalk = require('chalk');

console.log(`
${chalk.cyan.bold('╔════════════════════════════════════════════════════════════════╗')}
${chalk.cyan.bold('║          AKIG - CI/CD MULTI-BROWSER CONFIGURATION              ║')}
${chalk.cyan.bold('║  Guide pour GitHub Actions, GitLab CI, Azure DevOps            ║')}
${chalk.cyan.bold('╚════════════════════════════════════════════════════════════════╝')}

${chalk.yellow.bold('📋 ÉTAPES D\'INSTALLATION')}

1. ${chalk.green('GitHub Actions')}
   Copier : .github/workflows/playwright-tests.yml
   Vers votre repo: .github/workflows/
   
2. ${chalk.green('Package.json Scripts')}
   Ajouter les commandes de test ci-dessous
   
3. ${chalk.green('Environment Variables')}
   Configurer les secrets GitHub
   
4. ${chalk.green('Playwright Config')}
   Utiliser playwright.config.js existant

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('🚀 SCRIPTS PACKAGE.JSON À AJOUTER')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${chalk.gray('"scripts": {')}
  ${chalk.yellow('"test:all"')}          ${chalk.gray(': "npx playwright test",')}
  ${chalk.yellow('"test:chrome"')}       ${chalk.gray(': "npx playwright test --project=chromium",')}
  ${chalk.yellow('"test:firefox"')}      ${chalk.gray(': "npx playwright test --project=firefox",')}
  ${chalk.yellow('"test:safari"')}       ${chalk.gray(': "npx playwright test --project=webkit",')}
  ${chalk.yellow('"test:edge"')}         ${chalk.gray(': "npx playwright test --project=Edge",')}
  ${chalk.yellow('"test:mobile"')}       ${chalk.gray(': "npx playwright test --project=Mobile*",')}
  ${chalk.yellow('"test:legacy"')}       ${chalk.gray(': "npx playwright test --project=IE11",')}
  ${chalk.yellow('"test:debug"')}        ${chalk.gray(': "npx playwright test --debug",')}
  ${chalk.yellow('"test:ui"')}           ${chalk.gray(': "npx playwright test --ui",')}
  ${chalk.yellow('"test:watch"')}        ${chalk.gray(': "npx playwright test --watch",')}
  ${chalk.yellow('"test:report"')}       ${chalk.gray(': "npx playwright show-report",')}
  ${chalk.yellow('"test:headed"')}       ${chalk.gray(': "npx playwright test --headed"')}
${chalk.gray('},')}

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('🔐 SECRETS GITHUB À CONFIGURER')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

Aller à: GitHub Repo > Settings > Secrets and variables > Actions

${chalk.green('Ajouter les secrets suivants:')}

1. ${chalk.yellow('SENTRY_DSN')}
   Valeur: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   Description: Sentry error tracking DSN
   
2. ${chalk.yellow('GA_MEASUREMENT_ID')}
   Valeur: G-XXXXXXXXXX
   Description: Google Analytics 4 Measurement ID
   
3. ${chalk.yellow('SLACK_WEBHOOK')} (optionnel)
   Valeur: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
   Description: Slack webhook for notifications
   
4. ${chalk.yellow('DATABASE_URL')} (si tests avec DB)
   Valeur: postgresql://user:pass@localhost/dbname
   Description: Database connection string

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('⚙️  VARIABLES D\'ENVIRONNEMENT POUR CI')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${chalk.gray('# .env.github')}
REACT_APP_SENTRY_DSN=${{ secrets.SENTRY_DSN }}
REACT_APP_GA_ID=${{ secrets.GA_MEASUREMENT_ID }}
API_BASE_URL=http://localhost:4000/api
NODE_ENV=test
CI=true

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('📊 MATRICE DE TEST - RÉSUMÉ')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

┌──────────────────────────────────────────────────────────┐
│          GITHUB ACTIONS WORKFLOW MATRIX                  │
├──────────────────────────────────────────────────────────┤
│ Job 1: Multi-Browser Testing (3 OS × 3 browsers)        │
│  - Ubuntu + Chrome, Firefox, Safari                      │
│  - Windows + Chrome, Firefox, Edge                       │
│  - macOS + Chrome, Firefox, Safari                       │
│ Temps: ~15 min                                           │
├──────────────────────────────────────────────────────────┤
│ Job 2: Mobile Testing (Android + iOS)                    │
│ Temps: ~8 min                                            │
├──────────────────────────────────────────────────────────┤
│ Job 3: Accessibility Audit (axe-core)                    │
│ Temps: ~5 min                                            │
├──────────────────────────────────────────────────────────┤
│ Job 4: Performance (Lighthouse)                          │
│ Temps: ~6 min                                            │
├──────────────────────────────────────────────────────────┤
│ Job 5: Edge Cases & Security                            │
│ Temps: ~7 min                                            │
├──────────────────────────────────────────────────────────┤
│ Job 6: Legacy Browser Support (IE11)                    │
│ Temps: ~8 min                                            │
├──────────────────────────────────────────────────────────┤
│ Job 7: Summary Report                                   │
│ Temps: ~2 min                                            │
├──────────────────────────────────────────────────────────┤
│ TOTAL TIME: ~25 minutes (parallel execution)             │
│ TOTAL TESTS: 762 (109 × 7 browsers + extras)            │
└──────────────────────────────────────────────────────────┘

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('🔍 MONITORING DES TESTS')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${chalk.green('Voir les résultats sur GitHub:')}

1. Repo > Actions
2. Cliquer sur le run le plus récent
3. Voir les 7 jobs en parallèle
4. Cliquer sur un job pour voir les logs
5. Télécharger les artifacts:
   - screenshots/ (pour debugging)
   - videos/ (failed tests)
   - test-results.json
   - playwright-report/

${chalk.green('Voir les résultats en JSON:')}

${chalk.gray('npm run test:report')}
# Ouvre: ./playwright-report/index.html

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('💻 COMMANDES DE DEBUG')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${chalk.green('Mode debug avec pause:')}
${chalk.gray('npm run test:debug')}

${chalk.green('Mode UI avec dashboard:')}
${chalk.gray('npm run test:ui')}

${chalk.green('Mode watch (re-run au changement):')}
${chalk.gray('npm run test:watch')}

${chalk.green('Test spécifique :')}
${chalk.gray('npx playwright test tests/contracts.spec.js')}

${chalk.green('Test spécifique + navigateur :')}
${chalk.gray('npx playwright test tests/contracts.spec.js --project=chromium --headed')}

${chalk.green('Test avec filtre :')}
${chalk.gray('npx playwright test --grep "Login"')}

${chalk.green('Test sans filtre :')}
${chalk.gray('npx playwright test --grep-invert "slow"')}

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('📈 INTERPRÉTATION DES RÉSULTATS')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${chalk.green('✅ SUCCÈS')}
Tous les tests passent (green checkmarks)
Aucune erreur dans la console
Artifacts générés sans warnings
Déploiement peut procéder

${chalk.yellow('⚠️  WARNINGS')}
Deprecation warnings → OK (corriger bientôt)
Slow tests (> 30s) → Optimiser
Accessibility warnings → Corriger avant production

${chalk.red('❌ FAILURES')}
Test a échoué → Voir logs du workflow
Erreur JavaScript → Vérifier dans Sentry
Timeout → Augmenter le délai ou optimiser le code

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('🔄 WORKFLOW GIT')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

1. ${chalk.green('Commit & Push')}
   git add .
   git commit -m "Add new feature"
   git push origin main

2. ${chalk.green('GitHub Actions s\'exécute automatiquement')}
   Actions > [Your Workflow Name] > Running...
   Attendre ~25 minutes

3. ${chalk.green('Vérifier les résultats')}
   ✅ Tous les jobs verts = OK déployer
   ❌ Un job rouge = Corriger et repush

4. ${chalk.green('Merge & Deploy')}
   Pull request > Merge when ready
   Déployer en production

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow.bold('📚 RESSOURCES')}
${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

Playwright Docs:
${chalk.blue('https://playwright.dev/')}

GitHub Actions:
${chalk.blue('https://docs.github.com/actions')}

Sentry Integration:
${chalk.blue('https://docs.sentry.io/platforms/javascript/guides/react/')}

Google Analytics 4:
${chalk.blue('https://support.google.com/analytics/answer/10089681')}

${chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${chalk.green.bold('✅ Configuration CI/CD complète !')}

Prochaines étapes:
1. npm install @playwright/test
2. npx playwright install
3. Configurer les secrets GitHub
4. Push le code
5. Voir les tests s\'exécuter sur GitHub Actions

${chalk.cyan('Questions ? Consulter VALIDATION_PROCEDURES_FRENCH.md')}
`);

module.exports = {
  npmScripts: {
    'test:all': 'npx playwright test',
    'test:chrome': 'npx playwright test --project=chromium',
    'test:firefox': 'npx playwright test --project=firefox',
    'test:safari': 'npx playwright test --project=webkit',
    'test:edge': 'npx playwright test --project=Edge',
    'test:mobile': 'npx playwright test --project=Mobile*',
    'test:legacy': 'npx playwright test --project=IE11',
    'test:debug': 'npx playwright test --debug',
    'test:ui': 'npx playwright test --ui',
    'test:watch': 'npx playwright test --watch',
    'test:report': 'npx playwright show-report',
    'test:headed': 'npx playwright test --headed'
  }
};
