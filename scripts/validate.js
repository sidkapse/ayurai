#!/usr/bin/env node
'use strict';
const fs  = require('fs');
const path = require('path');
const os   = require('os');
const cp   = require('child_process');

const HTML_FILE = path.join(__dirname, '..', 'docs', 'index.html');
const html = fs.readFileSync(HTML_FILE, 'utf8');
const jsMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const js = jsMatch ? jsMatch[1] : '';

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { console.log('  ✅ ' + name); passed++; }
  else     { console.log('  ❌ ' + name + (detail ? ' — ' + detail : '')); failed++; }
}

console.log('\n🔍 AyurAI Validation');
console.log('  File: ' + HTML_FILE);
console.log('  Size: ' + (fs.statSync(HTML_FILE).size / 1024).toFixed(1) + ' KB\n');

// ── 1. JS Syntax ────────────────────────────────────────────────────────────
console.log('1. JS Syntax:');
const tmpJs = path.join(os.tmpdir(), 'ayurai_validate.js');
fs.writeFileSync(tmpJs, js);
try {
  cp.execSync('node --check "' + tmpJs + '"', { stdio: 'pipe' });
  check('JS syntax valid', true);
} catch(e) {
  const d = (e.stderr || '').toString().split('\n').find(l => l.includes('SyntaxError')) || '';
  check('JS syntax valid', false, d.trim());
}

// ── 2. Required Functions ───────────────────────────────────────────────────
console.log('\n2. Required Functions:');
const REQUIRED_FUNCTIONS = [
  // Core — data layer
  'loadData', 'saveData', 'getData', 'setData',
  // Core — auth
  'initApp', 'doLogin', 'doSignup', 'doLogout',
  // Core — UI helpers
  'el', 'setText', 'setHTML', 'showToast', 'showScreen', 'switchTab', 'getUserAge',
  // Core — error logging
  'logError', 'getErrorLogs', 'renderErrorLogs', 'exportErrorLogs', 'clearErrorLogs', 'sendErrorLogs',
  // Core — API wrappers
  'callOpenAI', 'callOpenAILarge', 'callOpenAIChat', 'callOpenAIChatStream',
  // Core — API error state
  'classifyApiError', 'setApiErrorState', 'buildApiErrHTML',
  // Core — onboarding
  'isFirstTimeUser', 'goToOnboardingSlide', 'skipOnboarding', 'nextOnboardingSlide',
  'replayOnboarding', 'closeOnboarding', 'initOnboardingSwipe', 'initOnboardingParticles',
  // Core — PWA & pull-to-refresh
  'initPWA', 'triggerPWAInstall', 'shareApp', 'initPullToRefresh',
  'isPWAInstalled', 'initPWABanner', 'showPWAPopup', 'dismissPWAPopup', 'hidePWAAll', 'handlePWAInstall',
  // Quiz
  'initQuiz', 'startQuiz', 'nextQuestion', 'saveStage1', 'finalizeStage2',
  'renderQuizResult', 'retakeQuiz',
  // Food check
  'checkFood', 'renderFoodResult', 'initFoodCheck', 'resetFoodCheck',
  'getRemedy', 'renderRemedyCard', 'getCuisineAlts',
  'togglePersonalisePanel', 'refineBoostersWithContext',
  // Food history & settings
  'saveFoodHistory', 'renderHistory', 'renderHomeHistory', 'clearHistory',
  'saveCity', 'saveBirthDate', 'saveGender', 'saveApiKey', 'triggerImport', 'exportJSON', 'importJSON',
  // Dosha insights
  'loadDoshaInsights', 'renderDoshaInsights',
  // Meal timing
  'initMealTiming', 'setTimingMode', 'updatePlanPreview', 'initAdvAilmentChips',
  // Herb advisor
  'initHerbAdvisor', 'getHerbsByDosha', 'getHerbsByConcern', 'getSeasonalHerbs', 'sendHerbChat',
  // Symptom checker
  'openSymptomOverlay', 'closeSymptomOverlay',
  'initSymptomChecker', 'runSymptomCheck', 'renderSymptomResult',
  // Dinacharya
  'initDinacharya', 'generateDinacharya', 'renderDinacharya', 'renderDinacharya_StartScreen',
  'stopDinaTicker',
  // Ask Anything
  'openAskAnything', 'closeAskAnything', 'sendAskMessage', 'buildAskSystemPrompt', 'renderAskStarters',
  // Herb Chat overlay
  'openHerbChatOverlay', 'closeHerbChatOverlay',
  // Food & Herbs overlays
  'openFoodOverlay', 'closeFoodOverlay', 'openHerbsOverlay', 'closeHerbsOverlay',
  // Gender-based tab icons
  'updateTabIcons',
];
REQUIRED_FUNCTIONS.forEach(fn => check(fn + '()', js.includes('function ' + fn)));

