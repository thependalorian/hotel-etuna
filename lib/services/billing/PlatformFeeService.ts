/**
 * PlatformFeeService — accrue Buffr processing fees on card volume (invoice separately).
 * Location: lib/services/billing/PlatformFeeService.ts
 *
 * Guest funds settle to the property bank (Adumo config). Buffr never deducts at checkout;
 * fees accrue for monthly invoice to Hotel Etuna (EFT to Buffr Bank Windhoek).
 */

import { HOTEL_ETUNA_SETTLEMENT, BUFFR_PLATFORM_BILLING } from '@/lib/platform/settlement-accounts';

export interface PlatformFeeSchedule {
  /** Percent of gross card amount (e.g. 2.5 = 2.5%) */
  cardProcessingPercent: number;
  /** Fixed NAD per successful card transaction */
  cardProcessingFixedNad: number;
  /** Monthly platform subscription (NAD) — also on tenants.monthly_price */
  monthlySubscriptionNad: number;
}

const DEFAULT_SCHEDULE: PlatformFeeSchedule = {
  cardProcessingPercent: Number.parseFloat(
    process.env.BUFFR_CARD_PROCESSING_PERCENT || '2.5'
  ),
  cardProcessingFixedNad: Number.parseFloat(
    process.env.BUFFR_CARD_PROCESSING_FIXED_NAD || '0'
  ),
  monthlySubscriptionNad: Number.parseFloat(
    process.env.BUFFR_MONTHLY_SUBSCRIPTION_NAD || '0'
  ),
};

export interface CardPaymentCommercialContext {
  grossAmount: number;
  currency: string;
  purpose: 'booking_deposit' | 'folio_settle' | 'dining_deposit';
  merchantReference: string;
  gatewayTransactionId: string;
  tenantId: string;
  bookingId?: string | null;
}

export interface PlatformFeeAccrual {
  grossAmount: number;
  processingFeeAmount: number;
  processingFeePercent: number;
  processingFeeFixed: number;
  currency: string;
  /** Stored on transactions.metadata for monthly invoice rollup */
  metadata: Record<string, unknown>;
}

export class PlatformFeeService {
  static getSchedule(): PlatformFeeSchedule {
    return { ...DEFAULT_SCHEDULE };
  }

  /**
   * Compute Buffr processing fee for a successful card capture.
   * Does not move money — accounting accrual only.
   */
  static accrueCardProcessingFee(
    ctx: CardPaymentCommercialContext,
    schedule: PlatformFeeSchedule = PlatformFeeService.getSchedule()
  ): PlatformFeeAccrual {
    const percentPart =
      Math.round(((ctx.grossAmount * schedule.cardProcessingPercent) / 100) * 100) /
      100;
    const processingFeeAmount =
      Math.round((percentPart + schedule.cardProcessingFixedNad) * 100) / 100;

    return {
      grossAmount: ctx.grossAmount,
      processingFeeAmount,
      processingFeePercent: schedule.cardProcessingPercent,
      processingFeeFixed: schedule.cardProcessingFixedNad,
      currency: ctx.currency,
      metadata: {
        commercialModel: 'buffr_platform_property_settlement',
        beneficiary: 'property',
        beneficiaryLegalName: HOTEL_ETUNA_SETTLEMENT.legalName,
        settlementProfileKey: HOTEL_ETUNA_SETTLEMENT.profileKey,
        settlementAccountMasked: maskAccount(HOTEL_ETUNA_SETTLEMENT.accountNumber),
        platformOperator: BUFFR_PLATFORM_BILLING.legalName,
        platformBillingProfileKey: BUFFR_PLATFORM_BILLING.profileKey,
        adumoMerchantOfRecord: 'buffr_financial_services',
        purpose: ctx.purpose,
        merchantReference: ctx.merchantReference,
        gatewayTransactionId: ctx.gatewayTransactionId,
        tenantId: ctx.tenantId,
        bookingId: ctx.bookingId,
        platformFee: {
          processingFeeAmount,
          processingFeePercent: schedule.cardProcessingPercent,
          processingFeeFixedNad: schedule.cardProcessingFixedNad,
          invoiceParty: 'buffr_to_property',
        },
      },
    };
  }
}

function maskAccount(accountNumber: string): string {
  if (accountNumber.length <= 4) return '****';
  return `****${accountNumber.slice(-4)}`;
}
