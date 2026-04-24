# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Also read:** [`MEMORY.md`](./MEMORY.md) — discovered bugs, non-obvious patterns, and key decisions from past sessions.

## What This Project Is

AyurAI is a single-file Ayurvedic wellness web app. It runs entirely client-side — no backend, no build step, no npm install. The deployable artifact is `docs/index.html`.

## Commands

```bash
# Syntax check (run after every JS edit)
node -e "const fs=require('fs'),h=fs.readFileSync('docs/index.html','utf8'),m=h.match(/<script>([\S\s]*?)<\/script>/);fs.writeFileSync('/tmp/ayurai_test.js',m[1]);" && node --check /tmp/ayurai_test.js && echo "✅ Syntax OK"

# Full validator (run before committing — must show 0 failures)
node scripts/validate.js

# Serve locally
python3 -m http.server 8080 --directory docs

# Bump version + SW cache key across all files
node scripts/stamp-version.js

# Run validator via npm alias
npm run validate

# Assemble src/ → public/index.html (dev/testing use only, NOT the deployment artifact)
node scripts/build.js
```

## Project Layout

```
docs/index.html        ← THE APP. Deploy this. Edit this directly for all changes.
docs/sw.js             ← Service worker (PWA offline support)
docs/manifest.json     ← PWA manifest
docs/DATA_MODEL.md     ← localStorage schema reference
docs/superpowers/specs/← Feature design specs (markdown)
src/js/                ← JS split by feature for readability (mirror of docs/index.html)
src/css/main.css       ← All CSS (~2300 lines)
src/html/app.html      ← HTML markup only (~4100 lines)
scripts/build.js       ← Assembles src/ → public/index.html (NOT docs/)
scripts/validate.js    ← Validates docs/index.html (~262 required function checks)
scripts/stamp-version.js ← Bumps version + SW cache key across all files
```

## Critical Editing Rules

1. **`docs/index.html` is the source of truth.** `scripts/build.js` outputs to `public/index.html`, not `docs/`. After editing any `src/` file, mirror the same change to `docs/index.html` manually.

2. **Before editing any function in `src/js/`, always grep first.** The `src/js/` split was done at byte boundaries, not function boundaries — many functions live in counterintuitive files:

   | Function | Actual File | Expected File |
   |----------|-------------|---------------|
   | `renderHerbChat()`, `renderChatBubbles()`, `scrollChatToBottom()` | `meal-timing.js` | herbs.js |
   | `openHerbChatOverlay()`, `closeHerbChatOverlay()` | `meal-timing.js` | herbs.js |
   | `sendHerbChat()` — signature + first 8 lines | `meal-timing.js` | herbs.js |
   | `sendHerbChat()` — body (rest of function) | `symptoms.js` | herbs.js |
   | `updateChatDisplay()`, `resetHerbAdvisor()` | `symptoms.js` | herbs.js |

   ```bash
   grep -rn "function functionName" src/js/
   ```

3. **Run the syntax checker after every JS edit**, then `node scripts/validate.js` before committing.

4. **All icons use Material Icons** — `<span class="mi">icon_name</span>` (filled) or `<span class="mio">icon_name</span>` (outlined). Never use emoji for UI icons, never apply `text-transform:uppercase` or `letter-spacing` on a parent containing these spans.

## Pre-Push Hook Behaviour

The hook at `scripts/hooks/pre-push` (auto-installed via `npm postinstall`) runs on every `git push`:
1. Runs `stamp-version.js` to bump the minor version and SW cache key
2. Amends the last commit with the version bump
3. Does its own `git push --force-with-lease --no-verify`
4. Exits `1` to cancel the original push

The `error: failed to push some refs` message printed after every push is **cosmetic and expected** — the hook's own push already succeeded.

## Git Conventions

- Commit messages must end with the app version: `feat: description v1.XX`
- **PR titles must also end with the app version** (same format): `feat: description v1.XX`
  — read the current version with: `grep -o "APP_VERSION = '[^']*'" src/js/core.js | grep -o "'[^']*'" | tr -d "'"`
  — the pre-push hook bumps the version on push, so use the post-push version in the PR title
- Always branch from latest main: `git checkout -b claude/feature-name origin/main`
- Never develop directly on `main`
- **All PRs from feature branches must target `origin/uat`** — never open a PR directly to `main`

### Pre-Push Checklist

Before pushing code to the feature branch, update the following files if the change warrants it:

- **`CLAUDE.md`** — reflect any new tabs, overlays, functions, state variables, constants, or architectural decisions
- **`README.md`** — update the Features table, Module Reference, and Key Design Decisions to match
- **`scripts/validate.js`** — add new top-level functions and HTML IDs to `REQUIRED_FUNCTIONS` / the ID check list
- Any other shared reference files (e.g. `docs/DATA_MODEL.md` for localStorage schema changes, `.claude/rules/` for new coding patterns)

