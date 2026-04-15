  if(!symptomState.duration) { showToast('Please select how long you\'ve had this'); return; }

  const d = loadData();
  if(!d.settings?.openaiApiKey) { showToast('Please add your OpenAI API key in Settings first'); return; }
  symptomState.description = desc;

  const resultArea = el('symptom-result-area');
  resultArea.innerHTML = `
    <div class="loading-card">
      <span style="display:block;margin-bottom:16px;animation:floatLotus 2.5s ease-in-out infinite;">
        <span class="mio" style="font-size:48px;color:#4A2060;">personal_injury</span>
      </span>
      <div class="loading-title">Analysing Your Symptoms</div>
      <div class="loading-sub">Cross-referencing Ayurvedic Nidana (diagnosis)…</div>
      <div class="loading-bar-track"><div class="loading-bar-fill" style="animation-duration:4.5s;"></div></div>
      <div class="loading-steps">
        <div class="loading-step active" id="ss1"><div class="ls-icon"><span class="mi" style="font-size:15px;">manage_search</span></div>Reading symptom patterns</div>
        <div class="loading-step" id="ss2"><div class="ls-icon"><span class="mio" style="font-size:15px;">spa</span></div>Mapping to dosha imbalances</div>
        <div class="loading-step" id="ss3"><div class="ls-icon"><span class="mio" style="font-size:15px;">biotech</span></div>Identifying root causes</div>
        <div class="loading-step" id="ss4"><div class="ls-icon"><span class="mi" style="font-size:15px;">healing</span></div>Preparing remedies &amp; actions</div>
      </div>
    </div>`;

  ['ss1','ss2','ss3','ss4'].forEach((id,i)=>{
    setTimeout(()=>{
      if(i>0){const prev=el(['ss1','ss2','ss3','ss4'][i-1]);if(prev){prev.classList.remove('active');prev.classList.add('done');prev.querySelector('.ls-icon').innerHTML='<span class="mi" style="font-size:15px;color:white;">check</span>';}}
      const cur=el(id);if(cur)cur.classList.add('active');
    },i*900);
  });

  const areas = symptomState.selectedAreas.map(id=>BODY_AREAS.find(a=>a.id===id)?.label||id).join(', ');
  const now = new Date();
  const month = now.toLocaleString('default',{month:'long'});
  const time = now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const age = getUserAge();

  const prompt = `You are a senior Ayurvedic physician (Vaidya) with 30 years of clinical experience. Perform a thorough Ayurvedic Nidana (diagnostic) analysis.

Patient Profile:
- Primary Dosha: ${d.dosha?.primary||'Unknown'} (Vata ${d.dosha?.scores?.Vata||0}%, Pitta ${d.dosha?.scores?.Pitta||0}%, Kapha ${d.dosha?.scores?.Kapha||0}%)
- Age: ${age ? age + ' years' : 'unknown'}
- Known ailments: ${d.ailments?.join(', ')||'None'}
- City: ${d.city||'Unknown'}, Month: ${month}, Time: ${time}

Symptom Report:
- Affected areas: ${areas}
- Duration: ${symptomState.duration}
- Severity: ${symptomState.severity}/10
- Description: "${desc}"

Consider seasonal influence (infer season from city+month) and dosha time-clock (Vata 2–6am/pm, Pitta 10–2, Kapha 6–10).

Respond ONLY in this exact JSON (no markdown):
{
  "condition_name": "Ayurvedic name (e.g. Amlapitta, Vata Vyadhi)",
  "condition_modern": "Modern medical equivalent or closest term",
  "primary_dosha_imbalance": ["Vata"|"Pitta"|"Kapha"],
  "severity_assessment": "Mild"|"Moderate"|"Severe",
  "root_causes": [
    {"cause": "Title", "explanation": "2-sentence Ayurvedic explanation"}
  ],
  "immediate_actions": [
    {"timing": "Immediate"|"Daily"|"Ongoing", "action": "Title", "detail": "Exact how-to with quantity/timing"}
  ],
  "foods_to_eat": ["food1","food2","food3","food4","food5"],
  "foods_to_avoid": ["food1","food2","food3","food4"],
  "herbs_recommended": [
    {"name": "Herb name", "how": "Form, dose, timing"}
  ],
  "lifestyle_changes": ["Change 1","Change 2","Change 3"],
  "seek_doctor_if": "Specific warning signs needing immediate medical attention",
  "prognosis": "Expected improvement timeline with these remedies",
  "ayurvedic_sutra": "Relevant classical principle — transliterated Sanskrit + English meaning"
}
Provide 3 root causes, 4-6 immediate actions, 2-3 herbs. Be specific and practical.`;

  try {
    const resp = await callOpenAILarge(prompt, d.settings.openaiApiKey, 2000);
    const raw = resp.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    renderSymptomResult(result);
    symptomState.resultShown = true;
    el('symptom-reset-btn').style.display = 'flex';
  } catch(e) {
    resultArea.innerHTML = buildApiErrHTML(e, 'runSymptomCheck', 'runSymptomCheck()');
    el('symptom-reset-btn').style.display = 'flex';
  }
}

