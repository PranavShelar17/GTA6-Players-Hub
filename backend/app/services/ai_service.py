"""AI Problem Solver Service Layer (Phase 9).

Orchestrates conversation lifecycle, conversational context, hardware profile injection,
knowledge retrieval, AI provider communication, attachment handling, and feedback.
"""

from datetime import datetime, timezone
import os
import shutil
from typing import Any, Dict, List, Optional
import uuid
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.logging import logger
from app.models.pc_compatibility import PCHardwareProfile
from app.models.problem_solver import (
    AIConversation,
    AIKnowledgeDocument,
    AIMessage,
    AIResponseFeedback,
)
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
    SourceReference,
)
from app.services.ai_knowledge_service import AIKnowledgeService
from app.services.ai_provider import get_ai_provider

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "ai_attachments")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class AIService:

    # -------------------------------------------------------------------------
    # 1. Service Status
    # -------------------------------------------------------------------------
    @staticmethod
    async def get_service_status(session: AsyncSession) -> AIServiceStatusResponse:
        """Reports the provider status, model, and indexed documentation volume."""
        provider_name = (settings.AI_PROVIDER or "mock").lower()
        api_key_set = bool(settings.AI_API_KEY)
        doc_count = await AIKnowledgeService.get_document_count(session)

        if provider_name in ["openai", "gemini"] and api_key_set:
            status_str = "LIVE"
            notice = f"Operating live with {provider_name.upper()} ({settings.AI_MODEL})."
        elif api_key_set:
            status_str = "LIVE"
            notice = f"Operating live with custom provider ({settings.AI_MODEL})."
        else:
            status_str = "MOCK_MODE"
            notice = (
                "Running in Provider-Independent Diagnostics Mode. All 8 problem categories, "
                "hardware balance diagnostics, and safe step-by-step troubleshooting rules are fully active."
            )

        return AIServiceStatusResponse(
            status=status_str,
            provider=provider_name,
            model=settings.AI_MODEL or "gpt-4o-mini",
            is_vision_supported=True,
            knowledge_base_documents=doc_count,
            notice=notice,
        )

    # -------------------------------------------------------------------------
    # 2. Conversation Management
    # -------------------------------------------------------------------------
    @staticmethod
    async def create_conversation(
        session: AsyncSession,
        user_id: Optional[uuid.UUID],
        conv_in: AIConversationCreate,
    ) -> AIConversationDetail:
        """Initializes a new troubleshooting conversation session."""
        title = conv_in.title or "Gaming Technical Issue"
        if conv_in.initial_message and len(conv_in.initial_message.strip()) > 0:
            words = conv_in.initial_message.strip().split()
            title = " ".join(words[:6]) + ("..." if len(words) > 6 else "")

        hw_profile_id: Optional[uuid.UUID] = None
        if conv_in.hardware_profile_id:
            try:
                hw_profile_id = uuid.UUID(conv_in.hardware_profile_id)
            except ValueError:
                hw_profile_id = None

        conversation = AIConversation(
            user_id=user_id,
            title=title,
            category=conv_in.category or "General Gaming Support",
            include_hardware_profile=conv_in.include_hardware_profile,
            hardware_profile_id=hw_profile_id,
        )
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)
        conv_id = conversation.id

        # If initial message provided, process it immediately
        if conv_in.initial_message:
            await AIService.send_message(
                session=session,
                conversation_id=conv_id,
                user_id=user_id,
                message_in=AIMessageCreate(
                    message_content=conv_in.initial_message,
                    attachment_url=conv_in.attachment_url,
                    attachment_filename=conv_in.attachment_filename,
                    include_hardware_profile=conv_in.include_hardware_profile,
                    hardware_profile_id=str(hw_profile_id) if hw_profile_id else None,
                ),
            )

        return await AIService.get_conversation(session, conv_id, user_id)

    @staticmethod
    async def get_conversation(
        session: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
    ) -> AIConversationDetail:
        """Retrieves conversation detail and message history with ownership enforcement."""
        stmt = select(AIConversation).where(AIConversation.id == conversation_id)
        res = await session.execute(stmt)
        conv = res.scalars().first()

        if not conv:
            raise HTTPException(status_code=404, detail="Troubleshooting conversation not found")

        # Ownership check
        if conv.user_id and user_id and conv.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this conversation")

        # Explicitly query messages
        msg_stmt = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conversation_id)
            .order_by(AIMessage.created_at)
        )
        msg_res = await session.execute(msg_stmt)
        raw_messages = msg_res.scalars().all()

        messages_read: List[AIMessageRead] = []
        for m in raw_messages:
            sources: Optional[List[SourceReference]] = None
            if m.retrieved_sources and isinstance(m.retrieved_sources, list):
                sources = [SourceReference(**s) for s in m.retrieved_sources]

            messages_read.append(
                AIMessageRead(
                    id=str(m.id),
                    conversation_id=str(m.conversation_id),
                    user_id=str(m.user_id) if m.user_id else None,
                    role=m.role,
                    message_content=m.message_content,
                    attachment_url=m.attachment_url,
                    attachment_filename=m.attachment_filename,
                    attachment_mime=m.attachment_mime,
                    attachment_size=m.attachment_size,
                    provider=m.provider,
                    model=m.model,
                    retrieved_sources=sources,
                    created_at=m.created_at,
                )
            )

        hw_summary: Optional[Dict[str, Any]] = None
        if conv.hardware_profile_id:
            p_stmt = select(PCHardwareProfile).where(PCHardwareProfile.id == conv.hardware_profile_id)
            p_res = await session.execute(p_stmt)
            p = p_res.scalars().first()
            if p:
                hw_summary = {
                    "cpu": f"{p.cpu_manufacturer} {p.cpu_model}",
                    "gpu": f"{p.gpu_manufacturer} {p.gpu_model} ({p.gpu_vram_gb} GB VRAM)",
                    "ram": f"{p.ram_gb} GB {p.ram_type or ''}".strip(),
                    "storage": f"{p.storage_type.replace('_', ' ')} ({p.storage_free_gb} GB free)",
                    "os": f"{p.operating_system} ({p.os_architecture})",
                    "display": f"{p.display_resolution} @ {p.refresh_rate or 60}Hz",
                }

        return AIConversationDetail(
            id=str(conv.id),
            user_id=str(conv.user_id) if conv.user_id else None,
            title=conv.title,
            status=conv.status,
            category=conv.category,
            include_hardware_profile=conv.include_hardware_profile,
            hardware_profile_id=str(conv.hardware_profile_id) if conv.hardware_profile_id else None,
            message_count=len(messages_read),
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=messages_read,
            hardware_summary=hw_summary,
        )

    @staticmethod
    async def list_conversations(
        session: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AIConversationRead]:
        """Lists conversations belonging to the authenticated player."""
        stmt = (
            select(AIConversation)
            .where(AIConversation.user_id == user_id)
            .order_by(desc(AIConversation.updated_at))
            .limit(limit)
            .offset(offset)
        )
        res = await session.execute(stmt)
        convs = res.scalars().all()

        return [
            AIConversationRead(
                id=str(c.id),
                user_id=str(c.user_id),
                title=c.title,
                status=c.status,
                category=c.category,
                include_hardware_profile=c.include_hardware_profile,
                hardware_profile_id=str(c.hardware_profile_id) if c.hardware_profile_id else None,
                message_count=0,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in convs
        ]

    @staticmethod
    async def update_conversation(
        session: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        update_in: AIConversationUpdate,
    ) -> AIConversationRead:
        """Updates conversation title, category, or status."""
        stmt = select(AIConversation).where(AIConversation.id == conversation_id)
        res = await session.execute(stmt)
        conv = res.scalars().first()

        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if conv.user_id and user_id and conv.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this conversation")

        if update_in.title is not None:
            conv.title = update_in.title
        if update_in.category is not None:
            conv.category = update_in.category
        if update_in.status is not None:
            conv.status = update_in.status

        conv.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(conv)

        return AIConversationRead(
            id=str(conv.id),
            user_id=str(conv.user_id) if conv.user_id else None,
            title=conv.title,
            status=conv.status,
            category=conv.category,
            include_hardware_profile=conv.include_hardware_profile,
            hardware_profile_id=str(conv.hardware_profile_id) if conv.hardware_profile_id else None,
            message_count=0,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )

    @staticmethod
    async def delete_conversation(
        session: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
    ) -> bool:
        """Deletes a conversation and associated message history."""
        stmt = select(AIConversation).where(AIConversation.id == conversation_id)
        res = await session.execute(stmt)
        conv = res.scalars().first()

        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if conv.user_id and user_id and conv.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this conversation")

        await session.delete(conv)
        await session.commit()
        return True

    # -------------------------------------------------------------------------
    # 3. Message Processing & AI Response Generation
    # -------------------------------------------------------------------------
    @staticmethod
    async def send_message(
        session: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        message_in: AIMessageCreate,
    ) -> AIMessageRead:
        """Processes player question, executes RAG retrieval, runs AI provider, and returns answer."""
        stmt = select(AIConversation).where(AIConversation.id == conversation_id)
        res = await session.execute(stmt)
        conv = res.scalars().first()

        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if conv.user_id and user_id and conv.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this conversation")

        # 1. Record User Message
        user_msg = AIMessage(
            conversation_id=conversation_id,
            user_id=user_id,
            role="user",
            message_content=message_in.message_content,
            attachment_url=message_in.attachment_url,
            attachment_filename=message_in.attachment_filename,
            attachment_mime=message_in.attachment_mime,
            attachment_size=message_in.attachment_size,
        )
        session.add(user_msg)
        await session.flush()

        # 2. Formulate Hardware Context (with player consent)
        hardware_context: Optional[str] = None
        should_include_hw = (
            message_in.include_hardware_profile
            if message_in.include_hardware_profile is not None
            else conv.include_hardware_profile
        )

        if should_include_hw:
            target_profile_id = (
                uuid.UUID(message_in.hardware_profile_id)
                if message_in.hardware_profile_id
                else conv.hardware_profile_id
            )

            # If no explicit profile linked, look up user's primary profile from Phase 8
            if not target_profile_id and user_id:
                prof_stmt = (
                    select(PCHardwareProfile)
                    .where(PCHardwareProfile.user_id == user_id)
                    .order_by(desc(PCHardwareProfile.is_primary), desc(PCHardwareProfile.created_at))
                )
                prof_res = await session.execute(prof_stmt)
                primary_p = prof_res.scalars().first()
                if primary_p:
                    target_profile_id = primary_p.id

            if target_profile_id:
                p_stmt = select(PCHardwareProfile).where(PCHardwareProfile.id == target_profile_id)
                p_res = await session.execute(p_stmt)
                prof = p_res.scalars().first()
                if prof:
                    hardware_context = (
                        f"CPU: {prof.cpu_manufacturer} {prof.cpu_model} ({prof.cpu_cores or 'N/A'} cores), "
                        f"GPU: {prof.gpu_manufacturer} {prof.gpu_model} ({prof.gpu_vram_gb}GB VRAM, {prof.gpu_type}), "
                        f"RAM: {prof.ram_gb}GB {prof.ram_type or ''}, "
                        f"Storage: {prof.storage_type.replace('_', ' ')} ({prof.storage_free_gb}GB free), "
                        f"OS: {prof.operating_system} {prof.os_architecture}, Display: {prof.display_resolution}"
                    )

        # 3. RAG Retrieval from Knowledge Base
        retrieved_sources = await AIKnowledgeService.retrieve_relevant_sources(
            session=session,
            query=message_in.message_content,
            category=conv.category,
            limit=2,
        )

        # 4. Formulate Conversation History (last 6 messages for context window efficiency)
        msg_stmt = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conversation_id)
            .order_by(desc(AIMessage.created_at))
            .limit(6)
        )
        msg_res = await session.execute(msg_stmt)
        recent_msgs = list(reversed(msg_res.scalars().all()))

        history_payload = [
            {"role": m.role, "content": m.message_content}
            for m in recent_msgs
            if m.role in ["user", "assistant"]
        ]

        # 5. Execute Provider-Independent AI Call
        provider = get_ai_provider()
        provider_name = (settings.AI_PROVIDER or "mock").lower()
        model_name = settings.AI_MODEL or "gpt-4o-mini"

        assistant_text = await provider.generate_response(
            user_message=message_in.message_content,
            conversation_history=history_payload,
            hardware_context=hardware_context,
            attachment_url=message_in.attachment_url,
            retrieved_sources=retrieved_sources,
        )

        # 6. Record Assistant Response in Database
        assistant_msg = AIMessage(
            conversation_id=conversation_id,
            user_id=None,
            role="assistant",
            message_content=assistant_text,
            provider=provider_name,
            model=model_name,
            retrieved_sources=[s.model_dump() for s in retrieved_sources] if retrieved_sources else None,
        )
        session.add(assistant_msg)

        # Update conversation timestamp & auto-update title if initial
        conv.updated_at = datetime.now(timezone.utc)
        if len(recent_msgs) <= 2 and conv.title == "Gaming Technical Issue":
            words = message_in.message_content.strip().split()
            conv.title = " ".join(words[:6]) + ("..." if len(words) > 6 else "")

        await session.commit()
        await session.refresh(assistant_msg)

        return AIMessageRead(
            id=str(assistant_msg.id),
            conversation_id=str(assistant_msg.conversation_id),
            user_id=None,
            role=assistant_msg.role,
            message_content=assistant_msg.message_content,
            provider=assistant_msg.provider,
            model=assistant_msg.model,
            retrieved_sources=retrieved_sources,
            created_at=assistant_msg.created_at,
        )

    # -------------------------------------------------------------------------
    # 4. Response Feedback
    # -------------------------------------------------------------------------
    @staticmethod
    async def submit_feedback(
        session: AsyncSession,
        user_id: Optional[uuid.UUID],
        feedback_in: AIFeedbackCreate,
    ) -> AIFeedbackRead:
        """Records player rating or report on an AI response."""
        try:
            conv_uuid = uuid.UUID(feedback_in.conversation_id)
            msg_uuid = uuid.UUID(feedback_in.message_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid UUID format for conversation_id or message_id")

        feedback = AIResponseFeedback(
            user_id=user_id,
            conversation_id=conv_uuid,
            message_id=msg_uuid,
            feedback_type=feedback_in.feedback_type,
            feedback_reason=feedback_in.feedback_reason,
        )
        session.add(feedback)
        await session.commit()
        await session.refresh(feedback)

        return AIFeedbackRead(
            id=str(feedback.id),
            user_id=str(feedback.user_id) if feedback.user_id else None,
            conversation_id=str(feedback.conversation_id),
            message_id=str(feedback.message_id),
            feedback_type=feedback.feedback_type,
            feedback_reason=feedback.feedback_reason,
            created_at=feedback.created_at,
        )

    # -------------------------------------------------------------------------
    # 5. Attachment Uploading (Screenshots)
    # -------------------------------------------------------------------------
    @staticmethod
    async def upload_attachment(file: UploadFile) -> AttachmentUploadResponse:
        """Validates and stores screenshot attachments (PNG, JPG, JPEG, WebP up to 10MB)."""
        allowed_mimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
        if file.content_type not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{file.content_type}'. Supported: PNG, JPG, JPEG, WebP.",
            )

        content = await file.read()
        max_size = 10 * 1024 * 1024  # 10 MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed limit of 10 MB.",
            )

        mime_ext_map = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/webp": "webp",
        }
        ext = mime_ext_map.get(file.content_type.lower(), "png")
        saved_filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        return AttachmentUploadResponse(
            url=f"/uploads/ai_attachments/{saved_filename}",
            filename=file.filename or saved_filename,
            mime_type=file.content_type,
            size_bytes=len(content),
        )
