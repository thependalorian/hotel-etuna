/**
 * @fileoverview SupportTicketService — platform support tickets and replies.
 *
 * CRUD + status workflow (domainTransitions) for `support_tickets` and
 * `support_ticket_replies`, used by tenant and platform-admin support UIs.
 * Location: lib/services/platform/SupportTicketService.ts
 */
import { db, supportTickets, supportTicketReplies, users, tenants } from '@/lib/db';
import { and, desc, eq } from 'drizzle-orm';
import { handleServiceError } from '@/lib/utils/errors';
import { invokeLifecycleTransition } from '@/lib/workflows/genericLifecycleGraph';
import {
  normalizeWorkflowStatus,
  SUPPORT_TICKET_STATUS_TRANSITIONS,
} from '@/lib/workflows/domainTransitions';

const ALLOWED_STATUS = ['open', 'in_progress', 'pending', 'resolved', 'closed'] as const;
export type SupportTicketStatus = (typeof ALLOWED_STATUS)[number];

export interface SupportTicketListItem {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  user_id: string;
  user_email: string | null;
  tenant_id: string;
  tenant_name: string | null;
  assigned_to: string | null;
  linear_issue_id: string | null;
  linear_issue_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface CreateSupportTicketInput {
  tenantId: string;
  userId: string;
  subject: string;
  description: string;
  priority?: string;
  category?: string;
}

function rowToListItem(
  ticket: typeof supportTickets.$inferSelect,
  userEmail: string | null,
  tenantName: string | null
): SupportTicketListItem {
  return {
    id: ticket.id,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    user_id: ticket.userId,
    user_email: userEmail,
    tenant_id: ticket.tenantId,
    tenant_name: tenantName,
    assigned_to: ticket.assignedTo,
    linear_issue_id: ticket.linearIssueId ?? null,
    linear_issue_url: ticket.linearIssueUrl ?? null,
    created_at: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : '',
    updated_at: ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : '',
    resolved_at: ticket.resolvedAt ? new Date(ticket.resolvedAt).toISOString() : null,
  };
}

export class SupportTicketService {
  async createTicket(input: CreateSupportTicketInput): Promise<SupportTicketListItem> {
    try {
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          tenantId: input.tenantId,
          userId: input.userId,
          subject: input.subject.trim(),
          description: input.description.trim(),
          priority: input.priority ?? 'medium',
          category: input.category ?? 'general',
          status: 'open',
        })
        .returning();

