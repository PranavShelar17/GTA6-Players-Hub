-- ==============================================================================
-- GTA 6 PLAYER HUB - PHASE 8 SUPABASE PC COMPATIBILITY SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. PC HARDWARE PROFILES
CREATE TABLE IF NOT EXISTS public.pc_hardware_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name VARCHAR(100) NOT NULL DEFAULT 'My Gaming Rig',
    cpu_manufacturer VARCHAR(50) NOT NULL,
    cpu_model VARCHAR(150) NOT NULL,
    cpu_cores INT NULL,
    cpu_threads INT NULL,
    gpu_manufacturer VARCHAR(50) NOT NULL,
    gpu_model VARCHAR(150) NOT NULL,
    gpu_vram_gb NUMERIC(5, 1) NOT NULL,
    gpu_type VARCHAR(20) NOT NULL DEFAULT 'DEDICATED',
    ram_gb INT NOT NULL,
    ram_type VARCHAR(20) NULL,
    storage_type VARCHAR(20) NOT NULL DEFAULT 'NVME_SSD',
    storage_capacity_gb INT NULL,
    storage_free_gb INT NOT NULL,
    operating_system VARCHAR(50) NOT NULL DEFAULT 'Windows 11',
    os_architecture VARCHAR(20) NOT NULL DEFAULT '64-bit',
    directx_version VARCHAR(20) NULL DEFAULT 'DirectX 12',
    display_resolution VARCHAR(30) NOT NULL DEFAULT '1920x1080',
    refresh_rate INT NULL DEFAULT 60,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pc_profiles_user ON public.pc_hardware_profiles(user_id, created_at DESC);

ALTER TABLE public.pc_hardware_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own PC hardware profiles"
    ON public.pc_hardware_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. GAME SYSTEM REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.game_system_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_name VARCHAR(100) NOT NULL DEFAULT 'Grand Theft Auto VI',
    platform VARCHAR(30) NOT NULL DEFAULT 'PC',
    requirement_category VARCHAR(30) NOT NULL, -- MINIMUM, RECOMMENDED, ULTRA
    cpu_requirement VARCHAR(255) NULL,
    cpu_min_cores INT NULL,
    gpu_requirement VARCHAR(255) NULL,
    vram_requirement_gb NUMERIC(5, 1) NULL,
    ram_requirement_gb INT NULL,
    storage_requirement_gb INT NULL,
    storage_type_requirement VARCHAR(50) NULL DEFAULT 'SSD Required',
    operating_system_requirement VARCHAR(100) NULL,
    directx_requirement VARCHAR(50) NULL DEFAULT 'DirectX 12',
    source_url VARCHAR(1024) NULL,
    source_name VARCHAR(100) NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'UNCONFIRMED', -- OFFICIAL, VERIFIED, UNCONFIRMED
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NULL,
    published_at TIMESTAMPTZ NULL,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_game_reqs_active ON public.game_system_requirements(verification_status, is_active);

ALTER TABLE public.game_system_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to game system requirements"
    ON public.game_system_requirements
    FOR SELECT
    USING (true);

-- 3. PC COMPATIBILITY CHECKS
CREATE TABLE IF NOT EXISTS public.pc_compatibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hardware_profile_id UUID NULL REFERENCES public.pc_hardware_profiles(id) ON DELETE SET NULL,
    requirements_version_id UUID NULL REFERENCES public.game_system_requirements(id) ON DELETE SET NULL,
    result_status VARCHAR(50) NOT NULL DEFAULT 'REQUIREMENTS_UNAVAILABLE',
    component_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    hardware_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    bottleneck_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    upgrade_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    analysis_summary TEXT NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_compat_checks_user ON public.pc_compatibility_checks(user_id, checked_at DESC);

ALTER TABLE public.pc_compatibility_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own compatibility check history"
    ON public.pc_compatibility_checks
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create compatibility checks"
    ON public.pc_compatibility_checks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
