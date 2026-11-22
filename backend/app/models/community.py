import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import GUID


class CommunityCategory(Base):
    __tablename__ = "community_categories"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(64), nullable=False, unique=True)
    slug = Column(String(64), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(64), nullable=True, default="message-square")
    display_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    posts = relationship("CommunityPost", back_populates="category")


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    player_id = Column(GUID(), nullable=False, index=True)
    category_id = Column(GUID(), ForeignKey("community_categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    post_status = Column(String(32), nullable=False, default="PUBLISHED", index=True)  # PUBLISHED, DRAFT, HIDDEN, DELETED
    is_pinned = Column(Boolean, nullable=False, default=False)
    likes_count = Column(Integer, nullable=False, default=0)
    comments_count = Column(Integer, nullable=False, default=0)
    views_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    category = relationship("CommunityCategory", back_populates="posts")
    media = relationship("CommunityPostMedia", back_populates="post", cascade="all, delete-orphan", order_by="CommunityPostMedia.display_order")
    likes = relationship("CommunityLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan")
    bookmarks = relationship("CommunityBookmark", back_populates="post", cascade="all, delete-orphan")
    poll = relationship("CommunityPoll", back_populates="post", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_community_posts_status_created", "post_status", "created_at"),
        Index("idx_community_posts_player_status", "player_id", "post_status"),
    )


class CommunityPostMedia(Base):
    __tablename__ = "community_post_media"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    post_id = Column(GUID(), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    media_url = Column(String(1024), nullable=False)
    media_type = Column(String(32), nullable=False, default="IMAGE")  # IMAGE
    file_size = Column(Integer, nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("CommunityPost", back_populates="media")


class CommunityLike(Base):
    __tablename__ = "community_likes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    player_id = Column(GUID(), nullable=False, index=True)
    post_id = Column(GUID(), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("CommunityPost", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("player_id", "post_id", name="uq_community_player_post_like"),
    )


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    player_id = Column(GUID(), nullable=False, index=True)
    post_id = Column(GUID(), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_comment_id = Column(GUID(), ForeignKey("community_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    comment_status = Column(String(32), nullable=False, default="PUBLISHED", index=True)  # PUBLISHED, HIDDEN, DELETED
    likes_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    post = relationship("CommunityPost", back_populates="comments")
    parent = relationship("CommunityComment", remote_side=[id], back_populates="replies")
    replies = relationship("CommunityComment", back_populates="parent", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_community_comments_post_status", "post_id", "comment_status", "created_at"),
    )


class CommunityBookmark(Base):
    __tablename__ = "community_bookmarks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    player_id = Column(GUID(), nullable=False, index=True)
    post_id = Column(GUID(), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("CommunityPost", back_populates="bookmarks")

    __table_args__ = (
        UniqueConstraint("player_id", "post_id", name="uq_community_player_post_bookmark"),
        Index("idx_community_bookmarks_player_created", "player_id", "created_at"),
    )


class CommunityFollow(Base):
    __tablename__ = "community_follows"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    follower_id = Column(GUID(), nullable=False, index=True)  # The player who clicked follow
    following_id = Column(GUID(), nullable=False, index=True)  # The player being followed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_community_follow_pair"),
        Index("idx_community_follows_following", "following_id", "follower_id"),
    )


class CommunityPoll(Base):
    __tablename__ = "community_polls"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    post_id = Column(GUID(), ForeignKey("community_posts.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    question = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    allow_vote_change = Column(Boolean, nullable=False, default=False)
    total_votes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("CommunityPost", back_populates="poll")
    options = relationship("CommunityPollOption", back_populates="poll", cascade="all, delete-orphan", order_by="CommunityPollOption.display_order")
    votes = relationship("CommunityPollVote", back_populates="poll", cascade="all, delete-orphan")


class CommunityPollOption(Base):
    __tablename__ = "community_poll_options"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    poll_id = Column(GUID(), ForeignKey("community_polls.id", ondelete="CASCADE"), nullable=False, index=True)
    option_text = Column(String(255), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)
    vote_count = Column(Integer, nullable=False, default=0)

    poll = relationship("CommunityPoll", back_populates="options")
    votes = relationship("CommunityPollVote", back_populates="option", cascade="all, delete-orphan")


class CommunityPollVote(Base):
    __tablename__ = "community_poll_votes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    poll_id = Column(GUID(), ForeignKey("community_polls.id", ondelete="CASCADE"), nullable=False, index=True)
    option_id = Column(GUID(), ForeignKey("community_poll_options.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(GUID(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    poll = relationship("CommunityPoll", back_populates="votes")
    option = relationship("CommunityPollOption", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("poll_id", "player_id", name="uq_community_poll_player_vote"),
    )


class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(GUID(), nullable=False, index=True)
    target_type = Column(String(32), nullable=False)  # POST, COMMENT, PLAYER
    target_id = Column(String(128), nullable=False, index=True)
    reason = Column(String(64), nullable=False)  # SPAM, HARASSMENT, HATE, INAPPROPRIATE, IMPERSONATION, COPYRIGHT, MISINFORMATION, OTHER
    description = Column(String(500), nullable=True)
    report_status = Column(String(32), nullable=False, default="PENDING", index=True)  # PENDING, REVIEWED, DISMISSED, ACTIONED
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_community_reports_target", "target_type", "target_id"),
    )


class CommunityBlock(Base):
    __tablename__ = "community_blocks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    blocker_id = Column(GUID(), nullable=False, index=True)
    blocked_id = Column(GUID(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_community_block_pair"),
        Index("idx_community_blocks_pair", "blocker_id", "blocked_id"),
    )


class CommunityMute(Base):
    __tablename__ = "community_mutes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    muter_id = Column(GUID(), nullable=False, index=True)
    muted_id = Column(GUID(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("muter_id", "muted_id", name="uq_community_mute_pair"),
        Index("idx_community_mutes_pair", "muter_id", "muted_id"),
    )
