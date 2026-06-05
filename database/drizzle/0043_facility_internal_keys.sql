-- 0043: Facilities are singular (one conference hall, one campsite).
-- room_number is an internal DB key only — not a guest room number.

UPDATE rooms r
SET room_number = 'facility:conference', updated_at = NOW()
FROM properties p
WHERE r.property_id = p.id
  AND p.slug = 'hotel-etuna'
  AND r.inventory_kind = 'conference'
  AND r.room_number <> 'facility:conference';

UPDATE rooms r
SET room_number = 'facility:campsite', updated_at = NOW()
FROM properties p
WHERE r.property_id = p.id
  AND p.slug = 'hotel-etuna'
  AND r.inventory_kind = 'campsite'
  AND r.room_number <> 'facility:campsite';
