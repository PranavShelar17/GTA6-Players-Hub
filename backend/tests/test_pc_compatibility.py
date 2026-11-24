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


@pytest.mark.asyncio
async def test_pc_profile_extended_fields_and_set_primary(
    async_client: AsyncClient, auth_headers_user1
):
    """Verifies extended hardware fields (PSU, motherboard, cooling, RAM speed) and set-primary workflow."""
    # 1. Create Profile 1 (Old PC)
    old_pc_payload = {
        "profile_name": "Old Gaming Rig (2020)",
        "cpu_manufacturer": "Intel",
        "cpu_model": "Core i5-10400F",
        "cpu_cores": 6,
        "cpu_threads": 12,
        "gpu_manufacturer": "NVIDIA",
        "gpu_model": "GeForce GTX 1660 Super",
        "gpu_vram_gb": 6.0,
        "gpu_type": "DEDICATED",
        "ram_gb": 16,
        "ram_type": "DDR4",
        "ram_speed_mhz": 3200,
        "motherboard_model": "ASUS Prime B460M-A",
        "storage_type": "SATA_SSD",
        "storage_capacity_gb": 500,
        "storage_free_gb": 120,
        "psu_wattage": 500,
        "psu_model": "EVGA 500 W1",
        "cooling_solution": "Stock Air Cooler",
        "form_factor": "DESKTOP",
        "is_primary": True,
    }
    res1 = await async_client.post("/api/v1/pc/profiles", json=old_pc_payload, headers=auth_headers_user1)
    assert res1.status_code == 201
    p1 = res1.json()
    assert p1["ram_speed_mhz"] == 3200
    assert p1["motherboard_model"] == "ASUS Prime B460M-A"
    assert p1["psu_wattage"] == 500
    assert p1["is_primary"] is True

    # 2. Create Profile 2 (New PC, marked as primary)
    new_pc_payload = {
        "profile_name": "Current Beast (2026)",
        "cpu_manufacturer": "AMD",
        "cpu_model": "Ryzen 7 7800X3D",
        "cpu_cores": 8,
        "cpu_threads": 16,
        "gpu_manufacturer": "NVIDIA",
        "gpu_model": "GeForce RTX 4070 Super",
        "gpu_vram_gb": 12.0,
        "gpu_type": "DEDICATED",
        "ram_gb": 32,
        "ram_type": "DDR5",
        "ram_speed_mhz": 6000,
        "motherboard_model": "MSI B650 Tomahawk Wi-Fi",
        "storage_type": "NVME_SSD",
        "storage_capacity_gb": 2000,
        "storage_free_gb": 1200,
        "psu_wattage": 750,
        "psu_model": "Corsair RM750e",
        "cooling_solution": "Thermalright Peerless Assassin 120",
        "form_factor": "DESKTOP",
        "is_primary": True,
    }
    res2 = await async_client.post("/api/v1/pc/profiles", json=new_pc_payload, headers=auth_headers_user1)
    assert res2.status_code == 201
    p2 = res2.json()
    assert p2["is_primary"] is True

    # Verify Profile 1 was automatically demoted from primary
    get1 = await async_client.get(f"/api/v1/pc/profiles/{p1['id']}", headers=auth_headers_user1)
    assert get1.json()["is_primary"] is False

    # 3. Use set-primary endpoint to switch primary back to Profile 1
    switch_res = await async_client.post(f"/api/v1/pc/profiles/{p1['id']}/set-primary", headers=auth_headers_user1)
    assert switch_res.status_code == 200
    assert switch_res.json()["is_primary"] is True

    # Confirm Profile 2 is now demoted
    get2 = await async_client.get(f"/api/v1/pc/profiles/{p2['id']}", headers=auth_headers_user1)
    assert get2.json()["is_primary"] is False


