/**
 * Email Logs API Endpoint
 * 
 * Purpose: Check email sending status and debug email delivery issues
 * Location: /app/api/admin/email-logs/route.ts
 * 
 * This endpoint allows checking email logs to see if emails were sent,
 * failed, or are pending. Useful for debugging email delivery issues.
 */

import { NextResponse, NextRequest } from 'next/server';
import { db, sofiaEmailLogs } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger.client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
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
      .where(email ? and(eq(sofiaEmailLogs.tenantId, user.tenantId), eq(sofiaEmailLogs.recipientEmail, email)) : eq(sofiaEmailLogs.tenantId, user.tenantId));
    const stats: Record<string, number> = {};
    for (const row of allForStats) {
      const s = row.status ?? 'pending';
      stats[s] = (stats[s] ?? 0) + 1;
    }

    return NextResponse.json({
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
    }, { status: 200 });
  } catch (error: unknown) {
    securityLogger.error('Error fetching email logs:', error);
    return NextResponse.json({
      message: 'Failed to fetch email logs',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    }, { status: 500 });
  }
}
