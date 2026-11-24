# CELERY CONFIGURATION SPECIFICATION: GTA 6 PLAYER HUB
**Distributed Task Queue Configuration and Scheduling Specification**
**Version**: 1.0.0 (Phase 10)  

---

## 1. Celery Application Configuration

The Celery application is instantiated in `app/workers/celery_app.py` with production-hardened defaults:

```python
celery_app = Celery(
    "gta6playerhub_workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.news_tasks",
        "app.tasks.price_tasks",
        "app.tasks.event_tasks",
        "app.tasks.notification_tasks",
        "app.tasks.ai_tasks",
        "app.tasks.maintenance_tasks",
    ],
)
```

### Key Configuration Settings
- `task_serializer = "json"`: Enforces safe JSON payload serialization (disallows unsafe pickle serialization).
- `result_serializer = "json"`: Serializes task execution results as standard JSON.
- `accept_content = ["json"]`: Rejects any non-JSON messages on the wire.
- `timezone = "UTC"`: All task scheduling and timestamp generation is strictly UTC.
- `enable_utc = True`: Enables explicit UTC time handling.
- `task_track_started = True`: Emits task started events for real-time latency monitoring.
- `task_time_limit = 600`: Hard execution limit of 10 minutes per task before forced termination.
- `task_soft_time_limit = 540`: Soft execution limit of 9 minutes triggering a `SoftTimeLimitExceeded` graceful shutdown exception.
- `worker_prefetch_multiplier = 1`: Prevents long tasks from starving quick tasks; workers prefetch only 1 task at a time.
- `task_acks_late = True`: Tasks are acknowledged only AFTER execution completes, guaranteeing that workers killed mid-execution re-queue the task for another worker.

---

## 2. Celery Beat Schedule Table

The scheduled tasks defined in `app/workers/schedules.py` operate on configurable intervals controlled via environment variables:

| Job Key | Task Name | Queue | Default Schedule | Env Override |
|---|---|---|---|---|
| `collect-official-news` | `app.tasks.news_tasks.collect_news_task` | `news_queue` | Every 30 minutes | `NEWS_COLLECTION_INTERVAL_MINUTES` |
| `refresh-store-prices` | `app.tasks.price_tasks.refresh_prices_task` | `price_queue` | Every 120 minutes | `PRICE_REFRESH_INTERVAL_MINUTES` |
| `check-stale-prices` | `app.tasks.price_tasks.check_stale_prices_task` | `price_queue` | Every 24 hours | `DATA_FRESHNESS_CHECK_INTERVAL_HOURS` |
| `refresh-events-calendar` | `app.tasks.event_tasks.refresh_events_task` | `event_queue` | Every 6 hours | `EVENT_REFRESH_INTERVAL_HOURS` |
| `process-event-reminders` | `app.tasks.event_tasks.process_event_reminders_task` | `event_queue` | Every 1 minute | `EVENT_REMINDER_INTERVAL_MINUTES` |
| `process-outbound-email` | `app.tasks.notification_tasks.process_email_deliveries_task` | `notification_queue` | Every 1 minute | Hardcoded interval |
| `process-outbound-push` | `app.tasks.notification_tasks.process_push_deliveries_task` | `notification_queue` | Every 1 minute | Hardcoded interval |
| `retry-failed-notifications`| `app.tasks.notification_tasks.retry_failed_deliveries_task` | `notification_queue` | Every 5 minutes | `NOTIFICATION_RETRY_INTERVAL_MINUTES` |
| `check-sources-health` | `app.tasks.maintenance_tasks.check_sources_health_task` | `maintenance_queue` | Every 24 hours | `SOURCE_HEALTH_CHECK_INTERVAL_HOURS` |
| `maintain-ai-knowledge-base`| `app.tasks.ai_tasks.maintain_knowledge_base_task` | `ai_queue` | Every 24 hours | Hardcoded interval |
| `aggregate-ai-usage-metrics`| `app.tasks.ai_tasks.aggregate_ai_usage_task` | `ai_queue` | Every 24 hours | Hardcoded interval |
| `purge-stale-job-logs` | `app.tasks.maintenance_tasks.purge_stale_job_logs_task` | `maintenance_queue` | Every 24 hours | 30-day cutoff |

---

## 3. Retry Policies & Error Handling

All tasks are bound (`bind=True`) with standardized retry mechanisms:

```python
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def example_task(self):
    try:
        # Task work
        pass
    except TransientNetworkError as exc:
        # Exponential backoff retry
        countdown = 60 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)
```

- **Automatic Task Audit Logging**:
  Every task invocation automatically records:
  - An entry in `automation_job_logs` with status `RUNNING`.
  - On success: status updated to `SUCCESS`, calculating `duration_ms`.
  - On retry: status updated to `RETRY` with `error_message` and incremented `retry_count`.
  - On terminal failure: status updated to `FAILURE` with full formatted `error_traceback`.
