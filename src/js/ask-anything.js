/* ══════════════════════════════════════
   ASK ANYTHING
══════════════════════════════════════ */

async function callOpenAIChatStream(messages, apiKey, maxTokens, onChunk) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
    body:JSON.stringify({model:'gpt-4o-mini',messages,stream:true,temperature:0.3,max_tokens:maxTokens})
  });
  if(!resp.ok){const err=await resp.json().catch(()=>({}));throw new Error(err.error?.message||`HTTP ${resp.status}`);}
  setApiErrorState(false);
  const reader=resp.body.getReader();
  const decoder=new TextDecoder();
  let buffer='',fullText='';
  while(true){
    const{done,value}=await reader.read();
    if(done)break;
    buffer+=decoder.decode(value,{stream:true});
    const lines=buffer.split('\n');
    buffer=lines.pop()||'';
    for(const line of lines){
      if(!line.startsWith('data: '))continue;
      const chunk=line.slice(6).trim();
      if(chunk==='[DONE]')return fullText;
      try{const delta=JSON.parse(chunk).choices[0]?.delta?.content||'';if(delta){fullText+=delta;onChunk(fullText);}}catch{}
    }
  }
  return fullText;
}

async function callOpenAIChat(messages, apiKey, maxTokens=1000) {
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({ model:'gpt-4o-mini', messages:messages, temperature:0.3, max_tokens:maxTokens })
    });
    if(!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    setApiErrorState(false);
    return data.choices[0].message.content;
  } catch(e) {
    logError('callOpenAIChat', e);
    throw e;
  }
}

let askState = { chatHistory: [], loading: false };

function openAskAnything() {
  const d = loadData();
  if (!d.settings?.openaiApiKey) { showToast('Add your API key in Settings'); return; }
  if (!d.dosha) { showToast('Complete your Dosha Quiz first'); return; }
  askState = { chatHistory: [], loading: false };
  const overlay = el('ask-overlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('open'));
  const dosha = d.dosha.primary || '—';
  const city = d.city || 'Location not set';
  el('ask-dosha-chip').innerHTML = `<span class="mio" style="font-size:14px;vertical-align:-2px;">spa</span> ${dosha} · ${city}`;
  renderAskStarters(d);
}

function closeAskAnything() {
  const overlay = el('ask-overlay');
  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => { overlay.style.display = 'none'; }, { once: true });
  askState = { chatHistory: [], loading: false };
}

function getAskStarterPrompts(d) {
  const dosha = d.dosha?.primary || 'Vata';
  const ailment = d.ailments?.[0] || null;
  const ailmentQ = ailment ? `What can help with my ${ailment}?` : null;
  const map = {
    Vata: [
      'What foods are good for me to eat?',
      'How can I reduce stress and anxiety naturally?',
      'What should my morning routine look like?',
      ailmentQ || 'Which herbs are good for my body type?'
    ],
    Pitta: [
      'What foods should I avoid?',
      'How can I cool down my body in summer?',
      'What helps with digestion for my type?',
      ailmentQ || 'What should my daily routine look like?'
    ],
    Kapha: [
      'How can I feel more energetic during the day?',
      'What foods are good for me to eat?',
      'What should my morning routine look like?',
      ailmentQ || 'Which herbs help with my body type?'
    ]
  };
  return map[dosha] || map['Vata'];
}

function renderAskStarters(d) {
  const name = (d.user?.name || '').split(' ')[0] || 'there';
  const prompts = getAskStarterPrompts(d);
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const city = d.city || null;
  const age = getUserAge();
  const contextParts = [
    `<span class="mi" style="font-size:12px;vertical-align:-2px;">schedule</span> ${time}`,
    city ? `<span class="mi" style="font-size:12px;vertical-align:-2px;">location_on</span> ${city}` : null,
    age ? `<span class="mi" style="font-size:12px;vertical-align:-2px;">person</span> Age ${age}` : null,
  ].filter(Boolean).join('<span style="opacity:0.4"> · </span>');
  el('ask-chat').innerHTML = `
    <div class="ask-bubble ai">Hi ${name}! Namaste 🙏 I'm your Ayurvedic Advisor. Ask me anything.</div>
    <div style="font-size:11px;color:var(--text-light);text-align:center;margin:-2px 0 8px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">${contextParts}</div>
    <div class="ask-starters" id="ask-starters">
      ${prompts.map(p => `<div class="ask-starter-card" onclick="sendAskMessage(this.dataset.p)" data-p="${p.replace(/"/g,'&quot;')}">${p}</div>`).join('')}
    </div>`;
}

function buildAskSystemPrompt(d) {
  const name = d.user?.name || 'the user';
  const age = getUserAge();
  const city = d.city || null;
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dosha = d.dosha || { primary: 'unknown', scores: {} };
  const ailments = (d.ailments?.length) ? d.ailments.join(', ') : 'none listed';
  const foods = (d.doshaInsights?.foods_to_avoid?.length)
    ? d.doshaInsights.foods_to_avoid.join(', ')
    : 'not yet generated';
  return `You are an Ayurvedic wellness assistant for ${name}${age ? `, age ${age}` : ''}${city ? `, based in ${city}` : ''}.

