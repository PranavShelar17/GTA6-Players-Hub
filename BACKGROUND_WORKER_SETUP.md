# BACKGROUND WORKER SETUP GUIDE: GTA 6 PLAYER HUB
**Operations Manual for Celery Background Workers and Celery Beat**
**Version**: 1.0.0 (Phase 10)  

---

## 1. Prerequisites

Before starting background workers, verify that the following infrastructure components are active and accessible:

1. **Python 3.12+ / 3.14+**:
   ```powershell
   python --version
   ```
2. **Redis Server**:
   Ensure Redis is running locally or remotely on port 6379:
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 6379
   ```
3. **Database Schema**:
   Ensure all Alembic migrations through Phase 10 are applied:
   ```powershell
   cd backend
   alembic upgrade head
   ```

---

## 2. Local Development Startup

In local development, start the worker and scheduler in separate terminal windows:

### Terminal 1: Celery Worker
```powershell
cd backend
$env:PYTHONPATH = "."
celery -A app.workers.celery_app.celery_app worker --loglevel=info -P solo -Q news_queue,price_queue,event_queue,notification_queue,ai_queue,maintenance_queue
```
> [!NOTE]
> On Windows operating systems, `-P solo` or `-P threads` is required due to absence of POSIX `fork()` support. On Linux/macOS, the default prefork pool or `-P gevent` is recommended.

### Terminal 2: Celery Beat (Periodic Scheduler)
```powershell
cd backend
$env:PYTHONPATH = "."
celery -A app.workers.celery_app.celery_app beat --loglevel=info
```

### Combined Startup (Development Shortcut)
For rapid local testing, workers and scheduler can be spawned together:
```powershell
cd backend
$env:PYTHONPATH = "."
celery -A app.workers.celery_app.celery_app worker --beat --loglevel=info -P solo
```

---

## 3. Production Process Supervision

In staging and production environments, workers must run under an init daemon or process supervisor with auto-restart policies.

### 3.1 Systemd Configuration (Linux)

#### 1. Worker Service: `/etc/systemd/system/gta6-celery-worker.service`
```ini
[Unit]
Description=GTA 6 Player Hub Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=gta6app
Group=gta6app
EnvironmentFile=/opt/gta6playerhub/backend/.env
WorkingDirectory=/opt/gta6playerhub/backend
ExecStart=/opt/gta6playerhub/backend/venv/bin/celery multi start worker1 worker2 \
    -A app.workers.celery_app.celery_app \
    --pidfile=/var/run/celery/%n.pid \
    --logfile=/var/log/celery/%n%I.log \
    --loglevel=INFO \
    -c 4 \
    -Q news_queue,price_queue,event_queue,notification_queue,ai_queue,maintenance_queue
ExecStop=/opt/gta6playerhub/backend/venv/bin/celery multi stopwait worker1 worker2 \
    --pidfile=/var/run/celery/%n.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 2. Beat Service: `/etc/systemd/system/gta6-celery-beat.service`
```ini
[Unit]
Description=GTA 6 Player Hub Celery Beat Scheduler
After=network.target redis.service gta6-celery-worker.service

[Service]
Type=simple
User=gta6app
Group=gta6app
EnvironmentFile=/opt/gta6playerhub/backend/.env
WorkingDirectory=/opt/gta6playerhub/backend
ExecStart=/opt/gta6playerhub/backend/venv/bin/celery \
    -A app.workers.celery_app.celery_app beat \
    --pidfile=/var/run/celery/beat.pid \
    --logfile=/var/log/celery/beat.log \
    --loglevel=INFO
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 4. Docker Compose Setup

A complete containerized stack is defined below:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7.2-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    depends_on:
      - redis

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.workers.celery_app.celery_app worker --loglevel=INFO -c 4 -Q news_queue,price_queue,event_queue,notification_queue,ai_queue,maintenance_queue
    env_file: ./backend/.env
    depends_on:
      - redis
    restart: always

  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.workers.celery_app.celery_app beat --loglevel=INFO
    env_file: ./backend/.env
    depends_on:
      - redis
    restart: always

volumes:
  redis_data:
```

---

## 5. Worker Monitoring & Diagnostics

### 5.1 CLI Diagnostics
Check active worker nodes and queues:
```powershell
celery -A app.workers.celery_app.celery_app status
celery -A app.workers.celery_app.celery_app inspect active
celery -A app.workers.celery_app.celery_app inspect registered
```

### 5.2 API Health Endpoint
Query the live worker status through the protected REST endpoint:
```powershell
curl -X GET "http://127.0.0.1:8000/api/v1/automation/workers" -H "X-Automation-Key: your_key"
```
