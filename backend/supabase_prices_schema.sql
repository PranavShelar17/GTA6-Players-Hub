-- Supabase PostgreSQL Schema & Row-Level Security (RLS) for Phase 5: Price & Deals Tracker

-- 1. Enable RLS on all Phase 5 tables
ALTER TABLE IF EXISTS price_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_alert_events ENABLE ROW LEVEL SECURITY;

-- 2. Public Read Policies for Catalog, Regions, Stores, and Observations
CREATE POLICY "Public read access for price_products"
    ON price_products FOR SELECT
    USING (true);

CREATE POLICY "Public read access for price_regions"
    ON price_regions FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public read access for price_stores"
    ON price_stores FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public read access for price_observations"
    ON price_observations FOR SELECT
    USING (true);

CREATE POLICY "Public read access for price_sources"
    ON price_sources FOR SELECT
    USING (is_enabled = true);

-- 3. Strict Player Ownership Policies for Wishlist
CREATE POLICY "Players can select their own wishlist items"
    ON price_wishlist FOR SELECT
    TO authenticated
    USING (auth.uid() = player_id);

CREATE POLICY "Players can insert into their own wishlist"
    ON price_wishlist FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can delete their own wishlist items"
    ON price_wishlist FOR DELETE
    TO authenticated
    USING (auth.uid() = player_id);

-- 4. Strict Player Ownership Policies for Price Alerts & Events
CREATE POLICY "Players can select their own price alerts"
    ON price_alerts FOR SELECT
    TO authenticated
    USING (auth.uid() = player_id);

CREATE POLICY "Players can insert their own price alerts"
    ON price_alerts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own price alerts"
    ON price_alerts FOR UPDATE
    TO authenticated
    USING (auth.uid() = player_id)
    WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can delete their own price alerts"
    ON price_alerts FOR DELETE
    TO authenticated
    USING (auth.uid() = player_id);

CREATE POLICY "Players can select events for their own alerts"
    ON price_alert_events FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM price_alerts
        WHERE price_alerts.id = price_alert_events.alert_id
          AND price_alerts.player_id = auth.uid()
    ));
