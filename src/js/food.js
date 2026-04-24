    <button class="btn-secondary" style="margin-bottom:32px;" onclick="retakeQuiz()"><span class="mi" style="font-size:16px;vertical-align:-3px;margin-right:5px;">replay</span>Retake Full Quiz</button>
  `;
}

// ══════════════════════════════════════════
//  FOOD CHECK
// ══════════════════════════════════════════
async function checkFood() {
  const food = el('food-input').value.trim();
  if(!food) { showToast('Please enter what you plan to eat'); return; }
  const d = loadData();
  if(!d.settings?.openaiApiKey) {
    showToast('Please add your OpenAI API key in Settings first'); return;
  }
  if(!d.dosha) {
    showToast('Please complete the Dosha Quiz first'); return;
  }

  // ── Resolve meal datetime from timing widget ──
  const timingMode = window._mealTimingMode || 'now';
  let mealDate;
  if(timingMode === 'plan') {
    const dateVal = el('meal-plan-date')?.value;
    const hourVal = el('meal-plan-hour')?.value;
    if(!dateVal || hourVal === undefined || hourVal === '') {
      showToast('Please select a date and time for your planned meal'); return;
    }
    mealDate = new Date(dateVal + 'T' + String(hourVal).padStart(2,'0') + ':30:00');
    if(isNaN(mealDate.getTime())) { showToast('Invalid date or time selected'); return; }
  } else {
    mealDate = new Date();
  }

  const isPlanned = timingMode === 'plan';
  const month = mealDate.toLocaleString('default',{month:'long'});
  const dayName = mealDate.toLocaleString('default',{weekday:'long'});
  const dateStr = mealDate.toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'});
  const hour = mealDate.getHours();
  const hourEnd = (hour + 1) % 24;
  const fmt = h => { const ampm=h>=12?'PM':'AM'; const h12=h%12||12; return h12+':00 '+ampm; };
  const timeRange = isPlanned ? `${fmt(hour)} – ${fmt(hourEnd)}` : mealDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const timeContext = isPlanned
    ? `Planned meal on ${dayName}, ${dateStr} between ${timeRange}`
    : `Right now at ${timeRange}`;
  el('food-result-area').innerHTML = `
    <div class="loading-card">
      <span class="loading-lotus">🪷</span>
      <div class="loading-title">${isPlanned ? 'Analysing Planned Meal' : 'Consulting Ayurvedic Wisdom'}</div>
      <div class="loading-sub">${isPlanned ? `Checking compatibility for ${timeRange} on ${dateStr}…` : 'Analysing your food against your dosha,<br>ailments &amp; current season…'}</div>
      <div class="loading-bar-track"><div class="loading-bar-fill"></div></div>
      <div class="loading-steps">
        <div class="loading-step active" id="ls1">
          <div class="ls-icon"><span class="mi" style="font-size:15px;">person</span></div>
          Reading your dosha profile
        </div>
        <div class="loading-step" id="ls2">
          <div class="ls-icon"><span class="mi" style="font-size:15px;">cloud</span></div>
          Checking seasonal &amp; climate context
        </div>
        <div class="loading-step" id="ls3">
          <div class="ls-icon"><span class="mi" style="font-size:15px;">restaurant</span></div>
          Evaluating food compatibility
        </div>
        <div class="loading-step" id="ls4">
          <div class="ls-icon"><span class="mi" style="font-size:15px;">auto_awesome</span></div>
          Preparing your recommendations
        </div>
      </div>
    </div>`;
  // Hide input and hero while loading
  el('food-input-card').style.display = 'none';
  el('food-hero').style.display = 'none';
  // Animate steps sequentially
  const steps = ['ls1','ls2','ls3','ls4'];
  steps.forEach((id,i)=>{
    setTimeout(()=>{
      if(i>0) { const prev=el(steps[i-1]); if(prev){prev.classList.remove('active');prev.classList.add('done');prev.querySelector('.ls-icon').innerHTML='<span class="mi" style="font-size:15px;color:white;">check</span>';} }
      const cur=el(id); if(cur) cur.classList.add('active');
    }, i*700);
  });
  el('food-alt-area').innerHTML='';
  el('cuisine-section').style.display='none';
  el('food-reset-btn').style.display = 'none';
  // Hide hero while result is showing
  const heroEl = el('food-hero');
  if(heroEl) heroEl.style.display = 'none';

  const dosha = d.dosha.primary;
  // Merge saved ailments + any active overrides selected in Advanced Filters
  const activeAilments = window._activeAilments || [];
  const baseAilments = d.ailments || [];
  const allAilments = [...new Set([...baseAilments, ...activeAilments])];
  const ailments = allAilments.length ? allAilments.join(', ') : 'None';
  const city = d.city||'unknown location';
  const age = getUserAge();
  const gender = d.gender || '';

  const prompt = `You are an expert Ayurvedic nutritionist. The user wants to know if a food or drink is suitable for a specific meal time.

User Profile:
- Primary Dosha: ${dosha} (Scores: Vata ${d.dosha.scores?.Vata||0}%, Pitta ${d.dosha.scores?.Pitta||0}%, Kapha ${d.dosha.scores?.Kapha||0}%)
- Age: ${age ? age + ' years' : 'unknown'}
- Gender: ${gender || 'Not specified'}
- Ailments (chronic + currently active): ${ailments}
- City: ${city}
- Meal context: ${timeContext}
- Month: ${month} (infer the likely season and weather for this city and month)
- Dosha dietary rules: ${buildDoshaRules(dosha)}

Item to analyse: "${food}"

First, classify the item:
- "item_type": "food", "drink", or "snack"
- "food_category": the specific category e.g. "Herbal Drink", "Grain", "Vegetable", "Dairy", "Fruit", "Snack", "Beverage", "Legume" etc.

