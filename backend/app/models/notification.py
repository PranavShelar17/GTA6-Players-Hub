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


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(
        String(32), 
        nullable=False, 
        index=True
    )  # NEWS_UPDATE, PRICE_DROP, EVENT_REMINDER, EVENT_UPDATE, PLATFORM_ANNOUNCEMENT, ACCOUNT_SECURITY
    reference_id = Column(String(128), nullable=True)
    reference_url = Column(String(512), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String(16), nullable=False, default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    deliveries = relationship("NotificationDelivery", back_populates="notification", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_notifications_user_unread", "user_id", "is_read", "created_at"),
    )


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), unique=True, nullable=False, index=True)
    in_app_enabled = Column(Boolean, nullable=False, default=True)
    email_enabled = Column(Boolean, nullable=False, default=True)
    push_enabled = Column(Boolean, nullable=False, default=False)
    news_updates = Column(Boolean, nullable=False, default=True)
    price_alerts = Column(Boolean, nullable=False, default=True)
    event_reminders = Column(Boolean, nullable=False, default=True)
    community_activity = Column(Boolean, nullable=False, default=True)
    platform_announcements = Column(Boolean, nullable=False, default=True)
    default_reminder_minutes = Column(Integer, nullable=False, default=60)
    quiet_hours_enabled = Column(Boolean, nullable=False, default=False)
    quiet_hours_start = Column(String(5), nullable=False, default="22:00")
    quiet_hours_end = Column(String(5), nullable=False, default="08:00")
    timezone = Column(String(64), nullable=False, default="UTC")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    notification_id = Column(GUID(), ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(32), nullable=False)  # IN_APP, EMAIL, PUSH
    status = Column(String(32), nullable=False, default="SENT")  # PENDING, SENT, FAILED, DELIVERED
    error_message = Column(Text, nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    notification = relationship("Notification", back_populates="deliveries")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=False, index=True)
    endpoint = Column(String(1024), nullable=False)
    p256dh = Column(String(255), nullable=False)
    auth = Column(String(255), nullable=False)
    user_agent = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "endpoint", name="uq_user_push_endpoint"),
        Index("idx_push_user_active", "user_id", "is_active"),
    )
