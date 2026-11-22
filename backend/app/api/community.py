import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user, get_optional_current_user
from app.schemas.envelope import ApiResponse, ResponseMeta
from app.schemas.community import (
    CommunityBlockRead,
    CommunityCategoryRead,
    CommunityCommentCreate,
    CommunityCommentRead,
    CommunityCommentUpdate,
    CommunityFollowRead,
    CommunityMuteRead,
    CommunityPlayerProfileRead,
    CommunityPollRead,
    CommunityPollVoteCreate,
    CommunityPostCreate,
    CommunityPostDetail,
    CommunityPostListItem,
    CommunityPostMediaRead,
    CommunityPostUpdate,
    CommunityReportCreate,
    CommunityReportRead,
)
from app.services import community_service, media_service
from app.services.community_collector import (
    seed_community_categories,
    seed_initial_verified_posts,
)

router = APIRouter(prefix="/community", tags=["Gaming Community"])


# -----------------------------------------------------------------------------
# Categories
# -----------------------------------------------------------------------------
@router.get("/categories", response_model=ApiResponse[List[CommunityCategoryRead]])
async def get_community_categories(db: AsyncSession = Depends(get_db)):
    """Retrieves all active community categories, seeding if empty."""
    cats = await community_service.list_categories(db)
    if not cats:
        await seed_community_categories(db)
        cats = await community_service.list_categories(db)
    return ApiResponse(success=True, data=cats)


