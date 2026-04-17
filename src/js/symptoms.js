  herbState.chatHistory.push({role:'user', text: msg});
  herbState.chatLoading = true;

  const sendBtn = el('herb-send-btn');
  if(sendBtn) { sendBtn.disabled=true; sendBtn.innerHTML='<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0;"></span>'; }

  updateChatDisplay();

  const ctx = buildHerbContext();
  const history = herbState.chatHistory
    .slice(-8)
    .map(m=>({role: m.role==='user'?'user':'assistant', content: m.text.replace(/<[^>]+>/g,'')}));

  const systemPrompt = `You are an expert Ayurvedic Vaidya and herbalist. The user's profile:
- Dosha: ${ctx.dosha} (Vata ${ctx.scores.Vata||0}%, Pitta ${ctx.scores.Pitta||0}%, Kapha ${ctx.scores.Kapha||0}%)
- Ailments: ${ctx.ailments}
- City: ${ctx.city}, Month: ${ctx.month}

Answer herb and supplement questions from a classical Ayurvedic perspective. Be specific, practical, and always mention dosage, form, and timing. Flag any safety concerns. Keep answers concise (3-5 sentences). Never recommend stopping prescribed medications.`;

  // Create streaming bubble directly in DOM
  const chatEl = el('herb-chat-history');
  const streamBubble = document.createElement('div');
  streamBubble.className = 'chat-bubble ai streaming';
  chatEl?.appendChild(streamBubble);
  scrollChatToBottom();

  try {
    const aiText = await callOpenAIChatStream(
      [{role:'system',content:systemPrompt},...history],
      ctx.apiKey, 500,
      (accumulated) => { streamBubble.textContent = accumulated; scrollChatToBottom(); }
    );
    streamBubble.remove();
    herbState.chatHistory.push({role:'ai', text: aiText});
  } catch(e) {
    const type = classifyApiError(e);
    setApiErrorState(true);
    logError('sendHerbChat', e);
    const chatMsgs = {
      quota: 'Your OpenAI credits have run out. Please top up at platform.openai.com to continue.',
      invalid_key: 'Your API key is invalid. Please update it in Settings.',
      rate_limit: 'Too many requests — please wait a moment and try again.',
      network: 'No internet connection. Please check your network.',
      unknown: `Could not connect right now. (${e.message})`
    };
    streamBubble.remove();
    herbState.chatHistory.push({role:'ai', text: chatMsgs[type] || chatMsgs.unknown});
  } finally {
    herbState.chatLoading = false;
    if(sendBtn){sendBtn.disabled=false;sendBtn.innerHTML='<span class="mi" style="font-size:20px;">send</span>';}
    updateChatDisplay();
  }
}

function updateChatDisplay() {
  const h = el('herb-chat-history');
  if(h) { h.innerHTML = renderChatBubbles(); scrollChatToBottom(); }
}

function resetHerbAdvisor() {
  herbState = { mode:null, selectedConcerns:[], chatHistory:[], chatLoading:false, resultsShown:false };
  el('herb-reset-btn').style.display='none';
  const d = loadData();
  renderHerbHome(d);
  el('app-content').scrollTop=0;
}




// ══════════════════════════════════════════
//  MEAL TIMING WIDGET
// ══════════════════════════════════════════
window._mealTimingMode = 'now';
window._activeAilments = [];

