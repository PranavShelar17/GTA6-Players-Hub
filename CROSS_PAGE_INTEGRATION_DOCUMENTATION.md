# CROSS-PAGE INTEGRATION DOCUMENTATION
## GTA 6 Player Hub – Platform-Wide Unified Integration

### 1. Integration Scope

Phase 11 connects all individual modules built during Phases 1–10 into a cohesive experience:
- **Global Search:** Accessible from any page via the Header command palette or `/search`.
- **Unified Saved Content:** Consolidates news bookmarks, price wishlists, calendar events, and discussion bookmarks into `/saved`.
- **Cross-Module Navigation:** Account Dashboard (`/dashboard`) surfaces bookmarks, notifications, price alerts, hardware specs, and AI solver entrypoints in one screen.
- **Consistent Badging:** Standardized verification statuses (`OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`) and content badges throughout search, saved items, and detail pages.

---

### 2. Cross-Page Interaction Diagram

```mermaid
graph TD
    H[Global Header] -->|Ctrl+K| SO[Search Overlay]
    H -->|Direct Link| S_PAGE[/search Results Page]
    H -->|User Dropdown| SAVED[/saved Unified Hub]
    H -->|User Dropdown| DASH[/dashboard Account Central]
    H -->|User Dropdown| SETT[/settings Preferences]

    SO -->|Select Article| N_DETAIL[/news/slug]
    SO -->|Select Edition| P_DETAIL[/price-deals/slug]
    SO -->|Select Event| E_DETAIL[/events/slug]
    SO -->|Select Post| C_DETAIL[/community/post/id]
    SO -->|Select Guide| PS[/problem-solver]

    SAVED -->|Manage & Remove| N_DETAIL
    SAVED -->|Manage & Remove| P_DETAIL
    SAVED -->|Manage & Remove| E_DETAIL
    SAVED -->|Manage & Remove| C_DETAIL

    DASH -->|Summary Widget| SAVED
    DASH -->|Diagnosis History| PS
    DASH -->|Hardware Specs| PC[/pc-compatibility]
    DASH -->|Price Alerts| P_DETAIL
```

---

### 3. Unified Saved Content Architecture (`/saved`)

The `/saved` route presents all player-bookmarked entities without duplicating table storage:

| Entity Type | Source Table | Model Class | Destination Route | Action Available |
| :--- | :--- | :--- | :--- | :--- |
| **News** | `news_bookmarks` | `NewsBookmark` | `/news/[slug]` | View, Remove bookmark |
| **Deals** | `price_wishlist` | `PriceWishlist` | `/price-deals/[slug]` | View, Remove from wishlist |
| **Events** | `saved_events` | `SavedEvent` | `/events/[slug]` | View, Remove saved event |
| **Community** | `community_bookmarks` | `CommunityBookmark` | `/community/post/[postId]` | View, Remove discussion |

#### Endpoints
- `GET /api/v1/users/me/saved?type=ALL&page=1&page_size=20`
- `DELETE /api/v1/users/me/saved/{saved_type}/{item_id}`

Both endpoints enforce strict player authentication and verify row ownership before deletion.

---

### 4. Player Dashboard Integration (`/dashboard`)

The Player Central Dashboard ([frontend/src/app/dashboard/page.tsx](file:///c:/Users/Admin/Downloads/GTA6-Players-Hub-main/GTA6-Players-Hub-main/frontend/src/app/dashboard/page.tsx)) features:
1. **Welcome Banner Actions:** Direct buttons to `Unified Saved`, `Search Hub`, `Profile`, and `Preferences`.
2. **Unified Saved Library Widget:** Aggregated count badge across all 4 bookmark types with 1-click navigation to `/saved`.
3. **Cross-Module Quick Links:** One-click shortcuts to PC Hardware Profiles and AI Problem Solver.
4. **Active Watchlist:** Monitored game editions and current store pricing.
5. **Saved Events Calendar:** Upcoming trailer releases and investor call countdowns.
