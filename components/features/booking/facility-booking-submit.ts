/**
 * Shared facility-booking submit flow for campsite and conference forms.
 * Location: components/features/booking/facility-booking-submit.ts
 */

import { apiUrl } from '@/lib/utils/api-url';
import { extractBookingId } from '@/lib/bookings/booking-response';

type SubmitFacilityBookingParams = {
  payload: Record<string, unknown>;
  redirectTo?: string;
};

type SubmitFacilityBookingResult =
  | { ok: true; nextPath: string }
  | { ok: false; error: string };

export async function submitFacilityBooking({
  payload,
  redirectTo,
}: SubmitFacilityBookingParams): Promise<SubmitFacilityBookingResult> {
  try {
    const response = await fetch(apiUrl('/api/bookings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error =
        typeof (data as { message?: unknown }).message === 'string'
          ? (data as { message: string }).message
          : typeof (data as { error?: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not create booking.';
      return { ok: false, error };
    }

    const bookingId = extractBookingId(data);
    if (redirectTo) {
      return { ok: true, nextPath: bookingId ? `/bookings/${bookingId}` : redirectTo };
    }
    if (bookingId) {
      return { ok: true, nextPath: `/payment/booking-deposit?bookingId=${bookingId}` };
    }
    return { ok: true, nextPath: '/bookings' };
  } catch {
    return { ok: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

