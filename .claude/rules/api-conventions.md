<!--
PURPOSE: Documents AyurAI's OpenAI API call conventions — which wrapper to use and when.
         All AI calls go through wrapper functions defined in core.js (inside docs/index.html),
         never directly via fetch() or the OpenAI SDK.
BENEFIT:  Claude selects the correct wrapper, handles response parsing consistently, and
          includes the API key check without needing to re-read the full CLAUDE.md each time.
EXAMPLE:  A new herb recommendation feature returning a short JSON object uses callOpenAI().
          The herb chat overlay streaming response uses callOpenAIChatStream() with an onChunk
          callback that updates the DOM incrementally.
-->

# AyurAI API Conventions

## Step 0 — Always Check API Key First
```js
const d = loadData();
if (!d.settings?.openaiApiKey) { showToast('Add API key in Settings'); return; }
```

## Wrapper Function Reference

| Function | Use When | Notes |
|---|---|---|
| `callOpenAI(prompt, key)` | Single prompt, JSON response ≤1k tokens | Most feature calls |
| `callOpenAILarge(prompt, key, tokens)` | Large responses (meal plans, full routines) | Pass explicit token count |
| `callOpenAIChat(messages, key, tokens)` | Multi-turn chat, no streaming needed | messages = array of {role, content} |
| `callOpenAIChatStream(messages, key, tokens, onChunk)` | Streaming (herb chat, ask anything) | onChunk(deltaText) called per chunk |

## Standard Single-Prompt Pattern
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

## Rules
- **Always strip markdown fences** before `JSON.parse()`: `.replace(/```json|```/g, '').trim()`
- **Always include current time** in prompts — morning vs evening recommendations differ
  - Exception: `loadDoshaInsights()` intentionally omits time because its result is cached
- **Always call `logError('fnName', e)`** in catch blocks — never swallow errors silently
- **Off-topic AI responses** append `{"suggestions":["..."]}` JSON — strip before displaying,
  then render suggestions as clickable cards (see `sendAskMessage` in ask-anything.js)

## Shared Dosha Rules
`buildDoshaRules(dosha)` in core.js — edit **only this function** to change Ayurvedic rules
globally. Used by both Food Check and Ask Anything.

Key nuance: ripe pineapple and mango = sweet fruits (acceptable for Pitta in moderation),
**not** sour/acidic — do not classify them as aggravating for Pitta.
