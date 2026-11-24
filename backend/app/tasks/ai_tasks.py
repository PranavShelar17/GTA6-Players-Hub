from typing import Any, Dict
from app.core.database import async_session_factory
from app.core.logging import logger
from app.services.ai_background_service import AIBackgroundService
from app.workers.celery_app import celery_app, record_task_complete, record_task_start, run_async


@celery_app.task(bind=True, max_retries=2, default_retry_delay=180)
def maintain_knowledge_base_task(self) -> Dict[str, Any]:
    """Celery background task for technical troubleshooting documentation maintenance."""
    task_id = self.request.id or "direct-ai-knowledge-task"
    log_id = run_async(record_task_start, "maintain_knowledge_base_task", task_id)

    async def _execute():
        async with async_session_factory() as session:
            return await AIBackgroundService.run_knowledge_maintenance(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:maintain_knowledge_base_task] Error: {exc}")
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc


@celery_app.task(bind=True, max_retries=2, default_retry_delay=180)
def aggregate_ai_usage_task(self) -> Dict[str, Any]:
    """Celery background task calculating AI conversation volume and feedback quality metrics."""
    task_id = self.request.id or "direct-ai-usage-task"
    log_id = run_async(record_task_start, "aggregate_ai_usage_task", task_id)

    async def _execute():
        async with async_session_factory() as session:
            return await AIBackgroundService.aggregate_ai_usage_metrics(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:aggregate_ai_usage_task] Error: {exc}")
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc
