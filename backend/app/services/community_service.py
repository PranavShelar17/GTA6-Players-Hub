import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from sqlalchemy import and_, delete, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.community import (
    CommunityBlock,
    CommunityBookmark,
    CommunityCategory,
    CommunityComment,
    CommunityFollow,
    CommunityLike,
    CommunityMute,
    CommunityPoll,
    CommunityPollOption,
    CommunityPollVote,
    CommunityPost,
    CommunityPostMedia,
    CommunityReport,
)
from app.models.user import PlayerProfile
from app.schemas.community import (
    CommunityAuthorRead,
    CommunityBlockRead,
    CommunityCategoryRead,
    CommunityCommentCreate,
    CommunityCommentRead,
    CommunityCommentReplyRead,
    CommunityCommentUpdate,
    CommunityFollowRead,
    CommunityMuteRead,
    CommunityPlayerProfileRead,
    CommunityPollCreate,
    CommunityPollOptionRead,
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
from app.services.notification_service import create_player_notification


# -----------------------------------------------------------------------------
# Helper: Fetch Player Profile Dictionary
# -----------------------------------------------------------------------------
async def get_authors_dict(
    session: AsyncSession, player_ids: List[uuid.UUID]
) -> Dict[uuid.UUID, CommunityAuthorRead]:
    """Fetches author profile info for given user IDs."""
    if not player_ids:
        return {}

    stmt = select(PlayerProfile).where(PlayerProfile.user_id.in_(player_ids))
    res = await session.execute(stmt)
    profiles = res.scalars().all()

    result = {}
    for p in profiles:
        result[p.user_id] = CommunityAuthorRead(
            id=str(p.user_id),
            username=p.username,
            display_name=p.display_name or p.username,
            avatar_url=p.avatar_url,
            preferred_platform=p.preferred_platform,
            is_verified=p.is_verified,
            reputation_score=p.reputation_score,
        )

    # For any missing player_id, provide clean fallback
    for pid in player_ids:
        if pid not in result:
            result[pid] = CommunityAuthorRead(
                id=str(pid),
                username=f"player_{str(pid)[:8]}",
                display_name=f"Player {str(pid)[:8]}",
                avatar_url=None,
                preferred_platform=None,
                is_verified=False,
                reputation_score=0,
            )

    return result


# -----------------------------------------------------------------------------
# Helper: Fetch Blocks & Mutes for Current User
# -----------------------------------------------------------------------------
async def get_hidden_player_ids(
    session: AsyncSession, current_user_id: Optional[uuid.UUID]
) -> Tuple[set, set]:
    """
    Returns (blocked_ids, muted_ids).
    Blocked IDs include users the player blocked, AND users who blocked the player.
    """
    if not current_user_id:
        return set(), set()

    # Blocks created by or targeting current user
    stmt_blocks = select(CommunityBlock).where(
        or_(
            CommunityBlock.blocker_id == current_user_id,
            CommunityBlock.blocked_id == current_user_id,
        )
    )
    b_res = await session.execute(stmt_blocks)
    blocked_ids = set()
    for b in b_res.scalars().all():
        if b.blocker_id == current_user_id:
            blocked_ids.add(b.blocked_id)
        else:
            blocked_ids.add(b.blocker_id)

    # Mutes created by current user
    stmt_mutes = select(CommunityMute).where(CommunityMute.muter_id == current_user_id)
    m_res = await session.execute(stmt_mutes)
    muted_ids = {m.muted_id for m in m_res.scalars().all()}

    return blocked_ids, muted_ids


# -----------------------------------------------------------------------------
# Categories
# -----------------------------------------------------------------------------
async def list_categories(session: AsyncSession) -> List[CommunityCategoryRead]:
    """Returns all active community categories ordered by display_order."""
    stmt = (
        select(CommunityCategory)
        .where(CommunityCategory.is_active == True)  # noqa: E712
        .order_by(CommunityCategory.display_order.asc())
    )
    res = await session.execute(stmt)
    cats = res.scalars().all()
    return [
        CommunityCategoryRead(
            id=str(c.id),
            name=c.name,
            slug=c.slug,
            description=c.description,
            icon=c.icon,
            display_order=c.display_order,
            is_active=c.is_active,
        )
        for c in cats
    ]


# -----------------------------------------------------------------------------
# Poll Helper
# -----------------------------------------------------------------------------
async def format_poll_read(
    poll: Optional[CommunityPoll], current_user_id: Optional[uuid.UUID]
) -> Optional[CommunityPollRead]:
    if not poll:
        return None

    now = datetime.now(timezone.utc)
    is_expired = False
    if poll.expires_at:
        poll_exp = poll.expires_at
        if poll_exp.tzinfo is None:
            poll_exp = poll_exp.replace(tzinfo=timezone.utc)
        is_expired = now > poll_exp

    user_voted_option_id = None
    if current_user_id and poll.votes:
        for v in poll.votes:
            if v.player_id == current_user_id:
                user_voted_option_id = str(v.option_id)
                break

    options_read = []
    total = poll.total_votes or 0
    for opt in sorted(poll.options, key=lambda x: x.display_order):
        pct = (opt.vote_count / total * 100.0) if total > 0 else 0.0
        options_read.append(
            CommunityPollOptionRead(
                id=str(opt.id),
                option_text=opt.option_text,
                display_order=opt.display_order,
                vote_count=opt.vote_count,
                percentage=round(pct, 1),
            )
        )

    return CommunityPollRead(
        id=str(poll.id),
        question=poll.question,
        expires_at=poll.expires_at,
        allow_vote_change=poll.allow_vote_change,
        total_votes=total,
        is_expired=is_expired,
        user_voted_option_id=user_voted_option_id,
        options=options_read,
    )


# -----------------------------------------------------------------------------
# Posts Listing & Feed
# -----------------------------------------------------------------------------
async def list_posts(
    session: AsyncSession,
    feed_type: str = "latest",  # latest, popular, following
    category_slug: Optional[str] = None,
    search: Optional[str] = None,
    player_id: Optional[uuid.UUID] = None,
    current_user_id: Optional[uuid.UUID] = None,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[CommunityPostListItem], int]:
    """
    Retrieves community posts feed with filtering, search, sorting, and user interaction states.
    """
    blocked_ids, muted_ids = await get_hidden_player_ids(session, current_user_id)
    hidden_ids = blocked_ids.union(muted_ids)

    base_query = (
        select(CommunityPost)
        .options(
            selectinload(CommunityPost.category),
            selectinload(CommunityPost.media),
            selectinload(CommunityPost.poll).selectinload(CommunityPoll.options),
            selectinload(CommunityPost.poll).selectinload(CommunityPoll.votes),
        )
        .where(
            and_(
                CommunityPost.post_status == "PUBLISHED",
                CommunityPost.deleted_at.is_(None),
            )
        )
    )

    # Exclude hidden/blocked players
    if hidden_ids:
        base_query = base_query.where(CommunityPost.player_id.not_in(hidden_ids))

    # Category filter
    if category_slug:
        cat_stmt = select(CommunityCategory.id).where(CommunityCategory.slug == category_slug)
        cat_res = await session.execute(cat_stmt)
        cat_id = cat_res.scalar_one_or_none()
        if cat_id:
            base_query = base_query.where(CommunityPost.category_id == cat_id)
        else:
            return [], 0

    # Specific player filter (e.g. Profile public posts)
    if player_id:
        base_query = base_query.where(CommunityPost.player_id == player_id)

    # Search query
    if search:
        search_term = f"%{search.strip()}%"
        base_query = base_query.where(
            or_(
                CommunityPost.title.ilike(search_term),
                CommunityPost.content.ilike(search_term),
            )
        )

    # Feed type: Following
    if feed_type == "following":
        if not current_user_id:
            return [], 0
        follow_stmt = select(CommunityFollow.following_id).where(CommunityFollow.follower_id == current_user_id)
        f_res = await session.execute(follow_stmt)
        following_player_ids = f_res.scalars().all()
        if not following_player_ids:
            return [], 0
        base_query = base_query.where(CommunityPost.player_id.in_(following_player_ids))

    # Total count query
    count_query = select(func.count()).select_from(base_query.subquery())
    count_res = await session.execute(count_query)
    total_count = count_res.scalar_one() or 0

    # Sorting
    if feed_type == "popular":
        # Popular sorts by likes_count + comments_count, then created_at
        base_query = base_query.order_by(
            CommunityPost.is_pinned.desc(),
            (CommunityPost.likes_count * 2 + CommunityPost.comments_count).desc(),
            CommunityPost.created_at.desc(),
        )
    else:
        # Latest and Following
        base_query = base_query.order_by(
            CommunityPost.is_pinned.desc(),
            CommunityPost.created_at.desc(),
        )

    # Pagination
    base_query = base_query.limit(limit).offset(offset)
    res = await session.execute(base_query)
    posts = res.scalars().all()

    if not posts:
        return [], total_count

    # Fetch authors
    post_author_ids = list({p.player_id for p in posts})
    authors = await get_authors_dict(session, post_author_ids)

    # Fetch likes and bookmarks for current_user
    user_likes = set()
    user_bookmarks = set()
    if current_user_id:
        post_ids = [p.id for p in posts]
        like_stmt = select(CommunityLike.post_id).where(
            and_(
                CommunityLike.player_id == current_user_id,
                CommunityLike.post_id.in_(post_ids),
            )
        )
        l_res = await session.execute(like_stmt)
        user_likes = set(l_res.scalars().all())

        bm_stmt = select(CommunityBookmark.post_id).where(
            and_(
                CommunityBookmark.player_id == current_user_id,
                CommunityBookmark.post_id.in_(post_ids),
            )
        )
        b_res = await session.execute(bm_stmt)
        user_bookmarks = set(b_res.scalars().all())

    items = []
    for p in posts:
        author = authors.get(
            p.player_id,
            CommunityAuthorRead(
                id=str(p.player_id),
                username="player",
                display_name="Player",
            ),
        )
        media_reads = [
            CommunityPostMediaRead(
                id=str(m.id),
                media_url=m.media_url,
                media_type=m.media_type,
                file_size=m.file_size,
                display_order=m.display_order,
            )
            for m in p.media
        ]
        poll_read = await format_poll_read(p.poll, current_user_id)

        items.append(
            CommunityPostListItem(
                id=str(p.id),
                title=p.title,
                content=p.content,
                post_status=p.post_status,
                is_pinned=p.is_pinned,
                likes_count=p.likes_count,
                comments_count=p.comments_count,
                views_count=p.views_count,
                created_at=p.created_at,
                updated_at=p.updated_at,
                category=CommunityCategoryRead(
                    id=str(p.category.id),
                    name=p.category.name,
                    slug=p.category.slug,
                    description=p.category.description,
                    icon=p.category.icon,
                    display_order=p.category.display_order,
                    is_active=p.category.is_active,
                ),
                author=author,
                media=media_reads,
                poll=poll_read,
                is_liked=(p.id in user_likes),
                is_bookmarked=(p.id in user_bookmarks),
                is_author=(current_user_id == p.player_id if current_user_id else False),
            )
        )

    return items, total_count


# -----------------------------------------------------------------------------
# Post Create, Get, Update, Soft-Delete
# -----------------------------------------------------------------------------
async def create_post(
    session: AsyncSession,
    user_id: uuid.UUID,
    data: CommunityPostCreate,
) -> CommunityPostDetail:
    """Creates a new community post with optional media and poll."""
    # Validate category exists
    cat_id = uuid.UUID(data.category_id)
    cat_stmt = select(CommunityCategory).where(CommunityCategory.id == cat_id)
    cat_res = await session.execute(cat_stmt)
    cat = cat_res.scalar_one_or_none()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{data.category_id}' does not exist.",
        )

    post = CommunityPost(
        id=uuid.uuid4(),
        player_id=user_id,
        category_id=cat.id,
        title=data.title.strip(),
        content=data.content.strip(),
        post_status="PUBLISHED",
    )
    session.add(post)
    await session.flush()

    # Add media attachments (up to 4)
    media_records = []
    if data.media_urls:
        for idx, m_url in enumerate(data.media_urls[:4]):
            m = CommunityPostMedia(
                id=uuid.uuid4(),
                post_id=post.id,
                media_url=m_url,
                media_type="IMAGE",
                display_order=idx,
            )
            session.add(m)
            media_records.append(m)

    # Add poll if requested
    poll_record = None
    if data.poll:
        poll_record = CommunityPoll(
            id=uuid.uuid4(),
            post_id=post.id,
            question=data.poll.question.strip(),
            expires_at=data.poll.expires_at,
            allow_vote_change=data.poll.allow_vote_change,
            total_votes=0,
        )
        session.add(poll_record)
        await session.flush()

        for idx, opt_text in enumerate(data.poll.options):
            opt = CommunityPollOption(
                id=uuid.uuid4(),
                poll_id=poll_record.id,
                option_text=opt_text.strip(),
                display_order=idx + 1,
                vote_count=0,
            )
            session.add(opt)

    await session.commit()
    await session.refresh(post)

    # Return full post detail
    return await get_post_detail(session, post.id, user_id, increment_views=False)


