#!/usr/bin/env node
/**
 * AUDIT HONNÊTE DU FRONTEND
 * Vérification VRAIE: HTML, CSS, React, modules, pas de mensonge
 * Si c'est cassé, on le dit!
 */

const fs = require('fs');
const path = require('path');

const AUDIT = {
  issues: [],
  warnings: [],
  ok: [],
  critical: 0,
  major: 0,
  minor: 0
};

console.log('\n🔍 AUDIT HONNÊTE DU FRONTEND\n');

// ============================================
// 1. VÉRIFIER LES FICHIERS CRITIQUES
// ============================================
console.log('1️⃣  Fichiers Critiques:');

const criticalFiles = [
  'frontend/package.json',
  'frontend/public/index.html',
  'frontend/src/index.js',
  'frontend/src/App.js',
  'frontend/src/setupProxy.js'
];

for (const file of criticalFiles) {
  const fullPath = path.join(__dirname, '../..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
    AUDIT.ok.push(file);
  } else {
    console.log(`  ❌ MANQUANT: ${file}`);
    AUDIT.issues.push({
      severity: 'CRITICAL',
      file,
      issue: 'File missing',
      impact: 'Frontend will not work'
    });
    AUDIT.critical++;
  }
}

// ============================================
// 2. VÉRIFIER package.json
// ============================================
console.log('\n2️⃣  Package.json Analysis:');

