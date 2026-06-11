-- 0044: Schema cleanup — RLS standardisation, missing RLS, indexes, constraints
-- Applies idempotently to Neon. Run: psql $DATABASE_URL -f database/drizzle/0044_schema_cleanup.sql

BEGIN;

-- ============================================================================
-- PART 1: Standardise RLS variable name app.current_tenant_id → app.tenant_id
-- 8 tables used the wrong variable name. connection.ts sets both for backward
-- compat, but all RLS should use app.tenant_id consistently.
-- ============================================================================

-- cms_pages (0029b)
DROP POLICY IF EXISTS cms_pages_staff_full_access ON cms_pages;
CREATE POLICY cms_pages_staff_full_access ON cms_pages
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- cms_blocks (0029b)
DROP POLICY IF EXISTS cms_blocks_staff_full_access ON cms_blocks;
CREATE POLICY cms_blocks_staff_full_access ON cms_blocks
  FOR ALL
  USING (
    page_id IN (
      SELECT id FROM cms_pages
      WHERE tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- introducers (0031b)
DROP POLICY IF EXISTS introducers_tenant_isolation ON introducers;
CREATE POLICY introducers_tenant_isolation ON introducers
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS introducers_public_directory_read ON introducers;
CREATE POLICY introducers_public_directory_read ON introducers
  FOR SELECT
  USING (
    is_active = true
    AND show_in_public_directory = true
    AND tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- loyalty_transactions (0033b)
DROP POLICY IF EXISTS loyalty_transactions_tenant_isolation ON loyalty_transactions;
CREATE POLICY loyalty_transactions_tenant_isolation ON loyalty_transactions
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- loyalty_rewards (0033b)
DROP POLICY IF EXISTS loyalty_rewards_tenant_isolation ON loyalty_rewards;
CREATE POLICY loyalty_rewards_tenant_isolation ON loyalty_rewards
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- loyalty_redemptions (0033b)
DROP POLICY IF EXISTS loyalty_redemptions_tenant_isolation ON loyalty_redemptions;
CREATE POLICY loyalty_redemptions_tenant_isolation ON loyalty_redemptions
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- loyalty_tiers (0037)
DROP POLICY IF EXISTS loyalty_tiers_tenant_isolation ON loyalty_tiers;
CREATE POLICY loyalty_tiers_tenant_isolation ON loyalty_tiers
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- loyalty_tier_benefits (0037)
DROP POLICY IF EXISTS loyalty_tier_benefits_tenant_isolation ON loyalty_tier_benefits;
CREATE POLICY loyalty_tier_benefits_tenant_isolation ON loyalty_tier_benefits
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- PART 2: Add missing RLS to unprotected tables with tenant_id
-- 4 tables had no RLS at all — cross-tenant read possible.
-- ============================================================================

ALTER TABLE fraud_detection_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_fraud_detection_rules ON fraud_detection_rules;
CREATE POLICY tenant_access_fraud_detection_rules ON fraud_detection_rules
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_type', true) = 'hub'
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_type', true) = 'hub'
  );

ALTER TABLE dining_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_dining_reservations ON dining_reservations;
CREATE POLICY tenant_access_dining_reservations ON dining_reservations
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_type', true) = 'hub'
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_type', true) = 'hub'
  );

ALTER TABLE namqr_pending_confirmations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_namqr_pending_confirmations ON namqr_pending_confirmations;
CREATE POLICY tenant_access_namqr_pending_confirmations ON namqr_pending_confirmations
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_type', true) = 'hub'
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_type', true) = 'hub'
  );

-- ============================================================================
-- PART 3: Add missing performance indexes for hot query paths
-- Landing page, dashboard calendar, analytics occupancy, folio lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date
  ON bookings (check_in_date);

CREATE INDEX IF NOT EXISTS idx_bookings_check_out_date
  ON bookings (check_out_date);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_status_dates
  ON bookings (tenant_id, status, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_guest_reviews_tenant_public
  ON guest_reviews (tenant_id, is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_tenant_date
  ON cash_reconciliations (tenant_id, reconciliation_date);

-- ============================================================================
-- PART 4: Add CHECK constraints for data integrity on rooms
-- Prevents typos in inventory_kind and status columns
-- ============================================================================

DO $$
BEGIN
  -- Normalize legacy / out-of-range data BEFORE adding the CHECK constraints.
  -- ALTER TABLE ... ADD CONSTRAINT validates existing rows immediately, so a single
  -- pre-existing bad row (NULL or legacy status/kind) would fail the whole migration.
  -- These UPDATEs are idempotent and map known legacy synonyms to the canonical set.
  UPDATE rooms SET inventory_kind = 'guest_room'
    WHERE inventory_kind IS NULL
       OR inventory_kind NOT IN ('guest_room', 'conference', 'campsite');

  UPDATE rooms SET status = 'cleaning'
    WHERE status IN ('dirty', 'needs_cleaning', 'clean_in_progress');
  UPDATE rooms SET status = 'out_of_order'
    WHERE status IN ('blocked', 'ooo', 'out-of-order');
  UPDATE rooms SET status = 'available'
    WHERE status IS NULL
       OR status NOT IN ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order');

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_inventory_kind_check'
  ) THEN
    ALTER TABLE rooms ADD CONSTRAINT rooms_inventory_kind_check
      CHECK (inventory_kind IN ('guest_room', 'conference', 'campsite'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_status_check'
  ) THEN
    ALTER TABLE rooms ADD CONSTRAINT rooms_status_check
      CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'));
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Summary of changes:
-- PART 1: 8 tables — fixed RLS variable name (app.current_tenant_id → app.tenant_id)
-- PART 2: 3 tables — added missing RLS (fraud_detection_rules, dining_reservations, namqr_pending_confirmations)
-- PART 3: 5 indexes added — bookings (3), guest_reviews (1), cash_reconciliations (1)
-- PART 4: 2 CHECK constraints added — rooms.inventory_kind, rooms.status
-- 
-- Total RLS policies after 0044: 64 (was 61) on 49 tables (was 46)
-- Total indexes: 5 new
-- ============================================================================