Their dosha profile: ${dosha.primary} dominant (Vata ${dosha.scores?.Vata||0}%, Pitta ${dosha.scores?.Pitta||0}%, Kapha ${dosha.scores?.Kapha||0}%).
Current ailments: ${ailments}.
Foods they should avoid: ${foods}.
Season context: ${city ? city + ', ' : ''}${month}. Current time: ${time}.

${buildDoshaRules(dosha.primary)}
Apply the above rules in every answer. Context matters — a food that is generally limited may be acceptable in small amounts at the right time or season; always explain the nuance.

Answer ONLY Ayurvedic wellness questions — diet, dosha, herbs, lifestyle, and seasonal routines.
If asked anything outside this scope, respond with a brief, warm decline and suggest 2 relevant Ayurvedic questions the user might actually want to ask. Format the suggestions as a JSON block at the end of your response in this exact format:
{"suggestions":["suggestion 1","suggestion 2"]}

Keep answers warm, practical, and concise. Reference their specific dosha and profile where relevant.`;
}

function askAddMessage(role, text, suggestions) {
  const chat = el('ask-chat');
  const bubble = document.createElement('div');
  bubble.className = 'ask-bubble ' + (role === 'user' ? 'user' : 'ai');
  bubble.textContent = text;
  chat.appendChild(bubble);
  if (suggestions && suggestions.length) {
    const sugDiv = document.createElement('div');
    sugDiv.className = 'ask-suggestions';
    sugDiv.innerHTML = suggestions.map(s =>
      `<div class="ask-suggestion-card" onclick="sendAskMessage(this.dataset.p)" data-p="${s.replace(/"/g,'&quot;')}">${s}</div>`
    ).join('');
    chat.appendChild(sugDiv);
  }
  chat.scrollTop = chat.scrollHeight;
}

async function sendAskMessage(text) {
  if (!text || askState.loading) return;
  el('ask-input').value = '';
  document.getElementById('ask-starters')?.remove();

  askState.chatHistory.push({ role: 'user', content: text });
  askAddMessage('user', text);

  const chat = el('ask-chat');
  const loadBubble = document.createElement('div');
  loadBubble.className = 'ask-bubble ai loading';
  loadBubble.textContent = '···';
  chat.appendChild(loadBubble);
  chat.scrollTop = chat.scrollHeight;
  askState.loading = true;

  try {
    const d = loadData();
    const apiKey = d.settings?.openaiApiKey;
    if (!apiKey) { loadBubble.remove(); askAddMessage('ai', 'Please add your API key in Settings.'); askState.loading = false; return; }
    const systemPrompt = buildAskSystemPrompt(d);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...askState.chatHistory
    ];
    const userTurns = askState.chatHistory.filter(m => m.role === 'user').length;
    const maxTokens = userTurns > 4 ? 1500 : 1000;

    // Convert loading bubble to streaming in-place
    loadBubble.textContent = '';
    loadBubble.classList.remove('loading');
    loadBubble.classList.add('streaming');

    const fullText = await callOpenAIChatStream(messages, apiKey, maxTokens, (accumulated) => {
      loadBubble.textContent = accumulated;
      el('ask-chat').scrollTop = el('ask-chat').scrollHeight;
    });

    loadBubble.classList.remove('streaming');

    let displayText = fullText;
    let suggestions = null;
    const jsonMatch = fullText.match(/\{"suggestions"\s*:\s*\[[\s\S]*?\]\}/);
    if (jsonMatch) {
      try {
        suggestions = JSON.parse(jsonMatch[0]).suggestions;
        displayText = fullText.replace(jsonMatch[0], '').trim();
      } catch {}
    }
    loadBubble.textContent = displayText;
    const stored = suggestions?.length ? `${displayText}\n[Suggested follow-ups: ${suggestions.join('; ')}]` : displayText;
    askState.chatHistory.push({ role: 'assistant', content: stored });
    if (suggestions?.length) {
      const sugDiv = document.createElement('div');
      sugDiv.className = 'ask-suggestions';
      sugDiv.innerHTML = suggestions.map(s =>
        `<div class="ask-suggestion-card" onclick="sendAskMessage(this.dataset.p)" data-p="${s.replace(/"/g,'&quot;')}">${s}</div>`
      ).join('');
      el('ask-chat').appendChild(sugDiv);
      el('ask-chat').scrollTop = el('ask-chat').scrollHeight;
    }
  } catch(e) {
    loadBubble.remove();
    logError('askAnything', e);
    askAddMessage('ai', 'Something went wrong. Please try again.');
  }
  askState.loading = false;
}