function toggleAdvFilters() {
  const panel = el('adv-filters-panel');
  const btn = el('adv-filters-btn');
  const chevron = el('adv-chevron');
  if(!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  btn?.classList.toggle('open', !isOpen);
  if(chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  if(!isOpen) { initMealTiming(); initAdvAilmentChips(); }
}

function initAdvAilmentChips() {
  const container = el('adv-ailment-chips');
  if(!container) return;
  container.innerHTML = COMMON_AILMENTS.map(name=>{
    const active = window._activeAilments.includes(name);
    const safe = name.replace(/'/g,'&apos;');
    return `<div class="adv-ailment-chip ${active?'selected':''}" onclick="toggleActiveAilment('${safe}')">
      ${active?'<span class="mi" style="font-size:13px;margin-right:3px;">check</span>':''}${name}
    </div>`;
  }).join('');
}

function toggleActiveAilment(name) {
  if(window._activeAilments.includes(name)) {
    window._activeAilments = window._activeAilments.filter(a=>a!==name);
  } else {
    window._activeAilments.push(name);
  }
  initAdvAilmentChips();
}

function initMealTiming() {
  // Set date input min to today, default to today
  const dateInput = el('meal-plan-date');
  if(!dateInput) return;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  dateInput.min = todayStr;
  dateInput.value = todayStr;

  // Populate hour select (0–23 as 12h format with AM/PM)
  const hourSel = el('meal-plan-hour');
  if(hourSel) {
    hourSel.innerHTML = '';
    for(let h=0;h<24;h++) {
      const ampm = h>=12?'PM':'AM';
      const h12 = h%12||12;
      const endH = (h+1)%24;
      const endAmpm = endH>=12?'PM':'AM';
      const endH12 = endH%12||12;
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = `${h12}:00 ${ampm} – ${endH12}:00 ${endAmpm}`;
      if(h === today.getHours()) opt.selected = true;
      hourSel.appendChild(opt);
    }
  }

  // Update the "now" preview text
  const nowDisp = el('meal-now-time-display');
  if(nowDisp) {
    const t = today.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const day = today.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'});
    nowDisp.textContent = `Using current time — ${day}, ${t}`;
  }
  updatePlanPreview();
}

function setTimingMode(mode) {
  window._mealTimingMode = mode;
  const nowBtn = el('mtt-now');
  const planBtn = el('mtt-plan');
  const nowPreview = el('meal-timing-now-preview');
  const planPicker = el('meal-timing-plan-picker');
  if(mode === 'now') {
    nowBtn?.classList.add('active');
    planBtn?.classList.remove('active');
    nowPreview && (nowPreview.style.display='flex');
    planPicker && (planPicker.style.display='none');
  } else {
    planBtn?.classList.add('active');
    nowBtn?.classList.remove('active');
    nowPreview && (nowPreview.style.display='none');
    planPicker && (planPicker.style.display='block');
    updatePlanPreview();
  }
}

function updatePlanPreview() {
  const dateVal = el('meal-plan-date')?.value;
  const hourVal = el('meal-plan-hour')?.value;
  const preview = el('meal-plan-preview');
  const previewText = el('meal-plan-preview-text');
  if(!preview || !previewText) return;
  if(!dateVal || hourVal===undefined || hourVal==='') {
    previewText.textContent = 'Select a date and time window above';
    return;
  }
  const d = new Date(dateVal+'T12:00:00'); // noon to avoid TZ issues for display
  const dayName = d.toLocaleString('default',{weekday:'long'});
  const dateDisplay = d.toLocaleDateString([],{day:'numeric',month:'long',year:'numeric'});
  const h = parseInt(hourVal);
  const ampm = h>=12?'PM':'AM';
  const h12 = h%12||12;
  const endH = (h+1)%24;
  const endAmpm = endH>=12?'PM':'AM';
  const endH12 = endH%12||12;
  const isToday = dateVal === new Date().toISOString().split('T')[0];
  const isTomorrow = dateVal === new Date(Date.now()+86400000).toISOString().split('T')[0];
  const dayLabel = isToday?'Today':isTomorrow?'Tomorrow':dayName;
  previewText.textContent = `${dayLabel}, ${dateDisplay} · ${h12}:00 ${ampm} – ${endH12}:00 ${endAmpm}`;
}

// ══════════════════════════════════════════
//  SYMPTOM CHECKER
// ══════════════════════════════════════════

const BODY_AREAS = [
  { id:'head',    icon:'face',                  label:'Head / Mind'     },
  { id:'gut',     icon:'lunch_dining',           label:'Gut / Digestion' },
  { id:'skin',    icon:'back_hand',              label:'Skin'             },
  { id:'joints',  icon:'accessibility_new',      label:'Joints / Body'   },
  { id:'energy',  icon:'battery_charging_full',  label:'Energy'          },
  { id:'sleep',   icon:'bedtime',                label:'Sleep'            },
  { id:'chest',   icon:'favorite',               label:'Chest / Heart'   },
  { id:'throat',  icon:'record_voice_over',      label:'Throat / Nose'   },
  { id:'mood',    icon:'mood_bad',               label:'Mood / Emotion'  },
];

const DURATIONS = ['Today','2–3 days','1 week','2+ weeks','1+ month','Chronic'];

let symptomState = {
  selectedAreas:[],
  duration:null,
  severity:5,
  description:'',
  resultShown:false
};

function initSymptomChecker() {
  if(!symptomState.resultShown) renderSymptomHome();
}

function renderSymptomHome() {
  const d = loadData();
  const dosha = d.dosha?.primary||null;
  el('symptom-wrap').innerHTML = `
    <div class="symptom-hero">
      <div class="symptom-hero-label">Ayurvedic Symptom Analysis</div>
      <div class="symptom-hero-title">How are you<br>feeling today?</div>
      <div class="symptom-hero-sub">Describe your symptoms and get a personalised Ayurvedic root-cause analysis with actionable remedies.</div>
      ${dosha?`<div class="symptom-hero-chip"><span class="mio" style="font-size:14px;vertical-align:-2px;">spa</span> ${dosha} Dosha Profile Loaded</div>`:''}
    </div>

    <div class="symptom-section-card">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">touch_app</span> Where do you feel it?</h4>
      <div class="body-areas-grid">
        ${BODY_AREAS.map(a=>`
          <div class="body-area-chip ${symptomState.selectedAreas.includes(a.id)?'selected':''}" id="ba-${a.id}" onclick="toggleBodyArea('${a.id}')">
            <span class="mio ba-icon">${a.icon}</span>
            <span class="ba-label">${a.label}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="symptom-section-card">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">edit_note</span> Describe your symptoms</h4>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.5;">Be specific — include when it started, what makes it worse or better, and any patterns.</p>
      <textarea class="food-textarea" id="symptom-desc" style="height:110px;" placeholder="e.g. Sharp burning in stomach after meals, worse in afternoon, with acidity and bloating…">${symptomState.description}</textarea>
    </div>

    <div class="symptom-section-card">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">schedule</span> How long have you had this?</h4>
      <div class="duration-chips">
        ${DURATIONS.map(dur=>`
          <div class="duration-chip ${symptomState.duration===dur?'selected':''}" onclick="selectDuration('${dur}')" id="dur-${dur.replace(/[^a-z0-9]/gi,'')}">${dur}</div>`).join('')}
      </div>
    </div>

    <div class="symptom-section-card">
      <h4><span class="mi" style="font-size:19px;color:#4A2060;">signal_cellular_alt</span> How severe is it?</h4>
      <div class="severity-row">
        <span class="severity-label">Mild</span>
        <input type="range" class="severity-slider" id="severity-slider" min="1" max="10" value="${symptomState.severity}" oninput="updateSeverity(this.value)"/>
        <span class="severity-label">Severe</span>
        <span class="severity-val" id="severity-val">${symptomState.severity}/10</span>
      </div>
    </div>

    <button class="btn-primary" style="width:100%;padding:16px;" onclick="runSymptomCheck()">
      <span class="mi" style="font-size:18px;vertical-align:-4px;margin-right:6px;">biotech</span>Analyse My Symptoms
    </button>
    <div id="symptom-result-area" style="margin-top:14px;"></div>
  `;
}

function toggleBodyArea(id) {
  if(symptomState.selectedAreas.includes(id)) {
    symptomState.selectedAreas = symptomState.selectedAreas.filter(a=>a!==id);
    el('ba-'+id)?.classList.remove('selected');
  } else {
    symptomState.selectedAreas.push(id);
    el('ba-'+id)?.classList.add('selected');
  }
}

function selectDuration(dur) {
  symptomState.duration = dur;
  document.querySelectorAll('.duration-chip').forEach(c=>c.classList.remove('selected'));
  el('dur-'+dur.replace(/[^a-z0-9]/gi,''))?.classList.add('selected');
}

function updateSeverity(val) {
  symptomState.severity = parseInt(val);
  const sv = el('severity-val');
  if(sv) sv.textContent = val+'/10';
}

async function runSymptomCheck() {
  const desc = (el('symptom-desc')?.value||'').trim();
  if(!desc) { showToast('Please describe your symptoms first'); return; }
  if(!symptomState.selectedAreas.length) { showToast('Please select at least one body area'); return; }