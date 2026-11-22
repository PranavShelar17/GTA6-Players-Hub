# GTA 6 Player Hub – Community Security & Moderation (Phase 7)

## 1. Player Isolation & Ownership Rules

All mutation and deletion operations enforce strict player identity checks:
1. **Post Mutation**: A player can only edit or delete a post if `current_user.id == post.player_id`. Attempts by other players return `HTTP 403 Forbidden`.
2. **Comment Mutation**: Only the original comment author can edit or soft-delete a comment (`HTTP 403 Forbidden` on mismatch).
3. **Like & Bookmark Isolation**: Likes and bookmarks are stored per user UUID with composite unique keys. A player cannot duplicate likes or bookmarks.
4. **Soft Deletions**: Deleting a post or comment updates `post_status = 'DELETED'` and records `deleted_at = timezone.now()`. Active feeds exclude soft-deleted posts.

---

## 2. Moderation & Reporting

### Report Submission
Players can report suspicious, offensive, or fraudulent activity via `POST /api/v1/community/reports`.
- Target types: `POST`, `COMMENT`, `PLAYER`.
- Categorized reasons:
  - `SPAM`: Commercial promotion, bots, fake key distribution.
  - `HARASSMENT`: Targeted toxicity or bullying.
  - `HATE`: Discriminatory abuse or hate speech.
  - `INAPPROPRIATE`: Explicit or offensive media.
  - `IMPERSONATION`: Mimicking Rockstar Games staff or other creators.
  - `MISINFORMATION`: Deliberate fake launch dates or deceptive rumors.
  - `COPYRIGHT`: Intellectual property infringement.
  - `OTHER`: General terms of service violations.

---

## 3. Player Blocking & Muting

### Player Blocking
- Endpoint: `POST /api/v1/community/player/{player_id}/block`.
- **Bidirectional Feed Invisibility**: When User A blocks User B:
  - User A never sees posts or comments authored by User B.
  - User B cannot see posts or profile details of User A.
  - Any existing follow connection between User A and User B is immediately severed.
  - Attempts to follow a blocked player return `HTTP 400 Bad Request`.

### Player Muting
- Endpoint: `POST /api/v1/community/player/{player_id}/mute`.
- **Silent Invisibility**: Muting User B hides User B's content from User A's view without notifying User B or severing public social links.