If verdict is YES, analyse the item for nutritional gaps and suggest what to ADD to make it complete. Also provide top 3 do's and top 3 don'ts specific to consuming this item. For do/don't tips: use "sip"/"drink"/"consume" for drinks, "chew"/"eat" for solid foods.

If verdict is NO, suggest exactly 4 alternatives that are of the SAME category as the input item (e.g. if the input is a herbal drink, all 4 alternatives must be drinks or herbal beverages — NOT solid foods). Also provide the best time window(s) in the day when this specific item WOULD be suitable (give 1-3 time ranges like "7:00 AM – 8:00 AM" or "12:00 PM – 1:00 PM").

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "verdict": "YES" or "NO",
  "item_type": "food" or "drink" or "snack",
  "food_category": "e.g. Herbal Drink",
  "reason": "One sentence explaining why (mention dosha, time of day, and seasonal factor)",
  "meal_boosters": [
    {
      "nutrient": "Nutrient type e.g. Protein / Fibre / Healthy Fat",
      "item": "Specific item to add e.g. A handful of roasted chickpeas",
      "quantity": "Exact bowl/spoon/cup size e.g. 1 small bowl (100g)",
      "why": "One short reason why this addition helps"
    }
  ],
  "dos": [
    {"action": "Short do tip — use sip/consume for drinks, chew/eat for solids", "reason": "Why"},
    {"action": "Short do tip", "reason": "Why"},
    {"action": "Short do tip", "reason": "Why"}
  ],
  "donts": [
    {"action": "Short don't tip — use sip/consume for drinks, chew/eat for solids", "reason": "Why"},
    {"action": "Short don't tip", "reason": "Why"},
    {"action": "Short don't tip", "reason": "Why"}
  ],
  "alternatives": [
    {"dish": "Item name (same category as input)", "why": "Short reason why it is safe"},
    {"dish": "Item name (same category as input)", "why": "Short reason why it is safe"},
    {"dish": "Item name (same category as input)", "why": "Short reason why it is safe"},
    {"dish": "Item name (same category as input)", "why": "Short reason why it is safe"}
  ],
  "better_times": [
    {"range": "e.g. 7:00 AM – 8:00 AM", "reason": "Why this time is better for this item and dosha"}
  ]
}

