-- Stay folio ledger: room + F&B + payments per booking (separate from guest_profiles loyalty)

DO $$ BEGIN
  CREATE TYPE booking_charge_type AS ENUM ('room', 'fnb', 'tax', 'adjustment', 'payment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_charge_status AS ENUM ('open', 'settled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS booking_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  charge_type booking_charge_type NOT NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  currency varchar(3) DEFAULT 'NAD',
  status booking_charge_status NOT NULL DEFAULT 'open',
  reference_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  settled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_booking_charges_booking_id ON booking_charges(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_charges_status ON booking_charges(status);
CREATE INDEX IF NOT EXISTS idx_booking_charges_type ON booking_charges(charge_type);
CREATE INDEX IF NOT EXISTS idx_booking_charges_tenant_id ON booking_charges(tenant_id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS folio_closed_at timestamptz;
