# Ask Anything — Design Spec
**Date:** 2026-04-14  
**Status:** Approved

---

## Context

The home screen currently has two quick-action cards: "Symptom Check" and "Herb Advisor". The Herb Advisor card navigates to the Herb Advisor tab. The user wants to replace the Herb Advisor card with an "Ask Anything" personalised Ayurvedic chat assistant that knows the user's full profile (dosha, age, city, ailments). This is a new, self-contained feature — the Herb Advisor tab itself is unchanged.

---

## Feature Overview

- **Entry point:** Tapping the "Ask Anything" card on the home screen
- **UX:** Full-screen overlay that slides up over the home screen (not a new tab)
- **Scope:** Ayurveda-only assistant — diet, dosha, herbs, lifestyle, seasonal routines
- **History:** Per-session only (in-memory, clears on reload)
- **Starter prompts:** 4 hardcoded tappable cards personalised to the user's dosha/ailments (no API call)
- **Off-topic handling:** Graceful decline message + 2 inline tappable suggestion cards in the chat

---

## Data Changes

### New field: `d.user.age`
- Type: `number` (integer, years)
- Added to `ayurai_my_info.user` in localStorage
- Set via a new Age input in the Settings tab (existing profile section)
- Used in system prompt when present; omitted gracefully if not set

---

## Architecture

### New elements (added to `docs/index.html` / `src/html/app.html`)
- `#ask-overlay` — full-screen overlay div, hidden by default (`display:none`), slides up on open via CSS transition
- CSS class `.ask-overlay` with `position:fixed; top:0; left:0; width:100%; height:100%; z-index:200; background:var(--cream)`

### New JS state
```js
let askState = { chatHistory: [], loading: false };
```
In-memory only — not persisted to localStorage.

### New JS functions
| Function | Purpose |
|---|---|
| `openAskAnything()` | Shows overlay, resets state, renders starter UI |
| `closeAskAnything()` | Hides overlay, clears `askState` |
| `renderAskStarters(d)` | Renders welcome message + 4 starter prompt cards |
| `sendAskMessage(text)` | Appends user message, calls AI, appends response |
| `askAddMessage(role, text, suggestions)` | Renders a chat bubble; if `suggestions` provided, appends 2 tappable suggestion cards below the bubble |
| `buildAskSystemPrompt(d)` | Constructs system context string from user profile |
| `getAskStarterPrompts(d)` | Returns 4 hardcoded prompts based on dosha + ailments |

### Changes to existing code
| File | Change |
|---|---|
| `src/html/app.html` / `docs/index.html` | Home card: icon `spa` → `chat`, title → "Ask Anything", desc → "Your personal Ayurvedic advisor", onclick → `openAskAnything()` |
| Settings tab | Add Age input field (number, min 1, max 120) that saves to `d.user.age` |
| `src/js/core.js` | No changes needed — overlay doesn't use `switchTab` |

---

## UI Layout

```
┌─────────────────────────────┐
│  ✕          Ask Anything    │  ← header (burgundy bg, white text)
│     🌿 Pitta · Mumbai       │  ← dosha + city chip (lotus colour)
├─────────────────────────────┤
│                             │
│  Hi Siddharth! Namaste 🙏   │  ← welcome bubble (AI side)
│  I'm your Ayurvedic herb    │
│  advisor. You are a Pitta   │
│  type. Ask me anything.     │
│                             │
│  ┌─────────────────────┐    │
│  │ What foods should I │    │  ← 4 tappable starter
│  │ avoid as a Pitta?   │    │    prompt cards (grid 2x2)
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Daily routine for   │    │
│  │ my dosha?           │    │
│  └─────────────────────┘    │
│  (+ 2 more)                 │
│                             │
│  [chat messages scroll here]│
│                             │
├─────────────────────────────┤
│  [ Type your question... ]→ │  ← sticky bottom input bar
└─────────────────────────────┘
```

- User messages: right-aligned bubble (burgundy bg, white text)
- AI messages: left-aligned bubble (cream-dark bg, charcoal text)
- Loading state: animated ellipsis bubble on the AI side
- Starter cards disappear once first message is sent

---

## Starter Prompts (hardcoded per dosha)

### Vata
1. "What foods are good for me to eat?"
2. "How can I reduce stress and anxiety naturally?"
3. "What should my morning routine look like?"
4. "Which herbs are good for my body type?" *(or ailment-specific if ailments set)*

### Pitta
1. "What foods should I avoid?"
2. "How can I cool down my body in summer?"
3. "What helps with digestion for my type?"
4. "What should my daily routine look like?"

### Kapha
1. "How can I feel more energetic during the day?"
2. "What foods are good for me to eat?"
3. "What should my morning routine look like?"
4. "Which herbs help with my body type?"

If ailments are set, slot 4 is replaced with an ailment-specific prompt, e.g. "What can help with my {ailments[0]}?"

---

## System Prompt

```
You are an Ayurvedic wellness assistant for {name}{, age {age} if set}, based in {city if set}.

Their dosha profile: {primary} dominant (Vata {v}%, Pitta {p}%, Kapha {k}%).
Current ailments: {ailments joined or "none listed"}.
Foods they should avoid: {doshaInsights.foods_to_avoid joined or "not yet generated"}.

Answer ONLY Ayurvedic wellness questions — diet, dosha, herbs, lifestyle, and seasonal routines.
If asked anything outside this scope, respond with a brief, warm decline and suggest 2 relevant 
Ayurvedic questions the user might actually want to ask. Format the suggestions as a JSON block 
at the end of your response in this exact format:
{"suggestions":["suggestion 1","suggestion 2"]}

Keep answers warm, practical, and concise. Reference their specific dosha and profile where relevant.
```

The `messages` array sent to OpenAI:
- Role `system`: the system prompt above
- Role `user`/`assistant`: full `askState.chatHistory` array

Uses `callOpenAI()` for conversations ≤ 4 exchanges; switches to `callOpenAILarge()` beyond that.

---

## Off-Topic Handling

When the AI's response contains a `{"suggestions":[...]}` JSON block at the end:
1. Strip the JSON from the displayed text
2. Render the 2 suggestions as tappable cards below the AI bubble
3. Tapping a suggestion card sends it as the next user message

If JSON parsing fails (malformed response), display the full AI text as-is with no suggestion cards — no error thrown.

---

## Error Handling

- No API key: show toast "Add your API key in Settings" and do not open overlay
- No dosha profile: show toast "Complete your Dosha Quiz first" and do not open overlay
- API error: show error bubble in chat with retry button
- All errors logged via `logError('askAnything', e)`

---

## Files Modified

| File | Nature of change |
|---|---|
| `docs/index.html` | Home card update, overlay HTML, CSS, JS (all in one file) |
| `src/html/app.html` | Mirror of HTML/CSS changes |
| `src/js/core.js` | No changes |
| `src/css/main.css` | Mirror of CSS changes |

The JS for the feature can live in a new `src/js/ask-anything.js` for readability, mirrored into `docs/index.html`.