async def get_post_detail(
    session: AsyncSession,
    post_id: uuid.UUID,
    current_user_id: Optional[uuid.UUID] = None,
    increment_views: bool = True,
) -> CommunityPostDetail:
    """Retrieves full post details with author, media, and poll."""
    stmt = (
        select(CommunityPost)
        .options(
            selectinload(CommunityPost.category),
            selectinload(CommunityPost.media),
            selectinload(CommunityPost.poll).selectinload(CommunityPoll.options),
            selectinload(CommunityPost.poll).selectinload(CommunityPoll.votes),
        )
        .where(
            and_(
                CommunityPost.id == post_id,
                CommunityPost.post_status == "PUBLISHED",
                CommunityPost.deleted_at.is_(None),
            )
        )
    )
    res = await session.execute(stmt)
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community post not found or has been deleted.",
        )

    # Check blocks
    if current_user_id:
        blocked_ids, _ = await get_hidden_player_ids(session, current_user_id)
        if post.player_id in blocked_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post is unavailable.",
            )

    # Increment view count
    if increment_views:
        post.views_count += 1
        await session.commit()

    # Author
    authors = await get_authors_dict(session, [post.player_id])
    author = authors.get(
        post.player_id,
        CommunityAuthorRead(
            id=str(post.player_id),
            username="player",
            display_name="Player",
        ),
    )

    # Likes & bookmarks
    is_liked = False
    is_bookmarked = False
    if current_user_id:
        like_stmt = select(CommunityLike).where(
            and_(
                CommunityLike.player_id == current_user_id,
                CommunityLike.post_id == post.id,
            )
        )
        l_res = await session.execute(like_stmt)
        is_liked = l_res.scalar_one_or_none() is not None

        bm_stmt = select(CommunityBookmark).where(
            and_(
                CommunityBookmark.player_id == current_user_id,
                CommunityBookmark.post_id == post.id,
            )
        )
        b_res = await session.execute(bm_stmt)
        is_bookmarked = b_res.scalar_one_or_none() is not None

    media_reads = [
        CommunityPostMediaRead(
            id=str(m.id),
            media_url=m.media_url,
            media_type=m.media_type,
            file_size=m.file_size,
            display_order=m.display_order,
        )
        for m in post.media
    ]
    poll_read = await format_poll_read(post.poll, current_user_id)

    return CommunityPostDetail(
        id=str(post.id),
        title=post.title,
        content=post.content,
        post_status=post.post_status,
        is_pinned=post.is_pinned,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        views_count=post.views_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        category=CommunityCategoryRead(
            id=str(post.category.id),
            name=post.category.name,
            slug=post.category.slug,
            description=post.category.description,
            icon=post.category.icon,
            display_order=post.category.display_order,
            is_active=post.category.is_active,
        ),
        author=author,
        media=media_reads,
        poll=poll_read,
        is_liked=is_liked,
        is_bookmarked=is_bookmarked,
        is_author=(current_user_id == post.player_id if current_user_id else False),
    )


