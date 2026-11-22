-- ==============================================================================
-- GTA 6 PLAYER HUB - PHASE 7 SUPABASE COMMUNITY SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. COMMUNITY CATEGORIES
CREATE TABLE IF NOT EXISTS public.community_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL UNIQUE,
    slug VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'message-square',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read community categories" ON public.community_categories
    FOR SELECT USING (is_active = true);

-- 2. COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.community_categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    likes_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_community_posts_player ON public.community_posts(player_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_cat ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_status_created ON public.community_posts(post_status, created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published posts" ON public.community_posts
    FOR SELECT USING (post_status = 'PUBLISHED' AND deleted_at IS NULL);
CREATE POLICY "Users can create own posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can update own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = player_id);

-- 3. COMMUNITY POST MEDIA
CREATE TABLE IF NOT EXISTS public.community_post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    media_url VARCHAR(1024) NOT NULL,
    media_type VARCHAR(32) NOT NULL DEFAULT 'IMAGE',
    file_size INT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_community_post_media_post ON public.community_post_media(post_id);
ALTER TABLE public.community_post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read post media" ON public.community_post_media FOR SELECT USING (true);
CREATE POLICY "Post author manage media" ON public.community_post_media
    FOR ALL USING (EXISTS (SELECT 1 FROM public.community_posts WHERE id = post_id AND player_id = auth.uid()));

-- 4. COMMUNITY LIKES
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_player_post_like UNIQUE (player_id, post_id)
);

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read post likes" ON public.community_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can unlike posts" ON public.community_likes FOR DELETE USING (auth.uid() = player_id);

-- 5. COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    parent_comment_id UUID NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
    likes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id, comment_status, created_at ASC);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON public.community_comments
    FOR SELECT USING (comment_status = 'PUBLISHED' AND deleted_at IS NULL);
CREATE POLICY "Users create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users edit own comments" ON public.community_comments
    FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Users delete own comments" ON public.community_comments
    FOR DELETE USING (auth.uid() = player_id);

-- 6. COMMUNITY BOOKMARKS
CREATE TABLE IF NOT EXISTS public.community_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_player_post_bookmark UNIQUE (player_id, post_id)
);

ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.community_bookmarks
    FOR ALL USING (auth.uid() = player_id);

-- 7. COMMUNITY FOLLOWS
CREATE TABLE IF NOT EXISTS public.community_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_follow_pair UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_community_follows_following ON public.community_follows(following_id, follower_id);
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read follows" ON public.community_follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON public.community_follows
    FOR ALL USING (auth.uid() = follower_id);

-- 8. COMMUNITY POLLS
CREATE TABLE IF NOT EXISTS public.community_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE UNIQUE,
    question VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NULL,
    allow_vote_change BOOLEAN NOT NULL DEFAULT FALSE,
    total_votes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read polls" ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "Post owner creates poll" ON public.community_polls
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.community_posts WHERE id = post_id AND player_id = auth.uid()));

-- 9. COMMUNITY POLL OPTIONS
CREATE TABLE IF NOT EXISTS public.community_poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    vote_count INT NOT NULL DEFAULT 0
);

ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read poll options" ON public.community_poll_options FOR SELECT USING (true);

-- 10. COMMUNITY POLL VOTES
CREATE TABLE IF NOT EXISTS public.community_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_poll_player_vote UNIQUE (poll_id, player_id)
);

ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read poll votes" ON public.community_poll_votes FOR SELECT USING (true);
CREATE POLICY "Users vote in poll" ON public.community_poll_votes
    FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users change vote if allowed" ON public.community_poll_votes
    FOR DELETE USING (auth.uid() = player_id);

-- 11. COMMUNITY REPORTS
CREATE TABLE IF NOT EXISTS public.community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type VARCHAR(32) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    description VARCHAR(500) NULL,
    report_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users file reports" ON public.community_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users read own reports" ON public.community_reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- 12. COMMUNITY BLOCKS & MUTES
CREATE TABLE IF NOT EXISTS public.community_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_block_pair UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own blocks" ON public.community_blocks
    FOR ALL USING (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS public.community_mutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    muter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    muted_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_mute_pair UNIQUE (muter_id, muted_id)
);

ALTER TABLE public.community_mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mutes" ON public.community_mutes
    FOR ALL USING (auth.uid() = muter_id);