function renderSymptomResult(r) {
  const imbalanceChips = (r.primary_dosha_imbalance||[]).map(d=>`
    <span class="imbalance-chip imbalance-${d.toLowerCase()}">${d} Aggravated</span>`).join('');

  const timingClass = t=>t==='Immediate'?'badge-immediate':t==='Daily'?'badge-daily':'badge-ongoing';

  const rootCauses = (r.root_causes||[]).map((rc,i)=>`
    <div class="root-cause-item">
      <div class="rc-num">${i+1}</div>
      <div class="rc-body">
        <div class="rc-cause">${rc.cause}</div>
        <div class="rc-explain">${rc.explanation}</div>
      </div>
    </div>`).join('');

  const actions = (r.immediate_actions||[]).map(a=>`
    <div class="action-row">
      <span class="action-badge ${timingClass(a.timing)}">${a.timing}</span>
      <div class="action-text"><strong>${a.action}</strong><br><span style="font-weight:400;font-size:12px;color:var(--text-muted);">${a.detail}</span></div>
    </div>`).join('');

  const herbs = (r.herbs_recommended||[]).map(h=>`
    <div class="action-row">
      <div class="action-text"><span class="mio" style="font-size:16px;vertical-align:-3px;color:var(--gold);margin-right:6px;">eco</span><strong>${h.name}</strong><br><span style="font-weight:400;font-size:12px;color:var(--text-muted);">${h.how}</span></div>
    </div>`).join('');

  const eatTags = (r.foods_to_eat||[]).map(f=>`<span style="padding:5px 11px;background:#D1FAE5;color:#065F46;border-radius:12px;font-size:12px;font-weight:500;">${f}</span>`).join('');
  const avoidTags = (r.foods_to_avoid||[]).map(f=>`<span style="padding:5px 11px;background:#FEE2E2;color:#991B1B;border-radius:12px;font-size:12px;font-weight:500;">${f}</span>`).join('');
  const lifestyle = (r.lifestyle_changes||[]).map(l=>`
    <div class="action-row" style="padding:9px 0;">
      <div class="action-text"><span class="mi" style="font-size:15px;vertical-align:-2px;color:#4A2060;margin-right:6px;">arrow_right</span>${l}</div>
    </div>`).join('');

  el('symptom-result-area').innerHTML = `
    <div class="symptom-result-hero">
      <div style="font-size:10px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;margin-bottom:8px;">Ayurvedic Diagnosis</div>
      <div class="symptom-result-title">${r.condition_name||'Analysis Complete'}</div>
      <div class="symptom-result-sub">${r.condition_modern||''}</div>
      <div class="imbalance-chips">${imbalanceChips}</div>
      <div style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border-radius:14px;padding:5px 12px;font-size:11px;font-weight:600;">
        <span class="mi" style="font-size:14px;">signal_cellular_alt</span> Severity: ${r.severity_assessment||'Moderate'}
      </div>
    </div>

    <div class="symptom-section-card">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">troubleshoot</span> Ayurvedic Root Causes</h4>
      ${rootCauses}
    </div>

    <div class="symptom-section-card">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">bolt</span> What To Do Now</h4>
      ${actions}
    </div>

    <div class="symptom-section-card">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">restaurant</span> Food Guidance</h4>
      <div style="margin-bottom:14px;">
        <div style="font-size:10px;font-weight:700;color:#065F46;margin-bottom:8px;display:flex;align-items:center;gap:6px;"><span class="mi" style="font-size:15px;">check_circle</span><span style="letter-spacing:1px;text-transform:uppercase;">Eat These</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;">${eatTags}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#991B1B;margin-bottom:8px;display:flex;align-items:center;gap:6px;"><span class="mi" style="font-size:15px;">block</span><span style="letter-spacing:1px;text-transform:uppercase;">Avoid These</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;">${avoidTags}</div>
      </div>
    </div>

    ${herbs?`<div class="symptom-section-card"><h4><span class="mio" style="font-size:19px;color:#4A2060;">spa</span> Recommended Herbs</h4>${herbs}</div>`:''}

    ${lifestyle?`<div class="symptom-section-card"><h4><span class="mio" style="font-size:19px;color:#4A2060;">self_improvement</span> Lifestyle Changes</h4>${lifestyle}</div>`:''}

    ${r.prognosis?`
    <div class="symptom-section-card" style="background:linear-gradient(135deg,#F5F0FF,#EDE6FF);border:1px solid rgba(74,32,96,0.15);">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">trending_up</span> Expected Recovery</h4>
      <p style="font-size:13px;color:var(--charcoal-mid);line-height:1.6;">${r.prognosis}</p>
    </div>`:''}

    ${r.seek_doctor_if?`
    <div class="warning-card">
      <span class="mi" style="font-size:22px;color:#991B1B;flex-shrink:0;">emergency</span>
      <div><strong style="display:block;margin-bottom:4px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">See a Doctor If:</strong>${r.seek_doctor_if}</div>
    </div>`:''}

    ${r.ayurvedic_sutra?`
    <div class="symptom-section-card" style="background:linear-gradient(135deg,#2A1A3E,#3D2558);color:white;margin-top:14px;">
      <h4 style="color:rgba(255,255,255,0.85);"><span class="mio" style="font-size:19px;color:rgba(255,255,255,0.65);">auto_stories</span> Ancient Wisdom</h4>
      <p style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.7;font-style:italic;">${r.ayurvedic_sutra}</p>
    </div>`:''}

    <div class="symptom-disclaimer">
      <span class="mio" style="font-size:16px;color:var(--text-muted);flex-shrink:0;">info</span>
      <span>This Ayurvedic analysis is for informational purposes only and does not replace professional medical advice. If symptoms are severe or worsening, please consult a qualified physician or Ayurvedic Vaidya.</span>
    </div>

    <button class="btn-secondary" style="margin-top:14px;margin-bottom:32px;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;" onclick="switchTab('herbs')">
      <span class="mio" style="font-size:17px;">spa</span> Explore Herbs for These Symptoms
    </button>
  `;
  el('app-content').scrollTop = 0;
}

