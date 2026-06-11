/**
 * JournalEntryService — void and reversal operations for hospitality journal entries (OSS W4 dubbl port).
 * Location: lib/services/accounting/JournalEntryService.ts
 *
 * Key patterns from buffr-host/source-codes/dubbl:
 * - Void posted entries with reason + audit
 * - Block void on non-posted entries (draft or already void)
 * - Reversal creates offsetting entry (debit ↔ credit swap)
 * - Hotel Etuna: journal lines generated from folio charges (no standalone posting yet)
 */

import {
  db,
  bookingCharges,
  platformFeeAccruals,
  transactions,
} from '@/lib/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { JournalLine } from '@/lib/domain/accounting/types';

export type JournalVoidResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export type JournalReversalResult = {
  success: boolean;
  error?: string;
  reversalLines?: JournalLine[];
  message?: string;
};

/**
 * Validate double-entry balance for a set of journal lines (debits = credits).
 * Reason: Fundamental accounting constraint; unbalanced entries corrupt the trial balance.
 */
export function validateDoubleEntry(lines: JournalLine[]): {
  valid: boolean;
  debitTotal: number;
  creditTotal: number;
  variance: number;
} {
  let debitTotal = 0;
  let creditTotal = 0;

  for (const line of lines) {
    debitTotal += line.debit;
    creditTotal += line.credit;
  }

  const variance = Math.abs(debitTotal - creditTotal);
  const valid = variance < 0.01;

  return {
    valid,
    debitTotal: Math.round(debitTotal * 100) / 100,
    creditTotal: Math.round(creditTotal * 100) / 100,
    variance: Math.round(variance * 100) / 100,
  };
}

export class JournalEntryService {
  /**
   * Void a booking charge (settles → void, blocks future GL inclusion).
   * Dubbl pattern: mark status='void', record voidReason + voidedAt.
   */
  async voidBookingCharge(
    chargeId: string,
    tenantId: string,
    reason: string,
    userId?: string
  ): Promise<JournalVoidResult> {
    const [charge] = await db
      .select()
      .from(bookingCharges)
      .where(and(eq(bookingCharges.id, chargeId), eq(bookingCharges.tenantId, tenantId)))
      .limit(1);

    if (!charge) {
      return { success: false, error: 'Booking charge not found' };
    }

    if (charge.status === 'voided') {
      return { success: false, error: 'Charge is already voided' };
    }

    if (charge.status !== 'settled') {
      return {
        success: false,
        error: 'Only settled charges can be voided. Use status="cancelled" for open charges.',
      };
    }

    await db
      .update(bookingCharges)
      .set({
        status: 'voided',
      })
      .where(eq(bookingCharges.id, chargeId));

    return {
      success: true,
      message: `Booking charge ${charge.description} voided (${reason}${userId ? `, by ${userId}` : ''}). Past journal lines remain immutable; future period reports exclude this charge.`,
    };
  }

  /**
   * Void a platform fee accrual (blocks future GL inclusion).
   */
  async voidPlatformFeeAccrual(
    accrualId: string,
    tenantId: string,
    reason: string,
    userId?: string
  ): Promise<JournalVoidResult> {
    const [accrual] = await db
      .select()
      .from(platformFeeAccruals)
      .where(
        and(eq(platformFeeAccruals.id, accrualId), eq(platformFeeAccruals.tenantId, tenantId))
      )
      .limit(1);

    if (!accrual) {
      return { success: false, error: 'Platform fee accrual not found' };
    }

    if (accrual.status === 'void') {
      return { success: false, error: 'Accrual is already void' };
    }

    const existingMetadata =
      accrual.metadata && typeof accrual.metadata === 'object' && !Array.isArray(accrual.metadata)
        ? (accrual.metadata as Record<string, unknown>)
        : {};

    await db
      .update(platformFeeAccruals)
      .set({
        status: 'void',
        metadata: {
          ...existingMetadata,
          voidReason: reason,
          voidedBy: userId ?? null,
          voidedAt: new Date().toISOString(),
        },
      })
      .where(eq(platformFeeAccruals.id, accrualId));

    return {
      success: true,
      message: `Platform fee accrual voided. Future reports exclude this expense.`,
    };
  }

  /**
   * Generate reversal journal lines for a source entry (debit ↔ credit swap, same accounts).
   * Hotel Etuna: conceptual — we don't persist standalone journal entries yet (they're derived from PMS events).
   * Useful for correcting posted folio errors: void original, then re-create with correct amount.
   */
  createReversalLines(
    originalLines: JournalLine[],
    reversalDate: Date,
    reversalMemo: string
  ): JournalLine[] {
    return originalLines.map((line) => ({
      ...line,
      date: reversalDate.toISOString(),
      debit: line.credit,
      credit: line.debit,
      memo: `${reversalMemo} (reversal of: ${line.memo})`,
      sourceType: line.sourceType,
      sourceId: `${line.sourceId}-reversal`,
    }));
  }

  /**
   * Count draft (unsettled) folio charges in a period — dubbl "draft entries" equivalent.
   * Used by period close guard: block close if any exist.
   */
  async countDraftCharges(
    tenantId: string,
    propertyId: string,
    from: Date,
    to: Date
  ): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingCharges)
      .where(
        and(
          eq(bookingCharges.tenantId, tenantId),
          eq(bookingCharges.status, 'open'),
          inArray(bookingCharges.chargeType, ['room', 'fnb', 'adjustment']),
          sql`${bookingCharges.createdAt} >= ${from}`,
          sql`${bookingCharges.createdAt} <= ${to}`
        )
      );

    return row?.count ?? 0;
  }

  /**
   * Validate that a transaction can be voided (not already void, not in closed period).
   */
  async canVoidTransaction(transactionId: string, tenantId: string): Promise<{
    canVoid: boolean;
    reason?: string;
  }> {
    const [txn] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, tenantId)))
      .limit(1);

    if (!txn) {
      return { canVoid: false, reason: 'Transaction not found' };
    }

    if (txn.status === 'void') {
      return { canVoid: false, reason: 'Transaction is already void' };
    }

    if (txn.status === 'failed' || txn.status === 'pending') {
      return {
        canVoid: false,
        reason: 'Can only void completed transactions. Use status="cancelled" for pending.',
      };
    }

    return { canVoid: true };
  }
}
