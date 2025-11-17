#!/usr/bin/env node
/**
 * AKIG Monorepo Bundler: Concatenate the entire project into a single text file.
 * - Skips binaries and heavy build artifacts
 * - Adds clear file boundaries and language hints
 * - Works on Windows/Unix without extra deps
 *
 * Usage (Windows PowerShell):
 *   node .\scripts\bundle-all.js --root "c:\\AKIG\\AKIG-v3" --out "c:\\AKIG\\AKIG-v3\\AKIG_ALL_IN_ONE.txt"
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { root: process.cwd(), out: path.resolve(process.cwd(), 'AKIG_ALL_IN_ONE.txt'), includeBinaries: false };
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    const v = args[i + 1];
    if (k === '--root' && v) { out.root = path.resolve(v); i++; }
    else if (k === '--out' && v) { out.out = path.resolve(v); i++; }
    else if (k === '--include-binaries') { out.includeBinaries = true; }
  }
  return out;
}

const IGNORE_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.cache', '.vercel', '.vscode', 'out', 'tmp', 'logs'
]);

const IGNORE_EXT = new Set([
  // binaries & media
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.bmp', '.webp', '.mp4', '.mp3', '.wav', '.ogg',
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar', '.exe', '.dll', '.bin', '.wasm', '.class', '.so', '.dylib',
  '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.psd', '.ai',
  // maps & large generated
  '.map'
]);

const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024; // 5MB safety cap per file (still big)

function isProbablyBinary(filePath, stat) {
  // Quick extension check first
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORE_EXT.has(ext)) return true;
  if (stat.size === 0) return false;
  try {
    const fd = fs.openSync(filePath, 'r');
    const len = Math.min(8000, stat.size);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, 0);
    fs.closeSync(fd);
    // Heuristic: presence of many zero bytes or non-text range
    let zeros = 0, high = 0;
    for (let i = 0; i < buf.length; i++) {
      const c = buf[i];
      if (c === 0) zeros++;
      if (c > 127) high++;
    }
    if (zeros > 0) return true;
    // If more than 30% high-ascii, likely binary (not always true, but ok)
    if (high / buf.length > 0.3) return true;
  } catch {
    return true;
  }
  return false;
}

function languageHint(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts': return 'ts';
    case '.tsx': return 'tsx';
    case '.js': return 'js';
    case '.jsx': return 'jsx';
    case '.json': return 'json';
    case '.md': return 'md';
    case '.yaml':
    case '.yml': return 'yaml';
    case '.prisma': return 'prisma';
    case '.sql': return 'sql';
    case '.ps1': return 'powershell';
    case '.sh': return 'bash';
    case '.env': return 'bash';
    case '.html': return 'html';
    case '.css': return 'css';
    default: return '';
  }
}

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function human(n) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let u = 0;
  let x = n;
  while (x >= 1024 && u < units.length - 1) { x /= 1024; u++; }
  return `${x.toFixed(2)} ${units[u]}`;
}

async function main() {
  const { root, out, includeBinaries } = parseArgs();
  const start = Date.now();
  const outDir = path.dirname(out);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFd = fs.openSync(out, 'w');
  const header = `AKIG Consolidated Bundle\nRoot: ${root}\nGenerated: ${new Date().toISOString()}\n\n`;
  fs.writeFileSync(outFd, header);

  let files = 0, skipped = 0, bytes = 0;

  for (const filePath of walk(root)) {
    const rel = path.relative(root, filePath).replace(/\\/g, '/');
    let stat;
    try { stat = fs.statSync(filePath); } catch { continue; }

    if (!includeBinaries && isProbablyBinary(filePath, stat)) { skipped++; continue; }
    if (stat.size > MAX_SINGLE_FILE_BYTES) {
      // Too big: write a stub
      const stub = `===== FILE START: ${rel} (SKIPPED: ${human(stat.size)} exceeds ${human(MAX_SINGLE_FILE_BYTES)}) =====\n\n`; 
      fs.writeFileSync(outFd, stub);
      skipped++;
      continue;
    }

    const lang = languageHint(filePath);
    const bannerTop = `===== FILE START: ${rel} | size=${human(stat.size)} =====\n`;
    const fenceOpen = lang ? `\n\n\u0060\u0060\u0060${lang}\n` : `\n\n\u0060\u0060\u0060\n`;
    fs.writeFileSync(outFd, bannerTop);
    fs.writeFileSync(outFd, fenceOpen);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(outFd, content);
      bytes += Buffer.byteLength(content, 'utf8');
    } catch (e) {
      // Fallback: mark as unreadable
      const msg = `/* ERROR: Unable to read file: ${e && e.message ? e.message : 'unknown'} */\n`;
      fs.writeFileSync(outFd, msg);
      skipped++;
    }

    const fenceClose = `\n\u0060\u0060\u0060\n`;
    const bannerBot = `===== FILE END: ${rel} =====\n\n`;
    fs.writeFileSync(outFd, fenceClose);
    fs.writeFileSync(outFd, bannerBot);

    files++;
  }

  fs.closeSync(outFd);
  const ms = Date.now() - start;
  console.log(JSON.stringify({ root, out, files, skipped, bytes, durationMs: ms }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