// ── 3. Required HTML IDs ────────────────────────────────────────────────────
console.log('\n3. Required HTML IDs:');
const REQUIRED_IDS = [
  // Screens
  'screen-onboarding', 'screen-login', 'screen-signup', 'screen-app',
  // Onboarding slides + particle containers
  'onboarding-slide-1', 'onboarding-slide-2', 'onboarding-slide-3',
  'onboarding-slide-4', 'onboarding-slide-5',
  'ob-particles-1', 'ob-particles-2', 'ob-particles-3', 'ob-particles-4', 'ob-particles-5',
  // Login / signup forms
  'login-email', 'login-password', 'login-error',
  'signup-name', 'signup-email', 'signup-password', 'signup-error',
  // App shell
  'app-content', 'tab-bar', 'toast', 'ptr-indicator',
  // Tab panels
  'tab-home', 'tab-food', 'tab-herbs', 'tab-dina',
  'tab-settings', 'tab-quiz', 'tab-symptom', 'tab-history',
  // Tab nav items
  'tabn-home', 'tabn-dina', 'tabn-settings',
  // Home tab
  'home-greeting', 'home-name',
  'home-dosha-badge', 'home-dosha-val', 'home-dosha-desc',
  'home-dosha-pills', 'home-dosha-insights',
  // Food tab
  'food-overlay-content',
  'food-hero', 'food-hero-chips', 'food-input', 'food-input-card',
  'food-result-area', 'food-alt-area', 'food-api-warning',
  'food-reset-btn', 'remedy-area', 'rescue-btn',
  // Meal timing widget
  'mtt-now', 'mtt-plan',
  'meal-now-time-display', 'meal-timing-now-preview',
  'meal-plan-date', 'meal-plan-hour', 'meal-plan-preview', 'meal-plan-preview-text',
  'meal-timing-plan-picker',
  // Advanced filters
  'adv-filters-btn', 'adv-filters-panel', 'adv-chevron', 'adv-ailment-chips',
  // Herb advisor
  'herbs-wrap', 'herb-mode-content', 'herb-concern-tags', 'herb-conf-fill',
  'hmode-profile', 'hmode-concern', 'hmode-seasonal', 'hmode-chat',
  'herb-chat-input', 'herb-chat-history', 'herb-send-btn', 'herb-reset-btn',
  // Symptom checker
  'symptom-wrap', 'symptom-result-area', 'symptom-desc',
  'severity-slider', 'severity-val', 'symptom-reset-btn',
  // Dinacharya
  'dina-wrap', 'dina-wake', 'dina-sleep', 'dina-refresh-btn', 'dina-symptom-chips',
  // Quiz
  'quiz-container', 'quiz-next-btn', 'quiz-city', 'quiz-birth-month', 'quiz-birth-year',
  // Settings
  'settings-name', 'settings-email', 'settings-city', 'settings-apikey',
  'settings-apikey-status', 'settings-warn-dot',
  'settings-birth-month', 'settings-birth-year', 'settings-gender',
  'settings-hero-chips', 'settings-dosha-label', 'settings-dosha-sub',
  'settings-error-log', 'settings-error-section', 'settings-export-meta',
  'import-file-input', 'send-logs-btn',
  // History
  'history-list',
  // PWA
  'pwa-install-btn', 'pwa-ios-hint', 'pwa-install-section', 'pwa-default-hint', 'pwa-installed-hint',
  // Ask Anything overlay
  'ask-overlay', 'ask-chat', 'ask-input', 'ask-dosha-chip',
  // Onboarding slide 5 CTA
  'ob-cta-desc', 'ob-cta-primary', 'ob-cta-secondary',
  // PWA install banner
  'pwa-popup', 'pwa-popup-sub', 'pwa-popup-btn', 'pwa-mini-banner',
  // Face & Hair tabs
  'tab-face', 'tab-hair', 'tabn-face', 'tabn-hair',
  'face-nav-icon', 'hair-nav-icon', 'face-placeholder-icon', 'hair-placeholder-icon',
];
REQUIRED_IDS.forEach(id => check('id="' + id + '"', html.includes('id="' + id + '"')));

