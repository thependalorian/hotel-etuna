/**
 * Namibia payment rails — product policy and field conventions
 *
 * Purpose: Single source of truth for which rails Buffr Host targets in Namibia (no Stripe).
 * Location: lib/payments/namibia-payment-rails.ts
 *
 * Store on rows:
 * - `payment_methods.type` ∈ PaymentMethodType
 * - `payment_methods.provider` — bank code, wallet brand, “manual”, etc.
 * - `transactions.payment_gateway` — low-cardinality processor id (e.g. namqr, bank_eft, pos_acquirer)
 * - `transactions.metadata` — JSON e.g. { rail: 'eft', reference: '...', namqrRef: '...' }
 *
 * Stripe is intentionally out of scope for Namibia deployments; use local NPS-aligned rails.
 */

export const STRIPE_SUPPORTED_IN_NAMIBIA = false as const;

/** Values for `payment_methods.type` (varchar); keep lowercase stable */
export const PaymentMethodType = {
  NAMQR: 'namqr',
  EFT: 'eft',
  CARD: 'card',
  EWALLET: 'ewallet',
  CASH: 'cash',
  BANK_DEPOSIT: 'bank_deposit',
  OPEN_BANKING_TRANSFER: 'open_banking_transfer',
} as const;

export type PaymentMethodTypeValue = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

/** Suggested `transactions.payment_gateway` labels */
export const PaymentGatewayLabel = {
  NAMQR: 'namqr',
  BANK_EFT: 'bank_eft',
  CARD_ACQUIRER: 'card_acquirer',
  ADUMO_VIRTUAL: 'adumo_virtual',
  EWALLET_AGGREGATOR: 'ewallet_aggregator',
  CASH_MANUAL: 'cash_manual',
  TRUST_RECONCILIATION: 'trust_reconciliation',
  OPEN_BANKING: 'open_banking',
} as const;

export interface NamibiaPaymentRailInfo {
  key: string;
  label: string;
  methodType: PaymentMethodTypeValue;
  typicalGateway: string;
  notes: string;
}

/**
 * Rails the product is designed to accept (implementation per tenant/acquirer may vary).
 */
export const NAMIBIA_PAYMENT_RAILS: NamibiaPaymentRailInfo[] = [
  {
    key: 'namqr',
    label: 'NamQR (NPS QR)',
    methodType: PaymentMethodType.NAMQR,
    typicalGateway: PaymentGatewayLabel.NAMQR,
    notes: 'In-app NamQR generation / scan flows; align with Namibia QR Code Standards PDF in compliance pack.',
  },
  {
    key: 'eft',
    label: 'EFT / bank transfer',
    methodType: PaymentMethodType.EFT,
    typicalGateway: PaymentGatewayLabel.BANK_EFT,
    notes: 'Manual or bank-file; reference number in metadata for reconciliation (PSD / trust account patterns).',
  },
  {
    key: 'card',
    label: 'Card (domestic acquirer)',
    methodType: PaymentMethodType.CARD,
    typicalGateway: PaymentGatewayLabel.ADUMO_VIRTUAL,
    notes:
      'Inbound card: Adumo Virtual hosted page (JWT form POST) — SAQ A; optional Enterprise API for backoffice.',
  },
  {
    key: 'ewallet',
    label: 'E-wallet / mobile money',
    methodType: PaymentMethodType.EWALLET,
    typicalGateway: PaymentGatewayLabel.EWALLET_AGGREGATOR,
    notes: 'Wallet provider set in `provider`; PSD-3 e-money rules may apply if offering stored value.',
  },
  {
    key: 'cash',
    label: 'Cash',
    methodType: PaymentMethodType.CASH,
    typicalGateway: PaymentGatewayLabel.CASH_MANUAL,
    notes: 'Front-desk / POS cash; audit via booking + transaction marked paid.',
  },
  {
    key: 'open_banking',
    label: 'Account-to-account (open banking)',
    methodType: PaymentMethodType.OPEN_BANKING_TRANSFER,
    typicalGateway: PaymentGatewayLabel.OPEN_BANKING,
    notes: 'Where AIS/PIS consent flows exist; tie to `ob_*` tables.',
  },
];

/** For APIs and admin tooling — “reporting pack” summary of payment posture */
/** Map report bucket (rail key or gateway label) to human-readable label */
export function labelForRailBucket(bucket: string): string {
  const byKey = NAMIBIA_PAYMENT_RAILS.find((x) => x.key === bucket);
  if (byKey) return byKey.label;
  const byGw = NAMIBIA_PAYMENT_RAILS.find((x) => x.typicalGateway === bucket);
  if (byGw) return byGw.label;
  return bucket;
}

export function getNamibiaPaymentRailsSummary() {
  return {
    market: 'Namibia' as const,
    defaultCurrency: 'NAD' as const,
    stripeUsed: STRIPE_SUPPORTED_IN_NAMIBIA,
    rails: NAMIBIA_PAYMENT_RAILS.map((r) => ({
      key: r.key,
      label: r.label,
      paymentMethodType: r.methodType,
      paymentGatewayLabel: r.typicalGateway,
      notes: r.notes,
    })),
  };
}
