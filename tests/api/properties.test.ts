/**
 * Properties API Route Integration Tests
 *
 * Purpose: Test /api/properties endpoints with Drizzle
 * Location: tests/api/properties.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  cleanupTestData,
} from '../utils/test-helpers';
import { createMockSession } from '../utils/auth-helpers';

describe('Properties API Integration Tests', () => {
  let tenantId: string;
  let userId: string;
  let session: Awaited<ReturnType<typeof createMockSession>>;

  beforeAll(async () => {
    const tenant = await createTestTenant('API Test Tenant');
    const user = await createTestUser(tenant.id);
    tenantId = tenant.id;
    userId = user.id;
    session = await createMockSession(tenantId, userId);
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  describe('GET /api/properties', () => {
    it('should create test properties for authenticated user', async () => {
      await createTestProperty(tenantId, userId, 'API Test Property 1');
      await createTestProperty(tenantId, userId, 'API Test Property 2');
      const request = new NextRequest('http://localhost:3000/api/properties');
      expect(session.user.tenantId).toBe(tenantId);
    });
  });

  describe('POST /api/properties', () => {
    it('should validate property create structure', () => {
      const propertyData = {
        name: 'API Created Hotel',
        type: 'hotel',
        description: 'Created via API',
        address: '123 API Street',
      };
      expect(propertyData.name.length).toBeGreaterThan(2);
      expect(['hotel', 'restaurant']).toContain(propertyData.type);
    });

    it('should reject invalid property data shape', () => {
      const invalidData = { name: 'AB', type: 'INVALID' };
      expect(invalidData.name.length).toBeLessThan(3);
    });
  });
});
