/**
 * Test Helper Utilities
 *
 * Purpose: Reusable utilities for integration tests (Drizzle, RLS-aware)
 * Location: tests/utils/test-helpers.ts
 *
 * All tenant-scoped DB operations run inside runWithTenantContext so RLS allows access.
 */

import { randomUUID } from 'node:crypto';
import { db, sql, clearTenantContext } from '@/lib/db';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import {
  tenants,
  users,
  properties,
  rooms,
  guests,
  bookings,
  bookingRooms,
  staff,
  restaurants,
  restaurantTables,
  restaurantOrders,
  restaurantOrderItems,
  fnbPrintJobs,
  menuCategories,
  cmsMenuItems,
  supportTickets,
  supportTicketReplies,
  auditTrail,
  kycUpgradePrompts,
  crmConsentEvents,
  crmOutreachTouches,
  crmGuestMemoryFacts,
  crmGraphEdges,
} from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Create a test tenant (runs without tenant context so tenants-table insert is allowed).
 * Uses raw sql to avoid Neon serverless driver parse error on Drizzle INSERT RETURNING.
 */
export async function createTestTenant(name: string = `Test Tenant ${Date.now()}`) {
  await clearTenantContext();
  const rows = await sql`
    INSERT INTO tenants (id, name, status, created_at, updated_at)
    VALUES (gen_random_uuid(), ${name}, 'active', NOW(), NOW())
    RETURNING id, name, created_at
  `;
  const row = Array.isArray(rows) ? rows[0] : (rows as unknown as { id: string; name: string; created_at: Date }[])[0];
  if (!row) throw new Error('Failed to create test tenant');
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

/**
 * Create a test user (runs with tenant context for RLS)
 */
export async function createTestUser(
  tenantId: string,
  email: string = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
  password: string = 'TestPassword123!'
) {
  return runWithTenantContext(tenantId, async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${tenantId},
        ${email},
        ${passwordHash},
        'Test',
        'User',
        'admin',
        'active',
        NOW(),
        NOW()
      )
      RETURNING id, email, created_at
    `;
    const row = Array.isArray(rows)
      ? (rows[0] as { id: string; email: string; created_at: Date })
      : (rows as unknown as { id: string; email: string; created_at: Date }[])[0];
    if (!row) throw new Error('Failed to create test user');
    return {
      id: row.id,
      tenant_id: tenantId,
      tenantId,
      email: row.email,
      role: 'admin',
      status: 'active',
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  });
}

/**
 * Create a test property (runs with tenant context for RLS)
 */
export async function createTestProperty(
  tenantId: string,
  ownerId: string,
  name: string = `Test Property ${Date.now()}`,
  type: 'hotel' | 'restaurant' = 'hotel'
) {
  return runWithTenantContext(tenantId, async () => {
    const slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const rows = await sql`
      INSERT INTO properties (
        id,
        tenant_id,
        owner_id,
        name,
        slug,
        type,
        address,
        city,
        country,
        status,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${tenantId},
        ${ownerId},
        ${name},
        ${slug},
        ${type === 'restaurant' ? 'restaurant' : 'hotel'},
        '123 Test Street',
        'Windhoek',
        'Namibia',
        'active',
        NOW(),
        NOW()
      )
      RETURNING id, name, slug, created_at
    `;
    const row = Array.isArray(rows)
      ? (rows[0] as { id: string; name: string; slug: string; created_at: Date })
      : (rows as unknown as { id: string; name: string; slug: string; created_at: Date }[])[0];
    if (!row) throw new Error('Failed to create test property');
    return {
      id: row.id,
      tenant_id: tenantId,
      tenantId,
      owner_id: ownerId,
      ownerId,
      name: row.name,
      slug: row.slug,
      type: 'hotel',
      status: 'active',
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  });
}

/**
 * Create a test room (requires tenantId for RLS; pass tenantId from property's tenant)
 */
export async function createTestRoom(
  propertyId: string,
  roomNumber: string = `R${Date.now()}`,
  roomType: string = 'Standard',
  tenantId?: string
) {
  const doInsert = async () => {
    const rows = await sql`
      INSERT INTO rooms (
        id, property_id, room_number, room_type, max_occupancy, status, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${propertyId},
        ${roomNumber},
        ${roomType},
        2,
        'available',
        NOW(),
        NOW()
      )
      RETURNING id, room_number, created_at
    `;
    const row = Array.isArray(rows)
      ? (rows[0] as { id: string; room_number: string; created_at: Date })
      : (rows as unknown as { id: string; room_number: string; created_at: Date }[])[0];
    if (!row) throw new Error('Failed to create test room');
    return {
      id: row.id,
      property_id: propertyId,
      propertyId,
      room_number: row.room_number,
      roomNumber: row.room_number,
      room_type: roomType,
      max_occupancy: 2,
      maxOccupancy: 2,
      status: 'available',
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  };
  if (tenantId) return runWithTenantContext(tenantId, doInsert);
  return doInsert();
}

/**
 * Create a test guest (runs with tenant context for RLS)
 */
export async function createTestGuest(
  tenantId: string,
  email: string = `guest-${randomUUID()}@example.com`
) {
  return runWithTenantContext(tenantId, async () => {
    const rows = await sql`
      INSERT INTO guests (
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        phone,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${tenantId},
        ${email},
        'Test',
        'Guest',
        '+264123456789',
        NOW(),
        NOW()
      )
      RETURNING id, email, created_at
    `;
    const row = Array.isArray(rows)
      ? (rows[0] as { id: string; email: string; created_at: Date })
      : (rows as unknown as { id: string; email: string; created_at: Date }[])[0];
    if (!row) throw new Error('Failed to create test guest');
    return {
      id: row.id,
      tenant_id: tenantId,
      tenantId,
      email: row.email,
      first_name: 'Test',
      last_name: 'Guest',
      firstName: 'Test',
      lastName: 'Guest',
      phone: '+264123456789',
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  });
}

/**
 * Create a test booking (runs with tenant context for RLS)
 */
export async function createTestBooking(
  tenantId: string,
  propertyId: string,
  guestId: string,
  roomId: string,
  checkInDate: Date | string = new Date(),
  checkOutDate: Date | string = new Date(Date.now() + 86400000)
) {
  // Reason: accept both Date objects and pre-formatted YYYY-MM-DD strings so callers
  // (e.g. documents integration tests) can pass either without a TypeError.
  const toDateOnly = (d: Date | string): string =>
    typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10);
  return runWithTenantContext(tenantId, async () => {
    const ref = `TEST-${Date.now()}`;
    const rows = await sql`
      INSERT INTO bookings (
        id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, total_amount, currency, payment_status, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${tenantId},
        ${propertyId},
        ${guestId},
        ${ref},
        'confirmed',
        ${toDateOnly(checkInDate)},
        ${toDateOnly(checkOutDate)},
        1,
        2,
        0,
        0,
        'NAD',
        'pending',
        NOW(),
        NOW()
      )
      RETURNING id, status, property_id, guest_id
    `;
    const booking = Array.isArray(rows)
      ? (rows[0] as { id: string; status: string; property_id: string; guest_id: string })
      : (rows as unknown as { id: string; status: string; property_id: string; guest_id: string }[])[0];
    if (!booking) throw new Error('Failed to create test booking');
    await sql`
      INSERT INTO booking_rooms (id, booking_id, room_id, guest_count, rate_amount, currency, created_at)
      VALUES (gen_random_uuid(), ${booking.id}, ${roomId}, 2, 0, 'NAD', NOW())
    `;
    return {
      id: booking.id,
      status: booking.status,
      property_id: booking.property_id,
      propertyId: booking.property_id,
      guest_id: booking.guest_id,
      guestId: booking.guest_id,
    };
  });
}

/** Same as {@link createTestBooking} but status <code>pending</code> (for lifecycle transition tests). */
export async function createPendingTestBooking(
  tenantId: string,
  propertyId: string,
  guestId: string,
  roomId: string,
  checkInDate: Date = new Date(),
  checkOutDate: Date = new Date(Date.now() + 86400000)
) {
  return runWithTenantContext(tenantId, async () => {
    const ref = `TEST-P-${Date.now()}`;
    const rows = await sql`
      INSERT INTO bookings (
        id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, total_amount, currency, payment_status, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${tenantId},
        ${propertyId},
        ${guestId},
        ${ref},
        'pending',
        ${checkInDate.toISOString().slice(0, 10)},
        ${checkOutDate.toISOString().slice(0, 10)},
        1,
        2,
        0,
        0,
        'NAD',
        'pending',
        NOW(),
        NOW()
      )
      RETURNING id, status, property_id, guest_id
    `;
    const booking = Array.isArray(rows)
      ? (rows[0] as { id: string; status: string; property_id: string; guest_id: string })
      : (rows as unknown as { id: string; status: string; property_id: string; guest_id: string }[])[0];
    if (!booking) throw new Error('Failed to create pending test booking');
    await sql`
      INSERT INTO booking_rooms (id, booking_id, room_id, guest_count, rate_amount, currency, created_at)
      VALUES (gen_random_uuid(), ${booking.id}, ${roomId}, 2, 0, 'NAD', NOW())
    `;
    return {
      id: booking.id,
      status: booking.status,
      property_id: booking.property_id,
      propertyId: booking.property_id,
      guest_id: booking.guest_id,
      guestId: booking.guest_id,
    };
  });
}

/**
 * Create a test staff member (runs with tenant context for RLS)
 */
export async function createTestStaff(
  tenantId: string,
  propertyId: string | null = null,
  email: string = `staff-${Date.now()}@example.com`
) {
  return runWithTenantContext(tenantId, async () => {
    const employeeNumber = `EMP-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const rows = await sql`
      INSERT INTO staff (
        id, tenant_id, property_id, employee_number, first_name, last_name, email, phone, position, department, employment_type, status, hire_date, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${tenantId},
        ${propertyId},
        ${employeeNumber},
        'Test',
        'Staff',
        ${email},
        '+264123456789',
        'Manager',
        'Management',
        'FULL_TIME',
        'ACTIVE',
        CURRENT_DATE,
        NOW(),
        NOW()
      )
      RETURNING id, email, created_at
    `;
    const row = Array.isArray(rows)
      ? (rows[0] as { id: string; email: string; created_at: Date })
      : (rows as unknown as { id: string; email: string; created_at: Date }[])[0];
    if (!row) throw new Error('Failed to create test staff');
    return {
      id: row.id,
      tenant_id: tenantId,
      tenantId,
      property_id: propertyId,
      propertyId,
      first_name: 'Test',
      last_name: 'Staff',
      email: row.email,
      phone: '+264123456789',
      position: 'Manager',
      department: 'Management',
      employment_type: 'FULL_TIME',
      status: 'ACTIVE',
      hire_date: new Date(),
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  });
}

