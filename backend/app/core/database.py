import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession, 
    async_sessionmaker, 
    create_async_engine
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

# Determine database engine
# If running in pytest or if DATABASE_URL starts with sqlite, use SQLite async engine.
# Otherwise, attempt PostgreSQL asyncpg connection with resilient error handling.
database_url = settings.DATABASE_URL
engine_kwargs = {"echo": False}

if "sqlite" in database_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Tuned connection pool for PostgreSQL as defined in ARCHITECTURE.md
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 5
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(database_url, **engine_kwargs)
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def init_db():
    """Initializes schema tables if necessary (useful for local dev and testing)."""
    try:
        # Import models so Base.metadata is populated
        import app.models  # noqa: F401
        from app.services.news_collector import seed_initial_verified_news

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")

        # Seed initial data for local development if empty
        async with async_session_factory() as session:
            try:
                count = await seed_initial_verified_news(session)
                if count > 0:
                    logger.info(f"Seeded {count} initial verified news articles.")
            except Exception as seed_err:
                logger.warning(f"Seed news warning: {seed_err}")

            try:
                from app.services.price_collector import seed_initial_price_data
                price_count = await seed_initial_price_data(session)
                if price_count > 0:
                    logger.info(f"Seeded {price_count} initial verified price observations.")
            except Exception as price_seed_err:
                logger.warning(f"Seed price warning: {price_seed_err}")

            try:
                from app.services.event_collector import seed_initial_events
                event_count = await seed_initial_events(session)
                if event_count > 0:
                    logger.info(f"Seeded {event_count} initial verified events.")
            except Exception as event_seed_err:
                logger.warning(f"Seed event warning: {event_seed_err}")

            try:
                from app.services.community_collector import (
                    seed_community_categories,
                    seed_initial_verified_posts,
                )
                cat_count = await seed_community_categories(session)
                if cat_count > 0:
                    logger.info(f"Seeded {cat_count} community categories.")
                post_count = await seed_initial_verified_posts(session)
                if post_count > 0:
                    logger.info(f"Seeded {post_count} initial verified community posts.")
            except Exception as comm_seed_err:
                logger.warning(f"Seed community warning: {comm_seed_err}")

            try:
                from app.services.pc_requirements_collector import seed_initial_system_requirements
                pc_req_count = await seed_initial_system_requirements(session)
                if pc_req_count > 0:
                    logger.info(f"Seeded {pc_req_count} baseline GTA 6 PC requirements entries.")
            except Exception as pc_seed_err:
                logger.warning(f"Seed PC requirements warning: {pc_seed_err}")

            try:
                from app.services.ai_knowledge_service import AIKnowledgeService
                doc_count = await AIKnowledgeService.seed_initial_knowledge_base(session)
                if doc_count > 0:
                    logger.info(f"Seeded {doc_count} verified technical troubleshooting knowledge documents.")
            except Exception as ai_seed_err:
                logger.warning(f"Seed AI knowledge base warning: {ai_seed_err}")
    except Exception as e:
        logger.warning(f"Database schema initialization warning (e.g. offline PG): {e}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database session injection."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
