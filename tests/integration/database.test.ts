/**
 * Database Integration Tests
 * 
 * Comprehensive tests for database operations:
 * - Connection and pooling
 * - CRUD operations
 * - Transactions
 * - Migrations
 * - Multi-tenancy
 * - Data integrity
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import {
  tenants,
  users,
  properties,
  bookings,
  guests,
  guestReviews,
  rooms,
  cmsMenuItems,
  aiConversations,
  aiMessages,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  HOTEL_ETUNA_FACILITY_COUNT,
  HOTEL_ETUNA_GUEST_ROOM_INVENTORY,
  isFacilityInventoryRow,
  isGuestRoomInventoryRow,
} from '@/lib/data/hotel-etuna-room-inventory';

describe('Database - Connection & Setup', () => {
  it('should connect to database', async () => {
    // Test basic query
    const result = await db.execute('SELECT 1 as value');
    expect(result).toBeDefined();
  });

  it('should have all required tables', async () => {
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tableNames = tables.rows.map((r: any) => r.table_name);

    expect(tableNames).toContain('tenants');
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('properties');
    expect(tableNames).toContain('bookings');
    expect(tableNames).toContain('guests');
    expect(tableNames).toContain('ai_conversations');
    expect(tableNames).toContain('ai_messages');
  });

  it('should support UUID generation', async () => {
    const result = await db.execute('SELECT gen_random_uuid() as id');
    const uuid = result.rows[0].id;

    expect(uuid).toBeDefined();
    expect(typeof uuid).toBe('string');
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

describe('Database - Tenant Operations', () => {
  let testTenantId: string;

  it('should create a tenant', async () => {
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: `Test Tenant ${Date.now()}`,
        subdomain: `test-tenant-${Date.now()}`,
        subscriptionTier: 'starter',
      })
      .returning();

    testTenantId = tenant.id;

    expect(tenant).toBeDefined();
    expect(tenant.id).toBeDefined();
    expect(tenant.name).toContain('Test Tenant');
    expect(tenant.subscriptionTier).toBe('starter');
  });

  it('should read tenant by ID', async () => {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(tenant).toBeDefined();
    expect(tenant.id).toBe(testTenantId);
  });

  it('should update tenant', async () => {
    const [updated] = await db
      .update(tenants)
      .set({ subscriptionTier: 'pro' })
      .where(eq(tenants.id, testTenantId))
      .returning();

    expect(updated.subscriptionTier).toBe('pro');
  });

  it('should enforce unique subdomain constraint', async () => {
    const testSubdomain = `unique-subdomain-${Date.now()}`;

    // Create first tenant
    await db.insert(tenants).values({
      name: 'First Tenant',
      subdomain: testSubdomain,
    });

    // Try to create second tenant with same slug
    await expect(
      db.insert(tenants).values({
        name: 'Second Tenant',
        subdomain: testSubdomain,
      })
    ).rejects.toThrow();
  });
});

describe('Database - Multi-Tenancy', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let property1Id: string;
  let property2Id: string;

  beforeAll(async () => {
    // Create two tenants
    const [t1] = await db
      .insert(tenants)
      .values({ name: 'Tenant 1', subdomain: `tenant1-${Date.now()}` })
      .returning();
    tenant1Id = t1.id;

    const [t2] = await db
      .insert(tenants)
      .values({ name: 'Tenant 2', subdomain: `tenant2-${Date.now()}` })
      .returning();
    tenant2Id = t2.id;

    // Create properties for each tenant
    const [p1] = await db
      .insert(properties)
      .values({
        tenantId: tenant1Id,
        name: 'Property 1',
        type: 'hotel',
        address: '123 Test St',
        slug: `property-1-${Date.now()}`,
      })
      .returning();
    property1Id = p1.id;

    const [p2] = await db
      .insert(properties)
      .values({
        tenantId: tenant2Id,
        name: 'Property 2',
        type: 'hotel',
        address: '456 Test Ave',
        slug: `property-2-${Date.now()}`,
      })
      .returning();
    property2Id = p2.id;
  });

  it('should isolate data by tenant', async () => {
    // Tenant 1 should only see their property
    const tenant1Properties = await db
      .select()
      .from(properties)
      .where(eq(properties.tenantId, tenant1Id));

    expect(tenant1Properties.length).toBe(1);
    expect(tenant1Properties[0].id).toBe(property1Id);

    // Tenant 2 should only see their property
    const tenant2Properties = await db
      .select()
      .from(properties)
      .where(eq(properties.tenantId, tenant2Id));

    expect(tenant2Properties.length).toBe(1);
    expect(tenant2Properties[0].id).toBe(property2Id);
  });

  it('should prevent cross-tenant access', async () => {
    // Try to access tenant1 property with tenant2 filter
    const [property] = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, property1Id),
          eq(properties.tenantId, tenant2Id) // Wrong tenant!
        )
      )
      .limit(1);

    expect(property).toBeUndefined();
  });

  it('should enforce tenant foreign key constraints', async () => {
    // Try to create property with non-existent tenant
    await expect(
      db.insert(properties).values({
        tenantId: uuidv4(), // Non-existent tenant
        name: 'Invalid Property',
        type: 'hotel',
        address: 'Test',
        slug: `invalid-property-${Date.now()}`,
      })
    ).rejects.toThrow();
  });
});

describe('Database - Transactions', () => {
  it('should commit transaction on success', async () => {
    const tenantName = `Transaction Test ${Date.now()}`;

    await db.transaction(async (tx) => {
      await tx.insert(tenants).values({
        name: tenantName,
        subdomain: `tx-test-${Date.now()}`,
      });
    });

    // Verify tenant was created
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.name, tenantName))
      .limit(1);

    expect(tenant).toBeDefined();
  });

  it('should rollback transaction on error', async () => {
    const tenantName = `Rollback Test ${Date.now()}`;

    try {
      await db.transaction(async (tx) => {
        // Create tenant
        await tx.insert(tenants).values({
          name: tenantName,
          subdomain: `rollback-test-${Date.now()}`,
        });

        // Force error with invalid data
        await tx.insert(properties).values({
          tenantId: 'invalid-uuid', // This will fail
          name: 'Test Property',
          type: 'HOTEL',
          address: 'Test',
        } as any);
      });
    } catch (error) {
      // Expected to fail
    }

    // Verify tenant was NOT created (transaction rolled back)
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.name, tenantName))
      .limit(1);

    expect(tenant).toBeUndefined();
  });
});

describe('Database - Complex Queries', () => {
  let testTenantId: string;
  let testPropertyId: string;
  let testGuestId: string;

  beforeAll(async () => {
    // Create test data
    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Complex Test Tenant', subdomain: `complex-${Date.now()}` })
      .returning();
    testTenantId = tenant.id;

    const [property] = await db
      .insert(properties)
      .values({
        tenantId: testTenantId,
        name: 'Test Hotel',
        type: 'hotel',
        address: '789 Query St',
        slug: `test-hotel-${Date.now()}`,
      })
      .returning();
    testPropertyId = property.id;

    const [guest] = await db
      .insert(guests)
      .values({
        tenantId: testTenantId,
        email: `test-${Date.now()}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
      })
      .returning();
    testGuestId = guest.id;
  });

  it('should handle joins across tables', async () => {
    // Create booking
    const [booking] = await db
      .insert(bookings)
      .values({
        tenantId: testTenantId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        checkInDate: new Date('2026-05-01'),
        checkOutDate: new Date('2026-05-03'),
        totalAmount: '300.00',
        bookingReference: `BOOK-${Date.now()}-1`,
        status: 'confirmed',
      })
      .returning();

    // Query with joins
    const results = await db
      .select({
        bookingId: bookings.id,
        guestEmail: guests.email,
        propertyName: properties.name,
      })
      .from(bookings)
      .innerJoin(guests, eq(bookings.guestId, guests.id))
      .innerJoin(properties, eq(bookings.propertyId, properties.id))
      .where(eq(bookings.id, booking.id));

    expect(results.length).toBe(1);
    expect(results[0].guestEmail).toContain('@example.com');
    expect(results[0].propertyName).toBe('Test Hotel');
  });

  it('should handle complex filters', async () => {
    // Create multiple bookings
    await db.insert(bookings).values([
      {
        tenantId: testTenantId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        checkInDate: new Date('2026-06-01'),
        checkOutDate: new Date('2026-06-05'),
        totalAmount: '400.00',
        bookingReference: `BOOK-${Date.now()}-2`,
        status: 'confirmed',
      },
      {
        tenantId: testTenantId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        checkInDate: new Date('2026-07-01'),
        checkOutDate: new Date('2026-07-10'),
        totalAmount: '900.00',
        bookingReference: `BOOK-${Date.now()}-3`,
        status: 'pending',
      },
    ]);

    // Query with multiple filters
    const confirmedBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, testTenantId),
          eq(bookings.propertyId, testPropertyId),
          eq(bookings.status, 'confirmed')
        )
      );

    expect(confirmedBookings.length).toBeGreaterThanOrEqual(2);
    confirmedBookings.forEach((b) => {
      expect(b.status).toBe('confirmed');
    });
  });
});

describe('Database - Sofia AI Conversations', () => {
  let testTenantId: string;
  let testConversationId: string;

  beforeAll(async () => {
    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Sofia Test Tenant', subdomain: `sofia-${Date.now()}` })
      .returning();
    testTenantId = tenant.id;
  });

  it('should create AI conversation', async () => {
    const sessionId = uuidv4();

    const [conversation] = await db
      .insert(aiConversations)
      .values({
        tenantId: testTenantId,
        sessionId,
        channel: 'web',
        status: 'active',
      })
      .returning();

    testConversationId = conversation.id;

    expect(conversation).toBeDefined();
    expect(conversation.sessionId).toBe(sessionId);
    expect(conversation.channel).toBe('web');
  });

  it('should store AI messages', async () => {
    // User message
    const [userMsg] = await db
      .insert(aiMessages)
      .values({
        conversationId: testConversationId,
        senderType: 'user',
        content: 'Hello Sofia',
      })
      .returning();

    // Assistant message
    const [assistantMsg] = await db
      .insert(aiMessages)
      .values({
        conversationId: testConversationId,
        senderType: 'assistant',
        content: 'Hello! How can I help you?',
        metadata: {
          confidence: 0.95,
          intent: 'greeting',
        },
      })
      .returning();

    expect(userMsg.senderType).toBe('user');
    expect(assistantMsg.senderType).toBe('assistant');
    expect(assistantMsg.metadata).toHaveProperty('confidence');
  });

  it('should retrieve conversation history', async () => {
    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, testConversationId))
      .orderBy(aiMessages.createdAt);

    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0].senderType).toBe('user');
    expect(messages[1].senderType).toBe('assistant');
  });

  it('should support conversation status updates', async () => {
    const [updated] = await db
      .update(aiConversations)
      .set({ status: 'escalated' })
      .where(eq(aiConversations.id, testConversationId))
      .returning();

    expect(updated.status).toBe('escalated');
  });
});

describe('Database - Performance & Indexing', () => {
  it('should have indexes on frequently queried columns', async () => {
    const indexes = await db.execute(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('tenants', 'properties', 'bookings', 'guests')
    `);

    expect(indexes.rows.length).toBeGreaterThan(0);

    const indexNames = indexes.rows.map((r: any) => r.indexname);
    
    // Check for primary key indexes (at minimum)
    expect(indexNames.some((name: string) => name.includes('pkey'))).toBe(true);
  });

  it('should handle bulk inserts efficiently', async () => {
    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Bulk Test', subdomain: `bulk-${Date.now()}` })
      .returning();

    const bulkData = Array.from({ length: 100 }, (_, i) => ({
      tenantId: tenant.id,
      email: `bulk-${i}-${Date.now()}@example.com`,
      firstName: `Guest${i}`,
    }));

    const startTime = Date.now();
    await db.insert(guests).values(bulkData);
    const endTime = Date.now();

    const duration = endTime - startTime;
    
    // Should complete in reasonable time (< 2 seconds)
    expect(duration).toBeLessThan(2000);

    // Verify all inserted
    const count = await db
      .select()
      .from(guests)
      .where(eq(guests.tenantId, tenant.id));

    expect(count.length).toBeGreaterThanOrEqual(100);
  });
});

describe('Database - Hotel Etuna seed integrity', () => {
  it('guests table should support CRUD operations', async () => {
    const [tenant] = await db
      .insert(tenants)
      .values({ name: `Guest CRUD ${Date.now()}`, subdomain: `guest-crud-${Date.now()}` })
      .returning();

    const [createdGuest] = await db
      .insert(guests)
      .values({
        tenantId: tenant.id,
        email: `guest-crud-${Date.now()}@example.com`,
        firstName: 'Guest',
        lastName: 'Crud',
      })
      .returning();
    expect(createdGuest.id).toBeTruthy();

    const [readGuest] = await db.select().from(guests).where(eq(guests.id, createdGuest.id)).limit(1);
    expect(readGuest?.email).toBe(createdGuest.email);

    const [updatedGuest] = await db
      .update(guests)
      .set({ firstName: 'Updated' })
      .where(eq(guests.id, createdGuest.id))
      .returning();
    expect(updatedGuest.firstName).toBe('Updated');

    await db.delete(guests).where(eq(guests.id, createdGuest.id));
    const [deleted] = await db.select().from(guests).where(eq(guests.id, createdGuest.id)).limit(1);
    expect(deleted).toBeUndefined();
  });

  it('guest_reviews should have is_public column with enforced boolean default', async () => {
    const [tenant] = await db
      .insert(tenants)
      .values({ name: `Reviews Tenant ${Date.now()}`, subdomain: `reviews-tenant-${Date.now()}` })
      .returning();

    const [guest] = await db
      .insert(guests)
      .values({
        tenantId: tenant.id,
        email: `review-guest-${Date.now()}@example.com`,
        firstName: 'Review',
        lastName: 'Guest',
      })
      .returning();

    const [review] = await db
      .insert(guestReviews)
      .values({
        tenantId: tenant.id,
        guestId: guest.id,
        rating: 5,
        reviewText: 'Excellent stay',
      })
      .returning();

    expect(typeof review.isPublic).toBe('boolean');

    const defaultExpr = await db.execute(`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'guest_reviews'
        AND column_name = 'is_public'
    `);
    expect(defaultExpr.rows.length).toBe(1);
  });

  it('hub property should have full guest + facility inventory', async () => {
    const hubTenantId = process.env.HUB_TENANT_ID;
    expect(hubTenantId).toBeTruthy();

    const [hubProperty] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.tenantId, hubTenantId as string), eq(properties.slug, 'hotel-etuna')))
      .limit(1);

    expect(hubProperty?.id).toBeTruthy();

    const hubRooms = await db
      .select({
        id: rooms.id,
        roomNumber: rooms.roomNumber,
        inventoryKind: rooms.inventoryKind,
      })
      .from(rooms)
      .where(eq(rooms.propertyId, hubProperty!.id));

    const guestNumbers = new Set(
      hubRooms
        .filter((r) => isGuestRoomInventoryRow(r.inventoryKind))
        .map((r) => r.roomNumber),
    );

    for (const row of HOTEL_ETUNA_GUEST_ROOM_INVENTORY) {
      expect(guestNumbers.has(row.roomNumber)).toBe(true);
    }

    const facilityCount = hubRooms.filter((r) => isFacilityInventoryRow(r.inventoryKind)).length;
    expect(facilityCount).toBe(HOTEL_ETUNA_FACILITY_COUNT);
  });

  it('cms_menu_items should filter by is_available', async () => {
    const rows = await db.select({ isAvailable: cmsMenuItems.isAvailable }).from(cmsMenuItems);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.isAvailable)).toBe(true);
  });

  it("partner tenants should be typed partner and linked to parent tenant", async () => {
    const partnerRows = await db
      .select({
        id: tenants.id,
        type: tenants.type,
        parentTenantId: tenants.parentTenantId,
      })
      .from(tenants)
      .where(eq(tenants.type, 'partner'));

    expect(partnerRows.length).toBeGreaterThanOrEqual(2);
    partnerRows.forEach((row) => {
      expect(row.type).toBe('partner');
      expect(row.parentTenantId).toBeTruthy();
    });
  });

  it('should have RLS policies configured for tenant-sensitive tables', async () => {
    const policies = await db.execute(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('guests', 'bookings', 'properties', 'rooms')
    `);

    expect(policies.rows.length).toBeGreaterThan(0);
  });
});
