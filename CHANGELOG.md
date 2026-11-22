# Changelog

All notable changes to the **GTA 6 Player Hub** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.7.0] - 2026-11-22

### Phase 6: GTA 6 Events Calendar & Notification Centre (Completed)

#### Added
- **Database Architecture & Migrations (`backend/app/models/event.py`, `notification.py`)**:
  - Entity models for `EventCategory`, `EventSource`, `Event`, `SavedEvent`, `EventReminder`, `Notification`, `NotificationPreference`, `NotificationDelivery`, and `PushSubscription`.
  - Alembic migration `0004_phase_6_events_notifications` establishing relationships, composite indexes, and unique constraints.
  - Supabase PostgreSQL schema `backend/supabase_events_notifications_schema.sql` with Row Level Security (RLS) isolating player personal calendars and notification inboxes.
- **Backend Events & Notification Services (`backend/app/services/event_service.py`, `notification_service.py`, `event_collector.py`)**:
  - Truth tier verification engine enforcing 4 badges (`OFFICIAL`, `VERIFIED`, `COMMUNITY`, `UNCONFIRMED`).
  - DST-safe IANA timezone conversion logic with automatic UTC normalisation.
  - Granular notification dispatch pipeline supporting Quiet Hours schedules and player channel opt-outs.
  - Automated seeding of verified GTA 6 timeline milestones (Take-Two Earnings Calls, Trailer Reveals, Summer Game Fest, Pre-Order activations).
- **Backend REST API Endpoints (`backend/app/api/events.py`, `notifications.py`)**:
  - Events catalog (`GET /events`), categories (`GET /events/categories`), slug detail (`GET /events/{slug}`).
  - Authenticated player saved events (`GET/POST/DELETE /events/saved`, `/events/{id}/save`).
  - Authenticated event reminders lifecycle (`GET/POST/DELETE /events/reminders`, `/events/{id}/reminders`).
  - Notification inbox listing (`GET /notifications`) and unread count breakdown (`GET /notifications/unread-count`).
  - Mark single read (`PATCH /notifications/{id}/read`) and bulk mark all read (`POST /notifications/mark-all-read`).
  - Player notification preferences (`GET/PATCH /notifications/preferences`).
  - Web push subscription management (`POST /notifications/push/subscribe`, `DELETE /notifications/push/unsubscribe`).
- **Home Page & Dashboard Cross-Phase Integration**:
  - Home Page `/api/v1/home/events` connected to live database `Event` records with fallback.
  - Player Dashboard (`/dashboard`) integrated with personal Saved Events card and Notification Inbox card.
- **Frontend Modular Architecture (`frontend/src/components/events/`, `components/notifications/`)**:
  - Main events route at `/events` supporting interactive Month Grid View and Cards List View.
  - Dynamic event detail route at `/events/[slug]` with live 4-unit countdown ticker, dual local/UTC timezone display, and verified source links.
  - Notification Centre route at `/notifications` with category filters, unread badge, and quick actions.
  - Dedicated notification settings route at `/settings/notifications`.
  - Navbar (`Header.tsx`) notification bell icon with live unread counter and animated ping badge.
- **Testing & Quality Assurance**:
  - 17 new backend tests across `backend/tests/test_events.py` and `backend/tests/test_notifications.py`.
  - 63/63 passing tests across the entire backend test suite (100% pass rate).
  - 23/23 clean Next.js production routes with 0 TypeScript/ESLint warnings.

---

## [0.6.0] - 2026-11-22

### Phase 5: GTA 6 Price & Deals Tracker Development (Completed)

#### Added
- **Database Architecture & Migrations (`backend/app/models/price.py`)**:
  - Entity models for `PriceProduct`, `PriceRegion`, `PriceStore`, `PriceObservation`, `PriceAlert`, `PriceAlertEvent`, `PriceWishlist`, and `PriceSource`.
  - Fixed-point monetary precision using `Numeric(10, 2)` for prices and `Numeric(5, 2)` for discounts.
  - Alembic migration `0003_phase_5_price` establishing foreign keys, composite indexes, and unique constraints.
  - Supabase Row-Level Security policy script `backend/supabase_prices_schema.sql` providing strict isolation for player wishlists and price alerts.
