import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user, get_optional_current_user
from app.models.news import NewsArticle, NewsBookmark, NewsCategory, NewsSource
from app.schemas.news import (
    BookmarkResponse,
    NewsArticleDetail,
    NewsArticleListItem,
    NewsBookmarkItem,
    NewsCategoryRead,
    NewsIngestionResult,
    NewsListResponse,
    NewsSourceRead,
    NewsStatsResponse,
)
from app.services.news_collector import (
    run_news_ingestion,
    seed_initial_verified_news,
)

router = APIRouter(prefix="/news", tags=["News & Updates"])


def response_meta() -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


async def ensure_news_seeded(db: AsyncSession):
    """Ensures base news data is seeded on first query."""
    count_stmt = select(func.count(NewsArticle.id))
    res = await db.execute(count_stmt)
    count = res.scalar() or 0
    if count == 0:
        await seed_initial_verified_news(db)


def to_list_item(article: NewsArticle, is_bookmarked: bool = False) -> NewsArticleListItem:
    return NewsArticleListItem(
        id=str(article.id),
        title=article.title,
        slug=article.slug,
        summary=article.summary,
        image_url=article.image_url,
        category_id=str(article.category_id) if article.category_id else None,
        category_name=article.category.name if article.category else None,
        category_slug=article.category.slug if article.category else None,
        source_id=str(article.source_id) if article.source_id else None,
        source_name=article.source.name if article.source else "Independent Report",
        source_url=article.source.website_url if article.source else article.original_article_url,
        original_article_url=article.original_article_url,
        canonical_url=article.canonical_url,
        verification_status=article.verification_status,
        publication_status=article.publication_status,
        original_published_at=article.original_published_at,
        is_featured=article.is_featured,
        read_time_minutes=article.read_time_minutes,
        is_bookmarked=is_bookmarked,
    )


@router.get("", response_model=dict)
async def get_news_list(
    q: Optional[str] = Query(None, description="Search query for title and summary"),
    category: Optional[str] = Query(None, description="Category slug"),
    source_id: Optional[str] = Query(None, description="Source UUID"),
    verification_status: Optional[str] = Query(None, description="OFFICIAL, VERIFIED, RUMOUR, UNCONFIRMED"),
    sort: str = Query("latest", pattern="^(latest|oldest|featured)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
):
    """
    Retrieves paginated news articles with filtering, searching, and sorting.
    """
    await ensure_news_seeded(db)

    # Base query for published articles
    stmt = (
        select(NewsArticle)
        .options(selectinload(NewsArticle.category), selectinload(NewsArticle.source))
        .where(NewsArticle.publication_status == "PUBLISHED")
    )

    # Search filter
    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            (NewsArticle.title.ilike(search_pattern)) | (NewsArticle.summary.ilike(search_pattern))
        )

    # Category filter
    if category and category.strip():
        stmt = stmt.join(NewsArticle.category).where(NewsCategory.slug == category.strip())

    # Source filter
    if source_id and source_id.strip():
        try:
            parsed_src_id = uuid.UUID(source_id.strip())
            stmt = stmt.where(NewsArticle.source_id == parsed_src_id)
        except ValueError:
            pass

    # Verification status filter
    if verification_status and verification_status.strip():
        stmt = stmt.where(NewsArticle.verification_status == verification_status.strip().upper())

    # Count total matching
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Sorting
    if sort == "oldest":
        stmt = stmt.order_by(NewsArticle.original_published_at.asc())
    elif sort == "featured":
        stmt = stmt.order_by(NewsArticle.is_featured.desc(), NewsArticle.original_published_at.desc())
    else:
        stmt = stmt.order_by(NewsArticle.original_published_at.desc())

    # Pagination
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    res = await db.execute(stmt)
    articles = res.scalars().all()

    # User bookmarks lookup
    bookmarked_ids = set()
    if current_user:
        bm_stmt = select(NewsBookmark.article_id).where(NewsBookmark.player_id == current_user.id)
        bm_res = await db.execute(bm_stmt)
        bookmarked_ids = set(str(row) for row in bm_res.scalars().all())

    items = [to_list_item(a, is_bookmarked=str(a.id) in bookmarked_ids) for a in articles]
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "success": True,
        "data": NewsListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_more=page < total_pages,
        ).model_dump(),
        "error": None,
        "meta": response_meta(),
    }


