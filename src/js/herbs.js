function saveApiKey() {
  const key = el('settings-apikey').value.trim();
  if(!key) { showToast('Please enter your OpenAI API key'); return; }
  if(!key.startsWith('sk-')) { showToast('API key should start with sk-'); return; }
  setData('settings.openaiApiKey', key);
  el('food-api-warning').style.display='none';
  // Clear any previous key error state since user just updated the key
  setApiErrorState(false);
  // Update hero chip
  const shc = el('settings-hero-chips');
  if(shc) {
    const d = loadData();
    shc.innerHTML = `
      <div class="settings-hero-chip"><span class="mio" style="font-size:12px;vertical-align:-1px;">spa</span> ${d.dosha?.primary||'No quiz'}</div>
      <div class="settings-hero-chip"><span class="mi" style="font-size:12px;vertical-align:-1px;">location_on</span> ${d.city||'No city'}</div>
      <div class="settings-hero-chip"><span class="mi" style="font-size:12px;vertical-align:-1px;">key</span> API Key set</div>`;
  }
  showToast('API key saved');
}

// ── DOSHA INSIGHTS (Home Card) ──
async function loadDoshaInsights(d) {
  if(!d) d = loadData();
  const container = el('home-dosha-insights');
  if(!container) return;

  // Use cached insights if available
  if(d.doshaInsights) {
    renderDoshaInsights(d.doshaInsights);
    return;
  }

  // Need API key to fetch
  if(!d.settings?.openaiApiKey) {
    container.innerHTML = `
      <div class="dosha-insights">
        <div style="font-size:12px;color:var(--text-light);padding-top:4px;">
          <span class="mi" style="font-size:14px;vertical-align:-2px;color:var(--text-light);">info</span>
          Add your API key in Settings to get personalised dosha tips.
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="dosha-insights">
      <div class="dosha-insights-loading">
        <div class="dosha-insights-mini-spinner"></div>
        Loading your personalised dosha insights…
      </div>
    </div>`;

  const age = getUserAge();
  const prompt = `You are an expert Ayurvedic nutritionist. Based on this person's dosha, provide concise personalised insights.

Dosha: ${d.dosha.primary} (Vata ${d.dosha.scores?.Vata||0}%, Pitta ${d.dosha.scores?.Pitta||0}%, Kapha ${d.dosha.scores?.Kapha||0}%)
Age: ${age ? age + ' years' : 'unknown'}
Known ailments: ${d.ailments?.join(', ')||'None'}

Respond ONLY in this exact JSON (no markdown):
{
  "foods_to_avoid": ["food1","food2","food3","food4","food5"],
  "top3_care": [
    {"icon":"material_icon_name","tip":"Concise actionable tip specific to this dosha"},
    {"icon":"material_icon_name","tip":"Concise actionable tip"},
    {"icon":"material_icon_name","tip":"Concise actionable tip"}
  ],
  "best_meal_times": "e.g. Breakfast 7–8 AM, Lunch 12–1 PM, Dinner 6–7 PM — one sentence",
  "dosha_strength": "One sentence on a key strength of this dosha type"
}
Use only real Material Icons names like: restaurant, bedtime, wb_sunny, self_improvement, favorite, directions_walk, eco, water_drop, air.`;

  try {
    const resp = await callOpenAI(prompt, d.settings.openaiApiKey);
    const raw = resp.replace(/```json|```/g,'').trim();
    const insights = JSON.parse(raw);
    // Save to localStorage so we don't re-fetch
    setData('doshaInsights', insights);
    renderDoshaInsights(insights);
  } catch(e) {
    const type = classifyApiError(e);
    setApiErrorState(true);
    logError('loadDoshaInsights', e);
    const msgs = {
      quota: 'OpenAI credits exhausted — top up at platform.openai.com to see your personalised insights.',
      invalid_key: 'Invalid API key — update your key in Settings to see insights.',
      rate_limit: 'Rate limited — please wait a moment and revisit this page.',
      network: 'No internet connection — connect and refresh to load insights.',
      unknown: 'Could not load insights — check App Diagnostics in Settings.'
    };
    if(container) container.innerHTML = `
      <div class="dosha-insights">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(217,95,69,0.07);border-radius:8px;border-left:3px solid #D95F45;">
          <span class="mi" style="font-size:18px;color:#D95F45;flex-shrink:0;">error_outline</span>
          <span style="font-size:12px;color:var(--text-muted);line-height:1.5;">${msgs[type]||msgs.unknown}</span>
        </div>
      </div>`;
  }
}

function renderDoshaInsights(ins) {
  const container = el('home-dosha-insights');
  if(!container || !ins) return;

  const avoidTags = (ins.foods_to_avoid||[]).map(f=>
    `<span class="dosha-avoid-tag">${f}</span>`).join('');

  const careTips = (ins.top3_care||[]).map(t=>`
    <div class="dosha-insight-item">
      <span class="mi" style="font-size:14px;color:var(--burgundy);">${t.icon||'arrow_right'}</span>
      <span>${t.tip}</span>
    </div>`).join('');

  container.innerHTML = `
    <div class="dosha-insights">
      ${ins.dosha_strength?`
      <div class="dosha-insight-block" style="background:var(--gold-pale);border-left:3px solid var(--gold);">
        <div class="dosha-insight-title"><span class="mi">stars</span><span class="dosha-insight-title-text">Your Strength</span></div>
        <div style="font-size:12px;color:var(--charcoal-mid);line-height:1.55;">${ins.dosha_strength}</div>
      </div>`:''}

      <div class="dosha-insight-block">
        <div class="dosha-insight-title"><span class="mi">schedule</span><span class="dosha-insight-title-text">Best Meal Times</span></div>
        <div style="font-size:12px;color:var(--charcoal-mid);line-height:1.55;">${ins.best_meal_times||''}</div>
      </div>

      <div class="dosha-insight-block">
        <div class="dosha-insight-title"><span class="mi">block</span><span class="dosha-insight-title-text">Foods to Avoid</span></div>
        <div class="dosha-avoid-tags">${avoidTags}</div>
      </div>

      <div class="dosha-insight-block">
        <div class="dosha-insight-title"><span class="mi">tips_and_updates</span><span class="dosha-insight-title-text">Top 3 Things to Care About</span></div>
        <div class="dosha-insight-list">${careTips}</div>
      </div>
    </div>`;
}

// ── JSON EXPORT / IMPORT ──
function exportJSON() {
  const d = loadData();
  // Include all current feature data in export
  const exportData = {
    ...d,
    _export_meta: {
      exported_at: new Date().toISOString(),
      app_version: '1.29',
      features_included: ['profile','dosha','ailments','foodHistory','doshaInsights','city','settings','dinacharya']
    }
  };
  const blob = new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='my_info.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Exported my_info.json');
}

