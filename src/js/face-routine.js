let faceState = {
  step: 1,
  skinType: null,
  concerns: [],
  pulse: { weather: null, redness: null, pores: null, temperature: null },
  lifestyle: {},
  frequency: null
};

function initFaceRoutine() {
  const cached = getData('faceRoutine');
  if (cached && cached.result) {
    if (el('face-reset-btn')) el('face-reset-btn').style.display = 'block';
    renderFaceRoutine(cached.result);
    return;
  }
  const d = loadData();
  if (!d.dosha || !d.dosha.primary) {
    el('face-wrap').innerHTML = `
      <div class="symptom-section-card" style="text-align:center;padding:32px 20px;">
        <span class="mio" style="font-size:48px;color:var(--lotus);">face_6</span>
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal);margin:12px 0 8px;">Take the Dosha Quiz First</div>
        <div style="font-size:14px;color:var(--text-muted);margin-bottom:20px;line-height:1.5;">Your Ayurvedic dosha guides your skincare routine. Complete the quiz to continue.</div>
        <button class="btn-primary" onclick="switchTab('quiz')" style="margin:0 auto;">Take Quiz →</button>
      </div>`;
    return;
  }
  faceState = { step: 1, skinType: null, concerns: [], pulse: { weather: null, redness: null, pores: null, temperature: null }, lifestyle: {}, frequency: null };
  renderFaceQuestionnaire();
}

function renderFaceQuestionnaire() {
  if (el('face-reset-btn')) el('face-reset-btn').style.display = 'none';
  el('face-wrap').innerHTML = '<div id="face-q-container"></div>';
  renderFaceStep(faceState.step);
}

