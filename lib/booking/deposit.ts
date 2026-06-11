/**
 * Booking deposit helpers — single source for deposit % and payable amount.
 * Location: lib/booking/deposit.ts
 */

export const DEFAULT_BOOKING_DEPOSIT_PERCENT = Number(
  process.env.BOOKING_DEPOSIT_PERCENT ?? 30
);

export function computeBookingDepositAmount(
  totalAmount: number,
  depositPercent: number = DEFAULT_BOOKING_DEPOSIT_PERCENT
): number {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return 0;
  const pct = Math.min(100, Math.max(0, depositPercent));
  return Math.round(((totalAmount * pct) / 100) * 100) / 100;
}

type BookingDepositSource = {
  totalAmount: string | number;
  depositPercent?: string | number | null;
  pricingDetails?: unknown;
};

export function resolveBookingDepositAmount(booking: BookingDepositSource): number {
  const details =
    booking.pricingDetails && typeof booking.pricingDetails === 'object'
      ? (booking.pricingDetails as Record<string, unknown>)
      : null;

  if (details?.depositAmount != null) {
    const parsed = Number.parseFloat(String(details.depositAmount));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const total = Number.parseFloat(String(booking.totalAmount));
  const percent = Number(
    booking.depositPercent ?? details?.depositPercent ?? DEFAULT_BOOKING_DEPOSIT_PERCENT
  );
  return computeBookingDepositAmount(total, percent);
}

export function withDepositPricingDetails(
  pricingDetails: Record<string, unknown> | undefined,
  totalAmount: number,
  depositPercent: number = DEFAULT_BOOKING_DEPOSIT_PERCENT
): Record<string, unknown> {
  const depositAmount = computeBookingDepositAmount(totalAmount, depositPercent);
  return {
    ...(pricingDetails ?? {}),
    depositPercent,
    depositAmount,
  };
}
