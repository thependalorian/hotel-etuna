/**
 * Dining reservation confirm/cancel (OTP-verified cancel; Adumo for deposits in Namibia).
 * Location: lib/services/sofia/DiningReservationService.ts
 */

import { and, eq } from 'drizzle-orm';
import { db, diningReservations } from '@/lib/db';
import { hashOtp } from '@/lib/services/sofia/RestaurantReservationFlowService';

export class DiningReservationService {
  async cancelWithOtp(tenantId: string, bookingCode: string, otp: string): Promise<{ ok: boolean; error?: string }> {
    const code = bookingCode.trim().toUpperCase();
    const [row] = await db
      .select()
      .from(diningReservations)
      .where(and(eq(diningReservations.tenantId, tenantId), eq(diningReservations.bookingCode, code)))
      .limit(1);

    if (!row) return { ok: false, error: 'BOOKING_NOT_FOUND' };
    if (row.status === 'cancelled') return { ok: false, error: 'ALREADY_CANCELLED' };
    if (!row.otpHash || !row.otpExpiresAt) return { ok: false, error: 'OTP_NOT_CONFIGURED' };
    if (row.otpExpiresAt < new Date()) return { ok: false, error: 'OTP_EXPIRED' };
    if (row.otpHash !== hashOtp(otp.trim())) return { ok: false, error: 'INVALID_OTP' };

    await db
      .update(diningReservations)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(diningReservations.id, row.id));

    return { ok: true };
  }

  /** Staff-only manual confirm when Adumo webhook/redirect already processed elsewhere */
  async confirmDepositManual(
    tenantId: string,
    bookingCode: string,
    adumoTransactionIndex?: string
  ): Promise<{ ok: boolean; error?: string }> {
    const code = bookingCode.trim().toUpperCase();
    const [row] = await db
      .select({ id: diningReservations.id, status: diningReservations.status })
      .from(diningReservations)
      .where(and(eq(diningReservations.tenantId, tenantId), eq(diningReservations.bookingCode, code)))
      .limit(1);

    if (!row) return { ok: false, error: 'BOOKING_NOT_FOUND' };
    if (row.status === 'cancelled') return { ok: false, error: 'CANCELLED' };

    await db
      .update(diningReservations)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
        metadata: adumoTransactionIndex
          ? { adumoTransactionIndex }
          : undefined,
      })
      .where(eq(diningReservations.id, row.id));

    return { ok: true };
  }
}
