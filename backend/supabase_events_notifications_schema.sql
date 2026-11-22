-- ==============================================================================
-- GTA 6 PLAYER HUB: PHASE 6 - EVENTS CALENDAR & NOTIFICATION CENTRE
-- Supabase PostgreSQL Schema with Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Event Categories
CREATE TABLE IF NOT EXISTS public.event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) NOT NULL UNIQUE,
    slug VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'calendar',
    color VARCHAR(32) DEFAULT '#f97316',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_categories_slug ON public.event_categories (slug);

-- 3. Event Sources
CREATE TABLE IF NOT EXISTS public.event_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL UNIQUE,
    website_url VARCHAR(512) NOT NULL,
    source_type VARCHAR(32) NOT NULL DEFAULT 'OFFICIAL',
    reliability_score INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    short_summary VARCHAR(500),
    category_id UUID NOT NULL REFERENCES public.event_categories(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.event_sources(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    location_type VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    location_name VARCHAR(255),
    event_url VARCHAR(512),
    stream_url VARCHAR(512),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    banner_image_url VARCHAR(512),
    organizer_name VARCHAR(128) NOT NULL DEFAULT 'Rockstar Games',
    tags VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events (start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events (category_id);
CREATE INDEX IF NOT EXISTS idx_events_verification ON public.events (verification_status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events (is_featured);

-- 5. Saved Events (Player Private)
CREATE TABLE IF NOT EXISTS public.saved_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_event_save UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_events_user_created ON public.saved_events (user_id, created_at);

-- 6. Event Reminders (Player Private)
CREATE TABLE IF NOT EXISTS public.event_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    lead_time_minutes INT NOT NULL DEFAULT 60,
    channel VARCHAR(32) NOT NULL DEFAULT 'IN_APP',
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_event_reminder UNIQUE (user_id, event_id, lead_time_minutes, channel)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_status ON public.event_reminders (is_sent, lead_time_minutes);

-- 7. Notifications (Player Private)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(32) NOT NULL,
    reference_id VARCHAR(128),
    reference_url VARCHAR(512),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications (user_id, notification_type);

-- 8. Notification Preferences (Player Private)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    news_updates BOOLEAN NOT NULL DEFAULT TRUE,
    price_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    event_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    community_activity BOOLEAN NOT NULL DEFAULT TRUE,
    platform_announcements BOOLEAN NOT NULL DEFAULT TRUE,
    default_reminder_minutes INT NOT NULL DEFAULT 60,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start VARCHAR(5) NOT NULL DEFAULT '22:00',
    quiet_hours_end VARCHAR(5) NOT NULL DEFAULT '08:00',
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notification_preferences (user_id);

-- 9. Notification Deliveries
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SENT',
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_deliveries_notification ON public.notification_deliveries (notification_id);

-- 10. Push Subscriptions (Player Private)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint VARCHAR(1024) NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_push_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_user_active ON public.push_subscriptions (user_id, is_active);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public Read for Event catalog
CREATE POLICY "Public read for event categories" ON public.event_categories FOR SELECT USING (true);
CREATE POLICY "Public read for event sources" ON public.event_sources FOR SELECT USING (true);
CREATE POLICY "Public read for events" ON public.events FOR SELECT USING (true);

-- Saved Events RLS
CREATE POLICY "Users can view their saved events" ON public.saved_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their saved events" ON public.saved_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their saved events" ON public.saved_events
    FOR DELETE USING (auth.uid() = user_id);

-- Event Reminders RLS
CREATE POLICY "Users can view their event reminders" ON public.event_reminders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their event reminders" ON public.event_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their event reminders" ON public.event_reminders
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their event reminders" ON public.event_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications (mark read)" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Notification Preferences RLS
CREATE POLICY "Users can view their notification preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their notification preferences" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their notification preferences" ON public.notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Push Subscriptions RLS
CREATE POLICY "Users can view their push subscriptions" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their push subscriptions" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their push subscriptions" ON public.push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their push subscriptions" ON public.push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);