@router.get("/featured", response_model=dict)
async def get_featured_news(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
):
    """
    Returns the primary featured article, or the latest official/verified report.
    """
    await ensure_news_seeded(db)

    stmt = (
        select(NewsArticle)
        .options(selectinload(NewsArticle.category), selectinload(NewsArticle.source))
        .where(NewsArticle.publication_status == "PUBLISHED")
        .order_by(NewsArticle.is_featured.desc(), NewsArticle.original_published_at.desc())
        .limit(1)
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        return {
            "success": True,
            "data": None,
            "error": None,
            "meta": response_meta(),
        }

    is_bookmarked = False
    if current_user:
        bm_stmt = select(NewsBookmark.id).where(
            (NewsBookmark.article_id == article.id) & (NewsBookmark.player_id == current_user.id)
        )
        bm_res = await db.execute(bm_stmt)
        is_bookmarked = bm_res.scalar_one_or_none() is not None

    return {
        "success": True,
        "data": to_list_item(article, is_bookmarked=is_bookmarked).model_dump(),
        "error": None,
        "meta": response_meta(),
    }


@router.get("/categories", response_model=dict)
async def get_news_categories(db: AsyncSession = Depends(get_db)):
    """
    Returns all active news categories with published article counts.
    """
    await ensure_news_seeded(db)

    stmt = (
        select(
            NewsCategory,
            func.count(NewsArticle.id).label("articles_count")
        )
        .outerjoin(
            NewsArticle,
            (NewsArticle.category_id == NewsCategory.id) & (NewsArticle.publication_status == "PUBLISHED")
        )
        .where(NewsCategory.is_active == True)
        .group_by(NewsCategory.id)
        .order_by(NewsCategory.name.asc())
    )
    res = await db.execute(stmt)
    results = res.all()

    categories = [
        NewsCategoryRead(
            id=str(cat.id),
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            is_active=cat.is_active,
            articles_count=count,
        ).model_dump()
        for cat, count in results
    ]

    return {
        "success": True,
        "data": categories,
        "error": None,
        "meta": response_meta(),
    }


@router.get("/sources", response_model=dict)
async def get_news_sources(db: AsyncSession = Depends(get_db)):
    """
    Returns public information regarding enabled news sources.
    """
    await ensure_news_seeded(db)

    stmt = select(NewsSource).where(NewsSource.is_enabled == True).order_by(NewsSource.trust_level.asc(), NewsSource.name.asc())
    res = await db.execute(stmt)
    sources = res.scalars().all()

    return {
        "success": True,
        "data": [
            NewsSourceRead(
                id=str(s.id),
                name=s.name,
                website_url=s.website_url,
                source_type=s.source_type,
                trust_level=s.trust_level,
                is_enabled=s.is_enabled,
            ).model_dump()
            for s in sources
        ],
        "error": None,
        "meta": response_meta(),
    }


@router.get("/stats", response_model=dict)
async def get_news_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns aggregate statistics for verified reporting.
    """
    await ensure_news_seeded(db)

    stmt = select(
        func.count(NewsArticle.id).label("total"),
        func.count().filter(NewsArticle.verification_status == "OFFICIAL").label("official"),
        func.count().filter(NewsArticle.verification_status == "VERIFIED").label("verified"),
        func.count().filter(NewsArticle.verification_status == "RUMOUR").label("rumour"),
        func.count().filter(NewsArticle.verification_status == "UNCONFIRMED").label("unconfirmed"),
        func.max(NewsArticle.original_published_at).label("last_updated"),
    ).where(NewsArticle.publication_status == "PUBLISHED")

    res = await db.execute(stmt)
    row = res.one()

    return {
        "success": True,
        "data": NewsStatsResponse(
            total_articles=row.total or 0,
            official_count=row.official or 0,
            verified_count=row.verified or 0,
            rumour_count=row.rumour or 0,
            unconfirmed_count=row.unconfirmed or 0,
            last_updated=row.last_updated,
        ).model_dump(),
        "error": None,
        "meta": response_meta(),
    }


@router.get("/bookmarks", response_model=dict)
async def get_player_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns articles bookmarked by the currently authenticated player.
    """
    stmt = (
        select(NewsBookmark)
        .options(
            selectinload(NewsBookmark.article).selectinload(NewsArticle.category),
            selectinload(NewsBookmark.article).selectinload(NewsArticle.source),
        )
        .where(NewsBookmark.player_id == current_user.id)
        .order_by(NewsBookmark.created_at.desc())
    )
    res = await db.execute(stmt)
    bookmarks = res.scalars().all()

    items = [
        NewsBookmarkItem(
            bookmark_id=str(bm.id),
            article=to_list_item(bm.article, is_bookmarked=True),
            created_at=bm.created_at,
        ).model_dump()
        for bm in bookmarks
        if bm.article and bm.article.publication_status == "PUBLISHED"
    ]

    return {
        "success": True,
        "data": items,
        "error": None,
        "meta": response_meta(),
    }


@router.post("/{article_id}/bookmark", response_model=dict)
async def add_bookmark(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Saves an article to the player's personal bookmarks.
    """
    try:
        parsed_article_id = uuid.UUID(article_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid article ID format.",
        )

    # Check article exists
    art_stmt = select(NewsArticle).where(
        (NewsArticle.id == parsed_article_id) & (NewsArticle.publication_status == "PUBLISHED")
    )
    art_res = await db.execute(art_stmt)
    article = art_res.scalar_one_or_none()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found or not published.",
        )

    # Check already bookmarked
    bm_stmt = select(NewsBookmark).where(
        (NewsBookmark.player_id == current_user.id) & (NewsBookmark.article_id == parsed_article_id)
    )
    bm_res = await db.execute(bm_stmt)
    existing = bm_res.scalar_one_or_none()

    if not existing:
        new_bm = NewsBookmark(
            id=uuid.uuid4(),
            player_id=current_user.id,
            article_id=parsed_article_id,
        )
        db.add(new_bm)
        await db.commit()

    return {
        "success": True,
        "data": BookmarkResponse(
            article_id=article_id,
            is_bookmarked=True,
            message="Article saved to your personal bookmarks.",
        ).model_dump(),
        "error": None,
        "meta": response_meta(),
    }


@router.delete("/{article_id}/bookmark", response_model=dict)
async def remove_bookmark(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Removes an article from the player's personal bookmarks.
    """
    try:
        parsed_article_id = uuid.UUID(article_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid article ID format.",
        )

    bm_stmt = select(NewsBookmark).where(
        (NewsBookmark.player_id == current_user.id) & (NewsBookmark.article_id == parsed_article_id)
    )
    bm_res = await db.execute(bm_stmt)
    existing = bm_res.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()

    return {
        "success": True,
        "data": BookmarkResponse(
            article_id=article_id,
            is_bookmarked=False,
            message="Article removed from bookmarks.",
        ).model_dump(),
        "error": None,
        "meta": response_meta(),
    }


@router.get("/{slug}", response_model=dict)
async def get_news_detail(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
):
    """
    Returns full details for a single published news article, plus related articles.
    """
    await ensure_news_seeded(db)

    stmt = (
        select(NewsArticle)
        .options(selectinload(NewsArticle.category), selectinload(NewsArticle.source))
        .where((NewsArticle.slug == slug) & (NewsArticle.publication_status == "PUBLISHED"))
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"News article with slug '{slug}' was not found.",
        )

    # Check bookmarked
    is_bookmarked = False
    if current_user:
        bm_stmt = select(NewsBookmark.id).where(
            (NewsBookmark.article_id == article.id) & (NewsBookmark.player_id == current_user.id)
        )
        bm_res = await db.execute(bm_stmt)
        is_bookmarked = bm_res.scalar_one_or_none() is not None

    # Fetch up to 3 related articles from same category
    related_items = []
    if article.category_id:
        rel_stmt = (
            select(NewsArticle)
            .options(selectinload(NewsArticle.category), selectinload(NewsArticle.source))
            .where(
                (NewsArticle.category_id == article.category_id)
                & (NewsArticle.id != article.id)
                & (NewsArticle.publication_status == "PUBLISHED")
            )
            .order_by(NewsArticle.original_published_at.desc())
            .limit(3)
        )
        rel_res = await db.execute(rel_stmt)
        related_articles = rel_res.scalars().all()
        related_items = [to_list_item(rel) for rel in related_articles]

    detail = NewsArticleDetail(
        **to_list_item(article, is_bookmarked=is_bookmarked).model_dump(),
        content=article.content,
        related_articles=related_items,
    )

    return {
        "success": True,
        "data": detail.model_dump(),
        "error": None,
        "meta": response_meta(),
    }


@router.get("/{slug}/related", response_model=dict)
async def get_related_news(
    slug: str,
    limit: int = Query(3, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns related articles for a given article slug.
    """
    await ensure_news_seeded(db)

    stmt = select(NewsArticle).where(
        (NewsArticle.slug == slug) & (NewsArticle.publication_status == "PUBLISHED")
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article or not article.category_id:
        return {
            "success": True,
            "data": [],
            "error": None,
            "meta": response_meta(),
        }

    rel_stmt = (
        select(NewsArticle)
        .options(selectinload(NewsArticle.category), selectinload(NewsArticle.source))
        .where(
            (NewsArticle.category_id == article.category_id)
            & (NewsArticle.id != article.id)
            & (NewsArticle.publication_status == "PUBLISHED")
        )
        .order_by(NewsArticle.original_published_at.desc())
        .limit(limit)
    )
    rel_res = await db.execute(rel_stmt)
    related = rel_res.scalars().all()

    return {
        "success": True,
        "data": [to_list_item(r).model_dump() for r in related],
        "error": None,
        "meta": response_meta(),
    }


@router.post("/collect", response_model=dict)
async def trigger_news_collection(db: AsyncSession = Depends(get_db)):
    """
    Trigger news collection and synchronization across approved sources.
    """
    result = await run_news_ingestion(db)
    return {
        "success": True,
        "data": result.model_dump(),
        "error": None,
        "meta": response_meta(),
    }
