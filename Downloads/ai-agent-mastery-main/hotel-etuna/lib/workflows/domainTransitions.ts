/**
 * Allowed status transitions by domain (single source of truth for lifecycle graphs)
 *
 * Purpose: DRY transition tables for booking, F&B orders, support tickets, ETA consumer rights, PSD-12 incidents
 * Location: /lib/workflows/domainTransitions.ts
 *
 * Keys and values are lowercase snake_case to match Drizzle varchar statuses.
 */

/** Hotel booking lifecycle */
export const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

/** Kitchen / service order lifecycle */
export const RESTAURANT_ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [],
  cancelled: [],
};

/** ETA-style consumer rights request handling */
export const CONSUMER_RIGHTS_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_review', 'rejected'],
  in_review: ['awaiting_customer', 'resolved', 'rejected'],
  awaiting_customer: ['in_review', 'resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

/** Cyber incident (PSD-12 style) lifecycle */
export const CYBER_INCIDENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ['investigating', 'closed'],
  investigating: ['contained', 'closed'],
  contained: ['closed'],
  closed: [],
};

const SUPPORT_TICKET_STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed'] as const;

/** Platform support ticket — any non-terminal move to another allowed status preserves prior admin flexibility */
export const SUPPORT_TICKET_STATUS_TRANSITIONS: Record<string, string[]> = Object.fromEntries(
  SUPPORT_TICKET_STATUSES.map((s) => [s, SUPPORT_TICKET_STATUSES.filter((t) => t !== s)])
) as Record<string, string[]>;

/**
 * Hospitality CRM marketing touch — draft → scheduled → sent (Namibia marketing consent enforced in service layer)
 */
export const CRM_OUTREACH_TOUCH_TRANSITIONS: Record<string, string[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['sent', 'cancelled'],
  sent: [],
  cancelled: [],
};

export function normalizeWorkflowStatus(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}