## Architecture

```
localStorage (ayurai_my_info)
    ↑↓
core.js → loadData() / saveData() / getData() / setData()
    ↓
Feature modules (quiz, food, herbs, symptoms, dinacharya, ask-anything)
    ↓
callOpenAI() / callOpenAILarge() / callOpenAIChat() / callOpenAIChatStream()
    ↓
OpenAI API (gpt-4o-mini)
```

**Ask Anything** is a full-screen overlay (not a tab) opened via `openAskAnything()` from the Home tab.

**Food Check** and **Herb Advisor** are full-screen overlays opened via `openFoodOverlay()` / `openHerbsOverlay()` from the Home quick-action grid.

## Screens

| Screen ID | When shown |
|---|---|
| `#screen-onboarding` | First-time visitors (no `d.user` in localStorage). 5 slides + CTA. |
| `#screen-login` | Returning users who are not logged in. |
| `#screen-signup` | New users after completing/skipping onboarding. |
| `#screen-app` | Authenticated users — 5-tab main app + overlays. |

JS functions: `isFirstTimeUser()`, `goToOnboardingSlide(n)`, `skipOnboarding()`, `nextOnboardingSlide()`, `replayOnboarding()`, `closeOnboarding()`, `initOnboardingSwipe()`, `initOnboardingParticles()`. CSS classes use `ob-` prefix.

## Nav Tabs (5 in nav bar)

| Tab ID | Nav ID | Feature |
|---|---|---|
| `tab-home` | `tabn-home` | Home dashboard, dosha insights, quick actions |
| `tab-dina` | `tabn-dina` | Daily routine (Dinacharya) |
| `tab-face` | `tabn-face` | Face Care (in progress) — gender-aware icon |
| `tab-hair` | `tabn-hair` | Hair Care (in progress) — gender-aware icon |
| `tab-settings` | `tabn-settings` | Profile, API key, export/import, error logs |

## Hidden Tabs (no nav item — accessed via quick actions or settings)

| Tab ID | How Accessed |
|---|---|
| `tab-symptom` | Home quick-action card → `switchTab('symptom')` |
| `tab-quiz` | Settings → Retake Quiz; or `switchTab('quiz')` |
| `tab-history` | Home → "View All →" link → `switchTab('history')` |

## Full-Screen Overlays

| Overlay ID | Open Function | Close Function | Accessed From |
|---|---|---|---|
| `food-overlay` | `openFoodOverlay()` | `closeFoodOverlay()` | Home quick-action grid |
| `herbs-overlay` | `openHerbsOverlay()` | `closeHerbsOverlay()` | Home quick-action grid |
| `herb-chat-overlay` | `openHerbChatOverlay()` | `closeHerbChatOverlay()` | Herb Advisor overlay |
| `ask-overlay` | `openAskAnything()` | `closeAskAnything()` | Home quick-action grid |

`switchTab(name)` handles all tab navigation. Add `if(name==='feature') initFeature();` there for new tabs.

## JS Module Order (matters for build)

```
core.js → quiz.js → meal-timing.js → food.js → herbs.js → symptoms.js → dinacharya.js
```

`ask-anything.js` is appended directly to `docs/index.html` and `src/html/app.html` — it is not in `scripts/build.js`.

## Key Patterns

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

Use `callOpenAI()` for ≤1k token responses, `callOpenAILarge(prompt, key, tokens)` for larger, `callOpenAIChat(messages, key, tokens)` for multi-turn, `callOpenAIChatStream(messages, key, tokens, onChunk)` for streaming.

### Full-screen overlay pattern
```js
// Open
overlay.style.display = 'flex';
requestAnimationFrame(() => overlay.classList.add('open'));
// Close
overlay.classList.remove('open');
overlay.addEventListener('transitionend', () => { overlay.style.display = 'none'; }, { once: true });
```

**Android keyboard + fixed overlay:** Use `top:0; left:0; right:0; bottom:0` — **not** `height:100dvh`. Add `overflow:hidden` to overlay, `min-height:0` to the scrollable flex child (`.ask-chat`). All overlays (`#ask-overlay`, `#food-overlay`, `#herbs-overlay`, `#herb-chat-overlay`) use `.ask-overlay` and inherit this fix.

**`#herb-chat-overlay` reuses element IDs** from the old inline herb chat: `herb-chat-history`, `herb-chat-input`, `herb-send-btn`. This lets `sendHerbChat()`, `updateChatDisplay()`, and `scrollChatToBottom()` work unmodified.

### scrollTop after innerHTML
Always use `requestAnimationFrame` — synchronous `scrollTop = 0` fires before the browser paints:
```js
requestAnimationFrame(() => { el('app-content').scrollTop = 0; });
```