function renderFaceStep(step) {
  const pct = Math.round((step / 5) * 100);
  let html = `
    <div class="face-step-container">
      <div class="quiz-progress">
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <div class="quiz-progress-text">Step ${step} of 5</div>
      </div>`;

  if (step === 1) {
    html += `
      <div class="quiz-options" style="margin-top:16px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal);margin-bottom:4px;">What is your skin type?</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Select the option that best describes your skin on a typical day</div>`;
    const types = [
      { val: 'oily',        label: 'Oily',           desc: 'Shiny, enlarged pores, prone to breakouts' },
      { val: 'dry',         label: 'Dry',            desc: 'Tight, flaky, rough patches after cleansing' },
      { val: 'combination', label: 'Combination',    desc: 'Oily T-zone, drier cheeks and jaw' },
      { val: 'sensitive',   label: 'Sensitive',      desc: 'Reactive, redness, stinging from products' },
      { val: 'normal',      label: 'Normal',         desc: 'Balanced, minimal concerns, small pores' },
      { val: 'mature',      label: 'Mature / Ageing', desc: 'Fine lines, loss of firmness, dullness' },
    ];
    types.forEach(t => {
      const sel = faceState.skinType === t.val ? ' selected' : '';
      html += `
        <div class="quiz-option${sel}" onclick="selectFaceSkinType('${t.val}')">
          <div class="opt-dot"></div>
          <div>
            <div style="font-weight:600;font-size:15px;color:var(--charcoal);">${t.label}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">${t.desc}</div>
          </div>
        </div>`;
    });
    html += '</div>';

  } else if (step === 2) {
    const groups = [
      { title: 'Texture & Clarity', items: [
        { val: 'active_acne',     label: 'Active Acne' },
        { val: 'congestion',      label: 'Congestion' },
        { val: 'enlarged_pores',  label: 'Enlarged Pores' },
        { val: 'roughness',       label: 'Roughness' },
      ]},
      { title: 'Tone & Pigmentation', items: [
        { val: 'hyperpigmentation', label: 'Hyperpigmentation' },
        { val: 'pih',              label: 'PIH (Post-Inflammatory)' },
        { val: 'redness_rosacea',  label: 'Redness / Rosacea' },
        { val: 'dullness',         label: 'Dullness' },
      ]},
      { title: 'Ageing & Elasticity', items: [
        { val: 'fine_lines',       label: 'Fine Lines' },
        { val: 'deep_wrinkles',    label: 'Deep Wrinkles' },
        { val: 'loss_of_firmness', label: 'Loss of Firmness' },
      ]},
      { title: 'Sensitivity & Barrier', items: [
        { val: 'damaged_barrier',  label: 'Damaged Barrier' },
        { val: 'under_eye_issues', label: 'Under-Eye Issues' },
      ]},
    ];
    html += `
      <div style="margin-top:16px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal);margin-bottom:4px;">What are your skin concerns?</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Select all that apply — or skip if none</div>`;
    groups.forEach(g => {
      html += `<div class="symptom-section-card" style="margin-bottom:12px;">
        <h4>${g.title}</h4>
        <div class="duration-chips">`;
      g.items.forEach(item => {
        const sel = faceState.concerns.includes(item.val) ? ' selected' : '';
        html += `<span class="duration-chip${sel}" onclick="toggleFaceConcern('${item.val}')">${item.label}</span>`;
      });
      html += '</div></div>';
    });
    html += '</div>';

  } else if (step === 3) {
    const pulseQ = [
      { key: 'weather',     q: 'Which climate do you prefer or feel best in?',                     hint: 'Your natural comfort zone',             opts: [{ val: 'winter', label: 'Winter / Cool' }, { val: 'summer', label: 'Summer / Warm' }, { val: 'monsoon', label: 'Monsoon / Humid' }] },
      { key: 'redness',     q: 'Does your skin flush after spicy food or a hot shower?',           hint: 'Pitta sensitivity indicator',           opts: [{ val: 'yes', label: 'Yes' }, { val: 'no', label: 'No' }] },
      { key: 'pores',       q: 'Do pores look larger when tired or in humidity?',                  hint: 'Kapha congestion indicator',            opts: [{ val: 'yes', label: 'Yes' }, { val: 'no', label: 'No' }] },
      { key: 'temperature', q: 'How does your skin feel to the touch?',                            hint: 'Vata vs Pitta dominance signal',         opts: [{ val: 'cool', label: 'Cool / Dry' }, { val: 'warm', label: 'Warm / Oily' }] },
    ];
    html += `
      <div style="margin-top:16px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal);margin-bottom:4px;">Ayurvedic Skin Assessment</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">These 4 questions pinpoint your skin's dosha imbalance</div>
        <div class="symptom-section-card">`;
    pulseQ.forEach(pq => {
      html += `<div class="face-pulse-subsection">
        <div class="face-pulse-q">${pq.q}</div>
        <div class="face-pulse-hint">${pq.hint}</div>
        <div class="duration-chips">`;
      pq.opts.forEach(o => {
        const sel = faceState.pulse[pq.key] === o.val ? ' selected' : '';
        html += `<span class="duration-chip${sel}" onclick="selectFacePulse('${pq.key}','${o.val}')">${o.label}</span>`;
      });
      html += '</div></div>';
    });
    html += '</div></div>';

  } else if (step === 4) {
    const envItems = [
      { val: 'sun_exposure', label: 'Sun >2h Daily' },
      { val: 'pollution',    label: 'High Pollution' },
      { val: 'hard_water',   label: 'Hard Water' },
    ];
    const productItems = [
      { val: 'active_ingredients',   label: 'Using Actives (Retinol, AHA/BHA)' },
      { val: 'recent_treatment',     label: 'Recent Skin Treatment' },
      { val: 'inconsistent_routine', label: 'Inconsistent Routine' },
    ];
    const lifeItems = [
      { val: 'poor_sleep',    label: 'Poor Sleep (<7h)' },
      { val: 'high_stress',   label: 'High Stress' },
      { val: 'diet_triggers', label: 'Diet Triggers (Dairy/Sugar)' },
      { val: 'low_hydration', label: 'Low Hydration' },
    ];
    html += `
      <div style="margin-top:16px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal);margin-bottom:4px;">Your Lifestyle & Environment</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Helps personalise your routine — skip any that don't apply</div>
        <div class="symptom-section-card" style="margin-bottom:12px;">
          <h4>Environmental</h4>
          <div class="duration-chips">
            ${envItems.map(i => `<span class="duration-chip${faceState.lifestyle[i.val] ? ' selected' : ''}" onclick="toggleFaceLifestyle('${i.val}')">${i.label}</span>`).join('')}
          </div>
        </div>
        <div class="symptom-section-card" style="margin-bottom:12px;">
          <h4>Products</h4>
          <div class="duration-chips">
            ${productItems.map(i => `<span class="duration-chip${faceState.lifestyle[i.val] ? ' selected' : ''}" onclick="toggleFaceLifestyle('${i.val}')">${i.label}</span>`).join('')}
          </div>
        </div>
        <div class="symptom-section-card" style="margin-bottom:12px;">
          <h4>Lifestyle</h4>
          <div class="duration-chips">
            ${lifeItems.map(i => `<span class="duration-chip${faceState.lifestyle[i.val] ? ' selected' : ''}" onclick="toggleFaceLifestyle('${i.val}')">${i.label}</span>`).join('')}
          </div>
        </div>
      </div>`;

  } else if (step === 5) {
    const freqs = [
      { val: 'daily',    icon: 'wb_sunny',       title: 'Daily',      desc: 'Full morning & evening routine every day' },
      { val: 'biweekly', icon: 'event_repeat',   title: 'Bi-Weekly',  desc: 'Comprehensive routine 3–4 times per week' },
      { val: 'weekly',   icon: 'calendar_month', title: 'Weekly',     desc: 'One deep treatment session per week' },
    ];
    html += `
      <div style="margin-top:16px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal);margin-bottom:4px;">How often can you follow the routine?</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">We'll tailor the steps to your schedule</div>
        <div class="face-frequency-options">
          ${freqs.map(f => `
            <div class="face-freq-option${faceState.frequency === f.val ? ' selected' : ''}" onclick="selectFaceFrequency('${f.val}')">
              <span class="mio face-freq-icon">${f.icon}</span>
              <div>
                <div class="face-freq-title">${f.title}</div>
                <div class="face-freq-desc">${f.desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  const nextLabel = step === 5 ? 'Generate My Routine →' : 'Next →';
  const disabled = _faceNextDisabled(step) ? ' style="opacity:0.4;pointer-events:none;"' : '';
  html += `
    <div class="face-nav">
      ${step > 1 ? '<button class="btn-back" onclick="facePrevStep()"><span class="mi">arrow_back</span></button>' : ''}
      <button class="btn-primary" id="face-next-btn" onclick="faceNextStep()"${disabled}>${nextLabel}</button>
    </div>
  </div>`;

  el('face-q-container').innerHTML = html;
  requestAnimationFrame(() => { el('app-content').scrollTop = 0; });
}

function _faceNextDisabled(step) {
  if (step === 1) return !faceState.skinType;
  if (step === 3) return !faceState.pulse.weather || !faceState.pulse.redness || !faceState.pulse.pores || !faceState.pulse.temperature;
  if (step === 5) return !faceState.frequency;
  return false;
}

function selectFaceSkinType(type) {
  faceState.skinType = type;
  renderFaceStep(1);
}

function toggleFaceConcern(concern) {
  const idx = faceState.concerns.indexOf(concern);
  if (idx === -1) faceState.concerns.push(concern);
  else faceState.concerns.splice(idx, 1);
  renderFaceStep(2);
}

function toggleFaceLifestyle(key) {
  faceState.lifestyle[key] = !faceState.lifestyle[key];
  renderFaceStep(4);
}

function selectFacePulse(key, value) {
  faceState.pulse[key] = value;
  renderFaceStep(3);
}

function selectFaceFrequency(val) {
  faceState.frequency = val;
  renderFaceStep(5);
}

function facePrevStep() {
  if (faceState.step > 1) {
    faceState.step--;
    renderFaceStep(faceState.step);
  }
}

function faceNextStep() {
  if (_faceNextDisabled(faceState.step)) return;
  if (faceState.step === 2 && faceState.concerns.length === 0) {
    showToast('No concerns selected — we\'ll give a general routine');
  }
  if (faceState.step === 5) {
    generateFaceRoutine();
    return;
  }
  faceState.step++;
  renderFaceStep(faceState.step);
}

async function generateFaceRoutine() {
  const d = loadData();
  if (!d.settings || !d.settings.openaiApiKey) { showToast('Add API key in Settings'); return; }

  el('face-q-container').innerHTML = `
    <div class="loading-card">
      <div class="loading-spinner"></div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal);margin:16px 0 6px;">Crafting your routine…</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Analysing your dosha and skin profile</div>
      <div class="loading-bar-track"><div class="loading-bar-fill"></div></div>
      <div class="loading-steps" style="margin-top:16px;">
        <div class="loading-step active"><div class="ls-icon"><span class="mi">psychology</span></div><div>Reading your dosha</div></div>
        <div class="loading-step"><div class="ls-icon"><span class="mi">science</span></div><div>Selecting ingredients</div></div>
        <div class="loading-step"><div class="ls-icon"><span class="mi">auto_awesome</span></div><div>Building routine</div></div>
      </div>
    </div>`;

  const month = new Date().toLocaleString('default', { month: 'long' });
  const dosha = d.dosha.primary;
  const doshaSecondary = d.dosha.secondary ? `, secondary ${d.dosha.secondary}` : '';
  const age = d.age || (d.birthDate ? (new Date().getFullYear() - new Date(d.birthDate).getFullYear()) : null);
  const concernsText = faceState.concerns.length > 0
    ? faceState.concerns.map(c => c.replace(/_/g, ' ')).join(', ')
    : 'none specified';
  const lifestyleFlags = Object.entries(faceState.lifestyle)
    .filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' ')).join(', ') || 'none';
  const pulseText = [
    `climate preference: ${faceState.pulse.weather}`,
    `flushes after hot food/shower: ${faceState.pulse.redness}`,
    `pores enlarge in humidity: ${faceState.pulse.pores}`,
    `skin temperature: ${faceState.pulse.temperature}`,
  ].join('; ');
  const freqMap = { daily: 'daily (morning + evening)', biweekly: '3-4 times per week', weekly: 'once per week' };

  const prompt = `You are an expert Ayurvedic dermatologist. Create a personalised facial skincare routine.

User profile:
- Dosha: ${dosha}${doshaSecondary}
- Age: ${age ? age + ' years' : 'not specified'}
- Gender: ${d.gender || 'unspecified'}
- Current month: ${month}
- Skin type: ${faceState.skinType}
- Skin concerns: ${concernsText}
- Ayurvedic pulse assessment: ${pulseText}
- Lifestyle factors: ${lifestyleFlags}
- Routine frequency: ${freqMap[faceState.frequency] || faceState.frequency}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "dominantSkinDosha": "Vata|Pitta|Kapha",
  "skinProfile": "2-sentence skin profile summary",
  "imbalanceExplanation": "2-sentence explanation of current imbalance based on inputs",
  "morningRoutine": [{"step":1,"name":"","duration":"","ingredients":[],"method":"","doshaNote":""}],
  "eveningRoutine": [{"step":1,"name":"","duration":"","ingredients":[],"method":"","doshaNote":""}],
  "weeklyTreatments": [{"name":"","frequency":"","ingredients":[],"method":"","benefit":""}],
  "dietaryTips": [],
  "avoidList": [],
  "mantra": ""
}

Include 4-6 morning steps, 4-6 evening steps, 2-3 weekly treatments, 4 dietary tips, 4-6 avoid items.
Tailor all recommendations to the user's dosha, skin type, concerns, and current season (${month}).`;

  try {
    const resp = await callOpenAILarge(prompt, d.settings.openaiApiKey, 2000);
    const data = JSON.parse(resp.replace(/```json|```/g, '').trim());
    setData('faceRoutine', { inputs: Object.assign({}, faceState), result: data, generatedAt: new Date().toISOString() });
    if (el('face-reset-btn')) el('face-reset-btn').style.display = 'block';
    renderFaceRoutine(data);
  } catch(e) {
    logError('generateFaceRoutine', e);
    showToast('Error generating routine: ' + e.message);
    renderFaceQuestionnaire();
  }
}

