#!/usr/bin/env node

// ============================================================
// 🔍 AKIG - Vérification Système Ultra-Complète
// ============================================================

const fs = require('fs');
const path = require('path');

// Load pg from backend node_modules
let Pool;
try {
    Pool = require('./backend/node_modules/pg').Pool;
} catch (e) {
    console.error('Error loading pg module:', e.message);
    process.exit(1);
}

const root = 'C:\\AKIG';
const backend = path.join(root, 'backend');
const frontend = path.join(root, 'frontend');

let errorCount = 0;
let warningCount = 0;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  🔍 AKIG - VÉRIFICATION SYSTÈME ULTRA-COMPLÈTE            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const tests = [];

// Test 1: Répertoires
function testDirectories() {
    console.log('📂 Test 1: Répertoires');
    const dirs = [
        backend,
        frontend,
        path.join(backend, 'src'),
        path.join(backend, 'src/routes'),
        path.join(backend, 'src/migrations'),
        path.join(frontend, 'src'),
        path.join(frontend, 'public'),
    ];
    
    dirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`  ✓ ${path.relative(root, dir)}`);
        } else {
            console.error(`  ❌ ${path.relative(root, dir)} NOT FOUND`);
            errorCount++;
        }
    });
}

// Test 2: Fichiers critiques
function testCriticalFiles() {
    console.log('\n📄 Test 2: Fichiers Critiques');
    const files = [
        path.join(backend, 'package.json'),
        path.join(backend, '.env'),
        path.join(backend, 'src/index.js'),
        path.join(backend, 'src/db.js'),
        path.join(frontend, 'package.json'),
        path.join(frontend, 'src/index.tsx'),
        path.join(frontend, 'src/setupProxy.js'),
        path.join(frontend, 'tailwind.config.js'),
        path.join(frontend, 'public/index.html'),
    ];
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            const size = fs.statSync(file).size;
            console.log(`  ✓ ${path.relative(root, file)} (${size} bytes)`);
        } else {
            console.error(`  ❌ ${path.relative(root, file)} NOT FOUND`);
            errorCount++;
        }
    });
}

