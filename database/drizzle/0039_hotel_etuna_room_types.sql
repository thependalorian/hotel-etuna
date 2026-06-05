-- Canonical Hotel Etuna room types: Standard (A/B/C), Executive Room, Premiere Room
-- Maps legacy seed rows ET-101 … ET-501 by room_number; safe to re-run (idempotent labels).

UPDATE rooms
SET
  room_type = 'Standard Room (Type A)',
  max_occupancy = 2,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'],
  updated_at = NOW()
WHERE room_number = 'ET-101'
   OR room_type IN ('Standard Room', 'Standard Room — Type A', 'Standard Room - Type A');

UPDATE rooms
SET
  room_type = 'Standard Room (Type B)',
  max_occupancy = 2,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'],
  updated_at = NOW()
WHERE room_number = 'ET-201'
   OR room_type IN ('Luxury Room', 'Standard Room (Type B)', 'Standard Room — Type B');

UPDATE rooms
SET
  room_type = 'Standard Room (Type C)',
  max_occupancy = 3,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed', 'Single bed'],
  updated_at = NOW()
WHERE room_number = 'ET-301'
   OR room_type IN ('Family Room', 'Standard Room (Type C)', 'Standard Room — Type C');

UPDATE rooms
SET
  room_type = 'Executive Room',
  max_occupancy = 2,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Work Desk', 'VIP Toiletries', 'Lounge Access'],
  updated_at = NOW()
WHERE room_number = 'ET-401'
   OR room_type IN ('Executive Suite', 'Executive Room');

UPDATE rooms
SET
  room_type = 'Premiere Room',
  max_occupancy = 4,
  amenities = ARRAY[
    'WiFi', 'Aircon', 'TV', 'Mini fridge', 'Minibar', 'Coffee/Tea', 'Mosquito Net',
    'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'
  ],
  updated_at = NOW()
WHERE room_number = 'ET-501'
   OR room_type IN ('Premier Room', 'Premiere Room', 'Premiere Room');

-- Align guest preference labels where legacy names were stored
UPDATE guest_profiles
SET preferred_room_type = 'Standard Room (Type A)', updated_at = NOW()
WHERE preferred_room_type = 'Standard Room';

UPDATE guest_profiles
SET preferred_room_type = 'Standard Room (Type B)', updated_at = NOW()
WHERE preferred_room_type = 'Luxury Room';

UPDATE guest_profiles
SET preferred_room_type = 'Standard Room (Type C)', updated_at = NOW()
WHERE preferred_room_type = 'Family Room';

UPDATE guest_profiles
SET preferred_room_type = 'Executive Room', updated_at = NOW()
WHERE preferred_room_type IN ('Executive Suite', 'Executive Room');

UPDATE guest_profiles
SET preferred_room_type = 'Premiere Room', updated_at = NOW()
WHERE preferred_room_type IN ('Premier Room', 'Premiere Room');