      const created = await this.getTicketWithMeta(ticket.id);
      return created ?? rowToListItem(ticket, null, null);
    } catch (error) {
      throw handleServiceError(error, 'Error creating support ticket');
    }
  }

  async listTicketsForUser(tenantId: string, userId: string): Promise<SupportTicketListItem[]> {
    try {
      const rows = await db
        .select({
          ticket: supportTickets,
          userEmail: users.email,
          tenantName: tenants.name,
        })
        .from(supportTickets)
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .innerJoin(tenants, eq(supportTickets.tenantId, tenants.id))
        .where(and(eq(supportTickets.tenantId, tenantId), eq(supportTickets.userId, userId)))
        .orderBy(desc(supportTickets.createdAt));

      return rows.map((r) => rowToListItem(r.ticket, r.userEmail, r.tenantName));
    } catch (error) {
      throw handleServiceError(error, 'Error listing user support tickets');
    }
  }

  /** Tenant + status for audit / auth checks */
  async getTicketMeta(ticketId: string): Promise<{ tenantId: string; status: string } | null> {
    const [row] = await db
      .select({
        tenantId: supportTickets.tenantId,
        status: supportTickets.status,
      })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);
    if (!row) return null;
    return { tenantId: row.tenantId, status: row.status };
  }

  async getTicketStatus(ticketId: string): Promise<string | null> {
    const [row] = await db
      .select({ status: supportTickets.status })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);
    return row?.status ?? null;
  }

  async listTickets(filters: { status?: string; priority?: string }): Promise<SupportTicketListItem[]> {
    try {
      const conds = [];
      if (filters.status && filters.status !== 'all') {
        conds.push(eq(supportTickets.status, filters.status));
      }
      if (filters.priority && filters.priority !== 'all') {
        conds.push(eq(supportTickets.priority, filters.priority));
      }
      const whereClause = conds.length ? and(...conds) : undefined;

      const rows = await db
        .select({
          ticket: supportTickets,
          userEmail: users.email,
          tenantName: tenants.name,
        })
        .from(supportTickets)
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .innerJoin(tenants, eq(supportTickets.tenantId, tenants.id))
        .where(whereClause)
        .orderBy(desc(supportTickets.createdAt));

      return rows.map((r) => rowToListItem(r.ticket, r.userEmail, r.tenantName));
    } catch (error) {
      throw handleServiceError(error, 'Error listing support tickets');
    }
  }

  async updateStatus(ticketId: string, status: string): Promise<SupportTicketListItem | null> {
    if (!ALLOWED_STATUS.includes(status as SupportTicketStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }
    try {
      const [existing] = await db
        .select({ status: supportTickets.status })
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId))
        .limit(1);
      if (!existing) return null;

      const cur = normalizeWorkflowStatus(existing.status);
      const tgt = normalizeWorkflowStatus(status);
      const transition =
        cur === tgt
          ? { errorMessage: undefined as string | undefined, resolvedStatus: tgt }
          : await invokeLifecycleTransition(
              'support_ticket',
              SUPPORT_TICKET_STATUS_TRANSITIONS,
              existing.status,
              status
            );

      if (transition.errorMessage || !transition.resolvedStatus) {
        throw new Error(transition.errorMessage || 'Invalid status transition');
      }

      const next = transition.resolvedStatus;
      const markResolved = next === 'resolved' || next === 'closed';

      const [updated] = await db
        .update(supportTickets)
        .set({
          status: next,
          resolvedAt: markResolved ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, ticketId))
        .returning();

      if (!updated) return null;

      const [join] = await db
        .select({
          ticket: supportTickets,
          userEmail: users.email,
          tenantName: tenants.name,
        })
        .from(supportTickets)
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .innerJoin(tenants, eq(supportTickets.tenantId, tenants.id))
        .where(eq(supportTickets.id, ticketId))
        .limit(1);

      if (!join) return rowToListItem(updated, null, null);
      return rowToListItem(join.ticket, join.userEmail, join.tenantName);
    } catch (error) {
      throw handleServiceError(error, 'Error updating support ticket');
    }
  }

  async addAdminReply(ticketId: string, adminUserId: string, message: string): Promise<void> {
    try {
      await db.insert(supportTicketReplies).values({
        ticketId,
        userId: adminUserId,
        message: message.trim(),
        isAdminReply: true,
      });
      await db
        .update(supportTickets)
        .set({ updatedAt: new Date() })
        .where(eq(supportTickets.id, ticketId));
    } catch (error) {
      throw handleServiceError(error, 'Error adding support reply');
    }
  }

  async getTicketWithMeta(ticketId: string): Promise<SupportTicketListItem | null> {
    const [join] = await db
      .select({
        ticket: supportTickets,
        userEmail: users.email,
        tenantName: tenants.name,
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .innerJoin(tenants, eq(supportTickets.tenantId, tenants.id))
      .where(eq(supportTickets.id, ticketId))
      .limit(1);
    if (!join) return null;
    return rowToListItem(join.ticket, join.userEmail, join.tenantName);
  }

  async attachLinearIssue(
    ticketId: string,
    linearIssueId: string,
    linearIssueUrl: string
  ): Promise<void> {
    await db
      .update(supportTickets)
      .set({
        linearIssueId,
        linearIssueUrl,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));
  }
}
