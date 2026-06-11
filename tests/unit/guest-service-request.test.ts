import { describe, expect, it } from 'vitest';
import {
  GUEST_REQUEST_CATALOG,
  defaultPriority,
  housekeepingTaskType,
  spawnsHousekeepingTask,
} from '@/lib/services/guest/guest-service-request-mapping';
import { guestServiceRequestSchema } from '@/lib/utils/validation';

describe('guest service request mapping', () => {
  it('spawns a staff task for housekeeping and maintenance only', () => {
    expect(spawnsHousekeepingTask('housekeeping')).toBe(true);
    expect(spawnsHousekeepingTask('maintenance')).toBe(true);
    expect(spawnsHousekeepingTask('amenity')).toBe(false);
    expect(spawnsHousekeepingTask('other')).toBe(false);
  });

  it('escalates safety-relevant maintenance to urgent', () => {
    expect(defaultPriority('maintenance', 'no_hot_water')).toBe('urgent');
    expect(defaultPriority('maintenance', 'plumbing')).toBe('urgent');
    expect(defaultPriority('maintenance', 'tv_wifi')).toBe('high');
    expect(defaultPriority('housekeeping', 'extra_towels')).toBe('normal');
    expect(defaultPriority('amenity', null)).toBe('normal');
  });

  it('namespaces task_type and stays within the column limit', () => {
    expect(housekeepingTaskType('housekeeping', 'extra_towels')).toBe('guest_housekeeping:extra_towels');
    expect(housekeepingTaskType('maintenance', null)).toBe('guest_maintenance');
    expect(housekeepingTaskType('other', 'x'.repeat(200)).length).toBeLessThanOrEqual(100);
  });

  it('every catalog entry exposes at least one category', () => {
    for (const entry of Object.values(GUEST_REQUEST_CATALOG)) {
      expect(entry.categories.length).toBeGreaterThan(0);
    }
  });
});

describe('guestServiceRequestSchema', () => {
  it('accepts a valid category-only request (happy path)', () => {
    const result = guestServiceRequestSchema.safeParse({
      requestType: 'housekeeping',
      category: 'extra_towels',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a description-only maintenance report (edge case)', () => {
    const result = guestServiceRequestSchema.safeParse({
      requestType: 'maintenance',
      description: 'No hot water in the shower',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a request with neither category nor description (failure case)', () => {
    const result = guestServiceRequestSchema.safeParse({ requestType: 'amenity' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown request type', () => {
    const result = guestServiceRequestSchema.safeParse({
      requestType: 'roomservice',
      category: 'pizza',
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than five photos', () => {
    const result = guestServiceRequestSchema.safeParse({
      requestType: 'maintenance',
      description: 'leak',
      photos: Array.from({ length: 6 }, (_, i) => `https://x/${i}.jpg`),
    });
    expect(result.success).toBe(false);
  });
});
