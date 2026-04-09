  toastTimer = setTimeout(()=>t.classList.remove('show'),3200);
}

// ══════════════════════════════════════════
//  DOSHA QUIZ
// ══════════════════════════════════════════
const QUICK_QUIZ = [
  {
    q:"How would you describe your body frame?",
    hint:"Think about your natural build",
    opts:[
      {text:"Thin, light, hard to gain weight",v:{V:3,P:0,K:0}},
      {text:"Medium, muscular, moderate weight",v:{V:0,P:3,K:0}},
      {text:"Large, solid, tends to gain weight easily",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How is your skin naturally?",
    hint:"Without skincare products",
    opts:[
      {text:"Dry, rough, or flaky",v:{V:3,P:0,K:0}},
      {text:"Sensitive, oily in T-zone, prone to redness",v:{V:0,P:3,K:0}},
      {text:"Thick, smooth, glowing, rarely irritated",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How is your digestion?",
    hint:"Think about your typical experience after meals",
    opts:[
      {text:"Irregular — sometimes fine, sometimes bloated",v:{V:3,P:0,K:0}},
      {text:"Strong — I feel sharp hunger, get irritable if I skip meals",v:{V:0,P:3,K:0}},
      {text:"Slow but steady — rarely feel very hungry",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How do you sleep?",
    hint:"Your natural sleep pattern",
    opts:[
      {text:"Light sleep, wake up easily, sometimes insomnia",v:{V:3,P:0,K:0}},
      {text:"Moderate — fall asleep easily, wake up alert",v:{V:0,P:3,K:0}},
      {text:"Deep, long sleep, hard to wake up early",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How would you describe your mind and energy?",
    hint:"Your natural tendency",
    opts:[
      {text:"Quick mind, creative, easily distracted, energy fluctuates",v:{V:3,P:0,K:0}},
      {text:"Focused, driven, competitive, intense",v:{V:0,P:3,K:0}},
      {text:"Calm, steady, slow to start but great endurance",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How do you react to stress?",
    hint:"Your first instinct under pressure",
    opts:[
      {text:"Anxiety, worry, overthinking",v:{V:3,P:0,K:0}},
      {text:"Frustration, irritability, tendency to argue",v:{V:0,P:3,K:0}},
      {text:"Withdrawal, denial, slow to react",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"What is your hair naturally like?",
    hint:"Natural hair without treatments",
    opts:[
      {text:"Dry, thin, frizzy or curly",v:{V:3,P:0,K:0}},
      {text:"Fine, prone to early greying or thinning",v:{V:0,P:3,K:0}},
      {text:"Thick, oily, wavy, lustrous",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How do you handle cold weather?",
    hint:"Your comfort in cold climates",
    opts:[
      {text:"I dislike it strongly — I feel cold easily",v:{V:3,P:0,K:0}},
      {text:"I enjoy it — heat bothers me more",v:{V:0,P:3,K:0}},
      {text:"I manage okay but feel heavier and sluggish",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How is your memory?",
    hint:"How you learn and retain information",
    opts:[
      {text:"Quick to learn, quick to forget",v:{V:3,P:0,K:0}},
      {text:"Sharp and precise, good retention",v:{V:0,P:3,K:0}},
      {text:"Slow to learn but retains very well once learned",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How do you typically feel in the morning?",
    hint:"Right after waking up",
    opts:[
      {text:"Variable — energised some days, exhausted others",v:{V:3,P:0,K:0}},
      {text:"Sharp and ready quickly",v:{V:0,P:3,K:0}},
      {text:"Slow and groggy — need time to wake up",v:{V:0,P:0,K:3}}
    ]
  }
];

const DEEP_QUIZ = [
  {
    q:"How would you describe your appetite patterns?",
    hint:"Your hunger throughout the day",
    opts:[
      {text:"Very irregular — sometimes ravenous, sometimes not hungry at all",v:{V:3,P:0,K:0}},
      {text:"Regular and strong — get headaches or irritable if I miss a meal",v:{V:0,P:3,K:0}},
      {text:"Low and consistent — can skip meals without issue",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"What type of weather suits you best?",
    hint:"Where you feel most comfortable",
    opts:[
      {text:"Warm, humid weather",v:{V:3,P:0,K:0}},
      {text:"Cool, well-ventilated environments",v:{V:0,P:3,K:0}},
      {text:"Warm and dry climates",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How would you describe your joints?",
    hint:"Natural state of your joints",
    opts:[
      {text:"They crack often, feel loose or unstable",v:{V:3,P:0,K:0}},
      {text:"Flexible and strong",v:{V:0,P:3,K:0}},
      {text:"Large, well-lubricated, rarely crack",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How do you speak?",
    hint:"Your natural speaking style",
    opts:[
      {text:"Fast, enthusiastic, tend to talk a lot",v:{V:3,P:0,K:0}},
      {text:"Clear, precise, articulate, sometimes sharp",v:{V:0,P:3,K:0}},
      {text:"Slow, melodious, thoughtful before speaking",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"What are your bowel movements like typically?",
    hint:"Your natural digestive pattern",
    opts:[
      {text:"Dry, hard, constipated or irregular",v:{V:3,P:0,K:0}},
      {text:"Loose, frequent, sometimes burning",v:{V:0,P:3,K:0}},
      {text:"Regular, well-formed, slow",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How do you make decisions?",
    hint:"Your natural decision-making style",
    opts:[
      {text:"Quickly but often change my mind",v:{V:3,P:0,K:0}},
      {text:"Decisively and confidently",v:{V:0,P:3,K:0}},
      {text:"Slowly and carefully after much deliberation",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How is your skin in summer?",
    hint:"Seasonal skin changes",
    opts:[
      {text:"Gets drier",v:{V:3,P:0,K:0}},
      {text:"Gets oilier and prone to breakouts",v:{V:0,P:3,K:0}},
      {text:"Stays mostly the same",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"Which best describes your emotional nature?",
    hint:"Your emotional tendencies",
    opts:[
      {text:"Enthusiastic and changing — moods shift quickly",v:{V:3,P:0,K:0}},
      {text:"Passionate and intense — feel things deeply",v:{V:0,P:3,K:0}},
      {text:"Calm and attached — slow to anger, slow to forgive",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"How do you handle change?",
    hint:"Your adaptability",
    opts:[
      {text:"Love change and variety — get bored easily",v:{V:3,P:0,K:0}},
      {text:"Manage well if I'm in control of the change",v:{V:0,P:3,K:0}},
      {text:"Prefer stability and routine",v:{V:0,P:0,K:3}}
    ]
  },
  {
    q:"Which foods do you naturally crave?",
    hint:"Your taste preferences",
    opts:[
      {text:"Sweet, salty, or oily foods",v:{V:3,P:0,K:0}},
      {text:"Spicy, sour, or salty foods",v:{V:0,P:3,K:0}},
      {text:"Sweet, light, or dry foods",v:{V:0,P:0,K:3}}
    ]
  }
];

const DOSHA_INFO = {
  Vata: {
    description: "You are creative, energetic, and quick-thinking. Vata types are naturally flexible and enthusiastic but can be prone to anxiety, dryness, and irregularity.",
    qualities: "Light • Dry • Mobile • Cold • Irregular",
    balance: "Warm, grounding, nourishing foods. Regular routines. Warm oils and rest."
  },
  Pitta: {
    description: "You are sharp, focused, and driven. Pitta types have strong digestion and intelligence but can be prone to inflammation, irritability, and overheating.",
    qualities: "Hot • Sharp • Light • Oily • Intense",
    balance: "Cooling, refreshing foods. Avoid excess spice and heat. Leisure and creative outlets."
  },
  Kapha: {
    description: "You are calm, loving, and grounded. Kapha types have great endurance and stability but can be prone to weight gain, congestion, and sluggishness.",
    qualities: "Heavy • Slow • Cool • Oily • Smooth",
    balance: "Light, dry, warming foods. Regular vigorous exercise. Stimulation and variety."
  }
};

const COMMON_AILMENTS = [
  // Digestive
  "Acidity","Acid Reflux","Heartburn","Poor Digestion","Bloating","Constipation",
  // Skin
  "Skin issues / Rashes","Inner thigh Boils",
  // Head & Pain
  "Headache","Migraines / Headaches","Backache","Joint Pain",
  // Energy & Mind
  "Anxiety / Stress","Fatigue / Low Energy","Insomnia / Poor Sleep",
  // Respiratory & Immunity
  "Common Cold / Allergies","Fever",
  // Metabolic / Chronic
  "High BP","Diabetes (Type 2)"
];

let quizState = { phase:'quick', qIdx:0, answers:[], scores:{V:0,P:0,K:0}, ailments:[], city:'' };
let quizStarted = false;

function initQuiz() {
  const d = loadData();
  if(d.dosha) { renderQuizResult(); }
  else { renderQuizStart(); }
}

function retakeQuiz() {
  quizState = { phase:'quick', qIdx:0, answers:[], scores:{V:0,P:0,K:0}, stage1Scores:{V:0,P:0,K:0}, ailments:[], city:'' };
  quizStarted = false;
  // Clear cached insights and dinacharya — dosha may change
  setData('doshaInsights', null);
  clearDinaCache();
  renderQuizStart();
  switchTab('quiz');
  showToast('Starting fresh Dosha Quiz 🌿');
}

// Jump straight to Stage 2 using saved Stage 1 scores as base
function retakeQuizStage2Only() {
  const d = loadData();
  const sc = d.dosha?.scores || {Vata:0,Pitta:0,Kapha:0};
  // Reconstruct raw scores from percentages (approximate — good enough as base)
  const base = { V: sc.Vata, P: sc.Pitta, K: sc.Kapha };
  quizState = {
    phase:'deep', qIdx:0, answers:[],
    scores:{...base},
    stage1Scores:{...base},
    primaryDosha: d.dosha.primary,
    ailments: d.ailments||[],
    city: d.city||''
  };
  quizStarted = true;
  renderQuizQuestion();
}

function renderQuizStart() {
  el('quiz-container').innerHTML = `
    <div class="result-card" style="background:linear-gradient(155deg,var(--charcoal),var(--burgundy-dark));">
      <div style="margin-bottom:12px;"><span class="mio" style="font-size:56px;color:var(--gold-light);">self_improvement</span></div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:var(--gold-light);">Discover Your Prakriti</div>
      <p style="font-size:13px;opacity:0.75;margin-top:10px;line-height:1.6;">In Ayurveda, your Prakriti is your unique mind-body constitution.<br>This quiz will reveal your dominant dosha.</p>
    </div>
    <div class="dosha-desc-card">
      <h3>How it works</h3>
      <p>Stage 1 is a quick 10-question quiz to determine your primary dosha. After that, you'll get the option to take the full 20-question deep-dive for a more precise Prakriti analysis.</p>
    </div>
    <button class="btn-primary" onclick="startQuiz()">Begin Stage 1 →</button>
  `;
}

function startQuiz() {
  quizStarted = true;
  quizState = { phase:'quick', qIdx:0, answers:[], scores:{V:0,P:0,K:0}, stage1Scores:{V:0,P:0,K:0}, ailments:[], city:'' };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const qs = quizState.phase === 'quick' ? QUICK_QUIZ : DEEP_QUIZ;
  const total = qs.length;
  const idx = quizState.qIdx;
  const q = qs[idx];
  const overallPct = quizState.phase === 'quick'
    ? ((idx/total)*50)
    : (50+(idx/total)*50);

  el('quiz-container').innerHTML = `
    <div class="quiz-progress">
      <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${overallPct}%"></div></div>
      <div class="quiz-progress-text">${idx+1}/${total} ${quizState.phase==='quick'?'• Stage 1':'• Stage 2'}</div>
    </div>
    <div class="quiz-q-card">
      <div class="quiz-q-num">Question ${idx+1}</div>
      <div class="quiz-q-text">${q.q}</div>
      <div class="quiz-q-hint">${q.hint}</div>
      <div class="quiz-options">
        ${q.opts.map((o,i)=>`
          <div class="quiz-option" id="opt-${i}" onclick="selectOption(${i})">
            <div class="opt-dot"></div>
            <span>${o.text}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="quiz-nav">
      ${idx > 0 ? `<button class="btn-back" onclick="prevQuestion()">← Back</button>` : ''}
      <button class="btn-next btn-primary" onclick="nextQuestion()" style="opacity:0.4;pointer-events:none;" id="quiz-next-btn">
        ${idx < total-1 ? 'Next →' : quizState.phase==='quick' ? 'See Results →' : 'Complete Quiz →'}
      </button>
    </div>
  `;
  // Restore previous selection
  if(quizState.answers[idx] !== undefined) {
    selectOption(quizState.answers[idx], true);
  }
  el('app-content').scrollTop = 0;
}

function selectOption(i, restore=false) {
  document.querySelectorAll('.quiz-option').forEach(o=>o.classList.remove('selected'));
  document.getElementById('opt-'+i).classList.add('selected');
  if(!restore) quizState.answers[quizState.qIdx] = i;
  el('quiz-next-btn').style.opacity='1';
  el('quiz-next-btn').style.pointerEvents='auto';
}

function prevQuestion() {
  quizState.qIdx--;
  renderQuizQuestion();
}

function nextQuestion() {
  if(quizState.answers[quizState.qIdx] === undefined) return;
  const qs = quizState.phase === 'quick' ? QUICK_QUIZ : DEEP_QUIZ;
  const selected = quizState.answers[quizState.qIdx];
  const v = qs[quizState.qIdx].opts[selected].v;
  quizState.scores.V += v.V;
  quizState.scores.P += v.P;
  quizState.scores.K += v.K;

  if(quizState.qIdx < qs.length-1) {
    quizState.qIdx++;
    renderQuizQuestion();
  } else if(quizState.phase === 'quick') {
    // Stage 1 done → collect ailments + city FIRST, then show result & offer Stage 2
    renderAilmentSelection();
  } else {
    // Stage 2 done → merge scores and update saved profile
    finalizeStage2();
  }
}

// ── AILMENT + CITY SELECTION (shown after Stage 1 Q10) ──
function renderAilmentSelection() {
  // Pre-populate from existing saved data if retaking
  const existing = loadData();
  quizState.ailments = existing.ailments ? [...existing.ailments] : [];
  quizState.city = existing.city || '';

  el('quiz-container').innerHTML = `
    <div class="quiz-progress">
      <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:50%"></div></div>
      <div class="quiz-progress-text">Stage 1 — Final Step</div>
    </div>
    <div class="dosha-desc-card" style="margin-bottom:16px;">
      <h3>One last thing 🌿</h3>
      <p>Select any health concerns you commonly experience. This helps AyurAI personalise food recommendations accurately for you.</p>
    </div>
    <div class="ailment-checkbox-list" id="ailment-list">
      ${COMMON_AILMENTS.map((a,i)=>{
        const checked = quizState.ailments.includes(a);
        return `
          <label class="ailment-checkbox${checked?' checked':''}" id="ailment-${i}" onclick="toggleAilment(${i})">
            <div class="cb-box" id="cb-${i}">${checked?'✓':''}</div>
            <span class="cb-label">${a}</span>
          </label>`;
      }).join('')}
    </div>
    <div class="form-group" style="margin-top:22px;">
      <label>Your City</label>
      <input type="text" id="quiz-city"
        placeholder="e.g. Mumbai, Singapore, Bangalore"
        value="${quizState.city}"
        style="padding:14px 16px;border:1.5px solid var(--cream-dark);border-radius:10px;font-size:15px;width:100%;outline:none;font-family:Jost,sans-serif;background:var(--cream);color:var(--text-main);"
        oninput="quizState.city=this.value"/>
    </div>
    <button class="btn-primary" onclick="saveStage1()" style="margin-top:16px;margin-bottom:12px;">
      Save &amp; See My Stage 1 Result →
    </button>
  `;
  el('app-content').scrollTop = 0;
}

function toggleAilment(i) {
  const label = el('ailment-'+i);
  const cb = el('cb-'+i);
  const name = COMMON_AILMENTS[i];
  if(quizState.ailments.includes(name)) {
    quizState.ailments = quizState.ailments.filter(a=>a!==name);
    label.classList.remove('checked');
    cb.textContent='';
  } else {
    quizState.ailments.push(name);
    label.classList.add('checked');
    cb.textContent='✓';
  }
}

// ── SAVE STAGE 1 & SHOW RESULT ──
function saveStage1() {
  const city = (el('quiz-city')?.value||'').trim() || quizState.city;
  const s = quizState.scores;
  const total = s.V+s.P+s.K||1;
  const pct = n => Math.round(n/total*100);
  const primary = s.V>=s.P && s.V>=s.K ? 'Vata' : s.P>=s.V && s.P>=s.K ? 'Pitta' : 'Kapha';
  quizState.primaryDosha = primary;
  quizState.stage1Scores = {V:s.V, P:s.P, K:s.K}; // snapshot for Stage 2 merge

  // Persist Stage 1 result immediately
  const data = loadData();
  data.dosha = {
    primary,
    stage: 1,
    completedAt: new Date().toISOString(),
    scores: {Vata:pct(s.V), Pitta:pct(s.P), Kapha:pct(s.K)},
    description: DOSHA_INFO[primary].description,
    qualities: DOSHA_INFO[primary].qualities,
    balance: DOSHA_INFO[primary].balance
  };
  data.ailments = quizState.ailments;
  if(city) { data.city = city; quizState.city = city; }
  saveData(data);
  initApp();
  showToast('Stage 1 saved! 🌿');
  renderStage1Result(primary, pct(s.V), pct(s.P), pct(s.K));
}

// ── STAGE 1 RESULT + OFFER STAGE 2 ──
function renderStage1Result(primary, vP, pP, kP) {
  el('quiz-container').innerHTML = `
    <div class="result-card">
      <div style="font-size:11px;letter-spacing:2px;opacity:0.7;text-transform:uppercase;">Stage 1 Result · Saved ✓</div>
      <div class="result-dosha-name">${primary}</div>
      <div style="font-size:13px;opacity:0.8;">is your dominant dosha</div>
      <div class="result-scores">
        <div class="result-score-item ${primary==='Vata'?'primary':''}"><div class="rs-label">Vata</div><div class="rs-val">${vP}%</div></div>
        <div class="result-score-item ${primary==='Pitta'?'primary':''}"><div class="rs-label">Pitta</div><div class="rs-val">${pP}%</div></div>
        <div class="result-score-item ${primary==='Kapha'?'primary':''}"><div class="rs-label">Kapha</div><div class="rs-val">${kP}%</div></div>
      </div>
    </div>
    <div class="dosha-desc-card">
      <h3>Want a deeper analysis? 🔬</h3>
      <p>Stage 2 adds 10 more questions covering mind, digestion, emotions and seasonal tendencies. Your Stage 1 result is already saved — Stage 2 will refine it further.</p>
    </div>
    <button class="btn-primary" onclick="startStage2()">Take Stage 2 Deep Dive →</button>
    <button class="btn-secondary" style="margin-top:10px;margin-bottom:32px;" onclick="goHomeAfterStage1()">I'm done — Go to Home</button>
  `;
  el('app-content').scrollTop = 0;
}

function goHomeAfterStage1() {
  switchTab('home');
}

// ── START STAGE 2 ──
function startStage2() {
  quizState.phase = 'deep';
  quizState.qIdx = 0;
  quizState.answers = [];
  // Reset live scores to Stage 1 snapshot so Stage 2 answers accumulate on top
  quizState.scores = {...quizState.stage1Scores};
  renderQuizQuestion();
}

// ── FINALIZE STAGE 2 — merge into saved profile ──
function finalizeStage2() {
  const s = quizState.scores; // includes both Stage 1 + Stage 2 answers
  const total = s.V+s.P+s.K||1;
  const pct = n => Math.round(n/total*100);
  const primary = s.V>=s.P && s.V>=s.K ? 'Vata' : s.P>=s.V && s.P>=s.K ? 'Pitta' : 'Kapha';

  const data = loadData();
  data.dosha = {
    primary,
    stage: 2,
    completedAt: new Date().toISOString(),
    scores: {Vata:pct(s.V), Pitta:pct(s.P), Kapha:pct(s.K)},
    description: DOSHA_INFO[primary].description,
    qualities: DOSHA_INFO[primary].qualities,
    balance: DOSHA_INFO[primary].balance
  };
  // Ailments & city already saved in Stage 1 — keep them unless re-entered
  saveData(data);
  initApp();
  showToast('Stage 2 complete! Profile refined 🙏');

  // Show final refined result
  el('quiz-container').innerHTML = `
    <div class="result-card">
      <div style="font-size:11px;letter-spacing:2px;opacity:0.7;text-transform:uppercase;">Full Prakriti Analysis · Stage 1 + 2</div>
      <div class="result-dosha-name">${primary}</div>
      <div style="font-size:13px;opacity:0.8;">Refined Dominant Dosha</div>
      <div class="result-scores">
        <div class="result-score-item ${primary==='Vata'?'primary':''}"><div class="rs-label">Vata</div><div class="rs-val">${pct(s.V)}%</div></div>
        <div class="result-score-item ${primary==='Pitta'?'primary':''}"><div class="rs-label">Pitta</div><div class="rs-val">${pct(s.P)}%</div></div>
        <div class="result-score-item ${primary==='Kapha'?'primary':''}"><div class="rs-label">Kapha</div><div class="rs-val">${pct(s.K)}%</div></div>
      </div>
    </div>
    <div class="dosha-desc-card">
      <h3>${primary} — Your Refined Prakriti</h3>
      <p>${DOSHA_INFO[primary].description}</p>
    </div>
    <div class="dosha-desc-card">
      <h3>Balance Tips</h3>
      <p>${DOSHA_INFO[primary].balance}</p>
    </div>
    <button class="btn-primary" style="margin-bottom:32px;" onclick="switchTab('home')"><span class="mi" style="font-size:16px;vertical-align:-3px;margin-right:5px;">home</span>Go to Home</button>
  `;
  el('app-content').scrollTop = 0;
}

function renderQuizResult() {
  const d = loadData();
  if(!d.dosha) { renderQuizStart(); return; }
  const info = DOSHA_INFO[d.dosha.primary]||{};
  const sc = d.dosha.scores||{};
  const stage = d.dosha.stage || 1;
  el('quiz-container').innerHTML = `
    <div class="result-card">
      <div style="font-size:11px;letter-spacing:2px;opacity:0.7;text-transform:uppercase;">Your Prakriti · Stage ${stage} ${stage===2?'✓ Complete':'— Stage 2 Available'}</div>
      <div class="result-dosha-name">${d.dosha.primary}</div>
      <div style="font-size:13px;opacity:0.8;">Dominant Dosha</div>
      <div class="result-scores">
        <div class="result-score-item ${d.dosha.primary==='Vata'?'primary':''}"><div class="rs-label">Vata</div><div class="rs-val">${sc.Vata||0}%</div></div>
        <div class="result-score-item ${d.dosha.primary==='Pitta'?'primary':''}"><div class="rs-label">Pitta</div><div class="rs-val">${sc.Pitta||0}%</div></div>
        <div class="result-score-item ${d.dosha.primary==='Kapha'?'primary':''}"><div class="rs-label">Kapha</div><div class="rs-val">${sc.Kapha||0}%</div></div>
      </div>
    </div>
    <div class="dosha-desc-card">
      <h3>${d.dosha.primary} — Your Nature</h3>
      <p>${info.description||''}</p>
    </div>
    <div class="dosha-desc-card">
      <h3>Qualities</h3>
      <p>${info.qualities||''}</p>
    </div>
    <div class="dosha-desc-card">
      <h3>Balance Tips</h3>
      <p>${info.balance||''}</p>
    </div>
    ${d.ailments&&d.ailments.length ? `
    <div class="dosha-desc-card">
      <h3>Noted Health Concerns</h3>
      <div class="ailments-list" style="margin-top:8px;">${d.ailments.map(a=>`<span class="ailment-tag">${a}</span>`).join('')}</div>
    </div>` : ''}
    ${stage===1 ? `
    <div class="dosha-desc-card" style="border:1.5px solid var(--gold);background:var(--gold-pale);">
      <h3>🔬 Deepen Your Analysis</h3>
      <p>You completed Stage 1. Take Stage 2 (10 more questions) to get a more refined Prakriti reading. Your current result is safe — Stage 2 will only improve it.</p>
    </div>
    <button class="btn-primary" onclick="retakeQuizStage2Only()" style="margin-bottom:10px;">Continue to Stage 2 →</button>
    ` : ''}