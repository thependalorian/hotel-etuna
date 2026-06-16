/**
 * Platform Admin - Audit Logs API
 *
 * Purpose: List audit trail entries for platform admin (Drizzle)
 * Location: app/api/admin/platform/audit/route.ts
 *
 * Response: { logs: Array<{ id, tenantId, userId, action, resourceType, resourceId, timestamp, ... }> }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auditTrail, tenants, users } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { entityIdNullableOptional } from '@/lib/validation/entity-ids';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const postBodySchema = z.object({
  action: z.string().min(1).max(100),
  resourceType: z.string().min(1).max(50),
  resourceId: entityIdNullableOptional(),
  oldValues: z.any().nullable().optional(),
  newValues: z.any().nullable().optional(),
});

/** Super-admins only — append platform-level audit row (no service role in browser). */
export async function POST(request: NextRequest) {
  return withPlatformAdminAuth(
    request,
    async (req, user) => {
  try {
    const json: unknown = await req!.json().catch(() => null);
    const parsed = postBodySchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse('Invalid body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
    }

    await recordAuditTrail({
      tenantId: null,
      userId: user.id,
      action: parsed.data.action,
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId ?? null,
      oldValues: parsed.data.oldValues ?? null,
      newValues: parsed.data.newValues ?? null,
      request: req!,
    });

    return successResponse({ recorded: true });
  } catch (err) {
    securityLogger.error('[Platform Admin Audit POST]', err);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
    },
    { superAdmin: true }
  );
}

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
  try {
    const { searchParams } = new URL(req!.url);
    const limitRaw = parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isNaN(limitRaw) || limitRaw < 1
      ? DEFAULT_LIMIT
      : Math.min(limitRaw, MAX_LIMIT);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10) || 0;
    const resourceType = searchParams.get('resourceType');
    const action = searchParams.get('action');

    const conditions = [];
    if (resourceType && resourceType !== 'all') {
      conditions.push(eq(auditTrail.resourceType, resourceType));
    }
    if (action && action !== 'all') {
      conditions.push(eq(auditTrail.action, action));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        log: auditTrail,
        tenantName: tenants.name,
        userEmail: users.email,
      })
      .from(auditTrail)
      .leftJoin(tenants, eq(auditTrail.tenantId, tenants.id))
      .leftJoin(users, eq(auditTrail.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditTrail.timestamp))
      .limit(limit)
      .offset(offset);

    return successResponse({
      logs: rows.map(({ log, tenantName, userEmail }) => ({
        id: log.id,
        tenantId: log.tenantId,
        tenantName: tenantName ?? null,
        userId: log.userId,
        userEmail: userEmail ?? null,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
      })),
    });
  } catch (err) {
    securityLogger.error('[Platform Admin Audit]', err);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
  });
}