function triggerImport() {
  document.getElementById('import-file-input').click();
}

function importJSON(evt) {
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if(!data.user) { showToast('Invalid my_info.json — missing user profile'); return; }
      // Strip export meta before saving
      delete data._export_meta;
      saveData(data);
      // Reset in-memory caches so they reload from imported data
      dinaCache = null;
      clearDinaCache();
      clearFoodCache();
      herbState.resultsShown = false;
      showToast('Profile imported! Welcome back 🙏');
      initApp();
      showScreen('screen-app');
      switchTab('home');
    } catch {
      showToast('Could not read file — make sure it is a valid my_info.json');
    }
  };
  reader.readAsText(file);
  evt.target.value='';
}


// ══════════════════════════════════════════
//  HERB & SUPPLEMENT ADVISOR
// ══════════════════════════════════════════

const HERB_CONCERNS = [
  'Digestive issues','Acidity / Reflux','Bloating','Constipation',
  'Low immunity','Stress / Anxiety','Poor sleep','Low energy / Fatigue',
  'Skin health','Weight management','Joint pain','Respiratory health',
  'Memory / Focus','Hormonal balance','Liver health','Heart health'
];

let herbState = {
  mode: null,          // 'profile' | 'concern' | 'chat'
  selectedConcerns: [],
  chatHistory: [],
  chatLoading: false,
  resultsShown: false
};

function initHerbAdvisor() {
  const d = loadData();
  const wrap = el('herbs-wrap');
  if(!d.dosha) {
    wrap.innerHTML = `
      <div class="herb-hero">
        <div class="herb-hero-label">Herb Advisor</div>
        <div class="herb-hero-title">Complete your Dosha Quiz first 🌿</div>
        <div class="herb-hero-sub">The Herb Advisor needs your dosha profile to give personalised recommendations.</div>
      </div>
      <button class="btn-primary" onclick="switchTab('quiz')">Go to Dosha Quiz →</button>`;
    return;
  }
  if(!herbState.resultsShown) renderHerbHome(d);
}

