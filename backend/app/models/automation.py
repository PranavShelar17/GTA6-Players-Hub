import uuid
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from app.core.database import Base
from app.models.user import GUID


class AutomationJobLog(Base):
    __tablename__ = "automation_job_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    task_name = Column(String(128), nullable=False, index=True)
    task_id = Column(String(128), nullable=False, index=True)
    status = Column(
        String(32), nullable=False, default="PENDING", index=True
    )  # PENDING, RUNNING, SUCCESS, FAILURE, RETRY
    started_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


class DataSourceStatus(Base):
    __tablename__ = "data_source_status"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    source_name = Column(String(128), unique=True, nullable=False, index=True)
    source_type = Column(
        String(64), nullable=False, index=True
    )  # NEWS, PRICES, EVENTS, COMMUNITY, AI
    source_url = Column(String(512), nullable=True)
    last_attempted_at = Column(DateTime(timezone=True), nullable=True)
    last_successful_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    health_status = Column(
        String(32), nullable=False, default="HEALTHY", index=True
    )  # HEALTHY, DEGRADED, UNAVAILABLE, UNKNOWN
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class DataIngestionLog(Base):
    __tablename__ = "data_ingestion_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    source_id = Column(String(128), nullable=True, index=True)
    data_category = Column(
        String(64), nullable=False, index=True
    )  # NEWS, PRICES, EVENTS, AI_KNOWLEDGE
    records_retrieved = Column(Integer, nullable=False, default=0)
    records_created = Column(Integer, nullable=False, default=0)
    records_updated = Column(Integer, nullable=False, default=0)
    records_skipped = Column(Integer, nullable=False, default=0)
    records_failed = Column(Integer, nullable=False, default=0)
    started_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        String(32), nullable=False, default="RUNNING", index=True
    )  # RUNNING, SUCCESS, PARTIAL, FAILED
