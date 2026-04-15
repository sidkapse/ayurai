# CLAUDE.md — AyurAI Project Guide for Claude Code

This file gives Claude Code the context it needs to work effectively on this project.

## What This Project Is

AyurAI is a single-file Ayurvedic wellness web app. It runs entirely client-side — no backend, no build step, no npm install. The deployable artifact is `docs/index.html`.

## Project Layout

```
docs/index.html        ← THE APP. Deploy this. Edit this directly for changes.
docs/sw.js             ← Service worker (PWA offline support)
docs/manifest.json     ← PWA manifest
docs/favicon.svg       ← App icon
docs/404.html          ← SPA redirect for GitHub Pages
docs/DATA_MODEL.md     ← localStorage schema reference
docs/superpowers/specs/← Feature design specs (markdown)
src/js/                ← JS split by feature for readability (mirror of docs/index.html)
  core.js              ← Data layer, auth, tabs, onboarding, PWA, toast
  quiz.js              ← Dosha quiz (2-stage, 10Q each)
  meal-timing.js       ← Meal timing widget (now / plan)
  food.js              ← Food check, remedy, food history, dosha insights
  herbs.js             ← Herb advisor + herb chat
  symptoms.js          ← Symptom checker
  dinacharya.js        ← Daily routine (Dinacharya) generation
  ask-anything.js      ← Ask Anything full-screen chat overlay
src/css/main.css       ← All CSS (~2300 lines)
src/html/app.html      ← HTML markup only (~4100 lines)
scripts/build.js       ← Assembles src/ → public/index.html (dev/testing use)
scripts/validate.js    ← Validates docs/index.html (JS syntax, IDs, functions)
scripts/stamp-version.js ← Bumps version + SW cache key across all files
specs/                 ← Symlink or copy of docs/superpowers/specs/
package.json           ← devDependencies: gh-pages only
```

## Critical Rules When Editing

1. **`docs/index.html` is the source of truth for deployment.** It is a self-contained monolithic file. When making changes, edit it directly.
2. **`src/` files mirror `docs/index.html`** — they are the same code split for readability. Keep them in sync whenever you edit `docs/index.html`.
3. **Never add npm packages or build tools** unless explicitly asked. The app has zero runtime dependencies (Google Fonts CDN only).
4. **Always run the syntax checker after editing JS:**
   ```bash
   node -e "const fs=require('fs'),h=fs.readFileSync('docs/index.html','utf8'),m=h.match(/<script>([\S\s]*?)<\/script>/);fs.writeFileSync('/tmp/ayurai_test.js',m[1]);" && node --check /tmp/ayurai_test.js && echo "✅ Syntax OK"
   ```
5. **Run the full validator before committing:**
   ```bash
   node scripts/validate.js
   ```
   This checks JS syntax, required function presence, required HTML IDs, `el()` reference integrity, duplicate function declarations, API error handling coverage, and global state declarations.
6. **All icons use Material Icons** — `<span class="mi">icon_name</span>` (filled) or `<span class="mio">icon_name</span>` (outlined). Never use emoji for UI icons.
7. **Never use `text-transform:uppercase` or `letter-spacing` on a parent that contains Material Icon spans** — it breaks glyph rendering.

## Screens

| Screen ID | When shown |
|---|---|
| `#screen-onboarding` | First-time visitors (no `d.user` in localStorage). 5 slides + CTA. |
| `#screen-login` | Returning users who are not logged in. |
| `#screen-signup` | New users after completing/skipping onboarding. |
| `#screen-app` | Authenticated users — 8-tab main app. |

Onboarding slide IDs: `onboarding-slide-1` through `onboarding-slide-5` (5 slides total).
JS functions: `isFirstTimeUser()`, `goToOnboardingSlide(n)`, `skipOnboarding()`, `nextOnboardingSlide()`, `replayOnboarding()`, `initOnboardingSwipe()`, `initOnboardingParticles()`.
CSS classes use `ob-` prefix (e.g. `.ob-hero`, `.ob-feat-item`, `.ob-s1`–`.ob-s5`).

## Tabs (8 total)

