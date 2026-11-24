from datetime import timedelta
from app.core.config import settings

# Periodic Celery Beat task schedule definitions with configurable intervals
CELERY_BEAT_SCHEDULE = {
    # 1. Automated News Ingestion (every 30 minutes)
    "collect-official-news": {
        "task": "app.tasks.news_tasks.collect_news_task",
        "schedule": timedelta(minutes=settings.NEWS_COLLECTION_INTERVAL_MINUTES),
        "options": {"queue": "news_queue"},
    },
    # 2. Automated Store Price Refresh (every 1-3 hours)
    "refresh-store-prices": {
        "task": "app.tasks.price_tasks.refresh_prices_task",
        "schedule": timedelta(minutes=settings.PRICE_REFRESH_INTERVAL_MINUTES),
        "options": {"queue": "price_queue"},
    },
    # 3. Daily Stale Price Auditing
    "check-stale-prices": {
        "task": "app.tasks.price_tasks.check_stale_prices_task",
        "schedule": timedelta(hours=settings.DATA_FRESHNESS_CHECK_INTERVAL_HOURS),
        "options": {"queue": "price_queue"},
    },
    # 4. Event Calendar Synchronization (every 6 hours)
    "refresh-events-calendar": {
        "task": "app.tasks.event_tasks.refresh_events_task",
        "schedule": timedelta(hours=settings.EVENT_REFRESH_INTERVAL_HOURS),
        "options": {"queue": "event_queue"},
    },
    # 5. Saved Event Reminders Dispatch (every 1 minute)
    "process-event-reminders": {
        "task": "app.tasks.event_tasks.process_event_reminders_task",
        "schedule": timedelta(minutes=settings.EVENT_REMINDER_INTERVAL_MINUTES),
        "options": {"queue": "event_queue"},
    },
    # 6. Outbound Notification Delivery (every 1 minute)
    "process-outbound-notifications": {
        "task": "app.tasks.notification_tasks.process_email_deliveries_task",
        "schedule": timedelta(minutes=1),
        "options": {"queue": "notification_queue"},
    },
    # 7. Notification Retry Processing (every 5 minutes)
    "retry-failed-notifications": {
        "task": "app.tasks.notification_tasks.retry_failed_deliveries_task",
        "schedule": timedelta(minutes=settings.NOTIFICATION_RETRY_INTERVAL_MINUTES),
        "options": {"queue": "notification_queue"},
    },
    # 8. Data Source Health & Availability Check (daily)
    "check-sources-health": {
        "task": "app.tasks.maintenance_tasks.check_sources_health_task",
        "schedule": timedelta(hours=settings.SOURCE_HEALTH_CHECK_INTERVAL_HOURS),
        "options": {"queue": "maintenance_queue"},
    },
    # 9. AI Problem Solver Knowledge Base Maintenance (daily)
    "maintain-ai-knowledge-base": {
        "task": "app.tasks.ai_tasks.maintain_knowledge_base_task",
        "schedule": timedelta(hours=24),
        "options": {"queue": "ai_queue"},
    },
    # 10. AI Diagnostics Usage Aggregation (daily)
    "aggregate-ai-usage": {
        "task": "app.tasks.ai_tasks.aggregate_ai_usage_task",
        "schedule": timedelta(hours=24),
        "options": {"queue": "ai_queue"},
    },
    # 11. Global Search Index Rebuild (hourly)
    "rebuild-search-index": {
        "task": "app.tasks.search_tasks.rebuild_search_index_task",
        "schedule": timedelta(hours=1),
        "options": {"queue": "maintenance_queue"},
    },
}
