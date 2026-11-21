-- ==============================================================================
-- GTA 6 PLAYER HUB - SUPABASE SQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Phase 2: Database Architecture & Complete Player Authentication
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 2. Create player_profiles Table
CREATE TABLE IF NOT EXISTS public.player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL,
    avatar_url TEXT NULL,
    bio VARCHAR(500) NULL,
    country_code VARCHAR(3) NULL,
    preferred_platform VARCHAR(20) NOT NULL DEFAULT 'PC',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    profile_visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    reputation_score INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Case-insensitive unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_profiles_lower_username 
ON public.player_profiles (lower(username));

CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id 
ON public.player_profiles (user_id);

-- 3. Create player_preferences Table
CREATE TABLE IF NOT EXISTS public.player_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_country VARCHAR(3) NOT NULL DEFAULT 'USA',
    preferred_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    preferred_platform VARCHAR(20) NOT NULL DEFAULT 'PC',
    preferred_edition VARCHAR(50) NOT NULL DEFAULT 'Standard Edition',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    community_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    news_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    price_alert_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    event_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_player_preferences_user_id 
ON public.player_preferences (user_id);

-- 4. Create player_activities Table
CREATE TABLE IF NOT EXISTS public.player_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_player_activities_user_id_created 
ON public.player_activities (user_id, created_at DESC);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- A. player_profiles RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (or public) can view public profiles; users can view their own profile regardless of visibility
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.player_profiles
FOR SELECT 
USING (
    profile_visibility = 'public' 
    OR auth.uid() = user_id
);

-- Policy 2: Authenticated users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.player_profiles
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
);

-- Policy 3: Users can update only their own profile
CREATE POLICY "Users can update their own profile" 
ON public.player_profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete only their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.player_profiles
FOR DELETE 
USING (auth.uid() = user_id);


-- B. player_preferences RLS
ALTER TABLE public.player_preferences ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view only their own preferences
CREATE POLICY "Users can view their own preferences" 
ON public.player_preferences
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences" 
ON public.player_preferences
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own preferences
CREATE POLICY "Users can update their own preferences" 
ON public.player_preferences
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own preferences
CREATE POLICY "Users can delete their own preferences" 
ON public.player_preferences
FOR DELETE 
USING (auth.uid() = user_id);


-- C. player_activities RLS
ALTER TABLE public.player_activities ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view only their own activity logs
CREATE POLICY "Users can view their own activities" 
ON public.player_activities
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own activity records
CREATE POLICY "Users can insert their own activities" 
ON public.player_activities
FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 6. AUTOMATIC PROFILE INITIALIZATION TRIGGER
-- When a user registers via Supabase Auth, automatically initialize profile & preferences
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_player()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
    new_display_name TEXT;
BEGIN
    new_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'Player_' || substr(NEW.id::text, 1, 8)
    );
    new_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        new_username
    );

    -- Insert Profile
    INSERT INTO public.player_profiles (
        user_id,
        username,
        display_name,
        preferred_platform,
        profile_visibility
    ) VALUES (
        NEW.id,
        new_username,
        new_display_name,
        'PC',
        'public'
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Insert Preferences
    INSERT INTO public.player_preferences (
        user_id,
        preferred_country,
        preferred_currency,
        preferred_platform
    ) VALUES (
        NEW.id,
        'USA',
        'USD',
        'PC'
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Log Activity
    INSERT INTO public.player_activities (
        user_id,
        activity_type,
        description
    ) VALUES (
        NEW.id,
        'account_registered',
        'Player account registered via Supabase Auth.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_player();


-- ==============================================================================
-- 7. SUPABASE STORAGE BUCKET & POLICIES (AVATARS)
-- ==============================================================================

-- Create 'avatars' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy 1: Anyone can view avatars (public read)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Storage Policy 2: Authenticated users can upload to avatars
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy 3: Users can update their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy 4: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
