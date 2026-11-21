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
