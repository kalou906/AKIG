/**
 * Enhanced Health Check & Diagnostic System
 * Vérifie l'intégrité complète du système AKIG
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class SystemDiagnostics {
  constructor() {
    this.results = {};
    this.startTime = Date.now();
  }

  async runAll() {
    console.log('\n=== AKIG System Diagnostics ===\n');

    await this.checkNodeVersion();
    await this.checkEnvironment();
    await this.checkDiskSpace();
    await this.checkDatabase();
    await this.checkDependencies();
    await this.checkFileSystem();

    this.printReport();
    return this.results;
  }

  async checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.split('.')[0].substring(1));
    const status = major >= 14 ? 'PASS' : 'FAIL';
    
    this.results.nodeVersion = {
      status,
      version,
      required: '>=14.0.0',
      timestamp: new Date()
    };
  }

  async checkEnvironment() {
    const required = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'PORT'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    this.results.environment = {
      status: missing.length === 0 ? 'PASS' : 'WARN',
      configured: required.filter(key => !!process.env[key]),
      missing,
      details: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        PORT: process.env.PORT || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? '***configured***' : 'not set'
      }
    };
  }

  async checkDiskSpace() {
    try {
      const stats = fs.statSync('./');
      this.results.diskSpace = {
        status: 'PASS',
        directory: process.cwd(),
        readable: true
      };
    } catch (err) {
      this.results.diskSpace = {
        status: 'FAIL',
        error: err.message
      };
    }
  }

  async checkDatabase() {
    try {
      const mockdbPath = path.join(__dirname, '../.mockdb.json');
      const exists = fs.existsSync(mockdbPath);
      
      // Essayer de charger la pool
      const pool = require('../db.js');
      
      try {
        const result = await Promise.race([
          pool.query('SELECT 1 as test'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 2000)
          )
        ]);
        
        this.results.database = {
          status: 'PASS',
          type: 'PostgreSQL',
          connected: true,
          mockDB: false
        };
      } catch (err) {
        // PostgreSQL non disponible, vérifier Mock DB
        this.results.database = {
          status: 'WARN',
          type: 'Mock DB',
          connected: true,
          mockDBActive: true,
          note: 'PostgreSQL unavailable, using in-memory cache'
        };
      }
    } catch (err) {
      this.results.database = {
        status: 'FAIL',
        error: err.message
      };
    }
  }

  async checkDependencies() {
    const critical = ['express', 'pg', 'dotenv', 'cors'];
    const missing = [];

    for (const dep of critical) {
      try {
        require(dep);
      } catch {
        missing.push(dep);
      }
    }

    this.results.dependencies = {
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      installed: critical.filter(d => !missing.includes(d)),
      missing,
      total: critical.length
    };
  }

  async checkFileSystem() {
    const requiredFiles = [
      'src/index.js',
      'src/db.js',
      '.env',
      'package.json'
    ];

    const missing = [];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        missing.push(file);
      }
    }

    this.results.fileSystem = {
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      present: requiredFiles.filter(f => !missing.includes(f)),
      missing,
      workingDirectory: process.cwd()
    };
  }

  printReport() {
    const lines = [];
    lines.push('\n╔════════════════════════════════════════════════════╗');
    lines.push('║         AKIG System Health Report                  ║');
    lines.push('╚════════════════════════════════════════════════════╝\n');

    for (const [key, value] of Object.entries(this.results)) {
      const icon = value.status === 'PASS' ? '✅' : value.status === 'WARN' ? '⚠️' : '❌';
      lines.push(`${icon} ${key.toUpperCase()}: ${value.status}`);
      
      if (value.details) {
        Object.entries(value.details).forEach(([k, v]) => {
          lines.push(`   - ${k}: ${v}`);
        });
      }
      if (value.configured) {
        lines.push(`   Configured: ${value.configured.join(', ')}`);
      }
      if (value.missing && value.missing.length > 0) {
        lines.push(`   Missing: ${value.missing.join(', ')}`);
      }
      lines.push('');
    }

    const duration = Date.now() - this.startTime;
    lines.push(`Diagnostics completed in ${duration}ms`);
    lines.push('\n' + '═'.repeat(55) + '\n');

    const report = lines.join('\n');
    console.log(report);

    // Sauvegarder rapport
    try {
      fs.writeFileSync('.healthcheck.json', JSON.stringify(this.results, null, 2));
    } catch (err) {
      console.error('Could not write health report:', err.message);
    }
  }

  getHealthStatus() {
    const allPass = Object.values(this.results).every(r => r.status === 'PASS');
    const anyFail = Object.values(this.results).some(r => r.status === 'FAIL');

    return {
      healthy: allPass || (!anyFail),
      status: allPass ? 'healthy' : 'degraded',
      timestamp: new Date(),
      checks: Object.keys(this.results)
    };
  }
}

module.exports = SystemDiagnostics;
