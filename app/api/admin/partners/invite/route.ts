/**
 * Partner Invite API
 *
 * Purpose: Hub admins invite referral partners.
 * Location: /app/api/admin/partners/invite/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db, partnerInvites, tenants } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { withApiAuth } from '@/lib/utils/api-helpers';

const inviteSchema = z.object({
  email: z.string().email(),
  propertyName: z.string().min(2),
  expiresInDays: z.number().int().min(1).max(30).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  return withApiAuth(
    req,
    async (request, user) => {
      if (!user.tenantId) {
        return NextResponse.json({ error: 'Missing tenant context' }, { status: 400 });
      }

      const [hubTenant] = await db
        .select({ id: tenants.id, type: tenants.type })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

      if (!hubTenant || hubTenant.type !== 'hub') {
        return NextResponse.json({ error: 'Only hub tenant can invite partners' }, { status: 403 });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }

      const parsed = inviteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }

      const { email, propertyName, expiresInDays = 7, commissionPercent = 10 } = parsed.data;
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      const [existing] = await db
        .select({ id: partnerInvites.id })
        .from(partnerInvites)
        .where(and(eq(partnerInvites.email, email), eq(partnerInvites.claimed, false)))
        .limit(1);

      if (existing) {
        return NextResponse.json({ error: 'An active invite already exists for this email' }, { status: 409 });
      }

      const [invite] = await db
        .insert(partnerInvites)
        .values({
          email,
          token,
          propertyName,
          expiresAt,
          createdByUserId: user.id,
          metadata: {
            hubTenantId: user.tenantId,
            commissionPercent,
          },
        })
        .returning();

      return NextResponse.json({
        data: {
          id: invite.id,
          email: invite.email,
          propertyName: invite.propertyName,
          token: invite.token,
          expiresAt: invite.expiresAt,
        },
      });
    },
    { requireRole: ['admin', 'owner', 'manager'], rateLimit: true }
  );
}
