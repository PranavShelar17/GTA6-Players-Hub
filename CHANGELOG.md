# Changelog

All notable changes to the **GTA 6 Player Hub** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.13.0] - 2026-11-23

### Phase 12: Complete Testing, Quality Assurance, Security Hardening & Performance Optimisation (Completed)

#### Added
- **Security Response Middleware (`backend/app/middleware/security.py`)**:
  - `SecurityHeadersMiddleware`: Injects OWASP-standard security response headers across all HTTP responses (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and production `Strict-Transport-Security`).
  - `RateLimitMiddleware`: In-memory sliding-window rate limiter (240 req/min per client IP) with reverse proxy `X-Forwarded-For` header support and RFC 6585 `429 Too Many Requests` envelope with `Retry-After: 60`.
- **Media Upload Binary Magic-Bytes Validation (`backend/app/services/media_service.py`)**:
  - `validate_image_magic_bytes`: Deep-packet inspection of binary streams validating magic bytes for JPEG (`\xff\xd8\xff`), PNG (`\x89PNG`), and WebP (`RIFF...WEBP`) to block disguised executable or script payloads.
- **Frontend Security Headers (`frontend/next.config.ts`)**:
  - Configured HTTP security headers for production Next.js delivery including Frame-Options, Content-Type-Options, Referrer-Policy, and Permissions-Policy.
- **Automated Security Hardening Test Suite (`backend/tests/test_security_hardening.py`)**:
  - 8 automated tests covering OWASP headers, rate limiting enforcement, SQL injection resistance, IDOR post modification protection, IDOR private AI conversation isolation, IDOR PC hardware profile isolation, XSS payload neutralization, and upload magic bytes validation.
- **CI/CD Quality & Security Pipeline (`.github/workflows/ci.yml`)**:
  - GitHub Actions workflow running backend pytest suites against test database/redis services, and frontend linting/production builds.
- **Phase 12 Comprehensive Documentation Suite**:
  - `PHASE_12_INITIAL_AUDIT.md`: Project architecture audit, feature completion status, and security assessment.
  - `PHASE_12_TESTING_STRATEGY.md`: Test dimensions, methodologies, and acceptance criteria.
  - `PHASE_12_FUNCTIONAL_TEST_REPORT.md`: Functional test results across all 6 core sections + user accounts and automation.
  - `PHASE_12_SECURITY_AUDIT.md`: OWASP Top 10 evaluation and security controls verification.
  - `PHASE_12_PERFORMANCE_REPORT.md`: Core Web Vitals assessment, 101 kB shared JS bundle analysis, sub-20ms API latency.
  - `PHASE_12_ACCESSIBILITY_REPORT.md`: WCAG 2.2 AA audit across responsive breakpoints and keyboard accessibility.
  - `PHASE_12_BUG_REGISTER.md`: Defect tracking log documenting 8 resolved issues.
  - `PHASE_12_REGRESSION_REPORT.md`: Regression report verifying all Phase 1–11 features with 112 passing tests.
  - `PHASE_12_DEPLOYMENT_READINESS.md`: Pre-flight checklist, environment variable audit, and runbooks.
  - `PHASE_12_COMPLETION_REPORT.md`: Final completion report adhering to Roadmap governance.

---

## [0.12.0] - 2026-11-23

### Phase 11: Global Search, Personalisation & Cross-Page Integration (Completed)

#### Added
- **Global Search Engine & Database Indexing (`backend/app/models/search.py`, `services/search_service.py`)**:
  - Relational `search_index` table with compound indices for content lookup, category classification, and publication timeline sorting.
  - Multi-category search service supporting multi-token full-text queries across News (`NEWS`), Deals (`DEALS`), Events (`EVENTS`), Discussions (`COMMUNITY`), and Troubleshooting Guides (`HELP`).
  - Privacy safeguards strictly excluding private user data (saved PC hardware profiles, private AI problem solver sessions) and respecting community blocks/mutes.
  - Verification label preservation (`OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`).
  - Autocomplete typeahead suggestion engine with direct entity matching and popular queries fallback.
  - Private user search history model (`user_search_history`) with user-isolated recording, listing, and clearing.
  - Celery background task `rebuild_search_index_task` scheduled hourly via Celery Beat on `maintenance_queue`.
- **Alembic Database Migration & Supabase SQL (`backend/alembic/versions/0009_phase_11_global_search_personalisation.py`, `supabase_search_schema.sql`)**:
  - Chained migration creating `search_index` and `user_search_history` tables.
  - Extended `player_preferences` table with `preferred_categories`, `theme`, and `content_density`.
  - Supabase PostgreSQL schema with RLS policies granting public read for `search_index` and strict user-scoped CRUD for `user_search_history`.
