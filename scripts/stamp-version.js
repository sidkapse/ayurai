#!/usr/bin/env node
/**
 * AyurAI Version Stamper
 * Updates the service worker cache key with a build timestamp.
 * Runs automatically before `npm run deploy` via the predeploy hook.
 *
 * Usage: node scripts/stamp-version.js
 */

const fs   = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '..', 'docs', 'sw.js');

// Format: ayurai-YYYYMMDD-HHmmss  (sortable, readable, unique per deploy)
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const cacheKey = `ayurai-${stamp}`;

let sw = fs.readFileSync(SW_PATH, 'utf8');

// Replace whatever the current CACHE key is
const updated = sw.replace(/const CACHE = 'ayurai-[^']*'/, `const CACHE = '${cacheKey}'`);

if (sw === updated) {
  console.log('⚠️  stamp-version: CACHE line not found in sw.js — nothing changed');
  process.exit(1);
}

fs.writeFileSync(SW_PATH, updated);
console.log(`✅ stamp-version: sw.js cache key → ${cacheKey}`);
