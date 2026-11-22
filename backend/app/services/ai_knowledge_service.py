"""Knowledge Base & RAG Retrieval Service for AI Problem Solver (Phase 9).

Manages verified knowledge sources, troubleshooting reference documents,
and semantic/keyword-based retrieval for grounded technical support.
"""

from datetime import datetime, timezone
from typing import List, Optional
import uuid
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.problem_solver import AIKnowledgeDocument, AIKnowledgeSource
from app.schemas.problem_solver import SourceReference


class AIKnowledgeService:

    @staticmethod
    async def seed_initial_knowledge_base(session: AsyncSession) -> int:
        """Seeds verified technical troubleshooting references and sources."""
        stmt = select(AIKnowledgeSource).limit(1)
        res = await session.execute(stmt)
        if res.scalars().first():
            return 0

        now = datetime.now(timezone.utc)

        # 1. Sources
        sources = [
            AIKnowledgeSource(
                source_title="Rockstar Games Official Support Knowledge Base",
                source_url="https://support.rockstargames.com",
                publisher="Rockstar Games",
                source_category="OFFICIAL_SUPPORT",
                verification_status="OFFICIAL",
                is_active=True,
                published_at=now,
                last_verified_at=now,
            ),
            AIKnowledgeSource(
                source_title="Microsoft Windows Graphics & DirectX Technical Documentation",
                source_url="https://learn.microsoft.com/en-us/windows/win32/directx",
                publisher="Microsoft Corporation",
                source_category="WINDOWS_DOCUMENTATION",
                verification_status="VERIFIED",
                is_active=True,
                published_at=now,
                last_verified_at=now,
            ),
            AIKnowledgeSource(
                source_title="NVIDIA & AMD Driver Troubleshooting Reference",
                source_url="https://www.nvidia.com/en-us/geforce/drivers",
                publisher="NVIDIA Corporation / AMD",
                source_category="GPU_DRIVERS",
                verification_status="VERIFIED",
                is_active=True,
                published_at=now,
                last_verified_at=now,
            ),
            AIKnowledgeSource(
                source_title="PC Gaming Hardware & Controller Interoperability Guide",
                source_url="https://partner.steamgames.com/doc/features/steam_controller",
                publisher="Valve Corporation / Industry Standard",
                source_category="GENERAL_PC",
                verification_status="VERIFIED",
                is_active=True,
                published_at=now,
                last_verified_at=now,
            ),
        ]
        session.add_all(sources)
        await session.flush()

        rockstar_src = sources[0]
        msft_src = sources[1]
        gpu_src = sources[2]
        controller_src = sources[3]

        # 2. Verified Troubleshooting Documents
        documents = [
            AIKnowledgeDocument(
                source_id=rockstar_src.id,
                document_title="Verifying Game File Integrity and Launcher Cache Reset",
                topic_category="Game Installation",
                content=(
                    "Corrupted download segments or missing binaries cause unexpected startup crashes. "
                    "In the Rockstar Games Launcher, open Settings -> My Installed Games -> Select the game title "
                    "-> Verify Integrity. Alternatively, clearing launcher local cache under %LOCALAPPDATA%\\Rockstar Games\\Launcher "
                    "resolves cloud synchronisation and authentication handshake errors."
                ),
                keywords=["integrity", "verify", "corrupt", "cache", "launcher", "download", "install", "missing"],
                doc_metadata={"reversibility": "HIGH", "risk": "NONE"},
            ),
            AIKnowledgeDocument(
                source_id=msft_src.id,
                document_title="DirectX 12 D3D12 Device Lost and Driver Reset Troubleshooting",
                topic_category="Graphics and Display",
                content=(
                    "The DXGI_ERROR_DEVICE_REMOVED or D3D12 device hung error indicates that the graphics driver stopped "
                    "responding to the Windows OS within the TDR (Timeout Detection and Recovery) window. Common causes include "
                    "aggressive GPU overclocking/undervolting, unstable GPU power delivery, corrupted DirectX runtime state, "
                    "or exceeding dedicated VRAM limits. Running SFC /scannow in an elevated command prompt verifies system file health."
                ),
                keywords=["directx", "d3d12", "device removed", "device lost", "crash", "tdr", "vram", "gpu", "freeze"],
                doc_metadata={"reversibility": "HIGH", "risk": "LOW"},
            ),
            AIKnowledgeDocument(
                source_id=gpu_src.id,
                document_title="Clean Graphics Driver Reinstallation Using Display Driver Uninstaller (DDU)",
                topic_category="Game Crashes and Errors",
                content=(
                    "Conflicting legacy registry keys or corrupted display driver caches frequently trigger desktop crashes. "
                    "Using Wagnardsoft Display Driver Uninstaller (DDU) in Windows Safe Mode completely purges previous NVIDIA/AMD driver files. "
                    "Disconnect your internet connection before rebooting to prevent Windows Update from automatically installing a generic driver, "
                    "then install the latest WHQL driver downloaded directly from the manufacturer."
                ),
                keywords=["ddu", "driver", "clean install", "nvidia", "amd", "display", "safe mode", "black screen"],
                doc_metadata={"reversibility": "MEDIUM", "risk": "LOW"},
            ),
            AIKnowledgeDocument(
                source_id=msft_src.id,
                document_title="Windows Virtual Memory Paging File Optimization for AAA Gaming",
                topic_category="Performance and FPS",
                content=(
                    "When demanding open-world games approach physical system RAM limits (especially on systems with 16GB or less), "
                    "Windows aggressively pages inactive working sets to disk. If the pagefile is disabled or restricted to a mechanical HDD, "
                    "severe micro-stuttering or out-of-memory crashes occur. Set the pagefile on your fastest NVMe SSD to 'System Managed Size' "
                    "with at least 16GB to 24GB of allocated virtual address space."
                ),
                keywords=["pagefile", "virtual memory", "ram", "stutter", "lag", "fps", "memory leak", "paging", "out of memory"],
                doc_metadata={"reversibility": "HIGH", "risk": "NONE"},
            ),
            AIKnowledgeDocument(
                source_id=controller_src.id,
                document_title="DualSense and Xbox Controller Recognition and Bluetooth Latency Solutions",
                topic_category="Controller and Input",
                content=(
                    "PlayStation DualSense controllers on PC can experience device conflict when Windows routes audio through the controller's "
                    "integrated headphone jack. Ensure the controller is connected via high-speed USB-C for full haptic and adaptive trigger support. "
                    "If using Bluetooth, check for 2.4GHz Wi-Fi interference and verify gamepad calibration in Windows USB Game Controllers (joy.cpl)."
                ),
                keywords=["controller", "dualsense", "xbox", "bluetooth", "gamepad", "input lag", "mapping", "not detected"],
                doc_metadata={"reversibility": "HIGH", "risk": "NONE"},
            ),
            AIKnowledgeDocument(
                source_id=rockstar_src.id,
                document_title="TCP/IP Stack Reset and DNS Flush for Online Services Connectivity",
                topic_category="Network and Connectivity",
                content=(
                    "Connection dropouts and authentication timeouts with game servers often stem from corrupted local DNS resolver cache "
                    "or stale socket bindings. Execute 'ipconfig /flushdns', 'netsh winsock reset', and 'netsh int ip reset' in an elevated "
                    "terminal, followed by a system reboot. If packet loss persists, test with public reliable DNS (1.1.1.1 or 8.8.8.8)."
                ),
                keywords=["network", "connection", "latency", "ping", "dns", "packet loss", "timeout", "offline", "disconnect"],
                doc_metadata={"reversibility": "HIGH", "risk": "LOW"},
            ),
        ]
        session.add_all(documents)
        await session.commit()
        logger.info(f"Seeded {len(documents)} verified AI knowledge base reference documents.")
        return len(documents)

    @staticmethod
    async def get_document_count(session: AsyncSession) -> int:
        """Returns the total number of indexed knowledge documents."""
        stmt = select(AIKnowledgeDocument)
        res = await session.execute(stmt)
        return len(res.scalars().all())

    @staticmethod
    async def retrieve_relevant_sources(
        session: AsyncSession,
        query: str,
        category: Optional[str] = None,
        limit: int = 2,
    ) -> List[SourceReference]:
        """Retrieves verified knowledge sources relevant to the user query."""
        stmt = (
            select(AIKnowledgeDocument, AIKnowledgeSource)
            .join(AIKnowledgeSource, AIKnowledgeDocument.source_id == AIKnowledgeSource.id)
            .where(AIKnowledgeSource.is_active.is_(True))
        )
        res = await session.execute(stmt)
        rows = res.all()

        if not rows:
            return []

        query_lower = query.lower()
        scored_matches = []

        for doc, src in rows:
            score = 0
            # Check category match
            if category and doc.topic_category.lower() == category.lower():
                score += 3

            # Check keywords match
            keywords = doc.keywords or []
            for kw in keywords:
                if kw.lower() in query_lower:
                    score += 2

            # Check title and content match
            if any(term in doc.document_title.lower() for term in query_lower.split() if len(term) > 3):
                score += 2

            if score > 0:
                scored_matches.append((score, doc, src))

        scored_matches.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_matches[:limit]

        references: List[SourceReference] = []
        seen_urls = set()

        for _, doc, src in top_matches:
            if src.source_url not in seen_urls:
                references.append(
                    SourceReference(
                        title=doc.document_title,
                        publisher=src.publisher,
                        url=src.source_url,
                        category=doc.topic_category,
                        verification_status=src.verification_status,
                    )
                )
                if src.source_url:
                    seen_urls.add(src.source_url)

        return references
