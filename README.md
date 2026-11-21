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
| **1. Home** | `/` | Immersive GTA 6 hero, real-time news ticker, featured deals, community pulse, upcoming countdowns, and unified global search. |
| **2. Gaming Community** | `/community` | Player discussions, media sharing, verified polls, interest groups, follower networks, bookmarks, and strict moderation tools. |
| **3. News & Updates** | `/news` | Official Rockstar announcements, verified press reports, source attribution, categorization, and historical records. |
| **4. PC Compatibility** | `/pc-checker` | Hardware bottleneck detection, specification analysis, upgrade planning, and transparent unconfirmed requirement notices. |
| **5. Problem Solver** | `/support` | RAG-assisted AI diagnostic assistant, structured error database, curated step-by-step troubleshooting, and safe system advice. |
| **6. Price & Deals** | `/deals` | Multi-country price comparison (INR, USD, EUR, GBP, AED), edition breakdown, price drop alerts, and retailer verification. |

### Supporting Global Features
- **Player Account & Dashboard (`/dashboard`)**: Profile customisation, saved hardware reports, bookmarks, wishlist, and notification control center.
- **Global Search (`/search` or `Cmd+K`)**: Multi-entity instant search indexing news, community posts, deals, events, and troubleshooting articles.
- **Events Calendar**: Countdown timers, timezone-normalized release dates, trailer drops, and game milestones.
- **Notification Center**: Real-time WebSocket and in-app alerts for price drops, replies, and breaking announcements.

---

## 3. Technology Stack Summary

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query v5, Recharts, Lucide Icons.
- **Backend**: Python 3.14 / 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), Alembic.
- **Database & Auth**: PostgreSQL 16+ with `pgvector`, Supabase Auth & Storage, Row-Level Security (RLS).
- **Asynchronous Processing**: Redis 7, Celery & Celery Beat background workers.
- **AI Engine**: Google Gemini API via official `google-genai` SDK with RAG pipeline.
- **Deployment**: Vercel (Frontend), Docker / Railway / Render (Backend & Workers), Supabase (Managed DB).

---

## 4. Current Status: Phase 0 (Planning & Architecture)

- **Phase State**: `COMPLETED (Awaiting User Approval to start Phase 1)`
- **Project Structure**: Clean modular scaffold created.
- **Audit**: Completed on local development environment (Node v24.21.0, Python 3.14.7, Docker Desktop active).
- **Documentation**: Comprehensive master documentation authored and validated.

---

## 5. Quick Start (Development Setup)

Refer to [docs/ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for full instructions.

### Prerequisites
- Node.js >= 20.x (Current: v24.21.0)
- Python >= 3.11 (Current: v3.14.7)
- Docker Desktop (Running PostgreSQL 16 and Redis 7)
- Git

```bash
# Clone and enter the repository
cd project0.1

# Configure environment variables
cp .env.example .env

# Backend Virtual Environment
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt

# Frontend Setup
cd ../frontend
npm install
npm run dev
```

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

---

## 7. License & Disclaimers

GTA 6 Player Hub is an independent community and intelligence platform. Grand Theft Auto, GTA VI, Rockstar Games, and Take-Two Interactive are trademarks or registered trademarks of Take-Two Interactive Software, Inc. This project is not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive.
