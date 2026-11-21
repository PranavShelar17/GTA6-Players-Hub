# GTA 6 Player Hub – Environment Setup Guide

## 1. System Requirements & Audit Summary

GTA 6 Player Hub is developed cross-platform with first-class support for Windows 10/11, Linux (Ubuntu 22.04+), and macOS.

### Validated Environment Components (Local Workstation Audit)
- **Operating System**: Windows (Host)
- **Node.js**: `v24.21.0` (Supported)
- **npm**: `11.19.0`
- **Python**: `3.14.7` (Supported; requires virtual environment)
- **Docker Desktop**: Active and operational
- **Git**: `2.55.0.windows.5`

> [!NOTE]
> Because existing Docker containers occupy local ports `5432`, `5433`, `5434` (PostgreSQL) and `6379`, `6380` (Redis), GTA 6 Player Hub reserves dedicated ports:
> - **PostgreSQL + pgvector**: Port `5435`
> - **Redis**: Port `6381`
> - **FastAPI Backend**: Port `8000`
> - **Next.js Frontend**: Port `3000`

---

## 2. Docker Services Setup (PostgreSQL + pgvector & Redis)

A project-level `docker-compose.yml` provides instant, isolated local services.

Create `docker-compose.yml` in the root:

```yaml
version: '3.8'

services:
  gta6-db:
    image: pgvector/pgvector:pg16
    container_name: gta6_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: gta6playerhub
    ports:
      - "5435:5432"
    volumes:
      - gta6_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d gta6playerhub"]
      interval: 5s
      timeout: 5s
      retries: 5

  gta6-redis:
    image: redis:7-alpine
    container_name: gta6_redis
    restart: always
    ports:
      - "6381:6379"
    volumes:
      - gta6_redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  gta6_pgdata:
  gta6_redisdata:
```

### Start Local Services
```powershell
docker compose up -d
```

---

## 3. Backend Setup (FastAPI & Python)

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Create isolated Python virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# 4. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Run database migrations (when models are ready)
alembic upgrade head

# 6. Start development server
uvicorn app.main:app --reload --port 8000
```

---

## 4. Frontend Setup (Next.js 15 & React 19)

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp ../.env.example .env.local

# 4. Start Next.js development server
npm run dev
```

---

## 5. Verification Checklist

To confirm your environment is fully operational:

1. **Frontend**: Open `http://localhost:3000` -> Verify GTA 6 landing page renders without console errors.
2. **Backend API**: Open `http://localhost:8000/docs` -> Verify Swagger UI lists all `/api/v1` endpoints.
3. **API Health Check**: Run `curl http://localhost:8000/api/v1/health` -> Verify `{ "status": "healthy", "database": "connected", "redis": "connected" }`.
4. **Database Vector Support**: Execute inside PostgreSQL container:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
