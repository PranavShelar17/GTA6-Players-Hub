# AUTOMATION DEPLOYMENT GUIDE: GTA 6 PLAYER HUB
**Production Infrastructure, Environment Configuration, and Runbook**
**Version**: 1.0.0 (Phase 10)  

---

## 1. Environment Configuration

Ensure the following variables are configured in production environments (e.g. Railway, Render, AWS ECS, or Kubernetes Secrets):

```bash
# Redis Message Broker & Results Backend
REDIS_URL=rediss://default:password@prod-redis.internal:6379/0
CELERY_BROKER_URL=rediss://default:password@prod-redis.internal:6379/1
CELERY_RESULT_BACKEND=rediss://default:password@prod-redis.internal:6379/2

# Automation API Key (used for health monitoring & cron hooks)
AUTOMATION_API_KEY=your_secure_64_character_hex_automation_key

# Configurable Periodic Schedules
NEWS_COLLECTION_INTERVAL_MINUTES=30
PRICE_REFRESH_INTERVAL_MINUTES=120
EVENT_REFRESH_INTERVAL_HOURS=6
EVENT_REMINDER_INTERVAL_MINUTES=1
NOTIFICATION_RETRY_INTERVAL_MINUTES=5
SOURCE_HEALTH_CHECK_INTERVAL_HOURS=24
DATA_FRESHNESS_CHECK_INTERVAL_HOURS=24

# Outbound Email Service (SMTP)
EMAIL_ENABLED=True
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_production_key
SMTP_FROM_EMAIL=notifications@gta6playerhub.com
SMTP_FROM_NAME="GTA 6 Player Hub"

# Web Push Service (VAPID RFC 8292)
PUSH_ENABLED=True
VAPID_PUBLIC_KEY=your_production_vapid_public_key
VAPID_PRIVATE_KEY=your_production_vapid_private_key
VAPID_SUBJECT=mailto:security@gta6playerhub.com
```

---

## 2. Database Migrations

Apply Alembic migrations to upgrade the PostgreSQL schema to Phase 10:

```bash
cd backend
alembic upgrade head
```

Verify that the following tables exist in PostgreSQL:
- `automation_job_logs`
- `data_source_status`
- `data_ingestion_logs`
- `notification_deliveries` (with `provider_reference`, `retry_count`, and `attempted_at`)

### Supabase Row Level Security (RLS)
Execute `backend/supabase_automation_schema.sql` in the Supabase SQL Editor to enforce RLS policies restricting job logs to authenticated admins and service role callers.

---

## 3. Service Startup Sequence

To ensure zero-downtime startup and prevent worker connection errors, initiate services in the following order:

```
1. Redis Server (Broker)
   └── Verify port 6379 responds to PING
2. PostgreSQL (Database)
   └── Run `alembic upgrade head`
3. Celery Workers
   └── Start worker fleet across all 6 queues
4. Celery Beat Scheduler
   └── Start periodic task dispatcher
5. FastAPI Backend
   └── Start Uvicorn ASGI cluster
6. Next.js Frontend
   └── Start SSR production server
```

---

## 4. Kubernetes Deployment Manifest (Example)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gta6-celery-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gta6-celery-worker
  template:
    metadata:
      labels:
        app: gta6-celery-worker
    spec:
      containers:
      - name: worker
        image: gta6playerhub/backend:latest
        command: ["celery", "-A", "app.workers.celery_app.celery_app", "worker", "--loglevel=INFO", "-c", "4", "-Q", "news_queue,price_queue,event_queue,notification_queue,ai_queue,maintenance_queue"]
        envFrom:
        - secretRef:
            name: gta6-env-secrets
        resources:
          limits:
            cpu: "1000m"
            memory: "1024Mi"
          requests:
            cpu: "250m"
            memory: "512Mi"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gta6-celery-beat
spec:
  replicas: 1 # Celery Beat MUST be a singleton to avoid duplicate task scheduling
  selector:
    matchLabels:
      app: gta6-celery-beat
  template:
    metadata:
      labels:
        app: gta6-celery-beat
    spec:
      containers:
      - name: beat
        image: gta6playerhub/backend:latest
        command: ["celery", "-A", "app.workers.celery_app.celery_app", "beat", "--loglevel=INFO"]
        envFrom:
        - secretRef:
            name: gta6-env-secrets
        resources:
          limits:
            cpu: "250m"
            memory: "256Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
```

---

## 5. Operational Health Checks

Configure your monitoring platform (Datadog, Prometheus, Uptime Kuma) to probe:

```http
GET https://api.gta6playerhub.com/api/v1/automation/health
Headers:
  X-Automation-Key: <your_key>
```

Expected 200 OK Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "redis_connected": true,
    "celery_broker_responsive": true,
    "scheduler_active": true,
    "healthy_sources_count": 12,
    "degraded_sources_count": 0,
    "timestamp": "2026-11-23T10:45:00Z"
  }
}
```
