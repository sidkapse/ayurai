#!/usr/bin/env node
/**
 * AyurAI Build Script
 * Assembles public/index.html from src/ files.
 *
 * Usage: node scripts/build.js
 *
 * Input:  src/css/main.css  +  src/html/app.html  +  src/js/*.js
 * Output: public/index.html
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const SRC    = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');

// ── JS module load order (order matters for global state) ──
const JS_MODULES = [
  'core.js',
  'quiz.js',
  'meal-timing.js',
  'food.js',
  'herbs.js',
  'symptoms.js',
  'dinacharya.js',
  'face-routine.js',
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function build() {
  console.log('🔨 Building AyurAI...\n');

  // 1. Read CSS
  const css = read(path.join(SRC, 'css', 'main.css'));
  console.log(`  ✅ CSS: ${css.split('\n').length} lines`);

  // 2. Read HTML body
  const bodyHTML = read(path.join(SRC, 'html', 'app.html'));
  console.log(`  ✅ HTML: ${bodyHTML.split('\n').length} lines`);

  // 3. Concatenate JS modules
  const jsParts = JS_MODULES.map(mod => {
    const filePath = path.join(SRC, 'js', mod);
    const content  = read(filePath);
    console.log(`  ✅ JS [${mod}]: ${content.split('\n').length} lines`);
    return `\n// ═══ MODULE: ${mod} ═══\n${content}`;
  });
  const js = jsParts.join('\n');

  // 4. Assemble full HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<title>AyurAI — Ancient Wisdom, Modern Intelligence</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
<style>
${css}
</style>
</head>
<body>
${bodyHTML}
<script>
${js}
</script>
</body>
</html>`;

  // 5. Syntax check JS before writing
  const tmpJs = path.join(require('os').tmpdir(), 'ayurai_build_check.js');
  fs.writeFileSync(tmpJs, js);
  try {
    require('child_process').execSync(`node --check "${tmpJs}"`, { stdio: 'pipe' });
    console.log('\n  ✅ JS syntax OK');
  } catch(e) {
    console.error('\n  ❌ JS SYNTAX ERROR — build aborted:\n');
    console.error(e.stderr?.toString() || e.message);
    process.exit(1);
  }

  // 6. Write output
  fs.mkdirSync(PUBLIC, { recursive: true });
  const outPath = path.join(PUBLIC, 'index.html');
  fs.writeFileSync(outPath, html);

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\n🎉 Build complete → public/index.html (${sizeKB} KB)\n`);
}

build();
