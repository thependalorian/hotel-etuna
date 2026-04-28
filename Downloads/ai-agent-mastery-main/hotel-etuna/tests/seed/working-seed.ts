/**
 * Working Database Seed Script (Drizzle)
 *
 * Purpose: Seed a minimal but valid tenant graph for local testing.
 * Location: /tests/seed/working-seed.ts
 */

import bcryptjs from 'bcryptjs';
import { db } from '../../lib/db/connection';
import { guests, properties, rooms, tenants, users } from '../../lib/db/schema';

async function main() {
  console.log('Starting database seed...');

  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@test.com`;
  const guestEmail = `guest-${timestamp}@test.com`;
  const propertySlug = `test-hotel-${timestamp}`;
  const passwordHash = await bcryptjs.hash('TestPassword123!', 10);

  try {
    const result = await db.transaction(async (tx) => {
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: `Test Tenant ${timestamp}`,
        })
        .returning();

      const [newUser] = await tx
        .insert(users)
        .values({
          tenantId: newTenant.id,
          email: testEmail,
          passwordHash,
          firstName: 'Test',
          lastName: 'User',
          role: 'owner',
        })
        .returning();

      const [newProperty] = await tx
        .insert(properties)
        .values({
          tenantId: newTenant.id,
          ownerId: newUser.id,
          name: 'Test Hotel',
          slug: propertySlug,
          type: 'hotel',
          address: '123 Test Street',
          city: 'Windhoek',
          country: 'Namibia',
        })
        .returning();

      const [newRoom] = await tx
        .insert(rooms)
        .values({
          propertyId: newProperty.id,
          roomNumber: `101-${timestamp}`,
          roomType: 'standard',
          maxOccupancy: 2,
        })
        .returning();

      const [newGuest] = await tx
        .insert(guests)
        .values({
          tenantId: newTenant.id,
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'Tester',
          country: 'Namibia',
        })
        .returning();

      return { newTenant, newUser, newProperty, newRoom, newGuest };
    });

    console.log('Seed completed successfully.');
    console.log(`Tenant ID: ${result.newTenant.id}`);
    console.log(`User ID: ${result.newUser.id}`);
    console.log(`User Email: ${result.newUser.email}`);
    console.log(`Property ID: ${result.newProperty.id}`);
    console.log(`Room ID: ${result.newRoom.id}`);
    console.log(`Guest ID: ${result.newGuest.id}`);
    console.log('Default password: TestPassword123!');
  } catch (error: any) {
    console.error('Seed failed:', error?.message ?? error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
