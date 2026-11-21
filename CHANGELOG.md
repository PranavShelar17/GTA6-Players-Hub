# Changelog

All notable changes to the **GTA 6 Player Hub** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-11-21

### Phase 1: Project Foundation & Website Design (Completed)

#### Added
- **Frontend Core Architecture (Next.js 15 + React 19)**:
  - Initialized Next.js App Router with TypeScript, Tailwind CSS v4, and Lucide React.
  - Established shared **Vice City / Dark Gaming Theme** with deep charcoal backgrounds (`#090a0f`), warm white typography, and cinematic sunset accents (`#f97316`, `#f43f5e`).
  - Implemented universal responsive `Header` and `Footer` with live API connection indicator and active route detection.
  - Created reusable UI component primitives: `Button` (5 variants, 3 sizes), `Card`, `Badge` (4 truth tiers: official, verified, rumour, unconfirmed), `Input`, `Skeleton`, `EmptyState`, `ErrorState`, and `SectionHeader`.
- **The Six Core Navigation Page Layouts**:
  1. **Home (`/`)**: High-impact hero section, platform metric counters, platform pillar cards, latest news ticker, featured deals preview, upcoming milestone events, and community highlights.
  2. **Gaming Community (`/community`)**: Discussion feed layout, post cards with upvoting and comment counts, topic filters, community standards sidebar, and protected action sign-in prompts.
  3. **News & Updates (`/news`) & Detail (`/news/[slug]`)**: 4-tier verification labeling, featured announcement banner, searchable news grid, source citation links, and full article layout template.
  4. **PC Compatibility (`/pc-compatibility`)**: Hardware spec builder (CPU, GPU, RAM, VRAM, Storage, Resolution), bottleneck analysis preview, budget upgrade planning tiers, and mandatory prominent disclaimer stating official PC requirements are unconfirmed.
  5. **Problem Solver (`/problem-solver`)**: AI technical diagnostic interface layout, problem description input, category troubleshooting cards, suggested questions, and conversational window placeholder with safe advice protocols.
  6. **Price & Deals (`/price-deals`)**: Multi-region selector (India/INR, USA/USD, UK/GBP, EU/EUR, UAE/AED), platform filters (PS5, Xbox, PC), edition pricing cards, discount badges, and historical price SVG trendline.
- **Supporting Route Shells**:
  - `/login`, `/register`, `/forgot-password`, `/profile`, `/settings`, `/notifications`, `/wishlist`, `/dashboard`.
- **Backend Foundation (FastAPI + Pydantic v2)**:
  - FastAPI application structure (`backend/app/main.py`) with structured logging and CORS configuration for Next.js origins.
  - Universal JSON response envelope adhering to RFC 7807 problem details.
  - `GET /api/v1/health`: Liveness probe reporting service status, version, and UTC timestamp.
  - `GET /api/v1/health/ready`: Readiness probe verifying configuration and dependency readiness.
  - Pytest async test suite (`backend/tests/test_health.py`) passing with 100% success.
  - Production `Dockerfile`, `requirements.txt`, and `.env.example`.
- **Frontend-to-Backend Connectivity**:
  - Reusable API client (`frontend/src/lib/api.ts`) and polling hook (`frontend/src/hooks/useBackendHealth.ts`).
  - Live status indicator displaying real-time backend API connectivity.
- **Developer Automation**:
  - PowerShell utility scripts for starting frontend, starting backend, and executing the full end-to-end test suite (`scripts/`).

---

## [0.1.0] - 2026-11-21

### Phase 0: Project Planning & Architecture (Completed)

#### Added
- Project governance, master planning, and full 12-specialist documentation suite.
- Architecture blueprints, database ERD (24 tables with `pgvector`), and complete REST API catalog.
- Git repository initialization and commit baseline pushed to `origin/main`.