@pytest.mark.asyncio
async def test_pc_profile_comparison_endpoint(
    async_client: AsyncClient, auth_headers_user1, auth_headers_user2
):
    """Verifies side-by-side comparison between old and new saved PC profiles."""
    # 1. Create two profiles for User 1
    p1_data = {
        "profile_name": "Rig v1",
        "cpu_manufacturer": "Intel",
        "cpu_model": "Core i5-10400F",
        "gpu_manufacturer": "NVIDIA",
        "gpu_model": "GeForce GTX 1660 Super",
        "gpu_vram_gb": 6.0,
        "ram_gb": 16,
        "storage_type": "SATA_SSD",
        "storage_free_gb": 100,
    }
    p2_data = {
        "profile_name": "Rig v2",
        "cpu_manufacturer": "AMD",
        "cpu_model": "Ryzen 7 7800X3D",
        "gpu_manufacturer": "NVIDIA",
        "gpu_model": "GeForce RTX 4070 Super",
        "gpu_vram_gb": 12.0,
        "ram_gb": 32,
        "storage_type": "NVME_SSD",
        "storage_free_gb": 800,
    }
    r1 = await async_client.post("/api/v1/pc/profiles", json=p1_data, headers=auth_headers_user1)
    r2 = await async_client.post("/api/v1/pc/profiles", json=p2_data, headers=auth_headers_user1)
    id1, id2 = r1.json()["id"], r2.json()["id"]

    # 2. Compare profiles
    cmp_res = await async_client.post(
        "/api/v1/pc/profiles/compare",
        json={"profile_ids": [id1, id2]},
        headers=auth_headers_user1,
    )
    assert cmp_res.status_code == 200
    data = cmp_res.json()
    assert len(data["profiles"]) == 2
    assert len(data["differences"]) >= 5
    assert "Rig v1" in data["upgrade_summary"]
    assert "Rig v2" in data["upgrade_summary"]

    # Check VRAM upgrade detected
    vram_diff = next(d for d in data["differences"] if d["component"] == "Video Memory (VRAM)")
    assert vram_diff["delta_type"] == "UPGRADE"
    assert "6.0" in vram_diff["profile_1_value"]
    assert "12.0" in vram_diff["profile_2_value"]

    # 3. Privacy check: User 2 cannot compare User 1's profiles
    unauth_cmp = await async_client.post(
        "/api/v1/pc/profiles/compare",
        json={"profile_ids": [id1, id2]},
        headers=auth_headers_user2,
    )
    assert unauth_cmp.status_code == 400


@pytest.mark.asyncio
async def test_top_3_recommendations_endpoint(async_client: AsyncClient):
    """Verifies top 3 curated gaming PC configurations and personalized matching."""
    # 1. Fetch default recommendations
    res = await async_client.get("/api/v1/pc/recommendations")
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) == 3

    tiers = [r["tier"] for r in data["recommendations"]]
    assert "HIGH_END" in tiers
    assert "MID_RANGE" in tiers
    assert "ENTRY_LEVEL" in tiers

    # Check pricing and truth verification disclaimer
    high = next(r for r in data["recommendations"] if r["tier"] == "HIGH_END")
    assert high["price_usd"] == 1999.0
    assert high["price_inr"] == 185000.0
    assert high["price_status"] == "VERIFIED_ESTIMATE"
    assert "Official GTA 6 PC system requirements have not been confirmed" in data["gta6_disclaimer"]

    # 2. Test personalized filter for Budget tier
    budget_res = await async_client.get("/api/v1/pc/recommendations?budget=BUDGET&intended_use=COMPETITIVE")
    assert budget_res.status_code == 200
    match = budget_res.json()["personalized_match"]
    assert match is not None
    assert match["recommended_tier"] == "ENTRY_LEVEL"
    assert "Recommended for you" in match["match_headline"]


