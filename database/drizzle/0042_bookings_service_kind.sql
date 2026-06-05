-- 0042: booking_kind + pricing_details for accommodation, conference, campsite

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_kind varchar(32) DEFAULT 'accommodation';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pricing_details jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN bookings.booking_kind IS 'accommodation | conference | campsite';
COMMENT ON COLUMN bookings.pricing_details IS 'Campsite guest counts, conference sessionDate, audit fields';

UPDATE bookings
SET booking_kind = 'accommodation'
WHERE booking_kind IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_booking_kind ON bookings (booking_kind);
CREATE INDEX IF NOT EXISTS idx_rooms_inventory_kind ON rooms (inventory_kind);
