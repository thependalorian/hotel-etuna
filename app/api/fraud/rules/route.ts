/**
 * @fileoverview API route //api/fraud/rules
 * Location: /app/api/fraud/rules/route.ts
 */

/**
 * Tenant fraud detection rules API
 *
 * Purpose: List and toggle tenant-scoped fraud rules (CNP/EFT thresholds, geo mismatch, etc.).
 * Location: app/api/fraud/rules/route.ts
 *
 * GET  response: { success: true, data: FraudRule[] }
 * PATCH body: { ruleId: string, isActive?: boolean, priority?: number }
 * PATCH response: { success: true, data: FraudRule }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, fraudDetectionRules } from '@/lib/db';
import { and, asc, eq } from 'drizzle-orm';
import { errorResponse, successResponse, withApiAuth } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';

const patchSchema = z.object({
  ruleId: z.string().uuid(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
});

const ADMIN_ROLES = ['owner', 'manager', 'admin'];

export async function GET(request: NextRequest) {
  return withApiAuth(request, async (_req, user) => {
    if (!user.tenantId) {
      return errorResponse('Tenant required', 400, 'MISSING_TENANT');
    }

    const rules = await db
      .select({
        id: fraudDetectionRules.id,
        ruleName: fraudDetectionRules.ruleName,
        ruleType: fraudDetectionRules.ruleType,
        description: fraudDetectionRules.description,
        action: fraudDetectionRules.action,
        isActive: fraudDetectionRules.isActive,
        priority: fraudDetectionRules.priority,
        triggerCount: fraudDetectionRules.triggerCount,
        thresholdValue: fraudDetectionRules.thresholdValue,
        thresholdOperator: fraudDetectionRules.thresholdOperator,
        updatedAt: fraudDetectionRules.updatedAt,
      })
      .from(fraudDetectionRules)
      .where(eq(fraudDetectionRules.tenantId, user.tenantId))
      .orderBy(asc(fraudDetectionRules.priority), asc(fraudDetectionRules.ruleName));

    return successResponse(rules);
  }, { rateLimit: true });
}

export async function PATCH(request: NextRequest) {
  return withApiAuth(request, async (req, user) => {
    const role = (user.role ?? '').toLowerCase();
    if (!ADMIN_ROLES.includes(role)) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN');
    }
    if (!user.tenantId) {
      return errorResponse('Tenant required', 400, 'MISSING_TENANT');
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten());
    }

    const updates: Partial<{ isActive: boolean; priority: number; updatedAt: Date }> = {
      updatedAt: new Date(),
    };
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
    if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority;

    const [updated] = await db
      .update(fraudDetectionRules)
      .set(updates)
      .where(
        and(
          eq(fraudDetectionRules.id, parsed.data.ruleId),
          eq(fraudDetectionRules.tenantId, user.tenantId)
        )
      )
      .returning();

    if (!updated) {
      return errorResponse('Rule not found', 404, 'NOT_FOUND');
    }

    securityLogger.info('[FraudRules] updated', {
      ruleId: updated.id,
      tenantId: user.tenantId,
      userId: user.id,
      isActive: updated.isActive,
    });

    return successResponse(updated);
  }, { rateLimit: true });
}
