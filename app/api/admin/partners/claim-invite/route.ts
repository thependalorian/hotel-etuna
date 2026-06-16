/**
 * @fileoverview API route //api/admin/partners/claim-invite
 * Location: /app/api/admin/partners/claim-invite/route.ts
 */

/**
 * Partner Invite Claim API
 *
 * Purpose: Convert a valid invite token into partner tenant + property + partner admin account.
 * Location: /app/api/admin/partners/claim-invite/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db, partnerInvites, properties, tenants, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { rateLimitResponse } from '@/lib/utils/api-helpers';
import { checkRateLimit, shouldRateLimit } from '@/lib/utils/rate-limit';
import { securityLogger } from '@/lib/utils/security-logger';

const claimSchema = z.object({
  token: z.string().min(10),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    if (shouldRateLimit(req.nextUrl.pathname)) {
      const rateLimitResult = await checkRateLimit(req);
      if (!rateLimitResult.allowed) {
        return rateLimitResponse(rateLimitResult);
      }
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { token, firstName, lastName, password } = parsed.data;

    const [invite] = await db
      .select()
      .from(partnerInvites)
      .where(eq(partnerInvites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }
    if (invite.claimed) {
      return NextResponse.json({ error: 'Invite already claimed' }, { status: 409 });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite token expired' }, { status: 410 });
    }

    const metadata = (invite.metadata ?? {}) as { hubTenantId?: string; commissionPercent?: number };
    if (!metadata.hubTenantId) {
      return NextResponse.json({ error: 'Invite metadata missing hub tenant' }, { status: 400 });
    }

    const propertySlug = invite.propertyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.transaction(async (tx) => {
      const partnerSubdomain = `partner-${propertySlug}-${randomUUID().slice(0, 6)}`;

      const [partnerTenant] = await tx
        .insert(tenants)
        .values({
          name: invite.propertyName,
          type: 'partner',
          parentTenantId: metadata.hubTenantId,
          commissionPercent: String(metadata.commissionPercent ?? 10),
          subdomain: partnerSubdomain,
          status: 'active',
          subscriptionTier: 'starter',
          subscriptionStatus: 'active',
        })
        .returning();

      const [partnerUser] = await tx
        .insert(users)
        .values({
          tenantId: partnerTenant.id,
          email: invite.email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role: 'partner_admin',
          status: 'active',
          emailVerified: true,
        })
        .returning();

      const [partnerProperty] = await tx
        .insert(properties)
        .values({
          tenantId: partnerTenant.id,
          ownerId: partnerUser.id,
          name: invite.propertyName,
          slug: `${propertySlug}-${randomUUID().slice(0, 6)}`,
          type: 'hotel',
          city: 'Windhoek',
          country: 'Namibia',
          status: 'active',
        })
        .returning();

      const [updatedInvite] = await tx
        .update(partnerInvites)
        .set({
          claimed: true,
          claimedAt: new Date(),
          claimedByUserId: partnerUser.id,
        })
        .where(eq(partnerInvites.id, invite.id))
        .returning();

      return { partnerTenant, partnerUser, partnerProperty, updatedInvite };
    });

    return NextResponse.json({
      data: {
        tenantId: result.partnerTenant.id,
        userId: result.partnerUser.id,
        propertyId: result.partnerProperty.id,
        propertySlug: result.partnerProperty.slug,
      },
    });
  } catch (error) {
    securityLogger.error('Failed to claim partner invite:', error);
    return NextResponse.json({ error: 'Failed to claim invite' }, { status: 500 });
  }
}