function resetSymptomChecker() {
  symptomState = {selectedAreas:[],duration:null,severity:5,description:'',resultShown:false};
  el('symptom-reset-btn').style.display = 'none';
  renderSymptomHome();
  el('app-content').scrollTop = 0;
  showToast('Ready for a new symptom check');
}


// ══════════════════════════════════════════
//  DINACHARYA — DAILY ROUTINE
// ══════════════════════════════════════════

let dinaCache = null; // in-memory mirror of localStorage cache
let _dinaTicker = null; // interval id for live "Right Now" updates

const DINA_CACHE_KEY = 'ayurai_dina_cache';

function loadDinaCache() {
  try {
    const raw = localStorage.getItem(DINA_CACHE_KEY);
    if(!raw) return null;
    const c = JSON.parse(raw);
    if(!c || !c.data || !c.targetDateStr) return null;
    // Expire: cached date must still be today or in the future
    const cachedDate = new Date(c.targetDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    cachedDate.setHours(0,0,0,0);
    if(cachedDate < today) {
      localStorage.removeItem(DINA_CACHE_KEY);
      return null;
    }
    return c;
  } catch { return null; }
}

function saveDinaCache(cacheObj) {
  try { localStorage.setItem(DINA_CACHE_KEY, JSON.stringify(cacheObj)); } catch {}
}

function clearDinaCache() {
  localStorage.removeItem(DINA_CACHE_KEY);
  dinaCache = null;
}

function stopDinaTicker() {
  if (_dinaTicker) { clearInterval(_dinaTicker); _dinaTicker = null; }
}

function startDinaTicker() {
  stopDinaTicker();
  _dinaTicker = setInterval(() => {
    if (!dinaCache || !dinaCache.targetDateStr) return;
    // Recompute offset in case midnight has passed (Tomorrow → Today)
    dinaFilterState.dayOffset = computeOffsetFromDate(dinaCache.targetDateStr);
    renderDinacharya(
      dinaCache.data,
      new Date(dinaCache.targetDateStr),
      dinaCache.wakeDisplay,
      dinaCache.sleepDisplay,
      dinaCache.generatedAt
    );
  }, 60000);
}

// Returns how many days from today the given ISO date string is (clamped 0–2).
// Used to keep dayOffset in sync with the real calendar after midnight.
function computeOffsetFromDate(dateStr) {
  if (!dateStr) return 1;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diff = Math.round((target - today) / 86400000);
  return Math.max(0, Math.min(2, diff));
}

function initDinacharya() {
  const d = loadData();
  const wrap = el('dina-wrap');

  // No dosha profile yet
  if(!d.dosha) {
    wrap.innerHTML = `
      <div class="dina-hero">
        <div class="dina-hero-label">Dinacharya</div>
        <div class="dina-hero-title">Complete your Dosha Quiz first</div>
        <div class="dina-hero-sub">Your daily routine is personalised to your dosha. Complete the quiz to unlock it.</div>
      </div>
      <button class="btn-primary" onclick="switchTab('quiz')">
        <span class="mio" style="font-size:17px;vertical-align:-4px;margin-right:6px;">self_improvement</span>Take the Dosha Quiz
      </button>`;
    return;
  }

  // Check in-memory cache first (tab revisit without refresh)
  if(dinaCache && dinaCache.targetDateStr) {
    const cachedDate = new Date(dinaCache.targetDateStr);
    const today = new Date(); today.setHours(0,0,0,0);
    cachedDate.setHours(0,0,0,0);
    if(cachedDate >= today) {
      dinaFilterState.dayOffset = computeOffsetFromDate(dinaCache.targetDateStr);
      renderDinacharya(dinaCache.data,
        new Date(dinaCache.targetDateStr),
        dinaCache.wakeDisplay,
        dinaCache.sleepDisplay,
        dinaCache.generatedAt
      );
      el('dina-refresh-btn').style.display = 'flex';
      startDinaTicker();
      return;
    }
  }

  // Check localStorage cache (survives page refresh)
  const stored = loadDinaCache();
  if(stored) {
    dinaCache = stored; // restore in-memory mirror
    dinaFilterState.dayOffset = computeOffsetFromDate(stored.targetDateStr);
    renderDinacharya(stored.data,
      new Date(stored.targetDateStr),
      stored.wakeDisplay,
      stored.sleepDisplay,
      stored.generatedAt
    );
    el('dina-refresh-btn').style.display = 'flex';
    startDinaTicker();
    return;
  }

  // No valid cache — show filter/start screen
  renderDinacharya_StartScreen(d);
}

// ── DINA FILTER STATE ──
const DINA_DEFAULT_WAKE = '06:30';
const DINA_DEFAULT_SLEEP = '22:30';

const DINA_DIET_PREFS = [
  { id:'veg',          label:'Vegetarian',              icon:'eco' },
  { id:'veg_nonveg',   label:'Veg + Non-Veg',           icon:'restaurant' },
  { id:'vegan',        label:'Vegan',                   icon:'spa' },
  { id:'seafood',      label:'Seafood Only',            icon:'set_meal' },
  { id:'keto',         label:'Keto Diet',               icon:'local_fire_department' },
  { id:'dash',         label:'DASH Diet',               icon:'favorite' },
  { id:'lowcarb',      label:'Low-Carb / High-Protein', icon:'fitness_center' },
  { id:'liquid',       label:'Liquid Diet',             icon:'local_cafe' },
  { id:'am_fast',      label:'AM Fasting',              icon:'wb_sunny' },
  { id:'pm_fast',      label:'PM Fasting',              icon:'bedtime' },
  { id:'fullday_fast', label:'Full Day Fasting',        icon:'do_not_disturb' },
  { id:'intermittent', label:'Intermittent Fasting',    icon:'timer' },
];

function getDinaPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('ayurai_dina_prefs')||'{}');
    let dayOffset;
    if (p.targetDateStr) {
      dayOffset = computeOffsetFromDate(p.targetDateStr);
    } else if (p.dayOffset !== undefined) {
      dayOffset = p.dayOffset; // legacy fallback
    } else {
      dayOffset = 1; // default tomorrow
    }
    return {
      wake:  p.wake  || DINA_DEFAULT_WAKE,
      sleep: p.sleep || DINA_DEFAULT_SLEEP,
      dayOffset,
      diets: p.diets || []
    };
  } catch { return { wake:DINA_DEFAULT_WAKE, sleep:DINA_DEFAULT_SLEEP, dayOffset:1, diets:[] }; }
}

