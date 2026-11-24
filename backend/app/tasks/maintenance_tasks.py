from datetime import datetime, timezone, timedelta
from typing import Any, Dict
from sqlalchemy import select, update

from app.core.database import async_session_factory
from app.core.logging import logger
from app.models.automation import DataSourceStatus
from app.workers.celery_app import celery_app, record_task_complete, record_task_start, run_async


@celery_app.task(bind=True, max_retries=2, default_retry_delay=120)
def check_sources_health_task(self) -> Dict[str, Any]:
    """Celery background task auditing health and freshness across all external sources."""
    task_id = self.request.id or "direct-sources-health-task"
    log_id = run_async(record_task_start, "check_sources_health_task", task_id)

    async def _execute():
        now = datetime.now(timezone.utc)
        degraded_count = 0
        healthy_count = 0

        async with async_session_factory() as session:
            stmt = select(DataSourceStatus)
            res = await session.execute(stmt)
            sources = res.scalars().all()

            for src in sources:
                if src.last_successful_at:
                    last_success = src.last_successful_at
                    if last_success.tzinfo is None:
                        last_success = last_success.replace(tzinfo=timezone.utc)
                    age = now - last_success
                    # Flag as degraded if not updated in 48 hours and has an error
                    if age > timedelta(hours=48) and src.last_error:
                        src.health_status = "DEGRADED"
                        degraded_count += 1
                    else:
                        src.health_status = "HEALTHY"
                        healthy_count += 1
                else:
                    src.health_status = "UNKNOWN"

            await session.commit()

            return {
                "total_audited": len(sources),
                "healthy_count": healthy_count,
                "degraded_count": degraded_count,
                "audited_at": now.isoformat(),
            }

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:check_sources_health_task] Error: {exc}")
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc


@celery_app.task(bind=True, max_retries=2, default_retry_delay=120)
def purge_stale_job_logs_task(self, retention_days: int = 30) -> Dict[str, Any]:
    """Celery background task purging execution logs older than retention period."""
    from sqlalchemy import delete
    from app.models.automation import AutomationJobLog, DataIngestionLog
    task_id = self.request.id or "direct-purge-logs-task"
    log_id = run_async(record_task_start, "purge_stale_job_logs_task", task_id)

    async def _execute():
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        async with async_session_factory() as session:
            # Delete old job logs
            job_stmt = delete(AutomationJobLog).where(AutomationJobLog.started_at < cutoff)
            job_res = await session.execute(job_stmt)
            # Delete old ingestion logs
            ing_stmt = delete(DataIngestionLog).where(DataIngestionLog.started_at < cutoff)
            ing_res = await session.execute(ing_stmt)
            await session.commit()
            return {
                "purged_job_logs": job_res.rowcount or 0,
                "purged_ingestion_logs": ing_res.rowcount or 0,
                "retention_cutoff": cutoff.isoformat(),
            }

    try:
        result = run_async(_execute)
        run_async(record_task_complete, log_id, "SUCCESS")
        return result
    except Exception as exc:
        logger.error(f"[Task:purge_stale_job_logs_task] Error: {exc}")
        run_async(record_task_complete, log_id, "FAILURE", str(exc), self.request.retries)
        raise exc
