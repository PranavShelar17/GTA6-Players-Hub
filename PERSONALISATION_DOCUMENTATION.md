# PERSONALISATION DOCUMENTATION
## GTA 6 Player Hub – Player Preferences & Content Customisation

### 1. Overview

The Personalisation system enables players to tailor their discovery feed, visual theme, and information density across the GTA 6 Player Hub. Rather than creating disjointed preference tables, Phase 11 cleanly extended the existing `player_preferences` model to preserve unified account management.

---

### 2. Preference Model Attributes

The `player_preferences` schema (defined in [backend/app/models/user.py](file:///c:/Users/Admin/Downloads/GTA6-Players-Hub-main/GTA6-Players-Hub-main/backend/app/models/user.py)) contains:

| Field | Data Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `preferred_country` | `VARCHAR(3)` | `'USA'` | ISO 3166-1 alpha-3 code for local price conversions. |
| `preferred_currency` | `VARCHAR(3)` | `'USD'` | Preferred currency symbol for deal prices. |
| `preferred_platform` | `VARCHAR(50)` | `'PC'` | Primary gaming hardware (`PC`, `PLAYSTATION_5`, `XBOX_SERIES`). |
| `preferred_edition` | `VARCHAR(50)` | `'Standard Edition'` | Favorite game edition for tracker prioritization. |
| `preferred_language` | `VARCHAR(10)` | `'en'` | Interface localization language. |
| **`preferred_categories`** | `VARCHAR(255)` | `NULL` | Comma-separated preferred tags (e.g. `OFFICIAL,VERIFIED,DEALS`). |
| **`theme`** | `VARCHAR(32)` | `'dark'` | UI display theme (`dark`, `light`, `system`). |
| **`content_density`** | `VARCHAR(32)` | `'comfortable'` | Card and table layout spacing (`comfortable`, `compact`). |
| `email_notifications` | `BOOLEAN` | `TRUE` | Master toggle for email delivery. |
| `price_alert_notifications` | `BOOLEAN` | `TRUE` | Wishlist threshold notifications. |
| `news_notifications` | `BOOLEAN` | `TRUE` | Official Rockstar bulletin alerts. |
| `event_notifications` | `BOOLEAN` | `TRUE` | Calendar launch and stream alerts. |

---

### 3. API Endpoints

#### `GET /api/v1/users/me/preferences`
- **Authentication:** Required (`Bearer <token>`).
- **Response:** Current preferences payload matching `PlayerPreferencesRead`.

#### `PUT /api/v1/users/me/preferences`
- **Authentication:** Required (`Bearer <token>`).
- **Request Body:** Partial `PlayerPreferencesUpdate`.
- **Response:** Updated preferences payload.
- **Audit Logging:** Automatically logs a `preferences_updated` record in `player_activities`.

---

### 4. Frontend Settings Experience (`/settings`)

The Settings page (`frontend/src/app/settings/page.tsx`) provides:
1. **Regional & Gaming Settings:** Country, currency, platform, edition, and language.
2. **Feed & Search Content Personalisation:** Multi-checkbox filters for Official Rockstar Bulletins, Verified News, Leaks & Rumours, Price Drops, Events, and Troubleshooting Guides.
3. **Display & Layout Options:**
   - **Display Theme:** Dark Theme (default), Light Theme, System.
   - **Content Density:** Comfortable (card layout), Compact (dense data rows).
4. **Immediate Persistence:** Instant feedback via toast notifications and optimistic state updates.
