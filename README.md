# 🪷 AyurAI — Ancient Wisdom, Modern Intelligence

A fully client-side Ayurvedic wellness web application. No backend required. Runs entirely from a single HTML file, stores all data in `localStorage`, and calls the OpenAI API directly from the browser.

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Data Model](#data-model)
- [Module Reference](#module-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Onboarding** | 5-slide introduction shown to first-time visitors — covers Dosha, Food, Herbs & Daily Routine before reaching sign-up |
| **Dosha Quiz** | Two-stage quiz (10Q + 10Q deep-dive) to determine Vata/Pitta/Kapha constitution |
| **Food Check** | AI verdict on whether a food suits your dosha, time, season & ailments — full-screen overlay from Home |
| **Meal Planner** | Plan meals in advance with date/time window selector |
| **Damage Control** | If food is not ideal, get remedies to reduce its negative effect |
| **Ask Anything** | Personalised Ayurvedic chat assistant — full-screen overlay with multi-turn conversation, starter prompts, and profile-aware responses |
| **Herb Advisor** | Personalised herb recommendations by dosha, concern, or season — full-screen overlay from Home |
| **Herb Chat** | Free-form conversation with an Ayurvedic herb expert |
| **Symptom Checker** | Root-cause Ayurvedic diagnosis with food, herb & lifestyle guidance — accessed from Home quick-action |
| **Face Care** | Personalised Ayurvedic face care routines — gender-aware tab (in progress) |
| **Hair Care** | Personalised Ayurvedic hair care routines — gender-aware tab (in progress) |
| **Daily Routine** | AI-generated Dinacharya with 8 personalised time blocks |
| **Dosha Insights** | Home card with foods to avoid, best meal times, top 3 care tips |
| **PWA / Installable** | Works offline (app shell cached), installable on mobile and desktop |
| **Share App** | One-tap share via native Web Share API (mobile) or clipboard copy (desktop) from Settings |
| **Error Diagnostics** | Last 5 errors logged locally; exportable as `<username>_error_logs.json` |
| **Data Portability** | Full profile export/import as `my_info.json` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                Browser (Client-Side)            │
│                                                 │
│  ┌──────────┐   ┌─────────┐   ┌──────────────┐ │
│  │   HTML   │   │   CSS   │   │      JS      │ │
│  │ (markup) │   │(styles) │   │ 8 modules    │ │
│  └──────────┘   └─────────┘   └──────┬───────┘ │
│                                      │         │
│  ┌───────────────────────────────────▼───────┐ │
│  │               localStorage                │ │
│  │  ayurai_my_info   │  ayurai_dina_prefs    │ │
│  │  ayurai_dina_cache│  ayurai_food_cache    │ │
│  │  ayurai_error_log │  ayurai_api_err       │ │
│  └───────────────────────────────────────────┘ │
│                      │                         │
└──────────────────────┼─────────────────────────┘
                       │ HTTPS fetch
             ┌─────────▼──────────┐
             │  OpenAI API        │
             │  gpt-4o-mini       │
             └────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single HTML file | Zero-dependency deployment — works from `file://`, any CDN, or local server |
| localStorage only | Portable across devices via export/import; no server, no auth backend needed |
| OpenAI key in browser | Intended for personal use — user owns their key |
| No framework | Vanilla JS keeps the bundle size minimal and the app framework-agnostic |
| Module split in source | Source files are split by feature for maintainability; assembled into one file for deployment |
| Food/Herbs/Ask as overlays | Full-screen overlays keep the nav bar to 5 tabs — all accessed from Home quick-actions |
| Symptom/Quiz/History as hidden tabs | No nav item needed; reached via quick-action card (Symptom), Settings (Quiz), Home link (History) |
| Gender-aware Face/Hair icons | `face`/`face_6` and `face_2`/`face_retouching_natural` swap at login based on stored gender |

---

## 📁 Project Structure

```
ayurai/
├── docs/                       # ← Deployment root (GitHub Pages serves this folder)
│   ├── index.html              # ← THE APP. This is the deployable artifact. Edit this.
│   ├── sw.js                   # Service worker — cache-first PWA support
│   ├── manifest.json           # PWA manifest (display:standalone, icons, theme)
│   ├── favicon.svg             # App icon
│   ├── 404.html                # Redirects all paths to / for SPA routing
│   ├── DATA_MODEL.md           # localStorage schema documentation
│   └── superpowers/
│       └── specs/              # Feature design specs (markdown, dated)
│
├── src/                        # Source files (same code split by module for readability)
│   ├── css/
│   │   └── main.css            # All styles (~2300 lines, CSS variables, components)
│   │
│   ├── js/
│   │   ├── core.js             # Data layer, error logger, auth, app init, tab routing, PWA
│   │   ├── quiz.js             # Dosha Quiz (Stage 1 + 2), ailment selection, results
│   │   ├── food.js             # Food Check, meal boosters, remedy, dosha insights, history
│   │   ├── meal-timing.js      # Advanced filters: date/time picker, ailment chips
│   │   ├── herbs.js            # Herb Advisor (by dosha, concern, seasonal, chat)
│   │   ├── symptoms.js         # Symptom Checker with Ayurvedic Nidana analysis
│   │   ├── dinacharya.js       # Daily Routine generator with filter state
│   │   └── ask-anything.js     # Ask Anything full-screen overlay chat
│   │
│   └── html/
│       └── app.html            # HTML body markup (~4100 lines — screens, tabs, panels)
│
├── scripts/
│   ├── build.js                # Assembles src/ → public/index.html (alt build workflow)
│   ├── validate.js             # Validates docs/index.html (syntax, IDs, functions, coverage)
│   ├── stamp-version.js        # Bumps minor version + SW cache key across all files
│   └── hooks/
│       └── pre-push            # Git hook: stamps version, amends commit, force-pushes
│
├── .claude/                    # Claude Code configuration (shared via git)
│   ├── settings.json           # Hooks: SessionStart (install git hook) + PreToolUse (guard)
│   ├── hooks/
│   │   ├── session-start.sh    # Installs git pre-push hook at session start
│   │   └── validate-bash.sh    # Blocks destructive shell commands (rm -rf, git reset --hard…)
│   ├── rules/
│   │   ├── code-style.md       # Material Icons, CSS variables, DOM helpers, overlay patterns
│   │   └── api-conventions.md  # OpenAI wrapper selection + response parsing conventions
│   ├── commands/
│   │   └── review.md           # /project:review — runs syntax check + full validator
│   ├── skills/deploy/          # Deploy skill pattern (reference for future projects)
│   └── agents/                 # Code reviewer & security auditor agents (reference docs)
│
├── .mcp.json                   # GitHub MCP server — connects Claude to sidkapse/ayurai repo
├── specs/                      # Feature design specs (mirrors docs/superpowers/specs/)
├── package.json                # devDependencies: gh-pages only
└── README.md
```

> **Important:** `docs/index.html` is the single deployable artifact — the complete self-contained app. The `src/` files are the same code split into modules for easier reading and editing.

---

## 🚀 Getting Started

### Option 1 — Open directly (simplest)

```bash
open docs/index.html
# or drag the file into any browser
```

### Option 2 — Local server (recommended for development)

```bash
# Python
python3 -m http.server 8080 --directory docs

# Node.js
npx serve docs

# VS Code
# Install "Live Server" extension, right-click index.html → Open with Live Server
```

Then visit `http://localhost:8080`

### First-time Setup

1. Open the app — the 5-slide onboarding intro plays automatically
2. **Sign Up** with name, email, password
3. Complete the **Dosha Quiz** (Stage 1 takes ~3 mins)
4. Go to **Settings** → add your **OpenAI API key** (`sk-...`)
5. Set your **City** for seasonal analysis
6. Start using **Food Check**, **Ask Anything**, **Herbs**, **Dinacharya**, **Symptom Checker**

---

## ⚙️ Configuration

All configuration is stored in `localStorage` under the key `ayurai_my_info`.

| Setting | Where to set | Description |
|---|---|---|
| OpenAI API Key | Settings → AI Configuration | Required for all AI features. Uses `gpt-4o-mini`. |
| City | Settings → Location & Profile | Used for seasonal inference in all AI prompts |
| Date of birth | Settings → Location & Profile | Used to include age in AI prompts |
| Gender | Settings → Location & Profile | Used in all AI prompts for personalised recommendations |
| Wake/Sleep time | Routine tab → filters | Persisted in `ayurai_dina_prefs` |

### OpenAI API Functions

The app uses `gpt-4o-mini` for all calls via four wrapper functions defined in `core.js`:

| Function | Signature | Used For |
|---|---|---|
| `callOpenAI()` | `(prompt, key)` → ~1,000 tokens | Simple JSON responses (remedy, dosha insights) |
| `callOpenAILarge()` | `(prompt, key, maxTokens)` → up to 3,500 | Complex responses (food check, herbs, symptoms, dinacharya) |
| `callOpenAIChat()` | `(messages[], key, maxTokens)` | Multi-turn conversation without streaming |
| `callOpenAIChatStream()` | `(messages[], key, maxTokens, onChunk)` | Streaming responses — `onChunk(delta)` called per token (herb chat, Ask Anything) |

> All AI responses are parsed with `.replace(/```json\|```/g, '').trim()` before `JSON.parse()` to strip markdown fences the model occasionally wraps around JSON output.

---

## 🗄️ Data Model

All app data lives in `localStorage`. Full schema in [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).

### `ayurai_my_info` — main store

```jsonc
{
  "user": {
    "name": "Sidd",
    "email": "sidd@example.com",
    "password": "plaintext",          // stored locally only — not transmitted
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "dosha": {
    "primary": "Pitta",
    "stage": 2,                       // 1 = Stage 1 only, 2 = full analysis
    "scores": { "Vata": 30, "Pitta": 50, "Kapha": 20 },
    "description": "...",
    "completedAt": "2025-01-01T00:00:00Z"
  },
  "ailments": ["Acidity", "Bloating"],
  "city": "Singapore",
  "birth_month": 3,                   // optional — used for age in AI prompts
  "birth_year": 1990,                 // optional
  "gender": "Male",                   // optional — Male|Female|Non-binary|"" (Prefer not to say)
  "foodHistory": [                    // last 10 food checks (FIFO)
    { "food": "Chicken biryani", "verdict": "YES", "reason": "...", "timestamp": "..." }
  ],
  "doshaInsights": {                  // cached AI-generated insights (cleared on quiz retake)
    "foods_to_avoid": ["..."],
    "top3_care": [{ "icon": "spa", "tip": "..." }],
    "best_meal_times": "...",
    "dosha_strength": "..."
  },
  "settings": { "openaiApiKey": "sk-..." },
  "meta": { "appVersion": "1.26", "lastLogin": "2025-01-01T00:00:00Z" }
}
```

### All localStorage keys

| Key | Purpose |
|---|---|
| `ayurai_my_info` | User profile, dosha, ailments, food history, dosha insights, settings |
| `ayurai_dina_prefs` | `{ wake, sleep, dayOffset, diets }` — Dinacharya filter preferences |
| `ayurai_dina_cache` | Generated Dinacharya result (expires when date changes) |
| `ayurai_food_cache` | Last food check result + remedy (cleared on New Check) |
| `ayurai_error_log` | Array of up to 5 error objects `{ ts, ctx, msg, stack }` |
| `ayurai_api_err` | Persisted API error type — drives the warning dot in Settings |

---

## 📦 Module Reference

### `src/js/core.js`
Data layer, error logging, auth (signup/login/logout), app initialisation, tab routing, onboarding, pull-to-refresh, PWA install, toast notifications, API wrapper functions.

**Key functions:**
- `loadData()` / `saveData()` / `getData(path)` / `setData(path, value)` — localStorage CRUD
- `logError(context, error)` — appends to `ayurai_error_log` (max 5 entries)
- `callOpenAI(prompt, key)` / `callOpenAILarge(prompt, key, maxTokens)` — API wrappers
- `initApp()` — populates all UI after login; also updates gender-aware Face/Hair tab icons
- `switchTab(name)` — tab navigation and lazy init
- `showToast(msg)` — bottom notification
- `el(id)` / `setText(id, text)` / `setHTML(id, html)` — safe DOM helpers
- `initPWA()` / `triggerPWAInstall()` — PWA install prompt handling
- `shareApp()` — native Web Share API with clipboard-copy fallback for desktop
- `initPullToRefresh()` — pull-to-refresh gesture on the app scroller
- `openFoodOverlay()` / `closeFoodOverlay()` — Food Check full-screen overlay
- `openHerbsOverlay()` / `closeHerbsOverlay()` — Herb Advisor full-screen overlay

### `src/js/quiz.js`
Two-stage Dosha Quiz. Stage 1 (10 questions) → Ailment selection → Save → offer Stage 2 (10 questions) → merge scores and update profile.

**Key functions:** `initQuiz()`, `startQuiz()`, `nextQuestion()`, `saveStage1()`, `finalizeStage2()`, `renderQuizResult()`, `retakeQuiz()`

### `src/js/food.js`
Food Check with AI verdict, meal boosters input (YES path), better alternatives + best times (NO path), damage control remedy card, cuisine alternatives, dosha insights card, food history, data export/import.

**Key functions:** `checkFood()`, `renderFoodResult()`, `getRemedy()`, `getCuisineAlts()`, `saveFoodHistory()`, `renderHistory()`, `renderHomeHistory()`, `loadDoshaInsights()`, `exportJSON()`, `importJSON()`, `saveCity()`, `saveApiKey()`, `setApiErrorState()`

### `src/js/meal-timing.js`
Advanced Filters panel for Food Check — switches between "Right Now" and "Plan Ahead" modes with date/time picker, active ailment chips that feed into the food check prompt.

**Key functions:** `initMealTiming()`, `setTimingMode()`, `updatePlanPreview()`, `initAdvAilmentChips()`

### `src/js/herbs.js`
Herb & Supplement Advisor — four modes: by dosha, by concern, seasonal, free chat. Displays herb cards with usage, dosage, cautions.

**Key functions:** `initHerbAdvisor()`, `getHerbsByDosha()`, `getHerbsByConcern()`, `getSeasonalHerbs()`, `sendHerbChat()`

### `src/js/symptoms.js`
Ayurvedic Symptom Checker — body area selector, severity/duration inputs, free-text description. AI returns Nidana analysis with root causes, foods to favour/avoid, herbs, lifestyle guidance, and prognosis.

**Key functions:** `initSymptomChecker()`, `runSymptomCheck()`, `renderSymptomResult()`

### `src/js/dinacharya.js`
Daily Routine (Dinacharya) generator — filter screen with day selector (today/tomorrow/day after), wake/sleep time, diet preferences, and active symptom chips. Generates 8 personalised time blocks with live clock highlighting the current block.

**Key functions:** `initDinacharya()`, `renderDinacharya_StartScreen()`, `generateDinacharya()`, `renderDinacharya()`, `stopDinaTicker()`

### `src/js/ask-anything.js`
Ask Anything — full-screen overlay chat powered by the user's full Ayurveda profile. Scope-limited to Ayurvedic topics; gracefully declines off-topic queries with inline suggestion cards. Chat history is per-session (in-memory, not persisted).

**Key functions:** `openAskAnything()`, `closeAskAnything()`, `sendAskMessage(text)`, `callOpenAIChat(messages, key, maxTokens)`, `buildAskSystemPrompt(d)`, `renderAskStarters(d)`

---

## 🌐 Deployment

### GitHub Pages (recommended)

```bash
# Option 1 — Manual
# Push repo to GitHub → Settings → Pages → Source: main branch → Folder: /docs

# Option 2 — gh-pages CLI
npm install
npm run deploy   # pushes docs/ to gh-pages branch
```

### Any static host

`docs/index.html` is a single self-contained file — deploy it to any static host:

```bash
# Netlify — drag & drop the docs/ folder to netlify.com/drop

# Vercel
npx vercel docs/

# AWS S3
aws s3 cp docs/index.html s3://your-bucket/index.html --acl public-read
```

### Environment note

No environment variables. No build step. No node_modules at runtime. The file works as-is.

---

## 🔧 Scripts & Commands

### CLI Scripts

| Command | Purpose |
|---|---|
| `node scripts/validate.js` | Full validation of `docs/index.html` — JS syntax, required functions, HTML IDs, `el()` integrity, duplicate declarations, API error handling coverage |
| `node scripts/stamp-version.js` | Bumps minor version number and SW cache key across `docs/index.html`, `src/`, and `docs/sw.js` |
| `node scripts/build.js` | Assembles `src/` files into `public/index.html` (alternative build workflow; `docs/index.html` is still primary) |
| `python3 -m http.server 8080 --directory docs` | Serve the app locally at `http://localhost:8080` |

### Claude Code Slash Commands

| Command | Purpose |
|---|---|
| `/project:review` | Runs JS syntax check + `node scripts/validate.js` and reports pass/fail. Use before every commit. |

Run `node scripts/validate.js` (or `/project:review`) before every commit. All checks must pass.

---

## 🤝 Contributing

1. Edit `docs/index.html` directly (it is the source of truth for deployment)
2. Mirror changes into the corresponding `src/` file for readability
3. Run `/project:review` or `node scripts/validate.js` — all checks must pass
4. Test by serving `docs/` locally: `python3 -m http.server 8080 --directory docs`
5. Commit messages **and PR titles** must end with the app version: `feat: description v1.XX`
   — read the current version: `grep -o "APP_VERSION = '[^']*'" src/js/core.js | grep -o "'[^']*'" | tr -d "'"`
   — the pre-push hook bumps the version on push, so use the post-push version in the PR title

### Code Conventions

Full rules are in `.claude/rules/` (loaded automatically by Claude Code). Key points:

- **No frameworks** — vanilla JS only
- **No build tools required** — `docs/index.html` is edited directly and deployed as-is
- **CSS variables** for all colours — defined in `:root` at the top of `main.css` (see `.claude/rules/code-style.md` for the full variable reference)
- **Material Icons** for all icons — `<span class="mi">icon_name</span>` (filled) or `<span class="mio">icon_name</span>` (outlined). Never use emoji for UI icons.
- **Error handling** — all async functions must call `logError(context, e)` in their catch block
- **API wrapper selection** — `callOpenAI()` for ≤1k token JSON responses, `callOpenAILarge()` for larger, `callOpenAIChat()` for multi-turn, `callOpenAIChatStream()` for streaming (see `.claude/rules/api-conventions.md`)

### Claude Code Setup (for AI-assisted development)

The `.claude/` directory configures Claude Code for this project:

- **Hooks** — `validate-bash.sh` blocks destructive commands; `session-start.sh` installs the git pre-push hook (bumps version, rewrites commit message version, force-pushes amended commit)
- **Rules** — `code-style.md` and `api-conventions.md` are loaded every session
- **Commands** — `/project:review` validates the codebase end-to-end
- **MCP** — `.mcp.json` connects Claude to the GitHub repository for PR/issue management

---

## 📄 License

Personal use. Not for commercial distribution.

---

*Built with Claude AI · Powered by OpenAI gpt-4o-mini · Inspired by classical Ayurvedic texts*
