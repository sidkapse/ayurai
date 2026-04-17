# AyurAI — Future Plans & Roadmap

## Engagement Improvements

### High Impact, Low Effort
1. **Persistent chat history** — Ask AI and Herb Chat conversations are lost on close. Saving last 5 sessions to localStorage would make users return to continue where they left off.
2. **Food history search & re-check** — History tab has no search and no "Re-check this food" button. Users who want to revisit a food have to retype it.
3. **Starter prompts from real ailments** — Ask AI starter cards are hardcoded by dosha. They should pull from the user's actual saved ailments (e.g., if user has "Acidity", show "What helps my acidity?").
4. **Herb bookmarks** — No way to save a recommended herb. Users who get a herb recommendation have no way to retrieve it later without re-running the same query.

### High Impact, Medium Effort
5. **Daily check-in nudge** — A "What are you eating today?" card on the Home tab that resets daily. Simple prompt drives repeat visits.
6. **Streaks** — "You've checked your food 5 days in a row" with a small badge. Ayurvedic apps live or die on daily habit formation.
7. **Weekly summary card** — Every Sunday, Home tab shows "This week: 8 food checks, 2 herb queries, 3 YES verdicts". Makes the app feel alive.
8. **Browser notifications** — Dinacharya blocks have exact times. A "Your Abhyanga window starts in 10 minutes" push notification would be genuinely useful and drive daily active use.

### Medium Impact
9. **Social sharing** — A "Share My Dosha" card (image with dosha scores + key traits) for Instagram/WhatsApp. Free viral growth — Ayurveda content performs well on social.
10. **Onboarding completion tracking** — Show a progress ring on Home: "You've set up 4/6 profile items" (missing: city, birth date, Stage 2 quiz, API key). Drives profile completion.

---

## Monetization Options (Ranked by Feasibility)

### Tier 1 — Launch Now (Weeks)
**Managed API Key** — The #1 friction point for new users is having to get their own OpenAI API key. Most people drop off here. Offer:
- **Free plan**: Bring your own key (current behaviour)
- **Pro plan ($6–9/month)**: AyurAI provides the API key — user just signs up and uses the app

Requires a backend (simple Node/Express proxy) and a payment processor (Stripe). OpenAI cost per active user is ~$0.50–1.50/month at current usage patterns, so margin is healthy.

### Tier 2 — 1–3 Months
**Content Library** — Add an "Insights" tab with:
- Free: 5 foundational articles (What is Vata? Seasonal eating guide, etc.)
- Pro: 50+ recipes, meal plans, seasonal guides, herb encyclopaedia

Low AI cost (mostly static content), high perceived value.

### Tier 3 — 3–6 Months
**Affiliate revenue from Herb Advisor** — Every herb recommendation currently has no action. Add a "Where to buy" button linking to trusted Ayurvedic supplement retailers (iHerb, Banyan Botanicals, etc.) with affiliate links. No backend needed — pure static links. Estimated 3–8% commission per purchase.

**7-day meal plan generator** — "Generate my dosha meal plan for this week" button. Single AI call, high perceived value. Gate behind Pro plan.

### Tier 4 — 6+ Months
**1:1 Consultations** — "Book a session with a certified Vaidya" (Calendly/similar embed). Platform fee of 20–30%. Transforms the app from a tool into a marketplace.

---

## Quick Wins Priority Table

| # | Change | Where | Effort |
|---|--------|--------|--------|
| 1 | Save Ask AI chat history (last 3 sessions) | ask-anything.js | Small |
| 2 | "Re-check" button in Food History | food.js | Small |
| 3 | Ailment-aware starter prompts in Ask AI | ask-anything.js | Small |
| 4 | Profile completion ring on Home | core.js | Small |
| 5 | Herb bookmark (save to localStorage) | herbs.js | Medium |
| 6 | Daily food check-in card on Home | core.js | Medium |
| 7 | "Where to buy" affiliate links in Herb results | herbs.js | Medium |
| 8 | Social share card for Dosha result | quiz.js | Medium |

---

## Feature Gaps by Area

| Feature | Gap | Impact | Fix Effort |
|---------|-----|--------|------------|
| Quiz | Stage 1 only (10Q) leaves ~33% uncertainty; low Stage 2 completion | Medium | Medium |
| Food Check | Advanced filters hidden; users miss timing/symptom options | High | Low |
| Food History | No search, no filter, no re-check button, capped at 10 items | Medium | Low |
| Herbs | No bookmarks; chat history lost on close; modes not combinable | High | Medium |
| Dinacharya | No notifications; 8 blocks rigid; only 2 days ahead | High | High |
| Ask Anything | Chat not persisted; not integrated with other feature results | High | Medium |
| All tabs | No streaks, no habit tracking, no engagement loops | High | Medium |
| All tabs | No social sharing; no viral growth mechanism | High | Medium |
| Settings | No data backup reminder; no cross-device sync | Low | High |

---

## Long-Term Vision

1. **Community** — Private forum/Slack for premium users + monthly group Q&A with a Vaidya
2. **Wellness Challenges** — "30-Day Dosha Balancing Challenge" with progress tracking and prizes
3. **Corporate Wellness** — White-label licensing for companies (employee wellness programmes)
4. **Health Integrations** — Sync with Apple Health, Google Fit, Fitbit for holistic profile
5. **Marketplace** — In-app shop for certified Ayurvedic products with curated recommendations
6. **Certifications** — Become a recognised learning tool for Ayurveda students and practitioners
