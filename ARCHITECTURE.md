# GTA 6 Player Hub – System Architecture Specification

## 1. High-Level System Architecture

The GTA 6 Player Hub follows a **Decoupled Modular Monolith** topology designed for elastic scalability, robust fault tolerance, and clear boundary isolation.

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Edge Layer (Vercel)"]
        UserBrowser["Player Browser / Mobile"]
        NextJS["Next.js 15 Application Server"]
        NextCache["Next.js Data Cache / ISR"]
    end

    subgraph APILayer["Backend & API Services (FastAPI / ASGI)"]
        FastAPI["FastAPI REST API Gateway (/api/v1)"]
        AuthMiddleware["JWT & RLS Auth Validator"]
        RateLimiter["Redis-Backed Token Bucket Limiter"]
        SubRouters["Core API Sub-Routers:
        - /news
        - /deals & /prices
        - /community
        - /pc-checker
        - /support (AI)
        - /events & /notifications"]
    end

    subgraph WorkerLayer["Asynchronous Worker Services (Celery)"]
        CeleryWorker["Celery Background Worker"]
        CeleryBeat["Celery Beat Periodic Scheduler"]
        NewsCollector["Automated News Harvester"]
        PriceTracker["Authorized Price Poller"]
        AlertDispatcher["Email & In-App Notification Sender"]
    end

    subgraph DataLayer["Persistence & Infrastructure Layer"]
        Postgres[(PostgreSQL 16 DB with pgvector)]
        RedisCache[(Redis 7 Cache & Broker)]
        SupabaseStorage[(Supabase Object Storage - S3)]
    end

    subgraph ExternalServices["External APIs & Services"]
        GeminiAI["Google Gemini 2.5 API"]
        StoreAPIs["Verified Retailer APIs (PSN, Xbox, etc.)"]
        RockstarRSS["Official Rockstar Feeds"]
    end

    %% Connections
    UserBrowser <-->|HTTPS / HTTP2| NextJS
    NextJS <-->|Async REST API / JSON| FastAPI
    NextJS --- NextCache

    FastAPI --> AuthMiddleware
    AuthMiddleware --> RateLimiter
    RateLimiter --> SubRouters

    SubRouters <-->|AsyncPG / SQLAlchemy| Postgres
    SubRouters <-->|Aiocache / Commands| RedisCache

    CeleryBeat -->|Push Periodic Tasks| RedisCache
    RedisCache -->|Fetch Tasks| CeleryWorker

    CeleryWorker --> NewsCollector
    CeleryWorker --> PriceTracker
    CeleryWorker --> AlertDispatcher

    NewsCollector --> RockstarRSS
    PriceTracker --> StoreAPIs
    AlertDispatcher --> Postgres

    SubRouters -->|Semantic Search & Chat| GeminiAI
    GeminiAI <-->|Vector Context| Postgres
    SubRouters <-->|Uploads / Avatars| SupabaseStorage
```

---

## 2. Component Boundaries & Responsibilities

### 2.1 Frontend Boundary (Next.js 15)
- **Role**: User interface presentation, client state management, responsive rendering, form validation, and server-side cache revalidation.
- **Rendering Modes**:
  - **Incremental Static Regeneration (ISR)**: Used for `/news` articles and `/deals` catalog to deliver sub-100ms response times globally.
  - **Server-Side Rendering (SSR)**: Used for `/dashboard` and `/community` feeds where authentication state dictates personalized views.
  - **Client-Side Rendering (CSR)**: Used for interactive tools such as the PC Compatibility Calculator (`/pc-checker`) and the AI Diagnostic Terminal (`/support`).

### 2.2 Backend Boundary (FastAPI)
- **Role**: Single source of truth for business logic, data persistence, permission verification, and third-party integrations.
- **Security Envelope**: Every request to protected endpoints passes through the `AuthMiddleware` which decodes and validates Supabase JWT signatures and checks user status in PostgreSQL.
- **Uniform Response Protocol**: All responses follow a standardized JSON envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "meta": {
      "timestamp": "2026-11-21T12:00:00Z",
      "version": "1.0.0"
    }
  }
  ```

### 2.3 Data Persistence Boundary (PostgreSQL + pgvector)
- **Role**: Relational consistency, transactional safety, and vector embedding similarity queries.
- **Relational Segregation**: Discrete schemas or table namespaces for `auth_profiles`, `news`, `pricing`, `community`, `hardware`, `support`, and `notifications`.
- **Vector Search Engine**: Embedded troubleshooting documentation is stored as 768-dimensional float arrays using `pgvector` with HNSW indexing for rapid cosine similarity retrieval.

### 2.4 Background Worker Boundary (Celery + Redis)
- **Role**: Long-running, periodic, or non-blocking workloads isolated from the web request-response cycle.
- **Queues**:
  - `priority_high`: Instant price drop notifications and security email delivery.
  - `data_sync`: Scheduled price scraping from verified feeds (every 30 minutes).
  - `news_harvester`: Official Rockstar RSS feed polling (every 15 minutes).

---

## 3. Core Data Flow Diagrams

### 3.1 AI Gaming Problem Solver (RAG Pipeline)

```mermaid
sequenceDiagram
    autonumber
    actor Player as Player
    participant UI as Support Chat UI (/support)
    participant API as FastAPI (/api/v1/support/chat)
    participant PG as PostgreSQL (pgvector Knowledge Base)
    participant Gemini as Google Gemini AI Engine

    Player->>UI: Enters problem (e.g., "Error ERR_GFX_D3D_INIT on launch")
    UI->>API: POST /api/v1/support/chat { message, conversation_id }
    API->>API: Sanitize input & detect error codes
    API->>Gemini: Generate text embedding for user query
    Gemini-->>API: Returns 768-dim query vector
    API->>PG: Query top 3 matching articles using cosine distance (<=>)
    PG-->>API: Returns verified troubleshooting articles & driver steps
    API->>Gemini: Prompt with System Prompt + Retrieved Articles + User Message
    Note over Gemini: Enforces safety guardrails:<br/>No unsafe BIOS hacks,<br/>explains uncertainty
    Gemini-->>API: Synthesizes structured step-by-step guidance
    API->>PG: Save message & conversation state
    API-->>UI: Return validated response with source references
    UI-->>Player: Renders formatted step-by-step resolution checklist
```

---

### 3.2 Price Tracking & Price-Drop Notification Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant Beat as Celery Beat (Cron)
    participant Worker as Celery Worker
    participant Store as Authorized Store API (PSN/Xbox)
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant Hub as Notification Dispatcher

    Beat->>Worker: Trigger 'sync_game_prices' task (30m interval)
    Worker->>Store: Fetch current prices for PS5 & Xbox Series X
    Store-->>Worker: Return price, edition & currency data
    Worker->>DB: Record new price snapshot in 'price_history'
    Worker->>DB: Update 'current_price' & calculate discount %
    Worker->>DB: Query 'wishlist_items' where target_price >= current_price
    DB-->>Worker: Returns affected user list
    loop For each matching player
        Worker->>Hub: Dispatch PriceDropNotification (in-app & email)
        Hub->>DB: Insert row into 'notifications'
        Hub->>Redis: Publish WebSocket push event
    end
    Worker->>Redis: Invalidate cached deals endpoint
```

---

## 4. Resilience, Caching & Failover Strategies

1. **Stale-While-Revalidate (SWR)**: High-traffic endpoints (`/news`, `/deals`) return cached Redis data while an asynchronous task refreshes the cache in the background.
2. **Circuit Breakers**: External integrations (currency exchange rates, official RSS feeds) are wrapped in circuit breakers with automatic fallback to last-known good states.
3. **Database Connection Pooling**: SQLAlchemy AsyncEngine utilizes a tuned pool of 20 connections with 10 max overflow to maintain low memory overhead under sudden traffic surges.