- **Price Ingestion & Validation Pipeline (`backend/app/services/price_service.py`, `price_collector.py`)**:
  - Rigorous mathematical discount validation: $\text{Discount} = \frac{\text{Original} - \text{Current}}{\text{Original}} \times 100$.
  - 72-hour freshness window with automatic `STALE` price detection.
  - Automated target price alert evaluation and event recording pipeline.
  - Verified baseline seed observations across PlayStation 5, Xbox Series X/S, and PC.
  - Transparent Level 4 status protection for unannounced PC pricing.
- **Backend Price REST API (`backend/app/api/prices.py`)**:
  - Reference endpoints for supported regions (`/regions`) and stores (`/stores`).
  - Catalog listing (`/products`) with lowest verified pricing per region.
  - Comprehensive store comparison (`/compare`) with best price indicator and tax disclosures.
  - Verified discount deals feed (`/deals`).
  - Chronological price observation tracking (`/products/{slug}/history`).
  - Authenticated player wishlist management (`/wishlist`, `/wishlist/{product_id}`).
  - Authenticated player target price alert lifecycle (`/alerts`, `/alerts/{alert_id}`).
  - System tracking statistics (`/stats`).
- **Home Page Integration (`backend/app/api/home.py`)**:
  - Connected `/api/v1/home/deals` to real `PriceObservation` database records with graceful fallback.
- **Modular Frontend Architecture (`frontend/src/components/prices/`)**:
  - Main tracker page at `/price-deals` with tabs for Catalog, Deals, Alerts, and Wishlist.
  - Dynamic product detail and history page at `/price-deals/[slug]`.
  - Interactive SVG Price History Chart with hover tooltip markers.
  - Comparison table with responsive mobile card fallback.
  - Wishlist toggle and target price alert modal dialog.
  - Player Dashboard (`/dashboard`) Price Alert Watchlist card integration.
- **Testing & Quality Assurance**:
  - 12 comprehensive unit and integration tests in `backend/tests/test_prices.py`.
  - 46/46 passing tests across the entire backend test suite.
  - 21/21 statically and dynamically compiled Next.js production routes.

---

## [0.5.0] - 2026-11-22

### Phase 4: GTA 6 News & Updates Development (Completed)

#### Added
- **Database Architecture & Migrations (`backend/app/models/news.py`)**:
  - Entity models for `NewsSource`, `NewsCategory`, `NewsArticle`, and `NewsBookmark`.
  - Alembic migration `0002_phase_4_news` establishing foreign keys, indexes, and unique constraints.
  - PostgreSQL Row Level Security script `backend/supabase_news_schema.sql` protecting player bookmarks and public reading.
- **Automated Collection & Ingestion Engine (`backend/app/services/news_collector.py`)**:
  - Implemented polite external collector with User-Agent identification and exponential failure backoff.
  - Canonical URL normalization preventing duplicate article insertion.
  - Curated, factually verified seed catalog populated across 8 approved categories and 6 reputable publishers.
- **Backend News REST API (`backend/app/api/news.py`)**:
  - `GET /api/v1/news`: Paginated article listing with keyword search (`q`), category filtering, source filtering, verification filtering, and sorting (`latest`, `oldest`, `featured`).
  - `GET /api/v1/news/featured`: Primary featured announcement retrieval.
  - `GET /api/v1/news/categories`: Active category taxonomy with article counts.
  - `GET /api/v1/news/sources`: Safe public directory of enabled sources.
  - `GET /api/v1/news/stats`: Aggregate verification reporting statistics.
  - `GET /api/v1/news/{slug}`: Article detail payload with content and related articles.
  - `GET /api/v1/news/{slug}/related`: Related articles query.
  - `GET /api/v1/news/bookmarks`: Authenticated player's personal saved articles.
  - `POST /api/v1/news/{article_id}/bookmark`: Save article to bookmarks.
  - `DELETE /api/v1/news/{article_id}/bookmark`: Remove article from bookmarks.
  - `POST /api/v1/news/collect`: Trigger synchronization across approved sources.
- **Frontend Modular News Suite (`frontend/src/components/news/`)**:
  - `NewsVerificationBadge.tsx`: 4-tier badge with contextual tooltip explanations (`OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`).
  - `NewsBookmarkButton.tsx`: Interactive bookmark button with auth verification and visual saved state.
  - `NewsCard.tsx`: Consistent card layout with image previews, metadata, and bookmarking.
  - `FeaturedNews.tsx`: Editorial hero card for primary announcements.
  - `NewsCategoryFilter.tsx`: Scrollable category tabs with article counts.
  - `NewsSearch.tsx`: Search input with 300ms debouncing and clear action.
  - `NewsSort.tsx`: Sort dropdown.
  - `NewsPagination.tsx`: Accessible page controls.
  - `NewsSourceInfo.tsx`: Source citation box with direct source links and independent fan-site disclosure.
  - `RelatedNews.tsx`: 3 related article recommendations on detail pages.
  - `NewsEmptyState.tsx`: Accessible fallback when filters return 0 articles.
  - `NewsLoadingSkeleton.tsx`: Grid and detail view loading skeletons.
  - `NewsPageClient.tsx` & `NewsDetailPageClient.tsx`: Client orchestrators.
