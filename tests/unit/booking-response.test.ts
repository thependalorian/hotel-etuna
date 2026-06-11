import { describe, it, expect } from 'vitest';
import { extractBookingId } from '@/lib/bookings/booking-response';

describe('extractBookingId', () => {
  it('reads id from the successResponse envelope', () => {
    expect(extractBookingId({ success: true, data: { id: 'bk_123' } })).toBe('bk_123');
  });

  it('reads id from a bare booking object', () => {
    expect(extractBookingId({ id: 'bk_456' })).toBe('bk_456');
  });

  it('prefers the envelope data.id over a top-level id', () => {
    expect(extractBookingId({ id: 'envelope', data: { id: 'bk_inner' } })).toBe('bk_inner');
  });

  it('returns null when no id is present', () => {
    expect(extractBookingId({ success: true, data: {} })).toBeNull();
    expect(extractBookingId({})).toBeNull();
    expect(extractBookingId(null)).toBeNull();
    expect(extractBookingId(undefined)).toBeNull();
  });

  it('returns null for non-string or empty ids', () => {
    expect(extractBookingId({ data: { id: 123 } })).toBeNull();
    expect(extractBookingId({ id: '' })).toBeNull();
  });
});