- **Unified Saved Content Service (`backend/app/services/saved_content_service.py`)**:
  - Zero-storage-duplication aggregation across existing tables: `news_bookmarks`, `price_wishlist`, `saved_events`, and `community_bookmarks`.
  - Pagination, tab filtering by type, and dynamic count calculation.
  - Item removal service (`remove_saved_item`) verifying player ownership before record deletion.
- **REST API Endpoints (`backend/app/api/search.py`, `users.py`)**:
  - Global search (`GET /api/v1/search?q=&category=&sort=&page=&page_size=`).
  - Search autocomplete suggestions (`GET /api/v1/search/suggestions?q=&limit=`).
  - Category statistics (`GET /api/v1/search/categories`).
  - User search history (`GET /api/v1/search/recent`, `POST /api/v1/search/recent`, `DELETE /api/v1/search/recent`).
  - Protected search index re-indexing (`POST /api/v1/search/reindex`).
  - Unified saved content (`GET /api/v1/users/me/saved?type=&page=&page_size=`).
  - Saved item removal (`DELETE /api/v1/users/me/saved/{saved_type}/{item_id}`).
- **Next.js Command Palette & Global Search UI (`frontend/src/components/search/SearchOverlay.tsx`, `SearchResultsClient.tsx`, `app/search/page.tsx`)**:
  - Command palette modal triggered via `Ctrl+K`, `Cmd+K`, `/`, and header search icon with full keyboard navigation (Up/Down/Enter/Escape).
  - Dedicated search results page (`/search`) with dynamic category filter pills, multi-attribute sorting dropdown, category-styled result cards, and pagination.
- **Unified Saved Content Experience (`frontend/src/components/saved/SavedContentClient.tsx`, `app/saved/page.tsx`)**:
  - Dedicated player route at `/saved` with tabs for All Saved, News Bookmarks, Price Wishlist, Saved Events, and Discussions.
  - Direct item navigation and optimistic removal with instant feedback.
- **Personalisation & Platform Integration (`frontend/src/app/settings/page.tsx`, `app/dashboard/page.tsx`, `components/layout/Header.tsx`)**:
  - Settings page extended with feed topic preferences (multi-checkbox), display theme selector (dark/light/system), and content density selector (comfortable/compact).
  - Header updated with Quick Search trigger, and user dropdown link to Saved Content.
  - Dashboard updated with top quick-access links, Unified Saved Library summary widget, and shortcuts to PC hardware specs and AI Problem Solver.

---

## [0.11.0] - 2026-11-23

### Phase 10: Automated Data & Background Services Development (Completed)

#### Added
- **Central Distributed Architecture & Task Queues (`backend/app/workers/celery_app.py`, `schedules.py`)**:
  - Celery 5.7+ application configured with Redis broker and result backend.
  - 6 dedicated queues: `news_queue`, `price_queue`, `event_queue`, `notification_queue`, `ai_queue`, and `maintenance_queue`.
  - Configurable periodic Celery Beat schedules for 30m news collection, 2h price refreshes, 6h event calendar syncs, 1m reminder processing, 1m outbound notifications, 5m retries, and daily maintenance.
  - Automatic task execution audit logging in PostgreSQL (`automation_job_logs`).
- **Database Architecture & Migrations (`backend/app/models/automation.py`, `notification.py`)**:
  - Entity models for `AutomationJobLog`, `DataSourceStatus`, and `DataIngestionLog`.
  - Extended `NotificationDelivery` with `provider_reference`, `retry_count`, and `attempted_at`.
  - Alembic migration `0008_phase_10_automation_background_services.py` chained to `0007_phase_9_ai_problem_solver`.
  - Supabase PostgreSQL schema `backend/supabase_automation_schema.sql` with RLS policies restricting job logs to authenticated admins and service role callers.
- **Data Validation & Quality Engine (`backend/app/services/data_validation_service.py`)**:
  - URL canonicalization, tracking parameter stripping (`utm_*`, `ref`, `fbclid`), and schema enforcement.
  - Strict decimal pricing validation, genuine discount calculations, and ISO 4217 currency cross-validation against regional markets.
  - Multi-format timezone normalization converting ISO 8601 and RFC 2822 timestamps to UTC while preserving publisher timezones.
