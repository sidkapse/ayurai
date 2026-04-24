// ── DATA LAYER (localStorage as my_info.json equivalent) ──
const STORAGE_KEY = 'ayurai_my_info';
const APP_VERSION = '1.89'; // kept in sync by pre-push hook (scripts/stamp-version.js)
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
}
// ── ERROR LOGGER ──
const ERROR_LOG_KEY = 'ayurai_error_log';
const MAX_ERRORS = 5;

function logError(context, error) {
  try {
    const logs = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    logs.unshift({
      ts: new Date().toISOString(),
      ctx: context,
      msg: error?.message || String(error),
      stack: error?.stack?.split('\n')[1]?.trim() || ''
    });
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs.slice(0, MAX_ERRORS)));
  } catch {}
}

function getErrorLogs() {
  try { return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]'); }
  catch { return []; }
}

function clearErrorLogs() {
  localStorage.removeItem(ERROR_LOG_KEY);
  renderErrorLogs();
  showToast('Error logs cleared');
}

function exportErrorLogs() {
  const logs = getErrorLogs();
  if(!logs.length) { showToast('No errors to export'); return; }
  const d = loadData();
  const username = (d.user?.name||'user').toLowerCase().replace(/\s+/g,'_');
  const payload = {
    exported_at: new Date().toISOString(),
    user: username,
    app_version: APP_VERSION,
    error_count: logs.length,
    errors: logs
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${username}_error_logs.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${username}_error_logs.json`);
}

// Global unhandled error catch
window.addEventListener('error', e => logError('Uncaught', e.error || e.message));
window.addEventListener('unhandledrejection', e => logError('Promise', e.reason));

// ── SAFE ELEMENT HELPER ──
// Returns null silently instead of throwing if element missing
function el(id) {
  return document.getElementById(id);
}

// Safe text set — no crash if element removed
function setText(id, text) {
  const e = el(id); if(e) e.textContent = text;
}
function setHTML(id, html) {
  const e = el(id); if(e) e.innerHTML = html;
}

function getData(path, fallback = null) {
  const d = loadData();
  return path.split('.').reduce((o,k) => (o && o[k] !== undefined ? o[k] : fallback), d);
}
function setData(path, value) {
  const d = loadData();
  const keys = path.split('.');
  let o = d;
  keys.slice(0,-1).forEach(k => { if(!o[k]) o[k]={}; o=o[k]; });
  o[keys[keys.length-1]] = value;
  saveData(d);
}

function getUserAge() {
  const d = loadData();
  if(!d.birth_year) return null;
  const now = new Date();
  let age = now.getFullYear() - d.birth_year;
  if(d.birth_month && (now.getMonth() + 1) < d.birth_month) age--;
  return age;
}

function buildDoshaRules(dosha) {
  const rules = {
    Pitta: 'Pitta rules: avoid highly acidic/sour foods (lemon, vinegar, tamarind, fermented items), very spicy/hot foods, and excess salt. Sweet fruits in moderation (ripe mango, ripe pineapple, melons) are generally fine. Prioritise cooling, sweet, and bitter foods. Cooling herbs: mint, coriander, fennel.',
    Vata:  'Vata rules: avoid cold, raw, dry, or light foods. Prioritise warm, oily, moist, grounding foods. Warm water or ginger tea preferred. Cooked vegetables over raw.',
    Kapha: 'Kapha rules: avoid cold, heavy, oily, or very sweet foods. Prioritise warm, light, dry, spiced foods. Warm water with ginger or honey. Limit dairy and fried foods.'
  };
  return rules[dosha] || rules['Vata'];
}

// ── SCREENS ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── AUTH ──
function doSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-password').value;
  const recovery = String(document.getElementById('signup-recovery').value).trim();
  const err = document.getElementById('signup-error');
  err.style.display='none';
  if(!name || !email || !pass) { err.textContent='Please fill in all fields.'; err.style.display='block'; return; }
  if(pass.length < 6) { err.textContent='Password must be at least 6 characters.'; err.style.display='block'; return; }
  if(!/^\d{4}$/.test(recovery)) { err.textContent='Enter a valid 4-digit recovery code.'; err.style.display='block'; return; }
  const data = {
    user: { name, email, password: pass, recoveryCode: recovery, createdAt: new Date().toISOString() },
    dosha: null, ailments: [], city: '', gender: '', foodHistory: [],
    settings: { openaiApiKey: '' },
    meta: { appVersion: '1.0', lastLogin: new Date().toISOString() }
  };
  saveData(data);
  showToast('Account created! Welcome to AyurAI 🌸');
  initApp();
  showScreen('screen-app');
  switchTab('quiz');
}

function handleCreateAccount() {
  const d = loadData();
  if(d.user) {
    showModal('modal-account-exists');
  } else {
    showScreen('screen-signup');
  }
}

function showModal(id) {
  const m = el(id);
  m.style.display = 'flex';
  requestAnimationFrame(() => m.classList.add('open'));
}

function closeModal(id) {
  const m = el(id);
  m.classList.remove('open');
  m.addEventListener('transitionend', () => { m.style.display = 'none'; }, { once: true });
}

function eraseAndStartFresh() {
  localStorage.removeItem(STORAGE_KEY);
  const me = el('modal-account-exists');
  if(me) { me.classList.remove('open'); me.style.display = 'none'; }
  const mf = el('modal-forgot-password');
  if(mf) { mf.classList.remove('open'); mf.style.display = 'none'; }
  showScreen('screen-signup');
  showToast('Account erased. Create a new one below.');
}

function showForgotPassword() {
  el('recovery-code-input').value = '';
  el('recovery-error').style.display = 'none';
  el('new-password-section').style.display = 'none';
  showModal('modal-forgot-password');
}

function verifyRecoveryCode() {
  const code = el('recovery-code-input').value.trim();
  const d = loadData();
  const errEl = el('recovery-error');
  if(!d.user || !d.user.recoveryCode) {
    errEl.textContent = 'No recovery code was set. Use "Clear data and start fresh" below.';
    errEl.style.display = 'block';
    return;
  }
  if(String(d.user.recoveryCode) !== code) {
    errEl.textContent = 'Incorrect recovery code.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  el('new-password-section').style.display = 'block';
}

function renderRecoveryCodeSettings() {
  const body = el('settings-recovery-body');
  if(!body) return;
  const d = loadData();
  if(d.user && d.user.recoveryCode) {
    body.innerHTML = `
      <div class="settings-row-label">Recovery Code</div>
      <div class="settings-row-sub" style="display:flex;align-items:center;gap:6px;">
        <span class="mi" style="font-size:15px;color:#4A7C59;">check_circle</span>
        Recovery code is set
      </div>
      <button class="settings-action-btn" onclick="showChangeRecoveryCode()" style="margin-top:12px;">
        <span class="mi" style="font-size:15px;">edit</span> Change Recovery Code
      </button>
      <div id="settings-recovery-change" style="display:none;margin-top:14px;">
        <div class="error-msg" id="settings-recovery-error" style="display:none;"></div>
        <div class="form-group" style="margin-bottom:10px;">
          <label>New 4-digit Recovery Code</label>
          <input type="number" id="settings-recovery-input" class="settings-input" placeholder="Enter new code" min="1000" max="9999"/>
        </div>
        <button class="settings-save-btn" onclick="saveRecoveryCodeSettings()"><span class="mi" style="font-size:15px;">check</span> Save</button>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="settings-row-label">Recovery Code</div>
      <div class="settings-row-sub">Set a 4-digit code to recover your password if you forget it.</div>
      <div class="error-msg" id="settings-recovery-error" style="display:none;margin-top:10px;"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <input type="number" id="settings-recovery-input" class="settings-input" placeholder="4-digit code" min="1000" max="9999" style="flex:1;"/>
        <button class="settings-save-btn" onclick="saveRecoveryCodeSettings()"><span class="mi" style="font-size:15px;">check</span> Save</button>
      </div>`;
  }
}

function showChangeRecoveryCode() {
  const section = el('settings-recovery-change');
  if(section) section.style.display = 'block';
}

function saveRecoveryCodeSettings() {
  const input = el('settings-recovery-input');
  const errEl = el('settings-recovery-error');
  const code = String(input ? input.value : '').trim();
  if(errEl) errEl.style.display = 'none';
  if(!/^\d{4}$/.test(code)) {
    if(errEl) { errEl.textContent = 'Enter a valid 4-digit code.'; errEl.style.display = 'block'; }
    return;
  }
  const d = loadData();
  d.user.recoveryCode = code;
  saveData(d);
  showToast('Recovery code saved.');
  renderRecoveryCodeSettings();
}

function doPasswordReset() {
  const newPass = el('new-password-input').value;
  const errEl = el('recovery-error');
  if(newPass.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }
  const d = loadData();
  d.user.password = newPass;
  saveData(d);
  closeModal('modal-forgot-password');
  showToast('Password updated. Please sign in.');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.style.display='none';
  const data = loadData();
  if(!data.user) { err.textContent='No account found. Please sign up first.'; err.style.display='block'; return; }
  if(data.user.email !== email || data.user.password !== pass) {
    err.textContent='Incorrect email or password.'; err.style.display='block'; return;
  }
  setData('meta.lastLogin', new Date().toISOString());
  showToast('Welcome back, ' + data.user.name.split(' ')[0] + '! 🙏');
  initApp();
  showScreen('screen-app');
}

function doLogout() {
  showScreen('screen-login');
  document.getElementById('login-email').value='';
  document.getElementById('login-password').value='';
  const err = document.getElementById('login-error');
  if(err) { err.style.display='none'; err.textContent=''; }
  showToast('Signed out. Namaste 🙏');
}

// ── APP INIT ──
function initApp() {
  const d = loadData();
  if(!d.user) return;
  // Greet
  const hr = new Date().getHours();
  const greet = hr<12?'Good Morning':hr<17?'Good Afternoon':'Good Evening';
  el('home-greeting').textContent = greet;
  el('home-name').textContent = d.user.name;
  // Settings
  el('settings-name').textContent = d.user.name;
  el('settings-email').textContent = d.user.email;
  el('settings-city').value = d.city || '';
  if(el('settings-birth-month')) el('settings-birth-month').value = d.birth_month || '';
  if(el('settings-birth-year'))  el('settings-birth-year').value  = d.birth_year  || '';
  if(el('settings-gender'))      el('settings-gender').value      = d.gender       || '';
  updateTabIcons();
  el('settings-apikey').value = d.settings?.openaiApiKey || '';
  // Dosha badge + card
  if(d.dosha) {
    el('home-dosha-badge').innerHTML = `<span class="mio" style="font-size:14px;vertical-align:-2px;">spa</span> ${d.dosha.primary} Dominant`;
    el('home-dosha-val').textContent = d.dosha.primary;
    el('home-dosha-desc').textContent = d.dosha.description || '';
    const pills = el('home-dosha-pills');
    pills.innerHTML = '';
    if(d.dosha.scores) {
      ['Vata','Pitta','Kapha'].forEach(name=>{
        const pill=document.createElement('span');
        pill.className=`dosha-pill pill-${name.toLowerCase()}`;
        pill.textContent=`${name}: ${d.dosha.scores[name]||0}%`;
        pills.appendChild(pill);
      });
    }
    // Load or fetch dosha insights
    loadDoshaInsights(d);
  }
  // Food hero chips
  const foodChips = el('food-hero-chips');
  if(foodChips) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const month = now.toLocaleString('default',{month:'short'});
    foodChips.innerHTML = `
      <div class="food-hero-chip"><span class="mio" style="font-size:13px;vertical-align:-1px;">spa</span> ${d.dosha?.primary||'Take Quiz'} Dosha</div>
      <div class="food-hero-chip"><span class="mi" style="font-size:13px;vertical-align:-1px;">location_on</span> ${d.city||'Set city'}</div>
      <div class="food-hero-chip"><span class="mi" style="font-size:13px;vertical-align:-1px;">schedule</span> ${timeStr} · ${month}</div>
    `;
  }
  // Settings hero chips
  const shc = el('settings-hero-chips');
  if(shc && d.dosha) {
    shc.innerHTML = `
      <div class="settings-hero-chip"><span class="mio" style="font-size:12px;vertical-align:-1px;">spa</span> ${d.dosha.primary}</div>
      <div class="settings-hero-chip"><span class="mi" style="font-size:12px;vertical-align:-1px;">location_on</span> ${d.city||'No city set'}</div>
      <div class="settings-hero-chip"><span class="mi" style="font-size:12px;vertical-align:-1px;">key</span> ${d.settings?.openaiApiKey?'API Key set':'No API key'}</div>`;
  }
  // Settings dosha label
  if(d.dosha) {
    setText('settings-dosha-label', d.dosha.primary + ' Dosha · Stage ' + (d.dosha.stage||1));
    setText('settings-dosha-sub', d.dosha.description?.substring(0,80)+'…' || '');
  }
  // Export meta
  const expMeta = el('settings-export-meta');
  if(expMeta && d._export_meta) {
    expMeta.textContent = `Last exported ${new Date(d._export_meta.exported_at).toLocaleDateString()}`;
  }
  // Error logs
  renderErrorLogs();
  // Restore API error warning dot if previous error was recorded
  const storedErrType = localStorage.getItem(API_ERR_STORAGE_KEY);
  if(storedErrType) setApiErrorState(true, storedErrType === '1' ? 'unknown' : storedErrType);
  const noKey = !d.settings?.openaiApiKey;
  el('food-api-warning').style.display = noKey ? 'block' : 'none';
  // Recent checks
  renderHomeHistory();
  renderHistory();
  // Init quiz
  initQuiz();
  // Restore tab after pull-to-refresh reload
  const _reloadTab = sessionStorage.getItem('ayurai_reload_tab');
  if (_reloadTab) {
    sessionStorage.removeItem('ayurai_reload_tab');
    switchTab(_reloadTab);
  }
}

// ── TABS ──
let currentTab = 'home';
function switchTab(name) {
  if(name !== 'dina') stopDinaTicker();
  document.querySelectorAll('.tab-panel').forEach(p=>p.style.display='none');
  document.querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active'));
  el('tab-'+name).style.display='block';
  const tabNav = el('tabn-'+name);
  if(tabNav) tabNav.classList.add('active');
  currentTab = name;
  el('app-content').scrollTop = 0;
  if(name==='history') renderHistory();
  if(name==='symptom') initSymptomChecker();
  if(name==='dina') initDinacharya();
  if(name==='face') {}
  if(name==='hair') {}
  if(name==='settings') { renderErrorLogs(); setApiErrorState(false); renderRecoveryCodeSettings(); }
}

function updateTabIcons() {
  const female = loadData().gender === 'female';
  const faceIcon = female ? 'face' : 'face_6';
  const hairIcon = female ? 'face_2' : 'face_retouching_natural';
  if(el('face-nav-icon')) el('face-nav-icon').textContent = faceIcon;
  if(el('hair-nav-icon')) el('hair-nav-icon').textContent = hairIcon;
  if(el('face-placeholder-icon')) el('face-placeholder-icon').textContent = faceIcon;
  if(el('hair-placeholder-icon')) el('hair-placeholder-icon').textContent = hairIcon;
}

// ── ONBOARDING ──
let _obSlide = 1;
let _obParticlesInit = false;
let _obSwipeInit = false;
let _obOrigin = null; // 'home' | 'settings' | null (first-time user)

function isFirstTimeUser() {
  const d = loadData();
  return !d.user;
}

function initOnboardingParticles() {
  if(_obParticlesInit) return;
  _obParticlesInit = true;
  for(let s = 1; s <= 5; s++) {
    const container = el('ob-particles-' + s);
    if(!container) continue;
    for(let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'ob-particle';
      const size = Math.random() * 14 + 4;
      p.style.cssText =
        'width:' + size + 'px;' +
        'height:' + size + 'px;' +
        'left:' + (Math.random() * 100) + '%;' +
        'bottom:' + (Math.random() * 70) + '%;' +
        'animation-duration:' + (4 + Math.random() * 7) + 's;' +
        'animation-delay:' + (Math.random() * 6) + 's;';
      container.appendChild(p);
    }
  }
}

function goToOnboardingSlide(n) {
  const prev = el('onboarding-slide-' + _obSlide);
  if(prev) prev.classList.remove('active');
  _obSlide = n;
  const next = el('onboarding-slide-' + _obSlide);
  if(next) next.classList.add('active');
}

function skipOnboarding() {
  if (_obOrigin) { closeOnboarding(); } else { goToOnboardingSlide(5); }
}

function closeOnboarding() {
  showScreen('screen-app');
  if (_obOrigin) switchTab(_obOrigin);
  _obOrigin = null;
}

function replayOnboarding(origin) {
  _obOrigin = origin || null;
  _obSlide = 1;
  _obParticlesInit = false;
  showScreen('screen-onboarding');
  goToOnboardingSlide(1);
  setTimeout(initOnboardingParticles, 50);
  initOnboardingSwipe();
  const label = _obOrigin ? 'Close' : 'Skip';
  document.querySelectorAll('.ob-skip-btn').forEach(btn => btn.textContent = label);
  const ctaDesc = el('ob-cta-desc');
  const ctaPrimary = el('ob-cta-primary');
  const ctaSecondary = el('ob-cta-secondary');
  if (_obOrigin && ctaDesc && ctaPrimary && ctaSecondary) {
    ctaDesc.textContent = "You're all set! Head back to explore all features.";
    ctaPrimary.textContent = 'Return to App';
    ctaPrimary.onclick = closeOnboarding;
    ctaSecondary.style.display = 'none';
  } else if (ctaDesc && ctaPrimary && ctaSecondary) {
    ctaDesc.textContent = "Create your free account to unlock your personalised Ayurvedic experience.";
    ctaPrimary.textContent = 'Create Account';
    ctaPrimary.onclick = () => showScreen('screen-signup');
    ctaSecondary.style.display = '';
  }
}

function nextOnboardingSlide() {
  if(_obSlide < 5) goToOnboardingSlide(_obSlide + 1);
}

function initOnboardingSwipe() {
  if(_obSwipeInit) return; // listeners already attached — don't stack duplicates
  _obSwipeInit = true;
  const screen = el('screen-onboarding');
  if(!screen) return;
  let _touchStartX = 0;
  let _touchStartY = 0;
  screen.addEventListener('touchstart', e => {
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
  }, {passive:true});
  screen.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _touchStartX;
    const dy = e.changedTouches[0].clientY - _touchStartY;
    if(Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if(dx < 0 && _obSlide < 5) goToOnboardingSlide(_obSlide + 1);
    else if(dx > 0 && _obSlide > 1) goToOnboardingSlide(_obSlide - 1);
  }, {passive:true});
}

// ── PULL TO REFRESH ──
function _refreshCurrentTab() {
  sessionStorage.setItem('ayurai_reload_tab', currentTab);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(reg => reg.update())
      .catch(() => {})
      .finally(() => window.location.reload());
  } else {
    window.location.reload();
  }
}

function initPullToRefresh() {
  const indicator = el('ptr-indicator');
  if(!indicator) return;
  // Two #app-content elements exist (login + main app). Use the indicator's
  // parent to guarantee we attach to the correct visible scroller.
  const scroller = indicator.parentElement;
  if(!scroller) return;
  const THRESHOLD = 65;
  let _ptrStartY = 0;
  let _ptrActive = false;
  let _ptrTriggered = false;
  scroller.addEventListener('touchstart', e => {
    if(scroller.scrollTop !== 0) return;
    _ptrStartY = e.touches[0].clientY;
    _ptrActive = true;
    _ptrTriggered = false;
  }, {passive:true});
  scroller.addEventListener('touchmove', e => {
    if(!_ptrActive) return;
    const dy = e.touches[0].clientY - _ptrStartY;
    if(dy <= 0) { _ptrActive = false; return; }
    if(dy > 10) indicator.classList.add('ptr-visible');
    if(dy >= THRESHOLD && !_ptrTriggered) {
      _ptrTriggered = true;
      indicator.classList.add('ptr-spinning');
    }
  }, {passive:true});
  scroller.addEventListener('touchend', () => {
    if(!_ptrActive) return;
    _ptrActive = false;
    if(_ptrTriggered) {
      _refreshCurrentTab();
      showToast('Refreshed');
      setTimeout(() => indicator.classList.remove('ptr-visible','ptr-spinning'), 600);
    } else {
      indicator.classList.remove('ptr-visible','ptr-spinning');
    }
    _ptrTriggered = false;
  }, {passive:true});
}

// ── PWA ──
let _deferredInstallPrompt = null;
const PWA_BANNER_KEY = 'ayurai_pwa_banner';

function _showInstalledState() {
  const defaultHint = el('pwa-default-hint');
  if(defaultHint) defaultHint.style.display = 'none';
  const installBtn = el('pwa-install-btn');
  if(installBtn) installBtn.style.display = 'none';
  const iosHint = el('pwa-ios-hint');
  if(iosHint) iosHint.style.display = 'none';
  const installedHint = el('pwa-installed-hint');
  if(installedHint) installedHint.style.display = 'flex';
}

function initPWA() {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => logError('sw', e));
  }
  // Already running as installed PWA — show installed confirmation
  if(window.matchMedia('(display-mode: standalone)').matches) {
    _showInstalledState();
  }
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredInstallPrompt = e;
    const btn = el('pwa-install-btn');
    if(btn) btn.style.display = 'flex';
    const defaultHint = el('pwa-default-hint');
    if(defaultHint) defaultHint.style.display = 'none';
    initPWABanner(); // Only show banner when browser confirms app is installable
  });
  window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    _showInstalledState();
    hidePWAAll();
    showToast('AyurAI installed! 🎉');
  });
  window.addEventListener('offline', () => showToast('You\'re offline — AI features unavailable'));
  window.addEventListener('online',  () => showToast('Back online'));
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if(isIOS && !isStandalone) {
    const hint = el('pwa-ios-hint');
    if(hint) hint.style.display = 'flex';
    const defaultHint = el('pwa-default-hint');
    if(defaultHint) defaultHint.style.display = 'none';
    initPWABanner(); // iOS has no beforeinstallprompt — show banner directly
  }
}

function triggerPWAInstall() {
  if(_deferredInstallPrompt) {
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(() => { _deferredInstallPrompt = null; });
  }
}

function shareApp() {
  const url = 'https://sidkapse.github.io/ayurai/';
  const title = 'AyurAI \u2014 Ancient Wisdom, Modern Intelligence';
  const text = 'Discover your Ayurvedic dosha, check foods, get herb advice, and build healthy daily routines.';
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied to clipboard!'))
      .catch(() => showToast('Share: ' + url));
  }
}

function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

function initPWABanner() {
  if (isPWAInstalled()) return;
  const today = new Date().toISOString().slice(0, 10);
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(PWA_BANNER_KEY) || '{}'); } catch {}
  if (stored.popupDate === today) {
    const banner = el('pwa-mini-banner');
    if (banner) {
      banner.style.display = 'flex';
      requestAnimationFrame(() => banner.classList.add('open'));
      document.body.classList.add('has-pwa-banner');
    }
  } else {
    showPWAPopup();
  }
}

function showPWAPopup() {
  const popup = el('pwa-popup');
  if (!popup) return;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    const btn = el('pwa-popup-btn');
    if (btn) btn.textContent = 'How to Install';
    const sub = el('pwa-popup-sub');
    if (sub) sub.textContent = 'Tap Share → "Add to Home Screen" for a better experience';
  }
  popup.style.display = 'flex';
  document.body.classList.add('has-pwa-popup');
  requestAnimationFrame(() => popup.classList.add('open'));
}

function dismissPWAPopup() {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(PWA_BANNER_KEY, JSON.stringify({ popupDate: today }));
  const popup = el('pwa-popup');
  if (popup) {
    popup.classList.remove('open');
    popup.addEventListener('transitionend', () => { popup.style.display = 'none'; }, { once: true });
    document.body.classList.remove('has-pwa-popup');
  }
  const banner = el('pwa-mini-banner');
  if (banner) {
    banner.style.display = 'flex';
    requestAnimationFrame(() => banner.classList.add('open'));
    document.body.classList.add('has-pwa-banner');
  }
}

function hidePWAAll() {
  localStorage.removeItem(PWA_BANNER_KEY);
  document.body.classList.remove('has-pwa-popup', 'has-pwa-banner');
  const popup = el('pwa-popup');
  if (popup) { popup.classList.remove('open'); popup.style.display = 'none'; }
  const banner = el('pwa-mini-banner');
  if (banner) { banner.classList.remove('open'); banner.style.display = 'none'; }
}

function handlePWAInstall() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    dismissPWAPopup();
    showScreen('screen-app');
    switchTab('settings');
  } else {
    triggerPWAInstall();
  }
}

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const t = el('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer);