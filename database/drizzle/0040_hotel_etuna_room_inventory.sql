-- 0040: Hotel Etuna 35 guest rooms (generated from inventory module)

UPDATE rooms r SET status = 'out_of_order', updated_at = NOW()
FROM properties p
WHERE r.property_id = p.id AND p.slug = 'hotel-etuna' AND r.room_number LIKE 'ET-%';

INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '5', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '6', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '8', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '17', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '19', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '21', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '7', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '9', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '10', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '11', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '12', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '13', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '14', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '15', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '16', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '18', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '20', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '2', 'Standard Room (Type C)', 3, 1200.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed and single bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '3', 'Standard Room (Type C)', 3, 1200.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed and single bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '4', 'Standard Room (Type C)', 3, 1200.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed and single bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '22', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E1', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E2', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E3', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E4', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E5', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E6', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E8', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E9', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E10', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E11', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E12', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E13', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E7', 'Premiere Room', 4, 2000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Premiere layout', 'Mini fridge', 'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E14', 'Premiere Room', 4, 2000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Premiere layout', 'Mini fridge', 'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