async def update_post(
    session: AsyncSession,
    post_id: uuid.UUID,
    user_id: uuid.UUID,
    data: CommunityPostUpdate,
) -> CommunityPostDetail:
    """Updates post content or title (author only)."""
    stmt = select(CommunityPost).where(
        and_(
            CommunityPost.id == post_id,
            CommunityPost.deleted_at.is_(None),
        )
    )
    res = await session.execute(stmt)
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )
    if post.player_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this post.",
        )

    if data.title is not None:
        post.title = data.title.strip()
    if data.content is not None:
        post.content = data.content.strip()
    if data.category_id is not None:
        post.category_id = uuid.UUID(data.category_id)

    post.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(post)
    return await get_post_detail(session, post_id, user_id, increment_views=False)


async def delete_post(
    session: AsyncSession,
    post_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """Soft deletes a post (author only)."""
    stmt = select(CommunityPost).where(
        and_(
            CommunityPost.id == post_id,
            CommunityPost.deleted_at.is_(None),
        )
    )
    res = await session.execute(stmt)
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )
    if post.player_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this post.",
        )

    post.post_status = "DELETED"
    post.deleted_at = datetime.now(timezone.utc)
    await session.commit()
    return True


# -----------------------------------------------------------------------------
# Likes (Atomic toggle)
# -----------------------------------------------------------------------------
async def toggle_post_like(
    session: AsyncSession,
    post_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Tuple[bool, int]:
    """
    Toggles like status. Returns (is_liked, new_likes_count).
    Dispatches COMMUNITY notification to post author when liked.
    """
    stmt = select(CommunityPost).where(
        and_(CommunityPost.id == post_id, CommunityPost.deleted_at.is_(None))
    )
    res = await session.execute(stmt)
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    like_stmt = select(CommunityLike).where(
        and_(
            CommunityLike.player_id == user_id,
            CommunityLike.post_id == post_id,
        )
    )
    l_res = await session.execute(like_stmt)
    existing = l_res.scalar_one_or_none()

    if existing:
        # Unlike
        await session.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        await session.commit()
        return False, post.likes_count
    else:
        # Like
        like = CommunityLike(
            id=uuid.uuid4(),
            player_id=user_id,
            post_id=post_id,
        )
        session.add(like)
        post.likes_count += 1
        await session.commit()

        # Send notification to post author (if not self)
        if post.player_id != user_id:
            try:
                author_stmt = select(PlayerProfile).where(PlayerProfile.user_id == user_id)
                a_res = await session.execute(author_stmt)
                liker = a_res.scalar_one_or_none()
                liker_name = liker.display_name if liker else "A player"

                await create_player_notification(
                    db=session,
                    user_id=post.player_id,
                    title="New Like on your Post",
                    message=f"{liker_name} liked your post: '{post.title[:40]}...'",
                    notification_type="COMMUNITY",
                    reference_id=str(post.id),
                    reference_url=f"/community/post/{post.id}",
                )
            except Exception:
                pass

        return True, post.likes_count


# -----------------------------------------------------------------------------
# Bookmarks
# -----------------------------------------------------------------------------
async def toggle_post_bookmark(
    session: AsyncSession,
    post_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """Toggles bookmark status. Returns True if saved, False if removed."""
    stmt = select(CommunityBookmark).where(
        and_(
            CommunityBookmark.player_id == user_id,
            CommunityBookmark.post_id == post_id,
        )
    )
    res = await session.execute(stmt)
    bm = res.scalar_one_or_none()

    if bm:
        await session.delete(bm)
        await session.commit()
        return False
    else:
        new_bm = CommunityBookmark(
            id=uuid.uuid4(),
            player_id=user_id,
            post_id=post_id,
        )
        session.add(new_bm)
        await session.commit()
        return True


async def list_user_bookmarks(
    session: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[CommunityPostListItem], int]:
    """Retrieves all bookmarked posts for a player."""
    bm_stmt = (
        select(CommunityBookmark.post_id)
        .where(CommunityBookmark.player_id == user_id)
        .order_by(CommunityBookmark.created_at.desc())
    )
    bm_res = await session.execute(bm_stmt)
    post_ids = bm_res.scalars().all()

    if not post_ids:
        return [], 0

    total_count = len(post_ids)
    paginated_ids = post_ids[offset : offset + limit]

    posts_stmt = (
        select(CommunityPost)
        .options(
            selectinload(CommunityPost.category),
            selectinload(CommunityPost.media),
            selectinload(CommunityPost.poll).selectinload(CommunityPoll.options),
            selectinload(CommunityPost.poll).selectinload(CommunityPoll.votes),
        )
        .where(
            and_(
                CommunityPost.id.in_(paginated_ids),
                CommunityPost.post_status == "PUBLISHED",
                CommunityPost.deleted_at.is_(None),
            )
        )
    )
    p_res = await session.execute(posts_stmt)
    posts_map = {p.id: p for p in p_res.scalars().all()}

    # Preserve bookmark ordering
    ordered_posts = [posts_map[pid] for pid in paginated_ids if pid in posts_map]
    if not ordered_posts:
        return [], total_count

    authors = await get_authors_dict(session, list({p.player_id for p in ordered_posts}))

    # Get likes
    like_stmt = select(CommunityLike.post_id).where(
        and_(
            CommunityLike.player_id == user_id,
            CommunityLike.post_id.in_([p.id for p in ordered_posts]),
        )
    )
    l_res = await session.execute(like_stmt)
    user_likes = set(l_res.scalars().all())

    items = []
    for p in ordered_posts:
        poll_read = await format_poll_read(p.poll, user_id)
        items.append(
            CommunityPostListItem(
                id=str(p.id),
                title=p.title,
                content=p.content,
                post_status=p.post_status,
                is_pinned=p.is_pinned,
                likes_count=p.likes_count,
                comments_count=p.comments_count,
                views_count=p.views_count,
                created_at=p.created_at,
                updated_at=p.updated_at,
                category=CommunityCategoryRead(
                    id=str(p.category.id),
                    name=p.category.name,
                    slug=p.category.slug,
                    description=p.category.description,
                    icon=p.category.icon,
                    display_order=p.category.display_order,
                    is_active=p.category.is_active,
                ),
                author=authors.get(
                    p.player_id,
                    CommunityAuthorRead(
                        id=str(p.player_id),
                        username="player",
                        display_name="Player",
                    ),
                ),
                media=[
                    CommunityPostMediaRead(
                        id=str(m.id),
                        media_url=m.media_url,
                        media_type=m.media_type,
                        file_size=m.file_size,
                        display_order=m.display_order,
                    )
                    for m in p.media
                ],
                poll=poll_read,
                is_liked=(p.id in user_likes),
                is_bookmarked=True,
                is_author=(p.player_id == user_id),
            )
        )

    return items, total_count


# -----------------------------------------------------------------------------
# Comments & Replies
# -----------------------------------------------------------------------------
async def list_comments_for_post(
    session: AsyncSession,
    post_id: uuid.UUID,
    current_user_id: Optional[uuid.UUID] = None,
) -> List[CommunityCommentRead]:
    """
    Retrieves all published comments for a post, threaded with 1-level replies.
    Hides comments from blocked players.
    """
    blocked_ids, muted_ids = await get_hidden_player_ids(session, current_user_id)
    hidden_ids = blocked_ids.union(muted_ids)

    stmt = (
        select(CommunityComment)
        .where(
            and_(
                CommunityComment.post_id == post_id,
                CommunityComment.comment_status != "DELETED",
            )
        )
        .order_by(CommunityComment.created_at.asc())
    )
    res = await session.execute(stmt)
    comments = res.scalars().all()

    # Filter out hidden authors
    visible_comments = [c for c in comments if c.player_id not in hidden_ids]

    author_ids = list({c.player_id for c in visible_comments})
    authors = await get_authors_dict(session, author_ids)

    # Group into top-level and replies
    top_level = []
    replies_by_parent: Dict[uuid.UUID, List[CommunityCommentReplyRead]] = {}

    for c in visible_comments:
        author = authors.get(
            c.player_id,
            CommunityAuthorRead(
                id=str(c.player_id),
                username="player",
                display_name="Player",
            ),
        )
        is_author = (current_user_id == c.player_id) if current_user_id else False

        if c.parent_comment_id is None:
            top_level.append(c)
        else:
            rep = CommunityCommentReplyRead(
                id=str(c.id),
                post_id=str(c.post_id),
                parent_comment_id=str(c.parent_comment_id),
                content=c.content,
                comment_status=c.comment_status,
                likes_count=c.likes_count,
                created_at=c.created_at,
                updated_at=c.updated_at,
                author=author,
                is_author=is_author,
            )
            replies_by_parent.setdefault(c.parent_comment_id, []).append(rep)

    result = []
    for c in top_level:
        author = authors.get(
            c.player_id,
            CommunityAuthorRead(
                id=str(c.player_id),
                username="player",
                display_name="Player",
            ),
        )
        is_author = (current_user_id == c.player_id) if current_user_id else False
        reps = replies_by_parent.get(c.id, [])

        result.append(
            CommunityCommentRead(
                id=str(c.id),
                post_id=str(c.post_id),
                parent_comment_id=None,
                content=c.content,
                comment_status=c.comment_status,
                likes_count=c.likes_count,
                created_at=c.created_at,
                updated_at=c.updated_at,
                author=author,
                is_author=is_author,
                replies=reps,
            )
        )

    return result


async def add_comment(
    session: AsyncSession,
    post_id: uuid.UUID,
    user_id: uuid.UUID,
    data: CommunityCommentCreate,
) -> CommunityCommentRead:
    """Adds a new comment or reply, updating comments_count and sending notification."""
    # Check post exists
    stmt = select(CommunityPost).where(
        and_(CommunityPost.id == post_id, CommunityPost.deleted_at.is_(None))
    )
    res = await session.execute(stmt)
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    parent_id = None
    parent_comment = None
    if data.parent_comment_id:
        parent_id = uuid.UUID(data.parent_comment_id)
        p_stmt = select(CommunityComment).where(
            and_(
                CommunityComment.id == parent_id,
                CommunityComment.post_id == post_id,
            )
        )
        p_res = await session.execute(p_stmt)
        parent_comment = p_res.scalar_one_or_none()
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found.",
            )

    comment = CommunityComment(
        id=uuid.uuid4(),
        player_id=user_id,
        post_id=post_id,
        parent_comment_id=parent_id,
        content=data.content.strip(),
        comment_status="PUBLISHED",
    )
    session.add(comment)
    post.comments_count += 1
    await session.commit()
    await session.refresh(comment)

    # Notify author
    try:
        author_stmt = select(PlayerProfile).where(PlayerProfile.user_id == user_id)
        a_res = await session.execute(author_stmt)
        commenter = a_res.scalar_one_or_none()
        c_name = commenter.display_name if commenter else "A player"

        if parent_comment and parent_comment.player_id != user_id:
            # Notify parent comment author
            await create_player_notification(
                db=session,
                user_id=parent_comment.player_id,
                title="New reply to your comment",
                message=f"{c_name} replied: '{comment.content[:40]}...'",
                notification_type="COMMUNITY",
                reference_id=str(post.id),
                reference_url=f"/community/post/{post.id}",
            )
        elif post.player_id != user_id:
            # Notify post author
            await create_player_notification(
                db=session,
                user_id=post.player_id,
                title="New comment on your post",
                message=f"{c_name} commented on '{post.title[:30]}...'",
                notification_type="COMMUNITY",
                reference_id=str(post.id),
                reference_url=f"/community/post/{post.id}",
            )
    except Exception:
        pass

    authors = await get_authors_dict(session, [user_id])
    author = authors.get(
        user_id,
        CommunityAuthorRead(
            id=str(user_id),
            username="player",
            display_name="Player",
        ),
    )

    return CommunityCommentRead(
        id=str(comment.id),
        post_id=str(comment.post_id),
        parent_comment_id=str(parent_id) if parent_id else None,
        content=comment.content,
        comment_status=comment.comment_status,
        likes_count=comment.likes_count,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author=author,
        is_author=True,
        replies=[],
    )


async def update_comment(
    session: AsyncSession,
    comment_id: uuid.UUID,
    user_id: uuid.UUID,
    data: CommunityCommentUpdate,
) -> CommunityCommentRead:
    """Updates comment content (author only)."""
    stmt = select(CommunityComment).where(
        and_(
            CommunityComment.id == comment_id,
            CommunityComment.comment_status != "DELETED",
        )
    )
    res = await session.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )
    if c.player_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this comment.",
        )

    c.content = data.content.strip()
    c.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(c)

    authors = await get_authors_dict(session, [user_id])
    return CommunityCommentRead(
        id=str(c.id),
        post_id=str(c.post_id),
        parent_comment_id=str(c.parent_comment_id) if c.parent_comment_id else None,
        content=c.content,
        comment_status=c.comment_status,
        likes_count=c.likes_count,
        created_at=c.created_at,
        updated_at=c.updated_at,
        author=authors.get(user_id, CommunityAuthorRead(id=str(user_id), username="player", display_name="Player")),
        is_author=True,
        replies=[],
    )