Note: populate meal_boosters, dos, donts when verdict=YES. Populate alternatives and better_times when verdict=NO. Always include all keys but empty arrays are fine for unused sections.`;

  try {
    const resp = await callOpenAILarge(prompt, d.settings.openaiApiKey, 1800);
    const raw = resp.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    const generatedAt = new Date().toISOString();
    // Save full result to localStorage
    saveFoodCache({ food, result, timeContext, isPlanned, generatedAt });
    showFoodResult(food, result, timeContext, isPlanned, generatedAt);
    saveFoodHistory(food, result.verdict, result.reason, timeContext, isPlanned);
    renderHistory();
    renderHomeHistory();
  } catch(e) {
    el('food-result-area').innerHTML = buildApiErrHTML(e, 'checkFood', 'checkFood()');
    el('food-input-card').style.display = 'block';
    el('food-hero').style.display = 'block';
    el('food-reset-btn').style.display = 'none';
  }
}

// ── FOOD CHECK CACHE ──
const FOOD_CACHE_KEY = 'ayurai_food_cache';

let _remedyLoading = false;

function loadFoodCache() {
  try {
    const raw = localStorage.getItem(FOOD_CACHE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveFoodCache(obj) {
  try { localStorage.setItem(FOOD_CACHE_KEY, JSON.stringify(obj)); } catch {}
}

function clearFoodCache() {
  localStorage.removeItem(FOOD_CACHE_KEY);
}

function initFoodCheck() {
  const cache = loadFoodCache();
  if(cache && cache.result && cache.food) {
    // Restore cached result — no API call needed
    showFoodResult(cache.food, cache.result, cache.timeContext, cache.isPlanned, cache.generatedAt);
  } else {
    showFoodInput();
  }
}

function showFoodInput() {
  // Show input UI, hide result areas
  el('food-hero').style.display = 'block';
  el('food-input-card').style.display = 'block';
  el('food-api-warning').style.display = loadData().settings?.openaiApiKey ? 'none' : 'block';
  el('food-result-area').innerHTML = '';
  el('food-alt-area').innerHTML = '';
  el('cuisine-section').style.display = 'none';
  el('food-reset-btn').style.display = 'none';
  // Collapse advanced filters
  const panel = el('adv-filters-panel');
  const chevron = el('adv-chevron');
  if(panel) panel.style.display = 'none';
  if(chevron) chevron.style.transform = '';
  el('app-content').scrollTop = 0;
}

function showFoodResult(food, result, timeContext, isPlanned, generatedAt) {
  // Restore in-memory state so getRemedy() works after cache restore
  window._lastCheckedFood = food;
  // Hide input UI, show result full-screen
  el('food-hero').style.display = 'none';
  el('food-input-card').style.display = 'none';
  el('food-api-warning').style.display = 'none';
  el('food-reset-btn').style.display = 'flex';
  renderFoodResult(result, food, timeContext, isPlanned, generatedAt);
  // Restore remedy card if previously fetched
  const cache = loadFoodCache();
  if(cache?.remedy && cache.food === food) {
    renderRemedyCard(cache.remedy);
    const b = el('rescue-btn');
    if(b) {
      b.disabled = false;
      b.innerHTML = '<span class="mi" style="font-size:16px;">refresh</span> Refresh Remedies';
    }
  }
  el('app-content').scrollTop = 0;
}



function renderFoodResult(r, food, timeContext, isPlanned, generatedAt) {
  const yes = r.verdict==='YES';
  window._lastCheckedFood = food;

  el('food-result-area').innerHTML = `
    <div class="result-banner ${yes?'yes':'no'}">
      <div class="rb-body">

        <!-- Food + time context row -->
        <div class="rb-food-row">
          <div class="rb-food-name">
            <span class="mi rb-food-icon">restaurant</span>${food}
          </div>
          <div class="rb-time-context ${isPlanned?'planned':'now'}">
            <span class="mi" style="font-size:12px;">${isPlanned?'event':'bolt'}</span>
            ${isPlanned?'Planned':'Now'}
          </div>
        </div>

        <!-- Time detail (planned only) -->
        ${isPlanned ? `
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;display:flex;align-items:center;gap:5px;">
          <span class="mi" style="font-size:14px;color:var(--text-light);">schedule</span>
          ${timeContext}
        </div>` : ''}

        <!-- Verdict -->
        <div class="rb-verdict-row">
          <div class="rb-icon">
            <span class="mi" style="font-size:32px;color:${yes?'#2A7A3A':'#B03020'};">${yes?'check_circle':'cancel'}</span>
          </div>
          <div class="rb-title">${yes?'Yes, Go Ahead!':'Not Ideal at This Time'}</div>
        </div>

        <!-- Reason -->
        <div class="rb-reason">${r.reason}</div>

        ${!yes ? `
        <button class="rescue-btn" id="rescue-btn" onclick="getRemedy()" style="margin-top:14px;">
          <span class="mi" style="font-size:16px;">shield</span> Going ahead anyway — how to reduce the impact?
        </button>` : ''}

      </div>
    </div>
    <div id="remedy-area"></div>
  `;

  if(yes) {
    // ── YES: Meal Boosters cards ──
    let boostersHTML = '';
    if(r.meal_boosters && r.meal_boosters.length) {
      boostersHTML = `
        <div class="alt-table-card">
          <h4><span class="mi" style="font-size:20px;vertical-align:-4px;margin-right:6px;color:var(--gold);">add_shopping_cart</span>Complete Your Meal</h4>
          <p class="alt-table-sub">Add these to fill nutritional gaps and balance your dosha.</p>
          <div class="booster-list">
            ${r.meal_boosters.map(b=>`
              <div class="booster-item">
                <div class="booster-nutrient">${b.nutrient}</div>
                <div class="booster-right">
                  <div class="booster-item-name">${b.item}</div>
                  <div class="booster-why">${b.why}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="booster-personalise-link" id="booster-personalise-link" onclick="togglePersonalisePanel()"><span class="mio">auto_fix_high</span> Personalise these suggestions ›</div>
          <div class="booster-personalise-panel" id="booster-personalise-panel" style="display:none;"><div class="booster-personalise-label">Any preferences or restrictions?</div><textarea id="booster-personalise-input" class="booster-personalise-textarea" rows="2" placeholder="e.g. no dairy, don\'t have spinach, prefer something light…"></textarea><button class="btn-personalise-boosters" id="btn-personalise-boosters" onclick="refineBoostersWithContext()"><span class="mio">auto_fix_high</span> Get Better Suggestions</button></div>
        </div>`;
    }

    // ── YES: Do's & Don'ts table ──
    let dosdontsHTML = '';
    if((r.dos && r.dos.length) || (r.donts && r.donts.length)) {
      const maxRows = Math.max((r.dos||[]).length, (r.donts||[]).length);
      let rows = '';
      for(let i=0;i<maxRows;i++) {
        const d = r.dos?.[i];
        const dn = r.donts?.[i];
        rows += `<tr>
          ${d ? `<td>
            <div class="dosdonts-action do-action"><span class="mi" style="font-size:14px;vertical-align:-2px;margin-right:3px;">check_circle</span> ${d.action}</div>
            <div class="dosdonts-reason">${d.reason}</div>
          </td>` : '<td></td>'}
          ${dn ? `<td>
            <div class="dosdonts-action dont-action"><span class="mi" style="font-size:14px;vertical-align:-2px;margin-right:3px;">block</span> ${dn.action}</div>
            <div class="dosdonts-reason">${dn.reason}</div>
          </td>` : '<td></td>'}
        </tr>`;
      }
      dosdontsHTML = `
        <div class="alt-table-card">
          <h4><span class="mi" style="font-size:20px;vertical-align:-4px;margin-right:6px;color:var(--burgundy);">checklist</span>Do's &amp; Don'ts After Consuming</h4>
          <p class="alt-table-sub">Follow these for best digestion and dosha balance.</p>
          <table class="alt-table dosdonts-table">
            <thead>
              <tr>
                <th style="color:#1A6B3A;font-size:12px;letter-spacing:0.5px;">✔ Do's</th>
                <th style="color:#8B1A1A;font-size:12px;letter-spacing:0.5px;">✖ Don'ts</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    el('food-alt-area').innerHTML = boostersHTML + dosdontsHTML;

  } else {
    // ── NO: Better time recommendation + Alternative dishes ──
    let noHTML = '';

    // Better times card
    if(r.better_times && r.better_times.length) {
      const slotsHTML = r.better_times.map(bt=>`
        <div class="better-time-slot">
          <span class="mi">schedule</span> ${bt.range}
          <span style="font-size:11px;font-weight:400;color:#2A6AB0;margin-left:4px;">— ${bt.reason}</span>
        </div>`).join('');
      noHTML += `
        <div class="better-time-card">
          <h4><span class="mi" style="font-size:20px;">wb_twilight</span> Better Times to Consume This</h4>
          <p>This food suits your dosha better at these times. Plan your meal then for the best results.</p>
          <div class="better-time-slots">${slotsHTML}</div>
        </div>`;
    }

    if(r.alternatives && r.alternatives.length) {
      noHTML += `
        <div class="alt-table-card">
          <h4><span class="mio" style="font-size:20px;vertical-align:-4px;margin-right:6px;color:var(--burgundy);">swap_horiz</span>Better Alternatives for You</h4>
          <p class="alt-table-sub">Similar dishes that are safe to consume ${isPlanned ? 'at that time' : 'right now'} based on your dosha, ailments and weather.</p>
          <table class="alt-table">
            <thead><tr><th>Dish</th><th>Why It's Good</th></tr></thead>
            <tbody>
              ${r.alternatives.map(a=>`<tr><td>${a.dish}</td><td>${a.why}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }
    el('food-alt-area').innerHTML = noHTML;
  }

  el('cuisine-section').style.display='block';
  el('food-reset-btn').style.display = 'flex';

  // Add generated-at banner if cached
  if(generatedAt) {
    const bannerDiv = document.createElement('div');
    bannerDiv.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin:0 0 4px;background:var(--cream-dark);border-radius:var(--radius-sm);font-size:11px;';
    bannerDiv.innerHTML = `
      <span style="display:flex;align-items:center;gap:5px;color:var(--text-muted);">
        <span class="mi" style="font-size:14px;color:var(--text-light);">cached</span>
        Checked at ${new Date(generatedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · ${new Date(generatedAt).toLocaleDateString([],{day:'numeric',month:'short'})}
      </span>`;
    el('food-result-area').prepend(bannerDiv);
  }

  requestAnimationFrame(() => { el('app-content').scrollTop = 0; });
}

function togglePersonalisePanel() {
  const panel = el('booster-personalise-panel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function refineBoostersWithContext() {
  const userContext = (el('booster-personalise-input')?.value || '').trim();
  if (!userContext) { showToast('Please describe your preferences first'); return; }
  const d = loadData();
  if (!d.settings?.openaiApiKey) { showToast('Add API key in Settings'); return; }
  const cache = JSON.parse(localStorage.getItem('ayurai_food_cache') || '{}');
  if (!cache.result) { showToast('Food analysis not found — run a new check'); return; }
  const food = cache.food || '';
  const reason = cache.result.reason || '';
  const dosha = d.dosha?.primary || 'Vata';
  const age = getUserAge();
  const timingMode = window._mealTimingMode || 'now';
  let timeContext;
  if (timingMode === 'plan') {
    const dateVal = el('meal-plan-date')?.value;
    const hourVal = el('meal-plan-hour')?.value;
    if (dateVal && hourVal !== undefined && hourVal !== '') {
      const mealDate = new Date(dateVal + 'T' + String(hourVal).padStart(2,'0') + ':30:00');
      const dayName = mealDate.toLocaleString('default',{weekday:'long'});
      const dateStr = mealDate.toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'});
      const h = mealDate.getHours(), fmt = h => { const ampm=h>=12?'PM':'AM'; return (h%12||12)+':00 '+ampm; };
      timeContext = `Planned meal on ${dayName}, ${dateStr} at ${fmt(h)}`;
    }
  }
  if (!timeContext) {
    timeContext = `Right now at ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
  }
  const originalBoosters = cache.result?.meal_boosters ? [...cache.result.meal_boosters] : [];
  const btn = el('btn-personalise-boosters');
  const link = el('booster-personalise-link');
  const list = document.querySelector('.booster-list');
  if (btn) { btn.textContent = 'Generating…'; btn.disabled = true; }
  if (link) link.style.opacity = '0.4';
  if (list) list.innerHTML = '<div class="booster-shimmer"></div><div class="booster-shimmer" style="opacity:0.6"></div>';
  const prevList = originalBoosters.length ? `\nPreviously suggested (DO NOT repeat any of these): ${originalBoosters.map(b => b.item).join(', ')}` : '';
  const prompt = `You are an Ayurvedic nutritionist. The user ate "${food}" and got a YES verdict.\nOriginal reason: "${reason}"\nUser dosha: ${dosha}${age ? `\nUser age: ${age}` : ''}\nMeal time: ${timeContext}${prevList}\nUser's personalisation request: "${userContext}"\n\nSuggest updated meal boosters that respect the user's preferences/restrictions and meal timing. Suggest genuinely different items from any previously suggested.\nRespond ONLY in this JSON format (no markdown):\n{\n  "meal_boosters": [\n    { "nutrient": "e.g. Protein", "item": "Specific item", "why": "One short reason" }\n  ]\n}\nProvide 2-3 boosters.`;  try {
    const resp = await callOpenAI(prompt, d.settings.openaiApiKey);
    const parsed = JSON.parse(resp.replace(/```json|```/g, '').trim());
    const boosters = parsed.meal_boosters || [];
    cache.result.meal_boosters = boosters;
    localStorage.setItem('ayurai_food_cache', JSON.stringify(cache));
    if (list) {
      list.innerHTML = boosters.map(b => `
        <div class="booster-item">
          <div class="booster-nutrient">${b.nutrient}</div>
          <div class="booster-right">
            <div class="booster-item-name">${b.item}</div>
            <div class="booster-why">${b.why}</div>
          </div>
        </div>
      `).join('');
    }
    if (link) { link.style.opacity = '1'; link.innerHTML = '<span class="mio">auto_fix_high</span> Refine again ›'; }
    const panel = el('booster-personalise-panel');
    if (panel) panel.style.display = 'none';
  } catch(e) {
    logError('refineBoostersWithContext', e);
    showToast('Could not refine suggestions. Try again.');
    if (list) {
      list.innerHTML = originalBoosters.map(b => `
        <div class="booster-item">
          <div class="booster-nutrient">${b.nutrient}</div>
          <div class="booster-right">
            <div class="booster-item-name">${b.item}</div>
            <div class="booster-why">${b.why}</div>
          </div>
        </div>
      `).join('');
    }
  } finally {
    if (btn) { btn.innerHTML = '<span class="mio">auto_fix_high</span> Get Better Suggestions'; btn.disabled = false; }
    if (link) link.style.opacity = '1';
  }
}

async function getRemedy() {
  if(_remedyLoading) return;
  // Fallback: read food from cache if in-memory state was lost (e.g. after page refresh)
  const food = window._lastCheckedFood || loadFoodCache()?.food;
  if(!food) { showToast('Food name not found — please run a new analysis'); return; }
  const d = loadData();
  if(!d.settings?.openaiApiKey) { showToast('API key needed'); return; }

  // ── Return cached remedy if already fetched for this food ──
  const foodCache = loadFoodCache();
  if(foodCache?.remedy && foodCache.food === food) {
    renderRemedyCard(foodCache.remedy);
    const b = el('rescue-btn');
    if(b) {
      b.disabled = false;
      b.innerHTML = '<span class="mi" style="font-size:16px;">refresh</span> Refresh Remedies';
    }
    return;
  }

  _remedyLoading = true;

  // Update button state immediately
  const btn = el('rescue-btn');
  if(btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><span style="width:14px;height:14px;border:2px solid rgba(107,30,58,0.3);border-top-color:var(--burgundy);border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;"></span> Finding remedies...</span>';
  }

  el('remedy-area').innerHTML = `
    <div class="loading-card" style="padding:24px;">
      <span style="display:block;margin-bottom:12px;animation:floatLotus 2.5s ease-in-out infinite;">
        <span class="mio" style="font-size:44px;color:var(--burgundy);">healing</span>
      </span>
      <div class="loading-title" style="font-size:18px;">Finding Remedies</div>
      <div class="loading-sub">Consulting Ayurvedic texts for damage control…</div>
      <div class="loading-bar-track"><div class="loading-bar-fill"></div></div>
    </div>`;

  const now = new Date();
  const month = now.toLocaleString('default',{month:'long'});
  const time = now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const dosha = d.dosha.primary;
  const ailments = d.ailments?.join(', ')||'None';
  const city = d.city||'unknown location';
  const age = getUserAge();
  const gender = d.gender || '';
  const itemType = loadFoodCache()?.result?.item_type || 'food';
  const isDrink = itemType === 'drink';

  const prompt = `You are a senior Ayurvedic physician and nutritionist. The user has already ${isDrink ? 'prepared and must drink a beverage' : 'prepared and must eat a food'} that is not ideal for their dosha and health right now. Your job is to advise them practically on how to minimise the negative impact.

User Profile:
- Primary Dosha: ${dosha} (Vata ${d.dosha.scores?.Vata||0}%, Pitta ${d.dosha.scores?.Pitta||0}%, Kapha ${d.dosha.scores?.Kapha||0}%)
- Age: ${age ? age + ' years' : 'unknown'}
- Gender: ${gender || 'Not specified'}
- Known ailments: ${ailments}
- City: ${city}
- Current time: ${time}, Month: ${month}

${isDrink ? 'Drink' : 'Food'} they must ${isDrink ? 'consume' : 'eat'}: "${food}"

${isDrink
  ? 'Provide practical Ayurvedic remedies that are feasible for a drink — ingredients that can be stirred or mixed directly into it, consumed as a small separate sip, or taken immediately before/after. Do NOT suggest solid food preparations or cooking-style modifications.'
  : 'Provide practical Ayurvedic remedies — things to ADD to the food, consume alongside, drink before/after, or spices to mix in — that will neutralise or reduce the negative effects. Be specific and practical.'}

Respond ONLY in this exact JSON (no markdown, no extra text):
{
  "effect_reduction_pct": <number 0-100 representing how much the remedies can reduce the negative effect>,
  "summary": "One sentence on the overall remedy strategy",
  "remedies": [
    {
      "icon": "<single emoji>",
      "name": "Remedy name (ingredient or drink)",
      "how": "Exactly how to use it — quantity, preparation, what to mix or add",
      "timing": "${isDrink ? 'before consuming / stir into drink / consume alongside / drink after' : 'before eating / mix into food / eat alongside / drink after'}"
    }
  ],
  "ayurvedic_note": "One short sentence of ancient Ayurvedic wisdom relevant to this situation"
}

Provide 3 to 5 remedies. Prioritise items commonly available in a household kitchen.`;

  try {
    const resp = await callOpenAI(prompt, d.settings.openaiApiKey);
    const raw = resp.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    // Save remedy into food cache so it's not re-fetched
    const currentCache = loadFoodCache();
    if(currentCache) saveFoodCache({...currentCache, remedy: result});
    renderRemedyCard(result);
    // Re-query button AFTER renderRemedyCard (it only touches remedy-area, not rescue-btn)
    const b = el('rescue-btn');
    if(b) {
      b.disabled = false;
      b.innerHTML = '<span class="mi" style="font-size:16px;">refresh</span> Refresh Remedies';
    }
  } catch(e) {
    el('remedy-area').innerHTML = buildApiErrHTML(e, 'getRemedy', 'getRemedy()');
    const b = el('rescue-btn');
    if(b) {
      b.disabled = false;
      b.innerHTML = '<span class="mi" style="font-size:16px;">shield</span> Going ahead anyway — how to reduce the impact?';
    }
  } finally {
    _remedyLoading = false;
  }
}

function resetFoodCheck() {
  clearFoodCache();
  el('food-input').value = '';
  el('cuisine-input').value = '';
  el('cuisine-result-area').innerHTML = '';
  window._lastCheckedFood = null;
  window._mealTimingMode = 'now';
  window._activeAilments = [];
  _remedyLoading = false;
  setTimingMode('now');
  initMealTiming();
  showFoodInput();
  showToast('Ready for a new food check');
}

function renderRemedyCard(r) {
  const pct = Math.min(100, Math.max(0, r.effect_reduction_pct||0));
  const fillColor = pct >= 70 ? '#5CB876' : pct >= 40 ? '#E8A838' : '#D95F45';

  el('remedy-area').innerHTML = `
    <div class="remedy-card">
      <div class="remedy-card-title"><span class="mi" style="font-size:22px;vertical-align:-4px;margin-right:8px;color:var(--burgundy);">shield</span>Damage Control Plan</div>
      <div class="remedy-card-sub">${r.summary || 'Follow these remedies to reduce the impact of consuming this food right now.'}</div>

      <div class="remedy-effect-bar">
        <div class="remedy-effect-label">Effect Reduced By</div>
        <div class="remedy-effect-track">
          <div class="remedy-effect-fill" id="remedy-fill" style="width:0%;background:${fillColor};"></div>
        </div>
        <div class="remedy-effect-pct">${pct}%</div>
      </div>

      <div class="remedy-items">
        ${(r.remedies||[]).map(rem=>`
          <div class="remedy-item">
            <div class="remedy-item-name"><span class="mio" style="font-size:18px;vertical-align:-3px;margin-right:6px;color:var(--gold);">eco</span>${rem.name}</div>
            <div class="remedy-item-how">${rem.how}</div>
            <span class="remedy-item-timing">${rem.timing}</span>
          </div>
        `).join('')}
      </div>

      ${r.ayurvedic_note ? `
      <div class="remedy-warning">
        <span class="mio" style="font-size:14px;vertical-align:-2px;margin-right:4px;">auto_stories</span><em>${r.ayurvedic_note}</em>
      </div>` : ''}
    </div>
  `;

  // Animate the progress bar after render
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      const fill = el('remedy-fill');
      if(fill) fill.style.width = pct+'%';
    }, 100);
  });
}

