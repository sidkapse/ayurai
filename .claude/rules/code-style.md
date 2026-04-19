<!--
PURPOSE: Scoped UI and CSS style rules for AyurAI, extracted from CLAUDE.md for focused loading.
         Claude loads these rules alongside CLAUDE.md on every session start.
BENEFIT:  Claude gets targeted, unambiguous UI/CSS rules without scanning all of CLAUDE.md,
          reducing the chance of icon or colour mistakes during HTML/CSS edits.
EXAMPLE:  When adding a new button in docs/index.html, Claude uses <span class="mi">add</span>
          for the icon (Material Icons) and --burgundy for the primary colour — never emoji,
          never hardcoded hex — because these rules are loaded by default.
-->

# AyurAI Code Style Rules

## Icons — Material Icons Only
- Filled icon:   `<span class="mi">icon_name</span>`
- Outlined icon: `<span class="mio">icon_name</span>`
- **Never** use emoji for UI icons
- **Never** apply `text-transform: uppercase` or `letter-spacing` on any parent element
  containing `.mi` or `.mio` spans — it corrupts icon rendering

## CSS Variables — Always Use, Never Hardcode
All colours are defined in `src/css/main.css`. Reference by variable everywhere:

```
--burgundy:   #6B1E3A   /* Primary brand colour */
--lotus:      #D4758A   /* Secondary / accent */
--gold:       #C9A84C   /* Highlights, badges */
--cream:      #FDF6EE   /* Page background */
--cream-dark: #F2E8DC   /* Card backgrounds, borders */
--charcoal:   #2C1810   /* Dark text */
--text-muted: #8B6F5E   /* Secondary text */
--text-light: #B89A8A   /* Placeholder text */
```

## CSS Section Headers
New CSS sections must start with: `/* ── FEATURE NAME ── */`

## DOM Access — Use Helpers, Not Raw APIs
```js
el('element-id')          // safe getElementById — returns null, never throws
setText('id', 'text')     // safe textContent setter
getData('dosha.primary')  // dot-path getter with null fallback
setData('settings.openaiApiKey', key)  // dot-path setter, auto-saves to localStorage
```

## scrollTop After innerHTML
Always wrap in `requestAnimationFrame` — synchronous assignment fires before the browser paints:
```js
requestAnimationFrame(() => { el('app-content').scrollTop = 0; });
```

## Fixed Overlays (Android Keyboard Fix)
Use `top:0; left:0; right:0; bottom:0` — **not** `height: 100dvh`
Add `overflow: hidden` to overlay, `min-height: 0` to the scrollable flex child (`.ask-chat`).
Both `#ask-overlay` and `#herb-chat-overlay` use this pattern.

## Overlay Open/Close Animation
```js
// Open
overlay.style.display = 'flex';
requestAnimationFrame(() => overlay.classList.add('open'));
// Close
overlay.classList.remove('open');
overlay.addEventListener('transitionend', () => { overlay.style.display = 'none'; }, { once: true });
```

## Notifications
```js
showToast('Message');  // bottom-of-screen toast — use for all user-facing feedback
```