function renderFaceRoutine(data) {
  const mkChips = (arr) => (arr || []).map(i => `<span class="face-ingredient-chip">${i}</span>`).join('');

  const mkSteps = (steps) => (steps || []).map(s => `
    <div class="face-step-card">
      <div class="face-step-header">
        <div class="face-step-num">${s.step}</div>
        <div class="face-step-name">${s.name}</div>
        <div class="face-duration-badge">${s.duration}</div>
      </div>
      ${s.ingredients && s.ingredients.length ? `<div class="face-ingredients">${mkChips(s.ingredients)}</div>` : ''}
      <div class="face-method">${s.method}</div>
      ${s.doshaNote ? `<div class="face-dosha-note"><span class="mio" style="font-size:14px;vertical-align:middle;margin-right:4px;">info</span>${s.doshaNote}</div>` : ''}
    </div>`).join('');

  const mkWeekly = (treatments) => (treatments || []).map(t => `
    <div class="face-weekly-card">
      <div class="face-weekly-name">${t.name}</div>
      <div class="face-weekly-freq"><span class="mio" style="font-size:13px;vertical-align:middle;margin-right:3px;">schedule</span>${t.frequency}</div>
      ${t.ingredients && t.ingredients.length ? `<div class="face-ingredients" style="margin-bottom:8px;">${mkChips(t.ingredients)}</div>` : ''}
      <div class="face-method">${t.method}</div>
      ${t.benefit ? `<div class="face-dosha-note">${t.benefit}</div>` : ''}
    </div>`).join('');

  el('face-wrap').innerHTML = `
    <div class="face-hero-card">
      <span class="face-dosha-chip">${data.dominantSkinDosha} Skin Type</span>
      <h2>${data.skinProfile}</h2>
      <p>${data.imbalanceExplanation}</p>
    </div>

    <div class="face-routine-section"><span class="mio">wb_sunny</span> Morning Routine</div>
    ${mkSteps(data.morningRoutine)}

    <div class="face-routine-section"><span class="mio">nights_stay</span> Evening Routine</div>
    ${mkSteps(data.eveningRoutine)}

    <div class="face-routine-section"><span class="mio">spa</span> Weekly Treatments</div>
    ${mkWeekly(data.weeklyTreatments)}

    <div class="face-routine-section"><span class="mio">restaurant</span> Dietary Tips</div>
    <div class="face-tip-card">
      <ul>${(data.dietaryTips || []).map(t => `<li>${t}</li>`).join('')}</ul>
    </div>

    <div class="face-avoid-card">
      <h4><span class="mio" style="font-size:18px;vertical-align:middle;margin-right:6px;">block</span>Avoid List</h4>
      <ul>${(data.avoidList || []).map(a => `<li>${a}</li>`).join('')}</ul>
    </div>

    ${data.mantra ? `<div class="dina-wisdom-card" style="margin-top:8px;"><div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;margin-bottom:6px;color:#fff;">Ayurvedic Mantra</div><div style="font-style:italic;font-size:15px;color:rgba(255,255,255,0.88);line-height:1.5;">"${data.mantra}"</div></div>` : ''}

    <button class="btn-secondary" onclick="resetFaceRoutine()" style="width:100%;margin-top:16px;">
      <span class="mi">refresh</span> Start Over
    </button>`;

  requestAnimationFrame(() => { el('app-content').scrollTop = 0; });
}

function resetFaceRoutine() {
  setData('faceRoutine', null);
  faceState = { step: 1, skinType: null, concerns: [], pulse: { weather: null, redness: null, pores: null, temperature: null }, lifestyle: {}, frequency: null };
  if (el('face-reset-btn')) el('face-reset-btn').style.display = 'none';
  renderFaceQuestionnaire();
}
