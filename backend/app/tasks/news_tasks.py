from app.core.database import async_session_factory
from app.core.logging import logger
from app.services.news_ingestion_service import NewsIngestionService
from app.workers.celery_app import celery_app, record_task_complete, record_task_start, run_async


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def collect_news_task(self):
    """Celery background task for automated news ingestion across approved sources."""
    task_id = self.request.id or "direct-news-task"
    log_id = run_async(record_task_start, "collect_news_task", task_id)
    logger.info(f"[Task:collect_news_task] Started (ID: {task_id})")

    async def _execute():
        async with async_session_factory() as session:
            return await NewsIngestionService.run_news_ingestion(session)

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        logger.info(f"[Task:collect_news_task] Finished: {result}")
        return result
    except Exception as exc:
        logger.error(f"[Task:collect_news_task] Error: {exc}")
        if self.request.retries < self.max_retries:
            run_async(record_task_complete, log_id, "RETRY", str(exc), self.request.retries + 1)
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc
