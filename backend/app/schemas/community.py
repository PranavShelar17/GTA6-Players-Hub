from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Author & Categories
# -----------------------------------------------------------------------------
class CommunityAuthorRead(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    preferred_platform: Optional[str] = None
    is_verified: bool = False
    reputation_score: int = 0


class CommunityCategoryRead(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "message-square"
    display_order: int = 0
    is_active: bool = True


# -----------------------------------------------------------------------------
# Media
# -----------------------------------------------------------------------------
class CommunityPostMediaRead(BaseModel):
    id: str
    media_url: str
    media_type: str = "IMAGE"
    file_size: Optional[int] = None
    display_order: int = 0


# -----------------------------------------------------------------------------
# Polls
# -----------------------------------------------------------------------------
class CommunityPollOptionRead(BaseModel):
    id: str
    option_text: str
    display_order: int = 0
    vote_count: int = 0
    percentage: float = 0.0


class CommunityPollRead(BaseModel):
    id: str
    question: str
    expires_at: Optional[datetime] = None
    allow_vote_change: bool = False
    total_votes: int = 0
    is_expired: bool = False
    user_voted_option_id: Optional[str] = None
    options: List[CommunityPollOptionRead] = []


class CommunityPollCreate(BaseModel):
    question: str = Field(..., min_length=3, max_length=255)
    expires_at: Optional[datetime] = None
    allow_vote_change: bool = False
    options: List[str] = Field(..., min_length=2, max_length=10)


class CommunityPollVoteCreate(BaseModel):
    option_id: str


# -----------------------------------------------------------------------------
# Posts
# -----------------------------------------------------------------------------
class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10, max_length=10000)
    category_id: str
    media_urls: Optional[List[str]] = Field(default=[], max_length=4)
    poll: Optional[CommunityPollCreate] = None


class CommunityPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    content: Optional[str] = Field(None, min_length=10, max_length=10000)
    category_id: Optional[str] = None


class CommunityPostListItem(BaseModel):
    id: str
    title: str
    content: str
    post_status: str
    is_pinned: bool = False
    likes_count: int = 0
    comments_count: int = 0
    views_count: int = 0
    created_at: datetime
    updated_at: datetime
    category: CommunityCategoryRead
    author: CommunityAuthorRead
    media: List[CommunityPostMediaRead] = []
    poll: Optional[CommunityPollRead] = None
    is_liked: bool = False
    is_bookmarked: bool = False
    is_author: bool = False


class CommunityPostDetail(CommunityPostListItem):
    pass


# -----------------------------------------------------------------------------
# Comments & Replies
# -----------------------------------------------------------------------------
class CommunityCommentReplyRead(BaseModel):
    id: str
    post_id: str
    parent_comment_id: str
    content: str
    comment_status: str
    likes_count: int = 0
    created_at: datetime
    updated_at: datetime
    author: CommunityAuthorRead
    is_author: bool = False


class CommunityCommentRead(BaseModel):
    id: str
    post_id: str
    parent_comment_id: Optional[str] = None
    content: str
    comment_status: str
    likes_count: int = 0
    created_at: datetime
    updated_at: datetime
    author: CommunityAuthorRead
    is_author: bool = False
    replies: List[CommunityCommentReplyRead] = []


class CommunityCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: Optional[str] = None


class CommunityCommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


# -----------------------------------------------------------------------------
# Profiles, Follows, Moderation
# -----------------------------------------------------------------------------
class CommunityPlayerProfileRead(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferred_platform: Optional[str] = None
    is_verified: bool = False
    reputation_score: int = 0
    created_at: Optional[datetime] = None
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
    is_blocked: bool = False
    is_muted: bool = False


class CommunityFollowRead(BaseModel):
    id: str
    follower_id: str
    following_id: str
    created_at: datetime


class CommunityReportCreate(BaseModel):
    target_type: str = Field(..., pattern="^(POST|COMMENT|PLAYER)$")
    target_id: str = Field(..., min_length=1, max_length=128)
    reason: str = Field(..., min_length=2, max_length=64)
    description: Optional[str] = Field(None, max_length=500)


class CommunityReportRead(BaseModel):
    id: str
    reporter_id: str
    target_type: str
    target_id: str
    reason: str
    description: Optional[str] = None
    report_status: str
    created_at: datetime


class CommunityBlockRead(BaseModel):
    id: str
    blocker_id: str
    blocked_id: str
    created_at: datetime


class CommunityMuteRead(BaseModel):
    id: str
    muter_id: str
    muted_id: str
    created_at: datetime