async function getCuisineAlts() {
  const pref = el('cuisine-input').value.trim();
  if(!pref) { showToast('Describe your cuisine preference first 🍜'); return; }
  const d = loadData();
  if(!d.settings?.openaiApiKey) { showToast('API key needed'); return; }
  el('cuisine-result-area').innerHTML=`
    <div class="loading-card" style="padding:22px;">
      <span style="display:block;margin-bottom:10px;animation:floatLotus 2.5s ease-in-out infinite;">
        <span class="mi" style="font-size:40px;color:var(--burgundy);">public</span>
      </span>
      <div class="loading-title" style="font-size:16px;">Finding Your Options</div>
      <div class="loading-sub">Matching cuisine to your dosha & season…</div>
      <div class="loading-bar-track"><div class="loading-bar-fill"></div></div>
    </div>`;

  const now = new Date();
  const month = now.toLocaleString('default',{month:'long'});
  const time = now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});

  const age = getUserAge();
  const gender = d.gender || '';
  const prompt = `You are an expert Ayurvedic nutritionist. Suggest the best 5 dishes to eat right now.

User Profile:
- Primary Dosha: ${d.dosha.primary}
- Age: ${age ? age + ' years' : 'unknown'}
- Gender: ${gender || 'Not specified'}
- Common ailments: ${d.ailments?.join(', ')||'None'}
- City: ${d.city||'unknown'}
- Current time: ${time}, Month: ${month}
- Cuisine/food preference: "${pref}"

Give exactly 5 options best suited to the user's dosha, ailments, time of day, and inferred seasonal climate.

Respond ONLY in this JSON format (no markdown):
{
  "options": [
    {"dish": "Dish name", "why": "Short reason why perfect for this user right now"},
    {"dish": "Dish name", "why": "Short reason"},
    {"dish": "Dish name", "why": "Short reason"},
    {"dish": "Dish name", "why": "Short reason"},
    {"dish": "Dish name", "why": "Short reason"}
  ]
}`;

  try {
    const resp = await callOpenAI(prompt, d.settings.openaiApiKey);
    const raw = resp.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    el('cuisine-result-area').innerHTML = `
      <div class="alt-table-card" style="padding:0;">
        <h4 style="padding:16px 20px 0;">🌏 Your Top 5 Options</h4>
        <table class="alt-table">
          <thead><tr><th>Dish</th><th>Why It's Perfect</th></tr></thead>
          <tbody>
            ${result.options.map(a=>`<tr><td>${a.dish}</td><td>${a.why}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) {
    el('cuisine-result-area').innerHTML = buildApiErrHTML(e, 'getCuisineAlts', 'getCuisineAlts()');
  }
}

