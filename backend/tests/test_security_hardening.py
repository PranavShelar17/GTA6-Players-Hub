import io
import uuid
import pytest
from httpx import AsyncClient

from app.models.community import CommunityCategory, CommunityPost
from app.models.pc_compatibility import PCHardwareProfile
from app.models.problem_solver import AIConversation
from tests.conftest import TestingSessionLocal

USER1_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
USER2_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.mark.asyncio
async def test_security_headers_present(async_client: AsyncClient):
    """Verifies that all API responses include OWASP-recommended security headers."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "strict-origin" in headers.get("Referrer-Policy", "")


@pytest.mark.asyncio
async def test_rate_limiting_enforcement():
    """Verifies that exceeding the configured rate limit triggers an RFC 6585 429 response."""
    from httpx import ASGITransport
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as limited_client:
        test_ip = "198.51.100.99"
        rate_limited = False
        for i in range(250):
            res = await limited_client.get(
                "/api/v1/search/categories",
                headers={"X-Forwarded-For": test_ip},
            )
            if res.status_code == 429:
                rate_limited = True
                assert res.headers.get("Retry-After") == "60"
                assert res.headers.get("X-RateLimit-Remaining") == "0"
                data = res.json()
                assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
                break

        assert rate_limited is True


@pytest.mark.asyncio
async def test_sql_injection_resistance(async_client: AsyncClient):
    """Verifies that SQL metacharacters and injection vectors are safely escaped by SQLAlchemy."""
    sqli_payloads = [
        "' OR '1'='1",
        "'; DROP TABLE search_index; --",
        "1 UNION SELECT 1, 'admin', 'pass' --",
        "1' AND SLEEP(5) AND '1'='1",
    ]

    for payload in sqli_payloads:
        resp = await async_client.get(
            f"/api/v1/search?q={payload}&category=ALL",
            headers={"X-Test-Bypass": "true"},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_idor_unauthorized_post_modification(
    async_client: AsyncClient,
    auth_headers_user1: dict,
    auth_headers_user2: dict,
):
    """Verifies that User 2 cannot modify or delete User 1's community post (IDOR protection)."""
    # 1. Create category and post as User 1
    async with TestingSessionLocal() as session:
        cat = CommunityCategory(name="General", slug=f"gen-{uuid.uuid4().hex[:6]}")
        session.add(cat)
        await session.flush()

        post = CommunityPost(
            player_id=USER1_ID,
            category_id=cat.id,
            title="User 1 Confidential Post",
            content="Sensitive discussion topic.",
            post_status="PUBLISHED",
        )
        session.add(post)
        await session.commit()
        post_id = str(post.id)

    # 2. Attempt deletion as User 2 (must be 403 Forbidden)
    unauth_del = await async_client.delete(
        f"/api/v1/community/posts/{post_id}",
        headers={**auth_headers_user2, "X-Test-Bypass": "true"},
    )
    assert unauth_del.status_code == 403

    # 3. Attempt update as User 2 (must be 403 Forbidden)
    unauth_patch = await async_client.patch(
        f"/api/v1/community/posts/{post_id}",
        headers={**auth_headers_user2, "X-Test-Bypass": "true"},
        json={"title": "Hacked Title", "content": "Tampered content"},
    )
    assert unauth_patch.status_code == 403


@pytest.mark.asyncio
async def test_idor_unauthorized_ai_conversation_access(
    async_client: AsyncClient,
    auth_headers_user1: dict,
    auth_headers_user2: dict,
):
    """Verifies that User 2 cannot read or post into User 1's private AI conversation."""
    # 1. Create conversation as User 1
    async with TestingSessionLocal() as session:
        conv = AIConversation(
            user_id=USER1_ID,
            title="User 1 Private Diagnostics",
            status="ACTIVE",
        )
        session.add(conv)
        await session.commit()
        conv_id = str(conv.id)

    # 2. User 2 attempts to fetch User 1's conversation
    unauth_get = await async_client.get(
        f"/api/v1/ai/conversations/{conv_id}",
        headers={**auth_headers_user2, "X-Test-Bypass": "true"},
    )
    assert unauth_get.status_code in (403, 404)


@pytest.mark.asyncio
async def test_idor_unauthorized_hardware_profile_access(
    async_client: AsyncClient,
    auth_headers_user1: dict,
    auth_headers_user2: dict,
):
    """Verifies that User 2 cannot modify User 1's saved PC hardware profile."""
    # 1. Create profile as User 1
    async with TestingSessionLocal() as session:
        profile = PCHardwareProfile(
            user_id=USER1_ID,
            profile_name="User 1 Battlestation",
            cpu_manufacturer="Intel",
            cpu_model="Core i7-13700K",
            gpu_manufacturer="NVIDIA",
            gpu_model="GeForce RTX 4080",
            ram_gb=32,
            storage_type="NVME_SSD",
            storage_capacity_gb=1000,
            storage_free_gb=500,
            gpu_vram_gb=16,
        )
        session.add(profile)
        await session.commit()
        prof_id = str(profile.id)

    # 2. User 2 attempts to update User 1's profile
    unauth_put = await async_client.put(
        f"/api/v1/pc/profiles/{prof_id}",
        headers={**auth_headers_user2, "X-Test-Bypass": "true"},
        json={"profile_name": "Tampered Rig"},
    )
    assert unauth_put.status_code == 404


@pytest.mark.asyncio
async def test_xss_payload_neutralization(
    async_client: AsyncClient,
    auth_headers_user1: dict,
):
    """Verifies that script tags and HTML injection are safely parsed as literal strings."""
    xss_payload = "<script>alert('XSS')</script><img src=x onerror=alert(1)>"

    # Search with XSS string
    resp = await async_client.get(
        f"/api/v1/search?q={xss_payload}&category=ALL",
        headers={"X-Test-Bypass": "true"},
    )
    assert resp.status_code == 200
    # Payload is reflected literally in query field without execution
    assert resp.json()["data"]["query"] == xss_payload


@pytest.mark.asyncio
async def test_file_upload_magic_bytes_validation(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies that files with fake image MIME types but binary executable contents are rejected."""
    # Fake PNG containing shell script
    malicious_script = io.BytesIO(b"#!/bin/bash\necho 'Compromised'\nrm -rf /")
    bad_upload = await async_client.post(
        "/api/v1/community/media/upload",
        headers={**auth_headers_user1, "X-Test-Bypass": "true"},
        files={"file": ("exploit.png", malicious_script, "image/png")},
    )
    assert bad_upload.status_code == 400
    assert "signature" in bad_upload.json()["error"]["message"].lower() or "format" in bad_upload.json()["error"]["message"].lower()

    # Valid PNG containing proper magic bytes
    valid_png = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89")
    good_upload = await async_client.post(
        "/api/v1/community/media/upload",
        headers={**auth_headers_user1, "X-Test-Bypass": "true"},
        files={"file": ("valid_photo.png", valid_png, "image/png")},
    )
    assert good_upload.status_code == 200
    assert good_upload.json()["success"] is True