- **SEO & Structured Data**:
  - Added Schema.org `CollectionPage` JSON-LD to `/news` and `NewsArticle` JSON-LD to `/news/[slug]`.
  - Configured dynamic OpenGraph and Twitter card metadata for every article.
- **Home Page & Dashboard Integration**:
  - Connected Home Page news feed in `backend/app/api/home.py` to query real database articles.
  - Integrated "Saved Bulletins" in `/dashboard` to display bookmarked articles.
- **Testing & Quality Assurance**:
  - Added 15 new automated tests in `backend/tests/test_news.py` (total 34 backend tests, 100% pass rate).
  - Validated Next.js production build (`21/21 routes generated`, 0 errors).

---

## [0.4.0] - 2026-11-21

### Phase 3: Professional Home Page Development (Completed)

#### Added
- **Backend Home Page API Architecture (`backend/app/api/home.py`)**:
  - `GET /api/v1/home`: Aggregated feed returning news, deals, events, community discussions, and transparent demonstration disclaimers. Supports query parameters for `country_code`, `currency`, and `platform`.
  - Sub-endpoints: `GET /api/v1/home/news`, `GET /api/v1/home/deals`, `GET /api/v1/home/events`, `GET /api/v1/home/community`.
  - Pydantic models in `backend/app/schemas/home.py`: `HomeNewsItem`, `HomeDealItem`, `HomeEventItem`, `HomeCommunityHighlight`, `HomeAggregatedResponse`.
  - 6 new automated backend pytest tests in `backend/tests/test_home.py` covering aggregation, query localization, and sub-endpoints.
- **Frontend Modular Home Page Component Suite (`frontend/src/components/home/`)**:
  - `HeroSection.tsx`: Cinematic Vice City dark theme hero with platform pills (Fall 2025, PS5 & XSX/S, PC pending, 100% verified labels) and direct CTAs.
  - `PersonalizedDashboardWidget.tsx`: Dynamic greeting for authenticated players with avatar, display name, platform badge, and quick access buttons to Dashboard, Profile, Wishlist, Notifications, and Settings.
  - `PlatformPillarsSection.tsx`: Structured grid connecting all six core public sections without modifying navigation scope.
  - `LatestNewsSection.tsx`: Editorial feed with 4-tier verification badges (`OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`), source attribution, publication dates, and sample content disclosure.
  - `FeaturedDealsSection.tsx`: Retail edition pricing cards with multi-currency formatting (INR, USD, EUR, GBP), preorder badges, verified retailers, and demonstration disclaimers.
  - `UpcomingEventsSection.tsx`: Milestone cards with dynamic live countdown timer (Days, Hours, Minutes, Seconds) and official broadcast badges.
  - `CommunityHighlightsSection.tsx`: Trending player discussions with platform tags, likes, and reply counts.
  - `PCCompatibilitySection.tsx`: Hardware diagnostic teaser with clear notice that official PC specifications remain unannounced.
  - `ProblemSolverSection.tsx`: AI troubleshooter showcase featuring common categories (Crashes, Low FPS, Drivers, Controllers).
  - `HomeSearch.tsx`: Command palette modal with keyboard shortcuts (`Ctrl+K` to open, `Esc` to close, arrow keys / clicks to navigate) and live query indexing.
  - `HomePageSkeleton.tsx` & `HomePageEmptyState.tsx`: Accessible loading skeletons and resilient fallback states.
- **Frontend Data Client & Resilient Fallback (`frontend/src/lib/homeApi.ts`)**:
  - TypeScript interfaces for all home entities.
  - `fetchHomeFeed()` function with query parameter support and resilient offline fallback feed (`FALLBACK_HOME_DATA`).
- **SEO & Metadata Enhancements**:
  - Server-side metadata in `frontend/src/app/page.tsx` with OpenGraph and Twitter cards.
  - Structured JSON-LD schema (`WebSite` and `Organization`) embedded into root homepage.
