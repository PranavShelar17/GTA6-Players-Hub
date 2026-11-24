import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.logging import logger
from app.core.security import CurrentUser, get_current_user, get_optional_current_user
from app.schemas.envelope import ApiResponse
from app.schemas.search import (
    SearchCategoriesStats,
    SearchHistoryCreate,
    SearchHistoryItem,
    SearchResponse,
    SearchSuggestionsResponse,
)
from app.services import search_service

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("", response_model=ApiResponse[SearchResponse])
async def search_endpoint(
    q: str = Query("", description="Search term or phrase"),
    category: str = Query("ALL", description="Filter by category: ALL, NEWS, DEALS, EVENTS, COMMUNITY, HELP"),
    sort: str = Query("relevant", description="Sort order: relevant, newest, oldest, upcoming, price_asc, price_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
):
    """Executes a global search across all platform modules with category filtering and sorting."""
    result = await search_service.search(
        session=db,
        query=q,
        category=category,
        sort=sort,
        page=page,
        page_size=page_size,
    )

    # If player is authenticated and query is non-empty, asynchronously save search history
    if current_user and q.strip():
        try:
            await search_service.record_search_query(
                session=db,
                user_id=current_user.id,
                query=q.strip(),
                category_filter=category,
                results_count=result.total,
            )
        except Exception as exc:
            logger.warning(f"Failed to record search query: {exc}")

    return ApiResponse(success=True, data=result)


@router.get("/suggestions", response_model=ApiResponse[SearchSuggestionsResponse])
async def search_suggestions_endpoint(
    q: str = Query("", description="Prefix search term"),
    limit: int = Query(6, ge=1, le=20, description="Max suggestions to return"),
    db: AsyncSession = Depends(get_db),
):
    """Provides autocomplete search suggestions and popular searches."""
    result = await search_service.get_suggestions(session=db, query=q, limit=limit)
    return ApiResponse(success=True, data=result)


@router.get("/recent", response_model=ApiResponse[List[SearchHistoryItem]])
async def get_recent_searches_endpoint(
    limit: int = Query(10, ge=1, le=50, description="Max recent searches"),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves the authenticated player's recent search queries."""
    recent = await search_service.get_recent_searches(
        session=db,
        user_id=current_user.id,
        limit=limit,
    )
    return ApiResponse(success=True, data=recent)


@router.post("/recent", response_model=ApiResponse[Dict[str, Any]])
async def record_recent_search_endpoint(
    payload: SearchHistoryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Explicitly records a search query in player's history."""
    item = await search_service.record_search_query(
        session=db,
        user_id=current_user.id,
        query=payload.query,
        category_filter=payload.category_filter,
        results_count=payload.results_count or 0,
    )
    return ApiResponse(
        success=True,
        data={"recorded": True, "id": item.id, "query": item.query},
    )


@router.delete("/recent", response_model=ApiResponse[Dict[str, Any]])
async def clear_recent_searches_endpoint(
    history_id: Optional[str] = Query(None, description="Optional ID of specific search entry to delete"),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clears player's recent search history (or a specific entry if history_id is provided)."""
    success = await search_service.clear_recent_searches(
        session=db,
        user_id=current_user.id,
        history_id=history_id,
    )
    return ApiResponse(
        success=True,
        data={"cleared": success},
    )


@router.get("/categories", response_model=ApiResponse[SearchCategoriesStats])
async def search_categories_stats_endpoint(
    db: AsyncSession = Depends(get_db),
):
    """Returns counts of indexed items per category for filter tabs."""
    stats = await search_service.get_categories_stats(session=db)
    return ApiResponse(success=True, data=stats)


@router.post("/reindex", response_model=ApiResponse[Dict[str, Any]])
async def reindex_search_endpoint(
    x_automation_key: Optional[str] = Header(None, alias="X-Automation-Key"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
):
    """Rebuilds the global search index across News, Deals, Events, Community, and Guides.
    Authorized via X-Automation-Key header or authenticated session.
    """
    is_authorized = False
    if x_automation_key and x_automation_key == settings.AUTOMATION_API_KEY:
        is_authorized = True
    elif current_user:
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid automation key / authentication credentials.",
        )

    count = await search_service.sync_search_index(session=db)
    return ApiResponse(
        success=True,
        data={"reindexed": True, "indexed_items_count": count},
    )
