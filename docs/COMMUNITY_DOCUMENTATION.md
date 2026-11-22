# GTA 6 Player Hub – Gaming Community Documentation (Phase 7)

## 1. System Overview

The **Gaming Community** (`/community`) is one of the six primary pillars of the GTA 6 Player Hub platform. It provides a community discussion feed, user-generated media galleries, interactive player polls, threaded comment conversations, follower networks, bookmarks, and comprehensive trust & safety moderation.

### Key Capabilities
- **Multi-Feed Discovery**: Real-time browsing across `Latest`, `Popular` (weighted by likes and comment activity), and `Following` (posts exclusively from followed players).
- **10 Curated GTA 6 Topics**: Structured categorization across general discussion, gameplay mechanics, lore/characters, vehicle tuning, heists/activities, battlestations/setups, guides, community help, screenshots/fanart, and official polls.
- **Rich Media & Poll Composer**: Up to 4 high-resolution images (JPEG, PNG, WebP) with client and server size validation (<=10MB), plus interactive polls with 2 to 10 options and configurable vote changing.
- **Atomic Interactions**: Optimistic liking, 1-level threaded replies, and saved bookmark collections.
- **Player Community Profiles**: Public community cards (`/community/player/[username]`) with avatar, verification badge, preferred platform, follower counts, and author posts.
- **Trust & Safety Moderation**: In-app reporting (posts, comments, players), bidirectional player blocking (with auto-unfollow), and silent content muting.

---

## 2. Architecture & Tech Stack

```
[ Next.js 15 Client ]
   │
   ├── /community               (Feed, Categories, Search, Trending Sidebar)
   ├── /community/create        (Composer, Media Upload, Poll Creator)
   ├── /community/post/[id]     (Post Details, Media Grid, Poll, Threaded Comments)
   ├── /community/player/[user] (Public Profile, Follow/Block/Mute, Post Feed)
   └── /community/bookmarks     (Saved Discussions Library)
   │
[ REST API Client (communityApi.ts) ]
   │
   ▼
[ FastAPI Backend (/api/v1/community/*) ]
   ├── Authentication & User Identity (Bearer JWT, CurrentUser)
   ├── Service Layer (community_service.py, media_service.py)
   ├── Cross-Phase Dispatcher (notification_service.py -> COMMUNITY notifications)
   └── SQLAlchemy Async Engine (PostgreSQL / SQLite test isolation)
```

---

## 3. Approved Discussion Categories

1. **General Discussion** (`general-discussion`): General talk, hype, and release window theories.
2. **Gameplay Discussion** (`gameplay-discussion`): Gunplay, physics engine, stealth, and duo-protagonist tactics.
3. **Story & Characters** (`story-characters`): Lucia, Jason, Vice City lore, and campaign speculation.
4. **Vehicles & Customisation** (`vehicles-customisation`): Supercars, boats, planes, modifications, and garages.
5. **Missions & Activities** (`missions-activities`): Heists, side-jobs, nightlife, and open-world events.
6. **Gaming Setup** (`gaming-setup`): Console setups, monitors, audio systems, and PC battle stations.
7. **Tips & Guides** (`tips-guides`): Console HDR calibration, performance settings, and beginner walkthroughs.
8. **Questions & Help** (`questions-help`): Player inquiries on editions, platforms, and compatibility.
9. **Screenshots & Fan Content** (`screenshots-fan-content`): Trailer frame analysis, wallpapers, and creative fan art.
10. **Community Polls** (`community-polls`): Official and community voting on expectations and platform choices.