async function callOpenAI(prompt, apiKey) {
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'user',content:prompt}], temperature:0.3, max_tokens:1000 })
    });
    if(!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    setApiErrorState(false); // clear warning dot on success
    return data.choices[0].message.content;
  } catch(e) {
    logError('callOpenAI', e);
    throw e;
  }
}

async function callOpenAILarge(prompt, apiKey, maxTokens=3500) {
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'user',content:prompt}], temperature:0.3, max_tokens:maxTokens })
    });
    if(!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    setApiErrorState(false); // clear warning dot on success
    return data.choices[0].message.content;
  } catch(e) {
    logError('callOpenAILarge', e);
    throw e;
  }
}

// ── API ERROR CLASSIFICATION ──
const API_ERR_STORAGE_KEY = 'ayurai_api_err';

function classifyApiError(e) {
  const msg = (e.message || '').toLowerCase();
  if(msg.includes('exceeded') || msg.includes('quota') || msg.includes('billing') ||
     msg.includes('insufficient_quota') || msg.includes('you exceeded')) {
    return 'quota';
  }
  if(msg.includes('invalid') && (msg.includes('key') || msg.includes('api'))) {
    return 'invalid_key';
  }
  if(msg.includes('rate') || msg.includes('429') || msg.includes('too many')) {
    return 'rate_limit';
  }
  if(msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') ||
     msg.includes('networkerror') || msg.includes('connection')) {
    return 'network';
  }
  return 'unknown';
}

