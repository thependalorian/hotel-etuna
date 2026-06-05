/**
 * PlatformBillingService — fee schedules, accruals, monthly invoices (Buffr → property).
 * Location: lib/services/billing/PlatformBillingService.ts
 */

import { db } from '@/lib/db';
import {
  platformFeeAccruals,
  platformFeeSchedules,
  platformInvoiceLines,
  platformInvoices,
  tenants,
} from '@/lib/db/schema';
import {
  PlatformFeeService,
  type CardPaymentCommercialContext,
  type PlatformFeeAccrual,
} from '@/lib/services/billing/PlatformFeeService';
import { BUFFR_PLATFORM_BILLING } from '@/lib/platform/settlement-accounts';
import { computeVatOnTaxableSupply, getBuffrTaxProfile } from '@/lib/platform/namibia-tax';
import { AppError } from '@/lib/utils/errors';
import { handleServiceError } from '@/lib/utils/errors';
import { and, desc, eq, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export type PlatformInvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export class PlatformBillingService {
  async getFeeSchedule(tenantId: string) {
    const [row] = await db
      .select()
      .from(platformFeeSchedules)
      .where(eq(platformFeeSchedules.tenantId, tenantId))
      .limit(1);

    if (row) {
      return {
        cardProcessingPercent: Number.parseFloat(String(row.cardProcessingPercent)),
        cardProcessingFixedNad: Number.parseFloat(String(row.cardProcessingFixedNad)),
        monthlySubscriptionNad: Number.parseFloat(String(row.monthlySubscriptionNad)),
      };
    }

    const [tenant] = await db
      .select({ monthlyPrice: tenants.monthlyPrice })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const fallback = PlatformFeeService.getSchedule();
    if (tenant?.monthlyPrice) {
      fallback.monthlySubscriptionNad =
        Number.parseFloat(String(tenant.monthlyPrice)) || fallback.monthlySubscriptionNad;
    }
    return fallback;
  }

  /**
   * Persist processing fee accrual after successful Adumo capture.
   */
  async recordCardFeeAccrual(
    accrual: PlatformFeeAccrual,
    ctx: CardPaymentCommercialContext
  ): Promise<string | null> {
    try {
      if (accrual.processingFeeAmount <= 0) return null;

      const periodMonth = periodMonthFromDate(new Date());
      const [inserted] = await db
        .insert(platformFeeAccruals)
        .values({
          tenantId: ctx.tenantId,
          bookingId: ctx.bookingId,
          merchantReference: ctx.merchantReference,
          gatewayTransactionId: ctx.gatewayTransactionId,
          purpose: ctx.purpose,
          grossAmount: accrual.grossAmount.toFixed(2),
          feeAmount: accrual.processingFeeAmount.toFixed(2),
          currency: accrual.currency,
          periodMonth,
          status: 'accrued',
          metadata: accrual.metadata,
        })
        .returning({ id: platformFeeAccruals.id });

      return inserted?.id ?? null;
    } catch (error) {
      securityLogger.error('[PlatformBillingService] recordCardFeeAccrual failed:', error);
      return null;
    }
  }

  async listInvoices(tenantId: string, limit = 24) {
    try {
      return await db
        .select()
        .from(platformInvoices)
        .where(eq(platformInvoices.tenantId, tenantId))
        .orderBy(desc(platformInvoices.periodStart))
        .limit(limit);
    } catch (error) {
      throw handleServiceError(error, 'Error listing platform invoices');
    }
  }

  async getInvoiceWithLines(invoiceId: string, tenantId: string) {
    const [invoice] = await db
      .select()
      .from(platformInvoices)
      .where(
        and(eq(platformInvoices.id, invoiceId), eq(platformInvoices.tenantId, tenantId))
      )
      .limit(1);

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    const lines = await db
      .select()
      .from(platformInvoiceLines)
      .where(eq(platformInvoiceLines.invoiceId, invoiceId));

    return { invoice, lines };
  }

  /**
   * Generate draft invoice for calendar month (YYYY-MM).
   */
  async generateMonthlyInvoice(
    tenantId: string,
    yearMonth: string
  ): Promise<{
    invoiceId: string;
    invoiceNumber: string;
    subtotal: number;
    vatAmount: number;
    total: number;
    documentType: string;
  }> {
    try {
      const { periodStart, periodEnd } = monthBounds(yearMonth);
      const schedule = await this.getFeeSchedule(tenantId);

      const existing = await db
        .select({ id: platformInvoices.id })
        .from(platformInvoices)
        .where(
          and(
            eq(platformInvoices.tenantId, tenantId),
            eq(platformInvoices.periodStart, periodStart),
            sql`${platformInvoices.status} != 'void'`
          )
        )
        .limit(1);

      if (existing[0]) {
        throw new AppError(409, `Invoice already exists for ${yearMonth}`);
      }

      const accruals = await db
        .select()
        .from(platformFeeAccruals)
        .where(
          and(
            eq(platformFeeAccruals.tenantId, tenantId),
            eq(platformFeeAccruals.periodMonth, yearMonth),
            eq(platformFeeAccruals.status, 'accrued')
          )
        );

      const processingTotal = accruals.reduce(
        (sum, row) => sum + Number.parseFloat(String(row.feeAmount)),
        0
      );
      const cardTxCount = accruals.length;

      const invoiceNumber = `BFR-${yearMonth.replace('-', '')}-${tenantId.slice(0, 6).toUpperCase()}`;
      const lines: Array<{
        lineType: 'subscription' | 'processing_fee' | 'adjustment';
        description: string;
        quantity: string;
        unitAmount: string;
        amount: string;
        metadata?: Record<string, unknown>;
      }> = [];

      if (schedule.monthlySubscriptionNad > 0) {
        lines.push({
          lineType: 'subscription',
          description: `Platform subscription — ${yearMonth}`,
          quantity: '1',
          unitAmount: schedule.monthlySubscriptionNad.toFixed(2),
          amount: schedule.monthlySubscriptionNad.toFixed(2),
        });
      }

      if (processingTotal > 0) {
        lines.push({
          lineType: 'processing_fee',
          description: `Card processing fees (${cardTxCount} transaction${cardTxCount === 1 ? '' : 's'}) — ${yearMonth}`,
          quantity: String(cardTxCount),
          unitAmount: (processingTotal / Math.max(cardTxCount, 1)).toFixed(2),
          amount: processingTotal.toFixed(2),
          metadata: { accrualCount: cardTxCount },
        });
      }

      if (lines.length === 0) {
        throw new AppError(400, 'No subscription or processing fees to invoice for this period');
      }

      const subtotal = lines.reduce((s, l) => s + Number.parseFloat(l.amount), 0);
      const taxProfile = getBuffrTaxProfile();
      const { vatAmount, totalInclVat, vatRatePercent } = computeVatOnTaxableSupply(
        subtotal,
        taxProfile
      );
      const documentType = taxProfile.vatRegistered ? 'tax_invoice' : 'invoice';

      const result = await db.transaction(async (tx) => {
        const [invoice] = await tx
          .insert(platformInvoices)
          .values({
            tenantId,
            invoiceNumber,
            periodStart,
            periodEnd,
            status: 'draft',
            subtotal: subtotal.toFixed(2),
            vatRatePercent: vatRatePercent.toFixed(2),
            vatAmount: vatAmount.toFixed(2),
            total: totalInclVat.toFixed(2),
            currency: 'NAD',
            supplierVatNumber: taxProfile.vatRegistrationNumber,
            documentType,
            notes: [
              taxProfile.vatRegistered
                ? `Tax Invoice — VAT ${vatRatePercent}% = NAD ${vatAmount.toFixed(2)}`
                : 'Invoice (VAT not applicable — confirm Buffr VAT registration)',
              `Pay to ${BUFFR_PLATFORM_BILLING.legalName}, ${BUFFR_PLATFORM_BILLING.bankName} ${BUFFR_PLATFORM_BILLING.accountNumber}`,
            ].join('\n'),
          })
          .returning();

        if (!invoice) throw new AppError(500, 'Failed to create invoice');

        for (const line of lines) {
          await tx.insert(platformInvoiceLines).values({
            invoiceId: invoice.id,
            lineType: line.lineType,
            description: line.description,
            quantity: line.quantity,
            unitAmount: line.unitAmount,
            amount: line.amount,
            metadata: line.metadata ?? null,
          });
        }

        if (accruals.length > 0) {
          await tx
            .update(platformFeeAccruals)
            .set({ status: 'invoiced', invoiceId: invoice.id })
            .where(
              and(
                eq(platformFeeAccruals.tenantId, tenantId),
                eq(platformFeeAccruals.periodMonth, yearMonth),
                eq(platformFeeAccruals.status, 'accrued')
              )
            );
        }

        return invoice;
      });

      return {
        invoiceId: result.id,
        invoiceNumber: result.invoiceNumber,
        subtotal,
        vatAmount,
        total: totalInclVat,
        documentType,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error generating platform invoice');
    }
  }

  async issueInvoice(invoiceId: string, tenantId: string) {
    const [updated] = await db
      .update(platformInvoices)
      .set({ status: 'issued', issuedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(platformInvoices.id, invoiceId),
          eq(platformInvoices.tenantId, tenantId),
          eq(platformInvoices.status, 'draft')
        )
      )
      .returning();

    if (!updated) throw new AppError(404, 'Draft invoice not found');
    return updated;
  }

  async markInvoicePaid(
    invoiceId: string,
    tenantId: string,
    paymentReference: string
  ) {
    const [updated] = await db
      .update(platformInvoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paymentReference,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(platformInvoices.id, invoiceId),
          eq(platformInvoices.tenantId, tenantId),
          sql`${platformInvoices.status} IN ('draft', 'issued')`
        )
      )
      .returning();

    if (!updated) throw new AppError(404, 'Invoice not found or already paid');
    return updated;
  }

  async accrualSummary(tenantId: string, yearMonth: string) {
    const rows = await db
      .select({
        count: sql<number>`count(*)::int`,
        feeTotal: sql<string>`coalesce(sum(${platformFeeAccruals.feeAmount}), 0)`,
        grossTotal: sql<string>`coalesce(sum(${platformFeeAccruals.grossAmount}), 0)`,
      })
      .from(platformFeeAccruals)
      .where(
        and(
          eq(platformFeeAccruals.tenantId, tenantId),
          eq(platformFeeAccruals.periodMonth, yearMonth),
          eq(platformFeeAccruals.status, 'accrued')
        )
      );

    return {
      transactionCount: rows[0]?.count ?? 0,
      feeTotal: Number.parseFloat(String(rows[0]?.feeTotal ?? 0)),
      grossTotal: Number.parseFloat(String(rows[0]?.grossTotal ?? 0)),
    };
  }
}

function periodMonthFromDate(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function monthBounds(yearMonth: string): { periodStart: string; periodEnd: string } {
  const [y, m] = yearMonth.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) {
    throw new AppError(400, 'yearMonth must be YYYY-MM');
  }
  const periodStart = `${yearMonth}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const periodEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  return { periodStart, periodEnd };
}
