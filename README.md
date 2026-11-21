# GTA 6 Player Hub

> **Enterprise-Grade Gaming Information, Community, Technical Diagnostics, and Price Intelligence Platform for Grand Theft Auto VI.**

---

## 1. Project Overview

**GTA 6 Player Hub** is a specialized, production-ready full-stack web platform built for Grand Theft Auto VI enthusiasts worldwide. The platform delivers verified news, global price and deal intelligence, hardware compatibility diagnostics, an AI-powered gaming problem solver, an events calendar, and a rich player community.

Designed with a micro-modular monolith architecture, the project adheres strictly to modern web standards, resilient API contracts, database normalization, and robust cybersecurity practices.

---

## 2. Core Navigation Architecture (Exactly 6 Pages)

| Page | Route | Description |
| :--- | :--- | :--- |
| **1. Home** | `/` | Immersive GTA 6 hero, real-time news ticker, featured deals, community pulse, upcoming countdowns, and quick access hubs. |
| **2. Gaming Community** | `/community` | Player discussions, media sharing, verified polls, interest groups, follower networks, bookmarks, and strict moderation tools. |
| **3. News & Updates** | `/news` | Official Rockstar announcements, verified press reports, source attribution, categorization, and historical records. |
| **4. PC Compatibility** | `/pc-compatibility` | Hardware bottleneck detection, specification analysis, upgrade planning, and transparent unconfirmed requirement notices. |
| **5. Problem Solver** | `/problem-solver` | RAG-assisted AI diagnostic assistant, structured error database, curated step-by-step troubleshooting, and safe system advice. |
| **6. Price & Deals** | `/price-deals` | Multi-country price comparison (INR, USD, EUR, GBP, AED), edition breakdown, price drop alerts, and retailer verification. |

### Supporting Global Routes
- **Player Account & Dashboard (`/dashboard`)**: Profile customisation, saved hardware reports, bookmarks, wishlist, and notification control center.
- **Authentication**: Sign In (`/login`), Registration (`/register`), and Password Recovery (`/forgot-password`).
- **User Hubs**: Profile (`/profile`), Settings (`/settings`), Notifications (`/notifications`), and Wishlist (`/wishlist`).

---

## 3. Technology Stack Summary

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, TanStack Query.
- **Backend**: Python 3.14 / 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), Alembic.
- **Database & Auth**: PostgreSQL 16+ with `pgvector`, Supabase Auth & Storage, Row-Level Security (RLS).
- **Asynchronous Processing**: Redis 7, Celery & Celery Beat background workers.
- **AI Engine**: Google Gemini API via official `google-genai` SDK with RAG pipeline.
- **Deployment**: Vercel (Frontend), Docker / Railway / Render (Backend & Workers), Supabase (Managed DB).

---

## 4. Current Status: Phase 1 Completed (Awaiting Phase 2 Approval)

- **Phase 0 (Planning & Master Architecture)**: `COMPLETED & APPROVED`
- **Phase 1 (Project Foundation & Website Design)**: `COMPLETED (Awaiting Approval)`
  - Next.js 15 App Router frontend fully configured with Vice City / dark gaming theme.
  - FastAPI backend configured with CORS, structured logging, and health/readiness probes.
  - All 6 core page layouts and 8 supporting route shells fully rendered and typechecked.
  - Reusable UI component library created (Buttons, Cards, Badges, Inputs, Skeletons, Empty & Error states).
  - Frontend-to-backend live connection hook and status pill integrated.
  - 100% test pass rate (pytest backend suite + Next.js production build with 18 static pages).

---

## 5. Quick Start (Development Setup)

Refer to [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed instructions.

### Prerequisites
- Node.js >= 20.x (Current: `v24.21.0`)
- Python >= 3.11 (Current: `3.14.7`)
- Git

### One-Click Development Startup Scripts (PowerShell)

```powershell
# 1. Run all backend and frontend quality checks
.\scripts\test-all.ps1

# 2. Start the FastAPI backend server (Port 8000)
.\scripts\start-backend.ps1

# 3. In a separate terminal, start the Next.js frontend (Port 3000)
.\scripts\start-frontend.ps1
```

Once started:
- Frontend: `http://localhost:3000`
- Backend API Docs (Swagger): `http://localhost:8000/api/v1/docs`
- Backend Health Probe: `http://localhost:8000/api/v1/health`

---

## 6. Project Documentation Index

- [PROJECT_SCOPE.md](PROJECT_SCOPE.md) – Functional boundaries, explicit exclusions, and user journeys.
- [ARCHITECTURE.md](ARCHITECTURE.md) – System topology, component boundaries, and sequence flows.
- [TECH_STACK.md](TECH_STACK.md) – Deep dive into architectural selections and dependency choices.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) – Relational entity schemas, indexes, and pgvector specifications.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) – RESTful API endpoints, request/response models, and error envelopes.
- [DEVELOPMENT_PHASES.md](DEVELOPMENT_PHASES.md) – Phase 0 through Phase 13 roadmap and delivery criteria.
- [SECURITY.md](SECURITY.md) – Threat models, RBAC, input sanitization, and data privacy safeguards.
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) – Step-by-step local workstation configuration.
- [TESTING.md](TESTING.md) – Testing strategy, coverage standards, and CI test pipelines.
- [DEPLOYMENT.md](DEPLOYMENT.md) – Infrastructure topology, Vercel/Railway configurations, and monitoring.
- [CHANGELOG.md](CHANGELOG.md) – Project versioning and chronological release milestones.
- [Phase 0 Report](docs/reports/PHASE_0_COMPLETION_REPORT.md) – Initial audit findings and sign-off report.
- [Phase 1 Report](docs/reports/PHASE_1_COMPLETION_REPORT.md) – Foundation & design system completion report.

---

## 7. License & Disclaimers

GTA 6 Player Hub is an independent community and intelligence platform. Grand Theft Auto, GTA VI, Rockstar Games, and Take-Two Interactive are trademarks or registered trademarks of Take-Two Interactive Software, Inc. This project is not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive.
