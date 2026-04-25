# MEMORY.md — AyurAI Agent Learnings

This file records discovered bugs, non-obvious patterns, and key decisions made during development sessions. Claude reads this at the start of each session to maintain continuity.

---

## Source File Split — Non-Obvious Mappings

The `src/js/` files were split from the monolith at byte boundaries, not function boundaries. Some functions live in counterintuitive files:

| Function | Actual File | Expected File |
|----------|-------------|---------------|
| `renderSymptomResult()` | `src/js/dinacharya.js` | symptoms.js |
| `resetSymptomChecker()` | `src/js/dinacharya.js` | symptoms.js |
| `renderHerbChat()` | `src/js/meal-timing.js` | herbs.js |
| `renderChatBubbles()` | `src/js/meal-timing.js` | herbs.js |
| `scrollChatToBottom()` | `src/js/meal-timing.js` | herbs.js |
| `openHerbChatOverlay()` | `src/js/meal-timing.js` | herbs.js |
| `closeHerbChatOverlay()` | `src/js/meal-timing.js` | herbs.js |
| `sendHerbChat()` — signature + first 8 lines | `src/js/meal-timing.js` | herbs.js |
| `sendHerbChat()` — body (rest of function) | `src/js/symptoms.js` | herbs.js |
| `updateChatDisplay()` | `src/js/symptoms.js` | herbs.js |
| `resetHerbAdvisor()` | `src/js/symptoms.js` | herbs.js |

**Rule:** Always `grep -rn "function X"` across all `src/js/` files before editing — never assume a function is in the logically named file.

---

## docs/index.html is the Source of Truth

Every change to `src/js/`, `src/css/`, or `src/html/` **must be mirrored** to `docs/index.html` manually. The build script (`scripts/build.js`) outputs to `public/index.html`, not `docs/`. The deployment artifact is always `docs/index.html`.

Workflow:
1. Edit `src/` file
2. Mirror the same change to the equivalent location in `docs/index.html`
3. Run `node scripts/validate.js` — must show 0 failures before committing

---

## Pre-Push Hook Behaviour

The hook in `scripts/hooks/pre-push` (auto-installed via `npm postinstall`):
1. Runs `scripts/stamp-version.js` to bump minor version and SW cache key
2. Amends the last commit with the version bump
3. Does its own `git push --force-with-lease --no-verify`
4. Exits `1` to cancel the original push (which would fail anyway after the amend)

The `error: failed to push some refs` message printed after every push is **cosmetic and expected** — the push already succeeded via the hook's own push call.

---

## Validator — Adding New Required Functions

`scripts/validate.js` maintains a `REQUIRED_FUNCTIONS` array (~line 37). When adding a new top-level function that must always exist in `docs/index.html`, add it there. Currently 262 checks. Run with:

```bash
node scripts/validate.js
```

---

## Android Keyboard + Fixed Overlay Bug

**Problem:** On Android, when a keyboard opens inside a `position: fixed` full-screen overlay, the header scrolls off-screen.

**Fix (applied to `.ask-overlay`):**
- Use `top:0; left:0; right:0; bottom:0` — **not** `height:100dvh` or `height:100%`
- Add `overflow:hidden` to the overlay
- Add `min-height:0` to the scrollable flex child (`.ask-chat`) so it can shrink properly

Both `#ask-overlay` and `#herb-chat-overlay` use the `.ask-overlay` class and inherit this fix.

---

## scrollTop Fix — Must Use requestAnimationFrame

Setting `scrollTop = 0` synchronously after `innerHTML =` fires before the browser paints, so it has no effect. Always wrap:

```js
requestAnimationFrame(() => { el('container-id').scrollTop = 0; });
```

**Overlay scroll target:** For features inside overlays, scroll the overlay's own scrollable container — **not** `#app-content`. Each overlay's inner scrollable div has its own ID:
- Food Check → `#food-overlay-content`
- Symptom Check → `#symptom-overlay-content`

`#app-content` is only correct for content inside the main tab panels (Dinacharya, Settings, etc.).

---

## Shared Dosha Rules — buildDoshaRules()

