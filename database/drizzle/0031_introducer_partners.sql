-- Introducer partners: referral codes, commission tracking, public directory
CREATE TABLE IF NOT EXISTS introducers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Partner details
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Commission configuration
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_in_public_directory BOOLEAN NOT NULL DEFAULT false,
  
  -- Public profile
  bio TEXT,
  website VARCHAR(500),
  logo_url VARCHAR(500),
  
  -- Performance tracking
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_commission_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_introducers_tenant
  ON introducers(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_introducers_code
  ON introducers(code);

CREATE INDEX IF NOT EXISTS idx_introducers_active
  ON introducers(is_active);

CREATE INDEX IF NOT EXISTS idx_introducers_public
  ON introducers(show_in_public_directory);

-- Add introducer tracking to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS introducer_id UUID REFERENCES introducers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_introducer_id
  ON bookings(introducer_id);

-- Trigger to update introducer stats when a booking is created/updated
CREATE OR REPLACE FUNCTION update_introducer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.introducer_id IS NOT NULL THEN
    -- Increment booking count and commission on new booking
    UPDATE introducers
    SET 
      total_bookings = total_bookings + 1,
      total_commission_earned = total_commission_earned + COALESCE(NEW.commission_amount, 0),
      updated_at = NOW()
    WHERE id = NEW.introducer_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.introducer_id IS NOT NULL THEN
    -- Update commission if it changed
    IF OLD.commission_amount IS DISTINCT FROM NEW.commission_amount THEN
      UPDATE introducers
      SET 
        total_commission_earned = total_commission_earned - COALESCE(OLD.commission_amount, 0) + COALESCE(NEW.commission_amount, 0),
        updated_at = NOW()
      WHERE id = NEW.introducer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.introducer_id IS NOT NULL THEN
    -- Decrement stats on booking deletion
    UPDATE introducers
    SET 
      total_bookings = GREATEST(0, total_bookings - 1),
      total_commission_earned = GREATEST(0, total_commission_earned - COALESCE(OLD.commission_amount, 0)),
      updated_at = NOW()
    WHERE id = OLD.introducer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_introducer_stats
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_introducer_stats();
