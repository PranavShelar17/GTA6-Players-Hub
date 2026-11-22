# GTA 6 Player Hub – Community Database Documentation (Phase 7)

## 1. Relational Entity Overview

The gaming community database schema is designed with high data integrity, strict referential actions (`ON DELETE CASCADE` for child interactions, `ON DELETE RESTRICT` for categories), and optimized composite indices.

### Entity Relationship Model

```
       auth.users / player_profiles
             │
             ├──< community_posts >───────< community_categories
             │        │
             │        ├──< community_post_media
             │        ├──< community_likes
             │        ├──< community_comments (self-referential parent_comment_id)
             │        ├──< community_bookmarks
             │        └─── community_polls (1:1 with post)
             │                 │
             │                 ├──< community_poll_options
             │                 └──< community_poll_votes
             │
             ├──< community_follows (follower_id, following_id)
             ├──< community_reports (reporter_id, target_type, target_id)
             ├──< community_blocks  (blocker_id, blocked_id)
             └──< community_mutes   (muter_id, muted_id)
```

---

## 2. Table Specifications

### 1. `community_categories`
- `id`: CHAR(36) / UUID (Primary Key)
- `name`: VARCHAR(64) UNIQUE NOT NULL
- `slug`: VARCHAR(64) UNIQUE NOT NULL (Index)
- `description`: TEXT
- `icon`: VARCHAR(64) DEFAULT 'message-square'
- `display_order`: INTEGER NOT NULL DEFAULT 0
- `is_active`: BOOLEAN NOT NULL DEFAULT true
- `created_at`: TIMESTAMPTZ

### 2. `community_posts`
- `id`: CHAR(36) / UUID (Primary Key)
- `player_id`: CHAR(36) / UUID NOT NULL (Index)
- `category_id`: CHAR(36) / UUID NOT NULL (FK `community_categories.id`)
- `title`: VARCHAR(255) NOT NULL
- `content`: TEXT NOT NULL
- `post_status`: VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED' (Index: `PUBLISHED`, `DRAFT`, `HIDDEN`, `DELETED`)
- `is_pinned`: BOOLEAN NOT NULL DEFAULT false
- `likes_count`: INTEGER NOT NULL DEFAULT 0
- `comments_count`: INTEGER NOT NULL DEFAULT 0
- `views_count`: INTEGER NOT NULL DEFAULT 0
- `created_at`: TIMESTAMPTZ NOT NULL (Index)
- `updated_at`: TIMESTAMPTZ NOT NULL
- `deleted_at`: TIMESTAMPTZ NULL
- **Indices**:
  - `idx_community_posts_status_created` (`post_status`, `created_at DESC`)
  - `idx_community_posts_player_status` (`player_id`, `post_status`)

### 3. `community_post_media`
- `id`: CHAR(36) / UUID (Primary Key)
- `post_id`: CHAR(36) / UUID NOT NULL (FK `community_posts.id` ON DELETE CASCADE)
- `media_url`: VARCHAR(1024) NOT NULL
- `media_type`: VARCHAR(32) NOT NULL DEFAULT 'IMAGE'
- `file_size`: INTEGER NULL
- `display_order`: INTEGER NOT NULL DEFAULT 0
- `created_at`: TIMESTAMPTZ NOT NULL

### 4. `community_likes`
- `id`: CHAR(36) / UUID (Primary Key)
- `player_id`: CHAR(36) / UUID NOT NULL (Index)
- `post_id`: CHAR(36) / UUID NOT NULL (FK `community_posts.id` ON DELETE CASCADE)
- `created_at`: TIMESTAMPTZ NOT NULL
- **Constraint**: `UNIQUE(player_id, post_id)`

### 5. `community_comments`
- `id`: CHAR(36) / UUID (Primary Key)
- `player_id`: CHAR(36) / UUID NOT NULL (Index)
- `post_id`: CHAR(36) / UUID NOT NULL (FK `community_posts.id` ON DELETE CASCADE)
- `parent_comment_id`: CHAR(36) / UUID NULL (FK `community_comments.id` ON DELETE CASCADE)
- `content`: TEXT NOT NULL
- `comment_status`: VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED'
- `likes_count`: INTEGER NOT NULL DEFAULT 0
- `created_at`: TIMESTAMPTZ NOT NULL (Index)
- `updated_at`: TIMESTAMPTZ NOT NULL
- `deleted_at`: TIMESTAMPTZ NULL
- **Index**: `idx_community_comments_post_status` (`post_id`, `comment_status`, `created_at ASC`)

### 6. `community_bookmarks`
- `id`: CHAR(36) / UUID (Primary Key)
- `player_id`: CHAR(36) / UUID NOT NULL (Index)
- `post_id`: CHAR(36) / UUID NOT NULL (FK `community_posts.id` ON DELETE CASCADE)
- `created_at`: TIMESTAMPTZ NOT NULL
- **Constraint**: `UNIQUE(player_id, post_id)`

### 7. `community_follows`
- `id`: CHAR(36) / UUID (Primary Key)
- `follower_id`: CHAR(36) / UUID NOT NULL (Index)
- `following_id`: CHAR(36) / UUID NOT NULL (Index)
- `created_at`: TIMESTAMPTZ NOT NULL
- **Constraint**: `UNIQUE(follower_id, following_id)`

### 8. `community_polls`, `community_poll_options`, `community_poll_votes`
- Single vote uniqueness enforced by `UNIQUE(poll_id, player_id)`.
- Automatic option tallying and percentages calculated per poll.

### 9. `community_reports`, `community_blocks`, `community_mutes`
- In-app safety audit trail with target type enum and unique blocker/blocked pairs.