### Shared dosha rules
`buildDoshaRules(dosha)` in `core.js` returns per-dosha dietary rules used by both Food Check and Ask Anything. Edit only this function to change Ayurvedic rules globally. Key nuance: ripe pineapple/mango are classified as sweet fruits (acceptable for Pitta in moderation), not sour/acidic.

### Time context in AI prompts
Always include current time — morning vs. evening recommendations differ. `loadDoshaInsights()` intentionally omits time because its result is cached.

### Safe element access / notifications
```js
showToast('Message');               // bottom-of-screen notification
el('element-id')                    // returns null if missing — never throws
setText('id', 'text')              // safe textContent setter
getData('dosha.primary')           // dot-path getter with fallback
setData('settings.openaiApiKey', key) // dot-path setter, auto-saves
```

## Adding a New Feature — Checklist

- [ ] Add CSS section in `src/css/main.css` with `/* ── FEATURE NAME ── */` comment
- [ ] Add JS module as `src/js/feature.js`
- [ ] Add HTML tab panel in `src/html/app.html`
- [ ] Add tab nav item in `<nav id="tab-bar">` (max 5 tabs on mobile)
- [ ] Add `if(name==='feature') initFeature();` in `switchTab()` in `core.js`
- [ ] Add new top-level functions to `REQUIRED_FUNCTIONS` array in `scripts/validate.js` (~line 37, 80+ functions + 60+ HTML ID checks)
- [ ] Mirror all changes into `docs/index.html`
- [ ] Run `node scripts/validate.js` — all checks must pass

## Key State Variables (global)

| Variable | Module | Purpose |
|---|---|---|
| `dinaCache` | dinacharya.js | Today's routine — `{ data, targetDateStr, wakeDisplay, sleepDisplay, generatedAt }` |
| `dinaFilterState` | dinacharya.js | `{ dayOffset: 1, selectedSymptoms: [], selectedDiets: [] }` — wake/sleep stored separately in `ayurai_dina_prefs` |
| `herbState` | herbs.js | Mode, selected concerns, chat history |
| `symptomState` | symptoms.js | Selected areas, duration, severity, description |
| `quizState` | quiz.js | Phase, question index, scores, ailments |
| `askState` | ask-anything.js | `{chatHistory: [], loading: false}` — cleared on overlay close |
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
| `DINA_CACHE_KEY` | dinacharya.js | `'ayurai_dina_cache'` — cached generated routine |
| `DINA_DEFAULT_WAKE` | dinacharya.js | `'06:30'` |
| `DINA_DEFAULT_SLEEP` | dinacharya.js | `'22:30'` |
| `APP_VERSION` | core.js | Current version string (auto-bumped by stamp-version.js) — currently `v1.87` |

> **Note:** Wake/sleep times and day offset are persisted separately under `ayurai_dina_prefs` (not inside `ayurai_my_info`).

## CSS Variables

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

## PWA

- `docs/sw.js` — cache-first service worker. App shell is cached; OpenAI API calls always go to network.
- Cache key format: `ayurai-YYYYMMDD-HHMMSS` (updated by `stamp-version.js`)
- `initPWA()` — registers service worker, handles `beforeinstallprompt`, shows iOS install hint
- `triggerPWAInstall()` — fires the deferred install prompt on user tap
- `shareApp()` — shares the app URL via `navigator.share()` or copies to clipboard (Settings tab)

## Version Management

`scripts/stamp-version.js` bumps the minor version (e.g. `v1.76` → `v1.77`) and updates these 5 files: `docs/index.html`, `src/html/app.html`, `src/js/core.js`, `src/js/herbs.js`, and `docs/sw.js` (cache key). Run manually before a release; the pre-push hook runs it automatically on every push.

## Known Intentional Decisions

- **Plain text passwords** — intentional for local personal use.
- **API key in localStorage** — intentional. For shared use, proxy through a backend.
- **Single HTML file** — maximum portability; the monolithic approach is a feature.
- **Ask Anything is overlay, not a tab** — keeps tab bar uncluttered; accessed from Home quick-actions.
- **Food Check and Herbs are overlays** — moved out of the nav bar to keep it to 5 tabs; accessed from the Home quick-action grid.
- **Symptom, Quiz, History have no nav items** — accessed via Home quick-action (Symptom), Settings (Quiz retake), and Home "View All" link (History).
- **Face/Hair tabs are gender-aware** — icons update at login based on gender (`face`/`face_6` for face, `face_2`/`face_retouching_natural` for hair).
- **Ask AI suggestions JSON** — when the AI declines an off-topic question, it appends `{"suggestions":["...", "..."]}`. `sendAskMessage` strips this before displaying and renders suggestions as clickable cards.

## Deployment

```bash
# GitHub Pages: push to main → Settings → Pages → Source: main → /docs
# Or: npm run deploy   (uses gh-pages package to push docs/ to gh-pages branch)
```