/**
 * Create a test restaurant (runs with tenant context for RLS; pass tenantId from property)
 */
export async function createTestRestaurant(
  propertyId: string,
  name: string = `Test Restaurant ${Date.now()}`,
  tenantId?: string
) {
  const doInsert = async () => {
    const [row] = await db
      .insert(restaurants)
      .values({
        propertyId,
        name,
        cuisineType: 'International',
        description: 'Test restaurant description',
        capacity: 50,
        status: 'active',
      })
      .returning({ id: restaurants.id, name: restaurants.name });
    if (!row) throw new Error('Failed to create test restaurant');
    return { id: row.id, name: row.name, property_id: propertyId, propertyId };
  };
  if (tenantId) return runWithTenantContext(tenantId, doInsert);
  return doInsert();
}

async function cleanupOptional(operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch {
    // Some legacy branches/tests may not have every optional PRD table yet.
  }
}

/**
 * Clean up test data by tenant ID (runs with tenant context for RLS)
 */
export async function cleanupTestData(tenantId: string) {
  if (!tenantId) return;
  return runWithTenantContext(tenantId, async () => {
    try {
      const tenantUuid = tenantId as `${string}-${string}-${string}-${string}-${string}`;
      await cleanupOptional(() => db.delete(crmConsentEvents).where(eq(crmConsentEvents.tenantId, tenantUuid)));
      await cleanupOptional(() => db.delete(crmOutreachTouches).where(eq(crmOutreachTouches.tenantId, tenantUuid)));
      await cleanupOptional(() => db.delete(crmGuestMemoryFacts).where(eq(crmGuestMemoryFacts.tenantId, tenantUuid)));
      await cleanupOptional(() => db.delete(crmGraphEdges).where(eq(crmGraphEdges.tenantId, tenantUuid)));

      const props = await db.select({ id: properties.id }).from(properties).where(eq(properties.tenantId, tenantUuid));
      const propIds = props.map((p) => p.id);

      const bks = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.tenantId, tenantUuid));
      const bookingIds = bks.map((b) => b.id);
      if (bookingIds.length > 0) {
        await db.delete(bookingRooms).where(inArray(bookingRooms.bookingId, bookingIds));
      }
      await cleanupOptional(() => db.delete(kycUpgradePrompts).where(eq(kycUpgradePrompts.tenantId, tenantUuid)));
      await cleanupOptional(() => db.delete(auditTrail).where(eq(auditTrail.tenantId, tenantUuid)));
      const tickets = await db
        .select({ id: supportTickets.id })
        .from(supportTickets)
        .where(eq(supportTickets.tenantId, tenantUuid));
      const ticketIds = tickets.map((ticket) => ticket.id);
      if (ticketIds.length > 0) {
        await cleanupOptional(() =>
          db.delete(supportTicketReplies).where(inArray(supportTicketReplies.ticketId, ticketIds))
        );
      }
      await cleanupOptional(() => db.delete(supportTickets).where(eq(supportTickets.tenantId, tenantUuid)));
      await db.delete(bookings).where(eq(bookings.tenantId, tenantUuid));
      if (propIds.length > 0) {
        await cleanupOptional(() => db.delete(fnbPrintJobs).where(inArray(fnbPrintJobs.propertyId, propIds)));
        await db.delete(rooms).where(inArray(rooms.propertyId, propIds));
      }
      await db.delete(guests).where(eq(guests.tenantId, tenantUuid));
      await db.delete(staff).where(eq(staff.tenantId, tenantUuid));

      for (const p of props) {
        const rests = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.propertyId, p.id));
        const restIds = rests.map((r) => r.id);
        if (restIds.length > 0) {
          const orders = await db
            .select({ id: restaurantOrders.id })
            .from(restaurantOrders)
            .where(inArray(restaurantOrders.restaurantId, restIds));
          const orderIds = orders.map((o) => o.id);
          if (orderIds.length > 0) {
            await db.delete(restaurantOrderItems).where(inArray(restaurantOrderItems.orderId, orderIds));
          }
          await db.delete(restaurantOrders).where(inArray(restaurantOrders.restaurantId, restIds));
          await db.delete(restaurantTables).where(inArray(restaurantTables.restaurantId, restIds));
          await db.delete(cmsMenuItems).where(inArray(cmsMenuItems.restaurantId, restIds));
          await db.delete(menuCategories).where(inArray(menuCategories.restaurantId, restIds));
        }
        await db.delete(restaurants).where(eq(restaurants.propertyId, p.id));
      }
      await db.delete(properties).where(eq(properties.tenantId, tenantUuid));
      await db.delete(users).where(eq(users.tenantId, tenantUuid));
      await clearTenantContext();
      await db.delete(tenants).where(eq(tenants.id, tenantUuid));
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });
}

/**
 * Generate unique test identifier
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
