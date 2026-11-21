import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    assert payload["data"]["status"] == "healthy"
    assert "version" in payload["data"]
    assert "timestamp" in payload["data"]
    assert payload["meta"]["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_readiness_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health/ready")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "ready"
    assert payload["data"]["ready"] is True
    assert "configuration" in payload["data"]["dependencies"]


@pytest.mark.asyncio
async def test_404_error_envelope(async_client: AsyncClient):
    response = await async_client.get("/api/v1/non-existent-endpoint")
    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["data"] is None
    assert payload["error"]["code"] == "HTTP_404"