| Tab ID | Nav ID | Feature |
|---|---|---|
| `tab-home` | `tabn-home` | Home dashboard, dosha insights, quick actions |
| `tab-food` | `tabn-food` | Food check + meal timing |
| `tab-herbs` | `tabn-herbs` | Herb advisor + herb chat |
| `tab-dina` | `tabn-dina` | Daily routine (Dinacharya) |
| `tab-settings` | `tabn-settings` | Profile, API key, export/import, error logs |
| `tab-quiz` | `tabn-quiz` | Dosha quiz (2-stage) |
| `tab-symptom` | `tabn-symptom` | Symptom checker |
| `tab-history` | `tabn-history` | Food check history |

`switchTab(name)` handles all tab navigation. Add `if(name==='feature') initFeature();` there for new tabs.

## Architecture at a Glance

```
localStorage (ayurai_my_info)
    ↑↓
core.js → loadData() / saveData() / getData() / setData()
    ↓
Feature modules (quiz, food, herbs, symptoms, dinacharya, ask-anything)
    ↓
callOpenAI() / callOpenAILarge() / callOpenAIChat()
    ↓
OpenAI API (gpt-4o-mini)
```

The **Ask Anything** feature is a full-screen overlay (not a tab). It opens via `openAskAnything()` called from a quick-action card on the Home tab.

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `scripts/validate.js` | `node scripts/validate.js` | Full validation of `docs/index.html` |
| `scripts/build.js` | `node scripts/build.js` | Assembles `src/` → `public/index.html` (alt workflow) |
| `scripts/stamp-version.js` | `node scripts/stamp-version.js` | Bumps minor version + SW cache key |

**Note:** `scripts/build.js` outputs to `public/index.html`. The main deployment workflow edits `docs/index.html` directly. The build script is useful for testing a clean assembly from `src/`.

JS module order in `build.js` (order matters for global state):
```
core.js → quiz.js → meal-timing.js → food.js → herbs.js → symptoms.js → dinacharya.js
```
`ask-anything.js` is appended directly to `docs/index.html` and `src/html/app.html` — it is not yet included in `scripts/build.js`.

## Adding a New Feature — Checklist

- [ ] Add CSS section in `src/css/main.css` with `/* ── FEATURE NAME ── */` comment
- [ ] Add JS module as `src/js/feature.js`
- [ ] Add HTML tab panel in `src/html/app.html`
- [ ] Add tab nav item in the `<nav id="tab-bar">` (max 5 tabs on mobile)
- [ ] Add `if(name==='feature') initFeature();` in `switchTab()` in `core.js`
- [ ] All async functions must call `logError(context, e)` in catch blocks
- [ ] Use `callOpenAI()` for ≤1k token responses, `callOpenAILarge(prompt, key, tokens)` for larger
- [ ] Mirror all changes into `docs/index.html`
- [ ] Run `node scripts/validate.js` — all checks must pass

## Common Patterns

### Rendering a tab
```js
function initFeature() {
  const d = loadData();
  if (!d.dosha) { /* show quiz prompt */ return; }
  renderFeatureHome(d);
}
```

### API call pattern (single prompt)
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

### Multi-turn chat pattern (Ask Anything style)
```js
// Uses callOpenAIChat(messages, apiKey, maxTokens) — takes messages array
const messages = [
  { role: 'system', content: systemPrompt },
  ...chatHistory   // array of {role, content} objects
];
const raw = await callOpenAIChat(messages, apiKey, 1000);
```

### Full-screen overlay pattern (Ask Anything style)
```js
// Open: set display:flex, then add .open class for CSS transition
overlay.style.display = 'flex';
requestAnimationFrame(() => overlay.classList.add('open'));
// Close: remove .open, wait for transitionend, then display:none
overlay.classList.remove('open');
overlay.addEventListener('transitionend', () => { overlay.style.display = 'none'; }, { once: true });
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
getData('dosha.primary')  // dot-path getter with fallback
setData('settings.openaiApiKey', key) // dot-path setter, auto-saves
```

## Key State Variables (global)

