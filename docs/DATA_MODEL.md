# AyurAI — Data Model Reference

All persistent data is stored in the browser's `localStorage`. No server, no database.

## Storage Keys

| Key | Purpose |
|---|---|
| `ayurai_my_info` | Main user profile and all feature data |
| `ayurai_dina_prefs` | Dinacharya filter preferences (wake/sleep/day) |
| `ayurai_error_log` | Last 5 app error entries for diagnostics |

---

## `ayurai_my_info` Schema

```jsonc
{
  // ── User Account ──
  "user": {
    "name": "string",           // Display name
    "email": "string",          // Login email
    "password": "string",       // Plain text — local only, never transmitted
    "createdAt": "ISO8601"
  },

  // ── Dosha Profile ──
  "dosha": {
    "primary": "Vata|Pitta|Kapha",
    "stage": 1 | 2,             // 1 = Stage 1 quiz only, 2 = both stages completed
    "scores": {
      "Vata": 0-100,            // Percentage
      "Pitta": 0-100,
      "Kapha": 0-100
    },
    "description": "string",
    "qualities": "string",
    "balance": "string",
    "completedAt": "ISO8601"
  },

  // ── Ailments ──
  "ailments": ["string"],       // Selected from COMMON_AILMENTS list

  // ── Location ──
  "city": "string",             // Used for seasonal inference in AI prompts

  // ── Gender ──
  "gender": "Male|Female|Non-binary|''",  // '' = Prefer not to say; used in all AI prompts

  // ── Food History ──
  "foodHistory": [              // Capped at 10 entries (FIFO)
    {
      "food": "string",
      "verdict": "YES|NO",
      "reason": "string",
      "timestamp": "ISO8601"
    }
  ],

  // ── AI-Generated Dosha Insights (cached) ──
  "doshaInsights": {
    "foods_to_avoid": ["string"],
    "top3_care": [
      { "icon": "material_icon_name", "tip": "string" }
    ],
    "best_meal_times": "string",
    "dosha_strength": "string"
  },

  // ── App Settings ──
  "settings": {
    "openaiApiKey": "string"    // sk-... stored locally, used for direct API calls
  },

  // ── App Metadata ──
  "meta": {
    "appVersion": "string",
    "lastLogin": "ISO8601"
  },

  // ── Export Metadata (only present after export) ──
  "_export_meta": {
    "exported_at": "ISO8601",
    "app_version": "string",
    "features_included": ["string"]
  }
}
```

---

## `ayurai_dina_prefs` Schema

```jsonc
{
  "wake": "HH:MM",       // 24h format, default "06:30"
  "sleep": "HH:MM",      // 24h format, default "22:30"
  "dayOffset": 0 | 1 | 2 // 0=Today, 1=Tomorrow (default), 2=Day after
}
```

---

## `ayurai_error_log` Schema

```jsonc
[
  {
    "ts": "ISO8601",       // Timestamp of error
    "ctx": "string",       // Context label e.g. "callOpenAI", "Uncaught", "Promise"
    "msg": "string",       // Error message
    "stack": "string"      // First stack frame (trimmed)
  }
  // Up to 5 entries, newest first
]
```

---

## Notes

- **Password storage**: Passwords are stored as plain text in localStorage. This is acceptable for a personal local-use app. For multi-user or hosted deployment, passwords should be hashed (bcrypt) server-side.
- **API Key storage**: The OpenAI API key is stored in localStorage and sent directly from the browser to `api.openai.com`. This is fine for personal use. For production/shared hosting, proxy the API calls through a backend.
- **Data portability**: Users can export `my_info.json` and import it on any device. The `_export_meta` field is stripped on import.
- **Cache invalidation**: `doshaInsights` is cleared when the user retakes the quiz. `dinaCache` resets daily (keyed by `Date.toDateString()`).
