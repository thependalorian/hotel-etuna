-- Intelligent OS — approval-gated recommendations (rate + reorder).
-- Forecasting produces SUGGESTIONS only; an admin/front-desk user must approve before
-- anything changes (room base_rate, or a purchase order). Nothing is ever auto-applied.
-- Forward-idempotent: CREATE TABLE / INDEX IF NOT EXISTS only.

-- Rate recommendations: one row per room type per generation run.
CREATE TABLE IF NOT EXISTS rate_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  room_type varchar(100) NOT NULL,
  current_rate numeric(10,2) NOT NULL DEFAULT 0,
  recommended_rate numeric(10,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'NAD',
  forecast_occupancy numeric(5,2),               -- predicted occupancy % for the horizon
  horizon_days integer NOT NULL DEFAULT 30,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,     -- raw forecast inputs (pickup, lead-time, baseline)
  rationale text,                                  -- human-readable "why" (heuristic + AI)
  status varchar(20) NOT NULL DEFAULT 'pending',   -- pending | approved | rejected | superseded
  generated_at timestamptz DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  decision_note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_recommendations_tenant_status
  ON rate_recommendations (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rate_recommendations_property
  ON rate_recommendations (property_id);

-- Reorder recommendations: one row per low-stock inventory item per generation run.
CREATE TABLE IF NOT EXISTS reorder_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  quantity_on_hand numeric(12,3) NOT NULL DEFAULT 0,
  reorder_point numeric(12,3) NOT NULL DEFAULT 0,
  recommended_quantity numeric(12,3) NOT NULL DEFAULT 0,
  rationale text,
  status varchar(20) NOT NULL DEFAULT 'pending',   -- pending | approved | rejected | superseded
  generated_at timestamptz DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  decision_note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_tenant_status
  ON reorder_recommendations (tenant_id, status);
-- One open recommendation per item at a time (re-generation supersedes the prior open row).
CREATE UNIQUE INDEX IF NOT EXISTS idx_reorder_recommendations_item_pending
  ON reorder_recommendations (inventory_item_id)
  WHERE status = 'pending';
