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
import { db, bookings, namqrCodes, eq } from '@/lib/db';

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
}
