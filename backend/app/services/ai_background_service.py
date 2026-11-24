from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.automation import DataIngestionLog, DataSourceStatus
from app.models.problem_solver import (
    AIConversation,
    AIKnowledgeDocument,
    AIKnowledgeSource,
    AIMessage,
    AIResponseFeedback,
)
from app.services.ai_knowledge_service import AIKnowledgeService


class AIBackgroundService:
    """Service orchestrating asynchronous knowledge indexing and AI system metrics aggregation."""

    @staticmethod
    async def run_knowledge_maintenance(session: AsyncSession) -> Dict[str, Any]:
        """Refreshes, indexes, and audits technical troubleshooting documentation for RAG retrieval."""
        now = datetime.now(timezone.utc)
        ingestion_log = DataIngestionLog(
            source_id="AI Knowledge Base",
            data_category="AI_KNOWLEDGE",
            started_at=now,
            status="RUNNING",
        )
        session.add(ingestion_log)
        await session.flush()

        src_status_stmt = select(DataSourceStatus).where(
            DataSourceStatus.source_name == "AI Problem Solver Knowledge Base"
        )
        src_status_res = await session.execute(src_status_stmt)
        src_status = src_status_res.scalar_one_or_none()
        if not src_status:
            src_status = DataSourceStatus(
                source_name="AI Problem Solver Knowledge Base",
                source_type="AI",
                source_url="https://support.rockstargames.com",
                health_status="HEALTHY",
                created_at=now,
                updated_at=now,
            )
            session.add(src_status)
            await session.flush()

        src_status.last_attempted_at = now

        try:
            # Seed or verify baseline documentation
            seeded = await AIKnowledgeService.seed_initial_knowledge_base(session)

            # Query current doc count
            count_stmt = select(func.count(AIKnowledgeDocument.id))
            count_res = await session.execute(count_stmt)
            total_docs = count_res.scalar() or 0

            ingestion_log.records_retrieved = total_docs
            ingestion_log.records_created = seeded
            ingestion_log.status = "SUCCESS"

            src_status.last_successful_at = now
            src_status.last_error = None
            src_status.health_status = "HEALTHY"

        except Exception as err:
            logger.error(f"Error maintaining AI knowledge base: {err}")
            src_status.last_error = str(err)
            src_status.health_status = "DEGRADED"
            ingestion_log.status = "FAILED"
            ingestion_log.records_failed += 1

        ingestion_log.completed_at = datetime.now(timezone.utc)
        await session.commit()

        return {
            "total_documents": total_docs if 'total_docs' in locals() else 0,
            "newly_indexed": seeded if 'seeded' in locals() else 0,
            "timestamp": now.isoformat(),
        }

    @staticmethod
    async def aggregate_ai_usage_metrics(session: AsyncSession) -> Dict[str, Any]:
        """Calculates system metrics: total conversations, messages, and feedback quality ratios."""
        now = datetime.now(timezone.utc)

        conv_stmt = select(func.count(AIConversation.id))
        conv_res = await session.execute(conv_stmt)
        total_conversations = conv_res.scalar() or 0

        msg_stmt = select(func.count(AIMessage.id))
        msg_res = await session.execute(msg_stmt)
        total_messages = msg_res.scalar() or 0

        feedback_stmt = select(
            AIResponseFeedback.feedback_type,
            func.count(AIResponseFeedback.id),
        ).group_by(AIResponseFeedback.feedback_type)
        feedback_res = await session.execute(feedback_stmt)
        feedback_counts = {row[0]: row[1] for row in feedback_res.all()}

        return {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "feedback_summary": feedback_counts,
            "calculated_at": now.isoformat(),
        }
