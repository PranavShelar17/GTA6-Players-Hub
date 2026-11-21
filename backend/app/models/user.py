import uuid
from sqlalchemy import (
    Boolean, 
    Column, 
    DateTime, 
    Integer, 
    String, 
    Text, 
    func
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
from app.core.database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


class PlayerProfile(Base):
    __tablename__ = "player_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), unique=True, nullable=False, index=True)
    username = Column(String(32), unique=True, nullable=False, index=True)
    display_name = Column(String(64), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    bio = Column(String(500), nullable=True)
    country_code = Column(String(3), nullable=True)
    preferred_platform = Column(String(20), nullable=False, default="PC")
    preferred_language = Column(String(10), nullable=False, default="en")
    profile_visibility = Column(String(20), nullable=False, default="public")
    reputation_score = Column(Integer, nullable=False, default=0)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PlayerPreferences(Base):
    __tablename__ = "player_preferences"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), unique=True, nullable=False, index=True)
    preferred_country = Column(String(3), nullable=False, default="USA")
    preferred_currency = Column(String(3), nullable=False, default="USD")
    preferred_platform = Column(String(20), nullable=False, default="PC")
    preferred_edition = Column(String(50), nullable=False, default="Standard Edition")
    preferred_language = Column(String(10), nullable=False, default="en")
    email_notifications = Column(Boolean, nullable=False, default=True)
    push_notifications = Column(Boolean, nullable=False, default=False)
    community_notifications = Column(Boolean, nullable=False, default=True)
    news_notifications = Column(Boolean, nullable=False, default=True)
    price_alert_notifications = Column(Boolean, nullable=False, default=True)
    event_notifications = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PlayerActivity(Base):
    __tablename__ = "player_activities"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
