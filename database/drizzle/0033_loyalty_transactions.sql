-- Loyalty transactions ledger: earn/burn events append-only log
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  guest_profile_id UUID REFERENCES guest_profiles(id) ON DELETE SET NULL,
  
  -- Transaction details
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'burn', 'adjustment', 'tier_bonus')),
  points_delta INTEGER NOT NULL,  -- positive for earn, negative for burn
  
  -- Balance tracking
  points_before INTEGER NOT NULL DEFAULT 0,
  points_after INTEGER NOT NULL,
  
  -- Context
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reward_id UUID,  -- references loyalty_rewards (created in next migration)
  description TEXT NOT NULL,
  
  -- Metadata
  staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_tenant_guest
  ON loyalty_transactions(tenant_id, guest_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_guest_created
  ON loyalty_transactions(guest_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_type_created
  ON loyalty_transactions(transaction_type, created_at DESC);

-- Loyalty rewards catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Reward details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  value_nad NUMERIC(12, 2),  -- equivalent value in NAD
  
  -- Availability
  available BOOLEAN NOT NULL DEFAULT true,
  max_redemptions_per_guest INTEGER,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  -- Tier restrictions (null = available to all)
  min_tier VARCHAR(50) CHECK (min_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_tenant_available
  ON loyalty_rewards(tenant_id, available);

-- Track redemptions
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES loyalty_transactions(id) ON DELETE CASCADE,
  
  -- Redemption details
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  
  -- Fulfillment
  fulfilled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_guest
  ON loyalty_redemptions(guest_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_status
  ON loyalty_redemptions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_tenant
  ON loyalty_redemptions(tenant_id, created_at DESC);
