# SEARCH API DOCUMENTATION
## GTA 6 Player Hub – Global Search & Saved Content API Reference

### Base Path
All endpoints are prefixed with `/api/v1`.

---

### 1. Global Search Endpoints

#### `GET /api/v1/search`
Executes full-text multi-category search with filtering, sorting, and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | string | `""` | Search query or keyword phrase. |
| `category` | string | `"ALL"` | Filter: `ALL`, `NEWS`, `DEALS`, `EVENTS`, `COMMUNITY`, `HELP`. |
| `sort` | string | `"relevant"` | Order: `relevant`, `newest`, `oldest`, `upcoming`, `price_asc`, `price_desc`. |
| `page` | integer | `1` | Page number (min 1). |
| `page_size` | integer | `20` | Results per page (1–100). |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "f8a7e0c4-1234-5678-90ab-cdef12345678",
        "content_type": "NEWS",
        "content_id": "3a4b5c6d-0000-1111-2222-333344445555",
        "title": "Official GTA 6 Vice City Map Deep Dive",
        "description": "Comprehensive analysis of Vice City geography.",
        "category": "Official News",
        "url_path": "/news/vice-city-map",
        "thumbnail_url": "https://example.com/images/map.jpg",
        "verification_status": "OFFICIAL",
        "source_or_author": "Rockstar Games",
        "published_or_event_at": "2026-11-20T14:00:00Z",
        "price_display": null,
        "metadata": null
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20,
    "total_pages": 1,
    "query": "Vice City",
    "category_filter": "news",
    "sort": "relevant"
  },
  "error": null,
  "meta": { "timestamp": "2026-11-23T11:45:00Z", "version": "1.0.0" }
}
```

---

#### `GET /api/v1/search/suggestions`
Provides autocomplete typeahead suggestions and popular queries.

**Query Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | string | `""` | Search term prefix. |
| `limit` | integer | `6` | Maximum suggestions (1–20). |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "query": "Vice",
    "suggestions": [
      {
        "title": "Official GTA 6 Vice City Map Deep Dive",
        "category": "Official News",
        "content_type": "NEWS",
        "url_path": "/news/vice-city-map"
      }
    ],
    "popular": [
      "GTA 6 latest news",
      "Official Trailer 2",
      "Vice City release date",
      "PlayStation 5 preorder price",
      "PC system requirements"
    ]
  }
}
```

---

#### `GET /api/v1/search/categories`
Returns match counts across categories for filter badges.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "all": 42,
    "news": 18,
    "deals": 6,
    "events": 5,
    "community": 10,
    "help": 3
  }
}
```

---

#### `GET /api/v1/search/recent`
Retrieves authenticated player's recent search queries.

**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:** `limit` (default 10)  
**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "e4f5a6b7-8901-2345-6789-abcdef012345",
      "query": "Vice City Leaks",
      "category_filter": "NEWS",
      "results_count": 5,
      "searched_at": "2026-11-23T10:30:00Z"
    }
  ]
}
```

---

#### `POST /api/v1/search/recent`
Explicitly records a query in player history.

**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "query": "Vice City Leaks",
  "category_filter": "NEWS",
  "results_count": 5
}
```

---

#### `DELETE /api/v1/search/recent`
Clears player's recent searches (or a specific item if `history_id` is supplied).

**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:** `history_id` (optional)  
**Response (200 OK):**
```json
{
  "success": true,
  "data": { "cleared": true }
}
```

---

#### `POST /api/v1/search/reindex`
Rebuilds the search index table from all primary entities.

**Headers:** `X-Automation-Key: <AUTOMATION_API_KEY>` or `Authorization: Bearer <token>`  
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reindexed": true,
    "indexed_items_count": 42
  }
}
```

---

### 2. Unified Saved Content Endpoints

#### `GET /api/v1/users/me/saved`
Retrieves aggregated saved items across news bookmarks, wishlist, events, and community.

**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | `"ALL"` | Filter: `ALL`, `NEWS`, `DEALS`, `EVENTS`, `COMMUNITY`. |
| `page` | integer | `1` | Page number. |
| `page_size` | integer | `20` | Items per page. |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "7b8c9d0e-1111-2222-3333-444455556666",
        "saved_type": "NEWS",
        "saved_at": "2026-11-23T08:00:00Z",
        "title": "Vice City Marina Location Discovered",
        "description": "Detailed analysis of Vice City boat slip.",
        "url_path": "/news/marina-analysis",
        "thumbnail_url": null,
        "badge": "VERIFIED",
        "metadata": {
          "article_id": "12345678-...",
          "slug": "marina-analysis"
        }
      }
    ],
    "total": 1,
    "counts_by_type": {
      "ALL": 4,
      "NEWS": 1,
      "DEALS": 1,
      "EVENTS": 1,
      "COMMUNITY": 1
    },
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

---

#### `DELETE /api/v1/users/me/saved/{saved_type}/{item_id}`
Deletes a specific saved bookmark/wishlist/event entry by its record ID.

**Headers:** `Authorization: Bearer <token>`  
**Path Parameters:**
- `saved_type`: `NEWS`, `DEALS`, `EVENTS`, `COMMUNITY`.
- `item_id`: Primary key UUID of the bookmark/wishlist/saved_event row.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "removed": true,
    "saved_type": "NEWS",
    "item_id": "7b8c9d0e-1111-2222-3333-444455556666"
  }
}
```
