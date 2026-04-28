/**
 * Test Helpers & Fixtures
 * 
 * Utilities for creating valid test data with proper foreign key relationships
 */

import { db } from '@/lib/db';
import { tenants, users, properties, guests } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

interface TestTenant {
  id: string;
  name: string;
}

interface TestProperty {
  id: string;
  tenantId: string;
  name: string;
  type: string;
}

interface TestGuest {
  id: string;
  tenantId: string;
  email: string;
}

/**
 * Create a valid test tenant in the database
 */
export async function createTestTenant(name?: string): Promise<TestTenant> {
  const timestamp = Date.now();
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: name || `Test Tenant ${timestamp}`,
      subdomain: `test-tenant-${timestamp}`,
      subscriptionTier: 'starter',
    })
    .returning();

  return tenant;
}

/**
 * Create a valid test property in the database
 */
export async function createTestProperty(
  tenantId: string,
  name?: string
): Promise<TestProperty> {
  const timestamp = Date.now();
  const [property] = await db
    .insert(properties)
    .values({
      tenantId,
      name: name || `Test Property ${timestamp}`,
      slug: `test-property-${timestamp}`,
      type: 'hotel',
      address: '123 Test Street',
      city: 'Test City',
    })
    .returning();

  return {
    id: property.id,
    tenantId,
    name: property.name,
    type: property.type,
  };
}

/**
 * Create a valid test guest in the database
 */
export async function createTestGuest(
  tenantId: string,
  email?: string
): Promise<TestGuest> {
  const [guest] = await db
    .insert(guests)
    .values({
      tenantId,
      email: email || `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    })
    .returning();

  return {
    id: guest.id,
    tenantId,
    email: guest.email,
  };
}

/**
 * Create a complete test context (tenant + property + guest)
 */
export async function createTestContext() {
  const tenant = await createTestTenant();
  const property = await createTestProperty(tenant.id);
  const guest = await createTestGuest(tenant.id);

  return {
    tenant,
    property,
    guest,
  };
}

/**
 * Clean up test data by tenant ID
 */
export async function cleanupTestTenant(tenantId: string) {
  // Delete in reverse order of dependencies
  await db.delete(guests).where(eq(guests.tenantId, tenantId));
  await db.delete(properties).where(eq(properties.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

/**
 * Generate valid UUID (for mocking purposes)
 */
export function generateTestUUID(): string {
  return uuidv4();
}

/**
 * Generate valid session ID
 */
export function generateSessionId(): string {
  return uuidv4();
}
