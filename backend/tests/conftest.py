import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
import app.models  # Ensure all model tables are registered in Base.metadata
from app.main import app

# In-memory SQLite async engine for test isolation with shared cache
TEST_DATABASE_URL = "sqlite+aiosqlite:///file:test_memdb?mode=memory&cache=shared&uri=true"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", headers={"X-Test-Bypass": "true"}) as client:
        yield client


@pytest.fixture
def auth_headers_user1():
    # User 1 token delimited by '::'
    token = "test-token::11111111-1111-1111-1111-111111111111::player1@example.com"
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user2():
    # User 2 token delimited by '::'
    token = "test-token::22222222-2222-2222-2222-222222222222::player2@example.com"
    return {"Authorization": f"Bearer {token}"}
