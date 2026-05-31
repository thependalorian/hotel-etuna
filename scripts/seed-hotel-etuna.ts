/**
 * Hotel Etuna operator seed script
 *
 * Purpose: Populate the single operator tenant with complete operational data
 * Location: scripts/seed-hotel-etuna.ts
 *
 * Includes:
 * - Operator tenant
 * - Property details
 * - 5 room types with rates
 * - Restaurant with menu
 * - Admin user
 * 
 * Usage:
 *   npx tsx scripts/seed-hotel-etuna.ts          # Seed all data
 *   npx tsx scripts/seed-hotel-etuna.ts --dry    # Dry run
 *   npx tsx scripts/seed-hotel-etuna.ts --force  # Force re-seed
 */

import { neon } from '@neondatabase/serverless';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { ETUNA_MENU_CATEGORIES, ETUNA_MENU_ITEMS } from '../lib/data/etuna-restaurant-menu-catalog';
import { getMenuItemImageUrlForSeed } from '../lib/data/menu-item-image-urls';
import { getRestaurantOpeningHoursJson } from '../lib/dining/restaurant-hours';
import { buildInventorySeedFromCatalog } from '../lib/data/etuna-inventory-seed';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const isForce = args.includes('--force');

// Tenant/property IDs from env (UUID). Legacy HUB_TENANT_ID / DEFAULT_PROPERTY_ID still accepted.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const configuredTenantId =
  process.env.ETUNA_TENANT_ID?.trim() ||
  process.env.HUB_TENANT_ID?.trim() ||
  '';
const configuredPropertyId =
  process.env.ETUNA_PROPERTY_ID?.trim() ||
  process.env.DEFAULT_PROPERTY_ID?.trim() ||
  '';
let ETUNA_TENANT_ID = UUID_REGEX.test(configuredTenantId) ? configuredTenantId : randomUUID();
let PROPERTY_ID = UUID_REGEX.test(configuredPropertyId) ? configuredPropertyId : randomUUID();

// Password for admin user
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD not found in environment. Please set it before running the seed script.');
  process.exit(1);
}
const PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// ============================================================================
// HOTEL ETUNA DATA
// ============================================================================

const ETUNA_TENANT = {
  id: ETUNA_TENANT_ID,
  name: 'Hotel Etuna',
  type: 'operator',
  status: 'active',
  subscriptionTier: 'enterprise',
  subscriptionStatus: 'active',
  hasRestaurantFeatures: true,
  isEnterprise: true,
};

async function resolvePropertyId(tenantId: string): Promise<string> {
  if (UUID_REGEX.test(configuredPropertyId)) {
    return configuredPropertyId;
  }

  const existing = await sql`
    SELECT id FROM properties
    WHERE tenant_id = ${tenantId}::uuid AND slug = 'hotel-etuna'
    LIMIT 1
  `;
  if (existing.length > 0) {
    return existing[0].id as string;
  }

  return PROPERTY_ID;
}

async function resolveEtunaTenantIdFromDb(): Promise<string> {
  if (UUID_REGEX.test(configuredTenantId)) {
    return configuredTenantId;
  }

  const existing = await sql`
    SELECT id FROM tenants
    WHERE type = 'operator'::tenant_type
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (existing.length > 0) {
    return existing[0].id as string;
  }

  return randomUUID();
}

const PROPERTY = {
  id: PROPERTY_ID,
  name: 'Hotel Etuna',
  slug: 'hotel-etuna',
  type: 'hotel',
  description:
    'Hotel Etuna is a premium guesthouse with hotel service in the heart of Ongwediva, Namibia. Five room types, an outdoor pool, and Etuna Restaurant — we embody our name: He takes care of us.',
  address: '5544 Valley Street, Ongwediva, Oshana Region, Namibia',
  city: 'Ongwediva',
  state: 'Oshana',
  country: 'Namibia',
  postalCode: '9000',
  starRating: 4,
  amenities: [
    'Free WiFi',
    'Outdoor pool (all year)',
    'Air conditioning',
    'Free private parking',
    'On-site restaurant & bar',
    '24-hour security',
    'Airport shuttle (paid)',
    'Braai/BBQ facilities',
    'Garden',
    'Terrace',
    'Conference rooms',
    'Laundry service',
  ],
  checkInTime: '14:00',
  checkOutTime: '11:00',
  status: 'active',
  currency: 'NAD',
  hasRestaurantFeatures: true,
};

const ROOMS = [
  {
    id: randomUUID(),
    roomNumber: 'ET-101',
    roomType: 'Standard Room',
    maxOccupancy: 2,
    baseRate: '800.00',
    description: 'Comfortable room with essential amenities, air-con, mosquito net, satellite TV, coffee/tea station, private bathroom.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk'],
    status: 'available',
  },
  {
    id: randomUUID(),
    roomNumber: 'ET-102',
    roomType: 'Standard Room',
    maxOccupancy: 2,
    baseRate: '800.00',
    description: 'Comfortable room with essential amenities, air-con, mosquito net, satellite TV, coffee/tea station, private bathroom.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk'],
    status: 'available',
  },
  {
    id: randomUUID(),
    roomNumber: 'ET-201',
    roomType: 'Executive Room',
    maxOccupancy: 2,
    baseRate: '1800.00',
    description: '26 m² business-friendly suite with work desk, premium toiletries, and VIP lounge access.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Work Desk', 'VIP Toiletries', 'Lounge Access'],
    status: 'available',
  },
  {
    id: randomUUID(),
    roomNumber: 'ET-202',
    roomType: 'Executive Room',
    maxOccupancy: 2,
    baseRate: '1800.00',
    description: '26 m² business-friendly suite with work desk, premium toiletries, and VIP lounge access.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Work Desk', 'VIP Toiletries', 'Lounge Access'],
    status: 'available',
  },
  {
    id: randomUUID(),
    roomNumber: 'ET-301',
    roomType: 'Premiere Room',
    maxOccupancy: 4,
    baseRate: '2500.00',
    description:
      'Private lounge, master bedroom, and twin room — flagship stay for up to 4 guests with mini fridge.',
    amenities: [
      'WiFi',
      'Aircon',
      'TV',
      'Mini fridge',
      'Minibar',
      'Coffee/Tea',
      'Mosquito Net',
      'Private Balcony',
      'Lounge',
      '2 Bathrooms',
      'Bathrobe',
    ],
    status: 'available',
  },
];

const RESTAURANT = {
  id: randomUUID(),
  name: 'Etuna Restaurant',
  description: 'Our on-site culinary gem serves traditional Namibian cuisine alongside international favourites. Locally sourced ingredients, buffet breakfast, and a private bar.',
  cuisineType: 'Namibian, International',
  capacity: 60,
  openingHours: getRestaurantOpeningHoursJson(),
  contactPhone: '+264 65 231 177',
  status: 'active',
};

const MENU_CATEGORIES = ETUNA_MENU_CATEGORIES.map((category) => ({
  id: randomUUID(),
  name: category.name,
  description: category.description,
  displayOrder: category.displayOrder,
}));

const MENU_ITEMS = ETUNA_MENU_ITEMS;

const ADMIN_USER = {
  id: randomUUID(),
  email: 'manager@hoteletuna.com',
  firstName: 'Etuna',
  lastName: 'Manager',
  phone: '+264 81 802 4833',
  role: 'owner',
  emailVerified: true,
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function checkExists(table: string, condition: string, value: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM ${sql(table)} 
    WHERE ${sql(condition)} = ${value}
    LIMIT 1
  `;
  return result.length > 0;
}

async function seedTenant() {
  console.log('\n🏢 Seeding operator tenant...');
  
  if (isDryRun) {
    console.log('   [DRY RUN] Would create tenant:', ETUNA_TENANT.name);
    return;
  }
  
  try {
    // Check if exists
    const exists = await sql`
      SELECT id FROM tenants WHERE id = ${ETUNA_TENANT.id}
    `;
    
    if (exists.length > 0 && !isForce) {
      console.log('   ✓ Operator tenant already exists');
      return;
    }
    
    await sql`
      INSERT INTO tenants (
        id, name, type, status, subscription_tier, subscription_status,
        has_restaurant_features, is_enterprise, created_at, updated_at
      ) VALUES (
        ${ETUNA_TENANT.id}, ${ETUNA_TENANT.name}, ${ETUNA_TENANT.type}::tenant_type,
        ${ETUNA_TENANT.status}, ${ETUNA_TENANT.subscriptionTier}, ${ETUNA_TENANT.subscriptionStatus},
        ${ETUNA_TENANT.hasRestaurantFeatures}, ${ETUNA_TENANT.isEnterprise}, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;
    
    console.log(`   ✓ Tenant created: ${ETUNA_TENANT.name}`);
  } catch (error) {
    console.error('   ❌ Error creating tenant:', error);
    throw error;
  }
}

async function seedProperty() {
  console.log('\n🏨 Seeding property...');
  
  if (isDryRun) {
    console.log('   [DRY RUN] Would create property:', PROPERTY.name);
    return;
  }
  
  try {
    // Check if exists
    const exists = await sql`
      SELECT id FROM properties WHERE slug = ${PROPERTY.slug}
    `;
    
    if (exists.length > 0 && !isForce) {
      console.log('   ✓ Property already exists');
      // Update property ID for rooms
      PROPERTY.id = exists[0].id;
      return;
    }
    
    if (exists.length > 0 && isForce) {
      PROPERTY.id = exists[0].id;
    }
    
    await sql`
      INSERT INTO properties (
        id, tenant_id, name, slug, type, description, address, city, state, country,
        postal_code, star_rating, amenities, check_in_time, check_out_time,
        status, currency, has_restaurant_features, created_at, updated_at
      ) VALUES (
        ${PROPERTY.id}, ${ETUNA_TENANT.id}, ${PROPERTY.name}, ${PROPERTY.slug},
        ${PROPERTY.type}, ${PROPERTY.description}, ${PROPERTY.address}, ${PROPERTY.city},
        ${PROPERTY.state}, ${PROPERTY.country}, ${PROPERTY.postalCode}, ${PROPERTY.starRating},
        ${PROPERTY.amenities}, ${PROPERTY.checkInTime}, ${PROPERTY.checkOutTime},
        ${PROPERTY.status}, ${PROPERTY.currency}, ${PROPERTY.hasRestaurantFeatures}, NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        amenities = EXCLUDED.amenities,
        updated_at = NOW()
    `;
    
    console.log(`   ✓ Property created: ${PROPERTY.name}`);
  } catch (error) {
    console.error('   ❌ Error creating property:', error);
    throw error;
  }
}

async function seedRooms() {
  console.log('\n🛏️  Seeding rooms...');
  
  if (isDryRun) {
    console.log(`   [DRY RUN] Would create ${ROOMS.length} rooms`);
    return;
  }
  
  try {
    for (const room of ROOMS) {
      // Check if exists
      const exists = await sql`
        SELECT id FROM rooms 
        WHERE property_id = ${PROPERTY.id} AND room_number = ${room.roomNumber}
      `;
      
      if (exists.length > 0 && !isForce) {
        console.log(`   ✓ Room ${room.roomNumber} already exists`);
        continue;
      }
      
      const roomId = exists.length > 0 ? exists[0].id : room.id;
      
      await sql`
        INSERT INTO rooms (
          id, property_id, room_number, room_type, max_occupancy,
          base_rate, amenities, status, currency, created_at, updated_at
        ) VALUES (
          ${roomId}, ${PROPERTY.id}, ${room.roomNumber}, ${room.roomType},
          ${room.maxOccupancy}, ${room.baseRate}, ${room.amenities},
          ${room.status}, 'NAD', NOW(), NOW()
        )
        ON CONFLICT (property_id, room_number) DO UPDATE SET
          room_type = EXCLUDED.room_type,
          max_occupancy = EXCLUDED.max_occupancy,
          base_rate = EXCLUDED.base_rate,
          amenities = EXCLUDED.amenities,
          updated_at = NOW()
      `;
      
      console.log(`   ✓ Room created: ${room.roomNumber} - ${room.roomType}`);
    }
  } catch (error) {
    console.error('   ❌ Error creating rooms:', error);
    throw error;
  }
}

async function seedRestaurant() {
  console.log('\n🍽️  Seeding restaurant...');
  
  if (isDryRun) {
    console.log('   [DRY RUN] Would create restaurant and menu');
    return;
  }
  
  try {
    // Check if restaurant exists
    const existingRestaurant = await sql`
      SELECT id FROM restaurants WHERE property_id = ${PROPERTY.id}
    `;
    
    let restaurantId = RESTAURANT.id;
    
    if (existingRestaurant.length > 0 && !isForce) {
      console.log('   ✓ Restaurant already exists');
      restaurantId = existingRestaurant[0].id;
      await sql`
        UPDATE restaurants SET opening_hours = ${JSON.stringify(getRestaurantOpeningHoursJson())}, updated_at = NOW()
        WHERE id = ${restaurantId}
      `;
    } else {
      if (existingRestaurant.length > 0) {
        restaurantId = existingRestaurant[0].id;
      }
      
      await sql`
        INSERT INTO restaurants (
          id, property_id, name, description, cuisine_type,
          capacity, opening_hours, contact_phone, status, created_at, updated_at
        ) VALUES (
          ${restaurantId}, ${PROPERTY.id}, ${RESTAURANT.name}, ${RESTAURANT.description},
          ${RESTAURANT.cuisineType}, ${RESTAURANT.capacity}, ${JSON.stringify(RESTAURANT.openingHours)},
          ${RESTAURANT.contactPhone}, ${RESTAURANT.status}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          opening_hours = EXCLUDED.opening_hours,
          updated_at = NOW()
      `;
      
      console.log(`   ✓ Restaurant created: ${RESTAURANT.name}`);
    }
    
    if (isForce) {
      await sql`DELETE FROM cms_menu_items WHERE restaurant_id = ${restaurantId}`;
      await sql`DELETE FROM menu_categories WHERE restaurant_id = ${restaurantId}`;
    }

    // Seed menu categories
    const categoryMap = new Map();
    
    for (const category of MENU_CATEGORIES) {
      const existingCategory = await sql`
        SELECT id FROM menu_categories 
        WHERE restaurant_id = ${restaurantId} AND name = ${category.name}
      `;
      
      let categoryId = category.id;
      
      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
      } else {
        await sql`
          INSERT INTO menu_categories (
            id, restaurant_id, name, description, display_order, created_at, updated_at
          ) VALUES (
            ${categoryId}, ${restaurantId}, ${category.name}, ${category.description},
            ${category.displayOrder}, NOW(), NOW()
          )
        `;
      }
      
      categoryMap.set(category.name, categoryId);
    }
    
    console.log(`   ✓ ${MENU_CATEGORIES.length} menu categories created`);
    
    // Seed menu items
    for (const item of MENU_ITEMS) {
      const categoryId = categoryMap.get(item.categoryName);
      
      if (!categoryId) {
        console.warn(`   ⚠️  Category not found: ${item.categoryName}`);
        continue;
      }
      
      const existingItem = await sql`
        SELECT id FROM cms_menu_items 
        WHERE restaurant_id = ${restaurantId} AND name = ${item.name}
      `;
      
      if (existingItem.length > 0 && !isForce) {
        continue;
      }

      const imageUrl = getMenuItemImageUrlForSeed(item.name, item.categoryName);

      if (existingItem.length > 0 && isForce) {
        await sql`
          UPDATE cms_menu_items SET
            category_id = ${categoryId},
            description = ${item.description},
            price = ${item.price},
            image_url = ${imageUrl},
            updated_at = NOW()
          WHERE id = ${existingItem[0].id}
        `;
        continue;
      }

      if (existingItem.length > 0 && !isForce) {
        await sql`
          UPDATE cms_menu_items SET
            image_url = COALESCE(NULLIF(image_url, ''), ${imageUrl}),
            updated_at = NOW()
          WHERE id = ${existingItem[0].id} AND (image_url IS NULL OR image_url = '')
        `;
        continue;
      }
      
      await sql`
        INSERT INTO cms_menu_items (
          id, restaurant_id, category_id, name, description,
          price, currency, image_url, is_available, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${restaurantId}, ${categoryId}, ${item.name},
          ${item.description || null}, ${item.price}, 'NAD', ${imageUrl}, true, NOW(), NOW()
        )
      `;
    }
    
    console.log(`   ✓ ${MENU_ITEMS.length} menu items created`);

    await seedInventoryForRestaurant(restaurantId);
  } catch (error) {
    console.error('   ❌ Error creating restaurant/menu:', error);
    throw error;
  }
}

async function seedInventoryForRestaurant(restaurantId: string) {
  const inventoryRows = buildInventorySeedFromCatalog();
  if (inventoryRows.length === 0) return;

  try {
    const tableCheck = await sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'inventory_items'
      LIMIT 1
    `;
    if (tableCheck.length === 0) {
      console.warn('   ⚠️  inventory_items table missing — run database/drizzle/0011_fnb_inventory.sql first');
      return;
    }

    let linked = 0;
    for (const row of inventoryRows) {
      const catalogItem = MENU_ITEMS.find((item) => item.inventorySku === row.sku);
      if (!catalogItem) continue;

      const menuRows = await sql`
        SELECT id FROM cms_menu_items
        WHERE restaurant_id = ${restaurantId} AND name = ${catalogItem.name}
        LIMIT 1
      `;
      if (menuRows.length === 0) continue;
      const menuItemId = menuRows[0].id;

      const existingInv = await sql`
        SELECT id FROM inventory_items
        WHERE tenant_id = ${ETUNA_TENANT.id} AND sku = ${row.sku}
        LIMIT 1
      `;

      let inventoryItemId = existingInv[0]?.id as string | undefined;
      if (!inventoryItemId) {
        inventoryItemId = randomUUID();
        await sql`
          INSERT INTO inventory_items (
            id, tenant_id, property_id, restaurant_id, sku, name, unit, category,
            quantity_on_hand, reorder_point, reorder_quantity, is_active, created_at, updated_at
          ) VALUES (
            ${inventoryItemId}, ${ETUNA_TENANT.id}, ${PROPERTY.id}, ${restaurantId},
            ${row.sku}, ${row.name}, 'each', ${row.category},
            ${row.initialOnHand}, ${row.reorderPoint}, ${row.reorderPoint * 2},
            true, NOW(), NOW()
          )
        `;
      } else if (isForce) {
        await sql`
          UPDATE inventory_items SET
            name = ${row.name},
            category = ${row.category},
            reorder_point = ${row.reorderPoint},
            updated_at = NOW()
          WHERE id = ${inventoryItemId}
        `;
      }

      await sql`
        INSERT INTO menu_item_inventory_links (
          id, menu_item_id, inventory_item_id, quantity_per_sale, created_at
        ) VALUES (
          ${randomUUID()}, ${menuItemId}, ${inventoryItemId}, 1, NOW()
        )
        ON CONFLICT (menu_item_id) DO UPDATE SET
          inventory_item_id = EXCLUDED.inventory_item_id
      `;
      linked += 1;
    }

    console.log(`   ✓ ${linked} menu ↔ inventory SKU links`);
  } catch (error) {
    console.warn('   ⚠️  Inventory seed skipped:', error);
  }
}

async function seedAdminUser() {
  console.log('\n👤 Seeding admin user...');
  
  if (isDryRun) {
    console.log(`   [DRY RUN] Would create user: ${ADMIN_USER.email}`);
    return;
  }
  
  try {
    // Check if exists
    const exists = await sql`
      SELECT id FROM users WHERE email = ${ADMIN_USER.email}
    `;
    
    if (exists.length > 0 && !isForce) {
      console.log(`   ✓ Admin user already exists: ${ADMIN_USER.email}`);
      return;
    }
    
    await sql`
      INSERT INTO users (
        id, tenant_id, email, password_hash, first_name, last_name,
        phone, role, email_verified, created_at, updated_at
      ) VALUES (
        ${ADMIN_USER.id}, ${ETUNA_TENANT.id}, ${ADMIN_USER.email}, ${PASSWORD_HASH},
        ${ADMIN_USER.firstName}, ${ADMIN_USER.lastName}, ${ADMIN_USER.phone},
        ${ADMIN_USER.role}, ${ADMIN_USER.emailVerified}, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW()
    `;
    
    console.log(`   ✓ Admin user created: ${ADMIN_USER.email}`);
  } catch (error) {
    console.error('   ❌ Error creating admin user:', error);
    throw error;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Hotel Etuna — Operator Seed Script                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  if (isDryRun) {
    console.log('\n⚠️  DRY RUN MODE - No data will be inserted');
  }
  
  if (isForce) {
    console.log('\n⚠️  FORCE MODE - Existing data will be updated');
  }
  
  try {
    ETUNA_TENANT_ID = await resolveEtunaTenantIdFromDb();
    ETUNA_TENANT.id = ETUNA_TENANT_ID;
    PROPERTY_ID = await resolvePropertyId(ETUNA_TENANT_ID);
    PROPERTY.id = PROPERTY_ID;
    console.log(`\n📍 Operator tenant ID: ${ETUNA_TENANT_ID}`);
    console.log(`📍 Property ID: ${PROPERTY_ID} (slug: hotel-etuna)`);

    await seedTenant();
    await seedProperty();
    await seedRooms();
    await seedRestaurant();
    await seedAdminUser();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Hotel Etuna operator seed completed!                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    if (!isDryRun) {
      console.log('\n📊 Summary:');
      console.log(`   - Tenant: Hotel Etuna (${ETUNA_TENANT_ID})`);
      console.log(`   - Property: ${PROPERTY.name} (${PROPERTY.slug})`);
      console.log(`   - Rooms: ${ROOMS.length} room types`);
      console.log(`   - Restaurant: ${RESTAURANT.name}`);
      console.log(`   - Menu Categories: ${MENU_CATEGORIES.length}`);
      console.log(`   - Menu Items: ${MENU_ITEMS.length}`);
      console.log(`   - Admin User: ${ADMIN_USER.email}`);
      
      console.log('\n🔐 Admin credentials:');
      console.log(`   Email: ${ADMIN_USER.email}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      
      console.log('\n📍 Env (.env.local):');
      console.log(`   ETUNA_TENANT_ID="${ETUNA_TENANT_ID}"`);
      console.log(`   ETUNA_PROPERTY_ID="${PROPERTY.id}"`);

      console.log('\n📍 Next steps:');
      console.log('   1. Ingest knowledge base: npx tsx scripts/ingest-hotel-etuna-knowledge.ts');
      console.log('   2. Start dev server: npm run dev');
      console.log('   3. Login at: http://localhost:3000/login');
      console.log('   4. View public site: http://localhost:3000');
    }
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
