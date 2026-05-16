/**
 * PropertyVatService — Hotel Etuna hospitality VAT on guest supplies (not Buffr platform fees).
 * Location: /lib/services/tax/PropertyVatService.ts
 */

import { db, bookingCharges, transactions } from '@/lib/db';
import {
  computeHospitalityVatBreakdown,
  getHotelEtunaNamraRegistration,
  getHotelEtunaPropertyTaxProfile,
  type HotelEtunaNamraRegistration,
  type TaxProfile,
  type VatBreakdown,
} from '@/lib/platform/namibia-tax';
import type { FolioLineItem } from '@/lib/types/folio';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';

const HOSPITALITY_CHARGE_TYPES = ['room', 'fnb', 'adjustment'] as const;

export type FolioVatSummary = VatBreakdown & {
  supplierLegalName: string;
  supplierCcNumber: string | null;
  supplierVatNumber: string | null;
  currency: string;
};

export type PropertyVatPeriodLine = {
  chargeType: string;
  description: string;
  amount: number;
  settledAt: string | null;
  bookingId: string;
};

export type PropertyVatPaymentLine = {
  transactionReference: string;
  type: string;
  description: string | null;
  amount: number;
  processedAt: string | null;
  bookingId: string | null;
  paymentGateway: string | null;
};

export type PropertyVatPeriodReport = {
  period: { from: string; to: string };
  currency: string;
  namraRegistration: HotelEtunaNamraRegistration;
  profile: Pick<
    TaxProfile,
    | 'legalName'
    | 'registrationNumber'
    | 'vatRegistered'
    | 'vatRegistrationNumber'
    | 'incomeTaxReference'
    | 'pricesVatInclusive'
  >;
  /** Settled folio hospitality lines (room, F&B, adjustments) */
  folioSettled: {
    lineCount: number;
    taxableGross: number;
    vat: VatBreakdown;
    amountExVat: number;
    vatAmount: number;
    totalInclVat: number;
    lines: PropertyVatPeriodLine[];
  };
  /** Completed guest payments in period (deposits + folio card/cash) — reconcile to bank */
  paymentsReceived: {
    lineCount: number;
    grossTotal: number;
    vat: VatBreakdown;
    amountExVat: number;
    vatAmount: number;
    totalInclVat: number;
    lines: PropertyVatPaymentLine[];
  };
  /** Combined estimate for NamRA workbook (may overlap folio + payments — review with accountant) */
  combinedTaxableGross: number;
  combinedVat: VatBreakdown;
  disclaimer: string;
};

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0;
}

export function sumTaxableFolioLines(lines: FolioLineItem[]): number {
  return lines
    .filter(
      (line) =>
        HOSPITALITY_CHARGE_TYPES.includes(
          line.chargeType as (typeof HOSPITALITY_CHARGE_TYPES)[number]
        ) && line.chargeType !== 'tax'
    )
    .reduce((sum, line) => {
      if (line.chargeType === 'tax') return sum;
      if (line.status !== 'open' && line.status !== 'settled') return sum;
      return sum + line.amount;
    }, 0);
}

export function buildFolioVatSummary(
  lines: FolioLineItem[],
  currency: string,
  profile: TaxProfile = getHotelEtunaPropertyTaxProfile()
): FolioVatSummary | null {
  if (!profile.vatRegistered) return null;

  const openTaxable = lines
    .filter(
      (line) =>
        HOSPITALITY_CHARGE_TYPES.includes(
          line.chargeType as (typeof HOSPITALITY_CHARGE_TYPES)[number]
        ) && line.status === 'open'
    )
    .reduce((sum, line) => sum + line.amount, 0);

  if (openTaxable <= 0) return null;

  const vat = computeHospitalityVatBreakdown(openTaxable, profile);
  return {
    ...vat,
    supplierLegalName: profile.legalName,
    supplierCcNumber: profile.registrationNumber,
    supplierVatNumber: profile.vatRegistrationNumber,
    currency,
  };
}

