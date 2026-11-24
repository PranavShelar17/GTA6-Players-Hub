-- ==============================================================================
-- GTA 6 PLAYER HUB - PHASE 11: GLOBAL SEARCH & PERSONALISATION SCHEMA
-- ==============================================================================

-- 1. Extend player_preferences with Phase 11 personalization columns
ALTER TABLE player_preferences
ADD COLUMN IF NOT EXISTS preferred_categories TEXT,
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS content_density VARCHAR(20) NOT NULL DEFAULT 'comfortable';

-- 2. Create search_index table
CREATE TABLE IF NOT EXISTS search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(32) NOT NULL,
    content_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    searchable_text TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    url_path VARCHAR(512) NOT NULL,
    thumbnail_url VARCHAR(512),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
    source_or_author VARCHAR(128),
    published_or_event_at TIMESTAMPTZ,
    price_amount NUMERIC(10, 2),
    currency_code VARCHAR(3),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    source_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_search_content UNIQUE (content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_search_content_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_search_category ON search_index(category);
CREATE INDEX IF NOT EXISTS idx_search_title ON search_index(title);
CREATE INDEX IF NOT EXISTS idx_search_published_date ON search_index(published_or_event_at);
CREATE INDEX IF NOT EXISTS idx_search_is_public ON search_index(is_public);

-- 3. Create user_search_history table
CREATE TABLE IF NOT EXISTS user_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_query VARCHAR(255) NOT NULL,
    category_filter VARCHAR(32),
    results_count INT NOT NULL DEFAULT 0,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_search_user_id ON user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_searched_at ON user_search_history(searched_at);
CREATE INDEX IF NOT EXISTS ix_user_search_user_date ON user_search_history(user_id, searched_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- 5. Search Index RLS Policies (Public Read for Public Content, Service Role Write)
CREATE POLICY "Public search index read"
    ON search_index FOR SELECT
    USING (is_public = true);

CREATE POLICY "Service role manages search index"
    ON search_index FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 6. User Search History RLS Policies (Strict User Isolation)
CREATE POLICY "Users can view own search history"
    ON user_search_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
    ON user_search_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
    ON user_search_history FOR DELETE
    USING (auth.uid() = user_id);
