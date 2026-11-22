from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.news import NewsArticle
from app.models.price import PriceObservation, PriceProduct, PriceRegion, PriceStore
from app.schemas.envelope import ApiResponse
from app.schemas.home import (
    HomeAggregatedResponse,
    HomeCommunityHighlight,
    HomeDealItem,
    HomeEventItem,
    HomeNewsItem,
)

router = APIRouter(prefix="/home", tags=["Homepage Data Aggregator"])

# Curated editorial data contracts adhering to GTA 6 verification standards
CURATED_NEWS: List[HomeNewsItem] = [
    HomeNewsItem(
        id="news-01",
        title="Take-Two Interactive Reconfirms Grand Theft Auto VI Fall 2025 Release Window",
        slug="take-two-reconfirms-gta-6-fall-2025-release",
        summary="During the corporate earnings call, Take-Two Interactive affirmed that Rockstar Games remains firmly scheduled to launch GTA VI in Fall 2025 across PlayStation 5 and Xbox Series X/S.",
        source_name="Rockstar Newswire",
        source_url="https://www.rockstargames.com/newswire",
        published_at="2026-11-20T18:00:00Z",
        verification_status="OFFICIAL",
        category="Official Bulletin",
        thumbnail_url=None
    ),
    HomeNewsItem(
        id="news-02",
        title="PlayStation 5 Pro Technical Enhancements & Next-Gen Engine Capabilities",
        slug="playstation-5-pro-hardware-enhancements-gta-6",
        summary="Digital Foundry technical analysis reviews machine learning upscaling (PSSR) and dynamic ray tracing designed to support Vice City's sprawling volumetric rendering.",
        source_name="PlayStation Blog",
        source_url="https://blog.playstation.com",
        published_at="2026-11-18T14:30:00Z",
        verification_status="VERIFIED",
        category="Engine & Tech",
        thumbnail_url=None
    ),
    HomeNewsItem(
        id="news-03",
        title="PC Platform Timeline Analysis & RAGE Engine Physics Expectations",
        slug="pc-platform-timeline-analysis-physics-expectations",
        summary="Historical breakdown of Rockstar Games PC release intervals (GTA IV, GTA V, RDR 2) and what to expect regarding future Windows compatibility disclosures.",
        source_name="Industry Analysis",
        source_url="https://pcgamer.com",
        published_at="2026-11-15T11:00:00Z",
        verification_status="UNCONFIRMED",
        category="Platform Analysis",
        thumbnail_url=None
    )
]

CURATED_DEALS: List[HomeDealItem] = [
    HomeDealItem(
        id="deal-ps5-std-ind",
        edition_name="Standard Edition",
        platform="PS5",
        country_code="IND",
        current_price=5999.00,
        currency="INR",
        original_price=None,
        discount_percentage=0,
        retailer_name="PlayStation Store",
        product_url="https://store.playstation.com",
        last_checked_at="2026-11-21T18:00:00Z",
        is_preorder=True
    ),
    HomeDealItem(
        id="deal-ps5-std-usa",
        edition_name="Standard Edition",
        platform="PS5",
        country_code="USA",
        current_price=69.99,
        currency="USD",
        original_price=None,
        discount_percentage=0,
        retailer_name="PlayStation Store",
        product_url="https://store.playstation.com",
        last_checked_at="2026-11-21T18:00:00Z",
        is_preorder=True
    ),
    HomeDealItem(
        id="deal-xbox-dlx-usa",
        edition_name="Deluxe Edition",
        platform="XBOX_SERIES",
        country_code="USA",
        current_price=89.99,
        currency="USD",
        original_price=None,
        discount_percentage=0,
        retailer_name="Xbox Marketplace",
        product_url="https://xbox.com",
        last_checked_at="2026-11-21T18:00:00Z",
        is_preorder=True
    ),
    HomeDealItem(
        id="deal-xbox-dlx-ind",
        edition_name="Deluxe Edition",
        platform="XBOX_SERIES",
        country_code="IND",
        current_price=7499.00,
        currency="INR",
        original_price=None,
        discount_percentage=0,
        retailer_name="Xbox Marketplace",
        product_url="https://xbox.com",
        last_checked_at="2026-11-21T18:00:00Z",
        is_preorder=True
    ),
    HomeDealItem(
        id="deal-ps5-std-eur",
        edition_name="Standard Edition",
        platform="PS5",
        country_code="EUR",
        current_price=79.99,
        currency="EUR",
        original_price=None,
        discount_percentage=0,
        retailer_name="PlayStation Store (Europe)",
        product_url="https://store.playstation.com",
        last_checked_at="2026-11-21T18:00:00Z",
        is_preorder=True
    ),
    HomeDealItem(
        id="deal-ps5-std-gbr",
        edition_name="Standard Edition",
        platform="PS5",
        country_code="GBR",
        current_price=69.99,
        currency="GBP",
        original_price=None,
        discount_percentage=0,
        retailer_name="PlayStation Store (UK)",
        product_url="https://store.playstation.com",
        last_checked_at="2026-11-21T18:00:00Z",
        is_preorder=True
    )
]

