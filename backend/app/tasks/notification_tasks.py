from typing import Any, Dict
from app.core.database import async_session_factory
from app.core.logging import logger
from app.services.notification_delivery_service import NotificationDeliveryService
from app.workers.celery_app import celery_app, record_task_complete, record_task_start, run_async


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_email_deliveries_task(self) -> Dict[str, Any]:
    """Celery background task for outbound email notification delivery."""
    task_id = self.request.id or "direct-email-delivery-task"
    log_id = run_async(record_task_start, "process_email_deliveries_task", task_id)

    async def _execute():
        async with async_session_factory() as session:
            return await NotificationDeliveryService.process_email_deliveries(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:process_email_deliveries_task] Error: {exc}")
        if self.request.retries < self.max_retries:
            run_async(record_task_complete, log_id, "RETRY", str(exc), self.request.retries + 1)
            raise self.retry(exc=exc, countdown=60)
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_push_deliveries_task(self) -> Dict[str, Any]:
    """Celery background task for outbound browser Web Push notification delivery."""
    task_id = self.request.id or "direct-push-delivery-task"
    log_id = run_async(record_task_start, "process_push_deliveries_task", task_id)

    async def _execute():
        async with async_session_factory() as session:
            return await NotificationDeliveryService.process_push_deliveries(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:process_push_deliveries_task] Error: {exc}")
        if self.request.retries < self.max_retries:
            run_async(record_task_complete, log_id, "RETRY", str(exc), self.request.retries + 1)
            raise self.retry(exc=exc, countdown=60)
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc


@celery_app.task(bind=True, max_retries=2, default_retry_delay=120)
def retry_failed_deliveries_task(self) -> Dict[str, Any]:
    """Celery background task retrying failed outbound notification dispatches."""
    task_id = self.request.id or "direct-retry-deliveries-task"
    log_id = run_async(record_task_start, "retry_failed_deliveries_task", task_id)

    async def _execute():
        async with async_session_factory() as session:
            return await NotificationDeliveryService.retry_failed_deliveries(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:retry_failed_deliveries_task] Error: {exc}")
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc
