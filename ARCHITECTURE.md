# GTA 6 Player Hub – System Architecture Specification

## 1. High-Level System Architecture

The GTA 6 Player Hub follows a **Decoupled Modular Monolith** topology designed for elastic scalability, robust fault tolerance, and clear boundary isolation.

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Edge Layer (Next.js 15 / Vercel)"]
        UserBrowser["Player Browser / Mobile"]
        NextAuth["Supabase Auth SSR & Cookie Session"]
        NextMiddleware["Next.js Middleware (Token Refresh & Route Guard)"]
        NextPages["App Router Pages (/register, /login, /profile, /dashboard, /settings)"]
    end

    subgraph APILayer["Backend & API Services (FastAPI / ASGI)"]
        FastAPI["FastAPI Gateway (/api/v1)"]
        JWTValidator["Supabase JWT & Bearer Auth Validator"]
        SubRouters["Core API Sub-Routers:
        - /users & /users/me
        - /news (Phase 4)
        - /deals & /prices (Phase 5)
        - /community (Phase 7)
        - /pc-compatibility (Phase 8)
        - /problem-solver (Phase 9)"]
    end

    subgraph DataLayer["Persistence & Infrastructure Layer (Supabase & PostgreSQL)"]
        Postgres[(PostgreSQL 16 DB with pgvector)]
        RLSEngine["Row Level Security (RLS) Engine"]
        StorageEngine[(Supabase Object Storage - 'avatars' Bucket)]
    end

    %% Connections
    UserBrowser <-->|HTTPS / TLS| NextMiddleware
    NextMiddleware --> NextPages
    NextPages <-->|Supabase Client SDK| NextAuth
    NextPages <-->|REST API + Bearer JWT| FastAPI
    
    FastAPI --> JWTValidator
    JWTValidator --> SubRouters
    SubRouters <-->|SQLAlchemy 2.0 Async / asyncpg| Postgres
    Postgres --- RLSEngine
    SubRouters <-->|Multipart Uploads| StorageEngine
```

---

## 2. Authentication & Data Flows

### 2.1 Player Registration & Email Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Player as Player
    participant UI as Next.js (/register)
    participant Supa as Supabase Auth (GoTrue)
    participant Mail as Transactional Email
    participant DB as PostgreSQL (RLS)

    Player->>UI: Fills registration form (email, password, username, display_name)
    UI->>UI: Client validation (password strength, username format)
    UI->>Supa: supabase.auth.signUp({ email, password, metadata: { username, display_name } })
    Supa->>DB: Insert auth.users record
    DB->>DB: Trigger handle_new_player() -> auto-provisions player_profiles & player_preferences
    Supa->>Mail: Dispatches verification email with secure token
    Supa-->>UI: Returns user object (confirmation pending)
    UI-->>Player: Displays "Check Your Inbox" verification screen
    Player->>Mail: Clicks verification link
    Mail->>UI: Navigates to /auth/callback?code=...
    UI->>Supa: supabase.auth.exchangeCodeForSession(code)
    Supa-->>UI: Establishes active JWT session in HTTP cookies
    UI-->>Player: Redirects to /dashboard
```

---

### 2.2 Secure Profile & Preferences Update Flow

```mermaid
sequenceDiagram
    autonumber
    actor Player as Player
    participant UI as Next.js (/profile or /settings)
    participant API as FastAPI (/api/v1/users/me/profile)
    participant DB as PostgreSQL (player_profiles)

    Player->>UI: Modifies display name, bio, platform or username
    UI->>API: PUT /api/v1/users/me/profile (Authorization: Bearer <jwt>)
    API->>API: Validates JWT signature & extracts sub (user_id)
    API->>DB: Check case-insensitive username collision: lower(username) = lower(new_username)
    alt Username collision
        DB-->>API: Conflict found
        API-->>UI: 409 Conflict: "Username already claimed"
        UI-->>Player: Displays error badge
    else Username available
        API->>DB: UPDATE player_profiles SET display_name, bio, ... WHERE user_id = sub
        API->>DB: INSERT INTO player_activities (user_id, activity_type="profile_updated")
        DB-->>API: Returns updated profile row
        API-->>UI: 200 OK with PlayerProfileRead
        UI-->>Player: Updates UI with success toast
    end
```

---

## 3. Resilience, Caching & Failover Strategies

1. **Dual Driver Database Layer**: Backend utilizes SQLAlchemy 2.0 with `asyncpg` for production PostgreSQL, and seamless in-memory `aiosqlite` during automated tests to guarantee 100% test independence.
2. **Graceful Auth Degradation**: If Supabase credentials are placeholder in development, the frontend falls back to a resilient local test session mode ensuring zero developer friction.
3. **Optimistic UI Updates**: Profile editing and avatar uploads immediately reflect on the client interface while background verification commits changes to the database.
