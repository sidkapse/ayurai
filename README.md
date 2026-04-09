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
| **Dosha Quiz** | Two-stage quiz (10Q + 10Q deep-dive) to determine Vata/Pitta/Kapha constitution |
| **Food Check** | AI verdict on whether a food suits your dosha, time, season & ailments |
| **Meal Planner** | Plan meals in advance with date/time window selector |
| **Damage Control** | If food is not ideal, get remedies to reduce its negative effect |
| **Herb Advisor** | Personalised herb recommendations by dosha, concern, or season |
| **Herb Chat** | Free-form conversation with an Ayurvedic herb expert |
| **Symptom Checker** | Root-cause Ayurvedic diagnosis with food, herb & lifestyle guidance |
| **Daily Routine** | AI-generated Dinacharya with 8 personalised time blocks |
| **Dosha Insights** | Home card with foods to avoid, best meal times, top 3 care tips |
| **Error Diagnostics** | Last 5 errors logged locally; exportable as `<username>_error_logs.json` |
| **Data Portability** | Full profile export/import as `my_info.json` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│               Browser (Client-Side)         │
│                                             │
│  ┌──────────┐   ┌─────────┐  ┌──────────┐  │
│  │   HTML   │   │   CSS   │  │    JS    │  │
│  │ (markup) │   │(styles) │  │ (logic)  │  │
│  └──────────┘   └─────────┘  └────┬─────┘  │
│                                   │        │
│  ┌────────────────────────────────▼──────┐ │
│  │           localStorage                │ │
│  │  ayurai_my_info  │  ayurai_dina_prefs │ │
│  │  ayurai_error_log                     │ │
│  └───────────────────────────────────────┘ │
│                   │                        │
└───────────────────┼────────────────────────┘
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
| Module split in source | Source files are split by feature for maintainability; bundled into one file for distribution |

---

## 📁 Project Structure

```
ayurai/
├── public/
│   └── index.html          # ← The distributable. This is the app. Deploy this file.
│
├── src/                    # Source files (split for readability & Claude Code editing)
│   ├── css/
│   │   └── main.css        # All styles (CSS variables, components, screens)
│   │
│   ├── js/
│   │   ├── core.js         # Data layer, error logger, auth, app init, tab routing
│   │   ├── quiz.js         # Dosha Quiz (Stage 1 + 2), ailment selection, results
│   │   ├── food.js         # Food Check, meal boosters, dos/donts, remedy cards
│   │   ├── meal-timing.js  # Advanced filters: date/time picker, ailment chips
│   │   ├── herbs.js        # Herb Advisor (by dosha, concern, seasonal, chat)
│   │   ├── symptoms.js     # Symptom Checker with Ayurvedic Nidana analysis
│   │   └── dinacharya.js   # Daily Routine generator with filter state
│   │
│   └── html/
│       └── app.html        # HTML body markup (screens, tabs, panels)
│
├── docs/
│   └── DATA_MODEL.md       # localStorage schema documentation
│
├── .gitignore
└── README.md
```

> **Important:** `public/index.html` is the single deployable artifact — it is the complete self-contained app. The `src/` files are the same code split into modules for easier editing with Claude Code or any IDE.

---

## 🚀 Getting Started

### Option 1 — Open directly (simplest)

```bash
open public/index.html
# or drag the file into any browser
```

### Option 2 — Local server (recommended for development)

```bash
# Python
python3 -m http.server 8080 --directory public

# Node.js
npx serve public

# VS Code
# Install "Live Server" extension, right-click index.html → Open with Live Server
```

Then visit `http://localhost:8080`

### First-time Setup

1. Open the app → **Sign Up** with name, email, password
2. Complete the **Dosha Quiz** (Stage 1 takes ~3 mins)
3. Go to **Settings** → add your **OpenAI API key** (`sk-...`)
4. Set your **City** for seasonal analysis
5. Start using **Food Check**, **Herbs**, **Dinacharya**, **Symptom Checker**

---

## ⚙️ Configuration

All configuration is stored in `localStorage` under the key `ayurai_my_info`.

| Setting | Where to set | Description |
|---|---|---|
| OpenAI API Key | Settings → AI Configuration | Required for all AI features. Uses `gpt-4o-mini`. |
| City | Settings → Location | Used for seasonal inference in all AI prompts |
| Wake/Sleep time | Routine tab → filters | Persisted in `ayurai_dina_prefs` |

### OpenAI Model

The app uses `gpt-4o-mini` for all calls. Two token limits are used:

| Function | Token Limit | Used For |
|---|---|---|
| `callOpenAI()` | 1,000 | Simple responses (remedy, cuisine alts, dosha insights) |
| `callOpenAILarge()` | 2,000–3,000 | Complex responses (food check, herbs, symptoms, dinacharya) |

To change the model, find `callOpenAI` and `callOpenAILarge` in `src/js/core.js`.

---

## 🗄️ Data Model

