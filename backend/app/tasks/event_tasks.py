from typing import Any, Dict
from app.core.database import async_session_factory
from app.core.logging import logger
from app.services.event_refresh_service import EventRefreshService
from app.workers.celery_app import celery_app, record_task_complete, record_task_start, run_async


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def refresh_events_task(self) -> Dict[str, Any]:
    """Celery background task for automated event calendar synchronization."""
    task_id = self.request.id or "direct-event-refresh-task"
    log_id = run_async(record_task_start, "refresh_events_task", task_id)
    logger.info(f"[Task:refresh_events_task] Started (ID: {task_id})")

    async def _execute():
        async with async_session_factory() as session:
            return await EventRefreshService.run_event_refresh(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        logger.info(f"[Task:refresh_events_task] Finished: {result}")
        return result
    except Exception as exc:
        logger.error(f"[Task:refresh_events_task] Error: {exc}")
        if self.request.retries < self.max_retries:
            run_async(record_task_complete, log_id, "RETRY", str(exc), self.request.retries + 1)
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def process_event_reminders_task(self) -> Dict[str, Any]:
    """Celery background task processing saved event reminders and dispatching notifications."""
    task_id = self.request.id or "direct-event-reminders-task"
    log_id = run_async(record_task_start, "process_event_reminders_task", task_id)

    async def _execute():
        async with async_session_factory() as session:
            return await EventRefreshService.process_event_reminders(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:process_event_reminders_task] Error: {exc}")
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc
