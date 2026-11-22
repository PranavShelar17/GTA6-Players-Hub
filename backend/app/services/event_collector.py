import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event, EventCategory, EventSource
from app.core.logging import logger

CATEGORIES_DATA = [
    {
        "name": "Official Broadcasts",
        "slug": "official-broadcasts",
        "icon": "video",
        "color": "#f97316",
        "description": "Rockstar Games official live streams, trailer debuts, and direct announcements.",
    },
    {
        "name": "Corporate & Financial",
        "slug": "corporate-financial",
        "icon": "trending-up",
        "color": "#3b82f6",
        "description": "Take-Two Interactive quarterly earnings conferences and commercial guidance.",
    },
    {
        "name": "Industry Showcases",
        "slug": "industry-showcases",
        "icon": "tv",
        "color": "#8b5cf6",
        "description": "The Game Awards, Summer Game Fest, Gamescom, and major platform showcases.",
    },
    {
        "name": "Pre-Order & Retail",
        "slug": "pre-order-retail",
        "icon": "shopping-bag",
        "color": "#10b981",
        "description": "Worldwide collector's editions, retail activation, and store listings.",
    },
    {
        "name": "Community Milestones",
        "slug": "community-milestones",
        "icon": "users",
        "color": "#ec4899",
        "description": "Community game nights, anniversary retrospectives, and creator marathons.",
    },
]

SOURCES_DATA = [
    {
        "name": "Rockstar Games Newswire",
        "website_url": "https://www.rockstargames.com/newswire",
        "source_type": "OFFICIAL",
        "reliability_score": 100,
    },
    {
        "name": "Take-Two Investor Relations",
        "website_url": "https://www.take2games.com/ir",
        "source_type": "OFFICIAL",
        "reliability_score": 100,
    },
    {
        "name": "PlayStation Official Blog",
        "website_url": "https://blog.playstation.com",
        "source_type": "PUBLISHER",
        "reliability_score": 95,
    },
    {
        "name": "The Game Awards",
        "website_url": "https://thegameawards.com",
        "source_type": "MEDIA",
        "reliability_score": 90,
    },
    {
        "name": "GTA VI Community Network",
        "website_url": "https://gta6hub.local",
        "source_type": "COMMUNITY",
        "reliability_score": 80,
    },
]

INITIAL_EVENTS = [
    {
        "title": "Take-Two Interactive Q3 Corporate Earnings Call & GTA VI Guidance",
        "slug": "take-two-q3-fy2027-earnings",
        "category_slug": "corporate-financial",
        "source_name": "Take-Two Investor Relations",
        "start_time": datetime(2027, 2, 5, 21, 30, tzinfo=timezone.utc),
        "end_time": datetime(2027, 2, 5, 23, 0, tzinfo=timezone.utc),
        "timezone": "UTC",
        "location_type": "ONLINE",
        "location_name": "Webcast & Investor Audio Stream",
        "event_url": "https://www.take2games.com/ir",
        "stream_url": "https://www.take2games.com/ir/webcast",
        "verification_status": "OFFICIAL",
        "is_featured": True,
        "organizer_name": "Take-Two Interactive",
        "short_summary": "Corporate financial conference and executive Q&A confirming commercial progress and Fall 2025 release timing.",
        "description": (
            "Take-Two Interactive Software, Inc. will host a conference call to discuss its fiscal third quarter results. "
            "Executive leadership (Chairman & CEO Strauss Zelnick and CFO Lainie Goldstein) will provide official commentary "
            "regarding Grand Theft Auto VI release planning, marketing timelines, and upcoming pipeline deployments."
        ),
        "tags": "take-two,earnings,investor,release-window",
    },
    {
        "title": "Anticipated Trailer 2 & In-Engine Gameplay Mechanics Showcase",
        "slug": "anticipated-trailer-2-gameplay-reveal",
        "category_slug": "official-broadcasts",
        "source_name": "Rockstar Games Newswire",
        "start_time": datetime(2026, 12, 15, 15, 0, tzinfo=timezone.utc),
        "end_time": datetime(2026, 12, 15, 16, 0, tzinfo=timezone.utc),
        "timezone": "UTC",
        "location_type": "ONLINE",
        "location_name": "Rockstar Games YouTube & Newswire",
        "event_url": "https://www.rockstargames.com/newswire",
        "stream_url": "https://youtube.com/@rockstargames",
        "verification_status": "VERIFIED",
        "is_featured": True,
        "organizer_name": "Rockstar Games",
        "short_summary": "Anticipated next cinematic showcase exploring Leonida's ecology, waterways, and Lucia/Jason mechanics.",
        "description": (
            "Highly anticipated follow-up cinematic and in-engine showcase for Grand Theft Auto VI. "
            "Expected to showcase enhanced volumetric rendering of the state of Leonida, character switching dynamics "
            "between Lucia and Jason, and detailed aquatic physics."
        ),
        "tags": "trailer,gameplay,lucia,jason,leonida",
    },
    {
        "title": "Summer Game Fest 2027 Global Live Broadcast",
        "slug": "summer-game-fest-2027-showcase",
        "category_slug": "industry-showcases",
        "source_name": "The Game Awards",
        "start_time": datetime(2027, 6, 8, 19, 0, tzinfo=timezone.utc),
        "end_time": datetime(2027, 6, 8, 21, 30, tzinfo=timezone.utc),
        "timezone": "UTC",
        "location_type": "HYBRID",
        "location_name": "YouTube Theater, Los Angeles & Global Livestream",
        "event_url": "https://thegameawards.com",
        "stream_url": "https://youtube.com/@thegameawards",
        "verification_status": "VERIFIED",
        "is_featured": False,
        "organizer_name": "Geoff Keighley / SGF",
        "short_summary": "Global cross-platform gaming showcase with potential partner trailers and next-gen console highlights.",
        "description": (
            "Summer Game Fest returns live from Los Angeles. The showcase features world premieres, gameplay reveals, "
            "and guest developer interviews across PC, PlayStation 5, and Xbox Series X/S."
        ),
        "tags": "summer-game-fest,showcase,reveal,industry",
    },
    {
        "title": "GTA VI Global Digital & Physical Pre-Order Launch",
        "slug": "gta-vi-worldwide-preorder-activation",
        "category_slug": "pre-order-retail",
        "source_name": "Rockstar Games Newswire",
        "start_time": datetime(2027, 4, 10, 16, 0, tzinfo=timezone.utc),
        "end_time": datetime(2027, 4, 10, 18, 0, tzinfo=timezone.utc),
        "timezone": "UTC",
        "location_type": "ONLINE",
        "location_name": "PlayStation Store, Xbox Marketplace, Retail Stores",
        "event_url": "https://www.rockstargames.com",
        "stream_url": None,
        "verification_status": "OFFICIAL",
        "is_featured": True,
        "organizer_name": "Rockstar Games",
        "short_summary": "Official worldwide activation of standard and deluxe pre-orders across PlayStation Store, Xbox Marketplace, and retail partners.",
        "description": (
            "Rockstar Games begins pre-order operations worldwide. Retailer product pages, digital store bundles, "
            "and collector's physical packages go live across all supported regions and currencies."
        ),
        "tags": "preorder,store,editions,deluxe,collector",
    },
    {
        "title": "Rockstar Games 28th Anniversary GTA Community Retrospective",
        "slug": "rockstar-games-anniversary-community-retrospective",
        "category_slug": "community-milestones",
        "source_name": "GTA VI Community Network",
        "start_time": datetime(2026, 12, 1, 17, 0, tzinfo=timezone.utc),
        "end_time": datetime(2026, 12, 1, 22, 0, tzinfo=timezone.utc),
        "timezone": "UTC",
        "location_type": "ONLINE",
        "location_name": "Community Discord & Twitch Streams",
        "event_url": "https://gta6hub.local/community",
        "stream_url": "https://twitch.tv",
        "verification_status": "COMMUNITY",
        "is_featured": False,
        "organizer_name": "Global GTA Community",
        "short_summary": "Global creator streams and community countdown reviewing 28 years of Grand Theft Auto world-building.",
        "description": (
            "Worldwide player event celebrating 28 years of Grand Theft Auto history. Features speedruns, soundtrack retrospectives, "
            "and speculative breakdowns of Vice City's architectural evolutions."
        ),
        "tags": "community,anniversary,retrospective,marathon",
    },
    {
        "title": "PlayStation State of Play – Next-Gen Graphics Spotlight",
        "slug": "playstation-state-of-play-vice-city-spotlight",
        "category_slug": "official-broadcasts",
        "source_name": "PlayStation Official Blog",
        "start_time": datetime(2027, 3, 20, 21, 0, tzinfo=timezone.utc),
        "end_time": datetime(2027, 3, 20, 22, 0, tzinfo=timezone.utc),
        "timezone": "UTC",
        "location_type": "ONLINE",
        "location_name": "PlayStation Twitch & YouTube",
        "event_url": "https://blog.playstation.com",
        "stream_url": "https://youtube.com/@playstation",
        "verification_status": "UNCONFIRMED",
        "is_featured": False,
        "organizer_name": "Sony Interactive Entertainment",
        "short_summary": "Unconfirmed broadcast rumoured to detail PS5 Pro hardware performance and volumetric simulation in Vice City.",
        "description": (
            "Unconfirmed special edition State of Play broadcast focusing on upcoming third-party blockbuster releases. "
            "Industry analysts speculate deep dives into ray tracing hardware and 60 FPS performance targets."
        ),
        "tags": "playstation,state-of-play,ps5-pro,graphics",
    },
]


async def seed_initial_events(session: AsyncSession) -> int:
    """Seeds default event categories, sources, and verified initial events."""
    # 1. Categories
    cat_map = {}
    for cdata in CATEGORIES_DATA:
        stmt = select(EventCategory).where(EventCategory.slug == cdata["slug"])
        res = await session.execute(stmt)
        cat = res.scalar_one_or_none()
        if not cat:
            cat = EventCategory(
                id=uuid.uuid4(),
                name=cdata["name"],
                slug=cdata["slug"],
                icon=cdata["icon"],
                color=cdata["color"],
                description=cdata["description"],
                is_active=True,
            )
            session.add(cat)
            await session.flush()
        cat_map[cdata["slug"]] = cat

    # 2. Sources
    source_map = {}
    for sdata in SOURCES_DATA:
        stmt = select(EventSource).where(EventSource.name == sdata["name"])
        res = await session.execute(stmt)
        src = res.scalar_one_or_none()
        if not src:
            src = EventSource(
                id=uuid.uuid4(),
                name=sdata["name"],
                website_url=sdata["website_url"],
                source_type=sdata["source_type"],
                reliability_score=sdata["reliability_score"],
            )
            session.add(src)
            await session.flush()
        source_map[sdata["name"]] = src

    # 3. Events
    created_count = 0
    for edata in INITIAL_EVENTS:
        stmt = select(Event).where(Event.slug == edata["slug"])
        res = await session.execute(stmt)
        existing = res.scalar_one_or_none()
        if not existing:
            category = cat_map.get(edata["category_slug"])
            source = source_map.get(edata["source_name"])
            if category:
                event = Event(
                    id=uuid.uuid4(),
                    title=edata["title"],
                    slug=edata["slug"],
                    description=edata["description"],
                    short_summary=edata["short_summary"],
                    category_id=category.id,
                    source_id=source.id if source else None,
                    start_time=edata["start_time"],
                    end_time=edata["end_time"],
                    timezone=edata["timezone"],
                    location_type=edata["location_type"],
                    location_name=edata["location_name"],
                    event_url=edata["event_url"],
                    stream_url=edata["stream_url"],
                    verification_status=edata["verification_status"],
                    is_featured=edata["is_featured"],
                    organizer_name=edata["organizer_name"],
                    tags=edata["tags"],
                )
                session.add(event)
                created_count += 1

    await session.commit()
    return created_count