# -----------------------------------------------------------------------------
# Posts Feed & Detail
# -----------------------------------------------------------------------------
@router.get("/posts", response_model=ApiResponse[List[CommunityPostListItem]])
async def list_posts(
    feed_type: str = Query("latest", pattern="^(latest|popular|following)$"),
    category: Optional[str] = Query(None, description="Category slug"),
    search: Optional[str] = Query(None, description="Search keyword"),
    player_id: Optional[str] = Query(None, description="Filter by player UUID"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves community feed with filtering, search, sorting (latest, popular, following).
    """
    parsed_player_id = uuid.UUID(player_id) if player_id else None
    user_id = current_user.id if current_user else None

    # Ensure starter posts exist if first visit
    cats = await community_service.list_categories(db)
    if not cats:
        await seed_community_categories(db)
        await seed_initial_verified_posts(db)

    posts, total = await community_service.list_posts(
        session=db,
        feed_type=feed_type,
        category_slug=category,
        search=search,
        player_id=parsed_player_id,
        current_user_id=user_id,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(
        success=True,
        data=posts,
        meta=ResponseMeta(total=total, limit=limit, offset=offset),
    )


@router.post("/posts", response_model=ApiResponse[CommunityPostDetail], status_code=status.HTTP_201_CREATED)
async def create_post(
    data: CommunityPostCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new community post (authenticated players only)."""
    post = await community_service.create_post(
        session=db,
        user_id=current_user.id,
        data=data,
    )
    return ApiResponse(success=True, data=post)


@router.get("/posts/{post_id}", response_model=ApiResponse[CommunityPostDetail])
async def get_post_detail(
    post_id: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves full post details, increments view count, and provides poll & author status."""
    p_uuid = uuid.UUID(post_id)
    user_id = current_user.id if current_user else None
    post = await community_service.get_post_detail(
        session=db,
        post_id=p_uuid,
        current_user_id=user_id,
        increment_views=True,
    )
    return ApiResponse(success=True, data=post)


@router.patch("/posts/{post_id}", response_model=ApiResponse[CommunityPostDetail])
async def update_post(
    post_id: str,
    data: CommunityPostUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates post content or title (author only)."""
    p_uuid = uuid.UUID(post_id)
    post = await community_service.update_post(
        session=db,
        post_id=p_uuid,
        user_id=current_user.id,
        data=data,
    )
    return ApiResponse(success=True, data=post)


@router.delete("/posts/{post_id}", response_model=ApiResponse[dict])
async def delete_post(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft deletes a post (author only)."""
    p_uuid = uuid.UUID(post_id)
    success = await community_service.delete_post(
        session=db,
        post_id=p_uuid,
        user_id=current_user.id,
    )
    return ApiResponse(success=True, data={"deleted": success})


# -----------------------------------------------------------------------------
# Media Upload
# -----------------------------------------------------------------------------
@router.post("/media/upload", response_model=ApiResponse[dict])
async def upload_community_media(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Uploads an image (JPEG, PNG, WebP <=10MB) for community posts.
    """
    media_url, file_size, media_type = await media_service.save_community_media(file)
    return ApiResponse(
        success=True,
        data={
            "media_url": media_url,
            "file_size": file_size,
            "media_type": media_type,
        },
    )


# -----------------------------------------------------------------------------
# Likes
# -----------------------------------------------------------------------------
@router.post("/posts/{post_id}/like", response_model=ApiResponse[dict])
async def like_post(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggles like on post for current player."""
    p_uuid = uuid.UUID(post_id)
    is_liked, likes_count = await community_service.toggle_post_like(
        session=db,
        post_id=p_uuid,
        user_id=current_user.id,
    )
    return ApiResponse(
        success=True,
        data={"is_liked": is_liked, "likes_count": likes_count},
    )


@router.delete("/posts/{post_id}/like", response_model=ApiResponse[dict])
async def unlike_post(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unlikes post for current player."""
    p_uuid = uuid.UUID(post_id)
    is_liked, likes_count = await community_service.toggle_post_like(
        session=db,
        post_id=p_uuid,
        user_id=current_user.id,
    )
    return ApiResponse(
        success=True,
        data={"is_liked": is_liked, "likes_count": likes_count},
    )


# -----------------------------------------------------------------------------
# Bookmarks
# -----------------------------------------------------------------------------
@router.get("/bookmarks", response_model=ApiResponse[List[CommunityPostListItem]])
async def list_bookmarks(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all bookmarked posts for the current player."""
    posts, total = await community_service.list_user_bookmarks(
        session=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(
        success=True,
        data=posts,
        meta=ResponseMeta(total=total, limit=limit, offset=offset),
    )


@router.post("/posts/{post_id}/bookmark", response_model=ApiResponse[dict])
async def bookmark_post(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggles bookmark on post for current player."""
    p_uuid = uuid.UUID(post_id)
    is_bookmarked = await community_service.toggle_post_bookmark(
        session=db,
        post_id=p_uuid,
        user_id=current_user.id,
    )
    return ApiResponse(
        success=True,
        data={"is_bookmarked": is_bookmarked},
    )


@router.delete("/posts/{post_id}/bookmark", response_model=ApiResponse[dict])
async def unbookmark_post(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Removes bookmark on post for current player."""
    p_uuid = uuid.UUID(post_id)
    is_bookmarked = await community_service.toggle_post_bookmark(
        session=db,
        post_id=p_uuid,
        user_id=current_user.id,
    )
    return ApiResponse(
        success=True,
        data={"is_bookmarked": is_bookmarked},
    )


# -----------------------------------------------------------------------------
# Comments & Replies
# -----------------------------------------------------------------------------
@router.get("/posts/{post_id}/comments", response_model=ApiResponse[List[CommunityCommentRead]])
async def list_comments(
    post_id: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves comments for a post, with 1-level reply threading."""
    p_uuid = uuid.UUID(post_id)
    user_id = current_user.id if current_user else None
    comments = await community_service.list_comments_for_post(
        session=db,
        post_id=p_uuid,
        current_user_id=user_id,
    )
    return ApiResponse(success=True, data=comments)


@router.post("/posts/{post_id}/comments", response_model=ApiResponse[CommunityCommentRead], status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: str,
    data: CommunityCommentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Adds a top-level comment or reply to an existing post."""
    p_uuid = uuid.UUID(post_id)
    comment = await community_service.add_comment(
        session=db,
        post_id=p_uuid,
        user_id=current_user.id,
        data=data,
    )
    return ApiResponse(success=True, data=comment)


@router.patch("/comments/{comment_id}", response_model=ApiResponse[CommunityCommentRead])
async def update_comment(
    comment_id: str,
    data: CommunityCommentUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates comment content (author only)."""
    c_uuid = uuid.UUID(comment_id)
    comment = await community_service.update_comment(
        session=db,
        comment_id=c_uuid,
        user_id=current_user.id,
        data=data,
    )
    return ApiResponse(success=True, data=comment)


@router.delete("/comments/{comment_id}", response_model=ApiResponse[dict])
async def delete_comment(
    comment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft deletes comment (author only)."""
    c_uuid = uuid.UUID(comment_id)
    success = await community_service.delete_comment(
        session=db,
        comment_id=c_uuid,
        user_id=current_user.id,
    )
    return ApiResponse(success=True, data={"deleted": success})


# -----------------------------------------------------------------------------
# Polls
# -----------------------------------------------------------------------------
@router.post("/polls/{poll_id}/vote", response_model=ApiResponse[CommunityPollRead])
async def vote_poll(
    poll_id: str,
    data: CommunityPollVoteCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Casts vote in community poll."""
    p_uuid = uuid.UUID(poll_id)
    poll = await community_service.vote_in_poll(
        session=db,
        poll_id=p_uuid,
        user_id=current_user.id,
        data=data,
    )
    return ApiResponse(success=True, data=poll)


@router.get("/polls/{poll_id}/results", response_model=ApiResponse[CommunityPollRead])
async def get_poll_results(
    poll_id: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves current voting tally for poll."""
    p_uuid = uuid.UUID(poll_id)
    user_id = current_user.id if current_user else None
    from app.models.community import CommunityPoll
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    stmt = (
        select(CommunityPoll)
        .options(
            selectinload(CommunityPoll.options),
            selectinload(CommunityPoll.votes),
        )
        .where(CommunityPoll.id == p_uuid)
    )
    res = await db.execute(stmt)
    poll = res.scalar_one_or_none()
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found.",
        )
    poll_read = await community_service.format_poll_read(poll, user_id)
    return ApiResponse(success=True, data=poll_read)


# -----------------------------------------------------------------------------
# Player Profiles & Follows
# -----------------------------------------------------------------------------
@router.get("/player/{username}", response_model=ApiResponse[CommunityPlayerProfileRead])
async def get_player_profile(
    username: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves player community profile by username."""
    user_id = current_user.id if current_user else None
    profile = await community_service.get_player_community_profile(
        session=db,
        username=username,
        current_user_id=user_id,
    )
    return ApiResponse(success=True, data=profile)


@router.post("/player/{player_id}/follow", response_model=ApiResponse[dict])
async def follow_player(
    player_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Follows or unfollows player."""
    target_id = uuid.UUID(player_id)
    is_following, followers_count = await community_service.toggle_player_follow(
        session=db,
        follower_id=current_user.id,
        following_id=target_id,
    )
    return ApiResponse(
        success=True,
        data={"is_following": is_following, "followers_count": followers_count},
    )


@router.delete("/player/{player_id}/follow", response_model=ApiResponse[dict])
async def unfollow_player(
    player_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unfollows player."""
    target_id = uuid.UUID(player_id)
    is_following, followers_count = await community_service.toggle_player_follow(
        session=db,
        follower_id=current_user.id,
        following_id=target_id,
    )
    return ApiResponse(
        success=True,
        data={"is_following": is_following, "followers_count": followers_count},
    )


# -----------------------------------------------------------------------------
# Safety & Moderation (Reports, Blocks, Mutes)
# -----------------------------------------------------------------------------
@router.post("/reports", response_model=ApiResponse[CommunityReportRead], status_code=status.HTTP_201_CREATED)
async def report_content(
    data: CommunityReportCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Files a moderation report against a post, comment, or player."""
    report = await community_service.create_report(
        session=db,
        user_id=current_user.id,
        data=data,
    )
    return ApiResponse(success=True, data=report)


@router.post("/player/{player_id}/block", response_model=ApiResponse[dict])
async def block_player(
    player_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Blocks a player and removes any follow relationships."""
    target_id = uuid.UUID(player_id)
    is_blocked = await community_service.toggle_block_player(
        session=db,
        blocker_id=current_user.id,
        blocked_id=target_id,
    )
    return ApiResponse(success=True, data={"is_blocked": is_blocked})


@router.delete("/player/{player_id}/block", response_model=ApiResponse[dict])
async def unblock_player(
    player_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unblocks a player."""
    target_id = uuid.UUID(player_id)
    is_blocked = await community_service.toggle_block_player(
        session=db,
        blocker_id=current_user.id,
        blocked_id=target_id,
    )
    return ApiResponse(success=True, data={"is_blocked": is_blocked})


@router.post("/player/{player_id}/mute", response_model=ApiResponse[dict])
async def mute_player(
    player_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mutes a player, silencing their posts and comments from current user view."""
    target_id = uuid.UUID(player_id)
    is_muted = await community_service.toggle_mute_player(
        session=db,
        muter_id=current_user.id,
        muted_id=target_id,
    )
    return ApiResponse(success=True, data={"is_muted": is_muted})


@router.delete("/player/{player_id}/mute", response_model=ApiResponse[dict])
async def unmute_player(
    player_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unmutes a player."""
    target_id = uuid.UUID(player_id)
    is_muted = await community_service.toggle_mute_player(
        session=db,
        muter_id=current_user.id,
        muted_id=target_id,
    )
    return ApiResponse(success=True, data={"is_muted": is_muted})
