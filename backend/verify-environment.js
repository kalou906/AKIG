#!/usr/bin/env node

/**
 * AKIG - Environment Verification Script
 * Validates all required environment variables before startup
 * Prevents silent failures and cryptic error messages
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// ============================================
// CONFIGURATION
// ============================================

const REQUIRED_ENV_VARS = {
  NODE_ENV: { default: 'development', validator: (v) => ['development', 'staging', 'production'].includes(v) },
  PORT: { default: '4000', validator: (v) => !isNaN(v) && v > 0 && v < 65535 },
  DATABASE_URL: { required: true, validator: (v) => v.includes('postgresql://') || v.includes('postgres://') },
  JWT_SECRET: { required: true, validator: (v) => v.length >= 32 },
  JWT_EXPIRY: { default: '24h', validator: (v) => /^\d+[smhd]$/.test(v) },
  LOG_LEVEL: { default: 'info', validator: (v) => ['error', 'warn', 'info', 'http', 'debug', 'trace'].includes(v) },
  CORS_ORIGIN: { default: 'http://localhost:3000', validator: (v) => v.includes('http') },
  TZ: { default: 'UTC', validator: () => true },
};

const OPTIONAL_ENV_VARS = {
  REDIS_ENABLED: 'false',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  SMTP_ENABLED: 'false',
  LOG_FILE_ENABLED: 'true',
  FEATURE_CSV_IMPORT: 'true',
  FEATURE_PDF_EXPORT: 'true',
  FEATURE_AUDIT_LOGGING: 'true',
};

// ============================================
// COLOR CODES FOR TERMINAL OUTPUT
// ============================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'success':
      console.log(`${prefix} ${colors.green}✓ ${message}${colors.reset}`);
      break;
    case 'error':
      console.error(`${prefix} ${colors.red}✗ ${message}${colors.reset}`);
      break;
    case 'warn':
      console.log(`${prefix} ${colors.yellow}⚠ ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${prefix} ${colors.cyan}ℹ ${message}${colors.reset}`);
      break;
    case 'section':
      console.log(`\n${colors.bright}${colors.blue}═══ ${message} ═══${colors.reset}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function createDirectoryIfNotExists(dirPath) {
  if (!directoryExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'success');
    return true;
  }
  return false;
}

// ============================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================

function resolveEnvFile() {
  const envFile = process.env.ENV_FILE || '.env';
  const envPath = path.isAbsolute(envFile) ? envFile : path.resolve(process.cwd(), envFile);
  return { envFile, envPath };
}

function loadEnvironmentFile() {
  const context = resolveEnvFile();

  try {
    const result = dotenv.config({ path: context.envPath });
    context.loaded = !result.error;
    context.error = result.error || null;
  } catch (error) {
    context.loaded = false;
    context.error = error;
  }

  return context;
}

function verifyEnvironmentVariables(envContext) {
  log('Checking environment variables', 'section');
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check for .env file
  const envFileExists = fileExists(envContext.envPath);

  if (envFileExists && envContext.loaded) {
    log(`.env file loaded: ${envContext.envFile}`, 'success');
  } else if (envFileExists) {
    log(`.env file found but could not be loaded: ${envContext.envFile}`, 'warn');
    hasWarnings = true;
    if (envContext.error) {
      log(`Error loading .env file: ${envContext.error.message}`, 'warn');
    }
  } else {
    log(`.env file not found at ${envContext.envFile}. Using process environment.`, 'warn');
    hasWarnings = true;
  }

  if (envContext.error && envContext.error.code && envContext.error.code !== 'ENOENT') {
    log(`dotenv reported an error: ${envContext.error.message}`, 'warn');
    hasWarnings = true;
  }

  // Verify required variables
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key] || config.default;

    if (!value && config.required) {
      log(`Missing required variable: ${key}`, 'error');
      hasErrors = true;
    } else if (value && config.validator && !config.validator(value)) {
      log(`Invalid value for ${key}: "${value}"`, 'error');
      hasErrors = true;
    } else if (value) {
      const displayValue = key.includes('SECRET') ? '***' : value;
      log(`${key} = ${displayValue}`, 'success');
    }
  }

  // Verify optional variables (warnings only)
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[key] || defaultValue;
    log(`${key} = ${value} (default: ${defaultValue})`, 'info');
  }

  return !hasErrors;
}

// ============================================
// FILE SYSTEM VERIFICATION
// ============================================

function verifyDirectoryStructure() {
  log('Checking directory structure', 'section');

  const requiredDirs = [
    'src',
    'src/routes',
    'src/services',
    'src/models',
    'src/middleware',
    'src/utils',
    'logs',
    'uploads',
  ];

  let allExist = true;

  for (const dir of requiredDirs) {
    if (directoryExists(dir)) {
      log(`Directory exists: ${dir}`, 'success');
    } else {
      log(`Missing directory: ${dir}`, 'warn');
      createDirectoryIfNotExists(dir);
      allExist = false;
    }
  }

  return allExist;
}

// ============================================
// DEPENDENCY CHECK
// ============================================

function verifyDependencies() {
  log('Checking Node.js dependencies', 'section');

  const requiredPackages = [
    'express',
    'pg',
    'dotenv',
    'jsonwebtoken',
    'bcryptjs',
    'cors',
  ];

  let allInstalled = true;

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      log(`Package installed: ${pkg}`, 'success');
    } catch {
      log(`Missing package: ${pkg}. Run "npm install"`, 'error');
      allInstalled = false;
    }
  }

  return allInstalled;
}

// ============================================
// DATABASE CONNECTIVITY CHECK
// ============================================

async function verifyDatabase() {
  log('Checking database connectivity', 'section');

  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    log(`Database connection successful: ${result.rows[0].now}`, 'success');
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'error');
    log('Make sure PostgreSQL is running and DATABASE_URL is correct', 'warn');
    return false;
  }
}

// ============================================
// PORT AVAILABILITY CHECK
// ============================================

async function verifyPortAvailable() {
  log('Checking port availability', 'section');

  const port = process.env.PORT || 4000;
  const net = require('net');

  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`, 'error');
        resolve(false);
      } else {
        log(`Error checking port: ${err.message}`, 'error');
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      log(`Port ${port} is available`, 'success');
      resolve(true);
    });

    server.listen(port);
  });
}

// ============================================
// MAIN VERIFICATION FLOW
// ============================================

async function runAllVerifications() {
  console.clear();
  log('╔════════════════════════════════════════╗', 'section');
  log('║   AKIG Backend - Environment Check    ║', 'section');
  log('╚════════════════════════════════════════╝', 'section');

  const envContext = loadEnvironmentFile();

  const results = {
    envVars: verifyEnvironmentVariables(envContext),
    dirStructure: verifyDirectoryStructure(),
    dependencies: verifyDependencies(),
    portAvailable: await verifyPortAvailable(),
  };

  let dbConnected = false;
  try {
    dbConnected = await verifyDatabase();
  } catch (error) {
    log('Database check skipped', 'warn');
  }
  results.database = dbConnected;

  // ============================================
  // FINAL SUMMARY
  // ============================================

  log('Environment verification summary', 'section');

  const summary = {
    'Environment Variables': results.envVars,
    'Directory Structure': results.dirStructure,
    'Dependencies': results.dependencies,
    'Port Availability': results.portAvailable,
    'Database Connection': results.database,
  };

  for (const [check, passed] of Object.entries(summary)) {
    const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`  ${check.padEnd(25)} : ${status}`);
  }

  const allPassed = Object.values(results).every((v) => v === true);

  console.log('\n' + '═'.repeat(50));
  if (allPassed) {
    log('All checks passed! Ready to start server.', 'success');
    return 0;
  } else {
    log('Some checks failed. Please review the errors above.', 'error');
    return 1;
  }
}

// ============================================
// EXECUTE
// ============================================

runAllVerifications()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });
