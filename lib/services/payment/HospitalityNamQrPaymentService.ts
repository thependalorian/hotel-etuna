/**
 * Hospitality NamQR — payee-presented QR for Hotel Etuna (BoN v5.0).
 * Location: lib/services/payment/HospitalityNamQrPaymentService.ts
 */

import { NamQRService } from '@/lib/services/openbanking/NamQRService';
import {
  HOTEL_ETUNA_SETTLEMENT,
  settlementProfileForParty,
} from '@/lib/platform/settlement-accounts';
import { getHotelEtunaNamraRegistration } from '@/lib/platform/namibia-tax';
import { MCC_HOTEL } from '@/lib/services/qr/namqr-core';
import { PaymentGatewayLabel } from '@/lib/payments/namibia-payment-rails';
import { settleOffPlatformFolio } from '@/lib/services/payment/settleOffPlatformFolio';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { schedulePaymentReceiptEmail } from '@/lib/services/booking/bookingLifecycleSideEffects';
import {
  db,
  bookings,
  namqrCodes,
  namqrPendingConfirmations,
  eq,
  and,
  desc,
} from '@/lib/db';
import { AppError } from '@/lib/utils/errors';
import { FolioService } from '@/lib/services/folio/FolioService';

/** Guest-facing receipt label for NamQR desk / bank-app settlement */
export const NAMQR_RECEIPT_PAYMENT_METHOD = 'NamQR (bank app)';

/** Nedbank payee alias for NRTC tag 17 payloads */
export const HOTEL_ETUNA_NAMQR_PAYEE_ID = `${HOTEL_ETUNA_SETTLEMENT.accountNumber}@nedbank.na`;

export class HospitalityNamQrPaymentService {
  static async generateDeskQr(input: {
    tenantId: string;
    propertyId?: string;
    bookingId?: string;
    amount?: number;
    guestId?: string;
    purpose?: string;
  }) {
    const profile = settlementProfileForParty('property');
    const reg = getHotelEtunaNamraRegistration();
    const isDynamic = input.amount != null && input.amount > 0;

    const result = await NamQRService.generateQR({
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      guestId: input.guestId,
      qrType: isDynamic ? 'dynamic' : 'static',
      presentationMode: 'payee_presented',
      payeeIdentifier: HOTEL_ETUNA_NAMQR_PAYEE_ID,
      payeeName: reg.namraLegalName,
      payeeAccountType: 'bank',
      payeeAccountNumber: profile.accountNumber,
      merchantCategoryCode: MCC_HOTEL,
      merchantName: reg.tradeName,
      merchantCity: 'Ongwediva',
      merchantPostalCode: '9000',
      merchantId: profile.profileKey,
      amount: input.amount,
      currency: 'NAD',
      paymentStream: 'NRTC',
      expiryMinutes: isDynamic ? 30 : undefined,
    });

    return {
      ...result,
      settlement: {
        legalName: profile.legalName,
        bankName: profile.bankName,
        accountNumber: profile.accountNumber,
        branchCode: profile.branchCode,
        swiftCode: profile.swiftCode,
      },
      bookingId: input.bookingId,
    };
  }

  static async confirmDeskPayment(input: {
    bookingId: string;
    tenantId: string;
    amountPaid: number;
    bankReference: string;
    qrReference?: string;
    userId?: string;
  }) {
    const settlement = await settleOffPlatformFolio({
      bookingId: input.bookingId,
      amountPaid: input.amountPaid,
      bankReference: input.bankReference,
      rail: 'namqr',
      userId: input.userId,
      extraMetadata: {
        namqrRef: input.qrReference,
        settlementAccount: HOTEL_ETUNA_SETTLEMENT.accountNumber,
      },
    });

    if (input.qrReference) {
      await db
        .update(namqrCodes)
        .set({ scanCount: 1, updatedAt: new Date() })
        .where(eq(namqrCodes.qrReference, input.qrReference));
    }

    await recordAuditTrail({
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      action: 'namqr_payment_confirmed',
      resourceType: 'booking',
      resourceId: input.bookingId,
      newValues: {
        amountPaid: input.amountPaid,
        bankReference: input.bankReference,
        qrReference: input.qrReference,
        folioClosed: settlement.folioClosed,
      },
    });

    const [bookingRow] = await db
      .select({
        guestId: bookings.guestId,
        propertyId: bookings.propertyId,
        bookingReference: bookings.bookingReference,
        currency: bookings.currency,
      })
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .limit(1);

    if (bookingRow?.guestId) {
      schedulePaymentReceiptEmail({
        tenantId: input.tenantId,
        bookingId: input.bookingId,
        guestId: bookingRow.guestId,
        propertyId: bookingRow.propertyId,
        amount: input.amountPaid,
        currency: bookingRow.currency ?? 'NAD',
        paymentMethod: NAMQR_RECEIPT_PAYMENT_METHOD,
        bookingReference: bookingRow.bookingReference ?? undefined,
      });
    }

    return {
      ...settlement,
      paymentGateway: PaymentGatewayLabel.NAMQR,
    };
  }

  /** Guest folio: dynamic QR tied to booking (bank-app pay to Etuna Nedbank). */
  static async generateGuestFolioQr(input: {
    tenantId: string;
    bookingId: string;
    guestId: string;
    amount: number;
    propertyId?: string;
  }) {
    if (input.amount <= 0) {
      throw new AppError(400, 'Amount must be greater than zero');
    }

    const folioService = new FolioService();
    const folio = await folioService.getFolio(input.bookingId);
    if (folio.folioClosedAt) {
      throw new AppError(400, 'Folio is already closed');
    }
    if (input.amount > folio.balanceDue + 0.01) {
      throw new AppError(400, `Amount cannot exceed folio balance (NAD ${folio.balanceDue.toFixed(2)})`);
    }

    return this.generateDeskQr({
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      bookingId: input.bookingId,
      guestId: input.guestId,
      amount: input.amount,
      purpose: 'guest_folio',
    });
  }

  /** Guest submits bank reference after paying in banking app — staff must approve. */
  static async submitGuestPaymentNotification(input: {
    tenantId: string;
    bookingId: string;
    guestId: string;
    submittedByUserId: string;
    amountClaimed: number;
    bankReference: string;
    qrReference?: string;
  }) {
    const ref = input.bankReference.trim();
    if (ref.length < 4) {
      throw new AppError(400, 'Bank reference is required (from your banking app)');
    }
    if (input.amountClaimed <= 0) {
      throw new AppError(400, 'Amount must be greater than zero');
    }

    const folioService = new FolioService();
    const folio = await folioService.getFolio(input.bookingId);
    if (folio.folioClosedAt) {
      throw new AppError(400, 'Folio is already closed');
    }

    const duplicate = await db
      .select({ id: namqrPendingConfirmations.id })
      .from(namqrPendingConfirmations)
      .where(
        and(
          eq(namqrPendingConfirmations.bookingId, input.bookingId),
          eq(namqrPendingConfirmations.bankReference, ref),
          eq(namqrPendingConfirmations.status, 'pending')
        )
      )
      .limit(1);

    if (duplicate[0]) {
      throw new AppError(409, 'This bank reference is already awaiting confirmation');
    }

    const [row] = await db
      .insert(namqrPendingConfirmations)
      .values({
        tenantId: input.tenantId,
        bookingId: input.bookingId,
        guestId: input.guestId,
        qrReference: input.qrReference,
        amountClaimed: String(input.amountClaimed),
        bankReference: ref,
        status: 'pending',
        submittedByUserId: input.submittedByUserId,
      })
      .returning();

    await recordAuditTrail({
      tenantId: input.tenantId,
      userId: input.submittedByUserId,
      action: 'namqr_guest_payment_submitted',
      resourceType: 'booking',
      resourceId: input.bookingId,
      newValues: {
        pendingId: row.id,
        amountClaimed: input.amountClaimed,
        bankReference: ref,
        qrReference: input.qrReference,
      },
    });

    return {
      id: row.id,
      status: row.status,
      amountClaimed: input.amountClaimed,
      bankReference: ref,
      message:
        'Payment notification received. Reception will confirm once your transfer appears on our bank statement.',
    };
  }