async def delete_comment(
    session: AsyncSession,
    comment_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """Soft deletes comment (author only), decrementing post comments_count."""
    stmt = select(CommunityComment).where(
        and_(
            CommunityComment.id == comment_id,
            CommunityComment.comment_status != "DELETED",
        )
    )
    res = await session.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )
    if c.player_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this comment.",
        )

    c.comment_status = "DELETED"
    c.deleted_at = datetime.now(timezone.utc)

    # Decrement post comments_count
    post_stmt = select(CommunityPost).where(CommunityPost.id == c.post_id)
    p_res = await session.execute(post_stmt)
    post = p_res.scalar_one_or_none()
    if post:
        post.comments_count = max(0, post.comments_count - 1)

    await session.commit()
    return True


# -----------------------------------------------------------------------------
# Poll Voting
# -----------------------------------------------------------------------------
async def vote_in_poll(
    session: AsyncSession,
    poll_id: uuid.UUID,
    user_id: uuid.UUID,
    data: CommunityPollVoteCreate,
) -> CommunityPollRead:
    """Records player's vote on poll. Handles vote changes if allowed."""
    stmt = (
        select(CommunityPoll)
        .options(
            selectinload(CommunityPoll.options),
            selectinload(CommunityPoll.votes),
        )
        .where(CommunityPoll.id == poll_id)
    )
    res = await session.execute(stmt)
    poll = res.scalar_one_or_none()
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found.",
        )

    # Check expiration
    now = datetime.now(timezone.utc)
    if poll.expires_at:
        exp = poll.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now > exp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This poll has ended and is no longer accepting votes.",
            )

    # Check target option belongs to poll
    target_opt_id = uuid.UUID(data.option_id)
    target_opt = next((o for o in poll.options if o.id == target_opt_id), None)
    if not target_opt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll option not found.",
        )

    # Check existing vote
    vote_stmt = select(CommunityPollVote).where(
        and_(
            CommunityPollVote.poll_id == poll_id,
            CommunityPollVote.player_id == user_id,
        )
    )
    v_res = await session.execute(vote_stmt)
    existing_vote = v_res.scalar_one_or_none()

    if existing_vote:
        if not poll.allow_vote_change:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already voted in this poll and changing votes is not permitted.",
            )
        if existing_vote.option_id == target_opt_id:
            # Same option, do nothing
            return await format_poll_read(poll, user_id)

        # Decrement old option
        old_opt = next((o for o in poll.options if o.id == existing_vote.option_id), None)
        if old_opt:
            old_opt.vote_count = max(0, old_opt.vote_count - 1)

        # Update vote
        existing_vote.option_id = target_opt_id
        target_opt.vote_count += 1
    else:
        # New vote
        new_vote = CommunityPollVote(
            id=uuid.uuid4(),
            poll_id=poll_id,
            option_id=target_opt_id,
            player_id=user_id,
        )
        session.add(new_vote)
        target_opt.vote_count += 1
        poll.total_votes += 1

    await session.commit()
    await session.refresh(poll)
    return await format_poll_read(poll, user_id)


