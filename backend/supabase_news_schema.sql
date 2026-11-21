-- ==============================================================================
-- GTA 6 Player Hub – Phase 4: News & Updates Database Schema & Supabase RLS
-- ==============================================================================

-- 1. Create news_sources table
CREATE TABLE IF NOT EXISTS public.news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    website_url VARCHAR(512) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'PRESS', -- 'OFFICIAL', 'PRESS', 'COMMUNITY'
    trust_level VARCHAR(50) NOT NULL DEFAULT 'VERIFIED', -- 'OFFICIAL', 'VERIFIED', 'UNCONFIRMED'
    feed_url VARCHAR(512),
    collection_method VARCHAR(50) NOT NULL DEFAULT 'RSS',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    last_checked_at TIMESTAMPTZ,
    last_error VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create news_categories table
CREATE TABLE IF NOT EXISTS public.news_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_categories_slug ON public.news_categories (slug);

-- 3. Create news_articles table
CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(512),
    category_id UUID REFERENCES public.news_categories(id) ON DELETE SET NULL,
    source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
    original_article_url VARCHAR(512) NOT NULL,
    canonical_url VARCHAR(512) NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED', -- 'OFFICIAL', 'VERIFIED', 'RUMOUR', 'UNCONFIRMED'
    publication_status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED', -- 'PUBLISHED', 'DRAFT', 'ARCHIVED'
    original_published_at TIMESTAMPTZ NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    read_time_minutes INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON public.news_articles (slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_pub_date ON public.news_articles (publication_status, original_published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_verification ON public.news_articles (verification_status);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON public.news_articles (is_featured);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles (category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON public.news_articles (source_id);

-- 4. Create news_bookmarks table
CREATE TABLE IF NOT EXISTS public.news_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_player_article_bookmark UNIQUE (player_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_news_bookmarks_player ON public.news_bookmarks (player_id);
CREATE INDEX IF NOT EXISTS idx_news_bookmarks_article ON public.news_bookmarks (article_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all Phase 4 tables
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_bookmarks ENABLE ROW LEVEL SECURITY;

-- 1. news_sources RLS: Public can view active sources
CREATE POLICY "Public sources viewable by all"
ON public.news_sources FOR SELECT
USING (is_enabled = true);

-- 2. news_categories RLS: Public can view active categories
CREATE POLICY "Active categories viewable by all"
ON public.news_categories FOR SELECT
USING (is_active = true);

-- 3. news_articles RLS: Public can view published articles
CREATE POLICY "Published articles viewable by all"
ON public.news_articles FOR SELECT
USING (publication_status = 'PUBLISHED');

-- 4. news_bookmarks RLS: Players can view, insert, and delete only their own bookmarks
CREATE POLICY "Players can view own bookmarks"
ON public.news_bookmarks FOR SELECT
TO authenticated
USING (auth.uid() = player_id);

CREATE POLICY "Players can insert own bookmarks"
ON public.news_bookmarks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can delete own bookmarks"
ON public.news_bookmarks FOR DELETE
TO authenticated
USING (auth.uid() = player_id);
