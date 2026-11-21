# GTA 6 Player Hub – API Documentation & Interface Specifications

## 1. RESTful Standards & Architectural Conventions

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Character Encoding**: `UTF-8`
- **Authentication**: Bearer Token in standard header (`Authorization: Bearer <Supabase_JWT>`)
- **CORS Allowed Origins**: Defined via strict environment variable whitelist.

### 1.1 Universal Response Envelope

All API endpoints produce a consistent JSON envelope adhering to industry best practices:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2026-11-21T12:00:00Z",
    "version": "1.0.0",
    "request_id": "req_84f93a10"
  }
}
```

### 1.2 RFC 7807 Error Response Envelope

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested article was not found.",
    "details": [
      {
        "field": "slug",
        "issue": "No article matches the provided slug 'rockstar-fall-2025'"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-11-21T12:00:00Z",
    "version": "1.0.0",
    "request_id": "req_84f93a10"
  }
}
```

---

## 2. Comprehensive Endpoint Catalog

### 2.1 Authentication & Profiles (`/auth` & `/profiles`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new player with email, password, and chosen username. |
| `POST` | `/auth/login` | Public | Authenticate player and receive JWT session tokens. |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for fresh access token. |
| `POST` | `/auth/logout` | Required | Invalidate current session token. |
| `GET` | `/profiles/me` | Required | Retrieve current authenticated player profile and settings. |
| `PATCH` | `/profiles/me` | Required | Update display name, bio, preferred platform, avatar, and currency. |
| `GET` | `/profiles/{username}` | Public | Retrieve public player profile, badges, and community stats. |
| `POST` | `/profiles/{username}/follow` | Required | Follow or unfollow a player. |
| `POST` | `/profiles/{username}/block` | Required | Block user from feed interactions. |

---

### 2.2 News & Announcements (`/news`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/news` | Public | Paginated news catalog with filters: `category`, `status` (`OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`), search query, and sorting. |
| `GET` | `/news/{slug}` | Public | Retrieve single news article detail, metadata, and original source citation. |
| `GET` | `/news/featured` | Public | High-priority announcements for the Home Page hero/ticker. |
| `POST` | `/news/{id}/bookmark` | Required | Bookmark an article to the user's dashboard. |
| `DELETE` | `/news/{id}/bookmark` | Required | Remove an article from bookmarks. |

---

### 2.3 Global Price & Deals Tracker (`/deals` & `/prices`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/deals` | Public | Retrieve real-time verified prices filtered by: `country` (IND, USA, GBR, EUR, ARE), `platform` (PS5, Xbox, PC), `edition`, and `max_price`. |
| `GET` | `/deals/{id}/history` | Public | Retrieve historical price data points for Recharts rendering (all-time high, low, trend). |
| `GET` | `/deals/verified-retailers` | Public | List authorized digital and physical retail stores with credentials. |
| `GET` | `/wishlist` | Required | Retrieve current user's tracked game editions and target alert thresholds. |
| `POST` | `/wishlist` | Required | Add edition to user's wishlist with target alert price. |
| `DELETE` | `/wishlist/{id}` | Required | Remove item from wishlist. |

---

### 2.4 PC Compatibility Engine (`/hardware`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/hardware/cpus` | Public | Search and list CPU models and performance benchmark tiers. |
| `GET` | `/hardware/gpus` | Public | Search and list GPU models, VRAM capacities, and DX12 capabilities. |
| `POST` | `/hardware/compatibility/check`| Public | Analyze custom hardware spec (CPU, GPU, RAM, Storage, Target Resolution). Returns bottleneck analysis, upgrade suggestions, and unconfirmed status disclosure. |
| `POST` | `/hardware/reports/save` | Required | Persist compatibility report to player's dashboard. |
| `GET` | `/hardware/reports/{id}` | Public | Retrieve saved compatibility report via shareable permalink. |

---

### 2.5 AI Gaming Problem Solver (`/support`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/support/chat` | Public / Req | Send troubleshooting query. RAG retrieves relevant verified error docs, Gemini synthesizes safe step-by-step resolution checklist. |
| `GET` | `/support/conversations/{id}` | Public / Req | Retrieve message history of a troubleshooting session. |
| `GET` | `/support/kb/errors` | Public | Search verified knowledge base error encyclopedia (e.g., `ERR_GFX_D3D_INIT`). |
| `POST` | `/support/feedback` | Public / Req | Submit helpfulness rating (thumbs up/down) with optional comments. |

---

### 2.6 Gaming Community (`/community`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/community/feed` | Public | Paginated feed of player posts, filterable by group, trending, or followed players. |
| `POST` | `/community/posts` | Required | Create a new community post (text, media attachments, or poll). |
| `GET` | `/community/posts/{id}` | Public | Retrieve single post and nested comment hierarchy. |
| `POST` | `/community/posts/{id}/like` | Required | Toggle like on a post. |
| `POST` | `/community/posts/{id}/comments` | Required | Submit a comment or reply to an existing comment. |
| `POST` | `/community/polls/{id}/vote` | Required | Cast a vote on a community poll. |
| `POST` | `/community/report` | Required | Report offensive, spam, or abusive content to moderation queue. |

---

### 2.7 Events Calendar & Notifications (`/events` & `/notifications`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/events` | Public | List upcoming GTA 6 milestones, trailer drops, and game events with countdown timestamps. |
| `POST` | `/events/{id}/remind` | Required | Subscribe to email / in-app reminder for an event. |
| `GET` | `/notifications` | Required | List user notifications with read/unread indicators. |
| `PATCH` | `/notifications/{id}/read`| Required | Mark a notification as read. |
| `PATCH` | `/notifications/read-all` | Required | Mark all notifications as read. |

---

### 2.8 Global Search (`/search`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/search` | Public | Multi-entity federated search. Query parameter `q` returns grouped matches across `news`, `community_posts`, `deals`, `events`, and `troubleshooting_articles`. |
