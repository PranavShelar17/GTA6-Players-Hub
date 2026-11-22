"""Pydantic Schemas for AI Gaming Problem Solver (Phase 9)."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Knowledge Base & Source References
# -----------------------------------------------------------------------------
class SourceReference(BaseModel):
    title: str
    publisher: str
    url: Optional[str] = None
    category: str
    verification_status: str = "VERIFIED"


class KnowledgeSourceRead(BaseModel):
    id: str
    source_title: str
    source_url: Optional[str] = None
    publisher: str
    source_category: str
    verification_status: str
    is_active: bool
    last_verified_at: datetime


class KnowledgeDocumentRead(BaseModel):
    id: str
    source_id: str
    document_title: str
    topic_category: str
    content: str
    keywords: Optional[List[str]] = None
    indexed_at: datetime


# -----------------------------------------------------------------------------
# Messages
# -----------------------------------------------------------------------------
class AIMessageCreate(BaseModel):
    message_content: str = Field(..., min_length=1, max_length=4000)
    attachment_url: Optional[str] = None
    attachment_filename: Optional[str] = None
    attachment_mime: Optional[str] = None
    attachment_size: Optional[int] = None
    include_hardware_profile: Optional[bool] = None
    hardware_profile_id: Optional[str] = None


class AIMessageRead(BaseModel):
    id: str
    conversation_id: str
    user_id: Optional[str] = None
    role: str  # "user", "assistant", "system"
    message_content: str
    attachment_url: Optional[str] = None
    attachment_filename: Optional[str] = None
    attachment_mime: Optional[str] = None
    attachment_size: Optional[int] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    retrieved_sources: Optional[List[SourceReference]] = None
    created_at: datetime


# -----------------------------------------------------------------------------
# Conversations
# -----------------------------------------------------------------------------
class AIConversationCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=50)
    include_hardware_profile: bool = False
    hardware_profile_id: Optional[str] = None
    initial_message: Optional[str] = Field(None, max_length=4000)
    attachment_url: Optional[str] = None
    attachment_filename: Optional[str] = None


class AIConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, pattern="^(ACTIVE|ARCHIVED|CLOSED)$")


class AIConversationRead(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    status: str
    category: Optional[str] = None
    include_hardware_profile: bool
    hardware_profile_id: Optional[str] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime


class AIConversationDetail(AIConversationRead):
    messages: List[AIMessageRead] = []
    hardware_summary: Optional[Dict[str, Any]] = None


# -----------------------------------------------------------------------------
# Response Feedback
# -----------------------------------------------------------------------------
class AIFeedbackCreate(BaseModel):
    conversation_id: str
    message_id: str
    feedback_type: str = Field(..., pattern="^(HELPFUL|NOT_HELPFUL|REPORT)$")
    feedback_reason: Optional[str] = Field(None, max_length=1000)


class AIFeedbackRead(BaseModel):
    id: str
    user_id: Optional[str] = None
    conversation_id: str
    message_id: str
    feedback_type: str
    feedback_reason: Optional[str] = None
    created_at: datetime


# -----------------------------------------------------------------------------
# Attachments
# -----------------------------------------------------------------------------
class AttachmentUploadResponse(BaseModel):
    url: str
    filename: str
    mime_type: str
    size_bytes: int


# -----------------------------------------------------------------------------
# Service Status
# -----------------------------------------------------------------------------
class AIServiceStatusResponse(BaseModel):
    status: str  # "LIVE", "MOCK_MODE", "UNCONFIGURED"
    provider: str
    model: str
    is_vision_supported: bool
    knowledge_base_documents: int
    notice: str
