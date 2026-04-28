/**
 * Compliance reporting snapshot (Drizzle)
 *
 * Purpose: KPIs for platform dashboard + `/api/admin/platform/compliance/summary`
 * Location: lib/compliance/compliance-snapshot.ts
 *
 * Maps to schema areas: support (operations), consumer_rights_requests (ETA-style),
 * cybersecurity_incidents (PSD-12-style), audit_trail (records).
 */

import {
  db,
  supportTickets,
  auditTrail,
  consumerRightsRequests,
  cybersecurityIncidents,
  namqrCodes,
  obApiTransactions,
  transactions,
} from '@/lib/db';
import { count, eq, gte, notInArray, and, or, isNotNull } from 'drizzle-orm';

export interface ComplianceSnapshot {
  openSupportTickets: number;
  pendingConsumerRights: number;
  openCyberIncidents: number;
  auditEvents24h: number;
  /** Active NamQR records (`namqr_codes.is_active`) — align with Namibia QR standard in compliance pack */
  activeNamqrCodes: number;
  /** Open banking API calls in last 24h with HTTP ≥400 or `error_code` set — fraud/ops signal */
  openBankingApiErrors24h: number;
  /** Transactions marked failed in last 24h — reconciliation / fraud follow-up */
  failedTransactions24h: number;
}

async function safeCount(label: string, run: () => Promise<number>): Promise<number> {
  try {
    return await run();
  } catch (err) {
    console.warn(`[compliance-snapshot] ${label} skipped`, err);
    return 0;
  }
}

export async function getComplianceSnapshot(): Promise<ComplianceSnapshot> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const openSupportTickets = await safeCount('support_tickets', async () => {
    const [row] = await db
      .select({ n: count() })
      .from(supportTickets)
      .where(notInArray(supportTickets.status, ['resolved', 'closed']));
    return Number(row?.n ?? 0);
  });

  const pendingConsumerRights = await safeCount('consumer_rights', async () => {
    const [row] = await db
      .select({ n: count() })
      .from(consumerRightsRequests)
      .where(eq(consumerRightsRequests.status, 'pending'));
    return Number(row?.n ?? 0);
  });

  const openCyberIncidents = await safeCount('cyber_incidents', async () => {
    const [row] = await db
      .select({ n: count() })
      .from(cybersecurityIncidents)
      .where(eq(cybersecurityIncidents.status, 'open'));
    return Number(row?.n ?? 0);
  });

  const auditEvents24h = await safeCount('audit_trail', async () => {
    const [row] = await db
      .select({ n: count() })
      .from(auditTrail)
      .where(gte(auditTrail.timestamp, dayAgo));
    return Number(row?.n ?? 0);
  });

  const activeNamqrCodes = await safeCount('namqr_codes', async () => {
    const [row] = await db
      .select({ n: count() })
      .from(namqrCodes)
      .where(eq(namqrCodes.isActive, true));
    return Number(row?.n ?? 0);
  });

  const openBankingApiErrors24h = await safeCount('ob_api_transactions', async () => {
    const [row] = await db
      .select({ n: count() })
      .from(obApiTransactions)
      .where(
        and(
          gte(obApiTransactions.createdAt, dayAgo),
          or(
            isNotNull(obApiTransactions.errorCode),
            gte(obApiTransactions.httpStatusCode, 400)
          )
        )
      );
    return Number(row?.n ?? 0);
  });

  const failedTransactions24h = await safeCount('transactions', async () => {
    const [row] = await db
      .select({ n: count() })
      .from(transactions)
      .where(
        and(gte(transactions.createdAt, dayAgo), eq(transactions.status, 'failed'))
      );
    return Number(row?.n ?? 0);
  });

  return {
    openSupportTickets,
    pendingConsumerRights,
    openCyberIncidents,
    auditEvents24h,
    activeNamqrCodes,
    openBankingApiErrors24h,
    failedTransactions24h,
  };
}