function setApiErrorState(hasError, errorType) {
  const dot = el('settings-warn-dot');

  // Warning dot only for actionable errors — quota exhausted or invalid key
  const isActionable = errorType === 'quota' || errorType === 'invalid_key';
  if(dot) dot.style.display = (hasError && isActionable) ? 'block' : 'none';

  if(hasError && isActionable) {
    localStorage.setItem(API_ERR_STORAGE_KEY, errorType);
  } else if(!hasError) {
    localStorage.removeItem(API_ERR_STORAGE_KEY);
    const status = el('settings-apikey-status');
    if(status) status.style.display = 'none';
  }

  // Show inline message in API Key section for quota or invalid_key only
  if(hasError && isActionable) {
    const status = el('settings-apikey-status');
    if(status) {
      const isQuota = errorType === 'quota';
      status.style.cssText = 'margin-top:10px;padding:10px 12px;border-radius:8px;font-size:12px;line-height:1.55;display:block;' +
        'background:rgba(217,95,69,0.08);border:1px solid rgba(217,95,69,0.25);color:#7A1A1A;';
      status.innerHTML = isQuota
        ? `<span class="mi" style="font-size:14px;vertical-align:-3px;margin-right:4px;">credit_card_off</span>
           <strong>Credits exhausted</strong> — Your OpenAI balance is zero.
           <a href="https://platform.openai.com/account/billing" target="_blank" style="color:var(--burgundy);font-weight:600;margin-left:4px;">Top up at platform.openai.com →</a>`
        : `<span class="mi" style="font-size:14px;vertical-align:-3px;margin-right:4px;">error_outline</span>
           <strong>Invalid API key</strong> — Please enter a valid key starting with <code style="font-size:11px;background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;">sk-</code>`;
    }
  }
}

