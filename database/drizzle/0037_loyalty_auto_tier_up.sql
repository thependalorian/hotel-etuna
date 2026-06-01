-- Auto tier-up function and trigger

-- Function to check and update guest tier based on current points
CREATE OR REPLACE FUNCTION check_and_update_guest_tier()
RETURNS TRIGGER AS $$
DECLARE
  current_points INTEGER;
  new_tier_name VARCHAR(50);
  new_tier_order INTEGER;
BEGIN
  -- Get the guest's current total points from guest_profiles
  SELECT loyalty_points INTO current_points
  FROM guest_profiles
  WHERE id = NEW.guest_profile_id
    AND tenant_id = NEW.tenant_id;
  
  -- Find the highest tier the guest qualifies for
  SELECT lt.tier_name, lt.tier_order
  INTO new_tier_name, new_tier_order
  FROM loyalty_tiers lt
  WHERE lt.tenant_id = NEW.tenant_id
    AND lt.points_threshold <= current_points
  ORDER BY lt.tier_order DESC
  LIMIT 1;
  
  -- Update guest profile if tier changed
  IF new_tier_name IS NOT NULL THEN
    UPDATE guest_profiles
    SET loyalty_tier = new_tier_name,
        updated_at = NOW()
    WHERE id = NEW.guest_profile_id
      AND tenant_id = NEW.tenant_id
      AND loyalty_tier != new_tier_name;
    
    -- Log tier promotion if it happened
    IF FOUND THEN
      RAISE NOTICE 'Guest % promoted to % tier', NEW.guest_id, new_tier_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on loyalty_transactions to auto-upgrade tier after points change
CREATE TRIGGER trigger_auto_tier_up
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type IN ('earn', 'adjustment'))
  EXECUTE FUNCTION check_and_update_guest_tier();

-- Helper function to calculate tier eligibility (for UI/API use)
CREATE OR REPLACE FUNCTION get_guest_tier_info(
  p_tenant_id UUID,
  p_guest_profile_id UUID
)
RETURNS TABLE (
  current_tier VARCHAR(50),
  current_points INTEGER,
  next_tier VARCHAR(50),
  points_to_next_tier INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH guest_info AS (
    SELECT loyalty_tier, loyalty_points
    FROM guest_profiles
    WHERE id = p_guest_profile_id
      AND tenant_id = p_tenant_id
  ),
  current_tier_info AS (
    SELECT tier_name, tier_order, points_threshold
    FROM loyalty_tiers
    WHERE tenant_id = p_tenant_id
      AND tier_name = (SELECT loyalty_tier FROM guest_info)
  ),
  next_tier_info AS (
    SELECT tier_name, points_threshold
    FROM loyalty_tiers
    WHERE tenant_id = p_tenant_id
      AND tier_order = (SELECT tier_order + 1 FROM current_tier_info)
  )
  SELECT
    gi.loyalty_tier,
    gi.loyalty_points,
    nti.tier_name,
    GREATEST(0, COALESCE(nti.points_threshold, 0) - gi.loyalty_points)
  FROM guest_info gi
  CROSS JOIN current_tier_info cti
  LEFT JOIN next_tier_info nti ON true;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on loyalty_tiers and loyalty_tier_benefits
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tier_benefits ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY loyalty_tiers_tenant_isolation
  ON loyalty_tiers
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY loyalty_tier_benefits_tenant_isolation
  ON loyalty_tier_benefits
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
