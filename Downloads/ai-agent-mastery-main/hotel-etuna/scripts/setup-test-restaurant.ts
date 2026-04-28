/**
 * Setup Test Restaurant
 * 
 * Purpose: Creates a restaurant for the test property to enable restaurant API tests
 * Location: /scripts/setup-test-restaurant.ts
 * 
 * This script:
 * 1. Finds the test user's tenant and property
 * 2. Creates a restaurant for that property
 * 3. Outputs the restaurant ID for use in tests
 * 
 * Usage:
 * ```bash
 * TEST_USER_EMAIL='your@email.com' npm run test:setup:restaurant
 * ```
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../lib/database/connection';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'pendanek@gmail.com';

async function setupTestRestaurant() {
  console.log('🍽️  Setting up test restaurant...\n');

  try {
    // 1. Find user and tenant
    console.log('1. Finding test user and tenant...');
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: { tenant: true },
    });

    if (!user) {
      throw new Error(`User not found: ${TEST_USER_EMAIL}. Please create the user first.`);
    }

    if (!user.tenant) {
      throw new Error(`User has no tenant: ${TEST_USER_EMAIL}`);
    }

    const tenantId = user.tenant_id;
    console.log(`   ✅ Found user: ${user.email}`);
    console.log(`   ✅ Tenant: ${user.tenant.name} (${tenantId})\n`);

    // 2. Find or get the first property for this tenant
    console.log('2. Finding test property...');
    const property = await prisma.property.findFirst({
      where: {
        tenant_id: tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!property) {
      throw new Error('No property found. Please create a property first using the API tests.');
    }
    console.log(`   ✅ Found property: ${property.name} (${property.id})\n`);

    // 3. Check if restaurant already exists
    console.log('3. Checking for existing restaurant...');
    let restaurant = await prisma.restaurant.findFirst({
      where: {
        property_id: property.id,
      },
    });

    if (restaurant) {
      console.log(`   ✅ Restaurant already exists: ${restaurant.name} (${restaurant.id})\n`);
      console.log('📋 Restaurant Details:');
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   Name: ${restaurant.name}`);
      console.log(`   Property ID: ${restaurant.property_id}`);
      console.log(`   Status: ${restaurant.status}\n`);
      return restaurant;
    }

    // 4. Create restaurant
    console.log('4. Creating restaurant...');
    restaurant = await prisma.restaurant.create({
      data: {
        property_id: property.id,
        name: 'Test Restaurant',
        description: 'Test restaurant for API testing',
        cuisine_type: 'International',
        capacity: 50,
        opening_hours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '22:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '12:00', close: '21:00' },
        },
        contact_phone: '+264811234567',
        contact_email: 'restaurant@test.com',
        images: [],
        status: 'active',
      },
    });

    console.log(`   ✅ Restaurant created: ${restaurant.name} (${restaurant.id})\n`);

    // 5. Output summary
    console.log('📋 Restaurant Setup Complete!');
    console.log('============================================================');
    console.log(`Restaurant ID: ${restaurant.id}`);
    console.log(`Property ID: ${property.id}`);
    console.log(`Name: ${restaurant.name}`);
    console.log(`Status: ${restaurant.status}`);
    console.log('============================================================\n');

    console.log('✅ You can now run restaurant API tests:');
    console.log('   TEST_USER_PASSWORD=\'your-password\' npm run test:api\n');

    return restaurant;
  } catch (error: any) {
    console.error('❌ Error setting up restaurant:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupTestRestaurant()
    .then(() => {
      console.log('✅ Setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupTestRestaurant };
