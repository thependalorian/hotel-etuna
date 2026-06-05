/**
 * Internal Buffr support escalation — no third-party issue trackers.
 * Location: lib/integrations/internal-support-escalation.ts
 *
 * Stores a stable engineering reference on support_tickets (reuses linear_* columns as external_ref).
 */

import { securityLogger } from '@/lib/utils/security-logger';

export type InternalEscalationResult = {
  id: string;
  identifier: string;
  url: string;
};

export function buildInternalEscalationRef(ticketId: string): InternalEscalationResult {
  const short = ticketId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const identifier = `BUFFR-${short}`;
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    'https://www.hoteletuna.com';
  const url = `${base.replace(/\/$/, '')}/admin/platform/support?ref=${encodeURIComponent(identifier)}`;
  return { id: ticketId, identifier, url };
}

export async function escalateSupportTicketInternally(input: {
  ticketId: string;
  subject: string;
  tenantName?: string | null;
  priority?: string;
}): Promise<InternalEscalationResult> {
  const ref = buildInternalEscalationRef(input.ticketId);
  securityLogger.info('[SupportEscalation] Internal engineering queue', {
    ticketId: input.ticketId,
    identifier: ref.identifier,
    subject: input.subject,
    tenantName: input.tenantName ?? null,
    priority: input.priority ?? 'medium',
  });
  return ref;
}