- **Automated News Ingestion Pipeline (`backend/app/services/news_ingestion_service.py`, `integrations/news_sources.py`)**:
  - Automated ingestion from official Rockstar Newswire RSS, Take-Two IR, PlayStation Blog, and Xbox Wire.
  - Strict verification label enforcement (`OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`).
  - Automatic duplicate suppression by canonical URL and title hashing.
- **Automated Price Refresh & Price Drop Engine (`backend/app/services/price_refresh_service.py`, `integrations/price_sources.py`)**:
  - Periodic polling across 5 regional markets (IND, USA, GBR, EUR, ARE) and authorized digital storefronts (PS Store, Xbox Marketplace, Steam, Epic Games, Rockstar Store).
  - Price drop detection comparing against prior observations.
  - Real-time matching against player target price alerts (`PriceAlert`), recording `PriceAlertEvent`, and dispatching in-app alerts.
  - Stale price auditing flagging records older than 24 hours.
- **Event Calendar & Reminder Pipeline (`backend/app/services/event_refresh_service.py`, `integrations/event_sources.py`)**:
  - Official broadcast, earnings call, and industry showcase synchronization.
  - Proactive reminder processing evaluating player lead times (15m, 1h, 24h) with single-dispatch guarantees.
- **Multi-Channel Notification Dispatch (`backend/app/services/notification_delivery_service.py`, `integrations/email_provider.py`, `push_provider.py`)**:
  - In-app notification creation with instant persistence.
  - Outbound email delivery supporting Vice City neon HTML templates and plain text fallbacks with user preference adherence.
  - Browser Web Push notification delivery using W3C Push API and VAPID RFC 8292.
  - Resilient retry system with exponential backoff and maximum retry thresholds.
- **AI Problem Solver Background Maintenance (`backend/app/services/ai_background_service.py`)**:
  - Scheduled RAG troubleshooting knowledge base documentation maintenance and indexing.
  - Daily conversation volume calculation, feedback helpfulness ratio scoring, and report aggregation.
- **Protected REST API Endpoints (`backend/app/api/automation.py`)**:
  - System health status (`GET /api/v1/automation/health`).
  - Worker node & queue inspection (`GET /api/v1/automation/workers`).
  - Scheduled beat task inspection (`GET /api/v1/automation/scheduler`).
  - External source health auditing (`GET /api/v1/automation/sources`).
  - Ingestion batch history (`GET /api/v1/automation/history/ingestion`).
  - Task execution logs & traces (`GET /api/v1/automation/history/tasks`).
  - Delivery statistics (`GET /api/v1/automation/deliveries`).
  - Manual task triggers (`POST /api/v1/automation/trigger/{job_type}`).
- **Testing & Verification**:
  - 13 comprehensive automated unit and integration tests in `backend/tests/test_automation.py`.
  - 97 of 97 passing tests across the entire backend suite (100% pass rate).
  - Next.js production build verified clean (25 routes compiled with 0 errors).
- **Comprehensive Documentation**:
  - `PHASE_10_COMPLETION_REPORT.md`
  - `AUTOMATION_ARCHITECTURE.md`
  - `BACKGROUND_WORKER_SETUP.md`
  - `CELERY_CONFIGURATION.md`
  - `AUTOMATED_DATA_SOURCE_DOCUMENTATION.md`
  - `NOTIFICATION_AUTOMATION_DOCUMENTATION.md`
  - `AUTOMATION_DEPLOYMENT_GUIDE.md`
  - `AUTOMATION_TEST_REPORT.md`

---

## [0.10.0] - 2026-11-22

### Phase 9: AI Gaming Problem Solver Development (Completed)

#### Added
- **Database Architecture & Migrations (`backend/app/models/problem_solver.py`)**:
  - Entity models for `AIConversation`, `AIMessage`, `AIResponseFeedback`, `AIKnowledgeSource`, and `AIKnowledgeDocument`.
  - Alembic migration `0007_phase_9_ai_problem_solver.py` establishing foreign keys, composite indexes, and cascade deletions.
  - Supabase PostgreSQL schema `backend/supabase_problem_solver_schema.sql` with Row Level Security (RLS) policies for user data ownership and public read on knowledge bases.
- **Provider-Independent AI Architecture (`backend/app/services/ai_provider.py`, `ai_service.py`, `ai_knowledge_service.py`)**:
  - Abstract AI Provider factory supporting Google Gemini (`gemini`), OpenAI (`openai`), and deterministic mock diagnostic engine (`mock`).
  - Mandatory 5-part diagnostic standard: Problem Understanding, Possible Causes, Recommended Steps (safe and reversible), Expected Result, and Next Step.
  - Strict anti-fabrication guardrails forbidding invented GTA 6 error codes, release dates, or unannounced system requirements.
  - Integration with Phase 8 saved PC Hardware Profiles for contextualized hardware troubleshooting.
  - RAG knowledge base seeding with 5 verified technical playbooks (Rockstar Games Support, DirectX 12 launch crashes, DDU clean driver uninstallation, Controller Steam Input, TCP/IP network reset).
  - Screenshot upload pipeline supporting PNG, JPG, JPEG, WebP attachments up to 10MB under `/uploads/ai_attachments/`.
