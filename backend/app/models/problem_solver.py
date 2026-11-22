"""AI Gaming Problem Solver Models (Phase 9).

Defines database entities for conversational troubleshooting:
- AIConversation: Tracks chat sessions, category, and optional hardware profile linkage.
- AIMessage: User questions and AI responses with step-by-step guidance, RAG citations, and attachments.
- AIResponseFeedback: User rating and reporting mechanism.
- AIKnowledgeSource & AIKnowledgeDocument: Grounded documentation and verified troubleshooting articles.
"""

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
    func,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import GUID


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=True, index=True)  # Nullable for anonymous conversations
    title = Column(String(255), nullable=False, default="Gaming Technical Issue")
    status = Column(String(30), nullable=False, default="ACTIVE")  # ACTIVE, ARCHIVED, CLOSED
    category = Column(String(50), nullable=True)  # E.g. Game Crashes, Low FPS, Installation
    include_hardware_profile = Column(Boolean, nullable=False, default=False)
    hardware_profile_id = Column(
        GUID(), ForeignKey("pc_hardware_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    messages = relationship(
        "AIMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AIMessage.created_at",
    )
    feedback = relationship(
        "AIResponseFeedback",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )
    hardware_profile = relationship("PCHardwareProfile")

    __table_args__ = (
        Index("idx_ai_conversations_user_updated", "user_id", "updated_at"),
    )


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        GUID(), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(GUID(), nullable=True, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    message_content = Column(Text, nullable=False)

    # Attachment metadata (for error screenshots)
    attachment_url = Column(String(1024), nullable=True)
    attachment_filename = Column(String(255), nullable=True)
    attachment_mime = Column(String(50), nullable=True)
    attachment_size = Column(Integer, nullable=True)

    # Provider & Model tracking
    provider = Column(String(50), nullable=True)  # "mock", "openai", "gemini"
    model = Column(String(50), nullable=True)
    retrieved_sources = Column(JSON, nullable=True)  # List of cited knowledge sources

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")
    feedback = relationship(
        "AIResponseFeedback",
        back_populates="message",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_ai_messages_conv_created", "conversation_id", "created_at"),
    )


class AIResponseFeedback(Base):
    __tablename__ = "ai_response_feedback"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=True, index=True)
    conversation_id = Column(
        GUID(), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    message_id = Column(
        GUID(), ForeignKey("ai_messages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feedback_type = Column(String(30), nullable=False)  # HELPFUL, NOT_HELPFUL, REPORT
    feedback_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    conversation = relationship("AIConversation", back_populates="feedback")
    message = relationship("AIMessage", back_populates="feedback")


class AIKnowledgeSource(Base):
    __tablename__ = "ai_knowledge_sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    source_title = Column(String(255), nullable=False)
    source_url = Column(String(1024), nullable=True)
    publisher = Column(String(100), nullable=False)  # Rockstar Games Support, Microsoft, NVIDIA, etc.
    source_category = Column(String(50), nullable=False)  # OFFICIAL_SUPPORT, WINDOWS_DOCUMENTATION, GPU_DRIVERS
    verification_status = Column(String(30), nullable=False, default="VERIFIED")  # OFFICIAL, VERIFIED, COMMUNITY
    is_active = Column(Boolean, nullable=False, default=True)

    published_at = Column(DateTime(timezone=True), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    documents = relationship(
        "AIKnowledgeDocument",
        back_populates="source",
        cascade="all, delete-orphan",
    )


class AIKnowledgeDocument(Base):
    __tablename__ = "ai_knowledge_documents"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    source_id = Column(
        GUID(), ForeignKey("ai_knowledge_sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_title = Column(String(255), nullable=False)
    topic_category = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    keywords = Column(JSON, nullable=True)
    doc_metadata = Column(JSON, nullable=True)

    indexed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    source = relationship("AIKnowledgeSource", back_populates="documents")

    __table_args__ = (
        Index("idx_ai_docs_topic_indexed", "topic_category", "indexed_at"),
    )
