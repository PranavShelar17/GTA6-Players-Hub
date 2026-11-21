# GTA 6 Player Hub – Technology Stack Specification

## 1. Architectural Philosophy

The technology choices for GTA 6 Player Hub are guided by four non-negotiable principles:
1. **Type Safety Across Boundaries**: Complete TypeScript on the frontend and Pydantic v2 models on the backend.
2. **High-Performance Async I/O**: Python FastAPI utilizing `async`/`await` with asynchronous PostgreSQL connections via `asyncpg`.
3. **Optimistic, Responsive UI**: React 19 Server and Client Components with TanStack Query caching for instant transitions.
4. **Resilient Background Automation**: Decoupled Redis and Celery worker queues to handle external price fetching, news aggregation, and email notifications without blocking HTTP requests.

---

## 2. Comprehensive Technology Matrix

### 2.1 Frontend Architecture

| Component | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 15.x / React 19 | Industry-standard React framework offering Server-Side Rendering (SSR), Static Site Generation (SSG) for news, and React Server Components (RSC) for maximum SEO and minimal client bundle size. |
| **Language** | TypeScript | 5.5+ | Eliminates runtime type errors, guarantees component contract consistency, and shares schemas with API definitions. |
| **Styling** | Tailwind CSS v4 | 4.x | Utility-first CSS ensuring rapid styling, zero dead code, and full dark-mode palette support suited for a neon/Vice City aesthetic. |
| **Component Kit** | shadcn/ui + Radix UI | Latest | Headless, accessible (WAI-ARIA compliant), customizable primitive components that keep code within the repository. |
| **Iconography** | Lucide React | Latest | Consistent, high-performance SVG icons covering gaming, platform, and interface needs. |
| **Server State** | TanStack Query v5 | 5.x | Automatic caching, background refetching, optimistic mutations, and window focus management for dynamic feeds. |
| **Client State** | Zustand | 5.x | Lightweight, zero-boilerplate client-side state for modal controls, user preferences, and shopping filters. |
| **Visualizations** | Recharts | 2.x | Declarative, SVG-based responsive charting for historical price trends and PC bottleneck visualizations. |
| **Animation** | Framer Motion | 12.x | GPU-accelerated micro-interactions, page transitions, and interactive hero banners. |

---

### 2.2 Backend Architecture

| Component | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Language** | Python | 3.14 / 3.12+ | Rich ecosystem for AI integrations, scientific calculations, asynchronous networking, and data processing. |
| **API Framework** | FastAPI | 0.115+ | High-performance asynchronous REST API framework with native OpenAPI schema generation and dependency injection. |
| **Data Validation** | Pydantic v2 | 2.10+ | Rust-backed blazing-fast data parsing, strict typing, and serialization. |
| **ORM / Query Engine**| SQLAlchemy 2.0 (Async) | 2.0+ | Modern async ORM supporting enterprise relational models, connection pooling, and complex joins. |
| **Database Migrations**| Alembic | 1.14+ | Reliable, reversible schema migration management committed directly to version control. |
| **HTTP Client** | HTTPX (Async) | 0.28+ | High-throughput asynchronous HTTP client for scraping authorized feeds and external currency APIs. |
| **Server Runtime** | Uvicorn + uvloop | Latest | Production-grade ASGI server achieving near-Node and Go performance on asynchronous tasks. |

---

### 2.3 Database, Auth & Storage

| Component | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Database Engine** | PostgreSQL | 16+ | ACID-compliant relational foundation with robust JSONB support and relational integrity. |
| **Vector Engine** | `pgvector` Extension | 0.7+ | Enables hybrid relational and semantic vector search inside PostgreSQL for AI troubleshooting retrieval without extra SaaS databases. |
| **Managed DB & Auth** | Supabase | Cloud / Local | Managed PostgreSQL instance, built-in GoTrue authentication (JWTs, social logins, email verification), and S3-compatible media storage for community uploads. |
| **Session Security** | JWT + Refresh Tokens | - | Stateless authorization with backend validation against revoked user tokens. |

---

### 2.4 Automation, Queues & Caching

| Component | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **In-Memory Broker** | Redis | 7.x | High-throughput cache for price records, session locks, rate-limiting counters, and task queuing. |
| **Task Queue** | Celery | 5.4+ | Distributed task execution for external price polling, automated news RSS feeds, and email delivery. |
| **Job Scheduler** | Celery Beat | 5.4+ | Precision cron-style periodic job scheduler triggering data synchronization workflows. |

---

### 2.5 Artificial Intelligence & Diagnostics

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **AI LLM Engine** | Google Gemini API (`gemini-2.5-flash`) | Industry-leading latency, 1M+ context window, rich structured outputs, and deep technical comprehension for error diagnostics. |
| **SDK** | `google-genai` Python SDK | Official, forward-compatible Google GenAI SDK. |
| **RAG Pipeline** | In-house Python RAG | Vectorized knowledge base of gaming errors, driver releases, and Rockstar support bulletins queried via `pgvector` cosine similarity. |
| **PC Scanner Spec** | C# / .NET 8 (Future Phase) | Dedicated lightweight native Windows scanner utilizing `System.Management` (WMI/DXGI) for zero-friction user telemetry when authorized. |

---

## 3. Environment Audit & Local Compatibility

An inspection of the local workstation confirmed:
- **Node.js**: `v24.21.0` (Supported, high compatibility with Next.js 15).
- **npm**: `11.19.0` (Package manager ready).
- **Python**: `3.14.7` (Modern Python runtime; virtual environment will isolate dependencies).
- **Docker Desktop**: Active and operational. Existing containers demonstrate local Docker daemon is healthy. Dedicated project ports will be assigned (`5435` for PostgreSQL and `6381` for Redis) to prevent collision with other applications on ports `5432-5434` and `6379-6380`.
- **Git**: `2.55.0.windows.5` (Active).
