  showHerbLoading('Finding herbs for your concerns...');

  const prompt = `You are a senior Ayurvedic Vaidya. Recommend herbs and supplements to address the user's specific health concerns, considering their dosha.

User Profile:
- Primary Dosha: ${ctx.dosha} (Vata ${ctx.scores.Vata||0}%, Pitta ${ctx.scores.Pitta||0}%, Kapha ${ctx.scores.Kapha||0}%)
- Known ailments: ${ctx.ailments}
- City: ${ctx.city}, Month: ${ctx.month}
- Target concerns: ${herbState.selectedConcerns.join(', ')}

Prioritise herbs that address these specific concerns without aggravating the ${ctx.dosha} dosha.

Respond in this JSON format:
${buildHerbJsonSpec()}`;

  await fetchAndRenderHerbs(prompt, ctx.apiKey, herbState.selectedConcerns.slice(0,2).join(' · '));
}

// ── GET SEASONAL ──
async function getSeasonalHerbs() {
  const ctx = buildHerbContext();
  if(!ctx.apiKey) { showToast('Please add your OpenAI API key in Settings'); return; }
  showHerbLoading('Reading the seasonal almanac...');

  const prompt = `You are a senior Ayurvedic Vaidya. Recommend seasonal herbs and supplements appropriate for this person's location, current month, and dosha.

User Profile:
- Primary Dosha: ${ctx.dosha}
- Known ailments: ${ctx.ailments}
- City: ${ctx.city}, Current Month: ${ctx.month}

Infer the current season (Ritu) for ${ctx.city} in ${ctx.month}. Recommend herbs that are classically indicated for this season to maintain balance and prevent seasonal ailments.

Respond in this JSON format:
${buildHerbJsonSpec()}`;

  await fetchAndRenderHerbs(prompt, ctx.apiKey, `${ctx.month} · ${ctx.city}`);
}

async function fetchAndRenderHerbs(prompt, apiKey, subtitle) {
  try {
    const resp = await callOpenAILarge(prompt, apiKey, 2000);
    const raw = resp.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    renderHerbResults(result, subtitle);
  } catch(e) {
    el('herbs-wrap').innerHTML += buildApiErrHTML(e, 'fetchAndRenderHerbs', 'initHerbAdvisor()');
  }
}

function showHerbLoading(msg) {
  el('herbs-wrap').innerHTML = `
    <div class="loading-card" style="margin-top:20px;">
      <span style="display:block;margin-bottom:16px;animation:floatLotus 2.5s ease-in-out infinite;">
        <span class="mio" style="font-size:52px;color:var(--burgundy);">spa</span>
      </span>
      <div class="loading-title">${msg}</div>
      <div class="loading-sub">Consulting from the wisdom of 5,000 years of Ayurveda…</div>
      <div class="loading-bar-track"><div class="loading-bar-fill"></div></div>
    </div>`;
}

// ── HERB CHAT ──
function renderHerbChat() {
  const d = loadData();
  herbState.chatHistory = herbState.chatHistory.length ? herbState.chatHistory : [
    {role:'ai', text:`Namaste 🙏 I'm your Ayurvedic herb advisor. You are a <strong>${d.dosha?.primary||'—'}</strong> type. Ask me anything about herbs, supplements, combinations, dosage, or any specific health concern.`}
  ];
  herbState.resultsShown = true;
  el('herb-reset-btn').style.display='flex';
  openHerbChatOverlay();
}

function openHerbChatOverlay() {
  const d = loadData();
  const dosha = d.dosha?.primary || '—';
  const city = d.city || 'Location not set';
  el('herb-dosha-chip').innerHTML = `<span class="mio" style="font-size:14px;vertical-align:-2px;">eco</span> ${dosha} · ${city}`;
  const overlay = el('herb-chat-overlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('open'));
  updateChatDisplay();
  scrollChatToBottom();
}

function closeHerbChatOverlay() {
  const overlay = el('herb-chat-overlay');
  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => { overlay.style.display = 'none'; }, { once: true });
}

function renderChatBubbles() {
  return herbState.chatHistory.map(m=>`
    <div class="chat-bubble ${m.role==='user'?'user':'ai'}">${m.text}</div>
  `).join('');
}

function scrollChatToBottom() {
  setTimeout(()=>{
    const h = el('herb-chat-history');
    if(h) h.scrollTop = h.scrollHeight;
  },80);
}

async function sendHerbChat() {
  if(herbState.chatLoading) return;
  const input = el('herb-chat-input');
  const msg = input?.value.trim();
  if(!msg) return;
  const d = loadData();
  if(!d.settings?.openaiApiKey) { showToast('Please add your OpenAI API key in Settings'); return; }

  input.value = '';