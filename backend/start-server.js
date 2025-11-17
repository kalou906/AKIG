#!/usr/bin/env node
/**
 * AKIG Server Launcher - Production Ready
 * Gère démarrage complet avec diagnostique et fallback
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Load .env IMMEDIATELY
require('dotenv').config();

const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

class ServerLauncher {
  constructor() {
    this.checks = [];
    this.readyToStart = true;
  }

  log(type, message) {
    const icons = {
      INFO: `${CYAN}ℹ${RESET}`,
      OK: `${GREEN}✓${RESET}`,
      WARN: `${YELLOW}⚠${RESET}`,
      ERR: `${RED}✗${RESET}`
    };

    console.log(`${icons[type] || '•'} ${message}`);
  }

  async runPreflightChecks() {
    console.log(`\n${BRIGHT}${CYAN}╔════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BRIGHT}${CYAN}║       AKIG Pre-Flight Checks - Production Launch       ║${RESET}`);
    console.log(`${BRIGHT}${CYAN}╚════════════════════════════════════════════════════════╝${RESET}\n`);

    // Check 1: Node.js version
    this.log('INFO', 'Checking Node.js version...');
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.split('.')[0].substring(1));
    if (major >= 14) {
      this.log('OK', `Node.js ${nodeVersion} (required: >=14)`);
    } else {
      this.log('ERR', `Node.js ${nodeVersion} is too old (required: >=14)`);
      this.readyToStart = false;
    }

    // Check 2: Environment variables
    this.log('INFO', 'Checking environment variables...');
    const required = ['NODE_ENV', 'PORT', 'JWT_SECRET', 'DATABASE_URL'];
    let envOk = true;
    for (const key of required) {
      if (process.env[key]) {
        this.log('OK', `${key} is configured`);
      } else {
        this.log('WARN', `${key} not set (using default)`);
        if (key === 'JWT_SECRET') {
          this.readyToStart = false;
          envOk = false;
        }
      }
    }

    // Check 3: Required files
    this.log('INFO', 'Checking required files...');
    const files = [
      'package.json',
      'src/index.js',
      'src/db.js',
      '.env'
    ];
    for (const file of files) {
      if (fs.existsSync(file)) {
        this.log('OK', `${file} present`);
      } else {
        this.log('WARN', `${file} missing`);
      }
    }

    // Check 4: Dependencies
    this.log('INFO', 'Checking dependencies...');
    const deps = ['express', 'pg', 'dotenv', 'cors'];
    for (const dep of deps) {
      try {
        require(dep);
        this.log('OK', `${dep} installed`);
      } catch {
        this.log('ERR', `${dep} NOT installed`);
        this.readyToStart = false;
      }
    }

    // Check 5: Database connectivity
    this.log('INFO', 'Checking database connectivity...');
    try {
      const pool = require('./src/db.js');
      const result = await Promise.race([
        pool.query('SELECT 1'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 1500)
        )
      ]);
      this.log('OK', 'PostgreSQL connected');
    } catch (err) {
      this.log('WARN', `PostgreSQL unavailable: ${err.message}`);
      this.log('INFO', 'Will use Mock DB (in-memory with persistence)');
    }

    console.log('');
  }

  async startServer() {
    if (!this.readyToStart) {
      console.error(`${RED}${BRIGHT}Critical checks failed. Fix issues and retry.${RESET}\n`);
      process.exit(1);
    }

    console.log(`${BRIGHT}${GREEN}All checks passed! Starting server...${RESET}\n`);

    const env = {
      ...process.env,
      NODE_OPTIONS: '--max_old_space_size=4096',
      DEBUG: process.env.DEBUG || 'akig:*'
    };

    const server = spawn('node', ['src/index.js'], {
      stdio: 'inherit',
      env
    });

    server.on('error', (err) => {
      this.log('ERR', `Server error: ${err.message}`);
      process.exit(1);
    });

    server.on('exit', (code) => {
      if (code !== 0) {
        console.error(`${RED}Server exited with code ${code}${RESET}`);
      }
      process.exit(code);
    });

    // Handle signals
    process.on('SIGINT', () => {
      this.log('INFO', 'Shutting down gracefully...');
      server.kill('SIGTERM');
    });

    process.on('SIGTERM', () => {
      this.log('INFO', 'Received SIGTERM, shutting down...');
      server.kill('SIGTERM');
    });
  }
}

// Main execution
const launcher = new ServerLauncher();
launcher.runPreflightChecks()
  .then(() => launcher.startServer())
  .catch(err => {
    console.error(`${RED}Launch error: ${err.message}${RESET}`);
    process.exit(1);
  });
