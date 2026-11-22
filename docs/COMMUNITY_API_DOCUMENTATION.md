# GTA 6 Player Hub – Community API Documentation (Phase 7)

All endpoints follow RFC 7807 problem details and the universal `ApiResponse[T]` envelope:
```json
{
  "success": true,
  "data": ...,
  "meta": { "total": 100, "limit": 20, "offset": 0 },
  "error": null
}
```

## 1. Categories & Posts

### `GET /api/v1/community/categories`
- **Auth**: Public
- **Description**: Returns all 10 active community categories ordered by display sequence.

### `GET /api/v1/community/posts`
- **Auth**: Optional (enables `is_liked`, `is_bookmarked`, and applies block/mute filters)
- **Query Parameters**:
  - `feed_type`: `latest` (default), `popular`, `following`
  - `category`: Category slug (e.g., `gameplay-discussion`)
  - `search`: Keyword string (matches title and content case-insensitively)
  - `player_id`: Filter posts by author UUID
  - `limit`: Number of posts (1–50, default 20)
  - `offset`: Pagination offset (default 0)

### `POST /api/v1/community/posts`
- **Auth**: Required
- **Status**: `201 Created`
- **Payload**:
```json
{
  "title": "Dual-Protagonist Combat Tactics",
  "content": "Deep breakdown of how Jason and Lucia can coordinate tactical escapes.",
  "category_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "media_urls": ["/uploads/community/abc123.webp"],
  "poll": {
    "question": "Which protagonist will you play as first?",
    "allow_vote_change": true,
    "options": ["Lucia", "Jason", "Even Split"]
  }
}
```

### `GET /api/v1/community/posts/{post_id}`
- **Auth**: Optional
- **Description**: Retrieves full post details and atomically increments `views_count`.

### `PATCH /api/v1/community/posts/{post_id}`
- **Auth**: Required (Author only, enforced with HTTP 403)
- **Payload**: `{ "title": "Updated Title", "content": "Updated Content" }`

### `DELETE /api/v1/community/posts/{post_id}`
- **Auth**: Required (Author only, enforced with HTTP 403)
- **Description**: Soft deletes the post (`post_status = "DELETED"`, `deleted_at = NOW()`).

---

## 2. Media Upload

### `POST /api/v1/community/media/upload`
- **Auth**: Required
- **Form Data**: `file` (multipart/form-data)
- **Constraints**: Allowed MIME types `image/jpeg`, `image/png`, `image/webp`. Max size 10MB.
- **Response**: `{ "media_url": "/uploads/community/{uuid}.webp", "file_size": 204800, "media_type": "IMAGE" }`

---

## 3. Likes, Bookmarks & Comments

### `POST /api/v1/community/posts/{post_id}/like`
- **Auth**: Required
- **Description**: Toggles like. Atomically updates `likes_count`. Dispatches `COMMUNITY` notification to post author.

### `POST /api/v1/community/posts/{post_id}/bookmark`
- **Auth**: Required
- **Description**: Toggles saved bookmark status for player library.

### `GET /api/v1/community/bookmarks`
- **Auth**: Required
- **Description**: Returns all posts saved by the authenticated player.

### `GET /api/v1/community/posts/{post_id}/comments`
- **Auth**: Optional
- **Description**: Returns top-level comments with threaded 1-level `replies`. Excludes blocked players.

### `POST /api/v1/community/posts/{post_id}/comments`
- **Auth**: Required
- **Payload**:
```json
{
  "content": "Great theory on weapon wheels!",
  "parent_comment_id": null
}
```

---

## 4. Polls & Voting

### `POST /api/v1/community/polls/{poll_id}/vote`
- **Auth**: Required
- **Payload**: `{ "option_id": "uuid" }`
- **Description**: Casts vote. If `allow_vote_change` is enabled, shifts vote from old option to new option. Calculates real-time option percentages.

---

## 5. Player Profiles, Follows & Moderation

### `GET /api/v1/community/player/{username}`
- **Auth**: Optional
- **Description**: Public player community profile with post counts, follower counts, and interaction status.

### `POST /api/v1/community/player/{player_id}/follow`
- **Auth**: Required
- **Description**: Toggles follow relationship. Sends `COMMUNITY` notification to followed player.

### `POST /api/v1/community/player/{player_id}/block`
- **Auth**: Required
- **Description**: Blocks player bidirectionally, immediately severing all follow connections and hiding content.

### `POST /api/v1/community/player/{player_id}/mute`
- **Auth**: Required
- **Description**: Silently mutes player content from current user feed.

### `POST /api/v1/community/reports`
- **Auth**: Required
- **Payload**:
```json
{
  "target_type": "POST",
  "target_id": "post-uuid",
  "reason": "SPAM",
  "description": "User posting fraudulent pre-order keys."
}
```
