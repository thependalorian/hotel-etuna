import { describe, expect, it } from 'vitest';
import { expandBookingDateStrings } from '@/lib/bookings/booking-kind';
import {
  calculateCampsiteTotal,
  calculateConferenceTotal,
  campsiteGuestTotal,
} from '@/lib/services/booking/FacilityBookingPricing';

describe('FacilityBookingPricing', () => {
  it('conference session is N$1200', () => {
    expect(calculateConferenceTotal()).toBe(1200);
  });

  it('campsite uses site minimum when per-person sum is lower', () => {
    expect(calculateCampsiteTotal({ namibianGuests: 2, nonNamibianGuests: 0 })).toBe(1200);
  });

  it('campsite sums per-person when above minimum', () => {
    expect(calculateCampsiteTotal({ namibianGuests: 2, nonNamibianGuests: 4 })).toBe(2100);
  });

  it('campsiteGuestTotal adds both cohorts', () => {
    expect(campsiteGuestTotal({ namibianGuests: 3, nonNamibianGuests: 2 })).toBe(5);
  });

  it('calendar expansion matches booking-kind helper for conference', () => {
    expect(
      expandBookingDateStrings('2026-07-01', '2026-07-01', 'conference')
    ).toHaveLength(1);
  });
});
