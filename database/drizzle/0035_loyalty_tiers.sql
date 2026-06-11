-- Loyalty tier definitions and thresholds (hub tenants only — loyalty is hub-exclusive)
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tier details
  tier_name VARCHAR(50) NOT NULL CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_order INTEGER NOT NULL,  -- 1=bronze, 2=silver, 3=gold, 4=platinum
  
  -- Thresholds
  points_threshold INTEGER NOT NULL DEFAULT 0,  -- minimum points to reach this tier
  
  -- Benefits summary
  earn_rate_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,  -- e.g. 1.25 = 25% bonus
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, tier_name),
  UNIQUE(tenant_id, tier_order)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_tenant
  ON loyalty_tiers(tenant_id, tier_order);

-- Seed default tier thresholds for hub tenants only (loyalty is hub-exclusive per HOTEL_ETUNA_OS.md)
-- Partners do not get loyalty features.
DO $$
DECLARE
  tenant_rec RECORD;
BEGIN
  FOR tenant_rec IN SELECT id FROM tenants WHERE type = 'hub' LOOP
    -- Bronze tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'bronze',
      1,
      0,
      1.00,
      'Entry level - Earn 1 point per N$10 spent'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
    
    -- Silver tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'silver',
      2,
      500,
      1.10,
      'Silver tier - Earn 10% bonus points + priority support'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
    
    -- Gold tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'gold',
      3,
      1500,
      1.25,
      'Gold tier - Earn 25% bonus points + room upgrades + late checkout'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
    
    -- Platinum tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'platinum',
      4,
      5000,
      1.50,
      'Platinum tier - Earn 50% bonus points + complimentary breakfast + suite upgrades'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
  END LOOP;
END $$;
