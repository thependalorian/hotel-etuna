/**
 * Partner commission report — aggregates by partner tenant and date range.
 * Location: app/api/reports/commission/route.ts
 *
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&partnerId=uuid (optional)
 * Response: { rows: [{ partnerId, partnerName, bookingCount, commissionTotal }], grandTotal }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse } from '@/lib/utils/api-helpers';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as z from 'zod';
import { entityId } from '@/lib/validation/entity-ids';

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  partnerId: entityId('Invalid partner ID').optional(),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const parsed = querySchema.safeParse({
        from: req.nextUrl.searchParams.get('from') ?? undefined,
        to: req.nextUrl.searchParams.get('to') ?? undefined,
        partnerId: req.nextUrl.searchParams.get('partnerId') ?? undefined,
      });

      if (!parsed.success) {
        return errorResponse('Invalid query', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }

      const { from, to, partnerId } = parsed.data;

      const result = await db.execute(sql`
        SELECT
          t.id AS partner_id,
          t.name AS partner_name,
          COUNT(b.id)::int AS booking_count,
          COALESCE(SUM(b.commission_amount), 0)::numeric AS commission_total
        FROM bookings b
        INNER JOIN tenants t ON t.id = b.tenant_id
        WHERE b.commission_amount IS NOT NULL
          AND b.commission_amount > 0
          ${from ? sql`AND b.check_in_date >= ${from}::date` : sql``}
          ${to ? sql`AND b.check_in_date <= ${to}::date` : sql``}
          ${partnerId ? sql`AND t.id = ${partnerId}` : sql``}
        GROUP BY t.id, t.name
        ORDER BY commission_total DESC
      `);

      const rows = result.rows.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          partnerId: String(r.partner_id),
          partnerName: String(r.partner_name),
          bookingCount: Number(r.booking_count ?? 0),
          commissionTotal: Number(r.commission_total ?? 0),
        };
      });

      const grandTotal = rows.reduce((sum, r) => sum + r.commissionTotal, 0);

      return NextResponse.json({ rows, grandTotal });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