function buildApiErrHTML(e, context, retryFn) {
  const type = classifyApiError(e);
  setApiErrorState(true, type);
  logError(context, e);

  const configs = {
    quota: {
      icon: '💳',
      title: 'OpenAI Credits Exhausted',
      msg: 'Your OpenAI API credits have run out. AyurAI uses your personal OpenAI key — you need to top up your credits at <strong>platform.openai.com</strong> to continue using AI features.',
      actions: `
        <a class="api-err-btn primary" href="https://platform.openai.com/account/billing" target="_blank">
          <span class="mi" style="font-size:15px;">open_in_new</span> Top Up Credits
        </a>
        <button class="api-err-btn secondary" onclick="switchTab('settings')">
          <span class="mi" style="font-size:15px;">key</span> Check API Key
        </button>`
    },
    invalid_key: {
      icon: '🔑',
      title: 'Invalid API Key',
      msg: 'Your OpenAI API key appears to be invalid or has been revoked. Please go to Settings and enter a valid key starting with <strong>sk-...</strong>',
      actions: `
        <button class="api-err-btn primary" onclick="switchTab('settings')">
          <span class="mi" style="font-size:15px;">settings</span> Update API Key
        </button>`
    },
    rate_limit: {
      icon: '⏱️',
      title: 'Too Many Requests',
      msg: 'OpenAI is temporarily rate-limiting your requests. This usually resolves in 30–60 seconds. Please wait a moment and try again.',
      actions: retryFn ? `
        <button class="api-err-btn primary" onclick="${retryFn}">
          <span class="mi" style="font-size:15px;">refresh</span> Try Again
        </button>` : ''
    },
    network: {
      icon: '📡',
      title: 'No Internet Connection',
      msg: 'Could not reach the OpenAI API. Please check your internet connection and try again.',
      actions: retryFn ? `
        <button class="api-err-btn primary" onclick="${retryFn}">
          <span class="mi" style="font-size:15px;">refresh</span> Retry
        </button>` : ''
    },
    unknown: {
      icon: '⚠️',
      title: 'Something Went Wrong',
      msg: `An unexpected error occurred: <strong>${e.message}</strong>. Please try again or check the App Diagnostics in Settings.`,
      actions: `
        <button class="api-err-btn secondary" onclick="switchTab('settings')">
          <span class="mi" style="font-size:15px;">bug_report</span> View Diagnostics
        </button>
        ${retryFn ? `<button class="api-err-btn primary" onclick="${retryFn}">
          <span class="mi" style="font-size:15px;">refresh</span> Retry
        </button>` : ''}`
    }
  };

  const cfg = configs[type] || configs.unknown;
  return `
    <div class="api-err-card">
      <span class="api-err-icon">${cfg.icon}</span>
      <div class="api-err-title">${cfg.title}</div>
      <div class="api-err-msg">${cfg.msg}</div>
      <div class="api-err-actions">${cfg.actions}</div>
    </div>`;
}

// Restore warning dot on page load if a previous error was recorded
function saveFoodHistory(food, verdict, reason, timeContext, isPlanned) {
  const d = loadData();
  if(!d.foodHistory) d.foodHistory=[];
  d.foodHistory.unshift({
    food, verdict, reason,
    timeContext: timeContext || null,
    isPlanned: isPlanned || false,
    timestamp: new Date().toISOString()
  });
  if(d.foodHistory.length>10) d.foodHistory=d.foodHistory.slice(0,10);
  saveData(d);
}