- **Backend REST API Endpoints (`backend/app/api/problem_solver.py`)**:
  - Operational status (`GET /api/v1/ai/status`).
  - Suggested categories (`GET /api/v1/ai/categories`).
  - Conversation sessions (`POST/GET /api/v1/ai/conversations`, `GET/PATCH/DELETE /api/v1/ai/conversations/{id}`).
  - Message exchange (`POST /api/v1/ai/conversations/{id}/messages`).
  - Error screenshot uploads (`POST /api/v1/ai/attachments`).
  - Response feedback & reports (`POST /api/v1/ai/feedback`).
- **Frontend Modular Architecture (`frontend/src/components/problem-solver/`)**:
  - Main route at `/problem-solver` featuring `ProblemSolverHeader`, `AIServiceStatusBadge`, `SuggestedProblemCategories`, `ConversationSidebar`, `ChatMessageItem`, `ChatInputArea`, `HardwareContextConsentModal`, and `FeedbackModal`.
  - 8 selectable problem categories with quick prompts for instant troubleshooting.
  - Interactive sidebar grouping sessions by Today, Previous 7 Days, and Older with inline search, rename, and delete.
  - Screenshot thumbnail previews with full-screen zoom preview.
  - Hardware context consent modal explaining non-sensitive spec sharing.
  - Player feedback and reporting modal.
- **Testing & Quality Assurance**:
  - 7 comprehensive unit/integration tests in `backend/tests/test_problem_solver.py`.
  - 84/84 passing tests across the entire backend suite (100% pass rate).
  - 27/27 Next.js production routes compiled cleanly with 0 TypeScript/ESLint errors.

---

## [0.9.0] - 2026-11-22

### Phase 8: PC Compatibility Checker Development (Completed)

#### Added
- **Database Architecture & Migrations (`backend/app/models/pc_compatibility.py`)**:
  - Entity models for `PCHardwareProfile`, `GameSystemRequirement`, and `PCCompatibilityCheck`.
  - Alembic migration `0006_phase_8_pc_compatibility.py` establishing relationships, composite indexes, and ownership isolation.
  - Supabase PostgreSQL schema `backend/supabase_pc_compatibility_schema.sql` with Row Level Security (RLS) policies isolating user profiles and check history.
- **Backend Services & Anti-Fabrication Logic (`backend/app/services/pc_compatibility_service.py`, `pc_requirements_collector.py`)**:
  - Truth verification engine guaranteeing no speculative pass/fail scores, fake FPS predictions, or arbitrary bottleneck percentages when official requirements are pending.
  - Official requirements confirmation status endpoint returning required publisher notice and Rockstar Games Newswire source attribution.
  - Hardware balance analyzer detecting mechanical hard drive latency, sub-16GB RAM paging risks, low VRAM caps, and 32-bit OS limitations.
  - Profile management service with ownership isolation and automatic primary profile management.
- **Backend REST API Endpoints (`backend/app/api/pc_compatibility.py`)**:
  - Official requirements status (`GET /api/v1/pc/requirements/status`).
  - Stored requirements listing (`GET /api/v1/pc/requirements`).
  - Hardware profiles CRUD (`GET/POST /api/v1/pc/profiles`, `GET/PUT/DELETE /api/v1/pc/profiles/{id}`).
  - Compatibility and balance check execution (`POST /api/v1/pc/compatibility/check`) supporting both logged-in players and anonymous visitors.
  - Check history audit log (`GET /api/v1/pc/compatibility/history`, `GET /api/v1/pc/compatibility/history/{id}`).
- **Frontend Modular Architecture (`frontend/src/components/pc-compatibility/`)**:
  - Dedicated route at `/pc-compatibility` featuring `RequirementsStatusCard`, `HardwareInputForm`, `HardwareSummaryCard`, `CompatibilityResultSection`, `HardwareBottleneckAnalysis`, `UpgradeGuidanceSection`, `SavedPCProfilesModal`, and `CompatibilityHistoryModal`.
  - Preset hardware templates (Enthusiast 4K, Mainstream 1440p, Budget 1080p, Legacy PC) for instant 1-click loading.
  - Universal hardware upgrade checklist covering CPU sockets, chipset tiers, BIOS updates, RAM generation incompatibility, PSU wattage, GPU clearance, and thermal airflow.
  - Player Dashboard (`/dashboard`) integrated with active hardware profiles and direct launch action.
