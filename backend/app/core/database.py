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
