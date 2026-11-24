-- ==============================================================================
-- GTA 6 PLAYER HUB: PHASE 10 - AUTOMATED DATA & BACKGROUND SERVICES
-- Supabase PostgreSQL Schema with Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. Automation Job Logs
CREATE TABLE IF NOT EXISTS public.automation_job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(128) NOT NULL,
    task_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_job_task_name ON public.automation_job_logs (task_name);
CREATE INDEX IF NOT EXISTS idx_automation_job_task_id ON public.automation_job_logs (task_id);
CREATE INDEX IF NOT EXISTS idx_automation_job_status ON public.automation_job_logs (status);
CREATE INDEX IF NOT EXISTS idx_automation_job_created ON public.automation_job_logs (created_at);

-- 2. Data Source Status
CREATE TABLE IF NOT EXISTS public.data_source_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(128) NOT NULL UNIQUE,
    source_type VARCHAR(64) NOT NULL,
    source_url VARCHAR(512),
    last_attempted_at TIMESTAMPTZ,
    last_successful_at TIMESTAMPTZ,
    last_error TEXT,
    health_status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_source_name ON public.data_source_status (source_name);
CREATE INDEX IF NOT EXISTS idx_data_source_type ON public.data_source_status (source_type);
CREATE INDEX IF NOT EXISTS idx_data_source_health ON public.data_source_status (health_status);

-- 3. Data Ingestion Logs
CREATE TABLE IF NOT EXISTS public.data_ingestion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(128),
    data_category VARCHAR(64) NOT NULL,
    records_retrieved INT NOT NULL DEFAULT 0,
    records_created INT NOT NULL DEFAULT 0,
    records_updated INT NOT NULL DEFAULT 0,
    records_skipped INT NOT NULL DEFAULT 0,
    records_failed INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING'
);

CREATE INDEX IF NOT EXISTS idx_ingestion_source ON public.data_ingestion_logs (source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_category ON public.data_ingestion_logs (data_category);
CREATE INDEX IF NOT EXISTS idx_ingestion_status ON public.data_ingestion_logs (status);

-- 4. Enable RLS
ALTER TABLE public.automation_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_ingestion_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Only service role can write; authenticated users / monitors can read
CREATE POLICY "Service role full access on automation_job_logs"
    ON public.automation_job_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on data_source_status"
    ON public.data_source_status FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on data_ingestion_logs"
    ON public.data_ingestion_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