// Test 3: Variables d'environnement
function testEnvironment() {
    console.log('\n🔧 Test 3: Variables d\'Environnement (.env)');
    const envPath = path.join(backend, '.env');
    
    if (!fs.existsSync(envPath)) {
        console.error('  ❌ .env not found');
        errorCount++;
        return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT', 'CORS_ORIGIN'];
    
    required.forEach(key => {
        if (envContent.includes(key)) {
            const value = envContent.split('\n').find(l => l.startsWith(key));
            if (key === 'JWT_SECRET') {
                console.log(`  ✓ ${key} = ${value.split('=')[1].substring(0, 15)}...`);
            } else {
                console.log(`  ✓ ${key}`);
            }
        } else {
            console.error(`  ❌ ${key} missing in .env`);
            errorCount++;
        }
    });
}

// Test 4: npm packages
function testNpmPackages() {
    console.log('\n📦 Test 4: NPM Packages');
    
    // Backend
    console.log('  Backend:');
    const backendPkg = JSON.parse(fs.readFileSync(path.join(backend, 'package.json'), 'utf8'));
    const backendModules = ['express', 'pg', 'cors', 'dotenv', 'jsonwebtoken', 'bcryptjs'];
    backendModules.forEach(mod => {
        if (backendPkg.dependencies[mod]) {
            console.log(`    ✓ ${mod} v${backendPkg.dependencies[mod]}`);
        } else {
            console.error(`    ❌ ${mod} missing`);
            errorCount++;
        }
    });
    
    // Frontend
    console.log('  Frontend:');
    const frontendPkg = JSON.parse(fs.readFileSync(path.join(frontend, 'package.json'), 'utf8'));
    const frontendModules = ['react', 'react-dom', 'react-router-dom', 'tailwindcss'];
    frontendModules.forEach(mod => {
        if (frontendPkg.dependencies[mod] || frontendPkg.devDependencies[mod]) {
            const version = frontendPkg.dependencies[mod] || frontendPkg.devDependencies[mod];
            console.log(`    ✓ ${mod} v${version}`);
        } else {
            console.error(`    ❌ ${mod} missing`);
            errorCount++;
        }
    });
}

// Test 5: node_modules
function testNodeModules() {
    console.log('\n📚 Test 5: node_modules');
    
    const backendModulesPath = path.join(backend, 'node_modules');
    if (fs.existsSync(backendModulesPath)) {
        const count = fs.readdirSync(backendModulesPath).length;
        console.log(`  ✓ Backend node_modules (${count} packages)`);
    } else {
        console.error('  ❌ Backend node_modules missing');
        errorCount++;
    }
    
    const frontendModulesPath = path.join(frontend, 'node_modules');
    if (fs.existsSync(frontendModulesPath)) {
        const count = fs.readdirSync(frontendModulesPath).length;
        console.log(`  ✓ Frontend node_modules (${count} packages)`);
    } else {
        console.error('  ❌ Frontend node_modules missing');
        errorCount++;
    }
}

// Test 6: Base de données
function testDatabase(callback) {
    console.log('\n🗄️  Test 6: Base de Données PostgreSQL');
    
    // Load dotenv from backend node_modules
    let dotenv;
    try {
        dotenv = require('./backend/node_modules/dotenv');
    } catch (e) {
        console.error('  ❌ dotenv module not found');
        errorCount++;
        callback();
        return;
    }
    
    dotenv.config({ path: path.join(backend, '.env') });
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error('  ❌ DATABASE_URL not set');
        errorCount++;
        callback();
        return;
    }
    
    const pool = new Pool({ connectionString });
    
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('  ❌ Connection failed:', err.message);
            errorCount++;
            pool.end();
            callback();
            return;
        }
        
        console.log(`  ✓ Connected to PostgreSQL at ${connectionString.split('@')[1]}`);
        
        // Vérifier les tables
        pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `, (err, res) => {
            if (err) {
                console.error('  ❌ Error fetching tables:', err.message);
                errorCount++;
            } else {
                console.log(`  ✓ Database has ${res.rows.length} tables:`);
                res.rows.forEach(row => console.log(`    - ${row.table_name}`));
            }
            pool.end();
            callback();
        });
    });
}

// Test 7: Ports disponibilité
function testPorts(callback) {
    console.log('\n🔌 Test 7: Ports Disponibilité');
    
    const net = require('net');
    const ports = [3000, 4000, 5432];
    let checked = 0;
    
    ports.forEach(port => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.warn(`  ⚠ Port ${port} in use`);
                warningCount++;
            } else {
                console.error(`  ❌ Port ${port} error: ${err.message}`);
                errorCount++;
            }
            checked++;
            if (checked === ports.length) callback();
        });
        
        server.once('listening', () => {
            console.log(`  ✓ Port ${port} available`);
            server.close();
            checked++;
            if (checked === ports.length) callback();
        });
        
        server.listen(port, '127.0.0.1');
    });
}

// Exécuter tous les tests
testDirectories();
testCriticalFiles();
testEnvironment();
testNpmPackages();
testNodeModules();

testDatabase(() => {
    testPorts(() => {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log(`║  ✅ VÉRIFICATION TERMINÉE                                ║`);
        console.log(`║  Erreurs: ${errorCount}  |  Avertissements: ${warningCount}                       ║`);
        
        if (errorCount === 0) {
            console.log('║                                                            ║');
            console.log('║  🎉 TOUS LES TESTS RÉUSSIS!                             ║');
            console.log('║  Le système est prêt pour le lancement!                 ║');
            console.log('║                                                            ║');
            console.log('║  Lancez: RUN_AKIG.bat                                   ║');
            console.log('╚════════════════════════════════════════════════════════════╝\n');
            process.exit(0);
        } else {
            console.log('║                                                            ║');
            console.log('║  ❌ ERREURS DÉTECTÉES                                   ║');
            console.log('║  Veuillez corriger les problèmes ci-dessus              ║');
            console.log('╚════════════════════════════════════════════════════════════╝\n');
            process.exit(1);
        }
    });
});