- **Testing & Quality Assurance**:
  - 5 comprehensive backend unit and integration tests in `backend/tests/test_pc_compatibility.py`.
  - 77/77 passing tests across the entire backend suite (100% pass rate).
  - 27/27 Next.js production routes compiled cleanly with 0 TypeScript/ESLint errors.

---

## [0.8.0] - 2026-11-22

### Phase 7: GTA 6 Gaming Community Development (Completed)

#### Added
- **Database Architecture & Migrations (`backend/app/models/community.py`)**:
  - Entity models for `CommunityCategory`, `CommunityPost`, `CommunityPostMedia`, `CommunityLike`, `CommunityComment`, `CommunityBookmark`, `CommunityFollow`, `CommunityPoll`, `CommunityPollOption`, `CommunityPollVote`, `CommunityReport`, `CommunityBlock`, and `CommunityMute`.
  - Alembic migration `0005_phase_7_community_system.py` with foreign keys, composite indexes, and unique constraints.
  - Supabase PostgreSQL schema `backend/supabase_community_schema.sql` with Row Level Security (RLS) policies for public reads and authenticated user mutations.
- **Backend Community Services (`backend/app/services/community_service.py`, `media_service.py`, `community_collector.py`)**:
  - Multi-feed query engine supporting `Latest`, `Popular` (weighted formula: $2 \times \text{likes} + \text{comments}$), and `Following`.
  - Automated seeding of 10 approved GTA 6 community categories and verified starter discussions and polls.
  - Media upload pipeline (`media_service.py`) supporting up to 4 images per post, MIME validation (JPEG, PNG, WebP), 10MB limits, and static serving under `/uploads/community/`.
  - Interactive poll engine with configurable vote modification (`allow_vote_change`) and real-time percentage computation.
  - Threaded comment architecture supporting 1-level reply hierarchy.
  - Cross-phase notifications: Dispatches `COMMUNITY` notifications to post and comment authors on likes, replies, and new followers.
  - Trust and safety moderation engine: In-app reporting, bidirectional player blocking (with auto-unfollow), and silent content muting.
- **Backend REST API Endpoints (`backend/app/api/community.py`)**:
  - Categories (`GET /community/categories`), posts feed (`GET /community/posts`), post creation (`POST /community/posts`), post detail (`GET /community/posts/{id}`), author updates (`PATCH /community/posts/{id}`), and soft deletion (`DELETE /community/posts/{id}`).
  - Media upload (`POST /community/media/upload`).
  - Like/unlike toggle (`POST/DELETE /community/posts/{id}/like`).
  - Comment and reply lifecycle (`GET/POST /community/posts/{id}/comments`, `PATCH/DELETE /community/comments/{id}`).
  - Saved bookmarks library (`GET/POST/DELETE /community/bookmarks`, `/community/posts/{id}/bookmark`).
  - Community polls voting (`POST /community/polls/{id}/vote`, `GET /community/polls/{id}/results`).
  - Public player community profiles (`GET /community/player/{username}`).
  - Social network follows (`POST/DELETE /community/player/{id}/follow`).
  - Moderation & safety (`POST /community/reports`, `POST/DELETE /community/player/{id}/block`, `POST/DELETE /community/player/{id}/mute`).
- **Frontend Modular Architecture (`frontend/src/components/community/`)**:
  - Main community route at `/community` with multi-tab feeds (`Latest`, `Popular`, `Following`), keyword search, category pills carousel, and community guidelines sidebar.
  - Post composer at `/community/create` with multi-image upload dropzone, rich textarea, and optional poll builder.
  - Single discussion route at `/community/post/[postId]` with media gallery, interactive poll voting, like/bookmark/share action bar, and threaded comments.
  - Public player profile route at `/community/player/[username]` with follower counters, follow/unfollow toggle, and moderation controls.
  - Player saved bookmarks route at `/community/bookmarks`.
  - Player Dashboard (`/dashboard`) integrated with Community Discussions & Library widget.
- **Testing & Quality Assurance**:
  - 9 new backend integration tests in `backend/tests/test_community.py`.
  - 72/72 passing tests across the entire backend suite (100% pass rate).
  - 25/25 Next.js production routes compiled cleanly with 0 TypeScript/ESLint errors.

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
