/**
 * @fileoverview HospitalityAccountingService — domain service module.
 * HospitalityAccountingService — Namibia bookkeeping from PMS folio + payments (Libby / RWJJ).
 * Location: lib/services/accounting/HospitalityAccountingService.ts
 *
 * Accrual: revenue + VAT output when booking_charges settle (room/fnb/adjustment).
 * Cash lens: guest payments in period for operating cash flow summary (Ch.6).
 * Platform fees: platform_fee_accruals → expense (+ input VAT when Buffr tax invoice).
 */

import {
  db,
  accountingPeriodLocks,
  bookingCharges,
  bookings,
  properties,
  transactions,
  platformFeeAccruals,
  rawSql,
} from '@/lib/db';
import { HOSPITALITY_REPORT_FIELD_LABELS } from '@/lib/domain/accounting/accounting-terminology';
import {
  cashAccountForPayment,
  getChartAccount,
  revenueAccountForChargeType,
} from '@/lib/domain/accounting/namibia-hospitality-coa';
import type {
  AccountingPeriodCloseResult,
  AccountingPeriodLock,
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
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { roundMoney, toNumber } from '@/lib/utils/money';

function bookingKindById(
  rows: { id: string; bookingKind: string | null }[]
): Map<string, string> {
  return new Map(rows.map((r) => [r.id, r.bookingKind ?? 'accommodation']));
}

const HOSPITALITY_CHARGE_TYPES = ['room', 'fnb', 'adjustment'] as const;

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

/** Human-readable guard when open folio charges block period close (dubbl draft-entry pattern). */
export function draftEntryGuardMessage(draftCount: number): string {
  if (draftCount <= 0) return '';
  const noun = draftCount === 1 ? 'unsettled folio charge' : 'unsettled folio charges';
  return `Cannot close period: ${draftCount} ${noun} still open. Settle or void all folio lines through ${draftCount === 1 ? 'its' : 'their'} booking before closing the GL period.`;
}

function periodStartFromEnd(periodEnd: Date): Date {
  return new Date(Date.UTC(periodEnd.getUTCFullYear(), periodEnd.getUTCMonth(), 1));
}

function endOfDayUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
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

  /**
   * Journal lines for a period (reuses accrual report builder).
   */
  async getJournalLinesForPeriod(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<JournalLine[]> {
    const report = await this.getPeriodReport(tenantId, from, to);
    return report.journalLines;
  }

  /**
   * Count open (unsettled) folio charges in period scope — dubbl "draft entries" equivalent.
   */
  async countUnsettledDraftCharges(
    tenantId: string,
    propertyId: string,
    periodEnd: Date
  ): Promise<number> {
    const periodStart = periodStartFromEnd(periodEnd);
    const end = endOfDayUtc(periodEnd);

    const [row] = await db
      .select({ count: rawSql<number>`count(*)::int` })
      .from(bookingCharges)
      .innerJoin(bookings, eq(bookingCharges.bookingId, bookings.id))
      .where(
        and(
          eq(bookingCharges.tenantId, tenantId),
          eq(bookings.propertyId, propertyId),
          eq(bookingCharges.status, 'open'),
          inArray(bookingCharges.chargeType, [...HOSPITALITY_CHARGE_TYPES]),
          gte(bookingCharges.createdAt, periodStart),
          lte(bookingCharges.createdAt, end)
        )
      );

    return Number(row?.count ?? 0);
  }

  /**
   * Latest period lock for a property (if any).
   */
  async getPeriodLock(
    tenantId: string,
    propertyId: string
  ): Promise<AccountingPeriodLock | null> {
    const [lock] = await db
      .select()
      .from(accountingPeriodLocks)
      .where(
        and(
          eq(accountingPeriodLocks.tenantId, tenantId),
          eq(accountingPeriodLocks.propertyId, propertyId)
        )
      )
      .orderBy(desc(accountingPeriodLocks.lockDate), desc(accountingPeriodLocks.createdAt))
      .limit(1);

    if (!lock) return null;

    return {
      id: lock.id,
      propertyId: lock.propertyId,
      lockDate: lock.lockDate,
      lockedAt: lock.createdAt?.toISOString() ?? new Date().toISOString(),
      lockedBy: lock.lockedBy,
      reason: lock.reason,
    };
  }

  /**
   * Close GL period for a property — blocks when unsettled folio charges exist (dubbl draft guard).
   */
  async closeAccountingPeriod(
    tenantId: string,
    propertyId: string,
    periodEnd: Date,
    userId?: string
  ): Promise<AccountingPeriodCloseResult> {
    const [property] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.tenantId, tenantId)))
      .limit(1);

    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    const existingLock = await this.getPeriodLock(tenantId, propertyId);
    const lockDateIso = periodEnd.toISOString().slice(0, 10);
    if (existingLock && existingLock.lockDate >= lockDateIso) {
      return { success: false, error: 'Accounting period is already closed through this date' };
    }

    const draftCount = await this.countUnsettledDraftCharges(tenantId, propertyId, periodEnd);
    if (draftCount > 0) {
      return {
        success: false,
        error: draftEntryGuardMessage(draftCount),
        draftChargeCount: draftCount,
      };
    }

    const periodStart = periodStartFromEnd(periodEnd);
    const report = await this.getPeriodReport(tenantId, periodStart, endOfDayUtc(periodEnd));
    if (report.journalLineCount === 0) {
      return {
        success: false,
        error: 'Cannot close: no posted journal activity in this period',
      };
    }

    const [inserted] = await db
      .insert(accountingPeriodLocks)
      .values({
        tenantId,
        propertyId,
        lockDate: lockDateIso,
        lockedBy: userId ?? null,
        reason: `GL period closed through ${lockDateIso}`,
      })
      .returning();

    return {
      success: true,
      lockDate: lockDateIso,
      closedAt: inserted.createdAt?.toISOString() ?? new Date().toISOString(),
      closedBy: userId,
    };
  }

  /**
   * Generate year-end closing lines (revenue/expense → retained earnings) — dubbl pattern port.
   * Hotel Etuna: simplified monthly close for now; full fiscal year close is future enhancement.
   * Reason: Close Corporation equity (members' interest) requires year-end sweep per accountant.
   */
  generateYearEndClosingLines(
    trialBalance: Array<{ accountCode: string; accountType: string; balance: number }>,
    fiscalYearEnd: Date,
    currency: string
  ): JournalLine[] {
    const closingLines: JournalLine[] = [];
    let totalRevenueBalance = 0;
    let totalExpenseBalance = 0;

    for (const row of trialBalance) {
      if (row.accountType === 'revenue' && row.balance !== 0) {
        totalRevenueBalance += row.balance;
        pushLine(closingLines, {
          date: fiscalYearEnd.toISOString(),
          accountCode: row.accountCode,
          debit: Math.abs(row.balance),
          credit: 0,
          memo: 'Year-end closing - revenue',
          sourceType: 'platform_invoice',
          sourceId: `year-end-close-${fiscalYearEnd.toISOString().slice(0, 10)}`,
          currency,
        });
      } else if (row.accountType === 'expense' && row.balance !== 0) {
        totalExpenseBalance += row.balance;
        pushLine(closingLines, {
          date: fiscalYearEnd.toISOString(),
          accountCode: row.accountCode,
          debit: 0,
          credit: Math.abs(row.balance),
          memo: 'Year-end closing - expense',
          sourceType: 'platform_invoice',
          sourceId: `year-end-close-${fiscalYearEnd.toISOString().slice(0, 10)}`,
          currency,
        });
      }
    }

    const netIncome = totalRevenueBalance - totalExpenseBalance;

    if (netIncome !== 0) {
      pushLine(closingLines, {
        date: fiscalYearEnd.toISOString(),
        accountCode: '3100',
        debit: netIncome < 0 ? Math.abs(netIncome) : 0,
        credit: netIncome > 0 ? netIncome : 0,
        memo: 'Year-end closing - net income to retained earnings (members\' interest)',
        sourceType: 'platform_invoice',
        sourceId: `year-end-close-${fiscalYearEnd.toISOString().slice(0, 10)}`,
        currency,
      });
    }

    return closingLines;
  }

  /**
   * Check if entries can be posted for a given date (not in locked period).
   */
  async isDateLocked(
    tenantId: string,
    propertyId: string,
    entryDate: Date
  ): Promise<boolean> {
    const lock = await this.getPeriodLock(tenantId, propertyId);
    if (!lock) return false;

    const entryDateIso = entryDate.toISOString().slice(0, 10);
    return entryDateIso <= lock.lockDate;
  }
}
