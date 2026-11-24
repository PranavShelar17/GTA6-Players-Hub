from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, security_bearer
from app.schemas.automation import (
    AutomationHealthResponse,
    AutomationTaskHistoryResponse,
    DataIngestionHistoryResponse,
    DataSourceStatusSummary,
    NotificationDeliveryStatusResponse,
    SchedulerHealthResponse,
    WorkerHealthResponse,
)
from app.schemas.envelope import ApiResponse
from app.services.automation_monitor_service import AutomationMonitorService

router = APIRouter(prefix="/automation", tags=["Background Automation & Health"])


async def verify_automation_auth(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> bool:
    """Verifies that the request is authenticated with an automation API key or authorized session."""
    # 1. Check custom X-Automation-Key header
    api_key_header = request.headers.get("X-Automation-Key")
    if api_key_header and api_key_header == settings.AUTOMATION_API_KEY:
        return True

    # 2. Check Bearer token matching AUTOMATION_API_KEY
    if credentials and credentials.credentials == settings.AUTOMATION_API_KEY:
        return True

    # 3. Check authenticated player token
    if credentials:
        try:
            user = await get_current_user(credentials)
            if user and user.is_authenticated:
                return True
        except HTTPException:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Valid automation service key or player authentication token required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.get(
    "/health",
    response_model=ApiResponse[AutomationHealthResponse],
    summary="Automation System Health Check",
)
async def get_automation_health(
    _: bool = Depends(verify_automation_auth),
    db: AsyncSession = Depends(get_db),
):
    """Reports overall health across Redis broker, Database, Celery Worker, and Beat Scheduler."""
    health_data = await AutomationMonitorService.get_system_health(db)
    return ApiResponse(success=True, data=health_data)


@router.get(
    "/worker-health",
    response_model=ApiResponse[WorkerHealthResponse],
    summary="Celery Worker Status",
)
async def get_worker_health(
    _: bool = Depends(verify_automation_auth),
):
    """Reports status of active background worker nodes, registered tasks, and listening queues."""
    worker_data = AutomationMonitorService.get_worker_health()
    return ApiResponse(success=True, data=worker_data)


@router.get(
    "/scheduler-health",
    response_model=ApiResponse[SchedulerHealthResponse],
    summary="Celery Beat Scheduler Status",
)
async def get_scheduler_health(
    _: bool = Depends(verify_automation_auth),
):
    """Reports status of Celery Beat periodic job scheduler and active schedules."""
    scheduler_data = AutomationMonitorService.get_scheduler_health()
    return ApiResponse(success=True, data=scheduler_data)


@router.get(
    "/sources/status",
    response_model=ApiResponse[DataSourceStatusSummary],
    summary="External Data Sources Health",
)
async def get_data_sources_status(
    source_type: Optional[str] = Query(None, description="Optional filter: NEWS, PRICES, EVENTS, AI"),
    _: bool = Depends(verify_automation_auth),
    db: AsyncSession = Depends(get_db),
):
    """Returns freshness, availability, and last update timestamps of external feeds."""
    sources_data = await AutomationMonitorService.get_sources_status(db, source_type=source_type)
    return ApiResponse(success=True, data=sources_data)


@router.get(
    "/ingestion/history",
    response_model=ApiResponse[DataIngestionHistoryResponse],
    summary="Data Ingestion Run History",
)
async def get_ingestion_history(
    limit: int = Query(50, ge=1, le=200, description="Page size limit"),
    category: Optional[str] = Query(None, description="Optional category filter: NEWS, PRICES, EVENTS, AI_KNOWLEDGE"),
    _: bool = Depends(verify_automation_auth),
    db: AsyncSession = Depends(get_db),
):
    """Returns historical execution records of data ingestion pipelines."""
    history = await AutomationMonitorService.get_ingestion_history(db, limit=limit, category=category)
    return ApiResponse(success=True, data=history)


@router.get(
    "/tasks/history",
    response_model=ApiResponse[AutomationTaskHistoryResponse],
    summary="Background Task Execution History",
)
async def get_task_history(
    limit: int = Query(50, ge=1, le=200, description="Page size limit"),
    task_status: Optional[str] = Query(None, alias="status", description="Optional status filter: SUCCESS, FAILURE, RETRY, RUNNING"),
    _: bool = Depends(verify_automation_auth),
    db: AsyncSession = Depends(get_db),
):
    """Returns background job execution audit logs."""
    history = await AutomationMonitorService.get_task_history(db, limit=limit, status=task_status)
    return ApiResponse(success=True, data=history)


@router.get(
    "/notifications/status",
    response_model=ApiResponse[NotificationDeliveryStatusResponse],
    summary="Notification Delivery Status",
)
async def get_notification_status(
    _: bool = Depends(verify_automation_auth),
    db: AsyncSession = Depends(get_db),
):
    """Returns delivery statistics for multi-channel player notifications."""
    delivery_data = await AutomationMonitorService.get_notification_delivery_status(db)
    return ApiResponse(success=True, data=delivery_data)


@router.post(
    "/trigger/{task_name}",
    response_model=ApiResponse[dict],
    summary="Manually Trigger Background Automation Task",
)
async def trigger_automation_task(
    task_name: str,
    _: bool = Depends(verify_automation_auth),
    db: AsyncSession = Depends(get_db),
):
    """Allows an authorized operator or health monitor to trigger an automation run immediately."""
    from app.services.news_ingestion_service import NewsIngestionService
    from app.services.price_refresh_service import PriceRefreshService
    from app.services.event_refresh_service import EventRefreshService
    from app.services.notification_delivery_service import NotificationDeliveryService
    from app.services.ai_background_service import AIBackgroundService

    normalized = task_name.strip().lower()
    result = {}

    if normalized in ["news", "collect_news"]:
        result = await NewsIngestionService.run_news_ingestion(db)
    elif normalized in ["prices", "refresh_prices"]:
        result = await PriceRefreshService.run_price_refresh(db)
    elif normalized in ["events", "refresh_events"]:
        result = await EventRefreshService.run_event_refresh(db)
    elif normalized in ["reminders", "event_reminders"]:
        result = await EventRefreshService.process_event_reminders(db)
    elif normalized in ["deliveries", "notifications"]:
        result = await NotificationDeliveryService.retry_failed_deliveries(db)
    elif normalized in ["ai-knowledge", "knowledge"]:
        result = await AIBackgroundService.run_knowledge_maintenance(db)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown task trigger '{task_name}'. Supported: news, prices, events, reminders, deliveries, ai-knowledge",
        )

    return ApiResponse(success=True, data={"task": task_name, "result": result})
