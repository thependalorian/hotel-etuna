/**
 * Hotel Etuna Hub Seed Script
 * 
 * Purpose: Populate Hotel Etuna hub with complete operational data
 * Location: scripts/seed-hotel-etuna.ts
 * 
 * Includes:
 * - Hub tenant
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

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const isForce = args.includes('--force');

// Get hub tenant ID from environment (must be UUID if provided)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const configuredHubTenantId = process.env.HUB_TENANT_ID?.trim() ?? '';
let HUB_TENANT_ID = UUID_REGEX.test(configuredHubTenantId) ? configuredHubTenantId : randomUUID();

// Password for admin user
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Test1234!';
const PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// ============================================================================
// HOTEL ETUNA DATA
// ============================================================================

const HUB_TENANT = {
  id: HUB_TENANT_ID,
  name: 'Hotel Etuna',
  type: 'hub',
  status: 'active',
  subscriptionTier: 'enterprise',
  subscriptionStatus: 'active',
  hasRestaurantFeatures: true,
  isEnterprise: true,
};

async function resolveHubTenantId(): Promise<string> {
  if (UUID_REGEX.test(configuredHubTenantId)) {
    return configuredHubTenantId;
  }

  const existingHubTenant = await sql`
    SELECT id
    FROM tenants
    WHERE type = 'hub'::tenant_type
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (existingHubTenant.length > 0) {
    return existingHubTenant[0].id as string;
  }

  return randomUUID();
}

const PROPERTY = {
  id: randomUUID(),
  name: 'Hotel Etuna',
  slug: 'hotel-etuna',
  type: 'hotel',
  description: 'Hotel Etuna is a luxury guesthouse in the heart of Ongwediva, Namibia. Offering 5 room types, an outdoor pool, a celebrated on-site restaurant, and curated cultural tours, we embody the Oshiwambo meaning of our name — He takes care of us.',
  address: '5544 Valley of the Leopard Street, Ongwediva, Oshana Region, Namibia',
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
    roomNumber: 'ET-201',
    roomType: 'Luxury Room',
    maxOccupancy: 2,
    baseRate: '1200.00',
    description: 'Enhanced space with elegant touches, premium bathroom, sitting area, and pool view.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Sitting Area', 'Bathrobe'],
    status: 'available',
  },
  {
    id: randomUUID(),
    roomNumber: 'ET-301',
    roomType: 'Family Room',
    maxOccupancy: 4,
    baseRate: '1500.00',
    description: 'Ample space for families with two double beds and extra convenience features, plus garden access.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Extra Bedding', 'Garden Access'],
    status: 'available',
  },
  {
    id: randomUUID(),
    roomNumber: 'ET-401',
    roomType: 'Executive Suite',
    maxOccupancy: 2,
    baseRate: '1800.00',
    description: '26 m² business-friendly suite with work desk, premium toiletries, and VIP lounge access.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Work Desk', 'VIP Toiletries', 'Lounge Access'],
    status: 'available',
  },
  {
    id: randomUUID(),
    roomNumber: 'ET-501',
    roomType: 'Premier Room',
    maxOccupancy: 6,
    baseRate: '2500.00',
    description: 'Two bedrooms, two bathrooms, private lounge, balcony – the ultimate group/family experience.',
    amenities: ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'],
    status: 'available',
  },
];

const RESTAURANT = {
  id: randomUUID(),
  name: 'Etuna Restaurant',
  description: 'Our on-site culinary gem serves traditional Namibian cuisine alongside international favourites. Locally sourced ingredients, buffet breakfast, and a private bar.',
  cuisineType: 'Namibian, International',
  capacity: 60,
  openingHours: {
    breakfast: { open: '06:30', close: '10:00' },
    dinner: { open: '18:00', close: '22:00' },
  },
  contactPhone: '+264 65 231 177',
  status: 'active',
};

const MENU_CATEGORIES = [
  { id: randomUUID(), name: 'Breakfast', description: 'Start your day right', displayOrder: 1 },
  { id: randomUUID(), name: 'Starters', description: 'Light bites to begin', displayOrder: 2 },
  { id: randomUUID(), name: 'Mains', description: 'Hearty traditional and international dishes', displayOrder: 3 },
  { id: randomUUID(), name: 'Desserts', description: 'Sweet endings', displayOrder: 4 },
  { id: randomUUID(), name: 'Drinks', description: 'Refreshments and beverages', displayOrder: 5 },
];

const MENU_ITEMS = [
  // Breakfast
  { categoryName: 'Breakfast', name: 'Full English Breakfast', description: 'Eggs, bacon, sausage, toast, tomatoes, mushrooms', price: '85.00' },
  { categoryName: 'Breakfast', name: 'Oshifima Porridge', description: 'Traditional Namibian maize porridge with milk', price: '55.00' },
  { categoryName: 'Breakfast', name: 'Fruit & Yogurt Bowl', description: 'Fresh seasonal fruits with Greek yogurt and honey', price: '45.00' },
  
  // Starters
  { categoryName: 'Starters', name: 'Soup of the Day', description: 'Chef\'s daily creation with fresh bread', price: '55.00' },
  { categoryName: 'Starters', name: 'Zambezi Bream Ceviche', description: 'Fresh river fish marinated in citrus and herbs', price: '75.00' },
  { categoryName: 'Starters', name: 'Vegetable Samosas', description: 'Crispy pastries filled with spiced vegetables', price: '50.00' },
  
  // Mains
  { categoryName: 'Mains', name: 'Slow-cooked Oshifima with Spinach', description: 'Traditional maize meal with wild spinach and beef', price: '120.00' },
  { categoryName: 'Mains', name: 'Grilled T-Bone Steak', description: '350g locally sourced beef with chips and salad', price: '180.00' },
  { categoryName: 'Mains', name: 'Pan-Fried Kingklip', description: 'Fresh fish fillet with lemon butter sauce', price: '150.00' },
  { categoryName: 'Mains', name: 'Vegetarian Potjie', description: 'Slow-cooked vegetable stew in cast iron pot', price: '110.00' },
  
  // Desserts
  { categoryName: 'Desserts', name: 'Malva Pudding', description: 'Traditional South African sponge cake with custard', price: '60.00' },
  { categoryName: 'Desserts', name: 'Amarula Crème Brûlée', description: 'Rich custard with caramelized sugar topping', price: '70.00' },
  { categoryName: 'Desserts', name: 'Seasonal Fruit Platter', description: 'Fresh local fruits beautifully presented', price: '50.00' },
  
  // Drinks
  { categoryName: 'Drinks', name: 'Namibian Windhoek Lager', description: 'Premium local beer (330ml)', price: '30.00' },
  { categoryName: 'Drinks', name: 'South African Wines', description: 'Selection of red and white wines (per glass)', price: '45.00' },
  { categoryName: 'Drinks', name: 'Fresh Juices', description: 'Orange, apple, or mixed tropical juice', price: '25.00' },
];

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
  console.log('\n🏢 Seeding hub tenant...');
  
  if (isDryRun) {
    console.log('   [DRY RUN] Would create tenant:', HUB_TENANT.name);
    return;
  }
  
  try {
    // Check if exists
    const exists = await sql`
      SELECT id FROM tenants WHERE id = ${HUB_TENANT.id}
    `;
    
    if (exists.length > 0 && !isForce) {
      console.log('   ✓ Hub tenant already exists');
      return;
    }
    
    await sql`
      INSERT INTO tenants (
        id, name, type, status, subscription_tier, subscription_status,
        has_restaurant_features, is_enterprise, created_at, updated_at
      ) VALUES (
        ${HUB_TENANT.id}, ${HUB_TENANT.name}, ${HUB_TENANT.type}::tenant_type,
        ${HUB_TENANT.status}, ${HUB_TENANT.subscriptionTier}, ${HUB_TENANT.subscriptionStatus},
        ${HUB_TENANT.hasRestaurantFeatures}, ${HUB_TENANT.isEnterprise}, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;
    
    console.log(`   ✓ Hub tenant created: ${HUB_TENANT.name}`);
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
        ${PROPERTY.id}, ${HUB_TENANT.id}, ${PROPERTY.name}, ${PROPERTY.slug},
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
          updated_at = NOW()
      `;
      
      console.log(`   ✓ Restaurant created: ${RESTAURANT.name}`);
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
      
      await sql`
        INSERT INTO cms_menu_items (
          id, restaurant_id, category_id, name, description,
          price, currency, is_available, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${restaurantId}, ${categoryId}, ${item.name},
          ${item.description}, ${item.price}, 'NAD', true, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
    }
    
    console.log(`   ✓ ${MENU_ITEMS.length} menu items created`);
  } catch (error) {
    console.error('   ❌ Error creating restaurant/menu:', error);
    throw error;
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
        ${ADMIN_USER.id}, ${HUB_TENANT.id}, ${ADMIN_USER.email}, ${PASSWORD_HASH},
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
  console.log('║   Hotel Etuna Hub - Seed Script                           ║');
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
    HUB_TENANT_ID = await resolveHubTenantId();
    HUB_TENANT.id = HUB_TENANT_ID;
    console.log(`\n📍 Hub Tenant ID: ${HUB_TENANT_ID}`);

    await seedTenant();
    await seedProperty();
    await seedRooms();
    await seedRestaurant();
    await seedAdminUser();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Hotel Etuna hub seed completed!                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    if (!isDryRun) {
      console.log('\n📊 Summary:');
      console.log(`   - Tenant: Hotel Etuna (${HUB_TENANT_ID})`);
      console.log(`   - Property: ${PROPERTY.name} (${PROPERTY.slug})`);
      console.log(`   - Rooms: ${ROOMS.length} room types`);
      console.log(`   - Restaurant: ${RESTAURANT.name}`);
      console.log(`   - Menu Categories: ${MENU_CATEGORIES.length}`);
      console.log(`   - Menu Items: ${MENU_ITEMS.length}`);
      console.log(`   - Admin User: ${ADMIN_USER.email}`);
      
      console.log('\n🔐 Admin credentials:');
      console.log(`   Email: ${ADMIN_USER.email}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      
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