  static async listPendingForTenant(tenantId: string, status: 'pending' | 'approved' | 'rejected' = 'pending') {
    const rows = await db
      .select({
        id: namqrPendingConfirmations.id,
        bookingId: namqrPendingConfirmations.bookingId,
        guestId: namqrPendingConfirmations.guestId,
        qrReference: namqrPendingConfirmations.qrReference,
        amountClaimed: namqrPendingConfirmations.amountClaimed,
        bankReference: namqrPendingConfirmations.bankReference,
        status: namqrPendingConfirmations.status,
        createdAt: namqrPendingConfirmations.createdAt,
        bookingReference: bookings.bookingReference,
      })
      .from(namqrPendingConfirmations)
      .innerJoin(bookings, eq(namqrPendingConfirmations.bookingId, bookings.id))
      .where(
        and(
          eq(namqrPendingConfirmations.tenantId, tenantId),
          eq(namqrPendingConfirmations.status, status)
        )
      )
      .orderBy(desc(namqrPendingConfirmations.createdAt))
      .limit(50);

    return rows.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      guestId: r.guestId,
      qrReference: r.qrReference,
      amountClaimed: Number(r.amountClaimed),
      bankReference: r.bankReference,
      status: r.status,
      createdAt: r.createdAt?.toISOString(),
      bookingReference: r.bookingReference,
    }));
  }

  static async listPendingForBooking(bookingId: string) {
    const rows = await db
      .select({
        id: namqrPendingConfirmations.id,
        amountClaimed: namqrPendingConfirmations.amountClaimed,
        bankReference: namqrPendingConfirmations.bankReference,
        status: namqrPendingConfirmations.status,
        createdAt: namqrPendingConfirmations.createdAt,
        rejectionReason: namqrPendingConfirmations.rejectionReason,
      })
      .from(namqrPendingConfirmations)
      .where(eq(namqrPendingConfirmations.bookingId, bookingId))
      .orderBy(desc(namqrPendingConfirmations.createdAt))
      .limit(10);

    return rows.map((r) => ({
      id: r.id,
      amountClaimed: Number(r.amountClaimed),
      bankReference: r.bankReference,
      status: r.status,
      createdAt: r.createdAt?.toISOString(),
      rejectionReason: r.rejectionReason,
    }));
  }

  static async approvePending(input: {
    pendingId: string;
    tenantId: string;
    userId: string;
    amountPaid?: number;
  }) {
    const [pending] = await db
      .select()
      .from(namqrPendingConfirmations)
      .where(
        and(
          eq(namqrPendingConfirmations.id, input.pendingId),
          eq(namqrPendingConfirmations.tenantId, input.tenantId)
        )
      )
      .limit(1);

    if (!pending) {
      throw new AppError(404, 'Pending payment not found');
    }
    if (pending.status !== 'pending') {
      throw new AppError(400, `Payment is already ${pending.status}`);
    }

    const amountPaid = input.amountPaid ?? Number(pending.amountClaimed);
    const settlement = await this.confirmDeskPayment({
      bookingId: pending.bookingId,
      tenantId: input.tenantId,
      amountPaid,
      bankReference: pending.bankReference,
      qrReference: pending.qrReference ?? undefined,
      userId: input.userId,
    });

    await db
      .update(namqrPendingConfirmations)
      .set({
        status: 'approved',
        reviewedByUserId: input.userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(namqrPendingConfirmations.id, input.pendingId));

    return {
      pendingId: input.pendingId,
      ...settlement,
    };
  }

  static async rejectPending(input: {
    pendingId: string;
    tenantId: string;
    userId: string;
    reason?: string;
  }) {
    const [pending] = await db
      .select()
      .from(namqrPendingConfirmations)
      .where(
        and(
          eq(namqrPendingConfirmations.id, input.pendingId),
          eq(namqrPendingConfirmations.tenantId, input.tenantId)
        )
      )
      .limit(1);

    if (!pending) {
      throw new AppError(404, 'Pending payment not found');
    }
    if (pending.status !== 'pending') {
      throw new AppError(400, `Payment is already ${pending.status}`);
    }

    await db
      .update(namqrPendingConfirmations)
      .set({
        status: 'rejected',
        reviewedByUserId: input.userId,
        reviewedAt: new Date(),
        rejectionReason: input.reason?.trim() || 'Could not verify bank transfer',
        updatedAt: new Date(),
      })
      .where(eq(namqrPendingConfirmations.id, input.pendingId));

    await recordAuditTrail({
      tenantId: input.tenantId,
      userId: input.userId,
      action: 'namqr_guest_payment_rejected',
      resourceType: 'booking',
      resourceId: pending.bookingId,
      newValues: { pendingId: input.pendingId, reason: input.reason },
    });

    return { pendingId: input.pendingId, status: 'rejected' as const };
  }
}
