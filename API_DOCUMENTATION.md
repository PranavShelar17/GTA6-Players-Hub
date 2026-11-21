# GTA 6 Player Hub – RESTful API Documentation

## 1. Specification Overview

The GTA 6 Player Hub REST API is served over HTTP/2 and HTTP/3 adhering to standard REST architectural principles. All endpoints follow the base prefix `/api/v1`.

### 1.1 Base URLs
- **Local Development**: `http://localhost:8000/api/v1`
- **Interactive Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc Interactive Reference**: `http://localhost:8000/api/v1/redoc`
- **OpenAPI Schema Specification**: `http://localhost:8000/api/v1/openapi.json`

### 1.2 Uniform Response Envelope
All API endpoints return JSON adhering to a standardized envelope format:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-11-21T12:00:00Z",
    "version": "1.0.0",
    "request_id": "req_01j7x4..."
  }
}
```

When an error occurs (`success: false`):
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "HTTP_409_CONFLICT",
    "message": "Username is already claimed by another player.",
    "details": [
      {
        "field": "username",
        "issue": "A player profile with this username already exists."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-11-21T12:00:00Z",
    "version": "1.0.0"
  }
}
```

---

## 2. Authentication & Authorization

Protected endpoints require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <supabase_jwt_access_token>
```
Tokens are issued by Supabase Auth upon successful login or registration and validated server-side by FastAPI.

---

## 3. Endpoints Catalog

### 3.1 System Health & Diagnostics

#### `GET /health`
Liveness probe returning application runtime status.
- **Access**: Public
- **Response**: `200 OK`

---

### 3.2 Homepage Data Feeds (`/home`)

#### `GET /home`
Aggregated homepage payload containing latest news, featured deals, upcoming milestones, and community highlights.
- **Access**: Public (Supports optional query parameters for personalized/localized feeds)
- **Query Parameters**:
  - `country_code` *(optional, string, e.g. "IN", "US", "GB", "DE")*: Filter deals to specific retailer market.
  - `currency` *(optional, string, e.g. "INR", "USD", "EUR", "GBP")*: Format and convert retail listings.
  - `platform` *(optional, string, e.g. "PC", "PS5", "Xbox")*: Prioritize player platform offerings.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": "news-1",
        "title": "Take-Two Reconfirms Grand Theft Auto VI Fall 2025 Release Window",
        "slug": "take-two-reconfirms-gta6-fall-2025",
        "summary": "Take-Two Interactive reconfirmed GTA VI is on track for Fall 2025 launch.",
        "source_name": "Rockstar Newswire / Take-Two",
        "source_url": "https://www.rockstargames.com/newswire",
        "published_at": "2026-11-15T18:00:00Z",
        "verification_status": "OFFICIAL",
        "category": "Official Announcement",
        "thumbnail_url": null
      }
    ],
    "deals": [
      {
        "id": "deal-1",
        "edition_name": "Standard Edition",
        "platform": "PlayStation 5",
        "country_code": "IN",
        "current_price": 5999.0,
        "currency": "INR",
        "original_price": null,
        "discount_percentage": 0,
        "retailer_name": "PlayStation Store (India)",
        "product_url": "/price-deals",
        "last_checked_at": "2026-11-20T12:00:00Z",
        "is_preorder": true
      }
    ],
    "events": [
      {
        "id": "evt-1",
        "event_name": "GTA VI Trailer 2 & Gameplay Deep Dive",
        "category": "Milestone",
        "date_string": "Early 2026",
        "start_time_iso": "2026-03-01T14:00:00Z",
        "timezone": "UTC",
        "description": "Anticipated second official trailer showcasing Leonida geography.",
        "is_official": false
      }
    ],
    "community": [
      {
        "id": "comm-1",
        "title": "Map Scale & Density: Leonida vs San Andreas & RDR 2",
        "author_username": "ViceCityNavigator",
        "author_avatar_url": null,
        "author_platform": "PS5",
        "category": "Vice City Lore",
        "published_at": "2026-11-18T10:00:00Z",
        "replies_count": 52,
        "likes_count": 147
      }
    ],
    "disclaimer": "Demonstration data for layout and verification modeling. Live automated ingestion connects in Phase 4 and Phase 5."
  },
  "error": null,
  "meta": { "timestamp": "...", "version": "1.0.0" }
}
```

#### `GET /home/news`
Fetch isolated homepage news articles with 4-tier verification labels.

#### `GET /home/deals`
Fetch localized retail edition listings with currency and platform parameters.

#### `GET /home/events`
Fetch upcoming GTA 6 milestones and countdown targets.

#### `GET /home/community`
Fetch trending player discussions from the community hub.

---
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "app_name": "GTA 6 Player Hub API",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2026-11-21T12:00:00Z"
  }
}
```

#### `GET /health/ready`
Readiness probe checking database and cache subsystem status.
- **Access**: Public
- **Response**: `200 OK`

---

### 3.2 Player Users & Authentication

#### `GET /users/check-username`
Checks whether a gamer username is valid and available.
- **Access**: Public
- **Query Parameters**:
  - `username` (string, required): 3–30 characters, alphanumeric and underscores.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "username": "ViceCityLegend",
    "is_available": true,
    "message": "Username is available."
  }
}
```

