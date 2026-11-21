# Changelog

All notable changes to the **GTA 6 Player Hub** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