All app data lives in `localStorage.ayurai_my_info` as a JSON object.

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
    "qualities": "Hot · Sharp · ...",
    "balance": "...",
    "completedAt": "2025-01-01T00:00:00Z"
  },
  "ailments": ["Acidity", "Bloating"],
  "city": "Singapore",
  "foodHistory": [                    // Last 10 food checks
    {
      "food": "Chicken biryani",
      "verdict": "YES",
      "reason": "...",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  ],
  "doshaInsights": {                  // Cached AI-generated insights
    "foods_to_avoid": ["..."],
    "top3_care": [{"icon": "...", "tip": "..."}],
    "best_meal_times": "...",
    "dosha_strength": "..."
  },
  "settings": {
    "openaiApiKey": "sk-..."
  },
  "meta": {
    "appVersion": "2.0",
    "lastLogin": "2025-01-01T00:00:00Z"
  }
}
```

Additional localStorage keys:

| Key | Contents |
|---|---|
| `ayurai_dina_prefs` | `{ wake, sleep, dayOffset }` — Dinacharya filter preferences |
| `ayurai_error_log` | Array of up to 5 error objects with timestamp, context, message |

---

## 📦 Module Reference

### `src/js/core.js`
Data layer, error logging, auth (signup/login/logout), app initialisation, tab routing, toast notifications, API wrapper functions.

**Key exports (global functions):**
- `loadData()` / `saveData()` / `getData()` / `setData()` — localStorage CRUD
- `logError(context, error)` — error logger
- `callOpenAI(prompt, key)` — 1k token API call
- `callOpenAILarge(prompt, key, maxTokens)` — large token API call
- `initApp()` — initialises all UI state after login
- `switchTab(name)` — tab navigation

### `src/js/quiz.js`
Two-stage Dosha Quiz. Stage 1 (10 questions) → Ailment selection → Save → offer Stage 2 (10 questions) → merge and update.

**Key functions:** `initQuiz()`, `startQuiz()`, `nextQuestion()`, `saveStage1()`, `finalizeStage2()`, `renderQuizResult()`

### `src/js/food.js`
Food Check with AI verdict, meal boosters (YES path), alternatives + better times (NO path), damage control remedy card, cuisine alternatives.

**Key functions:** `checkFood()`, `renderFoodResult()`, `getRemedy()`, `renderRemedyCard()`, `getCuisineAlts()`

### `src/js/meal-timing.js`
Advanced Filters panel for Food Check — date/time window picker, active ailment chips.

**Key functions:** `toggleAdvFilters()`, `initMealTiming()`, `setTimingMode()`, `updatePlanPreview()`, `initAdvAilmentChips()`

### `src/js/herbs.js`
Herb & Supplement Advisor — four modes: by dosha, by concern, seasonal, free chat.

**Key functions:** `initHerbAdvisor()`, `getHerbsByDosha()`, `getHerbsByConcern()`, `getSeasonalHerbs()`, `renderHerbChat()`, `sendHerbChat()`

### `src/js/symptoms.js`
Ayurvedic Symptom Checker — body area selector, severity slider, duration picker, AI Nidana analysis with root causes, actions, food guidance, herbs, lifestyle, prognosis.

**Key functions:** `initSymptomChecker()`, `runSymptomCheck()`, `renderSymptomResult()`

### `src/js/dinacharya.js`
Daily Routine (Dinacharya) generator — filter screen with day selector, wake/sleep time inputs, active symptom chips. Generates 8 time blocks with current-block highlighting.

**Key functions:** `initDinacharya()`, `renderDinacharya_StartScreen()`, `generateDinacharya()`, `renderDinacharya()`

---

## 🌐 Deployment

### Static hosting (recommended)

The app is a single static HTML file — deploy `public/index.html` to any static host:

```bash
# Netlify (drag & drop public/ folder to netlify.com/drop)

# Vercel
npx vercel public/

# GitHub Pages
# Push to gh-pages branch, set source to /root

# AWS S3
aws s3 cp public/index.html s3://your-bucket/index.html --acl public-read

# Cloudflare Pages
# Connect repo, set build output to public/
```

### Environment note

No environment variables, no build step, no node_modules. The file works as-is.

### PWA / installable (future enhancement)

Adding a `manifest.json` and `service-worker.js` to `/public` would make the app installable on mobile as a PWA. This is a planned enhancement.

---

## 🔧 Working with Claude Code

This project is structured for easy editing with **Claude Code** (CLI) or Claude Desktop's Code feature.

```bash
# Open project in Claude Code
claude /path/to/ayurai/

# Or reference specific modules
# "Update the food check prompt in src/js/food.js to also return nutritional score"
# "Add a new tab for Wellness Tracker — add CSS to src/css/main.css and JS to src/js/wellness.js"
# "Fix the bug in src/js/dinacharya.js renderDinacharya function"
```

After editing `src/` files, rebuild `public/index.html`:

```bash
node scripts/build.js   # (see below — add this if needed)
```

Or manually inline the updated sections back into `public/index.html`.

---

## 🤝 Contributing

1. Edit source files in `src/`
2. Test by serving `public/index.html`
3. Keep `public/index.html` in sync (it is the deployed artifact)
4. Follow the existing pattern: each feature = one JS module + CSS section

### Code Conventions

- **No frameworks** — vanilla JS only
- **No build tools required** — the monolithic `index.html` is the source of truth for deployment
- **CSS variables** for all colours — defined in `:root` at top of `main.css`
- **Material Icons** for all icons — use `<span class="mi">icon_name</span>` or `<span class="mio">icon_name</span>` for outlined
- **Error handling** — all async functions must call `logError(context, e)` in their catch block
- **Token efficiency** — use `callOpenAI()` (1k tokens) for simple responses, `callOpenAILarge()` for complex ones

---

## 📄 License

Personal use. Not for commercial distribution.

---

*Built with Claude AI · Powered by OpenAI gpt-4o-mini · Inspired by classical Ayurvedic texts*
