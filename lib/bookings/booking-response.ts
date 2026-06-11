/**
 * Booking API response helpers.
 *
 * Location: lib/bookings/booking-response.ts
 *
 * Reason: `POST /api/bookings` returns the `successResponse` envelope
 * (`{ success: true, data: booking }`), but some callers historically read `.id`
 * off the envelope and got `undefined` — sending guests to a broken deposit page.
 * Centralising the parse keeps every booking → deposit redirect correct (DRY).
 */

/** Minimal shape we read a booking id out of (envelope or bare booking). */
interface BookingIdCarrier {
  id?: unknown;
  data?: { id?: unknown } | null;
}

/**
 * Extract a booking id from a `/api/bookings` JSON payload.
 *
 * Accepts the `successResponse` envelope (`{ data: { id } }`) or a bare booking
 * object (`{ id }`).
 *
 * @param payload - Parsed JSON body from a booking create/read response.
 * @returns The booking id as a string, or `null` if none is present.
 */
export function extractBookingId(payload: unknown): string | null {
  const carrier = payload as BookingIdCarrier | null | undefined;
  const id = carrier?.data?.id ?? carrier?.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}
