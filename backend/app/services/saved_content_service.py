import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.community import CommunityBookmark, CommunityPost
from app.models.event import Event, SavedEvent
from app.models.news import NewsArticle, NewsBookmark
from app.models.price import PriceProduct, PriceWishlist
from app.schemas.search import UnifiedSavedContentResponse, UnifiedSavedItem


async def get_player_saved_content(
    session: AsyncSession,
    user_id: uuid.UUID | str,
    content_type: str = "ALL",
    page: int = 1,
    page_size: int = 20,
) -> UnifiedSavedContentResponse:
    """Aggregates saved content across News Bookmarks, Price Wishlist, Saved Events,
    and Community Bookmarks without duplicating database storage.
    """
    if isinstance(user_id, str):
        try:
            parsed_user_id = uuid.UUID(user_id)
        except ValueError:
            parsed_user_id = user_id
    else:
        parsed_user_id = user_id

    content_type_upper = (content_type or "ALL").upper()
    all_items: List[UnifiedSavedItem] = []

    # 1. News Bookmarks
    news_items: List[UnifiedSavedItem] = []
    if content_type_upper in ("ALL", "NEWS"):
        stmt = (
            select(NewsBookmark, NewsArticle)
            .join(NewsArticle, NewsBookmark.article_id == NewsArticle.id)
            .where(NewsBookmark.player_id == parsed_user_id)
            .order_by(desc(NewsBookmark.created_at))
        )
        res = await session.execute(stmt)
        for bm, art in res.all():
            src_name = art.source.name if hasattr(art, "source") and art.source else "Rockstar Games"
            news_items.append(
                UnifiedSavedItem(
                    id=str(bm.id),
                    saved_type="NEWS",
                    saved_at=bm.created_at or datetime.now(timezone.utc),
                    title=art.title,
                    description=art.summary,
                    url_path=f"/news/{art.slug}",
                    thumbnail_url=art.image_url,
                    badge=art.verification_status,
                    metadata={
                        "article_id": str(art.id),
                        "slug": art.slug,
                        "source": src_name,
                        "published_at": art.original_published_at.isoformat() if art.original_published_at else None,
                    },
                )
            )

    # 2. Price Wishlist
    deals_items: List[UnifiedSavedItem] = []
    if content_type_upper in ("ALL", "DEALS"):
        stmt = (
            select(PriceWishlist, PriceProduct)
            .join(PriceProduct, PriceWishlist.product_id == PriceProduct.id)
            .where(PriceWishlist.player_id == parsed_user_id)
            .order_by(desc(PriceWishlist.created_at))
        )
        res = await session.execute(stmt)
        for wl, prod in res.all():
            deals_items.append(
                UnifiedSavedItem(
                    id=str(wl.id),
                    saved_type="DEALS",
                    saved_at=wl.created_at or datetime.now(timezone.utc),
                    title=f"{prod.name} ({prod.edition})" if prod.edition else prod.name,
                    description=f"Platform: {prod.platform}",
                    url_path=f"/price-deals/{prod.slug}",
                    thumbnail_url=prod.image_url,
                    badge=prod.edition or "GAME",
                    metadata={
                        "product_id": str(prod.id),
                        "slug": prod.slug,
                        "platform": str(prod.platform),
                    },
                )
            )

    # 3. Saved Events
    events_items: List[UnifiedSavedItem] = []
    if content_type_upper in ("ALL", "EVENTS"):
        stmt = (
            select(SavedEvent, Event)
            .join(Event, SavedEvent.event_id == Event.id)
            .where(SavedEvent.user_id == parsed_user_id)
            .order_by(desc(SavedEvent.created_at))
        )
        res = await session.execute(stmt)
        for se, ev in res.all():
            events_items.append(
                UnifiedSavedItem(
                    id=str(se.id),
                    saved_type="EVENTS",
                    saved_at=se.created_at or datetime.now(timezone.utc),
                    title=ev.title,
                    description=ev.short_summary or ev.description,
                    url_path=f"/events/{ev.slug}",
                    thumbnail_url=ev.banner_image_url,
                    badge="UPCOMING" if (ev.start_time and ev.start_time > datetime.now(timezone.utc)) else "EVENT",
                    metadata={
                        "event_id": str(ev.id),
                        "slug": ev.slug,
                        "start_time": ev.start_time.isoformat() if ev.start_time else None,
                        "notes": se.notes,
                    },
                )
            )

    # 4. Community Bookmarks
    community_items: List[UnifiedSavedItem] = []
    if content_type_upper in ("ALL", "COMMUNITY"):
        stmt = (
            select(CommunityBookmark, CommunityPost)
            .join(CommunityPost, CommunityBookmark.post_id == CommunityPost.id)
            .where(CommunityBookmark.player_id == parsed_user_id)
            .order_by(desc(CommunityBookmark.created_at))
        )
        res = await session.execute(stmt)
        for cb, post in res.all():
            # Exclude deleted posts
            if post.post_status != "DELETED":
                content_str = post.content or ""
                summary_text = (content_str[:160] + "...") if len(content_str) > 160 else content_str
                community_items.append(
                    UnifiedSavedItem(
                        id=str(cb.id),
                        saved_type="COMMUNITY",
                        saved_at=cb.created_at or datetime.now(timezone.utc),
                        title=post.title,
                        description=summary_text,
                        url_path=f"/community/post/{post.id}",
                        thumbnail_url=None,
                        badge="DISCUSSION",
                        metadata={
                            "post_id": str(post.id),
                            "player_id": str(post.player_id),
                        },
                    )
                )

    # Query counts for all categories independently for tab counts
    count_news_stmt = select(func.count(NewsBookmark.id)).where(NewsBookmark.player_id == parsed_user_id)
    count_deals_stmt = select(func.count(PriceWishlist.id)).where(PriceWishlist.player_id == parsed_user_id)
    count_events_stmt = select(func.count(SavedEvent.id)).where(SavedEvent.user_id == parsed_user_id)
    count_community_stmt = select(func.count(CommunityBookmark.id)).where(CommunityBookmark.player_id == parsed_user_id)

    count_news = (await session.execute(count_news_stmt)).scalar() or 0
    count_deals = (await session.execute(count_deals_stmt)).scalar() or 0
    count_events = (await session.execute(count_events_stmt)).scalar() or 0
    count_community = (await session.execute(count_community_stmt)).scalar() or 0

    counts_by_type = {
        "ALL": count_news + count_deals + count_events + count_community,
        "NEWS": count_news,
        "DEALS": count_deals,
        "EVENTS": count_events,
        "COMMUNITY": count_community,
    }

    # Combine requested items
    if content_type_upper == "NEWS":
        all_items = news_items
    elif content_type_upper == "DEALS":
        all_items = deals_items
    elif content_type_upper == "EVENTS":
        all_items = events_items
    elif content_type_upper == "COMMUNITY":
        all_items = community_items
    else:
        all_items = sorted(
            news_items + deals_items + events_items + community_items,
            key=lambda x: x.saved_at,
            reverse=True,
        )

    total = len(all_items)
    total_pages = max(1, (total + page_size - 1) // page_size) if page_size > 0 else 1
    start_idx = (page - 1) * page_size
    paged_items = all_items[start_idx : start_idx + page_size]

    return UnifiedSavedContentResponse(
        items=paged_items,
        total=total,
        counts_by_type=counts_by_type,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def remove_saved_item(
    session: AsyncSession,
    user_id: uuid.UUID | str,
    saved_type: str,
    item_id: str,
) -> bool:
    """Removes a saved item (bookmark/wishlist/saved event) for the player."""
    if isinstance(user_id, str):
        try:
            parsed_user_id = uuid.UUID(user_id)
        except ValueError:
            parsed_user_id = user_id
    else:
        parsed_user_id = user_id

    saved_type_upper = saved_type.upper()
    deleted = False

    try:
        parsed_item_id = uuid.UUID(item_id)
    except ValueError:
        return False

    if saved_type_upper == "NEWS":
        stmt = delete(NewsBookmark).where(
            NewsBookmark.id == parsed_item_id,
            NewsBookmark.player_id == parsed_user_id,
        )
        res = await session.execute(stmt)
        if res.rowcount > 0:
            deleted = True

    elif saved_type_upper == "DEALS":
        stmt = delete(PriceWishlist).where(
            PriceWishlist.id == parsed_item_id,
            PriceWishlist.player_id == parsed_user_id,
        )
        res = await session.execute(stmt)
        if res.rowcount > 0:
            deleted = True

    elif saved_type_upper == "EVENTS":
        stmt = delete(SavedEvent).where(
            SavedEvent.id == parsed_item_id,
            SavedEvent.user_id == parsed_user_id,
        )
        res = await session.execute(stmt)
        if res.rowcount > 0:
            deleted = True

    elif saved_type_upper == "COMMUNITY":
        stmt = delete(CommunityBookmark).where(
            CommunityBookmark.id == parsed_item_id,
            CommunityBookmark.player_id == parsed_user_id,
        )
        res = await session.execute(stmt)
        if res.rowcount > 0:
            deleted = True

    if deleted:
        await session.commit()

    return deleted
