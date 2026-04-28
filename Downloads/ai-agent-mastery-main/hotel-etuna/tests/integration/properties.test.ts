/**
 * Property Service Integration Tests
 * 
 * Purpose: Test PropertyService with actual database
 * Location: /tests/integration/properties.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PropertyService } from '@/lib/services/property/PropertyService';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  cleanupTestData,
} from '../utils/test-helpers';
import { setTenantContext } from '@/lib/db';

describe('PropertyService Integration Tests', () => {
  let tenantId: string;
  let userId: string;
  let propertyService: PropertyService;

  beforeAll(async () => {
    const tenant = await createTestTenant('Test Property Tenant');
    const user = await createTestUser(tenant.id);
    tenantId = tenant.id;
    userId = user.id;
    propertyService = new PropertyService();
    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData(tenantId);
  });

  describe('createProperty', () => {
    it('should create a new property successfully', async () => {
      const propertyData = {
        name: 'Test Hotel',
        type: 'HOTEL' as const,
        description: 'A test hotel',
        address: '123 Test Street',
        ownerId: userId,
        tenantId: tenantId,
      };

      const property = await propertyService.createProperty(propertyData);

      expect(property).toBeDefined();
      expect(property.id).toBeDefined();
      expect(property.name).toBe(propertyData.name);
      // Database stores type as lowercase per constraint, but returns it
      expect(property.type?.toUpperCase()).toBe(propertyData.type);
      expect((property as { tenant_id?: string; tenantId?: string }).tenant_id ?? (property as { tenantId?: string }).tenantId).toBe(tenantId);
      expect(property.slug).toBeDefined();
    });

    it('should generate unique slugs for properties with same name', async () => {
      const propertyData = {
        name: 'Duplicate Name Hotel',
        type: 'HOTEL' as const,
        description: 'First hotel',
        address: '123 Test Street',
        ownerId: userId,
        tenantId: tenantId,
      };

      const property1 = await propertyService.createProperty(propertyData);
      const property2 = await propertyService.createProperty(propertyData);

      expect(property1.slug).not.toBe(property2.slug);
      expect(property2.slug).toContain('duplicate-name-hotel');
    });
  });

  describe('getPropertiesByTenant', () => {
    it('should return all properties for a tenant', async () => {
      // Create multiple properties
      await createTestProperty(tenantId, userId, 'Property 1');
      await createTestProperty(tenantId, userId, 'Property 2');
      await createTestProperty(tenantId, userId, 'Property 3');

      const properties = await propertyService.getPropertiesByTenant(tenantId);

      expect(properties.length).toBeGreaterThanOrEqual(3);
      properties.forEach((property) => {
        expect((property as { tenant_id?: string; tenantId?: string }).tenant_id ?? (property as { tenantId?: string }).tenantId).toBe(tenantId);
      });
    });

    it('should return empty array for tenant with no properties', async () => {
      const emptyTenant = await createTestTenant('Empty Tenant');
      const properties = await propertyService.getPropertiesByTenant(emptyTenant.id);
      expect(properties).toEqual([]);
      
      // Cleanup
      await cleanupTestData(emptyTenant.id);
    });
  });

  describe('getPropertyById', () => {
    it('should return property by ID when it exists', async () => {
      const property = await createTestProperty(tenantId, userId, 'Find Me Hotel');

      const found = await propertyService.getPropertyById(property.id, tenantId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(property.id);
      expect(found?.name).toBe('Find Me Hotel');
    });

    it('should return null when property does not exist', async () => {
      const found = await propertyService.getPropertyById('non-existent-id', tenantId);
      expect(found).toBeNull();
    });

    it('should return null when property belongs to different tenant', async () => {
      const otherTenant = await createTestTenant('Other Tenant');
      const otherUser = await createTestUser(otherTenant.id);
      const otherProperty = await createTestProperty(otherTenant.id, otherUser.id, 'Other Property');

      const found = await propertyService.getPropertyById(otherProperty.id, tenantId);
      expect(found).toBeNull();

      // Cleanup
      await cleanupTestData(otherTenant.id);
    });
  });

  describe('updateProperty', () => {
    it('should update property successfully', async () => {
      const property = await createTestProperty(tenantId, userId, 'Update Me Hotel');

      const updated = await propertyService.updateProperty(property.id, tenantId, {
        name: 'Updated Hotel Name',
        description: 'Updated description',
        address: '456 Updated Street',
      });

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated Hotel Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.address).toBe('456 Updated Street');
    });

    it('should throw error when updating non-existent property', async () => {
      await expect(
        propertyService.updateProperty('non-existent-id', tenantId, {
          name: 'Updated Name',
          address: 'Updated Address',
        })
      ).rejects.toThrow();
    });
  });

  describe('getPropertyBySlug', () => {
    it('should return property by slug', async () => {
      const property = await createTestProperty(tenantId, userId, 'Slug Test Hotel');

      const found = await propertyService.getPropertyBySlug(property.slug);

      expect(found).toBeDefined();
      expect(found?.id).toBe(property.id);
      expect(found?.slug).toBe(property.slug);
    });
  });
});
