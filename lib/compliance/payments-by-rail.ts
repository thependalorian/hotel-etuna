/**
 * Payments aggregated by rail (metadata.rail → payment_gateway → unspecified)
 *
 * Purpose: Reporting for Namibia NPS-style reconciliation without Stripe
 * Location: lib/compliance/payments-by-rail.ts
 */

import { db, transactions } from '@/lib/db';
import { sql, count, gte, desc } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export interface PaymentsByRailRow {
  bucket: string;
  transactionCount: number;
  /** Sum of amounts as string (NAD) for JSON safety */
  totalAmountNad: string;
}

/**
 * Group transactions by canonical rail bucket for the reporting window.
 * Bucket = coalesce(metadata->>'rail', payment_gateway, 'unspecified')
 */
export async function getPaymentsByRailSince(since: Date): Promise<PaymentsByRailRow[]> {
  try {
    const bucketSql = sql`coalesce(${transactions.metadata}->>'rail', ${transactions.paymentGateway}, 'unspecified')`;

    const rows = await db
      .select({
        bucket: sql<string>`coalesce(${transactions.metadata}->>'rail', ${transactions.paymentGateway}, 'unspecified')`,
        transactionCount: count(),
        totalAmountNad: sql<string>`coalesce(sum(${transactions.amount})::text, '0')`,
      })
      .from(transactions)
      .where(gte(transactions.createdAt, since))
      .groupBy(bucketSql)
      .orderBy(desc(count()));

    return rows.map((r) => ({
      bucket: r.bucket,
      transactionCount: Number(r.transactionCount ?? 0),
      totalAmountNad: r.totalAmountNad ?? '0',
    }));
  } catch (err) {
    securityLogger.warn('[payments-by-rail] aggregation failed', err);
    return [];
  }
}
