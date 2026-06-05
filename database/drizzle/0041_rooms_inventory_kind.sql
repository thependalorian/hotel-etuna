-- 0041: inventory_kind + pricing_metadata on rooms; facility rows

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS inventory_kind varchar(32) NOT NULL DEFAULT 'guest_room';

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS pricing_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN rooms.inventory_kind IS 'guest_room | conference | campsite';
COMMENT ON COLUMN rooms.pricing_metadata IS 'Session windows, per-person campsite rates, etc.';

UPDATE rooms r
SET inventory_kind = 'guest_room', pricing_metadata = '{}'::jsonb
FROM properties p
WHERE r.property_id = p.id
  AND p.slug = 'hotel-etuna'
  AND r.room_number NOT IN ('CONFERENCE-HALL', 'CAMPSITE');

INSERT INTO rooms (
  property_id,
  room_number,
  room_type,
  max_occupancy,
  base_rate,
  currency,
  amenities,
  status,
  inventory_kind,
  pricing_metadata
)
SELECT
  p.id,
  'CONFERENCE-HALL',
  'Conference Hall / Facilities',
  200,
  1200.00,
  'NAD',
  ARRAY['Projector', 'Sound System', 'WiFi', 'Catering space', 'Parking'],
  'available',
  'conference',
  '{"sessionStart":"08:00","sessionEnd":"17:00","pricePerSession":1200,"currency":"NAD"}'::jsonb
FROM properties p
WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  inventory_kind = 'conference',
  pricing_metadata = EXCLUDED.pricing_metadata,
  status = 'available',
  updated_at = NOW();

INSERT INTO rooms (
  property_id,
  room_number,
  room_type,
  max_occupancy,
  base_rate,
  currency,
  amenities,
  status,
  inventory_kind,
  pricing_metadata
)
SELECT
  p.id,
  'CAMPSITE',
  'Campsite',
  50,
  1200.00,
  'NAD',
  ARRAY['Whole-site hire', 'Braai area', 'Ablutions', 'Parking'],
  'available',
  'campsite',
  '{"namibianPp":250,"nonNamibianPp":400,"siteMinimum":1200,"prorateFromMinimum":true,"currency":"NAD"}'::jsonb
FROM properties p
WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  inventory_kind = 'campsite',
  pricing_metadata = EXCLUDED.pricing_metadata,
  status = 'available',
  updated_at = NOW();