function saveDinaPrefs(wake, sleep, dayOffset, diets) {
  // Store absolute target date so dayOffset stays correct across midnight
  const target = new Date();
  target.setDate(target.getDate() + dayOffset);
  const targetDateStr = target.toISOString().split('T')[0];
  localStorage.setItem('ayurai_dina_prefs', JSON.stringify({wake, sleep, targetDateStr, diets}));
}

let dinaFilterState = {
  dayOffset: 1,
  wake: DINA_DEFAULT_WAKE,
  sleep: DINA_DEFAULT_SLEEP,
  symptoms: [],
  diets: []   // persisted dietary preferences
};

function renderDinacharya_StartScreen(d) {
  // Load persisted prefs
  const prefs = getDinaPrefs();
  dinaFilterState.wake = prefs.wake;
  dinaFilterState.sleep = prefs.sleep;
  dinaFilterState.dayOffset = prefs.dayOffset;
  dinaFilterState.diets = prefs.diets || [];
  dinaFilterState.symptoms = [];

  const dosha = d.dosha.primary;

  // Build 3-day options: Today, Tomorrow, Day after tomorrow
  const dayOptions = [0,1,2].map(offset=>{
    const dt = new Date(); dt.setDate(dt.getDate()+offset);
    return {
      offset,
      label: offset===0?'Today':offset===1?'Tomorrow':dt.toLocaleString('default',{weekday:'long'}),
      date: dt.toLocaleDateString([],{day:'numeric',month:'short'})
    };
  });

  const fmt12 = t => {
    const [hh,mm] = t.split(':').map(Number);
    const ampm = hh>=12?'PM':'AM';
    const h12 = hh%12||12;
    return `${h12}:${String(mm).padStart(2,'0')} ${ampm}`;
  };

  el('dina-wrap').innerHTML = `
    <div class="dina-hero">
      <div class="dina-hero-label">Ayurvedic Dinacharya</div>
      <div class="dina-hero-title">Your Daily<br>Routine</div>
      <div class="dina-hero-sub">Get a personalised day schedule built around your dosha, season, wake/sleep times and today's symptoms.</div>
      <div class="dina-meta-row" style="margin-top:14px;">
        <div class="dina-meta-chip"><span class="mio" style="font-size:13px;vertical-align:-1px;">spa</span> ${dosha} Dosha</div>
        <div class="dina-meta-chip"><span class="mi" style="font-size:13px;vertical-align:-1px;">location_on</span> ${d.city||'Set city in Settings'}</div>
      </div>
    </div>

    <!-- ── FILTER CARD ── -->
    <div class="dina-filter-card">
      <h4><span class="mi" style="font-size:19px;color:#1C2E4A;">tune</span> Customise Your Routine</h4>

      <!-- Day selector -->
      <div class="dina-filter-section">
        <div class="dina-filter-label">
          <span class="mi">calendar_today</span> Plan for
        </div>
        <div class="dina-day-pills">
          ${dayOptions.map(o=>`
            <div class="dina-day-pill ${dinaFilterState.dayOffset===o.offset?'selected':''}"
                 id="ddpill-${o.offset}" onclick="selectDinaDay(${o.offset})">
              <span class="dpill-day">${o.label}</span>
              <span class="dpill-date">${o.date}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Wake & Sleep time -->
      <div class="dina-filter-section">
        <div class="dina-filter-label">
          <span class="mi">bedtime</span> Sleep schedule
        </div>
        <div class="dina-time-row">
          <div class="dina-time-field">
            <label><span class="mi">wb_sunny</span> Wake up</label>
            <input type="time" class="dina-time-input" id="dina-wake"
              value="${dinaFilterState.wake}" onchange="dinaFilterState.wake=this.value"/>
          </div>
          <div class="dina-time-field">
            <label><span class="mi">bedtime</span> Sleep by</label>
            <input type="time" class="dina-time-input" id="dina-sleep"
              value="${dinaFilterState.sleep}" onchange="dinaFilterState.sleep=this.value"/>
          </div>
        </div>
      </div>

      <!-- Active symptoms -->
      <div class="dina-filter-section">
        <div class="dina-filter-label">
          <span class="mi">health_and_safety</span> Any symptoms today?
          <span style="font-size:11px;font-weight:400;color:var(--text-light);">Optional</span>
        </div>
        <div class="dina-symptom-chips" id="dina-symptom-chips">
          ${COMMON_AILMENTS.map(s=>`
            <div class="dina-symptom-chip" onclick="toggleDinaSymptom('${s.replace(/'/g,'&apos;')}')" id="dsc-${s.replace(/[^a-z0-9]/gi,'')}">${s}</div>
          `).join('')}
        </div>
      </div>

      <!-- Dietary Preferences -->
      <div class="dina-filter-section">
        <div class="dina-filter-label">
          <span class="mi">restaurant_menu</span> Dietary Preferences
          <span style="font-size:11px;font-weight:400;color:var(--text-light);">Saved · multi-select</span>
        </div>
        <div class="dina-symptom-chips">
          ${DINA_DIET_PREFS.map(p=>`
            <div class="dina-symptom-chip ${dinaFilterState.diets.includes(p.id)?'selected':''}"
                 id="ddiet-${p.id}"
                 onclick="toggleDinaDiet('${p.id}')">
              <span class="mi" style="font-size:13px;">${p.icon}</span> ${p.label}
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- What's included -->
    <div style="background:var(--cream-dark);border-radius:var(--radius-sm);padding:14px 16px;margin-bottom:18px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">What's included</div>
      ${[
        ['wb_sunny','8 personalised time blocks from wake-up to wind-down'],
        ['schedule','Ayurvedic Vata·Pitta·Kapha time-clock applied to your dosha'],
        ['wb_cloudy','Seasonal adjustments for your city & month'],
        ['auto_stories','A classical Ayurvedic wisdom shloka'],
      ].map(([icon,text])=>`
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:7px;">
          <span class="mi" style="font-size:16px;color:var(--gold);">${icon}</span>
          <span style="font-size:12px;color:var(--text-muted);">${text}</span>
        </div>`).join('')}
    </div>

    <button class="btn-primary" style="width:100%;padding:17px;font-size:15px;" onclick="generateDinacharya(false)">
      <span class="mi" style="font-size:19px;vertical-align:-5px;margin-right:8px;">wb_sunny</span>
      Build My Dinacharya
    </button>
  `;
  el('dina-refresh-btn').style.display = 'none';
}

function selectDinaDay(offset) {
  dinaFilterState.dayOffset = offset;
  document.querySelectorAll('.dina-day-pill').forEach(p=>p.classList.remove('selected'));
  el('ddpill-'+offset)?.classList.add('selected');
}

function toggleDinaSymptom(name) {
  const id = 'dsc-'+name.replace(/[^a-z0-9]/gi,'');
  const chip = el(id);
  if(dinaFilterState.symptoms.includes(name)) {
    dinaFilterState.symptoms = dinaFilterState.symptoms.filter(s=>s!==name);
    chip?.classList.remove('selected');
  } else {
    dinaFilterState.symptoms.push(name);
    chip?.classList.add('selected');
  }
}

function toggleDinaDiet(id) {
  const chip = el('ddiet-'+id);
  if(dinaFilterState.diets.includes(id)) {
    dinaFilterState.diets = dinaFilterState.diets.filter(d=>d!==id);
    chip?.classList.remove('selected');
  } else {
    dinaFilterState.diets.push(id);
    chip?.classList.add('selected');
  }
  // Persist immediately — diets are a saved preference
  saveDinaPrefs(
    el('dina-wake')?.value || dinaFilterState.wake,
    el('dina-sleep')?.value || dinaFilterState.sleep,
    dinaFilterState.dayOffset,
    dinaFilterState.diets
  );
}

async function generateDinacharya(forceRefresh=false) {
  const d = loadData();
  if(!d.settings?.openaiApiKey) { showToast('Please add your OpenAI API key in Settings first'); return; }

  // Read current filter values from inputs (in case user typed directly)
  const wakeVal = el('dina-wake')?.value || dinaFilterState.wake;
  const sleepVal = el('dina-sleep')?.value || dinaFilterState.sleep;
  dinaFilterState.wake = wakeVal;
  dinaFilterState.sleep = sleepVal;

  // Persist prefs
  saveDinaPrefs(wakeVal, sleepVal, dinaFilterState.dayOffset, dinaFilterState.diets);

  // Clear existing cache — fresh generation requested
  clearDinaCache();

  // Resolve target date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dinaFilterState.dayOffset);
  const month = targetDate.toLocaleString('default',{month:'long'});
  const dayName = targetDate.toLocaleString('default',{weekday:'long'});
  const dateStr = targetDate.toLocaleDateString([],{day:'numeric',month:'long',year:'numeric'});

  // Format times for display and prompt
  const fmt12 = t => {
    const [hh,mm] = t.split(':').map(Number);
    const ampm = hh>=12?'PM':'AM';
    const h12 = hh%12||12;
    return `${h12}:${String(mm).padStart(2,'0')} ${ampm}`;
  };
  const wakeDisplay = fmt12(wakeVal);
  const sleepDisplay = fmt12(sleepVal);

  // Merge profile ailments + active filter symptoms
  const baseAilments = d.ailments||[];
  const activeSymptoms = dinaFilterState.symptoms;
  const allAilments = [...new Set([...baseAilments,...activeSymptoms])];

  const wrap = el('dina-wrap');
  wrap.innerHTML = `
    <div class="loading-card">
      <span style="display:block;margin-bottom:16px;animation:floatLotus 2.5s ease-in-out infinite;">
        <span class="mi" style="font-size:52px;color:#2C4A72;">wb_sunny</span>
      </span>
      <div class="loading-title">Building Your Dinacharya</div>
      <div class="loading-sub">Crafting your routine for ${dinaFilterState.dayOffset===0?'Today':dinaFilterState.dayOffset===1?'Tomorrow':dayName} · ${wakeDisplay} – ${sleepDisplay}…</div>
      <div class="loading-bar-track"><div class="loading-bar-fill" style="animation-duration:5s;"></div></div>
      <div class="loading-steps">
        <div class="loading-step active" id="dl1"><div class="ls-icon"><span class="mio" style="font-size:15px;">spa</span></div>Reading your dosha &amp; ailments</div>
        <div class="loading-step" id="dl2"><div class="ls-icon"><span class="mi" style="font-size:15px;">wb_sunny</span></div>Analysing season &amp; climate</div>
        <div class="loading-step" id="dl3"><div class="ls-icon"><span class="mi" style="font-size:15px;">schedule</span></div>Mapping your ${wakeDisplay}–${sleepDisplay} schedule</div>
        <div class="loading-step" id="dl4"><div class="ls-icon"><span class="mi" style="font-size:15px;">auto_awesome</span></div>Personalising each time block</div>
      </div>
    </div>`;

  ['dl1','dl2','dl3','dl4'].forEach((id,i)=>{
    setTimeout(()=>{
      if(i>0){const prev=el(['dl1','dl2','dl3','dl4'][i-1]);if(prev){prev.classList.remove('active');prev.classList.add('done');prev.querySelector('.ls-icon').innerHTML='<span class="mi" style="font-size:15px;color:white;">check</span>';}}
      const cur=el(id);if(cur)cur.classList.add('active');
    },i*1000);
  });

  // Resolve diet labels for prompt
  const activeDietLabels = dinaFilterState.diets
    .map(id => DINA_DIET_PREFS.find(p=>p.id===id)?.label)
    .filter(Boolean);
  const dietContext = activeDietLabels.length
    ? activeDietLabels.join(', ')
    : 'No specific preference';

  // Build fasting rules for prompt
  const fastingRules = [];
  if(dinaFilterState.diets.includes('am_fast'))      fastingRules.push('User does AM fasting — no solid food recommendations before noon');
  if(dinaFilterState.diets.includes('pm_fast'))       fastingRules.push('User does PM fasting — no solid food recommendations after 3 PM');
  if(dinaFilterState.diets.includes('fullday_fast'))  fastingRules.push('User is on a full-day fast today — only hydration, herbal teas, and rest-based activities in food blocks');
  if(dinaFilterState.diets.includes('intermittent'))  fastingRules.push('User does intermittent fasting — suggest a 16:8 or 14:10 eating window aligned with their dosha');
  if(dinaFilterState.diets.includes('liquid'))        fastingRules.push('User is on a liquid diet — only juices, soups, herbal teas, broths in meal suggestions');
  if(dinaFilterState.diets.includes('veg'))           fastingRules.push('User is vegetarian — no meat, fish or eggs in any food suggestions');
  if(dinaFilterState.diets.includes('vegan'))         fastingRules.push('User is vegan — no animal products including dairy, eggs or honey');
  if(dinaFilterState.diets.includes('seafood'))       fastingRules.push('User eats seafood only — no land meat, suggest fish/shellfish where appropriate');
  if(dinaFilterState.diets.includes('keto'))          fastingRules.push('User follows keto — high fat, moderate protein, very low carb food suggestions only');
  if(dinaFilterState.diets.includes('dash'))          fastingRules.push('User follows DASH diet — low sodium, high potassium, emphasise fruits/vegetables/whole grains');
  if(dinaFilterState.diets.includes('lowcarb'))       fastingRules.push('User follows Low-Carb/High-Protein — reduce grains/sugar, emphasise protein-rich foods');

  const age = getUserAge();
  const prompt = `You are a master Ayurvedic physician. Create a personalised Dinacharya (daily routine) for this person.

Profile:
- Dosha: ${d.dosha.primary} (V${d.dosha.scores?.Vata||0}% P${d.dosha.scores?.Pitta||0}% K${d.dosha.scores?.Kapha||0}%)
- Age: ${age ? age + ' years' : 'unknown'}
- Chronic ailments: ${baseAilments.join(', ')||'None'}
- Active symptoms today: ${activeSymptoms.join(', ')||'None'}
- Dietary preferences: ${dietContext}
- City: ${d.city||'unknown'}, Month: ${month}
- Day: ${dayName} (${dateStr})
- Wake up time: ${wakeDisplay}
- Sleep time: ${sleepDisplay}

Rules:
- Infer the Ritu (season) for this city+month
- Apply Ayurvedic time clock (Vata 2-6, Pitta 10-2, Kapha 6-10)
- Start blocks from their wake time (${wakeDisplay}), end at sleep time (${sleepDisplay})
- Create exactly 8 time blocks covering their full day
- If they have active symptoms, avoid activities that could aggravate those
- Each block must be specific, actionable, personalised. No generic advice.
- DOSHA DIETARY GUARDRAILS (strictly enforce in every food, drink and activity suggestion):
  * Pitta: AVOID sour (lemon, citrus, vinegar), hot, spicy, salty; NO lemon water in morning drinks; use COOL or room-temp water, coconut water, mint/fennel/coriander infusions, cooling foods
  * Vata: PREFER warm, oily, grounding foods; warm water, ginger tea, sesame; AVOID cold, raw, dry foods
  * Kapha: PREFER warm, light, dry foods; warm water with ginger or honey; AVOID cold, heavy, oily, sweet foods
${fastingRules.length ? '- DIETARY RULES (strictly follow these):\n' + fastingRules.map(r=>'  * '+r).join('\n') : ''}

Respond ONLY as valid JSON (no markdown, no trailing commas):
{
  "season": "Ritu name e.g. Grishma (Summer)",
  "season_note": "One sentence: how this season affects this dosha today",
  "day_mantra": "Short Sanskrit-rooted intention for this dosha",
  "blocks": [
    {
      "time_start": "${wakeDisplay}",
      "time_end": "next block start",
      "activity": "Activity name",
      "description": "2 sentences, dosha+season personalised",
      "tips": ["Tip 1 dosha-specific","Tip 2 seasonal or symptom-aware"],
      "dosha_note": "1 sentence why this suits their dosha/ailment"
    }
  ],
  "ayurvedic_wisdom": "Short classical shloka/principle with transliteration and meaning"
}`;

  try {
    const resp = await callOpenAILarge(prompt, d.settings.openaiApiKey, 3000);
    const raw = resp.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    // Build cache object — persists across page refreshes
    const cacheObj = {
      data: result,
      targetDateStr: targetDate.toISOString(),
      dayOffset: dinaFilterState.dayOffset,
      wakeDisplay,
      sleepDisplay,
      generatedAt: new Date().toISOString()
    };
    dinaCache = cacheObj;
    saveDinaCache(cacheObj);
    renderDinacharya(result, targetDate, wakeDisplay, sleepDisplay, cacheObj.generatedAt);
    el('dina-refresh-btn').style.display = 'flex';
    startDinaTicker();
  } catch(e) {
    el('dina-wrap').innerHTML = `
      <div style="padding:16px;">
        ${buildApiErrHTML(e, 'generateDinacharya', 'generateDinacharya(false)')}
        <button class="btn-secondary" style="width:100%;margin-top:4px;display:inline-flex;align-items:center;justify-content:center;gap:6px;"
          onclick="renderDinacharya_StartScreen(loadData())">
          <span class="mi" style="font-size:16px;">arrow_back</span> Back to Filters
        </button>
      </div>`;
  }
}

function renderDinacharya(data, targetDate, wakeDisplay, sleepDisplay, generatedAt) {
  const now = new Date();
  const tDate = targetDate || now;
  const nowMins = now.getHours()*60 + now.getMinutes();
  const d = loadData();
  const dayName = tDate.toLocaleString('default',{weekday:'long'});
  const dateStr = tDate.toLocaleDateString([],{day:'numeric',month:'long',year:'numeric'});
  const isToday = tDate.toDateString() === now.toDateString();
  const dayLabel = dinaFilterState.dayOffset===0?'Today':dinaFilterState.dayOffset===1?'Tomorrow':dayName;
  const timeNow = now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});

  function fmt12h(t='06:30'){
    const [hh,mm]=(t||'06:30').split(':').map(Number);
    const ampm=hh>=12?'PM':'AM';const h12=hh%12||12;
    return `${h12}:${String(mm).padStart(2,'0')} ${ampm}`;
  }

  const wk = wakeDisplay || fmt12h(dinaFilterState.wake);
  const sl = sleepDisplay || fmt12h(dinaFilterState.sleep);

  function parseTimeMins(t) {
    if(!t) return 0;
    const [time,ampm] = t.split(' ');
    let [h,m] = time.split(':').map(Number);
    if(ampm==='PM'&&h!==12) h+=12;
    if(ampm==='AM'&&h===12) h=0;
    return h*60+(m||0);
  }

  const blocks = data.blocks||[];
  // Only highlight current block when viewing today's routine
  let currentIdx = -1;
  if(isToday) {
    blocks.forEach((b,i)=>{
      const start = parseTimeMins(b.time_start);
      const end = parseTimeMins(b.time_end)||parseTimeMins(blocks[i+1]?.time_start)||(start+60);
      if(nowMins>=start && nowMins<end) currentIdx=i;
    });
  }
  const timelineHTML = blocks.map((b,i)=>{
    const isCurrent = i===currentIdx;
    const isPast = currentIdx>=0 && i<currentIdx;
    const stateClass = isCurrent?'current':isPast?'past':'';
    const tips = (b.tips||[]).map(t=>`
      <div class="dina-tip"><span class="mi">arrow_right</span><span>${t}</span></div>`).join('');

    // Section dividers
    let divider = '';
    if(i===0) divider = `<div class="dina-section-div"><span class="dina-section-label">Morning</span><div class="dina-section-line"></div></div>`;
    else if(b.time_start?.includes('12')||b.time_start?.includes('1:00 PM')||b.time_start?.includes('1 PM')) divider = `<div class="dina-section-div"><span class="dina-section-label">Afternoon</span><div class="dina-section-line"></div></div>`;
    else if(b.time_start?.includes('5:00 PM')||b.time_start?.includes('6:00 PM')||b.time_start?.includes('5 PM')||b.time_start?.includes('6 PM')) divider = `<div class="dina-section-div"><span class="dina-section-label">Evening</span><div class="dina-section-line"></div></div>`;

    return `${divider}
    <div class="dina-block ${stateClass}">
      <div class="dina-block-dot">${isPast?`<span class="mi">check</span>`:''}</div>
      <div class="dina-card">
        <div class="dina-card-header">
          <span class="dina-time-badge">${b.time_start} – ${b.time_end}</span>
          ${isCurrent?`<span class="dina-current-badge">Now</span>`:''}
        </div>
        <div class="dina-activity-name">${b.activity}</div>
        <div class="dina-activity-desc">${b.description}</div>
        ${tips?`<div class="dina-tips">${tips}</div>`:''}
        ${b.dosha_note?`<div class="dina-dosha-note"><span class="mio" style="font-size:12px;vertical-align:-1px;margin-right:4px;">spa</span>${b.dosha_note}</div>`:''}
      </div>
    </div>`;
  }).join('');

  el('dina-wrap').innerHTML = `
    <div class="dina-hero">
      <div class="dina-hero-label">Your Dinacharya · ${data.season||'Today'}</div>
      <div class="dina-hero-title">${dayLabel}</div>
      <div class="dina-hero-sub">${data.season_note||''}</div>
      <div class="dina-meta-row">
        <div class="dina-meta-chip"><span class="mio" style="font-size:13px;vertical-align:-1px;">spa</span> ${d.dosha.primary} Dosha</div>
        <div class="dina-meta-chip"><span class="mi" style="font-size:13px;vertical-align:-1px;">location_on</span> ${d.city||'Your city'}</div>
        <div class="dina-meta-chip"><span class="mi" style="font-size:13px;vertical-align:-1px;">calendar_today</span> ${dateStr}</div>
        <div class="dina-meta-chip"><span class="mi" style="font-size:13px;vertical-align:-1px;">bedtime</span> ${wk} – ${sl}</div>
        ${dinaFilterState.diets.length ? dinaFilterState.diets.map(id=>{
          const pref=DINA_DIET_PREFS.find(p=>p.id===id);
          return pref?`<div class="dina-meta-chip"><span class="mi" style="font-size:13px;vertical-align:-1px;">${pref.icon}</span> ${pref.label}</div>`:'';
        }).join('') : ''}
      </div>
    </div>

    ${isToday && currentIdx>=0?`
    <div style="background:linear-gradient(135deg,#1C2E4A,#2C4A72);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px;color:white;">
      <div class="dina-now-dot"></div>
      <div>
        <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.65;margin-bottom:2px;">Right now · ${timeNow}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;">${blocks[currentIdx]?.activity||''}</div>
      </div>
    </div>`:''}

    ${data.day_mantra?`
    <div style="background:var(--gold-pale);border:1px solid rgba(201,168,76,0.3);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:16px;text-align:center;">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:5px;">Today's Intention</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--burgundy);line-height:1.4;">${data.day_mantra}</div>
    </div>`:''}

    <div class="dina-timeline">${timelineHTML}</div>

    ${data.ayurvedic_wisdom?`
    <div class="dina-wisdom-card">
      <h4><span class="mio" style="font-size:20px;color:rgba(255,255,255,0.7);">auto_stories</span> Ancient Wisdom</h4>
      <p>${data.ayurvedic_wisdom}</p>
    </div>`:''}

    <div class="dina-disclaimer">
      <span class="mio" style="font-size:16px;color:var(--text-muted);flex-shrink:0;">info</span>
      <span>Personalised to your ${d.dosha.primary} dosha and current season.${generatedAt ? ` Generated at ${new Date(generatedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · ${new Date(generatedAt).toLocaleDateString([],{day:'numeric',month:'short'})}.` : ''} Tap <strong>Regenerate</strong> (top right) to adjust filters.</span>
    </div>

    <button class="btn-secondary" style="margin-top:14px;margin-bottom:32px;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;" onclick="clearDinaCache();renderDinacharya_StartScreen(loadData());">
      <span class="mi" style="font-size:17px;">tune</span> Adjust Filters &amp; Regenerate
    </button>
  `;

  // Scroll to current block if it exists
  if(currentIdx>=0) {
    setTimeout(()=>{
      const blocks = el('dina-wrap').querySelectorAll('.dina-block');
      if(blocks[currentIdx]) {
        const blockTop = blocks[currentIdx].offsetTop;
        el('app-content').scrollTo({top: blockTop - 80, behavior:'smooth'});
      }
    }, 300);
  }
  el('dina-refresh-btn').style.display = 'flex';
}

// ── STARTUP ──
(function(){
  const d = loadData();
  if(d.user) {
    showScreen('screen-app');
    initApp();
    setTimeout(initMealTiming, 100);
    // Restore food check cache if exists (handles page refresh)
    if(loadFoodCache()) initFoodCheck();
  } else if(isFirstTimeUser()) {
    showScreen('screen-onboarding');
    goToOnboardingSlide(1);
    setTimeout(initOnboardingParticles, 50);
  } else {
    showScreen('screen-login');
  }
})();