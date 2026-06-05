/**
 * HospitalityAccountingService — Namibia bookkeeping from PMS folio + payments (Libby / RWJJ).
 * Location: lib/services/accounting/HospitalityAccountingService.ts
 *
 * Accrual: revenue + VAT output when booking_charges settle (room/fnb/adjustment).
 * Cash lens: guest payments in period for operating cash flow summary (Ch.6).
 * Platform fees: platform_fee_accruals → expense (+ input VAT when Buffr tax invoice).
 */

import { db, bookingCharges, bookings, transactions, platformFeeAccruals } from '@/lib/db';
import { HOSPITALITY_REPORT_FIELD_LABELS } from '@/lib/domain/accounting/accounting-terminology';
import {
  cashAccountForPayment,
  getChartAccount,
  revenueAccountForChargeType,
} from '@/lib/domain/accounting/namibia-hospitality-coa';
import type {
  HospitalityAccountingPeriodReport,
  IncomeStatementReport,
  JournalLine,
  OperatingCashFlowSummary,
  TrialBalanceRow,
} from '@/lib/domain/accounting/types';
import {
  computeHospitalityVatBreakdown,
  computeVatOnTaxableSupply,
  getBuffrTaxProfile,
  getHotelEtunaNamraRegistration,
  getHotelEtunaPropertyTaxProfile,
  NAMIBIA_NON_MINING_CORPORATE_TAX_RATE_2025,
} from '@/lib/platform/namibia-tax';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';

function bookingKindById(
  rows: { id: string; bookingKind: string | null }[]
): Map<string, string> {
  return new Map(rows.map((r) => [r.id, r.bookingKind ?? 'accommodation']));
}

const HOSPITALITY_CHARGE_TYPES = ['room', 'fnb', 'adjustment'] as const;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function pushLine(
  lines: JournalLine[],
  partial: Omit<JournalLine, 'accountName'> & { accountCode: string }
): void {
  const account = getChartAccount(partial.accountCode);
  lines.push({
    ...partial,
    accountName: account?.name ?? partial.accountCode,
    debit: roundMoney(partial.debit),
    credit: roundMoney(partial.credit),
  });
}

