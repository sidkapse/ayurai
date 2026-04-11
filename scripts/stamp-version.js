#!/usr/bin/env node
/**
 * AyurAI Version Stamper
 * Runs automatically on every `git push` via the pre-push hook.
 *
 * What it does:
 *   1. Reads the current app version from docs/index.html
 *   2. Increments the minor version  (e.g. v1.0 → v1.1)
 *   3. Updates the version string in all 5 locations across src/ and docs/
 *   4. Bumps the SW cache key with a timestamp so users always get fresh files
 *   5. Prints a clear summary to the terminal
 *
 * Usage: node scripts/stamp-version.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FILES = {
  indexHtml:  path.join(ROOT, 'docs',   'index.html'),
  appHtml:    path.join(ROOT, 'src',    'html', 'app.html'),
  coreJs:     path.join(ROOT, 'src',    'js',   'core.js'),
  herbsJs:    path.join(ROOT, 'src',    'js',   'herbs.js'),
  swJs:       path.join(ROOT, 'docs',   'sw.js'),
};

// ── 1. Read current version from docs/index.html ──────────────────────────
const indexContent = fs.readFileSync(FILES.indexHtml, 'utf8');
const versionMatch = indexContent.match(/AyurAI v(\d+)\.(\d+)/);
if (!versionMatch) {
  console.error('❌ stamp-version: Could not find version string in docs/index.html');
  process.exit(1);
}

const major = parseInt(versionMatch[1], 10);
const minor = parseInt(versionMatch[2], 10);
const oldVersion = `${major}.${minor}`;
const newVersion = `${major}.${minor + 1}`;

// ── 2. Build replacement pairs ────────────────────────────────────────────
const replacements = [
  { pattern: `AyurAI v${oldVersion}`,          replacement: `AyurAI v${newVersion}`          },
  { pattern: `app_version: '${oldVersion}'`,   replacement: `app_version: '${newVersion}'`   },
  { pattern: `APP_VERSION = '${oldVersion}'`,  replacement: `APP_VERSION = '${newVersion}'`  },
];

// ── 3. Update all version-bearing files ──────────────────────────────────
const versionFiles = [FILES.indexHtml, FILES.appHtml, FILES.coreJs, FILES.herbsJs];

versionFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  replacements.forEach(({ pattern, replacement }) => {
    if (content.includes(pattern)) {
      content = content.split(pattern).join(replacement);
      changed = true;
    }
  });
  if (changed) fs.writeFileSync(filePath, content);
});

// ── 4. Bump SW cache key ─────────────────────────────────────────────────
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const cacheKey = `ayurai-${stamp}`;

let sw = fs.readFileSync(FILES.swJs, 'utf8');
const swUpdated = sw.replace(/const CACHE = 'ayurai-[^']*'/, `const CACHE = '${cacheKey}'`);
if (sw === swUpdated) {
  console.error('⚠️  stamp-version: CACHE line not found in sw.js');
  process.exit(1);
}
fs.writeFileSync(FILES.swJs, swUpdated);

// ── 5. Print summary ─────────────────────────────────────────────────────
console.log('');
console.log('┌─────────────────────────────────────────────┐');
console.log(`│  🌿 AyurAI — Pre-push version stamp          │`);
console.log('├─────────────────────────────────────────────┤');
console.log(`│  App version : v${oldVersion}  →  v${newVersion}                  │`);
console.log(`│  SW cache    : ${cacheKey}        │`);
console.log('└─────────────────────────────────────────────┘');
console.log('');
