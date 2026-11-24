from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AutomationHealthResponse(BaseModel):
    status: str = Field(..., description="Overall automation system health")
    service: str = Field("GTA 6 Player Hub Background Automation", description="Service name")
    timestamp: datetime = Field(..., description="Evaluation timestamp")
    redis_connected: bool = Field(..., description="Redis message broker connectivity")
    database_connected: bool = Field(..., description="Database connectivity")
    active_workers: int = Field(0, description="Active Celery worker count")
    scheduler_status: str = Field(..., description="Scheduler operational status")


class WorkerHealthResponse(BaseModel):
    status: str = Field(..., description="Worker fleet status")
    active_workers_count: int = Field(0, description="Number of online worker nodes")
    worker_nodes: List[Dict[str, Any]] = Field(default_factory=list, description="Worker details")
    registered_tasks: List[str] = Field(default_factory=list, description="Registered task names")
    active_queues: List[str] = Field(default_factory=list, description="Listening queues")


class ScheduledTaskDetail(BaseModel):
    task_name: str
    schedule: str
    description: Optional[str] = None
    args: Optional[List[Any]] = None


class SchedulerHealthResponse(BaseModel):
    status: str = Field(..., description="Scheduler state")
    scheduler_engine: str = Field("Celery Beat", description="Scheduler engine name")
    scheduled_tasks: List[ScheduledTaskDetail] = Field(default_factory=list, description="Active periodic jobs")
    total_jobs: int = Field(0, description="Total configured jobs")


class DataSourceStatusRead(BaseModel):
    id: str
    source_name: str
    source_type: str
    source_url: Optional[str] = None
    last_attempted_at: Optional[datetime] = None
    last_successful_at: Optional[datetime] = None
    last_error: Optional[str] = None
    health_status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DataSourceStatusSummary(BaseModel):
    total_sources: int
    healthy_count: int
    degraded_count: int
    unavailable_count: int
    sources: List[DataSourceStatusRead]


class DataIngestionLogRead(BaseModel):
    id: str
    source_id: Optional[str] = None
    data_category: str
    records_retrieved: int
    records_created: int
    records_updated: int
    records_skipped: int
    records_failed: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str

    model_config = {"from_attributes": True}


class DataIngestionHistoryResponse(BaseModel):
    total: int
    items: List[DataIngestionLogRead]


class AutomationJobLogRead(BaseModel):
    id: str
    task_name: str
    task_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    retry_count: int
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AutomationTaskHistoryResponse(BaseModel):
    total: int
    items: List[AutomationJobLogRead]


class NotificationDeliveryStatusResponse(BaseModel):
    total_deliveries: int
    sent_count: int
    delivered_count: int
    failed_count: int
    pending_count: int
    by_channel: Dict[str, int]
    recent_deliveries: List[Dict[str, Any]]