| Variable | Module | Purpose |
|---|---|---|
| `dinaCache` | dinacharya.js | Today's routine (keyed by date string), in-memory mirror of localStorage |
| `dinaFilterState` | dinacharya.js | Day offset, wake/sleep times, diet prefs, active symptoms |
| `herbState` | herbs.js | Mode, selected concerns, chat history |
| `symptomState` | symptoms.js | Selected areas, duration, severity, description |
| `quizState` | quiz.js | Phase, question index, scores, ailments |
| `askState` | ask-anything.js | `{chatHistory: [], loading: false}` — per-session, cleared on overlay close |
| `window._activeAilments` | meal-timing.js | Active ailment overrides for current food check |
| `window._mealTimingMode` | meal-timing.js | `'now'` or `'plan'` |
| `window._lastCheckedFood` | food.js | Food name for remedy lookup |
| `_remedyLoading` | food.js | Guard flag to prevent duplicate remedy fetches |
| `currentTab` | core.js | Currently active tab name |
| `_deferredInstallPrompt` | core.js | PWA install event reference |

## Key Constants

| Constant | Module | Purpose |
|---|---|---|
| `STORAGE_KEY` | core.js | `'ayurai_my_info'` |
| `ERROR_LOG_KEY` | core.js | `'ayurai_error_log'` |
| `API_ERR_STORAGE_KEY` | food.js | `'ayurai_api_err'` — persists API error state |
| `FOOD_CACHE_KEY` | food.js | `'ayurai_food_cache'` |
| `DINA_CACHE_KEY` | dinacharya.js | `'ayurai_dina_cache'` |
| `COMMON_AILMENTS` | quiz.js | Array of selectable ailment names |
| `DINA_DIET_PREFS` | dinacharya.js | Array of diet preference options |
| `APP_VERSION` | core.js | Current version string (auto-bumped by stamp-version.js) |

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

## PWA Support

The app is installable as a Progressive Web App:
- `docs/sw.js` — cache-first service worker. App shell (`./`, `index.html`, `favicon.svg`, `manifest.json`) is cached. OpenAI API calls always go to network.
- `docs/manifest.json` — PWA metadata, `start_url: /ayurai/`, `display: standalone`.
- `initPWA()` — registers service worker, handles `beforeinstallprompt`, shows iOS install hint.
- `triggerPWAInstall()` — fires the deferred install prompt on user tap.
- Cache key format: `ayurai-YYYYMMDD-HHMMSS` (updated by `stamp-version.js` on version bump).

## Version Management

`scripts/stamp-version.js` bumps the minor version (e.g. `v1.26` → `v1.27`) and updates:
- `docs/index.html` — version string in UI + `app_version` in exported metadata
- `src/html/app.html` — same
- `src/js/core.js` — `APP_VERSION` constant
- `src/js/herbs.js` — version string
- `docs/sw.js` — `CACHE` key with new timestamp

Run manually with `node scripts/stamp-version.js` before pushing a release.

## Known Intentional Decisions

- **Plain text passwords** — intentional for local personal use. Not for multi-user hosted deployment.
- **API key in localStorage** — intentional. For hosted/shared use, proxy through a backend.
- **Single HTML file** — intentional for maximum portability. The monolithic approach is a feature.
- **No backend** — all data is local. Export/import JSON for portability across devices.
- **Ask Anything is overlay, not a tab** — keeps the tab bar uncluttered; feature is accessed from Home quick-actions.

## Deployment

```bash
# Quick local test (using docs/ directly)
python3 -m http.server 8080 --directory docs

# Or via npm
npm run dev   # serves from public/ (after running npm run build)
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
- `sw.js`       — service worker
- `manifest.json` — PWA manifest
- `favicon.svg` — app icon
- `.nojekyll`   — prevents Jekyll from processing (required)
- `404.html`    — redirects all unknown paths back to / (SPA support)

## localStorage Keys Reference (all 6)

| Key | Purpose |
|---|---|
| `ayurai_my_info` | User profile, dosha, ailments, food history, dosha insights, settings |
| `ayurai_dina_prefs` | Wake/sleep times, day offset, diet preferences |
| `ayurai_dina_cache` | Generated Dinacharya result (expires when date passes) |
| `ayurai_food_cache` | Last food check result + remedy (cleared on New Check) |
| `ayurai_error_log` | Last 5 app error entries |
| `ayurai_api_err` | Persistent flag for Settings warning dot (type of last API error) |

## Design Specs

Feature design specs live in `docs/superpowers/specs/` (markdown files named by date):
- `2026-04-09-onboarding-slides-design.md` — onboarding 5-slide flow
- `2026-04-14-ask-anything-design.md` — Ask Anything overlay chat

When implementing a new feature, create a spec file here first.
