import { describe, expect, it } from 'vitest';
import {
  formatPublicRoomRateLabel,
  stripRatesFromAvailabilityRow,
} from '@/lib/rooms/public-rate';

describe('public-rate', () => {
  it('masks numeric rates for guests', () => {
    expect(
      formatPublicRoomRateLabel({ priceFrom: '2500', currency: 'NAD' }, false),
    ).toBe('Sign in to view rates');
  });

  it('formats rates for signed-in users', () => {
    expect(
      formatPublicRoomRateLabel({ priceFrom: '2500', currency: 'NAD' }, true),
    ).toBe('NAD 2,500');
  });

  it('strips baseRate from availability rows for guests', () => {
    const row = stripRatesFromAvailabilityRow({
      id: '1',
      roomType: 'Standard',
      baseRate: '1200',
    });
    expect(row).not.toHaveProperty('baseRate');
    expect(row.id).toBe('1');
  });
});
