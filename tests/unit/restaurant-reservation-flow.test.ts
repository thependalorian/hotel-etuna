import { describe, expect, it } from 'vitest';
import { RestaurantReservationFlowService } from '@/lib/services/sofia/RestaurantReservationFlowService';

describe('RestaurantReservationFlowService.mergeSlotsFromMessage', () => {
  const svc = new RestaurantReservationFlowService();

  it('parses party size, date, and time', () => {
    const state = svc.mergeSlotsFromMessage(
      undefined,
      'Table for 4 on 2026-06-01 at 7pm please'
    );
    expect(state.partySize).toBe(4);
    expect(state.reservationDate).toBe('2026-06-01');
    expect(state.reservationTime).toBe('19:00');
    expect(state.depositCents).toBe(10000);
  });

  it('marks ready for deposit when slots complete', () => {
    const state = svc.mergeSlotsFromMessage(
      { flow: 'restaurant_reservation', partySize: 2, reservationDate: '2026-07-04', reservationTime: '18:30', depositCents: 5000 },
      'sounds good'
    );
    expect(svc.isReadyForDeposit(state)).toBe(true);
  });
});