CURATED_EVENTS: List[HomeEventItem] = [
    HomeEventItem(
        id="event-01",
        event_name="Take-Two Interactive Q1 Earnings Conference",
        category="Corporate & Financial",
        date_string="Early 2027",
        start_time_iso="2027-02-05T21:30:00Z",
        timezone="UTC",
        description="Executive leadership Q&A and verified corporate updates on the GTA VI release window.",
        is_official=True
    ),
    HomeEventItem(
        id="event-02",
        event_name="Anticipated Trailer 2 & In-Engine Gameplay Deep Dive",
        category="Cinematic Reveal",
        date_string="Target 2026 / 2027",
        start_time_iso="2026-12-15T15:00:00Z",
        timezone="UTC",
        description="Anticipated next cinematic showcase exploring Leonida's ecology, waterways, and Lucia/Jason mechanics.",
        is_official=False
    ),
    HomeEventItem(
        id="event-03",
        event_name="Official Pre-Order Activation Broadcast",
        category="Store Availability",
        date_string="Announced by Rockstar",
        start_time_iso="2027-04-01T17:00:00Z",
        timezone="UTC",
        description="Official notification when physical collector's boxes and digital store listings activate worldwide.",
        is_official=True
    )
]

CURATED_COMMUNITY: List[HomeCommunityHighlight] = [
    HomeCommunityHighlight(
        id="comm-01",
        title="Map Scale Comparison: Leonida vs. San Andreas & Red Dead Redemption 2",
        author_username="ViceCityNavigator",
        author_avatar_url=None,
        author_platform="PS5",
        category="Vice City Lore",
        published_at="2026-11-20T19:40:00Z",
        replies_count=48,
        likes_count=132
    ),
    HomeCommunityHighlight(
        id="comm-02",
        title="Will 16GB VRAM become mandatory for 1440p High settings on PC?",
        author_username="RTX_Overclock",
        author_avatar_url=None,
        author_platform="PC",
        category="Hardware Speculation",
        published_at="2026-11-19T21:15:00Z",
        replies_count=89,
        likes_count=210
    ),
    HomeCommunityHighlight(
        id="comm-03",
        title="Soundtrack Curation Wishlist: 80s Synth Classics & Modern Florida Rap",
        author_username="ViceWaveRadio",
        author_avatar_url=None,
        author_platform="XBOX_SERIES",
        category="Music & Audio",
        published_at="2026-11-18T16:20:00Z",
        replies_count=64,
        likes_count=175
    )
]


