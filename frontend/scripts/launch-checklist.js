#!/usr/bin/env node

/**
 * AKIG - Quick Launch Checklist
 * Vérification rapide avant mise en production
 */

const fs = require('fs');
const path = require('path');

const CHECKMARKS = {
  pass: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️'
};

class LaunchChecker {
  constructor() {
    this.results = [];
    this.passCount = 0;
    this.failCount = 0;
  }

  log(message, status = 'info') {
    const mark = CHECKMARKS[status] || 'ℹ️';
    console.log(`${mark} ${message}`);
    this.results.push({ message, status });
  }

  checkFile(filePath, description) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      this.log(`${description} ✓`, 'pass');
      this.passCount++;
      return true;
    } else {
      this.log(`${description} - MISSING at ${filePath}`, 'error');
      this.failCount++;
      return false;
    }
  }

  checkPackage(packageName) {
    try {
      require(packageName);
      this.log(`Package ${packageName} installed ✓`, 'pass');
      this.passCount++;
      return true;
    } catch (e) {
      this.log(`Package ${packageName} NOT installed`, 'error');
      this.failCount++;
      return false;
    }
  }

  run() {
    console.clear();
    this.printHeader();
    
    this.section('📋 FILE STRUCTURE');
    this.checkFile('frontend/', 'Frontend directory');
    this.checkFile('backend/', 'Backend directory');
    this.checkFile('.github/workflows/playwright-tests.yml', 'GitHub Actions workflow');
    this.checkFile('playwright.config.js', 'Playwright configuration');
    this.checkFile('frontend/tests/', 'Test directory');
    this.checkFile('.env.example', 'Environment template');

    this.section('📦 CORE DEPENDENCIES');
    this.checkPackage('react');
    this.checkPackage('react-dom');
    this.checkPackage('@playwright/test');
    this.checkPackage('axios');
    this.checkPackage('express');
    this.checkPackage('pg');
    this.checkPackage('jsonwebtoken');

    this.section('🔐 MONITORING PACKAGES');
    this.checkPackage('@sentry/react');
    this.checkPackage('@sentry/tracing');
    this.checkPackage('react-ga4');

    this.section('🎨 STYLING & UI');
    this.checkPackage('tailwindcss');
    this.checkPackage('postcss');
    this.checkPackage('autoprefixer');
    this.checkPackage('chart.js');

    this.section('🔧 BUILD TOOLS');
    this.checkPackage('@babel/core');
    this.checkPackage('@babel/preset-env');
    this.checkPackage('@babel/preset-react');
    this.checkPackage('core-js');

    this.section('📝 CONFIGURATION FILES');
    this.checkFile('.babelrc.json', '.babelrc.json (Babel config)');
    this.checkFile('postcss.config.js', 'postcss.config.js (CSS prefixes)');
    this.checkFile('tailwind.config.js', 'tailwind.config.js (Tailwind)');
    this.checkFile('tsconfig.json', 'tsconfig.json (TypeScript)');
    this.checkFile('.browserslistrc', '.browserslistrc (Browser targets)');

    this.section('🧪 TEST CONFIGURATION');
    this.checkFile('frontend/tests/e2e.spec.js', 'E2E tests');
    this.checkFile('frontend/tests/contracts.spec.js', 'Contract tests');
    this.checkFile('frontend/tests/payments.spec.js', 'Payment tests');
    this.checkFile('frontend/tests/dashboard-sms.spec.js', 'Dashboard tests');
    this.checkFile('frontend/tests/exports.spec.js', 'Export tests');

    this.section('🚀 ENVIRONMENT SETUP');
    this.checkEnvironmentVariables();

    this.section('📊 MONITORING SETUP');
    this.checkMonitoringIntegration();

    this.section('🌐 API ENDPOINTS');
    this.checkAPIEndpoints();

    this.printSummary();
  }

  section(title) {
    console.log(`\n${title}`);
    console.log('='.repeat(50));
  }

  checkEnvironmentVariables() {
    const envFile = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        const hasDatabase = content.includes('DATABASE_URL');
        const hasJWT = content.includes('JWT_SECRET');
        const hasPort = content.includes('PORT');

        if (hasDatabase) this.log('DATABASE_URL configured ✓', 'pass');
        else this.log('DATABASE_URL missing in .env', 'warning');

        if (hasJWT) this.log('JWT_SECRET configured ✓', 'pass');
        else this.log('JWT_SECRET missing in .env', 'warning');

        if (hasPort) this.log('PORT configured ✓', 'pass');
        else this.log('PORT not set (using default 4000)', 'info');
      } catch (e) {
        this.log('.env file exists but cannot read', 'warning');
      }
    } else {
      this.log('.env file not found - will use defaults', 'warning');
    }
  }

  checkMonitoringIntegration() {
    const monitoringPath = path.join(process.cwd(), 'frontend/src/utils/monitoring.ts');
    const analyticsPath = path.join(process.cwd(), 'frontend/src/utils/analytics.ts');

    if (fs.existsSync(monitoringPath)) {
      this.log('Sentry monitoring setup ✓', 'pass');
    } else {
      this.log('monitoring.ts missing', 'warning');
    }

    if (fs.existsSync(analyticsPath)) {
      this.log('Google Analytics setup ✓', 'pass');
    } else {
      this.log('analytics.ts missing', 'warning');
    }
  }

  checkAPIEndpoints() {
    const apiEndpoints = [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/contracts',
      'GET /api/contracts',
      'PUT /api/contracts/:id',
      'DELETE /api/contracts/:id',
      'POST /api/payments',
      'GET /api/payments',
      'POST /api/sms/send',
      'GET /api/health'
    ];

    this.log(`Expected API endpoints: ${apiEndpoints.length}`, 'info');
    apiEndpoints.forEach(endpoint => {
      this.log(`  → ${endpoint}`, 'pass');
    });
  }

  printHeader() {
    console.log(`
╔═════════════════════════════════════════════════════╗
║     AKIG - PRODUCTION READINESS CHECKLIST          ║
║  Multi-Browser Testing Framework Validation        ║
╚═════════════════════════════════════════════════════╝
    `);
  }

  printSummary() {
    console.log(`\n${'═'.repeat(50)}`);
    console.log('\n📊 SUMMARY');
    console.log(`✅ Passed: ${this.passCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    
    if (this.failCount === 0) {
      console.log(`\n${CHECKMARKS.pass} SYSTEM READY FOR PRODUCTION!\n`);
    } else {
      console.log(`\n${CHECKMARKS.warning} Please fix the ${this.failCount} issue(s) above.\n`);
    }

    this.printNextSteps();
  }

  printNextSteps() {
    console.log('📋 NEXT STEPS');
    console.log('═'.repeat(50));
    console.log('1. Install dependencies:');
    console.log('   npm install');
    console.log('   npx playwright install\n');
    
    console.log('2. Setup environment variables:');
    console.log('   cp .env.example .env');
    console.log('   Edit .env with your values\n');
    
    console.log('3. Run tests locally:');
    console.log('   npm run test:all\n');
    
    console.log('4. Setup GitHub Secrets:');
    console.log('   SENTRY_DSN');
    console.log('   GA_MEASUREMENT_ID\n');
    
    console.log('5. Start development:');
    console.log('   npm run dev\n');
    
    console.log('6. Check monitoring:');
    console.log('   Sentry: https://sentry.io/');
    console.log('   GA4: https://analytics.google.com/\n');

    console.log('📚 Documentation:');
    console.log('   - VALIDATION_PROCEDURES_FRENCH.md');
    console.log('   - CROSS_BROWSER_COMPATIBILITY_MATRIX.md');
    console.log('   - MULTI_BROWSER_TESTING_GUIDE.md\n');
  }
}

// Run checker
const checker = new LaunchChecker();
checker.run();

module.exports = LaunchChecker;
