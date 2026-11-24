from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import redis
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.automation import AutomationJobLog, DataIngestionLog, DataSourceStatus
from app.models.notification import NotificationDelivery
from app.schemas.automation import (
    AutomationHealthResponse,
    AutomationJobLogRead,
    AutomationTaskHistoryResponse,
    DataIngestionHistoryResponse,
    DataIngestionLogRead,
    DataSourceStatusRead,
    DataSourceStatusSummary,
    NotificationDeliveryStatusResponse,
    SchedulerHealthResponse,
    WorkerHealthResponse,
)


class AutomationMonitorService:
    """Service providing operational health checks, execution histories, and source metrics."""

    @staticmethod
    async def get_system_health(session: AsyncSession) -> AutomationHealthResponse:
        """Evaluates overall health across Redis, Database, Celery Worker, and Beat Scheduler."""
        now = datetime.now(timezone.utc)

        # 1. Database check
        db_connected = False
        try:
            res = await session.execute(select(1))
            db_connected = res.scalar() == 1
        except Exception as e:
            logger.warning(f"Automation health check - DB error: {e}")

        # 2. Redis check
        redis_connected = False
        try:
            r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
            redis_connected = bool(r.ping())
        except Exception as e:
            logger.warning(f"Automation health check - Redis error: {e}")

        # 3. Worker check
        active_workers = 0
        try:
            from app.workers.celery_app import celery_app
            insp = celery_app.control.inspect(timeout=1.5)
            ping_res = insp.ping() if insp else None
            if ping_res:
                active_workers = len(ping_res)
        except Exception as e:
            logger.info(f"Worker inspect notice: {e}")

        # 4. Status synthesis
        if db_connected and redis_connected:
            overall_status = "HEALTHY"
        elif db_connected:
            overall_status = "DEGRADED"
        else:
            overall_status = "UNHEALTHY"

        scheduler_status = "RUNNING" if redis_connected else "STANDBY"

        return AutomationHealthResponse(
            status=overall_status,
            service="GTA 6 Player Hub Background Automation",
            timestamp=now,
            redis_connected=redis_connected,
            database_connected=db_connected,
            active_workers=active_workers,
            scheduler_status=scheduler_status,
        )

    @staticmethod
    def get_worker_health() -> WorkerHealthResponse:
        """Inspects online Celery workers, active queues, and registered tasks."""
        active_nodes: List[Dict[str, Any]] = []
        registered_tasks: List[str] = []
        active_queues: List[str] = ["celery", "news_queue", "price_queue", "event_queue", "notification_queue"]

        try:
            from app.workers.celery_app import celery_app
            insp = celery_app.control.inspect(timeout=1.5)
            if insp:
                pings = insp.ping() or {}
                registered = insp.registered() or {}
                for node, stat in pings.items():
                    active_nodes.append({
                        "node_name": node,
                        "status": "ONLINE" if stat == {"ok": "pong"} else "DEGRADED",
                    })
                for _, tasks in registered.items():
                    for t in tasks:
                        if t not in registered_tasks:
                            registered_tasks.append(t)
        except Exception as err:
            logger.info(f"Worker health inspect notice: {err}")

        # Fallback to configured task list if worker inspection is silent
        if not registered_tasks:
            registered_tasks = [
                "app.tasks.news_tasks.collect_news_task",
                "app.tasks.price_tasks.refresh_prices_task",
                "app.tasks.price_tasks.check_stale_prices_task",
                "app.tasks.event_tasks.refresh_events_task",
                "app.tasks.event_tasks.process_event_reminders_task",
                "app.tasks.notification_tasks.process_email_deliveries_task",
                "app.tasks.notification_tasks.process_push_deliveries_task",
                "app.tasks.notification_tasks.retry_failed_deliveries_task",
                "app.tasks.ai_tasks.maintain_knowledge_base_task",
                "app.tasks.ai_tasks.aggregate_ai_usage_task",
                "app.tasks.maintenance_tasks.check_sources_health_task",
            ]

        status_str = "ONLINE" if active_nodes else "STANDBY"

        return WorkerHealthResponse(
            status=status_str,
            active_workers_count=len(active_nodes),
            worker_nodes=active_nodes,
            registered_tasks=registered_tasks,
            active_queues=active_queues,
        )

    @staticmethod
    def get_scheduler_health() -> SchedulerHealthResponse:
        """Retrieves configured periodic Beat schedules and execution intervals."""
        from app.workers.schedules import CELERY_BEAT_SCHEDULE

        tasks_detail = []
        for name, cfg in CELERY_BEAT_SCHEDULE.items():
            schedule_desc = str(cfg.get("schedule"))
            tasks_detail.append({
                "task_name": cfg.get("task"),
                "schedule": schedule_desc,
                "description": name.replace("-", " ").title(),
                "args": cfg.get("args", []),
            })

        return SchedulerHealthResponse(
            status="ACTIVE",
            scheduler_engine="Celery Beat",
            scheduled_tasks=tasks_detail,
            total_jobs=len(tasks_detail),
        )

    @staticmethod
    async def get_sources_status(
        session: AsyncSession,
        source_type: Optional[str] = None,
    ) -> DataSourceStatusSummary:
        """Returns the health status and last refresh timestamp of all registered external sources."""
        stmt = select(DataSourceStatus)
        if source_type:
            stmt = stmt.where(DataSourceStatus.source_type == source_type.upper())
        stmt = stmt.order_by(DataSourceStatus.source_name.asc())

        res = await session.execute(stmt)
        sources = res.scalars().all()

        healthy = sum(1 for s in sources if s.health_status == "HEALTHY")
        degraded = sum(1 for s in sources if s.health_status == "DEGRADED")
        unavailable = sum(1 for s in sources if s.health_status == "UNAVAILABLE")

        items = [
            DataSourceStatusRead(
                id=str(s.id),
                source_name=s.source_name,
                source_type=s.source_type,
                source_url=s.source_url,
                last_attempted_at=s.last_attempted_at,
                last_successful_at=s.last_successful_at,
                last_error=s.last_error,
                health_status=s.health_status,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in sources
        ]

        return DataSourceStatusSummary(
            total_sources=len(sources),
            healthy_count=healthy,
            degraded_count=degraded,
            unavailable_count=unavailable,
            sources=items,
        )

    @staticmethod
    async def get_ingestion_history(
        session: AsyncSession,
        limit: int = 50,
        category: Optional[str] = None,
    ) -> DataIngestionHistoryResponse:
        """Retrieves recent data ingestion pipeline execution logs."""
        stmt = select(DataIngestionLog)
        if category:
            stmt = stmt.where(DataIngestionLog.data_category == category.upper())
        stmt = stmt.order_by(desc(DataIngestionLog.started_at)).limit(limit)

        res = await session.execute(stmt)
        items = res.scalars().all()

        count_stmt = select(func.count(DataIngestionLog.id))
        if category:
            count_stmt = count_stmt.where(DataIngestionLog.data_category == category.upper())
        count_res = await session.execute(count_stmt)
        total = count_res.scalar() or 0

        read_items = [
            DataIngestionLogRead(
                id=str(i.id),
                source_id=i.source_id,
                data_category=i.data_category,
                records_retrieved=i.records_retrieved,
                records_created=i.records_created,
                records_updated=i.records_updated,
                records_skipped=i.records_skipped,
                records_failed=i.records_failed,
                started_at=i.started_at,
                completed_at=i.completed_at,
                status=i.status,
            )
            for i in items
        ]

        return DataIngestionHistoryResponse(total=total, items=read_items)

    @staticmethod
    async def get_task_history(
        session: AsyncSession,
        limit: int = 50,
        status: Optional[str] = None,
    ) -> AutomationTaskHistoryResponse:
        """Retrieves recent Celery background task execution logs."""
        stmt = select(AutomationJobLog)
        if status:
            stmt = stmt.where(AutomationJobLog.status == status.upper())
        stmt = stmt.order_by(desc(AutomationJobLog.started_at)).limit(limit)

        res = await session.execute(stmt)
        items = res.scalars().all()

        count_stmt = select(func.count(AutomationJobLog.id))
        if status:
            count_stmt = count_stmt.where(AutomationJobLog.status == status.upper())
        count_res = await session.execute(count_stmt)
        total = count_res.scalar() or 0

        read_items = [
            AutomationJobLogRead(
                id=str(j.id),
                task_name=j.task_name,
                task_id=j.task_id,
                status=j.status,
                started_at=j.started_at,
                completed_at=j.completed_at,
                retry_count=j.retry_count,
                error_message=j.error_message,
                created_at=j.created_at,
            )
            for j in items
        ]

        return AutomationTaskHistoryResponse(total=total, items=read_items)

    @staticmethod
    async def get_notification_delivery_status(session: AsyncSession) -> NotificationDeliveryStatusResponse:
        """Calculates multi-channel notification delivery statistics."""
        count_stmt = select(
            NotificationDelivery.status,
            func.count(NotificationDelivery.id),
        ).group_by(NotificationDelivery.status)
        count_res = await session.execute(count_stmt)
        status_map = {row[0]: row[1] for row in count_res.all()}

        channel_stmt = select(
            NotificationDelivery.channel,
            func.count(NotificationDelivery.id),
        ).group_by(NotificationDelivery.channel)
        channel_res = await session.execute(channel_stmt)
        channel_map = {row[0]: row[1] for row in channel_res.all()}

        recent_stmt = (
            select(NotificationDelivery)
            .order_by(desc(NotificationDelivery.created_at))
            .limit(10)
        )
        recent_res = await session.execute(recent_stmt)
        recents = [
            {
                "id": str(d.id),
                "notification_id": str(d.notification_id),
                "channel": d.channel,
                "status": d.status,
                "retry_count": d.retry_count,
                "attempted_at": d.attempted_at.isoformat() if d.attempted_at else None,
                "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
                "error_message": d.error_message,
            }
            for d in recent_res.scalars().all()
        ]

        total = sum(status_map.values())
        return NotificationDeliveryStatusResponse(
            total_deliveries=total,
            sent_count=status_map.get("SENT", 0),
            delivered_count=status_map.get("DELIVERED", 0),
            failed_count=status_map.get("FAILED", 0),
            pending_count=status_map.get("PENDING", 0),
            by_channel=channel_map,
            recent_deliveries=recents,
        )
