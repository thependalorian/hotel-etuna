/**
 * @fileoverview API route //api/admin/email-logs
 * Location: /app/api/admin/email-logs/route.ts
 */

/**
 * Email Logs API Endpoint
 *
 * Purpose: Check email sending status and debug email delivery issues
 * Location: /app/api/admin/email-logs/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { db, sofiaEmailLogs } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        if (!user.tenantId) {
          return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
        const statusFilter = searchParams.get('status');

        const conditions = [eq(sofiaEmailLogs.tenantId, user.tenantId)];
        if (email) conditions.push(eq(sofiaEmailLogs.recipientEmail, email));
        if (statusFilter) conditions.push(eq(sofiaEmailLogs.status, statusFilter));

        const emailLogs = await db
          .select({
            id: sofiaEmailLogs.id,
            recipientEmail: sofiaEmailLogs.recipientEmail,
            recipientName: sofiaEmailLogs.recipientName,
            subject: sofiaEmailLogs.subject,
            status: sofiaEmailLogs.status,
            sentAt: sofiaEmailLogs.sentAt,
            errorMessage: sofiaEmailLogs.errorMessage,
            createdAt: sofiaEmailLogs.createdAt,
            metadata: sofiaEmailLogs.metadata,
          })
          .from(sofiaEmailLogs)
          .where(and(...conditions))
          .orderBy(desc(sofiaEmailLogs.createdAt))
          .limit(limit);

        const allForStats = await db
          .select({ status: sofiaEmailLogs.status })
          .from(sofiaEmailLogs)
          .where(
            email
              ? and(eq(sofiaEmailLogs.tenantId, user.tenantId), eq(sofiaEmailLogs.recipientEmail, email))
              : eq(sofiaEmailLogs.tenantId, user.tenantId)
          );

        const stats: Record<string, number> = {};
        for (const row of allForStats) {
          const s = row.status ?? 'pending';
          stats[s] = (stats[s] ?? 0) + 1;
        }

        return successResponse({
          logs: emailLogs.map((l) => ({
            id: l.id,
            recipient_email: l.recipientEmail,
            recipient_name: l.recipientName,
            subject: l.subject,
            status: l.status,
            sent_at: l.sentAt,
            error_message: l.errorMessage,
            created_at: l.createdAt,
            metadata: l.metadata,
          })),
          stats,
          total: emailLogs.length,
        });
      } catch (error: unknown) {
        securityLogger.error('Error fetching email logs:', error);
        return errorResponse('Failed to fetch email logs', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true, requireRole: ['admin', 'owner', 'manager'] }
  );
}
