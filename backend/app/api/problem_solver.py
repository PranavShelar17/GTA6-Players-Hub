"""AI Gaming Problem Solver API Router (Phase 9).

Endpoints for:
- AI service status (/ai/status)
- Conversation sessions (/ai/conversations)
- Message processing & step-by-step guidance (/ai/conversations/{id}/messages)
- Screenshot attachments (/ai/attachments)
- AI response feedback & reporting (/ai/feedback)
"""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user, get_optional_current_user
from app.schemas.problem_solver import (
    AIConversationCreate,
    AIConversationDetail,
    AIConversationRead,
    AIConversationUpdate,
    AIFeedbackCreate,
    AIFeedbackRead,
    AIMessageCreate,
    AIMessageRead,
    AIServiceStatusResponse,
    AttachmentUploadResponse,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Gaming Problem Solver"])


# -----------------------------------------------------------------------------
# 1. AI Service Status (Public)
# -----------------------------------------------------------------------------
@router.get("/status", response_model=AIServiceStatusResponse)
async def get_ai_service_status(
    db: AsyncSession = Depends(get_db),
):
    """Returns AI provider operational status, model, and indexed documentation count."""
    return await AIService.get_service_status(db)


# -----------------------------------------------------------------------------
# 2. Conversation Sessions
# -----------------------------------------------------------------------------
@router.post("/conversations", response_model=AIConversationDetail, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conv_in: AIConversationCreate,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Starts a new troubleshooting session (supports authenticated players and anonymous visitors)."""
    user_id = current_user.id if current_user else None
    return await AIService.create_conversation(db, user_id, conv_in)


@router.get("/conversations", response_model=List[AIConversationRead])
async def list_conversations(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists saved troubleshooting conversations for the authenticated player."""
    return await AIService.list_conversations(db, current_user.id, limit=limit, offset=offset)


@router.get("/conversations/{conversation_id}", response_model=AIConversationDetail)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves full conversation details and historical messages (ownership enforced)."""
    user_id = current_user.id if current_user else None
    return await AIService.get_conversation(db, conversation_id, user_id)


@router.patch("/conversations/{conversation_id}", response_model=AIConversationRead)
async def update_conversation(
    conversation_id: uuid.UUID,
    update_in: AIConversationUpdate,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates conversation title, category, or status (ownership enforced)."""
    user_id = current_user.id if current_user else None
    return await AIService.update_conversation(db, conversation_id, user_id, update_in)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a troubleshooting conversation (ownership enforced)."""
    user_id = current_user.id if current_user else None
    await AIService.delete_conversation(db, conversation_id, user_id)
    return None


# -----------------------------------------------------------------------------
# 3. Message Processing & AI Responses
# -----------------------------------------------------------------------------
@router.post("/conversations/{conversation_id}/messages", response_model=AIMessageRead)
async def send_message(
    conversation_id: uuid.UUID,
    message_in: AIMessageCreate,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits player question, executes RAG retrieval, runs AI provider, and returns step-by-step guidance."""
    user_id = current_user.id if current_user else None
    return await AIService.send_message(db, conversation_id, user_id, message_in)


# -----------------------------------------------------------------------------
# 4. Attachments (Error Screenshots)
# -----------------------------------------------------------------------------
@router.post("/attachments", response_model=AttachmentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    file: UploadFile = File(...),
):
    """Uploads a screenshot attachment (PNG, JPG, JPEG, WebP up to 10MB) for AI diagnostic analysis."""
    return await AIService.upload_attachment(file)


# -----------------------------------------------------------------------------
# 5. Response Feedback
# -----------------------------------------------------------------------------
@router.post("/feedback", response_model=AIFeedbackRead, status_code=status.HTTP_201_CREATED)
async def submit_response_feedback(
    feedback_in: AIFeedbackCreate,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Records player helpful/unhelpful rating or response report."""
    user_id = current_user.id if current_user else None
    return await AIService.submit_feedback(db, user_id, feedback_in)
