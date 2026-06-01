-- Loyalty tier-specific benefits/perks
CREATE TABLE IF NOT EXISTS loyalty_tier_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
  
  -- Benefit details
  benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN (
    'points_multiplier',
    'room_upgrade',
    'late_checkout',
    'early_checkin',
    'complimentary_breakfast',
    'priority_support',
    'free_wifi_upgrade',
    'minibar_credit',
    'spa_discount',
    'restaurant_discount',
    'birthday_reward',
    'anniversary_reward'
  )),
  
  benefit_name VARCHAR(255) NOT NULL,
  benefit_description TEXT,
  benefit_value VARCHAR(100),  -- e.g. "25%", "1 hour", "complimentary"
  
  -- Activation
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tier_benefits_tier
  ON loyalty_tier_benefits(tier_id, active);

CREATE INDEX IF NOT EXISTS idx_tier_benefits_tenant
  ON loyalty_tier_benefits(tenant_id, tier_id);

-- Seed default benefits for each tier
-- Bronze tier benefits
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  'points_multiplier',
  'Base Points Earning',
  'Earn 1 point for every N$10 spent on room and dining',
  '1.0x'
FROM loyalty_tiers lt
WHERE lt.tier_name = 'bronze'
ON CONFLICT DO NOTHING;

-- Silver tier benefits
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  benefit_type,
  benefit_name,
  benefit_description,
  benefit_value
FROM loyalty_tiers lt
CROSS JOIN (VALUES
  ('points_multiplier', 'Bonus Points Earning', 'Earn 10% bonus points on all stays', '1.1x'),
  ('priority_support', 'Priority Support', 'Priority response for booking inquiries and requests', 'enabled'),
  ('late_checkout', 'Late Checkout', 'Late checkout subject to availability', '12:00 PM')
) AS benefits(benefit_type, benefit_name, benefit_description, benefit_value)
WHERE lt.tier_name = 'silver'
ON CONFLICT DO NOTHING;

-- Gold tier benefits
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  benefit_type,
  benefit_name,
  benefit_description,
  benefit_value
FROM loyalty_tiers lt
CROSS JOIN (VALUES
  ('points_multiplier', 'Enhanced Points Earning', 'Earn 25% bonus points on all stays', '1.25x'),
  ('room_upgrade', 'Room Upgrade', 'Complimentary room upgrade subject to availability', 'one_category'),
  ('late_checkout', 'Extended Late Checkout', 'Late checkout until 2:00 PM subject to availability', '2:00 PM'),
  ('early_checkin', 'Early Check-in', 'Early check-in from 12:00 PM subject to availability', '12:00 PM'),
  ('priority_support', 'Premium Support', 'Dedicated support line and priority service', 'enabled'),
  ('restaurant_discount', 'Dining Discount', '10% discount on restaurant dining', '10%')
) AS benefits(benefit_type, benefit_name, benefit_description, benefit_value)
WHERE lt.tier_name = 'gold'
ON CONFLICT DO NOTHING;

-- Platinum tier benefits  
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  benefit_type,
  benefit_name,
  benefit_description,
  benefit_value
FROM loyalty_tiers lt
CROSS JOIN (VALUES
  ('points_multiplier', 'Premium Points Earning', 'Earn 50% bonus points on all stays', '1.5x'),
  ('room_upgrade', 'Suite Upgrade', 'Complimentary suite upgrade subject to availability', 'suite'),
  ('complimentary_breakfast', 'Complimentary Breakfast', 'Free breakfast for two daily', 'two_guests'),
  ('late_checkout', 'Guaranteed Late Checkout', 'Guaranteed late checkout until 3:00 PM', '3:00 PM'),
  ('early_checkin', 'Guaranteed Early Check-in', 'Guaranteed early check-in from 11:00 AM', '11:00 AM'),
  ('priority_support', 'Concierge Service', 'Personal concierge and 24/7 priority assistance', 'enabled'),
  ('restaurant_discount', 'VIP Dining Discount', '15% discount on restaurant dining', '15%'),
  ('minibar_credit', 'Minibar Credit', 'N$200 minibar credit per stay', 'N$200'),
  ('birthday_reward', 'Birthday Bonus', 'Special birthday gift and bonus points', '500_points'),
  ('anniversary_reward', 'Anniversary Bonus', 'Anniversary stay bonus and upgrade', '1000_points')
) AS benefits(benefit_type, benefit_name, benefit_description, benefit_value)
WHERE lt.tier_name = 'platinum'
ON CONFLICT DO NOTHING;