function renderHerbHome(d) {
  const dosha = d.dosha?.primary || '—';
  el('herbs-wrap').innerHTML = `
    <div class="herb-hero">
      <div class="herb-hero-label">Ayurvedic Herb Advisor</div>
      <div class="herb-hero-title">Find Herbs &amp;<br>Supplements for You</div>
      <div class="herb-hero-sub">Get personalised herb recommendations based on your dosha, current ailments, or ask anything about Ayurvedic herbs.</div>
      <div class="herb-dosha-chip"><span class="mio" style="font-size:14px;vertical-align:-2px;">spa</span> ${dosha} Dosha · ${d.city||'Location not set'}</div>
    </div>

    <div class="section-title">How would you like to explore?</div>
    <div class="herb-mode-grid">
      <div class="herb-mode-card" id="hmode-profile" onclick="selectHerbMode('profile')">
        <div class="herb-mode-icon"><span class="mio" style="font-size:30px;color:var(--burgundy);">self_improvement</span></div>
        <div class="herb-mode-title">By My Dosha</div>
        <div class="herb-mode-desc">Best herbs for your ${dosha} constitution</div>
      </div>
      <div class="herb-mode-card" id="hmode-concern" onclick="selectHerbMode('concern')">
        <div class="herb-mode-icon"><span class="mi" style="font-size:30px;color:var(--burgundy);">track_changes</span></div>
        <div class="herb-mode-title">By Concern</div>
        <div class="herb-mode-desc">Target a specific health goal or ailment</div>
      </div>
      <div class="herb-mode-card" id="hmode-chat" onclick="selectHerbMode('chat')">
        <div class="herb-mode-icon"><span class="mio" style="font-size:30px;color:var(--burgundy);">chat_bubble</span></div>
        <div class="herb-mode-title">Ask Anything</div>
        <div class="herb-mode-desc">Chat with your Ayurvedic herb expert</div>
      </div>
      <div class="herb-mode-card" id="hmode-seasonal" onclick="selectHerbMode('seasonal')">
        <div class="herb-mode-icon"><span class="mio" style="font-size:30px;color:var(--burgundy);">wb_sunny</span></div>
        <div class="herb-mode-title">Seasonal Herbs</div>
        <div class="herb-mode-desc">What to take this season in ${d.city||'your city'}</div>
      </div>
    </div>
    <div id="herb-mode-content"></div>
  `;
}

function selectHerbMode(mode) {
  herbState.mode = mode;
  document.querySelectorAll('.herb-mode-card').forEach(c=>c.classList.remove('selected'));
  el('hmode-'+mode)?.classList.add('selected');
  const content = el('herb-mode-content');
  if(!content) return;

  if(mode === 'profile') {
    content.innerHTML = `
      <div class="herb-concern-card">
        <h4><span class="mio" style="font-size:18px;vertical-align:-4px;margin-right:5px;color:var(--burgundy);">self_improvement</span>Herbs for Your Dosha</h4>
        <p>Get the top Ayurvedic herbs and supplements tailored to your ${loadData().dosha?.primary} constitution and known ailments.</p>
        <button class="btn-primary" onclick="getHerbsByDosha()"><span class="mi" style="font-size:16px;vertical-align:-3px;margin-right:5px;">spa</span>Get My Herb Recommendations</button>
      </div>`;
  } else if(mode === 'concern') {
    content.innerHTML = `
      <div class="herb-concern-card">
        <h4><span class="mi" style="font-size:18px;vertical-align:-4px;margin-right:5px;color:var(--burgundy);">track_changes</span>Choose Your Health Concerns</h4>
        <p>Select one or more areas you want to address. You can pick from your known ailments or choose something new.</p>
        <div class="herb-tags" id="herb-concern-tags">
          ${HERB_CONCERNS.map((c,i)=>`
            <div class="herb-tag ${herbState.selectedConcerns.includes(c)?'active':''}"
              id="htag-${i}" onclick="toggleHerbConcern('${c}',${i})">${c}</div>
          `).join('')}
        </div>
        <button class="btn-primary" onclick="getHerbsByConcern()"><span class="mi" style="font-size:16px;vertical-align:-3px;margin-right:5px;">search</span>Find Herbs for These Concerns</button>
      </div>`;
  } else if(mode === 'chat') {
    renderHerbChat();
  } else if(mode === 'seasonal') {
    content.innerHTML = `
      <div class="herb-concern-card">
        <h4><span class="mio" style="font-size:18px;vertical-align:-4px;margin-right:5px;color:var(--burgundy);">wb_sunny</span>Seasonal Herb Guide</h4>
        <p>Get herbs and supplements recommended for the current season in your city, aligned with your dosha.</p>
        <button class="btn-primary" onclick="getSeasonalHerbs()"><span class="mi" style="font-size:16px;vertical-align:-3px;margin-right:5px;">event</span>Get Seasonal Recommendations</button>
      </div>`;
  }
}