// ── 4. el() Reference Check ─────────────────────────────────────────────────
console.log('\n4. el() Reference Check:');
const htmlIds = new Set();
html.replace(/id="([^"]+)"/g, (_, id) => htmlIds.add(id));
const elCalls = new Set();
js.replace(/el\('([^']+)'\)/g, (_, id) => elCalls.add(id));
const missing = Array.from(elCalls).filter(id => !htmlIds.has(id));
check(
  'All el() calls reference existing IDs (' + elCalls.size + ' checked)',
  missing.length === 0,
  missing.length ? missing.join(', ') : ''
);

// ── 5. Duplicate Function Check ─────────────────────────────────────────────
console.log('\n5. Duplicate Function Check:');
const fns = [];
js.replace(/^function\s+(\w+)/gm, (_, n) => fns.push(n));
const dupes = fns.filter((n, i) => fns.indexOf(n) !== i);
check(
  'No duplicate function declarations',
  dupes.length === 0,
  dupes.length ? Array.from(new Set(dupes)).join(', ') : ''
);

// ── 6. API Error Handling ───────────────────────────────────────────────────
console.log('\n6. API Error Handling:');
const apiCalls = (js.match(/await callOpenAI/g) || []).length;
const catches  = (js.match(/\} catch\(e\)/g)   || []).length;
check(apiCalls + ' API calls covered by ' + catches + ' catch blocks', catches >= apiCalls);

// ── 7. Error Logging ────────────────────────────────────────────────────────
console.log('\n7. Error Logging:');
const logCount = (js.match(/logError\(/g) || []).length;
check('logError() called ' + logCount + ' times across codebase', logCount >= 8);

// ── 8. Global State Declarations ────────────────────────────────────────────
console.log('\n8. Global State Declarations:');
const REQUIRED_DECLS = [
  // Constants
  'const STORAGE_KEY',
  'const APP_VERSION',
  'const ERROR_LOG_KEY',
  'const FOOD_CACHE_KEY',
  'const DINA_CACHE_KEY',
  'const API_ERR_STORAGE_KEY',
  'const COMMON_AILMENTS',
  'const DINA_DIET_PREFS',
  'const HERB_CONCERNS',
  // Mutable state
  'let currentTab',
  'let quizState',
  'let _remedyLoading',
  'let dinaCache',
  'let dinaFilterState',
  'let herbState',
  'let symptomState',
  'let askState',
  'let _deferredInstallPrompt',
];
REQUIRED_DECLS.forEach(decl => check(decl, js.includes(decl)));

// ── 9. Ask Anything Feature ─────────────────────────────────────────────────
console.log('\n9. Ask Anything Feature:');
check('ask-overlay element present',    html.includes('id="ask-overlay"'));
check('askState initialised',           js.includes("let askState = {"));
check('openAskAnything() defined',      js.includes('function openAskAnything'));
check('closeAskAnything() defined',     js.includes('function closeAskAnything'));
check('sendAskMessage() defined',       js.includes('function sendAskMessage'));
check('callOpenAIChat() defined',       js.includes('function callOpenAIChat'));
check('buildAskSystemPrompt() defined', js.includes('function buildAskSystemPrompt'));

// ── 10. PWA Feature ─────────────────────────────────────────────────────────
console.log('\n10. PWA Feature:');
check('sw.js exists',           fs.existsSync(path.join(__dirname, '..', 'docs', 'sw.js')));
check('manifest.json exists',   fs.existsSync(path.join(__dirname, '..', 'docs', 'manifest.json')));
check('serviceWorker.register in initPWA', js.includes("serviceWorker.register"));
check('_deferredInstallPrompt declared',   js.includes('let _deferredInstallPrompt'));
check('beforeinstallprompt handled',       js.includes("'beforeinstallprompt'"));

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(44));
console.log('  Passed: ' + passed + '   Failed: ' + failed);
if (failed === 0) { console.log('  All checks passed — ready to commit!\n'); process.exit(0); }
else              { console.log('  ' + failed + ' check(s) need attention\n'); process.exit(1); }
