import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_requirements_status_unconfirmed(async_client: AsyncClient):
    """Verifies that requirements status adheres to the anti-fabrication mandate."""
    res = await async_client.get("/api/v1/pc/requirements/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "NOT_YET_CONFIRMED"
    assert data["is_available"] is False
    assert data["publisher"] == "Rockstar Games"
    assert "Official GTA 6 PC system requirements have not yet been confirmed" in data["notice_message"]


@pytest.mark.asyncio
async def test_hardware_profile_crud_and_isolation(
    async_client: AsyncClient, auth_headers_user1, auth_headers_user2
):
    """Verifies profile creation, retrieval, updating, deletion, and ownership isolation."""
    # 1. User 1 creates profile
    payload = {
        "profile_name": "Main Battlestation",
        "cpu_manufacturer": "Intel",
        "cpu_model": "Core i7-13700K",
        "cpu_cores": 16,
        "cpu_threads": 24,
        "gpu_manufacturer": "NVIDIA",
        "gpu_model": "GeForce RTX 4070",
        "gpu_vram_gb": 12.0,
        "gpu_type": "DEDICATED",
        "ram_gb": 32,
        "ram_type": "DDR5",
        "storage_type": "NVME_SSD",
        "storage_capacity_gb": 2000,
        "storage_free_gb": 850,
        "operating_system": "Windows 11",
        "os_architecture": "64-bit",
        "directx_version": "DirectX 12 Ultimate",
        "display_resolution": "2560x1440",
        "refresh_rate": 165,
        "is_primary": True,
    }
    create_res = await async_client.post("/api/v1/pc/profiles", json=payload, headers=auth_headers_user1)
    assert create_res.status_code == 201
    profile = create_res.json()
    profile_id = profile["id"]
    assert profile["profile_name"] == "Main Battlestation"
    assert profile["gpu_vram_gb"] == 12.0

    # 2. User 1 lists profiles
    list_res = await async_client.get("/api/v1/pc/profiles", headers=auth_headers_user1)
    assert list_res.status_code == 200
    profiles = list_res.json()
    assert any(p["id"] == profile_id for p in profiles)

    # 3. User 1 updates profile
    update_res = await async_client.put(
        f"/api/v1/pc/profiles/{profile_id}",
        json={"profile_name": "Primary Gaming Rig", "ram_gb": 64},
        headers=auth_headers_user1,
    )
    assert update_res.status_code == 200
    assert update_res.json()["profile_name"] == "Primary Gaming Rig"
    assert update_res.json()["ram_gb"] == 64

    # 4. User 2 unauthorized access checks
    unauth_get = await async_client.get(f"/api/v1/pc/profiles/{profile_id}", headers=auth_headers_user2)
    assert unauth_get.status_code == 404

    unauth_put = await async_client.put(
        f"/api/v1/pc/profiles/{profile_id}",
        json={"profile_name": "Hacked Profile"},
        headers=auth_headers_user2,
    )
    assert unauth_put.status_code == 404

    unauth_delete = await async_client.delete(f"/api/v1/pc/profiles/{profile_id}", headers=auth_headers_user2)
    assert unauth_delete.status_code == 404

    # 5. User 1 deletes profile
    delete_res = await async_client.delete(f"/api/v1/pc/profiles/{profile_id}", headers=auth_headers_user1)
    assert delete_res.status_code == 204

    # Confirm deletion
    get_after = await async_client.get(f"/api/v1/pc/profiles/{profile_id}", headers=auth_headers_user1)
    assert get_after.status_code == 404


@pytest.mark.asyncio
async def test_compatibility_check_anonymous(async_client: AsyncClient):
    """Verifies that an unauthenticated visitor can run a check without fake data."""
    payload = {
        "specs": {
            "profile_name": "Living Room PC",
            "cpu_manufacturer": "AMD",
            "cpu_model": "Ryzen 7 7800X3D",
            "cpu_cores": 8,
            "cpu_threads": 16,
            "gpu_manufacturer": "NVIDIA",
            "gpu_model": "GeForce RTX 4080",
            "gpu_vram_gb": 16.0,
            "gpu_type": "DEDICATED",
            "ram_gb": 32,
            "ram_type": "DDR5",
            "storage_type": "NVME_SSD",
            "storage_capacity_gb": 2000,
            "storage_free_gb": 1200,
            "operating_system": "Windows 11",
            "os_architecture": "64-bit",
            "directx_version": "DirectX 12",
            "display_resolution": "3840x2160",
            "refresh_rate": 120,
            "is_primary": True,
        }
    }
    res = await async_client.post("/api/v1/pc/compatibility/check", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Truth verification checks
    assert data["result_status"] == "REQUIREMENTS_UNAVAILABLE"
    assert data["requirements_status"] == "NOT_YET_CONFIRMED"
    assert "Official GTA 6 PC system requirements have not yet been confirmed" in data["analysis_summary"]
    assert "Ryzen 7 7800X3D" in data["hardware_summary"]["cpu"]

    # Verify no fake numerical pass/fail metrics
    for comp in data["component_results"]:
        if comp["component"] in ["Processor (CPU)", "Graphics Card (GPU)", "Dedicated VRAM"]:
            assert comp["status"] == "UNABLE_TO_COMPARE"


@pytest.mark.asyncio
async def test_compatibility_check_authenticated_and_history(
    async_client: AsyncClient, auth_headers_user1
):
    """Verifies authenticated check execution, profile saving, and history logging."""
    payload = {
        "save_profile": True,
        "profile_name": "Desk Rig",
        "specs": {
            "profile_name": "Desk Rig",
            "cpu_manufacturer": "Intel",
            "cpu_model": "Core i5-12600K",
            "cpu_cores": 10,
            "cpu_threads": 16,
            "gpu_manufacturer": "AMD",
            "gpu_model": "Radeon RX 6700 XT",
            "gpu_vram_gb": 12.0,
            "gpu_type": "DEDICATED",
            "ram_gb": 32,
            "ram_type": "DDR4",
            "storage_type": "NVME_SSD",
            "storage_free_gb": 500,
            "operating_system": "Windows 10",
            "os_architecture": "64-bit",
            "directx_version": "DirectX 12",
            "display_resolution": "1920x1080",
            "refresh_rate": 144,
        },
    }
    res = await async_client.post("/api/v1/pc/compatibility/check", json=payload, headers=auth_headers_user1)
    assert res.status_code == 200
    check_data = res.json()
    assert check_data["saved_profile_id"] is not None

    # Check history
    hist_res = await async_client.get("/api/v1/pc/compatibility/history", headers=auth_headers_user1)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert any(h["id"] == check_data["id"] for h in history)

    # Check detail
    detail_res = await async_client.get(
        f"/api/v1/pc/compatibility/history/{check_data['id']}",
        headers=auth_headers_user1,
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == check_data["id"]


@pytest.mark.asyncio
async def test_hardware_bottlenecks_and_guidance(async_client: AsyncClient):
    """Verifies objective balance warnings (HDD, low RAM, low VRAM, 32-bit OS)."""
    low_specs_payload = {
        "specs": {
            "profile_name": "Old Office Machine",
            "cpu_manufacturer": "Intel",
            "cpu_model": "Core i3-6100",
            "cpu_cores": 2,
            "cpu_threads": 4,
            "gpu_manufacturer": "Intel",
            "gpu_model": "HD Graphics 530",
            "gpu_vram_gb": 1.0,
            "gpu_type": "INTEGRATED",
            "ram_gb": 8,
            "ram_type": "DDR3",
            "storage_type": "HDD",
            "storage_capacity_gb": 500,
            "storage_free_gb": 80,
            "operating_system": "Windows 7",
            "os_architecture": "32-bit",
            "directx_version": "DirectX 11",
            "display_resolution": "1920x1080",
            "refresh_rate": 60,
        }
    }
    res = await async_client.post("/api/v1/pc/compatibility/check", json=low_specs_payload)
    assert res.status_code == 200
    data = res.json()

    # Check that bottlenecks identify HDD, sub-16GB RAM, integrated GPU, 32-bit OS
    components_flagged = [b["component"] for b in data["bottleneck_notes"]]
    assert "Storage" in components_flagged
    assert "System Memory (RAM)" in components_flagged
    assert "Graphics (GPU)" in components_flagged
    assert "Operating System Architecture" in components_flagged

    # Check upgrade suggestions cover technical considerations without marketplace
    suggested_components = [s["component"] for s in data["upgrade_suggestions"]]
    assert "Storage" in suggested_components
    assert "RAM" in suggested_components
    assert "GPU" in suggested_components
    assert "Operating System" in suggested_components