# -----------------------------------------------------------------------------
# Follows & Player Profiles
# -----------------------------------------------------------------------------
async def toggle_player_follow(
    session: AsyncSession,
    follower_id: uuid.UUID,
    following_id: uuid.UUID,
) -> Tuple[bool, int]:
    """
    Toggles follow status. Returns (is_following, follower_count).
    Dispatches COMMUNITY notification when followed.
    """
    if follower_id == following_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself.",
        )

    # Check block
    blocked_ids, _ = await get_hidden_player_ids(session, follower_id)
    if following_id in blocked_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow a blocked player.",
        )

    stmt = select(CommunityFollow).where(
        and_(
            CommunityFollow.follower_id == follower_id,
            CommunityFollow.following_id == following_id,
        )
    )
    res = await session.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        await session.delete(existing)
        await session.commit()
        is_following = False
    else:
        new_follow = CommunityFollow(
            id=uuid.uuid4(),
            follower_id=follower_id,
            following_id=following_id,
        )
        session.add(new_follow)
        await session.commit()
        is_following = True

        # Send notification
        try:
            author_stmt = select(PlayerProfile).where(PlayerProfile.user_id == follower_id)
            a_res = await session.execute(author_stmt)
            follower_prof = a_res.scalar_one_or_none()
            f_name = follower_prof.display_name if follower_prof else "A player"

            await create_player_notification(
                db=session,
                user_id=following_id,
                title="New Follower",
                message=f"{f_name} started following your Leonida journey!",
                notification_type="COMMUNITY",
                reference_id=str(follower_id),
                reference_url=f"/community/player/{follower_prof.username if follower_prof else str(follower_id)}",
            )
        except Exception:
            pass

    # Count followers
    count_stmt = select(func.count(CommunityFollow.id)).where(CommunityFollow.following_id == following_id)
    c_res = await session.execute(count_stmt)
    followers_count = c_res.scalar_one() or 0

    return is_following, followers_count


