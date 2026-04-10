# Onboarding Slides — Design Spec
**Date:** 2026-04-09  
**Status:** Approved

---

## Context

New users who visit AyurAI for the first time land directly on the login screen with no introduction to the app's purpose, features, or value proposition. This creates a poor first impression and likely increases drop-off. We need an onboarding experience that introduces the app before asking the user to sign in or register.

---

## Solution: Swipeable Onboarding Cards

A 5-screen onboarding flow (4 feature slides + 1 CTA) shown to first-time visitors only. After completing or skipping the flow the user lands on the existing login/signup screens. Returning users (already have an account in localStorage) skip the onboarding entirely.

---

## Screens

### Screen: `#screen-onboarding`
Sits between app load and `#screen-login`. Shown only when no user account exists in localStorage.

**Layout per slide:**
- Full-height coloured hero (gradient, matches slide theme)
- `Skip` button — top-right, always visible, takes user to CTA slide (slide 5)
- Centred icon (Material Icons Outlined, 44px, white, in translucent circle)
- Title (Cormorant Garamond, 26px)
- Tagline (Jost, 12px, uppercase, letter-spaced)
- White card feature list (icon + bold label + description rows)
- Bottom footer: progress dots + full-width Next button (no counter text)

**Bottom footer — clean layout:**
- Dots row centred, `gap: 7px`
- Active dot: `width: 22px`, burgundy, pill shape
- Inactive dots: `width: 6px`, muted
- Next button: full-width, `border-radius: 14px`, burgundy, 14px font
- Generous padding: `16px 24px 28px`

### Slide 1 — Know Your Dosha
- Hero: `linear-gradient(160deg, #6B1E3A, #8B2E50)`
- Icon: `self_improvement` (outlined)
- Features: Quiz (20-question), AI insights

### Slide 2 — Eat Right for You
- Hero: `linear-gradient(160deg, #2d6a4f, #52b788)`
- Icon: `restaurant` (outlined)
- Features: Yes/No verdict, Best meal timing, Damage control

### Slide 3 — Herbs & Symptoms
- Hero: `linear-gradient(160deg, #5c4033, #8d6e63)`
- Icon: `eco` (outlined)
- Features: Herb Advisor (4 modes), Symptom Checker (Nidana)

### Slide 4 — Live Your Best Day
- Hero: `linear-gradient(160deg, #7b4f00, #C9A84C)`
- Icon: `wb_sunny` (outlined)
- Features: 8-block daily schedule, Plan ahead

### Slide 5 — CTA (Begin Your Journey)
- Hero: `linear-gradient(160deg, #6B1E3A, #D4758A)`
- Icon: `spa` (filled)
- No Skip button
- No dots / no Next button
- Two CTAs: "Create Account" (primary) → calls `showScreen('screen-signup')`, "Sign In" (secondary, outlined) → calls `showScreen('screen-login')`

---

## First-Time Detection

```js
function isFirstTimeUser() {
  const d = loadData();
  return !d || !d.email; // no stored account = first time
}
```

On app load (`DOMContentLoaded`): if `isFirstTimeUser()` → `showScreen('screen-onboarding')`, else → existing login flow.

---

## Slide Navigation

```js
let onboardingSlide = 1;
function goToSlide(n)     // updates active slide, dot states
function nextSlide()      // goToSlide(current + 1)
function skipOnboarding() // goToSlide(5) — jump to CTA
```

Slides use CSS `display: none` / `display: flex` toggling (matches existing tab pattern). No external libraries.

---

## What Must NOT Change

- `#screen-login`, `#screen-signup`, `#screen-app` — untouched
- `doLogin()`, `doSignup()`, `doLogout()` — untouched
- `switchTab()`, `initApp()`, `loadData()`, `saveData()` — untouched
- All existing tab panels and feature modules — untouched
- localStorage schema — no new keys added

---

## Files to Change

| File | Change |
|------|--------|
| `docs/index.html` | Add `#screen-onboarding` HTML + CSS + JS |
| `src/html/app.html` | Add onboarding HTML block |
| `src/css/main.css` | Add `/* ── ONBOARDING ── */` CSS section |
| `src/js/core.js` | Add `isFirstTimeUser()`, slide nav functions, update load logic |
| `scripts/validate.js` | Add `screen-onboarding`, `onboarding-slide-*` IDs to required list; add `goToSlide`, `skipOnboarding` to required functions |
| `README.md` | Document onboarding flow in Features section |
| `CLAUDE.md` | Add onboarding screen to tab/screen list |

---

## Testing

1. **Fresh user** (no localStorage): onboarding shows; can navigate all 4 slides; Skip goes to CTA; "Create Account" reaches signup; "Sign In" reaches login.
2. **Returning user** (localStorage has email): onboarding is skipped entirely; lands on login screen directly.
3. **Syntax check** passes: `node -e "..." && node --check /tmp/ayurai_test.js`
4. **Validate script** passes: `node scripts/validate.js`
5. **Existing features** unaffected: login → app → all 7 tabs work as before.

---

## Out of Scope

- Animations/transitions beyond CSS fade-in
- Swipe gesture support (tap/click navigation only)
- Storing "onboarding seen" flag (detection via existing `d.email` check is sufficient)