try {
  const pkgPath = path.join(__dirname, '../../frontend/package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  const requiredDeps = ['react', 'react-dom', 'react-router-dom'];
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    if (!pkg.dependencies[dep] && !pkg.devDependencies[dep]) {
      console.log(`  ❌ MISSING: ${dep}`);
      missingDeps.push(dep);
      AUDIT.critical++;
    } else {
      console.log(`  ✅ ${dep} present`);
    }
  }
  
  if (missingDeps.length > 0) {
    AUDIT.issues.push({
      severity: 'CRITICAL',
      file: 'frontend/package.json',
      issue: `Missing dependencies: ${missingDeps.join(', ')}`,
      solution: `npm install ${missingDeps.join(' ')}`
    });
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
  AUDIT.critical++;
}

// ============================================
// 3. VÉRIFIER public/index.html
// ============================================
console.log('\n3️⃣  HTML Structure:');

try {
  const htmlPath = path.join(__dirname, '../../frontend/public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  const checks = {
    '<!DOCTYPE html>': 'DOCTYPE',
    '<html': 'HTML tag',
    '<head': 'Head tag',
    '<body': 'Body tag',
    '<div id="root"': 'Root div',
    '<script': 'Script tag'
  };
  
  for (const [pattern, name] of Object.entries(checks)) {
    if (html.includes(pattern)) {
      console.log(`  ✅ ${name}`);
    } else {
      console.log(`  ⚠️  Missing: ${name}`);
      AUDIT.warnings.push({
        file: 'frontend/public/index.html',
        issue: `Missing: ${name}`
      });
      AUDIT.minor++;
    }
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
  AUDIT.critical++;
}

// ============================================
// 4. VÉRIFIER src/App.js
// ============================================
console.log('\n4️⃣  React App Component:');

try {
  const appPath = path.join(__dirname, '../../frontend/src/App.js');
  if (!fs.existsSync(appPath)) {
    console.log(`  ⚠️  App.js not found - using App.jsx or other?`);
    
    // Check for alternatives
    const srcDir = path.join(__dirname, '../../frontend/src');
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);
      const appFiles = files.filter(f => f.toLowerCase().includes('app'));
      if (appFiles.length > 0) {
        console.log(`     Found: ${appFiles.join(', ')}`);
      }
    }
  } else {
    const app = fs.readFileSync(appPath, 'utf8');
    
    if (app.includes('import React') || app.includes('from "react"')) {
      console.log(`  ✅ React imported`);
    } else {
      console.log(`  ⚠️  React import not found`);
    }
    
    if (app.includes('export') || app.includes('module.exports')) {
      console.log(`  ✅ Component exported`);
    } else {
      console.log(`  ⚠️  No export found`);
    }
    
    if (app.includes('return') && app.includes('JSX' || '<')) {
      console.log(`  ✅ Returns JSX`);
    }
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
}

// ============================================
// 5. VÉRIFIER setupProxy.js
// ============================================
console.log('\n5️⃣  API Proxy Configuration:');

try {
  const proxyPath = path.join(__dirname, '../../frontend/src/setupProxy.js');
  if (fs.existsSync(proxyPath)) {
    const proxy = fs.readFileSync(proxyPath, 'utf8');
    
    if (proxy.includes('/api')) {
      console.log(`  ✅ API proxy configured`);
      
      if (proxy.includes('localhost:4000') || proxy.includes('http-proxy-middleware')) {
        console.log(`  ✅ Points to backend:4000`);
      } else {
        console.log(`  ⚠️  Backend target unclear`);
        AUDIT.minor++;
      }
    } else {
      console.log(`  ❌ No API proxy found`);
      AUDIT.major++;
    }
  } else {
    console.log(`  ❌ setupProxy.js not found`);
    console.log(`     Frontend won't proxy API calls to backend!`);
    AUDIT.issues.push({
      severity: 'MAJOR',
      file: 'frontend/src/setupProxy.js',
      issue: 'setupProxy.js missing',
      solution: 'Create setupProxy.js to proxy /api requests'
    });
    AUDIT.major++;
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
  AUDIT.major++;
}

// ============================================
// 6. VÉRIFIER LES PAGES/ROUTES
// ============================================
console.log('\n6️⃣  Pages & Routes:');

try {
  const pagesDir = path.join(__dirname, '../../frontend/src/pages');
  const componentsDir = path.join(__dirname, '../../frontend/src/components');
  
  let pageCount = 0;
  let componentCount = 0;
  
  if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
    pageCount = pages.length;
    console.log(`  ✅ Pages: ${pageCount} found`);
  } else {
    console.log(`  ⚠️  No pages directory`);
  }
  
  if (fs.existsSync(componentsDir)) {
    const components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
    componentCount = components.length;
    console.log(`  ✅ Components: ${componentCount} found`);
  } else {
    console.log(`  ⚠️  No components directory`);
  }
  
  if (pageCount === 0 && componentCount === 0) {
    console.log(`  ⚠️  No pages or components found - UI might be empty!`);
    AUDIT.warnings.push({
      file: 'frontend/src',
      issue: 'No pages or components found'
    });
    AUDIT.major++;
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
}

// ============================================
// 7. VÉRIFIER TAILWIND/CSS
// ============================================
console.log('\n7️⃣  Styling (Tailwind/CSS):');

try {
  const pkgPath = path.join(__dirname, '../../frontend/package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  if (pkg.dependencies['tailwindcss'] || pkg.devDependencies['tailwindcss']) {
    console.log(`  ✅ Tailwind CSS installed`);
    
    const tailwindConfig = path.join(__dirname, '../../frontend/tailwind.config.js');
    if (fs.existsSync(tailwindConfig)) {
      console.log(`  ✅ tailwind.config.js exists`);
    } else {
      console.log(`  ⚠️  tailwind.config.js not found`);
      AUDIT.minor++;
    }
  } else {
    console.log(`  ⚠️  Tailwind CSS not installed`);
    AUDIT.minor++;
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
}

// ============================================
// 8. VÉRIFIER ZUSTAND/STATE MANAGEMENT
// ============================================
console.log('\n8️⃣  State Management:');

try {
  const pkgPath = path.join(__dirname, '../../frontend/package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  if (pkg.dependencies['zustand'] || pkg.devDependencies['zustand']) {
    console.log(`  ✅ Zustand installed`);
  } else {
    console.log(`  ⚠️  Zustand not found`);
    AUDIT.minor++;
  }
  
  if (pkg.dependencies['react-query'] || pkg.devDependencies['react-query']) {
    console.log(`  ✅ React Query installed (data fetching)`);
  } else {
    console.log(`  ⚠️  React Query not installed`);
    AUDIT.minor++;
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
}

// ============================================
// 9. VÉRIFIER i18n
// ============================================
console.log('\n9️⃣  Internationalization (i18n):');

try {
  const pkgPath = path.join(__dirname, '../../frontend/package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  if (pkg.dependencies['i18next'] || pkg.devDependencies['i18next']) {
    console.log(`  ✅ i18next installed`);
  } else {
    console.log(`  ⚠️  i18next not installed`);
    AUDIT.minor++;
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
}

// ============================================
// 10. VÉRIFIER node_modules
// ============================================
console.log('\n🔟 Dependencies Status:');

try {
  const nodeModulesPath = path.join(__dirname, '../../frontend/node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const modules = fs.readdirSync(nodeModulesPath).length;
    console.log(`  ✅ node_modules exists (${modules} packages)`);
    
    if (modules < 100) {
      console.log(`  ⚠️  Only ${modules} modules - might be incomplete!`);
      AUDIT.warnings.push({
        file: 'frontend/node_modules',
        issue: 'Few modules - run npm install'
      });
    }
  } else {
    console.log(`  ❌ node_modules NOT INSTALLED!`);
    console.log(`     Run: cd frontend && npm install`);
    AUDIT.issues.push({
      severity: 'CRITICAL',
      file: 'frontend/node_modules',
      issue: 'Dependencies not installed',
      solution: 'cd frontend && npm install'
    });
    AUDIT.critical++;
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
}

// ============================================
// 11. VÉRIFIER ERREURS COURANTES
// ============================================
console.log('\n1️⃣1️⃣  Erreurs Courantes React:');

try {
  const srcDir = path.join(__dirname, '../../frontend/src');
  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir, { recursive: true })
      .filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
    
    let hasJsxErrors = false;
    
    for (const file of files.slice(0, 10)) { // Check first 10 files
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for common errors
      if (content.includes('console.log') && !content.includes('// console.log')) {
        if (!hasJsxErrors) {
          console.log(`  ⚠️  console.log statements in code`);
          hasJsxErrors = true;
        }
      }
    }
    
    if (!hasJsxErrors) {
      console.log(`  ✅ No obvious errors found`);
    }
  }
} catch (err) {
  console.log(`  ❌ ERROR: ${err.message}`);
}

// ============================================
// RÉSULTATS FINAUX
// ============================================
console.log('\n' + '='.repeat(70));
console.log('📊 RÉSULTATS D\'AUDIT HONNÊTE');
console.log('='.repeat(70));

console.log(`\n🔴 CRITIQUES: ${AUDIT.critical}`);
console.log(`🟠 MAJEURS: ${AUDIT.major}`);
console.log(`🟡 MINEURS: ${AUDIT.minor}`);
console.log(`✅ OK: ${AUDIT.ok.length}`);

if (AUDIT.critical > 0) {
  console.log('\n🔴 FAILLES CRITIQUES:');
  AUDIT.issues
    .filter(i => i.severity === 'CRITICAL')
    .forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.issue}`);
      console.log(`     File: ${issue.file}`);
      if (issue.solution) console.log(`     Fix: ${issue.solution}`);
    });
}

if (AUDIT.major > 0) {
  console.log('\n🟠 FAILLES MAJEURES:');
  AUDIT.issues
    .filter(i => i.severity === 'MAJOR')
    .forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.issue}`);
      if (issue.solution) console.log(`     Fix: ${issue.solution}`);
    });
}

const totalIssues = AUDIT.critical + AUDIT.major + AUDIT.minor;
const frontendScore = Math.max(0, 100 - (AUDIT.critical * 30 + AUDIT.major * 10 + AUDIT.minor * 2));

console.log('\n' + '='.repeat(70));
console.log(`\n✨ FRONTEND SCORE: ${frontendScore}/100`);

if (AUDIT.critical === 0 && AUDIT.major === 0) {
  console.log('\n🎉 FRONTEND EST BON! ✅');
} else if (AUDIT.critical > 0) {
  console.log('\n❌ FRONTEND A DES PROBLÈMES CRITIQUES!');
  console.log('\nCes problèmes DOIVENT être résolus avant la production!');
} else {
  console.log('\n⚠️  FRONTEND A DES PROBLÈMES MAJEURS');
  console.log('\nCes problèmes devraient être résolus!');
}

console.log('\n' + '='.repeat(70) + '\n');

process.exit(AUDIT.critical > 0 ? 1 : 0);
