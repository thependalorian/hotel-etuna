/**
 * Start Adumo Virtual deposit for a dining reservation (Namibia — no Stripe).
 * POST body: { bookingCode, returnSuccessUrl?, returnFailUrl? }
 * Response: { data: { actionUrl, fields, merchantReference } }
 * Location: app/api/restaurant/reservations/pay/initiate/route.ts
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { diningReservations, paymentSessions, restaurants } from '@/lib/db/schema';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { AdumoVirtualService } from '@/lib/services/payment/AdumoVirtualService';
import { loadDiningRecipientName } from '@/lib/services/payment/applyDiningAdumoDeposit';

const schema = z.object({
  bookingCode: z.string().min(4).max(12),
  returnSuccessUrl: z.string().url().optional(),
  returnFailUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!AdumoVirtualService.isConfigured()) {
        return errorResponse(
          'Adumo Virtual is not configured (ADUMO_MERCHANT_UID, ADUMO_APPLICATION_UID, ADUMO_JWT_SECRET)',
          503,
          'ADUMO_NOT_CONFIGURED'
        );
      }

      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }

      const code = parsed.data.bookingCode.trim().toUpperCase();
      const [reservation] = await db
        .select({
          reservation: diningReservations,
          restaurantName: restaurants.name,
        })
        .from(diningReservations)
        .innerJoin(restaurants, eq(diningReservations.restaurantId, restaurants.id))
        .where(
          and(eq(diningReservations.tenantId, user.tenantId), eq(diningReservations.bookingCode, code))
        )
        .limit(1);

      if (!reservation) {
        return errorResponse('Reservation not found', 404, 'NOT_FOUND');
      }

      const row = reservation.reservation;
      if (row.status === 'confirmed') {
        return errorResponse('Deposit already paid', 400, 'ALREADY_PAID');
      }
      if (row.status === 'cancelled') {
        return errorResponse('Reservation was cancelled', 400, 'CANCELLED');
      }

      const amount = row.depositCents / 100;
      if (amount <= 0) {
        return errorResponse('Invalid deposit amount', 400, 'INVALID_AMOUNT');
      }

      const merchantReference = AdumoVirtualService.buildDiningMerchantReference(row.id);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const [session] = await db
        .insert(paymentSessions)
        .values({
          tenantId: user.tenantId,
          merchantReference,
          diningReservationId: row.id,
          amount: amount.toFixed(2),
          purpose: 'dining_deposit',
          beneficiary: 'property',
          status: 'pending',
          sessionData: {
            returnSuccessUrl: parsed.data.returnSuccessUrl,
            returnFailUrl: parsed.data.returnFailUrl,
            userId: user.id,
            bookingCode: code,
          },
          expiresAt,
        })
        .returning({ id: paymentSessions.id });

      if (session?.id) {
        await db
          .update(diningReservations)
          .set({ paymentSessionId: session.id, updatedAt: new Date() })
          .where(eq(diningReservations.id, row.id));
      }

      const recipient = await loadDiningRecipientName(row.id);
      const form = AdumoVirtualService.buildFormPayload({
        amount,
        merchantReference,
        recipientName: recipient,
        orderDescription: `Table reservation ${code} — ${reservation.restaurantName}`,
        variable1: row.id,
        redirectSuccessUrl: parsed.data.returnSuccessUrl,
        redirectFailedUrl: parsed.data.returnFailUrl,
      });

      return successResponse({
        actionUrl: form.actionUrl,
        fields: form.fields,
        merchantReference,
        bookingCode: code,
        amount,
        currency: row.currency,
      });
    },
    { rateLimit: true }
  );
}
