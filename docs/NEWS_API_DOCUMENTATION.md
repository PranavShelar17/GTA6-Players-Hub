# GTA 6 Player Hub – News REST API Specification

**Base Path:** `/api/v1/news`  
**Protocol:** HTTP/1.1, HTTP/2  
**Response Envelope:** Standardized `ApiResponse<T>` with metadata

---

## 1. Public News Endpoints

### 1.1 `GET /api/v1/news`
Retrieves paginated news articles with filtering, searching, and sorting.

- **Query Parameters**:
  - `q` *(optional, string)*: Case-insensitive search keyword matched against article titles and summaries.
  - `category` *(optional, string)*: Category slug (e.g. `official-announcements`, `map-locations`).
  - `source_id` *(optional, UUID)*: Filter articles by specific source ID.
  - `verification_status` *(optional, string)*: Filter by `OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`.
  - `sort` *(optional, string)*: `latest` (default), `oldest`, `featured`.
  - `page` *(optional, integer, default: 1)*: Page number.
  - `page_size` *(optional, integer, default: 10, max: 50)*: Items per page.
- **Headers**:
  - `Authorization: Bearer <token>` *(optional)*: If supplied, populates `is_bookmarked` for each article for the authenticated player.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "c1f10903-8d05-4f40-b472-358055c65f01",
        "title": "Take-Two Interactive Reconfirms Grand Theft Auto VI Fall 2025 Release Window",
        "slug": "take-two-reconfirms-gta6-fall-2025",
        "summary": "In corporate financial remarks, Take-Two Interactive affirmed launch remains on schedule.",
        "image_url": "https://images.unsplash.com/...",
        "category_slug": "official-announcements",
        "source_name": "Take-Two Interactive IR",
        "source_url": "https://www.take2games.com/ir",
        "verification_status": "OFFICIAL",
        "original_published_at": "2026-11-15T18:00:00Z",
        "is_featured": true,
        "read_time_minutes": 3,
        "is_bookmarked": false
      }
    ],
    "total": 6,
    "page": 1,
    "page_size": 10,
    "total_pages": 1,
    "has_more": false
  },
  "error": null,
  "meta": { "timestamp": "2026-11-22T01:15:00Z", "version": "1.0.0" }
}
```

---

### 1.2 `GET /api/v1/news/featured`
Returns the primary featured article, or the most recent official bulletin.

---

### 1.3 `GET /api/v1/news/categories`
Returns active categories with real-time published article counts.

---

### 1.4 `GET /api/v1/news/sources`
Returns public configuration and trust levels of registered publishers.

---

### 1.5 `GET /api/v1/news/stats`
Returns aggregate factual reporting statistics:
```json
{
  "success": true,
  "data": {
    "total_articles": 6,
    "official_count": 1,
    "verified_count": 3,
    "rumour_count": 1,
    "unconfirmed_count": 1,
    "last_updated": "2026-11-15T18:00:00Z"
  }
}
```

---

### 1.6 `GET /api/v1/news/{slug}`
Retrieves complete article details, including formatted content and related articles.
- Returns `404 Not Found` if slug does not exist or is unpublished.

---

### 1.7 `GET /api/v1/news/{slug}/related`
Returns up to `limit` related articles in the same category.

---

## 2. Authenticated Bookmark Endpoints

*All endpoints in this section require `Authorization: Bearer <supabase_jwt>`.*

### 2.1 `GET /api/v1/news/bookmarks`
Returns the list of articles bookmarked by the authenticated player.

### 2.2 `POST /api/v1/news/{article_id}/bookmark`
Saves an article to the player's personal bookmarks.
- Response: `200 OK` with `{ "article_id": "...", "is_bookmarked": true }`
- Returns `401 Unauthorized` if unauthenticated.
- Returns `404 Not Found` if article does not exist.

### 2.3 `DELETE /api/v1/news/{article_id}/bookmark`
Removes an article from the player's personal bookmarks.
- Response: `200 OK` with `{ "article_id": "...", "is_bookmarked": false }`
