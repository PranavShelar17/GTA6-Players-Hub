import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine
from celery import Celery
from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.logging import logger
from app.models.automation import AutomationJobLog
from app.workers.schedules import CELERY_BEAT_SCHEDULE

broker_url = settings.CELERY_BROKER_URL or settings.REDIS_URL
backend_url = settings.CELERY_RESULT_BACKEND or settings.REDIS_URL

celery_app = Celery(
    "gta6_player_hub_automation",
    broker=broker_url,
    backend=backend_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes maximum for background jobs
    task_soft_time_limit=240,
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
    task_default_queue="celery",
    task_routes={
        "app.tasks.news_tasks.*": {"queue": "news_queue"},
        "app.tasks.price_tasks.*": {"queue": "price_queue"},
        "app.tasks.event_tasks.*": {"queue": "event_queue"},
        "app.tasks.notification_tasks.*": {"queue": "notification_queue"},
        "app.tasks.ai_tasks.*": {"queue": "ai_queue"},
        "app.tasks.maintenance_tasks.*": {"queue": "maintenance_queue"},
        "app.tasks.search_tasks.*": {"queue": "maintenance_queue"},
    },
    beat_schedule=CELERY_BEAT_SCHEDULE,
)

# Auto-discover task modules
celery_app.autodiscover_tasks([
    "app.tasks.news_tasks",
    "app.tasks.price_tasks",
    "app.tasks.event_tasks",
    "app.tasks.notification_tasks",
    "app.tasks.ai_tasks",
    "app.tasks.maintenance_tasks",
    "app.tasks.search_tasks",
])


def run_async(coro_fn: Callable[..., Coroutine[Any, Any, Any]], *args: Any, **kwargs: Any) -> Any:
    """Executes an asynchronous coroutine inside a Celery synchronous worker thread."""
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro_fn(*args, **kwargs))
    finally:
        loop.close()


async def record_task_start(task_name: str, task_id: str) -> uuid.UUID:
    """Records initial task execution entry in automation_job_logs."""
    now = datetime.now(timezone.utc)
    async with async_session_factory() as session:
        log_entry = AutomationJobLog(
            task_name=task_name,
            task_id=task_id,
            status="RUNNING",
            started_at=now,
            retry_count=0,
        )
        session.add(log_entry)
        await session.commit()
        await session.refresh(log_entry)
        return log_entry.id


async def record_task_complete(
    log_id: uuid.UUID,
    status: str,
    error_message: str = None,
    retry_count: int = 0,
) -> None:
    """Updates task execution log upon completion, retry, or failure."""
    now = datetime.now(timezone.utc)
    async with async_session_factory() as session:
        stmt = select(AutomationJobLog).where(AutomationJobLog.id == log_id)
        res = await session.execute(stmt)
        entry = res.scalar_one_or_none()
        if entry:
            entry.status = status
            entry.completed_at = now
            entry.error_message = error_message
            entry.retry_count = retry_count
            await session.commit()