function buildTrialBalance(journalLines: JournalLine[]): TrialBalanceRow[] {
  const totals = new Map<string, { debit: number; credit: number }>();

  for (const line of journalLines) {
    const bucket = totals.get(line.accountCode) ?? { debit: 0, credit: 0 };
    bucket.debit += line.debit;
    bucket.credit += line.credit;
    totals.set(line.accountCode, bucket);
  }

  const rows: TrialBalanceRow[] = [];
  for (const [code, { debit, credit }] of totals) {
    const account = getChartAccount(code);
    if (!account) continue;
    const net = roundMoney(debit - credit);
    const balance =
      account.normalBalance === 'debit' ? net : roundMoney(credit - debit);
    rows.push({
      accountCode: code,
      accountName: account.name,
      accountType: account.type,
      debitTotal: roundMoney(debit),
      creditTotal: roundMoney(credit),
      balance,
    });
  }

  return rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

export class HospitalityAccountingService {
  /**
   * Period bookkeeping pack for NamRA / accountant export (accrual on settled folio lines).
   */
  async getPeriodReport(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<HospitalityAccountingPeriodReport> {
    const profile = getHotelEtunaPropertyTaxProfile();
    const namra = getHotelEtunaNamraRegistration();
    const buffrTax = getBuffrTaxProfile();
    const currency = 'NAD';

    const settledCharges = await db
      .select()
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

    const guestPayments = await db
      .select()
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

    const feeAccruals = await db
      .select()
      .from(platformFeeAccruals)
      .where(
        and(
          eq(platformFeeAccruals.tenantId, tenantId),
          gte(platformFeeAccruals.createdAt, from),
          lte(platformFeeAccruals.createdAt, to)
        )
      );

    const bookingIds = [...new Set(settledCharges.map((c) => c.bookingId))];
    const bookingKindRows =
      bookingIds.length > 0
        ? await db
            .select({ id: bookings.id, bookingKind: bookings.bookingKind })
            .from(bookings)
            .where(
              and(eq(bookings.tenantId, tenantId), inArray(bookings.id, bookingIds))
            )
        : [];
    const kindByBooking = bookingKindById(bookingKindRows);

    const journalLines: JournalLine[] = [];
    let roomExVat = 0;
    let conferenceExVat = 0;
    let campsiteExVat = 0;
    let fnbExVat = 0;
    let otherExVat = 0;
    let vatOutput = 0;

    for (const charge of settledCharges) {
      const gross = toNumber(charge.amount);
      const vat = computeHospitalityVatBreakdown(gross, profile);
      const revCode = revenueAccountForChargeType(charge.chargeType);
      const date = charge.settledAt?.toISOString() ?? from.toISOString();
      const bKind = kindByBooking.get(charge.bookingId) ?? 'accommodation';

      if (charge.chargeType === 'room') {
        roomExVat += vat.amountExVat;
      } else if (charge.chargeType === 'fnb') {
        fnbExVat += vat.amountExVat;
      } else if (charge.chargeType === 'adjustment') {
        if (bKind === 'conference') conferenceExVat += vat.amountExVat;
        else if (bKind === 'campsite') campsiteExVat += vat.amountExVat;
        else otherExVat += vat.amountExVat;
      } else {
        otherExVat += vat.amountExVat;
      }
      vatOutput += vat.vatAmount;

      pushLine(journalLines, {
        date,
        accountCode: '1100',
        debit: gross,
        credit: 0,
        memo: `${charge.chargeType}: ${charge.description}`,
        sourceType: 'booking_charge',
        sourceId: charge.id,
        currency,
      });
      pushLine(journalLines, {
        date,
        accountCode: revCode,
        debit: 0,
        credit: vat.amountExVat,
        memo: `Revenue recognition`,
        sourceType: 'booking_charge',
        sourceId: charge.id,
        currency,
      });
      if (vat.vatAmount > 0) {
        pushLine(journalLines, {
          date,
          accountCode: '2100',
          debit: 0,
          credit: vat.vatAmount,
          memo: `VAT output @ ${vat.vatRatePercent}%`,
          sourceType: 'booking_charge',
          sourceId: charge.id,
          currency,
        });
      }
    }

    let cashCollected = 0;
    for (const payment of guestPayments) {
      const amount = toNumber(payment.amount);
      cashCollected += amount;
      const cashCode = cashAccountForPayment(payment.paymentGateway);
      const date = payment.processedAt?.toISOString() ?? from.toISOString();

      pushLine(journalLines, {
        date,
        accountCode: cashCode,
        debit: amount,
        credit: 0,
        memo: payment.description ?? payment.type,
        sourceType: 'guest_payment',
        sourceId: payment.id,
        currency,
      });
      pushLine(journalLines, {
        date,
        accountCode: '1100',
        debit: 0,
        credit: amount,
        memo: `Clear guest receivable`,
        sourceType: 'guest_payment',
        sourceId: payment.id,
        currency,
      });
    }

    let platformFeesExVat = 0;
    let vatInput = 0;
    for (const accrual of feeAccruals) {
      const feeIncl = toNumber(accrual.feeAmount);
      const feeVat = computeVatOnTaxableSupply(feeIncl, buffrTax);
      platformFeesExVat += feeVat.amountExVat;
      vatInput += feeVat.vatAmount;
      const date = accrual.createdAt?.toISOString() ?? from.toISOString();

      pushLine(journalLines, {
        date,
        accountCode: '5100',
        debit: feeVat.amountExVat,
        credit: 0,
        memo: `Platform fee: ${accrual.purpose}`,
        sourceType: 'platform_fee_accrual',
        sourceId: accrual.id,
        currency,
      });
      if (feeVat.vatAmount > 0) {
        pushLine(journalLines, {
          date,
          accountCode: '2110',
          debit: feeVat.vatAmount,
          credit: 0,
          memo: 'VAT input on Buffr platform invoice',
          sourceType: 'platform_fee_accrual',
          sourceId: accrual.id,
          currency,
        });
      }
      pushLine(journalLines, {
        date,
        accountCode: '2300',
        debit: 0,
        credit: feeVat.totalInclVat,
        memo: 'Platform fees payable to Buffr',
        sourceType: 'platform_fee_accrual',
        sourceId: accrual.id,
        currency,
      });
    }

    const totalRevenueExVat = roundMoney(
      roomExVat + conferenceExVat + campsiteExVat + fnbExVat + otherExVat
    );
    const totalRevenueInclVat = roundMoney(totalRevenueExVat + vatOutput);
    const totalExpensesInclVat = roundMoney(platformFeesExVat + vatInput);
    const netBeforeTax = roundMoney(totalRevenueExVat - platformFeesExVat);
    const taxRate = NAMIBIA_NON_MINING_CORPORATE_TAX_RATE_2025 / 100;
    const taxProvision = roundMoney(Math.max(0, netBeforeTax) * taxRate);
    const netAfterTax = roundMoney(netBeforeTax - taxProvision);

    const incomeStatement: IncomeStatementReport = {
      currency,
      roomRevenueExVat: roundMoney(roomExVat),
      conferenceRevenueExVat: roundMoney(conferenceExVat),
      campsiteRevenueExVat: roundMoney(campsiteExVat),
      fnbRevenueExVat: roundMoney(fnbExVat),
      otherRevenueExVat: roundMoney(otherExVat),
      totalRevenueExVat,
      vatOutput: roundMoney(vatOutput),
      totalRevenueInclVat,
      platformFeesExVat: roundMoney(platformFeesExVat),
      vatInputOnPlatform: roundMoney(vatInput),
      totalExpensesInclVat,
      netIncomeBeforeTax: netBeforeTax,
      estimatedIncomeTaxProvision: taxProvision,
      netIncomeAfterTax: netAfterTax,
    };

    const operatingCashFlow: OperatingCashFlowSummary = {
      cashCollectedFromGuests: roundMoney(cashCollected),
      platformFeesAccrued: roundMoney(platformFeesExVat + vatInput),
      netCashFromOperations: roundMoney(cashCollected - platformFeesExVat - vatInput),
    };

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      currency,
      entity: {
        legalName: profile.legalName,
        ccNumber: profile.registrationNumber ?? namra.closeCorporationNumber,
        vatNumber: profile.vatRegistrationNumber,
        incomeTaxReference: profile.incomeTaxReference,
      },
      basis: 'accrual_settled_charges',
      journalLineCount: journalLines.length,
      trialBalance: buildTrialBalance(journalLines),
      incomeStatement,
      operatingCashFlow,
      journalLines,
      reportLabels: HOSPITALITY_REPORT_FIELD_LABELS,
      disclaimer:
        'Management bookkeeping from PMS data — not audited financial statements. Revenue recognised on settled folio lines (Libby accrual); guest payments clear receivables (A = L + E). VAT output on hospitality; VAT input on Buffr platform fees. Income tax line is illustrative @ 30% non-mining (Deloitte Budget 2025/2026). Export to accountant for NamRA ITAS / annual accounts. Capex & depreciation (RWJJ Ch.6) not included in P1.',
    };
  }
}
