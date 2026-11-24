import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.integrations.news_sources import NEWS_SOURCE_REGISTRY, NewsSourceConnector
from app.models.automation import DataIngestionLog, DataSourceStatus
from app.models.news import NewsArticle, NewsCategory, NewsSource
from app.services.data_validation_service import DataValidationService


class NewsIngestionService:
    """Service orchestrating automated collection, validation, and deduplication of news articles."""

    @staticmethod
    async def run_news_ingestion(session: AsyncSession) -> Dict[str, Any]:
        """Runs the automated news collection pipeline across all approved sources."""
        connector = NewsSourceConnector()
        total_retrieved = 0
        total_created = 0
        total_skipped = 0
        total_failed = 0
        now = datetime.now(timezone.utc)

        # Ensure categories exist
        category_map: Dict[str, uuid.UUID] = {}
        cat_stmt = select(NewsCategory)
        cat_res = await session.execute(cat_stmt)
        for cat in cat_res.scalars().all():
            category_map[cat.slug] = cat.id

        # If categories empty, query fallback
        default_cat_id = next(iter(category_map.values()), None)

        for source_cfg in NEWS_SOURCE_REGISTRY:
            source_name = source_cfg["source_name"]
            ingestion_log = DataIngestionLog(
                source_id=source_name,
                data_category="NEWS",
                started_at=now,
                status="RUNNING",
            )
            session.add(ingestion_log)
            await session.flush()

            # Update or create DataSourceStatus
            src_status_stmt = select(DataSourceStatus).where(
                DataSourceStatus.source_name == source_name
            )
            src_status_res = await session.execute(src_status_stmt)
            src_status = src_status_res.scalar_one_or_none()
            if not src_status:
                src_status = DataSourceStatus(
                    source_name=source_name,
                    source_type="NEWS",
                    source_url=source_cfg.get("feed_url"),
                    health_status="HEALTHY",
                    created_at=now,
                    updated_at=now,
                )
                session.add(src_status)
                await session.flush()

            src_status.last_attempted_at = now

            try:
                raw_items = await connector.fetch_feed(source_cfg)
                ingestion_log.records_retrieved = len(raw_items)
                total_retrieved += len(raw_items)

                # Get or create NewsSource model in news_sources table
                ns_stmt = select(NewsSource).where(NewsSource.name == source_name)
                ns_res = await session.execute(ns_stmt)
                db_source = ns_res.scalar_one_or_none()
                if not db_source:
                    db_source = NewsSource(
                        name=source_name,
                        website_url=source_cfg.get("feed_url", "https://gta6playerhub.local"),
                        source_type=source_cfg.get("source_type", "OFFICIAL"),
                        trust_level=source_cfg.get("verification_status", "OFFICIAL"),
                        feed_url=source_cfg.get("feed_url"),
                        collection_method="RSS",
                        is_enabled=True,
                    )
                    session.add(db_source)
                    await session.flush()

                for raw_item in raw_items:
                    is_valid, normalized, errs = DataValidationService.validate_news_item(raw_item)
                    if not is_valid:
                        ingestion_log.records_failed += 1
                        total_failed += 1
                        logger.warning(f"News validation failed for item from {source_name}: {errs}")
                        continue

                    # Check for duplicate canonical URL
                    canon_url = normalized["canonical_url"]
                    dup_stmt = select(NewsArticle.id).where(NewsArticle.canonical_url == canon_url)
                    dup_res = await session.execute(dup_stmt)
                    if dup_res.scalar_one_or_none():
                        ingestion_log.records_skipped += 1
                        total_skipped += 1
                        continue

                    # Determine slug
                    base_slug = normalized["title"].lower()
                    base_slug = "".join(c if c.isalnum() or c in "-" else "-" for c in base_slug)
                    base_slug = "-".join(filter(None, base_slug.split("-")))[:120]
                    unique_slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

                    cat_id = category_map.get(normalized["category_slug"], default_cat_id)
                    article = NewsArticle(
                        title=normalized["title"],
                        slug=unique_slug,
                        summary=normalized["summary"],
                        content=normalized["content"],
                        source_id=db_source.id,
                        category_id=cat_id,
                        verification_status=normalized["verification_status"],
                        original_article_url=normalized["source_url"],
                        canonical_url=canon_url,
                        original_published_at=normalized["published_at"],
                        publication_status="PUBLISHED",
                    )
                    session.add(article)
                    ingestion_log.records_created += 1
                    total_created += 1

                # Source success update
                db_source.last_crawled_at = now
                db_source.last_error = None
                src_status.last_successful_at = now
                src_status.last_error = None
                src_status.health_status = "HEALTHY"
                ingestion_log.status = "SUCCESS"

            except Exception as src_err:
                logger.error(f"Error ingesting news source {source_name}: {src_err}")
                src_status.last_error = str(src_err)
                src_status.health_status = "DEGRADED"
                ingestion_log.status = "FAILED"
                ingestion_log.records_failed += 1
                total_failed += 1

            ingestion_log.completed_at = datetime.now(timezone.utc)
            await session.commit()

        return {
            "retrieved": total_retrieved,
            "created": total_created,
            "skipped": total_skipped,
            "failed": total_failed,
            "timestamp": now.isoformat(),
        }
