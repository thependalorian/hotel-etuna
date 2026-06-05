import { describe, expect, it } from 'vitest';
import {
  normalizeBookingKind,
  isAccommodationBookingKind,
  isFacilityBookingKind,
  bookingKindLabel,
  bookingKindBadgeClass,
  expandBookingDateStrings,
  checkInDateLabel,
} from '@/lib/bookings/booking-kind';

describe('booking-kind helpers', () => {
  it('normalizes null/legacy to accommodation', () => {
    expect(normalizeBookingKind(null)).toBe('accommodation');
    expect(normalizeBookingKind(undefined)).toBe('accommodation');
    expect(isAccommodationBookingKind(null)).toBe(true);
  });

  it('labels and badges for facility kinds', () => {
    expect(bookingKindLabel('conference')).toBe('Conference');
    expect(bookingKindLabel('campsite')).toBe('Campsite');
    expect(bookingKindBadgeClass('conference')).toContain('badge-info');
    expect(isFacilityBookingKind('conference')).toBe(true);
    expect(isFacilityBookingKind('accommodation')).toBe(false);
  });

  it('conference same-day expands to one calendar day', () => {
    expect(
      expandBookingDateStrings('2026-06-10', '2026-06-10', 'conference')
    ).toEqual(['2026-06-10']);
  });

  it('accommodation multi-night expands each night', () => {
    expect(
      expandBookingDateStrings('2026-06-10', '2026-06-12', 'accommodation')
    ).toEqual(['2026-06-10', '2026-06-11']);
  });

  it('uses session date label for conference', () => {
    expect(checkInDateLabel('conference')).toBe('Session date');
    expect(checkInDateLabel('accommodation')).toBe('Check-in');
  });
});