`buildDoshaRules(dosha)` in `src/js/core.js` returns nuanced per-dosha dietary rules. Both Food Check and Ask Anything use this to ensure consistent AI advice. If Ayurvedic rules need updating, change only this one function.

Key nuance in Pitta rule: ripe pineapple and mango are categorised as sweet fruits (acceptable in moderation), NOT as sour/acidic foods — prevents flat "avoid" verdicts for contextually acceptable foods.

---

## Time Context in AI Prompts

All AI prompts should include current time so advice is temporally relevant (morning vs. evening recommendations differ). Confirmed working in:
- Food Check (`checkFood`) — uses `mealDate` (now or planned)
- Ask Anything (`buildAskSystemPrompt`) — uses `new Date()` for both `month` and `time`
- Herb Chat (`sendHerbChat`) — via `buildHerbContext()` which includes `time`
- Refine Boosters (`refineBoostersWithContext`) — resolves from `window._mealTimingMode`

**Not included (by design):** Dosha Insights (`loadDoshaInsights`) — result is cached; time of generation is irrelevant.

---

## Herb Chat Overlay — IDs Reused

`#herb-chat-overlay` uses the same element IDs as the old inline herb chat card:
- `id="herb-chat-history"` — the `.ask-chat` div inside the overlay
- `id="herb-chat-input"` — the `.ask-input` inside the overlay
- `id="herb-send-btn"` — the send button

This means `sendHerbChat()`, `updateChatDisplay()`, and `scrollChatToBottom()` all work without modification — they reference the same IDs, which now live inside the overlay instead of the tab.

---

## Commit Message Convention

All commits must end with the app version at time of commit:

```
feat: description of change v1.XX
```

The pre-push hook bumps the version further (e.g., v1.47 → v1.48), so the version in the commit message may differ from the final pushed version by 1. This is expected.

---

## Branch Naming Convention

Always branch from the base that matches the target:

```bash
# For UAT fixes / features targeting origin/uat:
git checkout -b claude/feature-name origin/uat

# For main-targeted work:
git checkout -b claude/feature-name origin/main
```

Never develop directly on `main` or `uat`. **All PRs target `origin/uat`** unless explicitly told otherwise.

---

## `class="tab-panel"` Must Not Appear Inside Overlays

`switchTab()` hides every element matching `.tab-panel` via:
```js
document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
```

If any div inside an overlay carries `class="tab-panel"`, it will be hidden whenever the user taps any nav tab — making the overlay show a blank screen on the next open.

**Rule:** Never add `class="tab-panel"` to any element inside `.ask-overlay`. Use a plain `<div>` or a custom class instead. The inner content divs in `#food-overlay` (`#tab-food`) and `#herbs-overlay` (`#tab-herbs`) deliberately do NOT have this class.

---

## Key Discoveries

- **Food Check scroll bug**: `renderFoodResult` was calling `el('app-content').scrollTop = 0` synchronously — fixed with `requestAnimationFrame`.
- **Contradictory AI advice (pineapple + Pitta)**: Root cause was missing `buildDoshaRules()` in Food Check prompt and missing time context in Ask Anything. Fixed in PRs #49 and #50.
- **Herb chat streaming**: `sendHerbChat` in `symptoms.js` creates a direct DOM `streamBubble`, streams into it, then removes it and re-renders via `updateChatDisplay()` — the bubble is never stored in `herbState`.
- **Ask AI suggestions JSON**: When AI declines an off-topic question, it appends `{"suggestions":["...", "..."]}` at the end of the response. `sendAskMessage` strips this JSON before displaying the text and renders the suggestions as clickable cards.
- **Food/Herb overlay blank screen**: Root cause was `class="tab-panel"` on `#tab-food` and `#tab-herbs` inside overlays — `switchTab()` was hiding them on every tab navigation. Fixed by removing that class. See the section above for the full rule.
- **Symptom Check converted to overlay**: `#tab-symptom` is now an empty shell; content lives in `#symptom-overlay`. `openSymptomOverlay()` / `closeSymptomOverlay()` are in `src/js/symptoms.js`. Scroll calls in `renderSymptomResult()` and `resetSymptomChecker()` (both in `src/js/dinacharya.js`) target `#symptom-overlay-content`.