function toggleHerbConcern(name, idx) {
  if(herbState.selectedConcerns.includes(name)) {
    herbState.selectedConcerns = herbState.selectedConcerns.filter(c=>c!==name);
    el('htag-'+idx)?.classList.remove('active');
  } else {
    herbState.selectedConcerns.push(name);
    el('htag-'+idx)?.classList.add('active');
  }
}

// ── SHARED HERB RESULT RENDERER ──
function renderHerbResults(data, titlePrefix) {
  const wrap = el('herbs-wrap');
  const pct = data.effect_confidence || 85;
  const fillColor = pct>=75?'#2D5A3D':pct>=50?'#C9A84C':'#D95F45';

  const herbsHTML = (data.herbs||[]).map(h=>{
    const safetyClass = h.safety==='Safe'?'safe-yes':h.safety==='Use with caution'?'safe-caution':'safe-no';
    return `
      <div class="herb-item">
        <div class="herb-item-top">
          <div class="herb-item-icon">${h.icon||'spa'}</div>
          <div style="flex:1;">
            <div class="herb-item-name">${h.name}</div>
            <div class="herb-item-sanskrit">${h.sanskrit||''}</div>
            <span class="herb-safety-badge ${safetyClass}">${h.safety||'Safe'}</span>
          </div>
        </div>
        <div class="herb-item-desc">${h.benefit}</div>
        <div class="herb-item-how"><strong>How to use:</strong> ${h.how}</div>
        ${h.warning?`<div class="herb-interaction-warning"><span class="mi" style="font-size:14px;vertical-align:-2px;margin-right:4px;">warning</span>${h.warning}</div>`:''}
      </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="top-bar" style="position:sticky;top:0;z-index:10;margin:-20px -16px 16px;padding:14px 16px;">
      <div>
        <div class="top-bar-title">Your Herb Guide</div>
        <div class="top-bar-sub">${titlePrefix}</div>
      </div>
      <button onclick="resetHerbAdvisor()" style="display:inline-flex;align-items:center;gap:4px;padding:7px 14px;background:var(--lotus-pale);border:1.5px solid var(--lotus);border-radius:20px;font-family:'Jost',sans-serif;font-size:12px;font-weight:600;color:var(--burgundy);cursor:pointer;"><span class="mi" style="font-size:15px;">arrow_back</span> New Search</button>
    </div>

    <div class="herb-result-card">
      <h4>${data.title||'Your Personalised Herbs'}</h4>
      <div class="hr-sub">${data.summary||''}</div>

      <div class="remedy-effect-bar" style="margin-bottom:18px;">
        <div class="remedy-effect-label">Match Confidence</div>
        <div class="remedy-effect-track">
          <div class="remedy-effect-fill" id="herb-conf-fill" style="width:0%;background:${fillColor};"></div>
        </div>
        <div class="remedy-effect-pct">${pct}%</div>
      </div>

      ${herbsHTML}

      ${data.avoid_list?.length ? `
      <div style="margin-top:16px;padding:14px;background:rgba(180,30,30,0.06);border-radius:10px;border-left:3px solid #D95F45;">
        <div style="font-size:11px;font-weight:700;color:#8B1A1A;margin-bottom:8px;display:flex;align-items:center;gap:6px;"><span class="mi" style="font-size:16px;">warning</span><span style="letter-spacing:1px;text-transform:uppercase;">Herbs to Avoid for Your Dosha</span></div>
        <div style="font-size:12px;color:var(--text-muted);line-height:1.7;">${data.avoid_list.join(' · ')}</div>
      </div>` : ''}

      ${data.lifestyle_tip ? `
      <div style="margin-top:14px;padding:12px 14px;background:rgba(45,90,61,0.07);border-radius:10px;border-left:3px solid #2D5A3D;">
        <div style="font-size:11px;font-weight:700;color:#1A3A2A;margin-bottom:4px;display:flex;align-items:center;gap:6px;"><span class="mio" style="font-size:16px;">eco</span><span style="letter-spacing:1px;text-transform:uppercase;">Lifestyle Tip</span></div>
        <div style="font-size:12px;color:var(--charcoal-mid);line-height:1.6;">${data.lifestyle_tip}</div>
      </div>` : ''}
    </div>

    <div class="herb-disclaimer">
      <span class="mio" style="font-size:14px;vertical-align:-2px;margin-right:4px;">menu_book</span>
      <em>This guidance is based on classical Ayurvedic texts. Consult a qualified Vaidya or physician before starting any herbal regimen, especially if you are on medication.</em>
    </div>

    <button class="btn-secondary" style="margin-top:14px;margin-bottom:32px;display:inline-flex;align-items:center;gap:6px;" onclick="renderHerbChat()">
      <span class="mio" style="font-size:17px;">chat_bubble</span> Ask follow-up questions
    </button>
  `;

  herbState.resultsShown = true;
  el('herb-reset-btn').style.display='flex';
  el('app-content').scrollTop = 0;

  requestAnimationFrame(()=>{
    setTimeout(()=>{
      const fill = el('herb-conf-fill');
      if(fill) fill.style.width = pct+'%';
    },120);
  });
}

// ── BUILD HERB PROMPT ──
function buildHerbContext() {
  const d = loadData();
  const now = new Date();
  const age = getUserAge();
  return {
    dosha: d.dosha?.primary||'Unknown',
    scores: d.dosha?.scores||{},
    ailments: d.ailments?.join(', ')||'None',
    city: d.city||'unknown city',
    month: now.toLocaleString('default',{month:'long'}),
    time: now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
    age: age ? age + ' years' : 'unknown',
    apiKey: d.settings?.openaiApiKey||''
  };
}

function buildHerbJsonSpec() {
  return `{
  "title": "Short descriptive title",
  "summary": "2-sentence overall recommendation rationale",
  "effect_confidence": <60-95 integer>,
  "herbs": [
    {
      "icon": "<single herb emoji>",
      "name": "Common English name",
      "sanskrit": "Sanskrit / Ayurvedic name",
      "benefit": "Why this herb suits this person specifically — mention dosha, ailment, season",
      "how": "Exact dosage, form (powder/capsule/tea/oil), timing, duration",
      "safety": "Safe" | "Use with caution" | "Avoid in pregnancy",
      "warning": "Optional: specific interaction or contraindication warning, or omit key"
    }
  ],
  "avoid_list": ["Herb to avoid for this dosha", "..."],
  "lifestyle_tip": "One actionable lifestyle tip to enhance the herbs' effect"
}

Provide 4 to 6 herbs. Prioritise classical Ayurvedic herbs. Respond ONLY in this JSON, no markdown.`;
}

// ── GET BY DOSHA ──
async function getHerbsByDosha() {
  const ctx = buildHerbContext();
  if(!ctx.apiKey) { showToast('Please add your OpenAI API key in Settings'); return; }
  showHerbLoading('Consulting the Ayurvedic scriptures...');

  const prompt = `You are a senior Ayurvedic Vaidya (physician). Recommend the best herbs and supplements for this person based on their dosha constitution and known ailments.

User Profile:
- Primary Dosha: ${ctx.dosha} (Vata ${ctx.scores.Vata||0}%, Pitta ${ctx.scores.Pitta||0}%, Kapha ${ctx.scores.Kapha||0}%)
- Age: ${ctx.age}
- Known ailments: ${ctx.ailments}
- City: ${ctx.city}, Month: ${ctx.month}
- Time: ${ctx.time}

Consider the current season inferred from city + month. Recommend herbs that support this dosha's natural balance and address the known ailments.

Respond in this JSON format:
${buildHerbJsonSpec()}`;

  await fetchAndRenderHerbs(prompt, ctx.apiKey, `${ctx.dosha} constitution · ${ctx.month}`);
}

// ── GET BY CONCERN ──
async function getHerbsByConcern() {
  if(!herbState.selectedConcerns.length) {
    showToast('Please select at least one concern 🎯'); return;
  }
  const ctx = buildHerbContext();
  if(!ctx.apiKey) { showToast('Please add your OpenAI API key in Settings'); return; }