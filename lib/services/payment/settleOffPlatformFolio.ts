/**
 * Single folio settlement path for off-platform rails (NamQR, EFT, e-wallet, bank deposit).
 * Location: lib/services/payment/settleOffPlatformFolio.ts
 */

import { FolioService } from '@/lib/services/folio/FolioService';
import type { ManualPaymentRail } from '@/lib/services/payment/ManualPaymentService';

export type OffPlatformFolioMethod = 'namqr' | 'eft' | 'ewallet' | 'bank_deposit';

const RAIL_TO_FOLIO_METHOD: Record<
  Exclude<ManualPaymentRail, 'cash'>,
  OffPlatformFolioMethod
> = {
  namqr: 'namqr',
  eft: 'eft',
  ewallet: 'ewallet',
  bank_deposit: 'bank_deposit',
};

export function folioMethodForRail(
  rail: Exclude<ManualPaymentRail, 'cash'>
): OffPlatformFolioMethod {
  return RAIL_TO_FOLIO_METHOD[rail];
}

export async function settleOffPlatformFolio(input: {
  bookingId: string;
  amountPaid: number;
  bankReference: string;
  rail: Exclude<ManualPaymentRail, 'cash'>;
  userId?: string;
  extraMetadata?: Record<string, unknown>;
}) {
  const folioService = new FolioService();
  return folioService.settleFolio(input.bookingId, {
    paymentMethod: folioMethodForRail(input.rail),
    amountPaid: input.amountPaid,
    userId: input.userId,
    gatewayTransactionId: input.bankReference.trim(),
    paymentMetadata: {
      rail: input.rail,
      offPlatform: true,
      ...input.extraMetadata,
    },
  });
}