export class PropertyVatService {
  /**
   * Period report for NamRA filing support: settled room/F&B/adjustment charges by settledAt.
   */
  async getSettledSuppliesReport(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<PropertyVatPeriodReport> {
    const profile = getHotelEtunaPropertyTaxProfile();
    const rows = await db
      .select({
        bookingId: bookingCharges.bookingId,
        chargeType: bookingCharges.chargeType,
        description: bookingCharges.description,
        amount: bookingCharges.amount,
        currency: bookingCharges.currency,
        settledAt: bookingCharges.settledAt,
      })
      .from(bookingCharges)
      .where(
        and(
          eq(bookingCharges.tenantId, tenantId),
          eq(bookingCharges.status, 'settled'),
          inArray(bookingCharges.chargeType, [...HOSPITALITY_CHARGE_TYPES]),
          gte(bookingCharges.settledAt, from),
          lte(bookingCharges.settledAt, to)
        )
      );

    const folioTaxableGross = rows.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const folioVat = computeHospitalityVatBreakdown(folioTaxableGross, profile);

    const paymentRows = await db
      .select({
        transactionReference: transactions.transactionReference,
        type: transactions.type,
        description: transactions.description,
        amount: transactions.amount,
        processedAt: transactions.processedAt,
        bookingId: transactions.bookingId,
        paymentGateway: transactions.paymentGateway,
        currency: transactions.currency,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.status, 'completed'),
          inArray(transactions.type, ['booking_payment', 'folio_settlement']),
          gte(transactions.processedAt, from),
          lte(transactions.processedAt, to)
        )
      );

    const paymentsGross = paymentRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const paymentsVat = computeHospitalityVatBreakdown(paymentsGross, profile);
    const currency =
      rows[0]?.currency ?? paymentRows[0]?.currency ?? 'NAD';

    const combinedTaxableGross = roundMoney(folioTaxableGross + paymentsGross);
    const combinedVat = computeHospitalityVatBreakdown(combinedTaxableGross, profile);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      currency,
      namraRegistration: getHotelEtunaNamraRegistration(),
      profile: {
        legalName: profile.legalName,
        registrationNumber: profile.registrationNumber,
        vatRegistered: profile.vatRegistered,
        vatRegistrationNumber: profile.vatRegistrationNumber,
        incomeTaxReference: profile.incomeTaxReference,
        pricesVatInclusive: profile.pricesVatInclusive,
      },
      folioSettled: {
        lineCount: rows.length,
        taxableGross: roundMoney(folioTaxableGross),
        vat: folioVat,
        amountExVat: folioVat.amountExVat,
        vatAmount: folioVat.vatAmount,
        totalInclVat: folioVat.totalInclVat,
        lines: rows.map((row) => ({
          chargeType: row.chargeType,
          description: row.description,
          amount: toNumber(row.amount),
          settledAt: row.settledAt?.toISOString() ?? null,
          bookingId: row.bookingId,
        })),
      },
      paymentsReceived: {
        lineCount: paymentRows.length,
        grossTotal: roundMoney(paymentsGross),
        vat: paymentsVat,
        amountExVat: paymentsVat.amountExVat,
        vatAmount: paymentsVat.vatAmount,
        totalInclVat: paymentsVat.totalInclVat,
        lines: paymentRows.map((row) => ({
          transactionReference: row.transactionReference,
          type: row.type,
          description: row.description,
          amount: toNumber(row.amount),
          processedAt: row.processedAt?.toISOString() ?? null,
          bookingId: row.bookingId,
          paymentGateway: row.paymentGateway,
        })),
      },
      combinedTaxableGross,
      combinedVat,
      disclaimer:
        'Hotel Etuna hospitality VAT (guest room, F&B, deposits). For NamRA return preparation only — confirm tax points with your accountant. Folio-settled lines and payment transactions may overlap; do not double-count on your return. Buffr platform fees are on separate Buffr tax invoices.',
    };
  }
}

/** Single-amount VAT display for receipts and deposit UI. */
export function buildHospitalityVatDisplay(
  amount: number,
  currency = 'NAD',
  profile: TaxProfile = getHotelEtunaPropertyTaxProfile()
): FolioVatSummary | null {
  if (!profile.vatRegistered || amount <= 0) return null;
  const vat = computeHospitalityVatBreakdown(amount, profile);
  return {
    ...vat,
    supplierLegalName: profile.legalName,
    supplierCcNumber: profile.registrationNumber,
    supplierVatNumber: profile.vatRegistrationNumber,
    currency,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
