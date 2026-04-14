/* ══════════════════════════════════════
   ASK ANYTHING
══════════════════════════════════════ */

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
  const dosha = d.dosha?.primary || 'your';
  const prompts = getAskStarterPrompts(d);
  el('ask-chat').innerHTML = `
    <div class="ask-bubble ai">Hi ${name}! Namaste 🙏 I'm your Ayurvedic herb advisor. You are a ${dosha} type. Ask me anything.</div>
    <div class="ask-starters" id="ask-starters">
      ${prompts.map(p => `<div class="ask-starter-card" onclick="sendAskMessage(${JSON.stringify(p)});document.getElementById('ask-starters')?.remove();">${p}</div>`).join('')}
    </div>`;
}

function buildAskSystemPrompt(d) {
  const name = d.user?.name || 'the user';
  const age = getUserAge();
  const city = d.city || null;
  const dosha = d.dosha || { primary: 'unknown', scores: {} };
  const ailments = (d.ailments?.length) ? d.ailments.join(', ') : 'none listed';
  const foods = (d.doshaInsights?.foods_to_avoid?.length)
    ? d.doshaInsights.foods_to_avoid.join(', ')
    : 'not yet generated';
  return `You are an Ayurvedic wellness assistant for ${name}${age ? `, age ${age}` : ''}${city ? `, based in ${city}` : ''}.

Their dosha profile: ${dosha.primary} dominant (Vata ${dosha.scores?.Vata||0}%, Pitta ${dosha.scores?.Pitta||0}%, Kapha ${dosha.scores?.Kapha||0}%).
Current ailments: ${ailments}.
Foods they should avoid: ${foods}.

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
      `<div class="ask-suggestion-card" onclick="sendAskMessage(${JSON.stringify(s)});this.closest('.ask-suggestions').remove();">${s}</div>`
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
    if (!apiKey) { askAddMessage('ai', 'Please add your API key in Settings.'); askState.loading = false; return; }
    const systemPrompt = buildAskSystemPrompt(d);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...askState.chatHistory
    ];
    const userTurns = askState.chatHistory.filter(m => m.role === 'user').length;
    const raw = await callOpenAIChat(messages, apiKey, userTurns > 4 ? 1500 : 1000);

    loadBubble.remove();

    let displayText = raw;
    let suggestions = null;
    const jsonMatch = raw.match(/\{"suggestions"\s*:\s*\[[\s\S]*?\]\}/);
    if (jsonMatch) {
      try {
        suggestions = JSON.parse(jsonMatch[0]).suggestions;
        displayText = raw.replace(jsonMatch[0], '').trim();
      } catch(e) { /* fallback: show full text as-is */ }
    }

    askState.chatHistory.push({ role: 'assistant', content: displayText });
    askAddMessage('ai', displayText, suggestions);
  } catch(e) {
    loadBubble.remove();
    logError('askAnything', e);
    askAddMessage('ai', 'Something went wrong. Please try again.');
  }
  askState.loading = false;
}
