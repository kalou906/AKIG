#!/usr/bin/env node
/**
 * ULTRA AUDIT COMPLET - Recherche TOUTES les failles
 * Analyse: Backend, Frontend, DB, Sécurité, Performance, Tests
 * Générateur de rapport d'optimisation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIT = {
  date: new Date().toISOString(),
  failles: [],
  critiques: 0,
  majeures: 0,
  mineures: 0
};

// ============================================
// 🔴 FAILLES CRITIQUES (Empêchent le fonctionnement)
// ============================================
function checkCritical() {
  console.log('\n🔴 AUDIT CRITIQUE...');
  
  // 1. Vérifier Backend startup
  try {
    console.log('  ✓ Backend startup...');
    // Check if backend/src/index.js exists
    if (!fs.existsSync(path.join(__dirname, '../backend/src/index.js'))) {
      AUDIT.failles.push({
        type: 'CRITICAL',
        file: 'backend/src/index.js',
        issue: 'Backend entry point manquant',
        impact: 'Impossible de démarrer le serveur',
        solution: 'Recréer backend/src/index.js'
      });
      AUDIT.critiques++;
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'CRITICAL',
      issue: 'Erreur backend startup check',
      error: err.message
    });
  }

  // 2. Database connection
  try {
    console.log('  ✓ Database check...');
    if (!fs.existsSync(path.join(__dirname, '../backend/src/db.js'))) {
      AUDIT.failles.push({
        type: 'CRITICAL',
        file: 'backend/src/db.js',
        issue: 'Database pool configuration manquante',
        solution: 'Recréer backend/src/db.js avec pg Pool'
      });
      AUDIT.critiques++;
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'CRITICAL',
      issue: 'Database check error',
      error: err.message
    });
  }

  // 3. Vérifier routes
  const routesDir = path.join(__dirname, '../backend/src/routes');
  try {
    console.log('  ✓ Routes check...');
    const essentialRoutes = ['auth.js', 'contracts.js', 'payments.js'];
    const existingRoutes = fs.readdirSync(routesDir);
    
    for (const route of essentialRoutes) {
      if (!existingRoutes.includes(route)) {
        AUDIT.failles.push({
          type: 'CRITICAL',
          file: `backend/src/routes/${route}`,
          issue: `Route essentielle manquante: ${route}`,
          solution: `Recréer ${route}`
        });
        AUDIT.critiques++;
      }
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'CRITICAL',
      issue: 'Routes check error',
      error: err.message
    });
  }

  // 4. Vérifier .env
  try {
    console.log('  ✓ .env check...');
    const envFile = path.join(__dirname, '../backend/.env');
    if (!fs.existsSync(envFile)) {
      AUDIT.failles.push({
        type: 'CRITICAL',
        file: 'backend/.env',
        issue: 'Fichier .env manquant',
        solution: 'Créer .env avec variables requises'
      });
      AUDIT.critiques++;
    } else {
      const env = fs.readFileSync(envFile, 'utf8');
      const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
      for (const req of required) {
        if (!env.includes(req)) {
          AUDIT.failles.push({
            type: 'CRITICAL',
            file: 'backend/.env',
            issue: `Variable manquante: ${req}`,
            solution: `Ajouter ${req} à .env`
          });
          AUDIT.critiques++;
        }
      }
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'CRITICAL',
      issue: '.env check error',
      error: err.message
    });
  }
}

// ============================================
// 🟠 FAILLES MAJEURES (Affect performance/sécurité)
// ============================================
function checkMajor() {
  console.log('\n🟠 AUDIT PERFORMANCE & SÉCURITÉ...');
  
  // 1. Vérifier middlewares de sécurité
  try {
    console.log('  ✓ Security middlewares...');
    const indexFile = path.join(__dirname, '../backend/src/index.js');
    const content = fs.readFileSync(indexFile, 'utf8');
    
    const securityChecks = {
      'securityHeaders': 'CSP & HSTS headers',
      'advancedRateLimit': 'Rate limiting',
      'auditLog': 'Audit logging',
      'helmet': 'Helmet security'
    };
    
    for (const [check, description] of Object.entries(securityChecks)) {
      if (!content.includes(check)) {
        AUDIT.failles.push({
          type: 'MAJOR',
          issue: `Missing: ${description}`,
          file: 'backend/src/index.js',
          solution: `Ajouter ${check} middleware`
        });
        AUDIT.majeures++;
      }
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'MAJOR',
      issue: 'Security check error',
      error: err.message
    });
  }

  // 2. Vérifier caching
  try {
    console.log('  ✓ Caching layer...');
    const servicesDir = path.join(__dirname, '../backend/src/services');
    let hasCaching = false;
    
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir);
      for (const service of services) {
        const content = fs.readFileSync(path.join(servicesDir, service), 'utf8');
        if (content.includes('redis') || content.includes('cache')) {
          hasCaching = true;
          break;
        }
      }
    }
    
    if (!hasCaching) {
      AUDIT.failles.push({
        type: 'MAJOR',
        issue: 'No caching layer detected',
        impact: 'Performance compromise: queries not cached',
        solution: 'Implémenter Redis caching'
      });
      AUDIT.majeures++;
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'MAJOR',
      issue: 'Caching check error',
      error: err.message
    });
  }

  // 3. Vérifier erreur handling
  try {
    console.log('  ✓ Error handling...');
    const indexFile = path.join(__dirname, '../backend/src/index.js');
    const content = fs.readFileSync(indexFile, 'utf8');
    
    if (!content.includes('app.use((err') && !content.includes('app.use(function(err')) {
      AUDIT.failles.push({
        type: 'MAJOR',
        issue: 'No global error handler',
        impact: 'Errors not properly handled, exposing stack traces',
        solution: 'Ajouter middleware de gestion globale des erreurs'
      });
      AUDIT.majeures++;
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'MAJOR',
      issue: 'Error handling check error',
      error: err.message
    });
  }

  // 4. Vérifier CORS configuration
  try {
    console.log('  ✓ CORS config...');
    const indexFile = path.join(__dirname, '../backend/src/index.js');
    const content = fs.readFileSync(indexFile, 'utf8');
    
    if (!content.includes('CORS_ORIGIN') || content.includes("'*'")) {
      AUDIT.failles.push({
        type: 'MAJOR',
        issue: 'CORS might be too permissive',
        impact: 'Possible CSRF/XSS vulnerability',
        solution: 'Configurer CORS strictement (whitelist d\'origins)'
      });
      AUDIT.majeures++;
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'MAJOR',
      issue: 'CORS check error',
      error: err.message
    });
  }

  // 5. Vérifier validation d'input
  try {
    console.log('  ✓ Input validation...');
    const routesDir = path.join(__dirname, '../backend/src/routes');
    let hasValidation = false;
    
    if (fs.existsSync(routesDir)) {
      const files = fs.readdirSync(routesDir);
      for (const file of files) {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
        if (content.includes('validator') || content.includes('joi') || content.includes('validate')) {
          hasValidation = true;
          break;
        }
      }
    }
    
    if (!hasValidation) {
      AUDIT.failles.push({
        type: 'MAJOR',
        issue: 'No input validation detected',
        impact: 'Possible injection attacks',
        solution: 'Ajouter validation avec joi/validator'
      });
      AUDIT.majeures++;
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'MAJOR',
      issue: 'Input validation check error',
      error: err.message
    });
  }

  // 6. Vérifier logging
  try {
    console.log('  ✓ Logging system...');
    const indexFile = path.join(__dirname, '../backend/src/index.js');
    const content = fs.readFileSync(indexFile, 'utf8');
    
    if (!content.includes('winston') && !content.includes('logger') && !content.includes('morgan')) {
      AUDIT.failles.push({
        type: 'MAJOR',
        issue: 'No logging system configured',
        impact: 'Difficult to debug en production',
        solution: 'Ajouter Winston/Pino logger'
      });
      AUDIT.majeures++;
    }
  } catch (err) {
    AUDIT.failles.push({
      type: 'MAJOR',
      issue: 'Logging check error',
      error: err.message
    });
  }
}

// ============================================
// 🟡 FAILLES MINEURES (Nice-to-have improvements)
// ============================================
function checkMinor() {
  console.log('\n🟡 AUDIT OPTIMISATIONS...');
  
  // 1. Vérifier compression
  try {
    console.log('  ✓ Compression...');
    const indexFile = path.join(__dirname, '../backend/src/index.js');
    const content = fs.readFileSync(indexFile, 'utf8');
    
    if (!content.includes('compress') && !content.includes('gzip')) {
      AUDIT.failles.push({
        type: 'MINOR',
        issue: 'No response compression',
        impact: 'Payload size ~30% larger',
        solution: 'Ajouter middleware compression (gzip)'
      });
      AUDIT.mineures++;
    }
  } catch (err) {
    // Ignore
  }

  // 2. Vérifier database pooling
  try {
    console.log('  ✓ Database pooling...');
    const dbFile = path.join(__dirname, '../backend/src/db.js');
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf8');
      
      if (!content.includes('max:') && !content.includes('Pool')) {
        AUDIT.failles.push({
          type: 'MINOR',
          issue: 'Database pooling not optimized',
          impact: '10-20% performance loss',
          solution: 'Configurer pool avec min/max connections'
        });
        AUDIT.mineures++;
      }
    }
  } catch (err) {
    // Ignore
  }

  // 3. Vérifier API documentation
  try {
    console.log('  ✓ API documentation...');
    const indexFile = path.join(__dirname, '../backend/src/index.js');
    const content = fs.readFileSync(indexFile, 'utf8');
    
    if (!content.includes('swagger') && !content.includes('openapi')) {
      AUDIT.failles.push({
        type: 'MINOR',
        issue: 'No API documentation (Swagger/OpenAPI)',
        impact: 'Difficile pour les développeurs',
        solution: 'Ajouter Swagger/OpenAPI documentation'
      });
      AUDIT.mineures++;
    }
  } catch (err) {
    // Ignore
  }

  // 4. Vérifier environment variables validation
  try {
    console.log('  ✓ Environment validation...');
    const configDir = path.join(__dirname, '../backend/src/config');
    if (fs.existsSync(configDir)) {
      const files = fs.readdirSync(configDir);
      if (!files.includes('environment.js') && !files.includes('config.js')) {
        AUDIT.failles.push({
          type: 'MINOR',
          issue: 'No environment validation',
          impact: 'Could start with missing env vars',
          solution: 'Créer config/environment.js avec validation'
        });
        AUDIT.mineures++;
      }
    }
  } catch (err) {
    // Ignore
  }

  // 5. Vérifier tests
  try {
    console.log('  ✓ Tests...');
    const testDirs = [
      path.join(__dirname, '../backend/tests'),
      path.join(__dirname, '../backend/__tests__'),
      path.join(__dirname, '../frontend/src/__tests__')
    ];
    
    let hasTests = false;
    for (const dir of testDirs) {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
        hasTests = true;
        break;
      }
    }
    
    if (!hasTests) {
      AUDIT.failles.push({
        type: 'MINOR',
        issue: 'No tests found',
        impact: 'Pas de regression prevention',
        solution: 'Ajouter unit tests + E2E tests'
      });
      AUDIT.mineures++;
    }
  } catch (err) {
    // Ignore
  }
}

// ============================================
// 🟢 RAPPORT FINAL
// ============================================
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RAPPORT D\'AUDIT COMPLET');
  console.log('='.repeat(70));
  
  console.log(`\n🔴 CRITIQUES: ${AUDIT.critiques}`);
  console.log(`🟠 MAJEURES: ${AUDIT.majeures}`);
  console.log(`🟡 MINEURES: ${AUDIT.mineures}`);
  
  const total = AUDIT.critiques + AUDIT.majeures + AUDIT.mineures;
  console.log(`\n📋 TOTAL FAILLES: ${total}`);
  
  // Grouper par type
  const byType = {
    CRITICAL: AUDIT.failles.filter(f => f.type === 'CRITICAL'),
    MAJOR: AUDIT.failles.filter(f => f.type === 'MAJOR'),
    MINOR: AUDIT.failles.filter(f => f.type === 'MINOR')
  };

  if (byType.CRITICAL.length > 0) {
    console.log('\n🔴 FAILLES CRITIQUES:');
    byType.CRITICAL.forEach((faille, i) => {
      console.log(`  ${i + 1}. ${faille.issue}`);
      if (faille.file) console.log(`     📁 ${faille.file}`);
      if (faille.solution) console.log(`     ✅ ${faille.solution}`);
    });
  }

  if (byType.MAJOR.length > 0) {
    console.log('\n🟠 FAILLES MAJEURES:');
    byType.MAJOR.forEach((faille, i) => {
      console.log(`  ${i + 1}. ${faille.issue}`);
      if (faille.impact) console.log(`     💥 Impact: ${faille.impact}`);
      if (faille.solution) console.log(`     ✅ ${faille.solution}`);
    });
  }

  if (byType.MINOR.length > 0) {
    console.log('\n🟡 FAILLES MINEURES:');
    byType.MINOR.forEach((faille, i) => {
      console.log(`  ${i + 1}. ${faille.issue}`);
      if (faille.solution) console.log(`     ✅ ${faille.solution}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  
  // Score de perfection
  const perfectionScore = 100 - (AUDIT.critiques * 20 + AUDIT.majeures * 5 + AUDIT.mineures * 1);
  console.log(`\n✨ SCORE DE PERFECTION: ${Math.max(0, perfectionScore)}/100`);
  
  if (AUDIT.critiques === 0 && AUDIT.majeures === 0 && AUDIT.mineures === 0) {
    console.log('\n🎉 PARFAIT! Aucune faille détectée!');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Sauvegarder le rapport
  const reportFile = path.join(__dirname, '../AUDIT_COMPLET_DETAILLE.json');
  fs.writeFileSync(reportFile, JSON.stringify(AUDIT, null, 2));
  console.log(`✅ Rapport sauvegardé: ${reportFile}\n`);
}

// ============================================
// MAIN EXECUTION
// ============================================
console.log('\n🔍 DÉMARRAGE DE L\'AUDIT ULTRA-COMPLET...\n');

checkCritical();
checkMajor();
checkMinor();
generateReport();

process.exit(AUDIT.critiques > 0 ? 1 : 0);