function renderHistory() {
  const d = loadData();
  const list = el('history-list');
  if(!d.foodHistory||!d.foodHistory.length) {
    list.innerHTML=`<div class="history-empty"><div class="he-icon"><span class="mio" style="font-size:48px;color:var(--text-light);">history</span></div><p>No food checks yet.<br>Use the Food Check tab to get started!</p></div>`;
    return;
  }
  list.innerHTML = d.foodHistory.map(h=>{
    const dt = new Date(h.timestamp);
    const checkedAt = dt.toLocaleDateString([],{day:'numeric',month:'short'}) + ' · ' + dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const mealCtx = h.timeContext
      ? `<span class="history-meal-time ${h.isPlanned?'planned':'now'}">
           <span class="mi">${h.isPlanned?'event':'bolt'}</span>
           <span>${h.timeContext}</span>
         </span>`
      : '';
    return `
      <div class="history-item ${h.verdict==='YES'?'yes-item':'no-item'}">
        <div class="history-item-top">
          <div class="history-food">${h.food}</div>
          <div class="history-verdict">${h.verdict}</div>
        </div>
        <div class="history-reason">${h.reason}</div>
        <div class="history-meta">
          <span class="history-checked-at"><span class="mi">history</span>${checkedAt}</span>
          ${mealCtx}
        </div>
      </div>
    `;
  }).join('');
}

function renderHomeHistory() {
  const d = loadData();
  const container = el('home-recent-checks');
  if(!container) return;
  if(!d.foodHistory||!d.foodHistory.length) {
    container.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">No food checks yet — try the Food Check tab!</div>`;
    return;
  }
  container.innerHTML = d.foodHistory.slice(0,3).map(h=>{
    const dt = new Date(h.timestamp);
    const checkedAt = dt.toLocaleDateString([],{day:'numeric',month:'short'}) + ' · ' + dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const mealCtx = h.timeContext
      ? `<span class="history-meal-time ${h.isPlanned?'planned':'now'}">
           <span class="mi">${h.isPlanned?'event':'bolt'}</span>
           <span>${h.timeContext}</span>
         </span>`
      : '';
    return `
      <div class="history-item ${h.verdict==='YES'?'yes-item':'no-item'}" style="margin-bottom:10px;">
        <div class="history-item-top">
          <div class="history-food">${h.food}</div>
          <div class="history-verdict">${h.verdict}</div>
        </div>
        <div class="history-reason">${h.reason}</div>
        <div class="history-meta">
          <span class="history-checked-at"><span class="mi">history</span>${checkedAt}</span>
          ${mealCtx}
        </div>
      </div>
    `;
  }).join('');
}

function clearHistory() {
  if(!confirm('Clear all food check history?')) return;
  setData('foodHistory',[]);
  renderHistory();
  renderHomeHistory();
  showToast('History cleared');
}

// ── SETTINGS ──
function saveCity() {
  const city = el('settings-city').value.trim();
  if(!city) { showToast('Please enter a city name'); return; }
  setData('city', city);
  // Refresh food hero chips which show city
  initApp();
  showToast('City saved: ' + city);
}

function saveBirthDate() {
  const month = parseInt(el('settings-birth-month')?.value || '0', 10);
  const year  = parseInt(el('settings-birth-year')?.value  || '0', 10);
  if(!month || !year || year < 1930 || year > 2010) {
    showToast('Please enter a valid birth month and year');
    return;
  }
  const d = loadData();
  d.birth_month = month;
  d.birth_year  = year;
  saveData(d);
  showToast('Birth date saved');
}

function saveGender() {
  const gender = el('settings-gender')?.value || '';
  setData('gender', gender);
  showToast(gender ? 'Gender saved: ' + gender : 'Gender cleared');
}

function renderErrorLogs() {
  const container = el('settings-error-log');
  if(!container) return;
  const logs = getErrorLogs();
  if(!logs.length) {
    container.innerHTML = `<div style="font-size:12px;color:var(--text-light);text-align:center;padding:8px 0;"><span class="mi" style="font-size:16px;vertical-align:-3px;color:#5CB876;margin-right:4px;">check_circle</span>No errors logged — app is running smoothly</div>`;
    return;
  }
  container.innerHTML = logs.map(l=>`
    <div class="error-log-entry">
      <div class="error-log-ts">${new Date(l.ts).toLocaleString()}</div>
      <div class="error-log-ctx">${l.ctx}</div>
      <div class="error-log-msg">${l.msg}</div>
      ${l.stack?`<div class="error-log-msg" style="opacity:0.6;font-size:10px;margin-top:2px;">${l.stack}</div>`:''}
    </div>`).join('');
}

function sendErrorLogs() {
  const logs = getErrorLogs();
  if(!logs.length) { showToast('No errors to send'); return; }
  const d = loadData();
  const username = d.user?.name || 'Unknown';
  const subject = encodeURIComponent(`AyurAI Error Report — ${username} — ${new Date().toLocaleDateString()}`);
  const body = encodeURIComponent(
`Hi,

I am reporting errors from AyurAI app for investigation.

User: ${username}
App Version: ${APP_VERSION}
Date: ${new Date().toLocaleString()}
Error Count: ${logs.length}

--- ERROR DETAILS ---
${logs.map((l,i)=>`
${i+1}. [${new Date(l.ts).toLocaleString()}]
   Context: ${l.ctx}
   Message: ${l.msg}${l.stack?'\n   Stack: '+l.stack:''}`).join('\n')}

Thanks`
  );
}

function openFoodOverlay() {
  const overlay = el('food-overlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('open'));
  initFoodCheck();
  setTimeout(initMealTiming, 50);
}

function closeFoodOverlay() {
  const overlay = el('food-overlay');
  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => { overlay.style.display = 'none'; }, { once: true });
}