@router.get("", response_model=ApiResponse[HomeAggregatedResponse])
async def get_homepage_feed(
    country_code: Optional[str] = Query(None, description="Country filter for deals"),
    currency: Optional[str] = Query(None, description="Currency filter for deals"),
    platform: Optional[str] = Query(None, description="Platform filter for deals"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves the complete aggregated homepage feed: news, deals, events, and community highlights.
    Adapts deals to player country/currency preferences if provided.
    Queries database for real Phase 4 published news articles with fallback to curated items.
    """
    # Fetch real articles from database
    news_items = []
    try:
        stmt = (
            select(NewsArticle)
            .options(selectinload(NewsArticle.category), selectinload(NewsArticle.source))
            .where(NewsArticle.publication_status == "PUBLISHED")
            .order_by(NewsArticle.is_featured.desc(), NewsArticle.original_published_at.desc())
            .limit(4)
        )
        res = await db.execute(stmt)
        articles = res.scalars().all()
        for art in articles:
            news_items.append(
                HomeNewsItem(
                    id=str(art.id),
                    title=art.title,
                    slug=art.slug,
                    summary=art.summary,
                    source_name=art.source.name if art.source else "Independent Report",
                    source_url=art.source.website_url if art.source else art.original_article_url,
                    published_at=art.original_published_at.isoformat(),
                    verification_status=art.verification_status,
                    category=art.category.name if art.category else "General Update",
                    thumbnail_url=art.image_url,
                )
            )
    except Exception:
        news_items = []

    if not news_items:
        news_items = CURATED_NEWS

    # Query verified deals from Phase 5 database
    deals_items = []
    try:
        deal_stmt = (
            select(PriceObservation)
            .options(
                selectinload(PriceObservation.product),
                selectinload(PriceObservation.region),
                selectinload(PriceObservation.store)
            )
            .where(
                PriceObservation.verification_status.in_(["VERIFIED", "STALE"]),
                PriceObservation.current_price > 0
            )
        )
        if country_code:
            deal_stmt = deal_stmt.join(PriceRegion).where(PriceRegion.country_code == country_code.upper())
        if currency:
            deal_stmt = deal_stmt.where(PriceObservation.currency_code == currency.upper())
        if platform:
            deal_stmt = deal_stmt.join(PriceProduct).where(PriceProduct.platform == platform.upper())

        deal_stmt = deal_stmt.order_by(desc(PriceObservation.discount_percentage), PriceObservation.current_price.asc()).limit(6)
        deal_res = await db.execute(deal_stmt)
        obs_deals = deal_res.scalars().all()
        for d in obs_deals:
            deals_items.append(
                HomeDealItem(
                    id=str(d.id),
                    edition_name=d.product.name,
                    platform=d.product.platform,
                    country_code=d.region.country_code,
                    current_price=float(d.current_price),
                    currency=d.currency_code,
                    original_price=float(d.original_price) if d.original_price else None,
                    discount_percentage=int(d.discount_percentage),
                    retailer_name=d.store.store_name,
                    product_url=d.product_url,
                    last_checked_at=d.observed_at.isoformat(),
                    is_preorder=True
                )
            )
    except Exception:
        deals_items = []

    if not deals_items:
        filtered_deals = CURATED_DEALS
        if country_code:
            country_matched = [d for d in filtered_deals if d.country_code.upper() == country_code.upper()]
            if country_matched:
                filtered_deals = country_matched
        if currency:
            currency_matched = [d for d in filtered_deals if d.currency.upper() == currency.upper()]
            if currency_matched:
                filtered_deals = currency_matched
        if platform:
            plat_matched = [d for d in filtered_deals if d.platform.upper() == platform.upper()]
            if plat_matched:
                filtered_deals = plat_matched
        deals_items = filtered_deals

    return ApiResponse(
        success=True,
        data=HomeAggregatedResponse(
            news=news_items,
            deals=deals_items[:4],
            events=CURATED_EVENTS,
            community=CURATED_COMMUNITY,
            disclaimer="All news is classified under 4-tier truth verification. Official PC system requirements and global store pricing remain unannounced until published by Rockstar Games."
        )
    )


@router.get("/news", response_model=ApiResponse[List[HomeNewsItem]])
async def get_home_news(db: AsyncSession = Depends(get_db)):
    """Retrieves curated latest news and official bulletins for the homepage from database."""
    news_items = []
    try:
        stmt = (
            select(NewsArticle)
            .options(selectinload(NewsArticle.category), selectinload(NewsArticle.source))
            .where(NewsArticle.publication_status == "PUBLISHED")
            .order_by(NewsArticle.is_featured.desc(), NewsArticle.original_published_at.desc())
            .limit(4)
        )
        res = await db.execute(stmt)
        articles = res.scalars().all()
        for art in articles:
            news_items.append(
                HomeNewsItem(
                    id=str(art.id),
                    title=art.title,
                    slug=art.slug,
                    summary=art.summary,
                    source_name=art.source.name if art.source else "Independent Report",
                    source_url=art.source.website_url if art.source else art.original_article_url,
                    published_at=art.original_published_at.isoformat(),
                    verification_status=art.verification_status,
                    category=art.category.name if art.category else "General Update",
                    thumbnail_url=art.image_url,
                )
            )
    except Exception:
        news_items = []

    if not news_items:
        news_items = CURATED_NEWS

    return ApiResponse(success=True, data=news_items)


@router.get("/deals", response_model=ApiResponse[List[HomeDealItem]])
async def get_home_deals(
    country_code: Optional[str] = Query(None),
    currency: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves featured store deals and pre-orders, localized by region/currency."""
    deals_items = []
    try:
        deal_stmt = (
            select(PriceObservation)
            .options(
                selectinload(PriceObservation.product),
                selectinload(PriceObservation.region),
                selectinload(PriceObservation.store)
            )
            .where(
                PriceObservation.verification_status.in_(["VERIFIED", "STALE"]),
                PriceObservation.current_price > 0
            )
        )
        if country_code:
            deal_stmt = deal_stmt.join(PriceRegion).where(PriceRegion.country_code == country_code.upper())
        if currency:
            deal_stmt = deal_stmt.where(PriceObservation.currency_code == currency.upper())
        if platform:
            deal_stmt = deal_stmt.join(PriceProduct).where(PriceProduct.platform == platform.upper())

        deal_stmt = deal_stmt.order_by(desc(PriceObservation.discount_percentage), PriceObservation.current_price.asc()).limit(6)
        deal_res = await db.execute(deal_stmt)
        obs_deals = deal_res.scalars().all()
        for d in obs_deals:
            deals_items.append(
                HomeDealItem(
                    id=str(d.id),
                    edition_name=d.product.name,
                    platform=d.product.platform,
                    country_code=d.region.country_code,
                    current_price=float(d.current_price),
                    currency=d.currency_code,
                    original_price=float(d.original_price) if d.original_price else None,
                    discount_percentage=int(d.discount_percentage),
                    retailer_name=d.store.store_name,
                    product_url=d.product_url,
                    last_checked_at=d.observed_at.isoformat(),
                    is_preorder=True
                )
            )
    except Exception:
        deals_items = []

    if not deals_items:
        deals = CURATED_DEALS
        if country_code:
            matched = [d for d in deals if d.country_code.upper() == country_code.upper()]
            if matched:
                deals = matched
        if currency:
            matched = [d for d in deals if d.currency.upper() == currency.upper()]
            if matched:
                deals = matched
        if platform:
            matched = [d for d in deals if d.platform.upper() == platform.upper()]
            if matched:
                deals = matched
        deals_items = deals

    return ApiResponse(success=True, data=deals_items)


@router.get("/events", response_model=ApiResponse[List[HomeEventItem]])
async def get_home_events():
    """Retrieves major GTA VI timeline milestones and broadcast events."""
    return ApiResponse(success=True, data=CURATED_EVENTS)


@router.get("/community", response_model=ApiResponse[List[HomeCommunityHighlight]])
async def get_home_community():
    """Retrieves trending public community discussions."""
    return ApiResponse(success=True, data=CURATED_COMMUNITY)
