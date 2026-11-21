# GTA 6 Player Hub – Environment Setup Guide

## 1. System Requirements & Audit Summary

GTA 6 Player Hub is developed cross-platform with first-class support for Windows 10/11, Linux (Ubuntu 22.04+), and macOS.

### Validated Local Environment Components
- **Operating System**: Windows (Host)
- **Node.js**: `v22.18.0` / `v24.x` (Supported)
- **npm**: `10.9.3` / `11.x`
- **Python**: `3.13.0` / `3.14.x` (Isolated via `backend/venv`)
- **Docker Desktop**: Optional (Local PostgreSQL / Redis containers)
- **Git**: Active

---

## 2. Environment Variables Configuration

### 2.1 Backend (`backend/.env`)
Create `backend/.env` (or copy from `backend/.env.example`):

```bash
APP_NAME="GTA 6 Player Hub API"
APP_ENV="development"
APP_VERSION="1.0.0"
DEBUG=True
SECRET_KEY="development_secret_key_minimum_32_characters_long_for_security"
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Database (PostgreSQL + asyncpg)
DATABASE_URL="postgresql+asyncpg://postgres:postgrespassword@localhost:5435/gta6playerhub"
DATABASE_SYNC_URL="postgresql://postgres:postgrespassword@localhost:5435/gta6playerhub"

# Supabase Auth Integration
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret-min-32-chars-for-dev"
# NEVER expose service role key to frontend:
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 2.2 Frontend (`frontend/.env.local`)
Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME="GTA 6 Player Hub"
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 3. Database Setup & Migrations

### Option A: Direct Supabase Cloud Project (Recommended)
1. In your Supabase dashboard, navigate to the **SQL Editor**.
2. Open and execute `backend/supabase_schema_rls.sql`.
3. This creates all tables (`player_profiles`, `player_preferences`, `player_activities`), enables RLS, configures policies, sets up the auto-registration trigger, and initializes the `avatars` storage bucket.

### Option B: Local PostgreSQL & Alembic Migrations
```powershell
cd backend
.\venv\Scripts\Activate.ps1
alembic upgrade head
```

---

## 4. One-Click Running & Testing

```powershell
# Run the complete test suite (Backend Pytest + Frontend Typecheck & Build)
powershell -ExecutionPolicy Bypass -File .\scripts\test-all.ps1

# Start the FastAPI backend server (Port 8000)
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1

# Start the Next.js frontend development server (Port 3000)
powershell -ExecutionPolicy Bypass -File .\scripts\start-frontend.ps1
```
