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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, fraudDetectionRules } from '@/lib/db';
import { and, asc, eq } from 'drizzle-orm';
import { withApiAuth } from '@/lib/utils/api-helpers';
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
      return NextResponse.json({ success: false, error: 'Tenant required' }, { status: 400 });
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

    return NextResponse.json({ success: true, data: rules });
  }, { rateLimit: true });
}

export async function PATCH(request: NextRequest) {
  return withApiAuth(request, async (req, user) => {
    const role = (user.role ?? '').toLowerCase();
    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!user.tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant required' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
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
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    }

    securityLogger.info('[FraudRules] updated', {
      ruleId: updated.id,
      tenantId: user.tenantId,
      userId: user.id,
      isActive: updated.isActive,
    });

    return NextResponse.json({ success: true, data: updated });
  }, { rateLimit: true });
}
