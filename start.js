#!/usr/bin/env node

/**
 * Launch script pour démarrer backend + frontend en parallèle
 * Maintient les deux serveurs stables et tue les anciens processes
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 AKIG Platform Startup Script');
console.log('================================\n');

// Kill any existing node processes on ports 3000/4000
function killExistingProcesses() {
  console.log('Cleaning up existing processes...');
  if (process.platform === 'win32') {
    require('child_process').execSync('taskkill /F /FI "IMAGENAME eq node.exe" 2>nul', { stdio: 'ignore' });
  } else {
    require('child_process').execSync('pkill -f "node" 2>/dev/null', { stdio: 'ignore' });
  }
  console.log('✅ Cleaned up\n');
}

function startBackend() {
  return new Promise((resolve) => {
    console.log('📡 Starting Backend on port 4000...');
    const backend = spawn('node', ['src/index.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit'
    });

    backend.on('error', (err) => {
      console.error('❌ Backend error:', err.message);
    });

    // Wait a bit for backend to start
    setTimeout(() => resolve(backend), 2000);
  });
}

function startFrontend() {
  return new Promise((resolve) => {
    console.log('\n🎨 Starting Frontend on port 3000...');
    const env = { ...process.env, BROWSER: 'none' };
    const frontend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit',
      env
    });

    frontend.on('error', (err) => {
      console.error('❌ Frontend error:', err.message);
    });

    setTimeout(() => resolve(frontend), 3000);
  });
}

async function main() {
  killExistingProcesses();

  try {
    const backend = await startBackend();
    const frontend = await startFrontend();

    console.log('\n✅ Both servers running!');
    console.log('Backend:  http://localhost:4000/api');
    console.log('Frontend: http://localhost:3000\n');

    // Keep processes alive
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
  } catch (err) {
    console.error('Error starting servers:', err);
    process.exit(1);
  }
}

main();
