import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import GUID


class EventCategory(Base):
    __tablename__ = "event_categories"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(64), nullable=False, unique=True)
    slug = Column(String(64), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(64), nullable=True, default="calendar")
    color = Column(String(32), nullable=True, default="#f97316")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    events = relationship("Event", back_populates="category", cascade="all, delete-orphan")


class EventSource(Base):
    __tablename__ = "event_sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(128), nullable=False, unique=True)
    website_url = Column(String(512), nullable=False)
    source_type = Column(String(32), nullable=False, default="OFFICIAL")  # OFFICIAL, PUBLISHER, COMMUNITY, MEDIA
    reliability_score = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    events = relationship("Event", back_populates="source")


class Event(Base):
    __tablename__ = "events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    short_summary = Column(String(500), nullable=True)
    category_id = Column(GUID(), ForeignKey("event_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(GUID(), ForeignKey("event_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    timezone = Column(String(64), nullable=False, default="UTC")
    location_type = Column(String(32), nullable=False, default="ONLINE")  # ONLINE, IN_PERSON, HYBRID
    location_name = Column(String(255), nullable=True)
    event_url = Column(String(512), nullable=True)
    stream_url = Column(String(512), nullable=True)
    verification_status = Column(String(32), nullable=False, default="VERIFIED", index=True)  # OFFICIAL, VERIFIED, COMMUNITY, UNCONFIRMED
    is_featured = Column(Boolean, nullable=False, default=False, index=True)
    is_cancelled = Column(Boolean, nullable=False, default=False)
    banner_image_url = Column(String(512), nullable=True)
    organizer_name = Column(String(128), nullable=False, default="Rockstar Games")
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    category = relationship("EventCategory", back_populates="events")
    source = relationship("EventSource", back_populates="events")
    saved_by = relationship("SavedEvent", back_populates="event", cascade="all, delete-orphan")
    reminders = relationship("EventReminder", back_populates="event", cascade="all, delete-orphan")


class SavedEvent(Base):
    __tablename__ = "saved_events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=False, index=True)
    event_id = Column(GUID(), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    event = relationship("Event", back_populates="saved_by")

    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_user_event_save"),
        Index("idx_saved_events_user_created", "user_id", "created_at"),
    )


class EventReminder(Base):
    __tablename__ = "event_reminders"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=False, index=True)
    event_id = Column(GUID(), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_time_minutes = Column(Integer, nullable=False, default=60)  # 15, 60, 1440
    channel = Column(String(32), nullable=False, default="IN_APP")  # IN_APP, EMAIL, PUSH
    is_sent = Column(Boolean, nullable=False, default=False, index=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    event = relationship("Event", back_populates="reminders")

    __table_args__ = (
        UniqueConstraint("user_id", "event_id", "lead_time_minutes", "channel", name="uq_user_event_reminder"),
        Index("idx_event_reminders_status", "is_sent", "lead_time_minutes"),
    )
