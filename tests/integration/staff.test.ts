/**
 * Staff Service Integration Tests
 * 
 * Purpose: Test StaffService with actual database
 * Location: /tests/integration/staff.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StaffService } from '@/lib/services/staff/StaffService';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  createTestStaff,
  cleanupTestData,
} from '../utils/test-helpers';
import { setTenantContext } from '@/lib/db';

describe('StaffService Integration Tests', () => {
  let tenantId: string;
  let _userId: string;
  let propertyId: string;
  let staffService: StaffService;

  beforeAll(async () => {
    const tenant = await createTestTenant('Test Staff Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Test Hotel');

    tenantId = tenant.id;
    _userId = user.id;
    propertyId = property.id;
    staffService = new StaffService();
    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  describe('createStaff', () => {
    it('should create a staff member successfully', async () => {
      const staff = await staffService.createStaff(tenantId, {
        propertyId: propertyId,
        firstName: 'John',
        lastName: 'Doe',
        email: `john-${Date.now()}@test.com`,
        phone: '+264123456789',
        position: 'Manager',
        department: 'Management',
        hireDate: new Date(),
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
      });

      expect(staff).toBeDefined();
      expect(staff.id).toBeDefined();
      expect(staff.firstName).toBe('John');
      expect(staff.lastName).toBe('Doe');
      expect(staff.tenantId).toBe(tenantId);
      expect(staff.propertyId).toBe(propertyId);
    });
  });

  describe('getStaffByTenant', () => {
    it('should return all staff for a tenant', async () => {
      // Create multiple staff members
      await createTestStaff(tenantId, propertyId, `staff1-${Date.now()}@test.com`);
      await createTestStaff(tenantId, propertyId, `staff2-${Date.now()}@test.com`);
      await createTestStaff(tenantId, propertyId, `staff3-${Date.now()}@test.com`);

      const staff = await staffService.getStaffByTenant(tenantId);

      expect(staff.length).toBeGreaterThanOrEqual(3);
      staff.forEach((member) => {
        expect(member.tenantId).toBe(tenantId);
      });
    });

    it('should filter staff by department', async () => {
      await createTestStaff(tenantId, propertyId, `dept1-${Date.now()}@test.com`);

      const staff = await staffService.getStaffByTenant(tenantId, {
        department: 'Management',
      });

      staff.forEach((member) => {
        expect(member.department).toBe('Management');
      });
    });

    it('should search staff by name or email', async () => {
      await createTestStaff(tenantId, propertyId, `search-${Date.now()}@test.com`);

      const staff = await staffService.getStaffByTenant(tenantId, {
        search: 'Test',
      });

      expect(staff.length).toBeGreaterThan(0);
    });
  });

  describe('getStaffStats', () => {
    it('should return staff statistics', async () => {
      // Create staff with different statuses
      await createTestStaff(tenantId, propertyId, `active-${Date.now()}@test.com`);
      await createTestStaff(tenantId, propertyId, `active2-${Date.now()}@test.com`);

      const stats = await staffService.getStaffStats(tenantId);

      expect(stats).toBeDefined();
      expect(stats.totalStaff).toBeGreaterThan(0);
      expect(stats.activeStaff).toBeGreaterThanOrEqual(0);
      expect(stats.byDepartment).toBeDefined();
    });
  });

  describe('getStaff', () => {
    it('should return all staff for a tenant', async () => {
      await createTestStaff(tenantId, propertyId, `get-${Date.now()}@test.com`);

      const staff = await staffService.getStaff(tenantId);

      expect(staff.length).toBeGreaterThan(0);
      staff.forEach((member) => {
        expect(member.tenantId).toBe(tenantId);
      });
    });
  });
});
