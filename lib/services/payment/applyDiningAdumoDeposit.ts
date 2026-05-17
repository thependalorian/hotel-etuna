/**
 * Confirm dining reservation after Adumo Virtual success; optional folio link for in-stay guests.
 * Location: lib/services/payment/applyDiningAdumoDeposit.ts
 */

import { db } from '@/lib/db';
import {
  bookingCharges,
  bookings,
  diningReservations,
  guests,
  paymentSessions,
  restaurants,
  transactions,
} from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { adumoConfig } from '@/lib/config/adumo';

export async function applyDiningAdumoDeposit(
  session: typeof paymentSessions.$inferSelect,
  gatewayId: string,
  amount: number,
  paymentMetadata: Record<string, unknown>
): Promise<void> {
  if (!session.diningReservationId) {
    throw new Error('Dining payment session missing dining_reservation_id');
  }

  const [reservation] = await db
    .select()
    .from(diningReservations)
    .where(eq(diningReservations.id, session.diningReservationId))
    .limit(1);

  if (!reservation) {
    throw new Error('Dining reservation not found');
  }

  const now = new Date();
  const txRef = `ADU-DR-${gatewayId.slice(0, 20)}`;
  const meta = (reservation.metadata ?? {}) as Record<string, unknown>;
  const stayBookingId =
    typeof meta.stay_booking_id === 'string' ? meta.stay_booking_id : undefined;

  await db.transaction(async (tx) => {
    await tx
      .update(diningReservations)
      .set({
        status: 'confirmed',
        paymentSessionId: session.id,
        updatedAt: now,
      })
      .where(eq(diningReservations.id, reservation.id));

    await tx.insert(transactions).values({
      tenantId: session.tenantId,
      bookingId: stayBookingId ?? null,
      guestId: reservation.guestId,
      transactionReference: txRef,
      type: 'dining_deposit',
      amount: amount.toFixed(2),
      currency: adumoConfig.currencyCode,
      status: 'completed',
      paymentGateway: 'adumo_virtual',
      gatewayTransactionId: gatewayId,
      description: `Restaurant reservation ${reservation.bookingCode} (Adumo)`,
      metadata: {
        merchantReference: session.merchantReference,
        diningReservationId: reservation.id,
        bookingCode: reservation.bookingCode,
        ...paymentMetadata,
      },
      processedAt: now,
    });

    if (stayBookingId) {
      const [stay] = await tx
        .select({ id: bookings.id, status: bookings.status, tenantId: bookings.tenantId, currency: bookings.currency })
        .from(bookings)
        .where(eq(bookings.id, stayBookingId))
        .limit(1);

      if (stay?.status === 'checked_in' && stay.tenantId) {
        await tx.insert(bookingCharges).values({
          tenantId: stay.tenantId,
          bookingId: stay.id,
          chargeType: 'payment',
          description: `Restaurant reservation ${reservation.bookingCode} deposit (Adumo)`,
          amount: (-amount).toFixed(2),
          currency: stay.currency ?? adumoConfig.currencyCode,
          status: 'settled',
          settledAt: now,
          referenceId: reservation.id,
        });
      }
    }
  });
}

export async function loadDiningRecipientName(reservationId: string): Promise<string> {
  const [row] = await db
    .select({
      firstName: guests.firstName,
      lastName: guests.lastName,
      restaurantName: restaurants.name,
    })
    .from(diningReservations)
    .leftJoin(guests, eq(diningReservations.guestId, guests.id))
    .innerJoin(restaurants, eq(diningReservations.restaurantId, restaurants.id))
    .where(eq(diningReservations.id, reservationId))
    .limit(1);

  const name = [row?.firstName, row?.lastName].filter(Boolean).join(' ');
  return name || row?.restaurantName || 'Guest';
}
