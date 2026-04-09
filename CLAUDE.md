# CLAUDE.md — AyurAI Project Guide for Claude Code

This file gives Claude Code the context it needs to work effectively on this project.

## What This Project Is

AyurAI is a single-file Ayurvedic wellness web app. It runs entirely client-side — no backend, no build step, no npm install. The deployable artifact is `docs/index.html`.

## Project Layout

```
docs/index.html     ← THE APP. Deploy this. Edit this for quick fixes.
src/js/               ← JS split by feature for readability
src/css/main.css      ← All CSS
src/html/app.html     ← HTML markup only (no CSS/JS)
docs/DATA_MODEL.md    ← localStorage schema
```

## Critical Rules When Editing

1. **`docs/index.html` is the source of truth for deployment.** It is a self-contained monolithic file. When making changes, edit it directly.
2. **`src/` files mirror `docs/index.html`** — they are the same code split for readability. Keep them in sync.
3. **Never add npm packages or build tools** unless explicitly asked. The app has zero dependencies beyond Google Fonts CDN.
4. **Always run the syntax checker after editing JS:**
   ```bash
   node -e "const fs=require('fs'),h=fs.readFileSync('docs/index.html','utf8'),m=h.match(/<script>([\S\s]*?)<\/script>/);fs.writeFileSync('/tmp/ayurai_test.js',m[1]);" && node --check /tmp/ayurai_test.js && echo "✅ Syntax OK"
   ```
5. **All icons use Material Icons** — `<span class="mi">icon_name</span>` (filled) or `<span class="mio">icon_name</span>` (outlined). Never use emoji for UI icons.
6. **Never use `text-transform:uppercase` or `letter-spacing` on a parent that contains Material Icon spans** — it breaks glyph rendering.

## Architecture at a Glance

```
localStorage (ayurai_my_info)
    ↑↓
core.js → loadData() / saveData() / getData() / setData()
    ↓
Feature modules (quiz, food, herbs, symptoms, dinacharya)
    ↓
callOpenAI() / callOpenAILarge()
    ↓
OpenAI API (gpt-4o-mini)
```

## Adding a New Feature — Checklist

- [ ] Add CSS section in `src/css/main.css` with `/* ── FEATURE NAME ── */` comment
- [ ] Add JS module as `src/js/feature.js`
- [ ] Add HTML tab panel in `src/html/app.html`
- [ ] Add tab nav item in the `<nav id="tab-bar">` (max 5 tabs on mobile)
- [ ] Add `if(name==='feature') initFeature();` in `switchTab()` in `core.js`
- [ ] All async functions must call `logError(context, e)` in catch blocks
- [ ] Use `callOpenAI()` for ≤1k token responses, `callOpenAILarge(prompt, key, tokens)` for larger
- [ ] Mirror all changes into `docs/index.html`

## Common Patterns

### Rendering a tab
```js
function initFeature() {
  const d = loadData();
  if (!d.dosha) { /* show quiz prompt */ return; }
  renderFeatureHome(d);
}
```

### API call pattern
```js
async function myAICall() {
  const d = loadData();
  if (!d.settings?.openaiApiKey) { showToast('Add API key in Settings'); return; }
  try {
    const resp = await callOpenAI(prompt, d.settings.openaiApiKey);
    const result = JSON.parse(resp.replace(/```json|```/g, '').trim());
    renderResult(result);
  } catch(e) {
    logError('myAICall', e);
    showToast('Error: ' + e.message);
  }
}
```

### Toast notification
```js
showToast('Message to show at bottom of screen');
```

### Safe element access
```js
el('element-id')          // returns null if missing — never throws
setText('id', 'text')     // safe textContent setter
setHTML('id', '<b>html</b>') // safe innerHTML setter
```

## Key State Variables (global)

| Variable | Module | Purpose |
|---|---|---|
| `dinaCache` | dinacharya.js | Today's routine (keyed by date string) |
| `dinaFilterState` | dinacharya.js | Day offset, wake/sleep times, active symptoms |
| `herbState` | herbs.js | Mode, selected concerns, chat history |
| `symptomState` | symptoms.js | Selected areas, duration, severity, description |
| `quizState` | quiz.js | Phase, question index, scores, ailments |
| `window._activeAilments` | meal-timing.js | Active ailment overrides for current food check |
| `window._mealTimingMode` | meal-timing.js | 'now' or 'plan' |
| `window._lastCheckedFood` | food.js | Food name for remedy lookup |

## CSS Variables (colours)

```css
--burgundy: #6B1E3A       /* Primary brand colour */
--lotus: #D4758A          /* Secondary / accent */
--gold: #C9A84C           /* Highlights, badges */
--cream: #FDF6EE          /* Background */
--cream-dark: #F2E8DC     /* Card backgrounds, borders */
--charcoal: #2C1810       /* Dark text */
--text-muted: #8B6F5E     /* Secondary text */
--text-light: #B89A8A     /* Placeholder text */
```

## Known Intentional Decisions

- **Plain text passwords** — intentional for local personal use. Not for multi-user hosted deployment.
- **API key in localStorage** — intentional. For hosted/shared use, proxy through a backend.
- **No service worker** — PWA support is a future enhancement.
- **Single HTML file** — intentional for maximum portability. The monolithic approach is a feature, not a bug.

## Deployment

```bash
# Any static host — just upload docs/index.html
# No build step required

# Quick local test
python3 -m http.server 8080 --directory docs
```

## GitHub Pages Deployment

The `docs/` folder is the deployment root.

```bash
# Option 1 — Manual (recommended)
# Push repo to GitHub → Settings → Pages → Source: Deploy from branch → Branch: main → Folder: /docs

# Option 2 — gh-pages CLI
npm install
npm run deploy   # uses gh-pages package to push docs/ to gh-pages branch
```

Files in `docs/` for GitHub Pages:
- `index.html`  — the app
- `.nojekyll`   — prevents Jekyll from processing (required)
- `404.html`    — redirects all unknown paths back to / (SPA support)

## localStorage Keys Reference (all 6)
| Key | Purpose |
|---|---|
| `ayurai_my_info` | User profile, dosha, ailments, food history, settings |
| `ayurai_dina_prefs` | Wake/sleep times, day offset, diet preferences |
| `ayurai_dina_cache` | Generated Dinacharya result (expires when date passes) |
| `ayurai_food_cache` | Last food check result + remedy (cleared on New Check) |
| `ayurai_error_log` | Last 5 app error entries |
| `ayurai_api_err` | Persistent flag for Settings warning dot |