@pytest.mark.asyncio
async def test_user_pc_recommendation_comparison_endpoint(async_client: AsyncClient):
    """Verifies user PC vs top 3 recommendation comparison and power headroom analysis."""
    custom_rig = {
        "profile_name": "Test Rig",
        "cpu_manufacturer": "Intel",
        "cpu_model": "Core i5-10400F",
        "cpu_cores": 6,
        "cpu_threads": 12,
        "gpu_manufacturer": "NVIDIA",
        "gpu_model": "GeForce GTX 1660 Super",
        "gpu_vram_gb": 6.0,
        "gpu_type": "DEDICATED",
        "ram_gb": 16,
        "ram_type": "DDR4",
        "storage_type": "HDD",
        "storage_capacity_gb": 1000,
        "storage_free_gb": 300,
        "psu_wattage": 450,
    }
    res = await async_client.post("/api/v1/pc/recommendations/compare", json=custom_rig)
    assert res.status_code == 200
    data = res.json()

    assert data["user_profile_name"] == "Test Rig"
    assert len(data["comparison_table"]) >= 7

    # Check that 6GB VRAM and HDD storage are flagged with high/critical priority
    vram_row = next(r for r in data["comparison_table"] if r["component"] == "Video Memory (VRAM)")
    assert vram_row["compatibility_status"] == "BELOW_ENTRY"
    assert vram_row["upgrade_priority"] == "CRITICAL"

    storage_row = next(r for r in data["comparison_table"] if r["component"] == "Storage Interface")
    assert storage_row["upgrade_priority"] == "CRITICAL"

    # Check power headroom analysis
    power = data["power_analysis"]
    assert power["estimated_user_power_w"] > 0
    assert power["recommended_psu_with_headroom_w"] > power["estimated_user_power_w"]
    assert power["status"] in ("HEALTHY_HEADROOM", "MARGINAL_HEADROOM", "DEFICIT_WARNING")
    assert "Official GTA 6 PC system requirements have not been confirmed" in data["gta6_disclaimer"]

    # Verify Upgrade Advisor plan is generated and capability labels are present
    assert data["upgrade_advisor"] is not None
    assert data["upgrade_advisor"]["recommended_strategy"] in (
        "ONE_OR_TWO_COMPONENTS",
        "PLATFORM_UPGRADE",
        "KEEP_EXISTING",
        "COMPLETE_NEW_BUILD",
    )
    for row in data["comparison_table"]:
        assert row["capability_label"] in (
            "Better hardware capability",
            "Similar hardware capability",
            "Lower hardware capability",
            "Not compatible",
            "Insufficient information",
        )


@pytest.mark.asyncio
async def test_hardware_catalog_and_budget_scaling(async_client: AsyncClient):
    """Verifies the hardware catalog endpoint and dynamic budget scaling in INR."""
    # 1. Test Hardware Catalog
    cat_res = await async_client.get("/api/v1/pc/catalog")
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    assert len(cat_data["catalog"]) >= 10
    cpus = [item for item in cat_data["catalog"] if item["category"] == "CPU"]
    gpus = [item for item in cat_data["catalog"] if item["category"] == "GPU"]
    assert len(cpus) >= 4
    assert len(gpus) >= 4
    assert any("PrimeABGB" in item["retailer"] for item in cat_data["catalog"])

    # 2. Test Dynamic INR Budget Recommendations (e.g. ₹1,00,000 target)
    rec_res = await async_client.get("/api/v1/pc/recommendations?budget_inr=100000&currency=INR")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert rec_data["user_budget_inr"] == 100000.0

    high_tier = next(r for r in rec_data["recommendations"] if r["tier"] == "HIGH_END")
    mid_tier = next(r for r in rec_data["recommendations"] if r["tier"] == "MID_RANGE")
    low_tier = next(r for r in rec_data["recommendations"] if r["tier"] == "ENTRY_LEVEL")

    # High tier is ~₹98,500 (within ₹95k-₹100k target)
    assert 90000 <= high_tier["price_inr"] <= 100000
    # Mid tier is ~₹84,800 (within ₹80k-₹90k target)
    assert 75000 <= mid_tier["price_inr"] <= 90000
    # Low tier is ~₹68,200 (within ₹65k-₹75k target)
    assert 60000 <= low_tier["price_inr"] <= 75000

    # Verify component price breakdowns and compatibility validation reports
    for build in rec_data["recommendations"]:
        assert build["gst_status"] == "GST Included (18% Retail Standard in India)"
        assert len(build["component_price_breakdown"]) >= 8
        assert build["compatibility_report"] is not None
        assert build["compatibility_report"]["overall_compatibility"] == "FULLY_COMPATIBLE"
        assert len(build["compatibility_report"]["checks"]) >= 5

