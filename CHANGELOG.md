# Changelog

All notable changes to the **GTA 6 Player Hub** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
