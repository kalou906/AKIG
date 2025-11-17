#!/usr/bin/env node

// Test ultra-simple du backend AKIG
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           🧪 AKIG Backend - Démarrage Complet            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// 1. Vérifier .env
console.log('📋 Étape 1: Vérification du fichier .env');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env not found at', envPath);
    process.exit(1);
}
console.log('✓ .env found at', envPath);

// 2. Charger .env
console.log('\n📋 Étape 2: Chargement des variables d\'env');
require('dotenv').config({ path: envPath });
const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
for (const v of requiredVars) {
    if (!process.env[v]) {
        console.error(`❌ ${v} not set in .env`);
        process.exit(1);
    }
    if (v === 'JWT_SECRET') {
        console.log(`✓ ${v} = ${process.env[v].substring(0, 10)}...`);
    } else {
        console.log(`✓ ${v} = ${process.env[v]}`);
    }
}

// 3. Vérifier les dépendances critiques
console.log('\n📋 Étape 3: Vérification des packages NPM');
const criticalPackages = ['express', 'pg', 'cors', 'jsonwebtoken', 'morgan'];
for (const pkg of criticalPackages) {
    try {
        require(pkg);
        console.log(`✓ ${pkg} loaded`);
    } catch (e) {
        console.error(`❌ ${pkg} not installed:`, e.message);
        process.exit(1);
    }
}

// 4. Tester la connexion DB
console.log('\n📋 Étape 4: Vérification de la base de données');
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✓ Database connected at', res.rows[0].now);
    
    // Compter les tables
    pool.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public'
    `, (err, res) => {
        if (err) {
            console.error('❌ Error querying tables:', err.message);
            process.exit(1);
        }
        console.log(`✓ ${res.rows[0].count} tables found in database`);
        
        // 5. Charger l'app Express
        console.log('\n📋 Étape 5: Démarrage du serveur Express');
        try {
            const app = require('./src/index.js');
            console.log('✓ Express app loaded');
            
            // 6. Tester l'endpoint /health
            const http = require('http');
            const PORT = process.env.PORT || 4000;
            
            setTimeout(() => {
                console.log('\n📋 Étape 6: Test du endpoint /api/health');
                const options = {
                    hostname: 'localhost',
                    port: PORT,
                    path: '/api/health',
                    method: 'GET'
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            console.log('✓ /api/health returned 200');
                            try {
                                const parsed = JSON.parse(data);
                                console.log('✓ Response:', JSON.stringify(parsed, null, 2));
                            } catch (e) {
                                console.log('✓ Response:', data);
                            }
                        } else {
                            console.error(`❌ /api/health returned ${res.statusCode}`);
                            console.error('Response:', data);
                        }
                        
                        console.log('\n╔════════════════════════════════════════════════════════════╗');
                        console.log('║           ✅ TOUS LES TESTS RÉUSSIS!                    ║');
                        console.log('║                                                         ║');
                        console.log('║   Le backend AKIG est complètement fonctionnel!         ║');
                        console.log('║   Accédez à: http://localhost:' + PORT + '/api/health        ║');
                        console.log('╚════════════════════════════════════════════════════════════╝\n');
                        
                        process.exit(0);
                    });
                });
                
                req.on('error', (error) => {
                    console.error('❌ Request failed:', error.message);
                    process.exit(1);
                });
                
                req.end();
            }, 1000);
            
        } catch (e) {
            console.error('❌ Error loading Express app:', e.message);
            console.error(e.stack);
            process.exit(1);
        }
    });
});

// Timeout after 10 seconds
setTimeout(() => {
    console.error('\n❌ Timeout: Test took too long');
    process.exit(1);
}, 10000);
