/**
 * @fileoverview API route //api/guest/loyalty
 * Location: /app/api/guest/loyalty/route.ts
 */

/**
 * Guest Loyalty API
 *
 * GUEST SELF-SERVICE portal (singular `guest`) — the authenticated guest views
 * their own loyalty balance. Distinct from the staff CRM at /api/guests (plural)
 * and /api/crm/guests.
 *
 * GET /api/guest/loyalty - Get guest's loyalty balance and transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyService } from '@/lib/services/loyalty/LoyaltyService';
import { db, guests } from '@/lib/db';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { and, eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

const loyaltyService = new LoyaltyService();

export async function GET(req: NextRequest) {
  return withTenantApiAuth(req, async (_request, context) => {
    try {
      // Find guest by email
      const guestResult = await db
        .select()
        .from(guests)
        .where(
          and(
            eq(guests.email, (context.email ?? '').toLowerCase()),
            eq(guests.tenantId, context.tenantId)
          )
        )
        .limit(1);

      if (!guestResult[0]) {
        return NextResponse.json(
          { error: 'Guest profile not found' },
          { status: 404 }
        );
      }

      const guest = guestResult[0];

      // Get balance and tier info
      const balance = await loyaltyService.getGuestBalance(guest.id, context.tenantId);

      // Get recent transactions
      const transactions = await loyaltyService.getGuestTransactions(guest.id, context.tenantId, 20);

      // Get redemptions
      const redemptions = await loyaltyService.getGuestRedemptions(guest.id, context.tenantId);

      return NextResponse.json({
        success: true,
        balance,
        transactions,
        redemptions,
        pointsValue: loyaltyService.calculatePointsValue(balance.points),
      });
    } catch (error: any) {
      securityLogger.error('Error fetching guest loyalty:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch loyalty information' },
        { status: error.status || 500 }
      );
    }
  });
}