#### `GET /users/me`
Retrieves authenticated user details, linked profile, preferences, and recent security activities.
- **Access**: Authenticated (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "player@example.com",
    "profile": {
      "id": "11111111-1111-1111-1111-111111111111",
      "user_id": "11111111-1111-1111-1111-111111111111",
      "username": "ViceCityLegend",
      "display_name": "Vice City Legend",
      "avatar_url": null,
      "bio": "Counting down to GTA VI launch day.",
      "country_code": "USA",
      "preferred_platform": "PS5",
      "preferred_language": "en",
      "profile_visibility": "public",
      "reputation_score": 10,
      "is_verified": false,
      "created_at": "2026-11-21T12:00:00Z",
      "updated_at": "2026-11-21T12:00:00Z"
    },
    "preferences": {
      "id": "11111111-1111-1111-1111-111111111111",
      "user_id": "11111111-1111-1111-1111-111111111111",
      "preferred_country": "USA",
      "preferred_currency": "USD",
      "preferred_platform": "PS5",
      "preferred_edition": "Standard Edition",
      "preferred_language": "en",
      "email_notifications": true,
      "push_notifications": false,
      "community_notifications": true,
      "news_notifications": true,
      "price_alert_notifications": true,
      "event_notifications": true
    },
    "recent_activities": []
  }
}
```

#### `POST /users/sync`
Explicitly syncs or initializes profile and preference records upon login.
- **Access**: Authenticated
- **Body**: `{ "username": "string", "display_name": "string" }`
- **Response**: `200 OK`

#### `GET /users/me/profile`
Retrieves player profile record.
- **Access**: Authenticated
- **Response**: `200 OK`

#### `PUT /users/me/profile`
Updates player profile fields (display name, username, bio, country, platform, visibility).
- **Access**: Authenticated
- **Body**:
```json
{
  "display_name": "Alex Vance",
  "username": "AlexVance6",
  "bio": "Vice City explorer and PC hardware builder.",
  "country_code": "USA",
  "preferred_platform": "PC",
  "profile_visibility": "public"
}
```
- **Responses**:
  - `200 OK`: Profile successfully updated.
  - `409 Conflict`: Username already claimed by another user.
  - `422 Unprocessable`: Validation failed.

#### `GET /users/me/preferences`
Retrieves user preferences.
- **Access**: Authenticated
- **Response**: `200 OK`

#### `PUT /users/me/preferences`
Updates regional preferences and notification toggles.
- **Access**: Authenticated
- **Body**:
```json
{
  "preferred_country": "IND",
  "preferred_currency": "INR",
  "preferred_platform": "PS5",
  "preferred_edition": "Deluxe Edition",
  "email_notifications": true,
  "price_alert_notifications": true
}
```
- **Response**: `200 OK`

#### `POST /users/me/avatar`
Uploads and updates player profile avatar.
- **Access**: Authenticated
- **Content-Type**: `multipart/form-data` (`file`: image binary)
- **Validation**: MIME type in (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), size <= 2MB.
- **Responses**:
  - `200 OK`: Avatar updated.
  - `400 Bad Request`: Unsupported file type or size exceeds 2 MB.

#### `DELETE /users/me/avatar`
Removes custom avatar, resetting to default.
- **Access**: Authenticated
- **Response**: `200 OK`

#### `GET /users/me/activity`
Returns the 25 most recent security and profile activity entries.
- **Access**: Authenticated
- **Response**: `200 OK`

#### `DELETE /users/me`
Account deletion request permanently removing profile, preferences, and activity records.
- **Access**: Authenticated
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Player account and associated data successfully removed."
  }
}
```

---

### 3.4 News & Editorial Bulletins (`/news`)

Detailed specification documented in [docs/NEWS_API_DOCUMENTATION.md](file:///c:/Users/Pranav/Downloads/GTA6-Players-Hub-main/docs/NEWS_API_DOCUMENTATION.md).

#### `GET /news`
Paginated published news listing with keyword search (`q`), category filter (`category`), source filter (`source_id`), verification status filter (`verification_status`), and sorting (`latest`, `oldest`, `featured`).

#### `GET /news/featured`
Returns the latest featured or official announcement.

#### `GET /news/categories`
Returns active categories with real-time published article counts.

#### `GET /news/sources`
Returns public list of enabled news sources and trust levels.

#### `GET /news/stats`
Returns total published articles and breakdown across 4-tier verification levels.

#### `GET /news/{slug}`
Returns article detail payload including formatted content and related coverage.

#### `GET /news/{slug}/related`
Returns up to N related articles from the same category.

#### `GET /news/bookmarks`
Returns articles saved to the authenticated player's personal bookmarks.
- **Access**: Authenticated

#### `POST /news/{article_id}/bookmark`
Saves an article to the authenticated player's personal bookmarks.
- **Access**: Authenticated

#### `DELETE /news/{article_id}/bookmark`
Removes an article from the authenticated player's personal bookmarks.
- **Access**: Authenticated

#### `POST /news/collect`
Triggers synchronization and collection across approved sources with canonical URL deduplication.
- **Access**: System / Internal