- **Header Integration**:
  - Linked universal header search button to trigger global `HomeSearch` modal.

---

## [0.3.0] - 2026-11-21

### Phase 2: Database Architecture & Complete Player Authentication (Completed)

#### Added
- **Database Architecture (SQLAlchemy 2.0 + Alembic + Supabase RLS)**:
  - Created SQLAlchemy async entity models for `PlayerProfile`, `PlayerPreferences`, and `PlayerActivity`.
  - Configured platform-agnostic `GUID` type decorator supporting native PostgreSQL UUIDs and SQLite for test environments.
  - Initialized Alembic async migration suite and generated revision `0001_phase_2`.
  - Authored `backend/supabase_schema_rls.sql` with PostgreSQL Row Level Security (RLS) policies for all player tables and the `avatars` storage bucket.
  - Implemented automatic profile provisioning database trigger `handle_new_player()` on `auth.users` insert.
- **FastAPI Player Identity & Profile Endpoints (`/api/v1/users`)**:
  - `GET /api/v1/users/me`: Current player account, profile, preferences, and recent security logs.
  - `POST /api/v1/users/sync`: Initializer endpoint for new authenticated sessions.
  - `GET /api/v1/users/me/profile` & `PUT /api/v1/users/me/profile`: Player profile retrieval and updates.
  - `GET /api/v1/users/me/preferences` & `PUT /api/v1/users/me/preferences`: Regional, platform, and notification preference controls.
  - `POST /api/v1/users/me/avatar`: Multi-part avatar upload with MIME validation (JPEG, PNG, WEBP, GIF) and 2MB limit.
  - `DELETE /api/v1/users/me/avatar`: Avatar reset endpoint.
  - `GET /api/v1/users/me/activity`: Audit log retrieval.
  - `GET /api/v1/users/check-username`: Live username availability and format validation.
  - `DELETE /api/v1/users/me`: Secure account deletion workflow.
- **Authentication & Security Engine**:
  - Server-side Supabase JWT verification dependency using `HS256` signature verification, `exp` check, and UUID extraction.
  - Anti-enumeration protection on login and password reset routes.
  - Case-insensitive username uniqueness enforcement (`lower(username)`).
- **Frontend Authentication Architecture (Next.js 15 + Supabase SSR)**:
  - Configured browser, server, and middleware Supabase clients (`@supabase/ssr`).
  - Built `AuthProvider` managing global session state, tokens, profile caching, and automatic fallback mode for local testing.
  - Next.js middleware session refresh and route guard.
  - Built interactive registration page (`/register`) with live password checklist and username verification.
  - Built player sign in page (`/login`) with loading states and remember session support.
  - Built password recovery page (`/forgot-password`) with safe anti-enumeration feedback.
  - Built password reset page (`/reset-password`) with password strength checks.
  - Built email verification notice page (`/auth/verify-email`) with resend cooldown.
  - Built Next.js callback route handler (`/auth/callback`) for token code exchange.
- **Player Experience Screens**:
  - **Player Profile (`/profile`)**: Hero card with avatar preview, gamer badge, stats, and inline edit mode with bio character counter (0/500), country, platform, and visibility toggles.
  - **Player Dashboard (`/dashboard`)**: Welcome banner, profile completion indicator (0-100%), account security badge, and clean empty state widgets for saved PC reports, wishlist, saved bulletins, and recent security logs.
  - **Account Settings (`/settings`)**: Multi-tab management for Preferences (Currency, Country, Platform, Edition, Language), Notifications, Security (Change Password, Sign Out), and Danger Zone (Account Deletion with `DELETE` confirmation).
  - Universal Header upgraded with dynamic player avatar / dropdown menu when authenticated, retaining Log In / Register when unauthenticated.
- **Automated Testing Suite**:
  - Added 10 new backend pytest tests in `backend/tests/test_users.py` (total 13/13 passing in < 1s).
  - Validated frontend Next.js production build (`21/21 static & dynamic routes generated`, 0 errors).

---

## [0.2.0] - 2026-11-21

### Phase 1: Project Foundation & Website Design (Completed)
- Scaffolded Next.js 15 App Router frontend and FastAPI backend.
- Built 6 core page layouts and 8 supporting route shells.
- Established Vice City dark theme design system.
- Passing pytest suite and Next.js production build.

---

## [0.1.0] - 2026-11-21

### Phase 0: Project Planning & Architecture (Completed)
- Master architectural blueprints, schema specifications, and project scope definition.
