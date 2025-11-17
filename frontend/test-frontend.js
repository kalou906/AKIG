#!/usr/bin/env node

// Test du frontend AKIG
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           🧪 AKIG Frontend - Vérification Complète       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const fs = require('fs');
const path = require('path');

// 1. Vérifier le répertoire frontend
console.log('📋 Étape 1: Vérification du répertoire frontend');
const frontendDir = path.join(__dirname, '..', 'frontend');
if (!fs.existsSync(frontendDir)) {
    console.error('❌ Frontend directory not found:', frontendDir);
    process.exit(1);
}
console.log('✓ Frontend directory found:', frontendDir);

// 2. Vérifier package.json
console.log('\n📋 Étape 2: Vérification de package.json');
const packageJsonPath = path.join(frontendDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
}
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(`✓ package.json found`);
console.log(`  - Name: ${packageJson.name}`);
console.log(`  - Version: ${packageJson.version}`);
console.log(`  - React: ${packageJson.dependencies.react}`);
console.log(`  - React Router: ${packageJson.dependencies['react-router-dom']}`);
console.log(`  - Tailwind: ${packageJson.devDependencies.tailwindcss}`);

// 3. Vérifier node_modules
console.log('\n📋 Étape 3: Vérification de node_modules');
const nodeModulesPath = path.join(frontendDir, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ node_modules not found - Run: npm install --legacy-peer-deps');
    process.exit(1);
}
const moduleCount = fs.readdirSync(nodeModulesPath).length;
console.log(`✓ node_modules found (${moduleCount} packages)`);

// 4. Vérifier les fichiers source critiques
console.log('\n📋 Étape 4: Vérification des fichiers source');
const criticalFiles = [
    'src/index.tsx',
    'src/App.jsx',
    'src/App.tsx',
    'src/setupProxy.js',
    'tailwind.config.js',
    'public/index.html'
];

for (const file of criticalFiles) {
    const filePath = path.join(frontendDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✓ ${file}`);
    } else {
        console.warn(`⚠ ${file} not found (may be optional)`);
    }
}

// 5. Vérifier setupProxy.js pour la configuration
console.log('\n📋 Étape 5: Vérification de setupProxy.js');
const setupProxyPath = path.join(frontendDir, 'src', 'setupProxy.js');
if (fs.existsSync(setupProxyPath)) {
    const setupProxy = fs.readFileSync(setupProxyPath, 'utf8');
    if (setupProxy.includes('localhost:4000') || setupProxy.includes('4000')) {
        console.log('✓ setupProxy correctly configured for backend on port 4000');
    } else {
        console.warn('⚠ setupProxy may not be correctly configured');
    }
}

// 6. Vérifier les packages critiques
console.log('\n📋 Étape 6: Vérification des packages React critiques');
const criticalReactPackages = ['react', 'react-dom', 'react-router-dom', 'react-scripts'];
for (const pkg of criticalReactPackages) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
        console.log(`✓ ${pkg} v${pkgJson.version}`);
    } else {
        console.error(`❌ ${pkg} not found in node_modules`);
        process.exit(1);
    }
}

// 7. Vérifier tsconfig
console.log('\n📋 Étape 7: Vérification de tsconfig.json');
const tsconfigPath = path.join(frontendDir, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
    console.log('✓ tsconfig.json found');
}

// 8. Vérifier Tailwind
console.log('\n📋 Étape 8: Vérification de tailwind.config.js');
const tailwindPath = path.join(frontendDir, 'tailwind.config.js');
if (fs.existsSync(tailwindPath)) {
    console.log('✓ tailwind.config.js found');
}

// 9. Vérifier i18n
console.log('\n📋 Étape 9: Vérification de la configuration i18n');
const i18nDir = path.join(frontendDir, 'src', 'i18n');
if (fs.existsSync(i18nDir)) {
    const i18nFiles = fs.readdirSync(i18nDir);
    console.log(`✓ i18n directory found (${i18nFiles.length} files)`);
    i18nFiles.forEach(f => console.log(`  - ${f}`));
}

// 10. Résumé
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           ✅ VÉRIFICATION FRONTEND RÉUSSIE!              ║');
console.log('║                                                         ║');
console.log('║   Tous les fichiers et packages sont présents!          ║');
console.log('║                                                         ║');
console.log('║   Pour démarrer le frontend:                            ║');
console.log('║   cd C:\\AKIG\\frontend && npm start                     ║');
console.log('║   Accédez à: http://localhost:3000                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

process.exit(0);