async def get_player_community_profile(
    session: AsyncSession,
    username: str,
    current_user_id: Optional[uuid.UUID] = None,
) -> CommunityPlayerProfileRead:
    """Retrieves player community profile by username with follow/block/mute statuses."""
    prof_stmt = select(PlayerProfile).where(func.lower(PlayerProfile.username) == username.lower().strip())
    p_res = await session.execute(prof_stmt)
    profile = p_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player '@{username}' not found.",
        )

    target_id = profile.user_id

    # Count published posts
    posts_count_stmt = select(func.count(CommunityPost.id)).where(
        and_(
            CommunityPost.player_id == target_id,
            CommunityPost.post_status == "PUBLISHED",
            CommunityPost.deleted_at.is_(None),
        )
    )
    posts_res = await session.execute(posts_count_stmt)
    posts_count = posts_res.scalar_one() or 0

    # Count followers & following
    followers_stmt = select(func.count(CommunityFollow.id)).where(CommunityFollow.following_id == target_id)
    foll_res = await session.execute(followers_stmt)
    followers_count = foll_res.scalar_one() or 0

    following_stmt = select(func.count(CommunityFollow.id)).where(CommunityFollow.follower_id == target_id)
    fing_res = await session.execute(following_stmt)
    following_count = fing_res.scalar_one() or 0

    # Relation statuses with current_user
    is_following = False
    is_blocked = False
    is_muted = False

    if current_user_id and current_user_id != target_id:
        f_stmt = select(CommunityFollow).where(
            and_(
                CommunityFollow.follower_id == current_user_id,
                CommunityFollow.following_id == target_id,
            )
        )
        f_res = await session.execute(f_stmt)
        is_following = f_res.scalar_one_or_none() is not None

        b_stmt = select(CommunityBlock).where(
            and_(
                CommunityBlock.blocker_id == current_user_id,
                CommunityBlock.blocked_id == target_id,
            )
        )
        b_res = await session.execute(b_stmt)
        is_blocked = b_res.scalar_one_or_none() is not None

        m_stmt = select(CommunityMute).where(
            and_(
                CommunityMute.muter_id == current_user_id,
                CommunityMute.muted_id == target_id,
            )
        )
        m_res = await session.execute(m_stmt)
        is_muted = m_res.scalar_one_or_none() is not None

    return CommunityPlayerProfileRead(
        id=str(target_id),
        username=profile.username,
        display_name=profile.display_name or profile.username,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        preferred_platform=profile.preferred_platform,
        is_verified=profile.is_verified,
        reputation_score=profile.reputation_score,
        created_at=profile.created_at,
        posts_count=posts_count,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
        is_blocked=is_blocked,
        is_muted=is_muted,
    )


