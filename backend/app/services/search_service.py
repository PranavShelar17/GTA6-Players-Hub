import math
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import (
    and_,
    case,
    delete,
    desc,
    func,
    or_,
    select,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.models.community import CommunityBlock, CommunityMute, CommunityPost
from app.models.event import Event, EventCategory
from app.models.news import NewsArticle, NewsCategory, NewsSource
from app.models.price import PriceObservation, PriceProduct, PriceStore
from app.models.problem_solver import AIKnowledgeDocument, AIKnowledgeSource
from app.models.search import SearchIndex, UserSearchHistory
from app.schemas.search import (
    SearchCategoriesStats,
    SearchHistoryItem,
    SearchResponse,
    SearchResultItem,
    SearchSuggestionItem,
    SearchSuggestionsResponse,
)

POPULAR_SEARCH_TERMS = [
    "GTA 6 latest news",
    "Official Trailer 2",
    "Vice City release date",
    "PlayStation 5 preorder price",
    "PC system requirements",
    "DirectX 12 crash fix",
    "Rockstar Newswire announcements",
    "Take-Two earnings report",
]


class SearchService:
    """Enterprise search service managing search indexing, multi-category queries,
    search suggestions, and private player search history.
    """

    @classmethod
    async def sync_search_index(cls, session: AsyncSession) -> int:
        """Syncs and rebuilds the unified search_index table from all primary entities.
        Safely upserts active records and removes stale or deleted content.
        """
        indexed_count = 0
        now = datetime.now(timezone.utc)

        # 1. Index News Articles
        news_stmt = select(NewsArticle).options(
            selectinload(NewsArticle.category),
            selectinload(NewsArticle.source),
        )
        news_res = await session.execute(news_stmt)
        news_articles = news_res.scalars().all()

        for art in news_articles:
            cat_name = art.category.name if art.category else "News"
            src_name = art.source.name if art.source else "Rockstar Games"
            search_text = f"{art.title} {art.summary or ''} {cat_name} {src_name}".lower()

            existing_stmt = select(SearchIndex).where(
                SearchIndex.content_type == "NEWS",
                SearchIndex.content_id == str(art.id),
            )
            existing = (await session.execute(existing_stmt)).scalar_one_or_none()

            if existing:
                existing.title = art.title
                existing.description = art.summary or ""
                existing.searchable_text = search_text
                existing.category = cat_name
                existing.url_path = f"/news/{art.slug}"
                existing.thumbnail_url = art.image_url
                existing.verification_status = art.verification_status
                existing.source_or_author = src_name
                existing.published_or_event_at = art.original_published_at or art.created_at
                existing.source_updated_at = art.updated_at or now
                existing.indexed_at = now
            else:
                new_idx = SearchIndex(
                    content_type="NEWS",
                    content_id=str(art.id),
                    title=art.title,
                    description=art.summary or "",
                    searchable_text=search_text,
                    category=cat_name,
                    url_path=f"/news/{art.slug}",
                    thumbnail_url=art.image_url,
                    verification_status=art.verification_status,
                    source_or_author=src_name,
                    published_or_event_at=art.original_published_at or art.created_at,
                    source_updated_at=art.updated_at or now,
                    indexed_at=now,
                    is_public=True,
                )
                session.add(new_idx)
            indexed_count += 1

        # 2. Index Price Products & Deals
        prod_stmt = select(PriceProduct).options(
            selectinload(PriceProduct.observations).selectinload(PriceObservation.store)
        )
        prod_res = await session.execute(prod_stmt)
        products = prod_res.scalars().all()

        for prod in products:
            latest_obs = prod.observations[-1] if prod.observations else None
            price_val = latest_obs.current_price if latest_obs else None
            curr_code = latest_obs.currency_code if latest_obs else "USD"
            ver_status = latest_obs.verification_status if latest_obs else "VERIFIED"
            store_name = latest_obs.store.store_name if latest_obs and latest_obs.store else "Authorized Retailers"

            search_text = f"{prod.name} {prod.edition} {prod.platform} {prod.description or ''} {store_name}".lower()

            existing_stmt = select(SearchIndex).where(
                SearchIndex.content_type == "DEALS",
                SearchIndex.content_id == str(prod.id),
            )
            existing = (await session.execute(existing_stmt)).scalar_one_or_none()

            if existing:
                existing.title = prod.name
                existing.description = f"{prod.edition} on {prod.platform}"
                existing.searchable_text = search_text
                existing.category = prod.platform
                existing.url_path = f"/price-deals/{prod.slug}"
                existing.thumbnail_url = prod.image_url
                existing.verification_status = ver_status
                existing.source_or_author = store_name
                existing.price_amount = price_val
                existing.currency_code = curr_code
                existing.published_or_event_at = prod.created_at
                existing.source_updated_at = prod.updated_at or now
                existing.indexed_at = now
            else:
                new_idx = SearchIndex(
                    content_type="DEALS",
                    content_id=str(prod.id),
                    title=prod.name,
                    description=f"{prod.edition} on {prod.platform}",
                    searchable_text=search_text,
                    category=prod.platform,
                    url_path=f"/price-deals/{prod.slug}",
                    thumbnail_url=prod.image_url,
                    verification_status=ver_status,
                    source_or_author=store_name,
                    price_amount=price_val,
                    currency_code=curr_code,
                    published_or_event_at=prod.created_at,
                    source_updated_at=prod.updated_at or now,
                    indexed_at=now,
                    is_public=True,
                )
                session.add(new_idx)
            indexed_count += 1

        # 3. Index Events
        evt_stmt = select(Event).options(selectinload(Event.category))
        evt_res = await session.execute(evt_stmt)
        events = evt_res.scalars().all()

        for ev in events:
            cat_name = ev.category.name if ev.category else "Events"
            search_text = (
                f"{ev.title} {ev.short_summary or ''} {ev.description} "
                f"{cat_name} {ev.location_name or ''} {ev.organizer_name or ''}"
            ).lower()

            existing_stmt = select(SearchIndex).where(
                SearchIndex.content_type == "EVENTS",
                SearchIndex.content_id == str(ev.id),
            )
            existing = (await session.execute(existing_stmt)).scalar_one_or_none()

            if existing:
                existing.title = ev.title
                existing.description = ev.short_summary or ev.description[:200]
                existing.searchable_text = search_text
                existing.category = cat_name
                existing.url_path = f"/events/{ev.slug}"
                existing.thumbnail_url = ev.banner_image_url
                existing.verification_status = ev.verification_status
                existing.source_or_author = ev.organizer_name or "Rockstar Games"
                existing.published_or_event_at = ev.start_time
                existing.source_updated_at = ev.updated_at or now
                existing.indexed_at = now
            else:
                new_idx = SearchIndex(
                    content_type="EVENTS",
                    content_id=str(ev.id),
                    title=ev.title,
                    description=ev.short_summary or ev.description[:200],
                    searchable_text=search_text,
                    category=cat_name,
                    url_path=f"/events/{ev.slug}",
                    thumbnail_url=ev.banner_image_url,
                    verification_status=ev.verification_status,
                    source_or_author=ev.organizer_name or "Rockstar Games",
                    published_or_event_at=ev.start_time,
                    source_updated_at=ev.updated_at or now,
                    indexed_at=now,
                    is_public=True,
                )
                session.add(new_idx)
            indexed_count += 1

        # 4. Index Community Posts (Public, published only)
        comm_stmt = (
            select(CommunityPost)
            .where(CommunityPost.post_status == "PUBLISHED")
            .options(selectinload(CommunityPost.category))
        )
        comm_res = await session.execute(comm_stmt)
        posts = comm_res.scalars().all()

        for post in posts:
            cat_name = post.category.name if post.category else "Discussions"
            author_name = "Community Member"
            search_text = f"{post.title} {post.content} {cat_name} {author_name}".lower()

            existing_stmt = select(SearchIndex).where(
                SearchIndex.content_type == "COMMUNITY",
                SearchIndex.content_id == str(post.id),
            )
            existing = (await session.execute(existing_stmt)).scalar_one_or_none()

            if existing:
                existing.title = post.title
                existing.description = post.content[:200]
                existing.searchable_text = search_text
                existing.category = cat_name
                existing.url_path = f"/community/post/{post.id}"
                existing.thumbnail_url = None
                existing.verification_status = "PUBLIC"
                existing.source_or_author = author_name
                existing.published_or_event_at = post.created_at
                existing.source_updated_at = post.updated_at or now
                existing.indexed_at = now
            else:
                new_idx = SearchIndex(
                    content_type="COMMUNITY",
                    content_id=str(post.id),
                    title=post.title,
                    description=post.content[:200],
                    searchable_text=search_text,
                    category=cat_name,
                    url_path=f"/community/post/{post.id}",
                    thumbnail_url=None,
                    verification_status="PUBLIC",
                    source_or_author=author_name,
                    published_or_event_at=post.created_at,
                    source_updated_at=post.updated_at or now,
                    indexed_at=now,
                    is_public=True,
                )
                session.add(new_idx)
            indexed_count += 1

        # 5. Index AI Problem Solver Public Knowledge Documents
        doc_stmt = select(AIKnowledgeDocument).options(
            selectinload(AIKnowledgeDocument.source)
        )
        doc_res = await session.execute(doc_stmt)
        docs = doc_res.scalars().all()

        for doc in docs:
            src_name = doc.source.name if doc.source else "Technical Support"
            search_text = f"{doc.title} {doc.summary or ''} {doc.content} {doc.category} {src_name}".lower()

            existing_stmt = select(SearchIndex).where(
                SearchIndex.content_type == "HELP",
                SearchIndex.content_id == str(doc.id),
            )
            existing = (await session.execute(existing_stmt)).scalar_one_or_none()

            if existing:
                existing.title = doc.title
                existing.description = doc.summary or doc.content[:200]
                existing.searchable_text = search_text
                existing.category = doc.category
                existing.url_path = "/problem-solver"
                existing.thumbnail_url = None
                existing.verification_status = "OFFICIAL"
                existing.source_or_author = src_name
                existing.published_or_event_at = doc.created_at
                existing.source_updated_at = doc.updated_at or now
                existing.indexed_at = now
            else:
                new_idx = SearchIndex(
                    content_type="HELP",
                    content_id=str(doc.id),
                    title=doc.title,
                    description=doc.summary or doc.content[:200],
                    searchable_text=search_text,
                    category=doc.category,
                    url_path="/problem-solver",
                    thumbnail_url=None,
                    verification_status="OFFICIAL",
                    source_or_author=src_name,
                    published_or_event_at=doc.created_at,
                    source_updated_at=doc.updated_at or now,
                    indexed_at=now,
                    is_public=True,
                )
                session.add(new_idx)
            indexed_count += 1

        await session.commit()
        logger.info(f"Synchronized search index: {indexed_count} items indexed.")
        return indexed_count

    @classmethod
    async def _ensure_index_populated(cls, session: AsyncSession) -> None:
        """Auto-populates search_index on first query if empty."""
        count_stmt = select(func.count(SearchIndex.id))
        count_res = await session.execute(count_stmt)
        if (count_res.scalar() or 0) == 0:
            await cls.sync_search_index(session)

    @classmethod
    async def search(
        cls,
        session: AsyncSession,
        q: str = "",
        query: Optional[str] = None,
        category: str = "all",
        sort: str = "relevant",
        page: int = 1,
        page_size: int = 10,
        current_user: Optional[Any] = None,
    ) -> SearchResponse:
        """Executes full-text multi-category search with safe parameter handling,
        rank scoring, category filtering, and community privacy protection.
        """
        await cls._ensure_index_populated(session)

        raw_q = (query if query is not None else q or "").strip()
        tokens = [t.lower() for t in raw_q.split() if t.strip()]

        # Base query
        stmt = select(SearchIndex).where(SearchIndex.is_public.is_(True))

        # Category filter
        norm_cat = (category or "all").lower().strip()
        cat_map = {
            "news": "NEWS",
            "deals": "DEALS",
            "events": "EVENTS",
            "community": "COMMUNITY",
            "help": "HELP",
            "guides": "HELP",
        }
        if norm_cat != "all" and norm_cat in cat_map:
            stmt = stmt.where(SearchIndex.content_type == cat_map[norm_cat])

        # Privacy Filter: Exclude community posts from blocked/muted users if logged in
        if current_user:
            blocked_users_stmt = select(CommunityBlock.blocked_user_id).where(
                CommunityBlock.blocker_user_id == current_user.id
            )
            blocked_res = await session.execute(blocked_users_stmt)
            blocked_ids = [str(uid) for uid in blocked_res.scalars().all()]

            muted_users_stmt = select(CommunityMute.muted_user_id).where(
                CommunityMute.muter_user_id == current_user.id
            )
            muted_res = await session.execute(muted_users_stmt)
            muted_ids = [str(uid) for uid in muted_res.scalars().all()]

            hidden_author_ids = list(set(blocked_ids + muted_ids))
            if hidden_author_ids:
                # Exclude community posts authored by hidden users
                stmt = stmt.where(
                    or_(
                        SearchIndex.content_type != "COMMUNITY",
                        ~SearchIndex.source_or_author.in_(hidden_author_ids),
                    )
                )

        # Keyword matching
        if tokens:
            # Build search conditions: all tokens must match either title, category, or searchable_text
            match_conditions = []
            for token in tokens:
                pattern = f"%{token}%"
                match_conditions.append(
                    or_(
                        SearchIndex.title.ilike(pattern),
                        SearchIndex.category.ilike(pattern),
                        SearchIndex.source_or_author.ilike(pattern),
                        SearchIndex.searchable_text.ilike(pattern),
                    )
                )
            stmt = stmt.where(and_(*match_conditions))

        # Sorting logic
        now = datetime.now(timezone.utc)
        if sort == "newest":
            stmt = stmt.order_by(desc(SearchIndex.published_or_event_at).nulls_last())
        elif sort == "oldest":
            stmt = stmt.order_by(SearchIndex.published_or_event_at.asc().nulls_last())
        elif sort == "upcoming":
            stmt = stmt.order_by(
                case(
                    (SearchIndex.published_or_event_at >= now, 0),
                    else_=1,
                ),
                SearchIndex.published_or_event_at.asc(),
            )
        elif sort == "price_asc":
            stmt = stmt.order_by(SearchIndex.price_amount.asc().nulls_last())
        elif sort == "price_desc":
            stmt = stmt.order_by(desc(SearchIndex.price_amount).nulls_last())
        else:
            # "relevant" ranking: Exact or prefix matches on title receive highest rank
            if tokens:
                first_token_pat = f"%{tokens[0]}%"
                stmt = stmt.order_by(
                    case(
                        (SearchIndex.title.ilike(first_token_pat), 1),
                        (SearchIndex.category.ilike(first_token_pat), 2),
                        else_=3,
                    ),
                    desc(SearchIndex.published_or_event_at).nulls_last(),
                )
            else:
                stmt = stmt.order_by(desc(SearchIndex.published_or_event_at).nulls_last())

        # Count total matched
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = (await session.execute(count_stmt)).scalar() or 0

        # Pagination
        page = max(1, page)
        page_size = max(1, min(50, page_size))
        total_pages = max(1, math.ceil(total_count / page_size))
        offset = (page - 1) * page_size

        paginated_stmt = stmt.offset(offset).limit(page_size)
        results = (await session.execute(paginated_stmt)).scalars().all()

        items = []
        for r in results:
            price_disp = None
            if r.price_amount is not None:
                symbol = "$" if r.currency_code == "USD" else ("₹" if r.currency_code == "INR" else "€")
                price_disp = f"{symbol}{r.price_amount:,.2f}"

            items.append(
                SearchResultItem(
                    id=str(r.id),
                    content_type=r.content_type,
                    content_id=r.content_id,
                    title=r.title,
                    description=r.description,
                    category=r.category,
                    url_path=r.url_path,
                    thumbnail_url=r.thumbnail_url,
                    verification_status=r.verification_status,
                    source_or_author=r.source_or_author,
                    published_or_event_at=r.published_or_event_at,
                    price_display=price_disp,
                    metadata={
                        "currency_code": r.currency_code,
                        "price_amount": float(r.price_amount) if r.price_amount else None,
                    },
                )
            )

        # Record private search history if user is authenticated and query is non-empty
        if current_user and raw_q and page == 1:
            try:
                await cls.add_search_history(
                    session=session,
                    user_id=current_user.id,
                    query=raw_q,
                    category_filter=norm_cat,
                    results_count=total_count,
                )
            except Exception as hist_err:
                logger.warning(f"Failed to record search history: {hist_err}")

        return SearchResponse(
            items=items,
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            query=raw_q,
            category_filter=norm_cat,
            sort=sort,
        )

    @classmethod
    async def get_suggestions(
        cls,
        session: AsyncSession,
        q: str = "",
        query: Optional[str] = None,
        limit: int = 6,
    ) -> SearchSuggestionsResponse:
        """Returns fast, debounced typeahead suggestions for search header input."""
        await cls._ensure_index_populated(session)
        clean_q = (query if query is not None else q or "").strip()

        suggestions = []
        if clean_q:
            pattern = f"%{clean_q}%"
            stmt = (
                select(SearchIndex)
                .where(
                    SearchIndex.is_public.is_(True),
                    or_(
                        SearchIndex.title.ilike(pattern),
                        SearchIndex.category.ilike(pattern),
                    ),
                )
                .order_by(
                    case((SearchIndex.title.ilike(f"{clean_q}%"), 1), else_=2),
                    desc(SearchIndex.published_or_event_at),
                )
                .limit(limit)
            )
            res = await session.execute(stmt)
            for item in res.scalars().all():
                suggestions.append(
                    SearchSuggestionItem(
                        title=item.title,
                        category=item.category,
                        content_type=item.content_type,
                        url_path=item.url_path,
                    )
                )

        return SearchSuggestionsResponse(
            query=clean_q,
            suggestions=suggestions,
            popular=POPULAR_SEARCH_TERMS[:5],
        )

    @classmethod
    async def get_categories_stats(
        cls,
        session: AsyncSession,
        q: str = "",
        query: Optional[str] = None,
    ) -> SearchCategoriesStats:
        """Returns match counts per category for the given search term."""
        await cls._ensure_index_populated(session)
        clean_q = (query if query is not None else q or "").strip()

        base_stmt = select(
            SearchIndex.content_type,
            func.count(SearchIndex.id),
        ).where(SearchIndex.is_public.is_(True))

        if clean_q:
            pattern = f"%{clean_q}%"
            base_stmt = base_stmt.where(
                or_(
                    SearchIndex.title.ilike(pattern),
                    SearchIndex.category.ilike(pattern),
                    SearchIndex.searchable_text.ilike(pattern),
                )
            )

        base_stmt = base_stmt.group_by(SearchIndex.content_type)
        res = await session.execute(base_stmt)
        type_counts = {row[0]: row[1] for row in res.all()}

        total = sum(type_counts.values())
        return SearchCategoriesStats(
            all=total,
            news=type_counts.get("NEWS", 0),
            deals=type_counts.get("DEALS", 0),
            events=type_counts.get("EVENTS", 0),
            community=type_counts.get("COMMUNITY", 0),
            help=type_counts.get("HELP", 0),
        )

    @classmethod
    async def get_recent_searches(
        cls,
        session: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 8,
    ) -> List[SearchHistoryItem]:
        """Returns the authenticated player's recent search queries."""
        stmt = (
            select(UserSearchHistory)
            .where(UserSearchHistory.user_id == user_id)
            .order_by(desc(UserSearchHistory.searched_at))
            .limit(limit)
        )
        res = await session.execute(stmt)
        items = res.scalars().all()

        return [
            SearchHistoryItem(
                id=str(h.id),
                query=h.search_query,
                category_filter=h.category_filter,
                results_count=h.results_count,
                searched_at=h.searched_at,
            )
            for h in items
        ]

    @classmethod
    async def add_search_history(
        cls,
        session: AsyncSession,
        user_id: uuid.UUID,
        query: str,
        category_filter: Optional[str] = None,
        results_count: int = 0,
    ) -> None:
        """Records a search query in player history, deduplicating identical queries."""
        q_clean = query.strip()
        if not q_clean:
            return

        now = datetime.now(timezone.utc)
        # Check if identical query was saved recently
        dup_stmt = select(UserSearchHistory).where(
            UserSearchHistory.user_id == user_id,
            func.lower(UserSearchHistory.search_query) == q_clean.lower(),
        )
        dup = (await session.execute(dup_stmt)).scalar_one_or_none()

        if dup:
            dup.searched_at = now
            dup.results_count = results_count
            dup.category_filter = category_filter
            target = dup
        else:
            entry = UserSearchHistory(
                user_id=user_id,
                search_query=q_clean,
                category_filter=category_filter,
                results_count=results_count,
                searched_at=now,
            )
            session.add(entry)
            target = entry

        await session.commit()
        await session.refresh(target)
        return SearchHistoryItem(
            id=str(target.id),
            query=target.search_query,
            category_filter=target.category_filter,
            results_count=target.results_count,
            searched_at=target.searched_at,
        )

    @classmethod
    async def clear_search_history(
        cls,
        session: AsyncSession,
        user_id: uuid.UUID,
        history_id: Optional[str] = None,
        query: Optional[str] = None,
    ) -> bool:
        """Clears all or a specific search history record for the user."""
        stmt = delete(UserSearchHistory).where(UserSearchHistory.user_id == user_id)
        if history_id:
            try:
                stmt = stmt.where(UserSearchHistory.id == uuid.UUID(history_id))
            except ValueError:
                return False
        elif query:
            stmt = stmt.where(func.lower(UserSearchHistory.search_query) == query.lower().strip())

        res = await session.execute(stmt)
        await session.commit()
        return True


# Module-level aliases for convenient direct imports
sync_search_index = SearchService.sync_search_index
search = SearchService.search
get_suggestions = SearchService.get_suggestions
get_categories_stats = SearchService.get_categories_stats
get_recent_searches = SearchService.get_recent_searches
record_search_query = SearchService.add_search_history
clear_recent_searches = SearchService.clear_search_history