# -----------------------------------------------------------------------------
# Reports, Blocks, Mutes
# -----------------------------------------------------------------------------
async def create_report(
    session: AsyncSession,
    user_id: uuid.UUID,
    data: CommunityReportCreate,
) -> CommunityReportRead:
    """Creates a safety & moderation report."""
    rep = CommunityReport(
        id=uuid.uuid4(),
        reporter_id=user_id,
        target_type=data.target_type,
        target_id=data.target_id.strip(),
        reason=data.reason.strip(),
        description=data.description.strip() if data.description else None,
        report_status="PENDING",
    )
    session.add(rep)
    await session.commit()
    await session.refresh(rep)

    return CommunityReportRead(
        id=str(rep.id),
        reporter_id=str(rep.reporter_id),
        target_type=rep.target_type,
        target_id=rep.target_id,
        reason=rep.reason,
        description=rep.description,
        report_status=rep.report_status,
        created_at=rep.created_at,
    )


async def toggle_block_player(
    session: AsyncSession,
    blocker_id: uuid.UUID,
    blocked_id: uuid.UUID,
) -> bool:
    """Toggles block on player. When blocked, automatically removes follow relationship."""
    if blocker_id == blocked_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot block yourself.",
        )

    stmt = select(CommunityBlock).where(
        and_(
            CommunityBlock.blocker_id == blocker_id,
            CommunityBlock.blocked_id == blocked_id,
        )
    )
    res = await session.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        await session.delete(existing)
        await session.commit()
        return False
    else:
        new_block = CommunityBlock(
            id=uuid.uuid4(),
            blocker_id=blocker_id,
            blocked_id=blocked_id,
        )
        session.add(new_block)

        # Remove any follows between them in either direction
        del_follows = delete(CommunityFollow).where(
            or_(
                and_(CommunityFollow.follower_id == blocker_id, CommunityFollow.following_id == blocked_id),
                and_(CommunityFollow.follower_id == blocked_id, CommunityFollow.following_id == blocker_id),
            )
        )
        await session.execute(del_follows)

        await session.commit()
        return True


async def toggle_mute_player(
    session: AsyncSession,
    muter_id: uuid.UUID,
    muted_id: uuid.UUID,
) -> bool:
    """Toggles mute on player (silently hides their content for muter)."""
    if muter_id == muted_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot mute yourself.",
        )

    stmt = select(CommunityMute).where(
        and_(
            CommunityMute.muter_id == muter_id,
            CommunityMute.muted_id == muted_id,
        )
    )
    res = await session.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        await session.delete(existing)
        await session.commit()
        return False
    else:
        new_mute = CommunityMute(
            id=uuid.uuid4(),
            muter_id=muter_id,
            muted_id=muted_id,
        )
        session.add(new_mute)
        await session.commit()
        return True
